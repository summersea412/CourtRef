import { Link } from 'react-router-dom';
import type { Archive } from '../domain/archive';
import { formatGameTime } from '../utils/time';

export function ArchiveCard({ archive, onDelete }: { archive: Archive; onDelete: () => void }) {
  const active = archive.games.find(game => game.status === 'ready' || game.status === 'running' || game.status === 'paused');
  const teamA = active && archive.teams.find(team => team.id === active.teamAId);
  const teamB = active && archive.teams.find(team => team.id === active.teamBId);
  return <article className="archive-card"><div className="card-topline"><span className="card-index">ARCHIVE</span><button className="menu" aria-label={`删除 ${archive.name}`} onClick={onDelete}>⋯</button></div><h2>{archive.name}</h2><p className="muted">{archive.teams.length} 支队伍</p><p className="team-list">{archive.teams.map(team => team.name).join(' · ')}</p>{archive.tournament&&<Link className="active-game-summary" to={`/archive/${archive.id}/tournament`}><strong>多队比赛 · {archive.tournament.status==='finished'?'已结束':'进行中'}</strong><span>查看赛程 ↗</span></Link>}{active&&<Link className="active-game-summary" to={`/game/${active.id}`}><strong>{active.status==='paused'?'比赛已暂停':'比赛进行中'}</strong><span>{teamA?.name} {active.scoreA} : {active.scoreB} {teamB?.name} · {formatGameTime(active.remainingTime)}</span></Link>}<Link className="button button-outline" to={`/archive/${archive.id}`}>进入存档 <span aria-hidden="true">↗</span></Link></article>;
}
