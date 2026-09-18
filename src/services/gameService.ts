import type { Archive } from '../domain/archive';
import type { Game } from '../domain/game';
import { getArchives, getArchiveById, saveArchive } from '../repositories/storageRepository';
import type { ScoreAction } from '../domain/scoreAction';

export type GameLookup = { archive: Archive; game: Game };
const gameQueues = new Map<string, Promise<unknown>>();

function remainingAt(game: Game, now: number): number {
  if (game.status !== 'running' || !game.startedAt) return Math.max(0, game.remainingTime);
  const elapsed = Math.floor(Math.max(0, now - Date.parse(game.startedAt)) / 1000);
  return Math.max(0, game.remainingTime - elapsed);
}

export async function reconcileArchive(archive: Archive): Promise<Archive> {
  const now = Date.now();
  let changed = false;
  const games = archive.games.map(game => {
    if (game.status !== 'running' || remainingAt(game, now) > 0) return game;
    changed = true;
    return { ...game, remainingTime: 0, status: 'finished' as const, startedAt: null, finishedAt: game.finishedAt ?? new Date(now).toISOString() };
  });
  if (!changed) return archive;
  const updated = { ...archive, games, updatedAt: new Date(now).toISOString() };
  await saveArchive(updated);
  return updated;
}

export async function createGame(archiveId: string, teamAId: string, teamBId: string, duration: number): Promise<Game> {
  const stored = await getArchiveById(archiveId);
  const archive = stored ? await reconcileArchive(stored) : undefined;
  if (!archive) throw new Error('未找到比赛存档');
  if (archive.teams.length < 2) throw new Error('该存档至少需要两支队伍');
  if (archive.games.some(game => game.status === 'ready' || game.status === 'running' || game.status === 'paused')) throw new Error('当前还有一场未完成比赛');
  if (!archive.teams.some(team => team.id === teamAId) || !archive.teams.some(team => team.id === teamBId)) throw new Error('请选择当前存档中的队伍');
  if (teamAId === teamBId) throw new Error('比赛双方必须是不同队伍');
  if (!Number.isInteger(duration) || duration < 60 || duration > 3600) throw new Error('比赛时间必须是 1–60 分钟');
  const game: Game = { id: crypto.randomUUID(), teamAId, teamBId, scoreA: 0, scoreB: 0, duration, remainingTime: duration, status: 'ready', startedAt: null, finishedAt: null, actions: [] };
  const updatedArchive: Archive = { ...archive, games: [...archive.games, game], updatedAt: new Date().toISOString() };
  await saveArchive(updatedArchive);
  return game;
}

export async function getGameById(gameId: string): Promise<GameLookup | undefined> {
  const archives = await Promise.all((await getArchives()).map(reconcileArchive));
  for (const archive of archives) {
    const game = archive.games.find(item => item.id === gameId);
    if (game) return { archive, game };
  }
  return undefined;
}

function queueGameOperation<T>(gameId: string, operation: () => Promise<T>): Promise<T> {
  const previous = gameQueues.get(gameId) ?? Promise.resolve();
  const current = previous.then(operation, operation);
  gameQueues.set(gameId, current);
  return current.finally(() => { if (gameQueues.get(gameId) === current) gameQueues.delete(gameId); });
}

export function addScore(gameId: string, teamId: string, points: ScoreAction['points']): Promise<GameLookup> {
  return queueGameOperation(gameId, async () => {
    const lookup = await getGameById(gameId);
    if (!lookup) throw new Error('未找到比赛');
    const { archive, game } = lookup;
    if (game.status === 'finished') throw new Error('比赛已经结束，不能修改比分');
    if (teamId !== game.teamAId && teamId !== game.teamBId) throw new Error('队伍不属于这场比赛');
    if (points !== 1 && points !== 2 && points !== 3) throw new Error('分值必须是 1、2 或 3');
    const action: ScoreAction = { id: crypto.randomUUID(), teamId, points, createdAt: new Date().toISOString() };
    const updatedGame: Game = { ...game, scoreA: teamId === game.teamAId ? game.scoreA + points : game.scoreA, scoreB: teamId === game.teamBId ? game.scoreB + points : game.scoreB, actions: [...game.actions, action] };
    const updatedArchive: Archive = { ...archive, games: archive.games.map(item => item.id === game.id ? updatedGame : item), updatedAt: new Date().toISOString() };
    await saveArchive(updatedArchive);
    return { archive: updatedArchive, game: updatedGame };
  });
}

