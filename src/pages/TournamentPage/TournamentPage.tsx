import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Page } from '../../components/Page';
import { ManualResultDialog } from '../../components/ManualResultDialog';
import type { Archive } from '../../domain/archive';
import type { Game } from '../../domain/game';
import type { Tournament, TournamentMatch } from '../../domain/tournament';
import { getTournament, reconcileTournament, recordManualResult, type TournamentLookup } from '../../services/tournamentService';

export function TournamentPage() {
  const { archiveId } = useParams(); const [lookup, setLookup] = useState<TournamentLookup | null>(); const [manualGame, setManualGame] = useState<Game | null>(null); const [error, setError] = useState('');
  useEffect(() => { if (archiveId) void getTournament(archiveId).then(found => setLookup(found ?? null)); }, [archiveId]);
  if (lookup === undefined) return <Page title="加载中…" />;
  if (!lookup) return <Page title="未找到多队比赛"><Link className="button" to={archiveId ? `/archive/${archiveId}` : '/'}>返回</Link></Page>;
  const { archive, tournament } = lookup;
  const saveManual = async (scoreA: number, scoreB: number) => { try { if (!manualGame) return; setLookup(await recordManualResult(manualGame.id, scoreA, scoreB)); setManualGame(null); setError(''); } catch (reason) { setError(reason instanceof Error ? reason.message : '保存结果失败'); } };
  return <Page title="多队比赛"><Link className="back-link" to={`/archive/${archive.id}`}>← 返回存档</Link><div className="tournament-header"><div><p className="lede">单淘汰赛 · {tournament.participantTeamIds.length} 支队伍</p><p className="muted">{tournament.status === 'finished' ? '已结束' : '进行中'}</p></div>{tournament.status === 'finished' && <span className="finished-pill">已结束</span>}</div><main className="tournament-layout">{tournament.rounds.map(round => <section className="tournament-stage" key={round.id}><p className="eyebrow">ROUND {round.roundNumber}</p><h2 className="round-title">{round.name}</h2><div className="bracket-grid">{round.matches.map(match => <TournamentMatchCard key={match.id} archive={archive} match={match} onManual={setManualGame} />)}</div></section>)}<Standings archive={archive} tournament={tournament}/></main>{error && <p className="error-message" role="alert">{error}</p>}{manualGame && <ManualResultDialog archive={archive} game={manualGame} onCancel={() => setManualGame(null)} onSave={(a, b) => void saveManual(a, b)} />}<button className="visually-hidden" type="button" onClick={() => void reconcileTournament(archive.id).then(next => next && setLookup(next))}>刷新赛程</button></Page>;
}

function teamName(archive: Archive, id: string | null): string { return id ? archive.teams.find(team => team.id === id)?.name ?? '未知队伍' : '待定'; }
function gameFor(archive: Archive, match: TournamentMatch): Game | undefined { return match.gameId ? archive.games.find(game => game.id === match.gameId) : undefined; }

function TournamentMatchCard({ archive, match, onManual }: { archive: Archive; match: TournamentMatch; onManual: (game: Game) => void }) {
  const game = gameFor(archive, match); const done = game?.status === 'finished'; const running = game?.status === 'running' || game?.status === 'paused'; const winnerId = done && game ? (game.scoreA > game.scoreB ? game.teamAId : game.teamBId) : null;
  if (match.status === 'bye') return <article className="tournament-game-card bye-card"><div className="tournament-card-heading"><span>轮空</span><strong>自动晋级</strong></div><div className="bye-team">{teamName(archive, match.teamAId ?? match.teamBId)}</div><p className="muted">轮空晋级</p></article>;
  return <article className="tournament-game-card"><div className="tournament-card-heading"><span>第 {match.position + 1} 场</span><strong>{done ? '已结束' : running ? '进行中' : match.status === 'ready' ? '待比赛' : '待定'}</strong></div><div className="bracket-team"><b>{teamName(archive, match.teamAId)}</b><span>{game?.scoreA ?? '—'}</span>{winnerId === match.teamAId && <em>晋级</em>}</div><div className="bracket-team"><b>{teamName(archive, match.teamBId)}</b><span>{game?.scoreB ?? '—'}</span>{winnerId === match.teamBId && <em>晋级</em>}</div>{game && !done && <div className="game-entry-actions"><Link className="button button-outline" to={`/game/${game.id}`}>现场计分</Link><button className="button button-outline" type="button" onClick={() => onManual(game)}>录入结果</button></div>}{game && done && game.resultSource === 'manual' && <button className="text-action" type="button" onClick={() => onManual(game)}>编辑结果</button>}</article>;
}

function Standings({ archive, tournament }: { archive: Archive; tournament: Tournament }) { const rows = [[1, tournament.ranking.championTeamId], [2, tournament.ranking.runnerUpTeamId], [3, tournament.ranking.thirdPlaceTeamId], [4, tournament.ranking.fourthPlaceTeamId]].filter(([, id]) => id); if (!rows.length) return null; return <section className="standings"><p className="eyebrow">FINAL RANKING</p><h2>最终排名</h2><div>{rows.map(([rank, id]) => <span key={String(rank)}><b>{rank}</b>{teamName(archive, id as string)}</span>)}</div></section>; }
