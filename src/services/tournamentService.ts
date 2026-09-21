import type { Archive } from '../domain/archive';
import type { Game } from '../domain/game';
import type { Tournament, TournamentMatch, TournamentRound } from '../domain/tournament';
import { getArchives, getArchiveById, saveArchive } from '../repositories/storageRepository';
import { reconcileArchive } from './gameService';

export type TournamentLookup = { archive: Archive; tournament: Tournament };
export type FirstRoundPair = [string, string | null];
const DEFAULT_DURATION = 600;

const newGame = (teamAId: string, teamBId: string): Game => ({ id: crypto.randomUUID(), teamAId, teamBId, scoreA: 0, scoreB: 0, duration: DEFAULT_DURATION, remainingTime: DEFAULT_DURATION, status: 'ready', startedAt: null, finishedAt: null, actions: [], resultSource: 'live' });
const gameFor = (archive: Archive, match: TournamentMatch) => match.gameId ? archive.games.find(game => game.id === match.gameId) : undefined;
const isFinished = (game: Game | undefined): game is Game => Boolean(game?.status === 'finished');
const winner = (game: Game): string => game.scoreA > game.scoreB ? game.teamAId : game.teamBId;
const loser = (game: Game): string => game.scoreA > game.scoreB ? game.teamBId : game.teamAId;
const matchStatus = (game: Game | undefined): TournamentMatch['status'] => game?.status ?? 'pending';

export async function getTournament(archiveId: string): Promise<TournamentLookup | undefined> { return reconcileTournament(archiveId); }

export async function createTournament(archiveId: string, pairs: FirstRoundPair[]): Promise<TournamentLookup> {
  const stored = await getArchiveById(archiveId);
  if (!stored) throw new Error('未找到存档');
  if (stored.tournament) throw new Error('该存档已经有多队比赛');
  const ids = pairs.flatMap(pair => pair).filter((id): id is string => Boolean(id));
  if (ids.length < 4) throw new Error('至少需要选择 4 支队伍');
  if (ids.length > 16) throw new Error('最多支持 16 支队伍');
  if (new Set(ids).size !== ids.length || ids.some(id => !stored.teams.some(team => team.id === id))) throw new Error('参赛队伍必须来自当前存档且不能重复');
  const size = nextPowerOfTwo(ids.length);
  const rounds = buildRounds(size, pairs, ids);
  const now = new Date().toISOString();
  const tournament: Tournament = { id: crypto.randomUUID(), archiveId, format: 'single_elimination', status: 'in_progress', participantTeamIds: ids, rounds, thirdPlaceMatchId: null, ranking: { championTeamId: null, runnerUpTeamId: null, thirdPlaceTeamId: null, fourthPlaceTeamId: null }, createdAt: now, updatedAt: now };
  const resolved = await resolveTournament({ ...stored, tournament }, tournament);
  await saveArchive(resolved.archive);
  return resolved;
}

function nextPowerOfTwo(value: number): number { let result = 1; while (result < value) result *= 2; return result; }
function roundName(roundNumber: number, total: number): string { if (roundNumber === total) return '决赛'; if (roundNumber === total - 1) return '半决赛'; if (total === 3 && roundNumber === 1) return '四分之一决赛'; return `第${roundNumber}轮`; }

function buildRounds(size: number, pairs: FirstRoundPair[], ids: string[]): TournamentRound[] {
  const count = Math.log2(size); const rounds: TournamentRound[] = [];
  for (let round = 1; round <= count; round += 1) {
    const matchCount = size / (2 ** round); const matches: TournamentMatch[] = [];
    for (let position = 0; position < matchCount; position += 1) {
      const first = round === 1 ? (pairs[position]?.[0] ?? ids[position * 2] ?? null) : null;
      const second = round === 1 ? (pairs[position]?.[1] ?? ids[position * 2 + 1] ?? null) : null;
      matches.push({ id: crypto.randomUUID(), gameId: null, roundNumber: round, position, teamAId: first, teamBId: second, nextMatchId: null, loserTargetMatchId: null, status: first && second ? 'ready' : first || second ? 'bye' : 'pending' });
    }
    rounds.push({ id: crypto.randomUUID(), roundNumber: round, name: roundName(round, count), matches });
  }
  for (let round = 0; round < rounds.length - 1; round += 1) for (const match of rounds[round].matches) match.nextMatchId = rounds[round + 1].matches[Math.floor(match.position / 2)]?.id ?? null;
  return rounds;
}

export async function reconcileTournament(archiveId: string): Promise<TournamentLookup | undefined> {
  const stored = await getArchiveById(archiveId); if (!stored?.tournament) return undefined;
  const originalTournament = JSON.stringify(stored.tournament);
  let archive = await reconcileArchive(stored); let tournament = JSON.parse(JSON.stringify(archive.tournament)) as Tournament; if (!tournament) return undefined;
  const resolved = await resolveTournament(archive, tournament);
  archive = resolved.archive; tournament = resolved.tournament;
  if (originalTournament !== JSON.stringify(tournament) || archive.games.length !== stored.games.length) await saveArchive(archive);
  return { archive, tournament };
}

