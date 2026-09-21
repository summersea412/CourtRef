import { Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage/HomePage';
import { CreateArchivePage } from '../pages/CreateArchivePage/CreateArchivePage';
import { ArchivePage } from '../pages/ArchivePage/ArchivePage';
import { CreateGamePage } from '../pages/CreateGamePage/CreateGamePage';
import { GamePage } from '../pages/GamePage/GamePage';
import { GameResultPage } from '../pages/GameResultPage/GameResultPage';
import { CreateTournamentPage } from '../pages/CreateTournamentPage/CreateTournamentPage';
import { TournamentPage } from '../pages/TournamentPage/TournamentPage';

export function AppRouter() { return <Routes><Route path="/" element={<HomePage />} /><Route path="/archive/new" element={<CreateArchivePage />} /><Route path="/archive/:archiveId" element={<ArchivePage />} /><Route path="/archive/:archiveId/game/new" element={<CreateGamePage />} /><Route path="/archive/:archiveId/tournament/new" element={<CreateTournamentPage />} /><Route path="/archive/:archiveId/tournament" element={<TournamentPage />} /><Route path="/game/:gameId" element={<GamePage />} /><Route path="/game/:gameId/result" element={<GameResultPage />} /></Routes>; }
