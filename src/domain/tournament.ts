export type TournamentFormat = 'single_elimination';
export type TournamentStatus = 'setup' | 'in_progress' | 'finished';
export type TournamentMatchStatus = 'pending' | 'ready' | 'running' | 'paused' | 'finished' | 'bye';

export type TournamentMatch = {
  id: string;
  gameId: string | null;
  roundNumber: number;
  position: number;
  teamAId: string | null;
  teamBId: string | null;
  nextMatchId: string | null;
  loserTargetMatchId: string | null;
  status: TournamentMatchStatus;
};

export type TournamentRound = { id: string; roundNumber: number; name: string; matches: TournamentMatch[] };

export type TournamentRanking = {
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  thirdPlaceTeamId: string | null;
  fourthPlaceTeamId: string | null;
};

export type Tournament = {
  id: string;
  archiveId: string;
  format: TournamentFormat;
  status: TournamentStatus;
  participantTeamIds: string[];
  rounds: TournamentRound[];
  thirdPlaceMatchId: string | null;
  ranking: TournamentRanking;
  createdAt: string;
  updatedAt: string;
};
