import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Archive } from '../../domain/archive';
import { Page } from '../../components/Page';
import { getArchiveById } from '../../services/archiveService';
import { createGame } from '../../services/gameService';

const presets = [5, 8, 10, 12];

export function CreateGamePage() {
  const { archiveId } = useParams();
  const navigate = useNavigate();
  const [archive, setArchive] = useState<Archive | null>();
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [minutes, setMinutes] = useState(10);
  const [custom, setCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('10');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!archiveId) return;
    void getArchiveById(archiveId).then(found => {
      setArchive(found ?? null);
      if (found && found.teams.length >= 2) { setTeamAId(found.teams[0].id); setTeamBId(found.teams[1].id); }
    });
  }, [archiveId]);

  const submit = () => {
    if (!archiveId) { setError('缺少存档信息'); return; }
    const selectedMinutes = custom ? Number(customMinutes) : minutes;
    void createGame(archiveId, teamAId, teamBId, selectedMinutes * 60)
      .then(game => navigate(`/game/${game.id}`))
      .catch(reason => setError(reason instanceof Error ? reason.message : '创建比赛失败'));
  };

  if (archive === undefined) return <Page title="加载中…" />;
  if (!archive) return <Page title="未找到存档"><Link className="button" to="/">返回首页</Link></Page>;
  if (archive.teams.length < 2) return <Page title="无法开始比赛"><p className="muted">该存档至少需要两支队伍。</p><Link className="button" to={`/archive/${archive.id}`}>返回存档</Link></Page>;
  const teamA = archive.teams.find(team => team.id === teamAId);
  const teamB = archive.teams.find(team => team.id === teamBId);
  return <Page title="开始新比赛"><Link className="back-link" to={`/archive/${archive.id}`}>← 返回存档</Link><div className="game-form"><p className="lede">选择双方，设置本场比赛时间。</p><section className="matchup-panel"><p className="eyebrow">MATCHUP</p><div className="matchup"><label><span>主队</span><select value={teamAId} onChange={e=>setTeamAId(e.target.value)}>{archive.teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select></label><strong>VS</strong><label><span>客队</span><select value={teamBId} onChange={e=>setTeamBId(e.target.value)}>{archive.teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select></label></div><button className="button secondary swap-button" type="button" onClick={()=>{setTeamAId(teamBId);setTeamBId(teamAId)}}>⇄ 交换双方</button><p className="matchup-summary">{teamA?.name ?? '请选择'} <span>VS</span> {teamB?.name ?? '请选择'}</p></section><section className="time-panel"><div className="section-heading"><div><p className="eyebrow">DURATION</p><h2>比赛时间</h2></div><span className="time-value">{custom ? (Number(customMinutes) || 0) : minutes}:00</span></div><div className="preset-grid">{presets.map(value=><button className={`time-option${!custom&&minutes===value?' selected':''}`} key={value} type="button" onClick={()=>{setCustom(false);setMinutes(value)}}>{value} 分钟</button>)}<button className={`time-option${custom?' selected':''}`} type="button" onClick={()=>setCustom(true)}>自定义</button></div>{custom&&<label className="custom-time">分钟<input type="number" min="1" max="60" step="1" value={customMinutes} onChange={e=>setCustomMinutes(e.target.value)} /></label>}</section>{error&&<p className="error-message" role="alert">{error}</p>}<button className="button start-button" type="button" onClick={submit}>开始比赛 <span aria-hidden="true">↗</span></button></div></Page>;
}
