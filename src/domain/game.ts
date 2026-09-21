import type { ScoreAction } from './scoreAction';
export type GameStatus = 'ready' | 'running' | 'paused' | 'finished';
export type Game = { id: string; teamAId: string; teamBId: string; scoreA: number; scoreB: number; duration: number; remainingTime: number; status: GameStatus; startedAt: string | null; finishedAt: string | null; actions: ScoreAction[]; resultSource?: 'live' | 'manual' };
