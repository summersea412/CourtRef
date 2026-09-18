import { Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage/HomePage';
import { CreateArchivePage } from '../pages/CreateArchivePage/CreateArchivePage';
import { ArchivePage } from '../pages/ArchivePage/ArchivePage';
import { CreateGamePage } from '../pages/CreateGamePage/CreateGamePage';
import { GamePage } from '../pages/GamePage/GamePage';
import { GameResultPage } from '../pages/GameResultPage/GameResultPage';

export function AppRouter() { return <Routes><Route path="/" element={<HomePage />} /><Route path="/archive/new" element={<CreateArchivePage />} /><Route path="/archive/:archiveId" element={<ArchivePage />} /><Route path="/archive/:archiveId/game/new" element={<CreateGamePage />} /><Route path="/game/:gameId" element={<GamePage />} /><Route path="/game/:gameId/result" element={<GameResultPage />} /></Routes>; }
