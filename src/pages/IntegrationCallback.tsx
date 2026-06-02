import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeIntegrationCallback } from '../lib/agencyApi';
import type { IntegrationProvider } from '../lib/agencyTypes';

export default function IntegrationCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Conectando integración...');

  useEffect(() => {
    const provider = searchParams.get('provider') as IntegrationProvider | null;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !provider || !code) {
      setStatus('error');
      setMessage('Error en la conexión. Redirigiendo...');
      setTimeout(() => navigate('/?tab=integrations', { replace: true }), 2000);
      return;
    }

    completeIntegrationCallback(provider, code)
      .then((res) => {
        setStatus('success');
        setMessage(
          res.mode === 'demo'
            ? `${provider} conectado en modo demo (funcional para pruebas)`
            : `${provider} conectado correctamente`,
        );
        setTimeout(() => navigate('/?tab=integrations', { replace: true }), 1500);
      })
      .catch(() => {
        setStatus('error');
        setMessage('No se pudo completar la conexión');
        setTimeout(() => navigate('/?tab=integrations', { replace: true }), 2000);
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-fuchsia-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-700">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl">
              ✓
            </div>
            <p className="text-slate-700 font-medium">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl">
              ✕
            </div>
            <p className="text-slate-700">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
