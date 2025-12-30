import { useEffect, useState } from 'react';
import { ConfigForm } from './components/ConfigForm';
import { Viewer } from './components/Viewer';
import { decodePayload } from './utils/urlManager';
import { ConfigPayload } from './types';

function App() {
  const [payload, setPayload] = useState<ConfigPayload | null>(null);
  const [mode, setMode] = useState<'config' | 'view'>('config');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
      const decoded = decodePayload(data);
      if (decoded) {
        setPayload(decoded);
        setMode('view');
      }
    }
  }, []);

  const handlePreview = (previewPayload: ConfigPayload) => {
    setPayload(previewPayload);
    setMode('view');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative">
      {/* Background stars or gradient can be added here */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black -z-10" />

      {mode === 'config' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <ConfigForm onPreview={handlePreview} />
        </div>
      )}

      {mode === 'view' && payload && (
        <Viewer payload={payload} onExit={() => setMode('config')} />
      )}
    </div>
  );
}

export default App;