export function undoLastScore(gameId: string): Promise<GameLookup> {
  return queueGameOperation(gameId, async () => {
    const lookup = await getGameById(gameId);
    if (!lookup) throw new Error('未找到比赛');
    const { archive, game } = lookup;
    if (game.status === 'finished') throw new Error('比赛已经结束，不能撤销比分');
    const lastAction = game.actions.at(-1);
    if (!lastAction) return lookup;
    const updatedGame: Game = { ...game, scoreA: lastAction.teamId === game.teamAId ? Math.max(0, game.scoreA - lastAction.points) : game.scoreA, scoreB: lastAction.teamId === game.teamBId ? Math.max(0, game.scoreB - lastAction.points) : game.scoreB, actions: game.actions.slice(0, -1) };
    const updatedArchive: Archive = { ...archive, games: archive.games.map(item => item.id === game.id ? updatedGame : item), updatedAt: new Date().toISOString() };
    await saveArchive(updatedArchive);
    return { archive: updatedArchive, game: updatedGame };
  });
}

export function startGame(gameId: string): Promise<GameLookup> {
  return queueGameOperation(gameId, async () => {
    const lookup = await getGameById(gameId);
    if (!lookup) throw new Error('未找到比赛');
    if (lookup.game.status !== 'ready') return lookup;
    const updatedGame: Game = { ...lookup.game, status: 'running', startedAt: new Date().toISOString(), finishedAt: null };
    const updatedArchive: Archive = { ...lookup.archive, games: lookup.archive.games.map(item => item.id === gameId ? updatedGame : item), updatedAt: new Date().toISOString() };
    await saveArchive(updatedArchive);
    return { archive: updatedArchive, game: updatedGame };
  });
}

export function pauseGame(gameId: string): Promise<GameLookup> {
  return queueGameOperation(gameId, async () => {
    const lookup = await getGameById(gameId);
    if (!lookup) throw new Error('未找到比赛');
    if (lookup.game.status === 'finished') throw new Error('比赛已经结束，不能暂停');
    if (lookup.game.status !== 'running') return lookup;
    const updatedGame: Game = { ...lookup.game, remainingTime: remainingAt(lookup.game, Date.now()), status: 'paused', startedAt: null };
    const updatedArchive: Archive = { ...lookup.archive, games: lookup.archive.games.map(item => item.id === gameId ? updatedGame : item), updatedAt: new Date().toISOString() };
    await saveArchive(updatedArchive);
    return { archive: updatedArchive, game: updatedGame };
  });
}

export function resumeGame(gameId: string): Promise<GameLookup> {
  return queueGameOperation(gameId, async () => {
    const lookup = await getGameById(gameId);
    if (!lookup) throw new Error('未找到比赛');
    if (lookup.game.status === 'finished') throw new Error('比赛已经结束，不能继续');
    if (lookup.game.status !== 'paused' || lookup.game.remainingTime <= 0) return lookup;
    const updatedGame: Game = { ...lookup.game, status: 'running', startedAt: new Date().toISOString() };
    const updatedArchive: Archive = { ...lookup.archive, games: lookup.archive.games.map(item => item.id === gameId ? updatedGame : item), updatedAt: new Date().toISOString() };
    await saveArchive(updatedArchive);
    return { archive: updatedArchive, game: updatedGame };
  });
}

export function finishGame(gameId: string): Promise<GameLookup> {
  return queueGameOperation(gameId, async () => {
    const lookup = await getGameById(gameId);
    if (!lookup) throw new Error('未找到比赛');
    if (lookup.game.status === 'finished') return lookup;
    if (lookup.game.status === 'ready') throw new Error('比赛尚未开始，不能结束');
    const updatedGame: Game = { ...lookup.game, remainingTime: lookup.game.status === 'running' ? remainingAt(lookup.game, Date.now()) : lookup.game.remainingTime, status: 'finished', startedAt: null, finishedAt: new Date().toISOString() };
    const updatedArchive: Archive = { ...lookup.archive, games: lookup.archive.games.map(item => item.id === gameId ? updatedGame : item), updatedAt: new Date().toISOString() };
    await saveArchive(updatedArchive);
    return { archive: updatedArchive, game: updatedGame };
  });
}

export function deleteGame(gameId: string): Promise<GameLookup> {
  return queueGameOperation(gameId, async () => {
    const lookup = await getGameById(gameId);
    if (!lookup) throw new Error('未找到比赛');
    if (lookup.game.status !== 'finished') throw new Error('只能删除已完成的比赛记录');
    const updatedArchive: Archive = { ...lookup.archive, games: lookup.archive.games.filter(game => game.id !== gameId), updatedAt: new Date().toISOString() };
    await saveArchive(updatedArchive);
    return { archive: updatedArchive, game: lookup.game };
  });
}
