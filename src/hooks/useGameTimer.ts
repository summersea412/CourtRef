import { useEffect, useState } from 'react';
import type { Game } from '../domain/game';

function calculateRemaining(game: Game, now: number): number {
  if (game.status !== 'running' || !game.startedAt) return Math.max(0, game.remainingTime);
  const elapsed = Math.floor(Math.max(0, now - Date.parse(game.startedAt)) / 1000);
  return Math.max(0, game.remainingTime - elapsed);
}

export function useGameTimer(game: Game): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (game.status !== 'running') return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [game.status, game.startedAt, game.remainingTime]);
  return calculateRemaining(game, now);
}
