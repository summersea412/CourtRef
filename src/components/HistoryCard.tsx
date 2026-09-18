import { Link } from 'react-router-dom';
import type { Archive } from '../domain/archive';
import type { Game } from '../domain/game';
import { formatDateTime } from '../utils/date';
import { formatGameTime } from '../utils/time';

export function HistoryCard({ archive, game, onDelete }: { archive: Archive; game: Game; onDelete: () => void }) {
  const teamA = archive.teams.find(team => team.id === game.teamAId);
  const teamB = archive.teams.find(team => team.id === game.teamBId);
  return <article className="history-card"><div className="history-main"><Link to={`/game/${game.id}`}><div className="history-teams"><strong>{teamA?.name ?? '未知队伍'}</strong><strong>{teamB?.name ?? '未知队伍'}</strong></div><div className="history-score"><strong>{game.scoreA}</strong><span>:</span><strong>{game.scoreB}</strong></div><div className="history-meta"><span>{formatGameTime(game.duration)}</span><span>{game.finishedAt ? formatDateTime(game.finishedAt) : ''}</span></div></Link></div><button className="menu" aria-label="删除比赛记录" onClick={onDelete}>⋯</button></article>;
}
