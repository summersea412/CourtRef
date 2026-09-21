import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Archive } from '../../domain/archive';
import { Page } from '../../components/Page';
import { getArchiveById } from '../../services/archiveService';
import { createTournament, type FirstRoundPair } from '../../services/tournamentService';

export function CreateTournamentPage() {
  const { archiveId } = useParams(); const navigate = useNavigate(); const [archive, setArchive] = useState<Archive | null>(); const [selected, setSelected] = useState<string[]>([]); const [error, setError] = useState('');
  useEffect(() => { if (archiveId) void getArchiveById(archiveId).then(found => { setArchive(found ?? null); setSelected(found?.teams.slice(0, 4).map(team => team.id) ?? []); }); }, [archiveId]);
  const pairs = useMemo<FirstRoundPair[]>(() => { const result: FirstRoundPair[] = []; for (let i = 0; i < selected.length; i += 2) result.push([selected[i], selected[i + 1] ?? null]); return result; }, [selected]);
  const submit = () => { if (!archiveId) return; void createTournament(archiveId, pairs).then(() => navigate(`/archive/${archiveId}/tournament`)).catch(reason => setError(reason instanceof Error ? reason.message : '创建多队比赛失败')); };
  if (archive === undefined) return <Page title="加载中…" />;
  if (!archive) return <Page title="未找到存档"><Link className="button" to="/">返回首页</Link></Page>;
  if (archive.teams.length < 4) return <Page title="暂时无法创建"><p className="muted">至少需要 4 支队伍才能生成赛程。</p><Link className="button" to={`/archive/${archive.id}`}>返回存档</Link></Page>;
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length >= 16 ? current : [...current, id]);
  const move = (index: number, direction: -1 | 1) => setSelected(current => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
  return <Page title="创建多队比赛"><Link className="back-link" to={`/archive/${archive.id}`}>← 返回存档</Link><div className="tournament-form"><p className="lede">选择参赛队伍并生成赛程。</p><p className="muted">本轮支持 4–16 支队伍的单淘汰赛，非 2 的幂队伍会自动安排轮空。</p><section className="bracket-form-card"><div className="section-heading"><div><p className="eyebrow">PARTICIPANTS</p><h2>参赛队伍</h2></div><span className="count-pill">已选择 {selected.length} 支队伍</span></div><div className="participant-list">{archive.teams.map(team => <label className="participant-option" key={team.id}><input type="checkbox" checked={selected.includes(team.id)} onChange={() => toggle(team.id)} /><span>{team.name}</span></label>)}</div></section><section className="bracket-form-card"><p className="eyebrow">FIRST ROUND</p><h2>首轮对阵顺序</h2><p className="muted">可用上下按钮调整配对顺序，单数队伍最后一队将轮空晋级。</p><div className="pairing-list">{pairs.map((pair, index) => <div className="pairing-row" key={`${pair[0]}-${index}`}><span>{index + 1}</span><strong>{archive.teams.find(team => team.id === pair[0])?.name ?? '待选择'}</strong><b>VS</b><strong>{pair[1] ? archive.teams.find(team => team.id === pair[1])?.name : '轮空晋级'}</strong><button type="button" className="text-action" onClick={() => move(index * 2, -1)} disabled={index === 0}>↑</button><button type="button" className="text-action" onClick={() => move(index * 2, 1)} disabled={index * 2 + 1 >= selected.length}>↓</button></div>)}</div></section>{error && <p className="error-message" role="alert">{error}</p>}<button className="button start-button" type="button" onClick={submit} disabled={selected.length < 4}>创建多队比赛 <span aria-hidden="true">↗</span></button></div></Page>;
}
