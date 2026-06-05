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
  const [detail, setDetail] = useState('');

  useEffect(() => {
    const provider = searchParams.get('provider') as IntegrationProvider | null;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !provider || !code) {
      setStatus('error');
      setMessage('Connection error');
      setDetail('Missing authorization code or provider. Redirecting...');
      setTimeout(() => navigate('/?tab=integrations', { replace: true }), 2000);
      return;
    }

    const label = PLATFORM_LABELS[provider] ?? provider;

    completeIntegrationCallback(provider, code)
      .then((res) => {
        if (!res.success) {
          setStatus('error');
          setMessage(`Could not connect ${label}`);
          setDetail(res.error || 'OAuth token exchange failed.');
          setTimeout(() => navigate('/?tab=integrations', { replace: true }), 2500);
          return;
        }

        setStatus('success');
        if (res.mode === 'demo') {
          setMessage(`${label} connected in demo mode`);
          setDetail(
            'Simulated connection — posts and calendar sync will not reach the real API.',
          );
        } else {
          setMessage(`${label} connected with real OAuth`);
          setDetail(
            res.accountName
              ? `Authorized as ${res.accountName}. Live API tokens are stored on the server.`
              : 'Authorization completed. Live API tokens are stored on the server.',
          );
        }
        setTimeout(() => navigate('/?tab=integrations', { replace: true }), 2000);
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setStatus('error');
        setMessage(`Could not connect ${label}`);
        setDetail(axiosErr.response?.data?.error || 'OAuth callback failed on the server.');
        setTimeout(() => navigate('/?tab=integrations', { replace: true }), 2500);
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-fuchsia-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-700 font-medium">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl">
              ✓
            </div>
            <p className="text-slate-800 font-bold">{message}</p>
            {detail && <p className="text-slate-500 text-sm mt-2">{detail}</p>}
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl">
              ✕
            </div>
            <p className="text-slate-800 font-bold">{message}</p>
            {detail && <p className="text-slate-500 text-sm mt-2">{detail}</p>}
          </>
        )}
      </div>
    </div>
  );
}
