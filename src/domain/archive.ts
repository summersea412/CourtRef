import type { Game } from './game';
import type { Team } from './team';
import type { Tournament } from './tournament';
export type Archive = { id: string; name: string; teams: Team[]; games: Game[]; tournament?: Tournament; createdAt: string; updatedAt: string };
