import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeIntegrationCallback } from '../lib/agencyApi';
import { PLATFORM_LABELS } from '../lib/agencyTypes';
import type { IntegrationProvider } from '../lib/agencyTypes';

export default function IntegrationCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting integration...');

  useEffect(() => {
    const provider = searchParams.get('provider') as IntegrationProvider | null;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !provider || !code) {
      setStatus('error');
      setMessage('Connection error. Redirecting...');
      setTimeout(() => navigate('/?tab=integrations', { replace: true }), 2000);
      return;
    }

    const label = PLATFORM_LABELS[provider] ?? provider;

    completeIntegrationCallback(provider, code)
      .then((res) => {
        setStatus('success');
        setMessage(
          res.mode === 'demo'
            ? `${label} connected in demo mode (for testing)`
            : `${label} connected successfully`,
        );
        setTimeout(() => navigate('/?tab=integrations', { replace: true }), 1500);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not complete the connection');
        setTimeout(() => navigate('/?tab=integrations', { replace: true }), 2000);
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 max-w-md w-full text-center">
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
