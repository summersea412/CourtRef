import type { Game } from './game';
import type { Team } from './team';
export type Archive = { id: string; name: string; teams: Team[]; games: Game[]; createdAt: string; updatedAt: string };
