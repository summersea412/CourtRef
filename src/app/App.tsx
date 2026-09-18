import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { AppErrorBoundary } from '../components/AppErrorBoundary';

export function App() { return <AppErrorBoundary><BrowserRouter><AppRouter /></BrowserRouter></AppErrorBoundary>; }
