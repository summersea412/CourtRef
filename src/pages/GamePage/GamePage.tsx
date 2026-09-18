import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ScoreAction } from '../../domain/scoreAction';
import { Page } from '../../components/Page';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ScoreControls } from '../../components/ScoreControls';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useWakeLock } from '../../hooks/useWakeLock';
import { formatGameTime } from '../../utils/time';
import { addScore, finishGame, getGameById, pauseGame, resumeGame, startGame, type GameLookup, undoLastScore } from '../../services/gameService';

export function GamePage() {
  const { gameId } = useParams(); const [result, setResult] = useState<GameLookup | null>(); const [error, setError] = useState(''); const finishingId = useRef<string | null>(null);
  useEffect(() => { if (gameId) void getGameById(gameId).then(found => setResult(found ?? null)); }, [gameId]);
  if (result === undefined) return <Page title="加载中…" />;
  if (!result) return <Page title="未找到比赛"><p className="muted">这个比赛可能已被删除，或链接已经失效。</p><Link className="button" to="/">返回首页</Link></Page>;
  return <GameView result={result} setResult={setResult} error={error} setError={setError} finishingId={finishingId} />;
}

type GameViewProps = { result: GameLookup; setResult: (result: GameLookup) => void; error: string; setError: (error: string) => void; finishingId: MutableRefObject<string | null> };

function GameView({ result, setResult, error, setError, finishingId }: GameViewProps) {
  const { game, archive } = result; const [moreOpen, setMoreOpen] = useState(false); const [finishConfirming, setFinishConfirming] = useState(false); const teamA = archive.teams.find(team => team.id === game.teamAId); const teamB = archive.teams.find(team => team.id === game.teamBId); const displayRemaining = useGameTimer(game);
  useWakeLock(game.status === 'running');
  useEffect(() => { if (game.status === 'running' && displayRemaining === 0 && finishingId.current !== game.id) { finishingId.current = game.id; void finishGame(game.id).then(updated => { notifyNaturalFinish(); setResult(updated); finishingId.current = null; }).catch(reason => { setError(reason instanceof Error ? reason.message : '结束比赛失败'); finishingId.current = null; }); } }, [displayRemaining, game.id, game.status, finishingId, setError, setResult]);
  if (!teamA || !teamB) return <Page title="比赛数据错误"><p className="error-message">比赛中的队伍数据不完整。</p></Page>;
  if (game.status === 'finished') return <Page title="比赛结束"><Link className="back-link" to={`/archive/${archive.id}`}>← 返回比赛存档</Link><section className="result-card"><p className="eyebrow">FINAL SCORE</p><div className="result-matchup"><div><span>{teamA.name}</span><strong>{game.scoreA}</strong></div><em>:</em><div><span>{teamB.name}</span><strong>{game.scoreB}</strong></div></div><div className="result-details"><div><span>比赛时长</span><strong>{formatGameTime(game.duration)}</strong></div><div><span>剩余时间</span><strong>{formatGameTime(game.remainingTime)}</strong></div><div><span>结束时间</span><strong>{game.finishedAt ? new Date(game.finishedAt).toLocaleString('zh-CN') : '—'}</strong></div></div><Link className="button start-button" to={`/archive/${archive.id}`}>返回比赛存档</Link></section></Page>;
  const runScore = (teamId: string, points: ScoreAction['points']) => { setError(''); void addScore(game.id, teamId, points).then(setResult).catch(reason => setError(reason instanceof Error ? reason.message : '记分失败')); };
  const undo = () => { setError(''); void undoLastScore(game.id).then(setResult).catch(reason => setError(reason instanceof Error ? reason.message : '撤销失败')); };
  const changeTimer = () => { setError(''); const action = game.status === 'ready' ? startGame : game.status === 'running' ? pauseGame : resumeGame; void action(game.id).then(setResult).catch(reason => setError(reason instanceof Error ? reason.message : '计时状态更新失败')); };
  const statusLabel = game.status === 'running' ? '比赛进行中' : game.status === 'paused' ? '比赛已暂停' : '比赛准备'; const timerButton = game.status === 'ready' ? '▶ 开始比赛' : game.status === 'running' ? '⏸ 暂停' : '▶ 继续比赛';
  return <Page title="裁判模式"><Link className="back-link" to={`/archive/${archive.id}`}>← 返回存档</Link><main className="referee-mode"><div className={`referee-status status-${game.status}`}><span className="status-dot" />{statusLabel}</div><div className={displayRemaining <= 60 && displayRemaining > 0 ? 'scoreboard timer-warning' : 'scoreboard'}><div className="score-team"><span>{teamA.name}</span><strong>{game.scoreA}</strong></div><div className="score-divider">:</div><div className="score-team"><span>{teamB.name}</span><strong>{game.scoreB}</strong></div></div><div className={displayRemaining <= 60 && displayRemaining > 0 ? 'referee-time timer-warning' : 'referee-time'}>比赛时间 <strong>{formatGameTime(displayRemaining)}</strong></div><div className="score-actions"><ScoreControls teamName={teamA.name} onScore={points => runScore(teamA.id, points)} /><ScoreControls teamName={teamB.name} onScore={points => runScore(teamB.id, points)} /></div><button className="timer-button" type="button" onClick={changeTimer}>{timerButton}</button><button className="undo-button" type="button" disabled={game.actions.length===0} onClick={undo}>↶ 撤销上一步</button><button className="more-button" type="button" onClick={()=>setMoreOpen(true)}>更多</button>{error&&<p className="error-message" role="alert">{error}</p>}</main>{moreOpen&&<div className="sheet-backdrop" role="presentation" onClick={()=>setMoreOpen(false)}><section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="more-title" onClick={event=>event.stopPropagation()}><h2 id="more-title">更多操作</h2><button type="button" disabled={game.status==='ready'} onClick={()=>{setMoreOpen(false);setFinishConfirming(true)}}>结束比赛</button><button type="button" onClick={()=>setMoreOpen(false)}>取消</button></section></div>}{finishConfirming&&<ConfirmDialog eyebrow="FINISH GAME" title="结束本场比赛？" message={`${teamA.name} ${game.scoreA} : ${game.scoreB} ${teamB.name}。比赛结束后将保存最终比分。`} confirmLabel="确认结束" onCancel={()=>setFinishConfirming(false)} onConfirm={()=>{setFinishConfirming(false);void finishGame(game.id).then(setResult).catch(reason=>setError(reason instanceof Error?reason.message:'结束比赛失败'))}}/>}</Page>;
}

function notifyNaturalFinish(): void { try { if ('vibrate' in navigator) navigator.vibrate(120); } catch { /* optional enhancement */ } }
