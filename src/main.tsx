import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/design.css';
import './styles/referee.css';
import './styles/timer.css';
import './styles/history.css';
import './styles/final.css';
import './styles/tournament.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
createRoot(rootElement).render(<StrictMode><App /></StrictMode>);
if ('serviceWorker' in navigator) window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
