import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runSupabaseConnectionDiagnostic } from './lib/supabase';

void runSupabaseConnectionDiagnostic().then(result => {
  console.info(`[Supabase diagnostic] ${result}`);
});

createRoot(document.getElementById('root')!).render(<App />);