async function resolveTournament(initial: Archive, initialTournament: Tournament): Promise<TournamentLookup> {
  let archive = initial; let tournament = initialTournament;
  for (let pass = 0; pass < tournament.rounds.length + 2; pass += 1) {
    let changed = false;
    for (const round of tournament.rounds) for (const match of round.matches) {
      const game = gameFor(archive, match);
      if (game) { const status = matchStatus(game); if (match.status !== status) { match.status = status; changed = true; } if (isFinished(game)) changed = propagateWinner(tournament, match, game, changed); continue; }
      if (match.status === 'bye' && (match.teamAId || match.teamBId)) { changed = propagateTeam(tournament, match.nextMatchId, match.teamAId ?? match.teamBId ?? null, changed); continue; }
      if (match.teamAId && match.teamBId && match.status === 'ready') { const created = newGame(match.teamAId, match.teamBId); archive = { ...archive, games: [...archive.games, created] }; match.gameId = created.id; changed = true; }
    }
    if (!changed) break;
  }
  const penultimate = tournament.rounds.length > 1 ? tournament.rounds[tournament.rounds.length - 2] : undefined;
  if (!tournament.thirdPlaceMatchId && penultimate?.matches.length === 2 && penultimate.matches.every(match => isFinished(gameFor(archive, match)))) {
    const first = gameFor(archive, penultimate.matches[0]); const second = gameFor(archive, penultimate.matches[1]);
    if (first && second) { const third = newGame(loser(first), loser(second)); const match: TournamentMatch = { id: crypto.randomUUID(), gameId: third.id, roundNumber: penultimate.roundNumber, position: 2, teamAId: third.teamAId, teamBId: third.teamBId, nextMatchId: null, loserTargetMatchId: null, status: 'ready' }; archive = { ...archive, games: [...archive.games, third] }; tournament = { ...tournament, thirdPlaceMatchId: match.id, updatedAt: new Date().toISOString() }; penultimate.matches[0].loserTargetMatchId = match.id; penultimate.matches[1].loserTargetMatchId = match.id; tournament.rounds = tournament.rounds.map(round => round.id === penultimate.id ? { ...round, matches: [...round.matches, match] } : round); }
  }
  const finalMatch = tournament.rounds[tournament.rounds.length - 1]?.matches[0]; const finalGame = finalMatch ? gameFor(archive, finalMatch) : undefined; const thirdGame = tournament.thirdPlaceMatchId ? gameFor(archive, tournament.rounds.flatMap(round => round.matches).find(match => match.id === tournament.thirdPlaceMatchId) ?? { gameId: null } as TournamentMatch) : undefined;
  if (isFinished(finalGame)) { const ranking = { ...tournament.ranking, championTeamId: winner(finalGame), runnerUpTeamId: loser(finalGame) }; if (isFinished(thirdGame)) { ranking.thirdPlaceTeamId = winner(thirdGame); if (tournament.participantTeamIds.length === 4) ranking.fourthPlaceTeamId = loser(thirdGame); } tournament = { ...tournament, ranking, status: isFinished(thirdGame) || !tournament.thirdPlaceMatchId ? 'finished' : 'in_progress', updatedAt: new Date().toISOString() }; }
  return { archive: { ...archive, tournament, updatedAt: tournament.updatedAt }, tournament };
}

function propagateWinner(tournament: Tournament, match: TournamentMatch, game: Game, changed: boolean): boolean { const winnerChanged = propagateTeam(tournament, match.nextMatchId, winner(game), changed); return propagateTeam(tournament, match.loserTargetMatchId, loser(game), winnerChanged); }
function propagateTeam(tournament: Tournament, targetId: string | null, teamId: string | null, changed: boolean): boolean { if (!targetId || !teamId) return changed; for (const round of tournament.rounds) { const target: TournamentMatch | undefined = round.matches.find(match => match.id === targetId); if (target) { if (target.teamAId !== teamId && target.teamBId !== teamId) { if (target.teamAId) target.teamBId = teamId; else target.teamAId = teamId; target.status = target.teamAId && target.teamBId ? 'ready' : 'bye'; return true; } } } return changed; }

export async function recordManualResult(gameId: string, scoreA: number, scoreB: number): Promise<TournamentLookup> {
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0 || scoreA > 999 || scoreB > 999 || scoreA === scoreB) throw new Error('请输入 0–999 的不同整数比分');
  const archive = (await getArchives()).find(item => item.games.some(game => game.id === gameId)); if (!archive?.tournament) throw new Error('未找到淘汰赛');
  const game = archive.games.find(item => item.id === gameId); if (!game) throw new Error('未找到比赛');
  const sourceMatch = archive.tournament.rounds.flatMap(round => round.matches).find(match => match.gameId === gameId);
  if (sourceMatch && sourceMatch.roundNumber < archive.tournament.rounds.length && archive.tournament.rounds.slice(sourceMatch.roundNumber).some(round => round.matches.some(match => { const downstream = match.gameId ? archive.games.find(item => item.id === match.gameId) : undefined; return Boolean(downstream && (downstream.status !== 'ready' || downstream.scoreA !== 0 || downstream.scoreB !== 0)); }))) throw new Error('后续比赛已经开始，无法修改上游结果');
  const now = new Date().toISOString(); const updated: Game = { ...game, scoreA, scoreB, status: 'finished', remainingTime: 0, startedAt: null, finishedAt: game.finishedAt ?? now, actions: [], resultSource: 'manual' };
  await saveArchive({ ...archive, games: archive.games.map(item => item.id === gameId ? updated : item), updatedAt: now });
  const result = await reconcileTournament(archive.id); if (!result) throw new Error('淘汰赛状态更新失败'); return result;
}
