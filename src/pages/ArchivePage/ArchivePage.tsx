import {useEffect,useState} from 'react';
import {useNavigate,useParams,Link} from 'react-router-dom';
import {Page} from '../../components/Page';
import {ConfirmDialog} from '../../components/ConfirmDialog';
import {HistoryCard} from '../../components/HistoryCard';
import {deleteArchive,getArchiveById} from '../../services/archiveService';
import {deleteGame} from '../../services/gameService';
import type {Archive} from '../../domain/archive';
import type {Game} from '../../domain/game';

export function ArchivePage(){
  const {archiveId}=useParams(); const nav=useNavigate(); const [archive,setArchive]=useState<Archive|null>(); const [confirming,setConfirming]=useState<'archive'|'game'|null>(null); const [pendingGame,setPendingGame]=useState<Game|null>(null); const [showActivePrompt,setShowActivePrompt]=useState(false);
  useEffect(()=>{if(archiveId)void getArchiveById(archiveId).then(setArchive);},[archiveId]);
  const removeArchive=async()=>{if(!archiveId)return;await deleteArchive(archiveId);nav('/')};
  const removeGame=async()=>{if(!pendingGame)return;const updated=await deleteGame(pendingGame.id);setArchive(updated.archive);setPendingGame(null);setConfirming(null)};
  if(archive===undefined)return <Page title="加载中…"/>;
  if(!archive)return <Page title="未找到存档"><Link className="button" to="/">返回首页</Link></Page>;
  const active=archive.games.find(game=>game.status==='ready'||game.status==='running'||game.status==='paused');
  const history=archive.games.filter(game=>game.status==='finished').sort((a,b)=>Date.parse(b.finishedAt ?? '')-Date.parse(a.finishedAt ?? ''));
  return <Page title={archive.name}><div className="detail-header"><div><p className="lede">比赛存档</p><p className="muted">创建于 {new Date(archive.createdAt).toLocaleDateString('zh-CN')}</p></div><div className="detail-actions"><button className="button" onClick={()=>active?setShowActivePrompt(true):nav(`/archive/${archive.id}/game/new`)}>＋ 开始新比赛</button><button className="button danger-outline" onClick={()=>setConfirming('archive')}>删除存档</button></div></div><section className="detail-panel"><div className="section-heading"><div><p className="eyebrow">TEAMS</p><h2>参赛队伍</h2></div><span className="count-pill">{archive.teams.length} 支</span></div><ul className="team-detail-list">{archive.teams.map((t,i)=><li key={t.id}><span>{String(i+1).padStart(2,'0')}</span><strong>{t.name}</strong></li>)}</ul></section>{active&&<section className="archive-section"><div className="section-heading"><div><p className="eyebrow">IN PROGRESS</p><h2>未完成比赛</h2></div></div><Link className="unfinished-card" to={`/game/${active.id}`}><strong>{active.status==='paused'?'比赛已暂停':'比赛进行中'}</strong><span>{teamName(archive,active.teamAId)} {active.scoreA} : {active.scoreB} {teamName(archive,active.teamBId)}</span><span className="button button-outline">继续比赛 ↗</span></Link></section>}<section className="archive-section"><div className="section-heading"><div><p className="eyebrow">HISTORY</p><h2>比赛记录</h2></div><span className="count-pill">{history.length} 场</span></div>{history.length===0?<p className="muted empty-copy">完成的比赛会显示在这里。</p>:<div className="history-list">{history.map(game=><HistoryCard key={game.id} archive={archive} game={game} onDelete={()=>{setPendingGame(game);setConfirming('game')}}/>)}</div>}</section>{showActivePrompt&&<ConfirmDialog eyebrow="UNFINISHED GAME" title="当前还有一场未完成比赛" message="请先继续当前比赛，完成后再创建新的比赛。" confirmLabel="继续当前比赛" onCancel={()=>setShowActivePrompt(false)} onConfirm={()=>nav(`/game/${active?.id ?? ''}`)}/>} {confirming==='archive'&&<ConfirmDialog onCancel={()=>setConfirming(null)} onConfirm={()=>void removeArchive()}/>} {confirming==='game'&&pendingGame&&<ConfirmDialog eyebrow="DELETE GAME" title="删除这场比赛记录？" message={`${teamName(archive,pendingGame.teamAId)} ${pendingGame.scoreA} : ${pendingGame.scoreB} ${teamName(archive,pendingGame.teamBId)}。删除后无法恢复。`} onCancel={()=>setConfirming(null)} onConfirm={()=>void removeGame()}/>}</Page>
}

function teamName(archive: Archive, id: string): string { return archive.teams.find(team=>team.id===id)?.name ?? '未知队伍'; }
