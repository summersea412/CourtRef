import type { ScoreAction } from '../domain/scoreAction';

type ScoreControlsProps = { teamName: string; onScore: (points: ScoreAction['points']) => void; disabled?: boolean };

export function ScoreControls({ teamName, onScore, disabled = false }: ScoreControlsProps) {
  return <section className="score-controls" aria-label={`${teamName} 得分控制`}><p>{teamName}</p><div><button type="button" disabled={disabled} onClick={() => onScore(1)}>+1</button><button type="button" disabled={disabled} onClick={() => onScore(2)}>+2</button><button type="button" disabled={disabled} onClick={() => onScore(3)}>+3</button></div></section>;
}
