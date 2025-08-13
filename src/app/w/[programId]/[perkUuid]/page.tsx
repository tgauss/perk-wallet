'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PassData {
  participant: {
    email: string;
    points: number;
    tier: string;
  };
  installUrl: string;
  googleSaveUrl: string;
  applePassUrl: string;
}

export default function MagicInstallPage() {
  const params = useParams();
  const { programId, perkUuid } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passData, setPassData] = useState<PassData | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    fetchPassData();
  }, [programId, perkUuid]);

  const fetchPassData = async () => {
    try {
      const response = await fetch('/api/install-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_id: programId,
          perk_uuid: perkUuid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pass data');
      }

      const data = await response.json();
      setPassData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallApple = async () => {
    setInstalling(true);
    try {
      const response = await fetch('/api/passes/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_id: programId,
          perk_uuid: perkUuid,
          pass_kind: 'loyalty',
          download: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate pass');
      }

      // Create a blob from the response and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loyalty-${perkUuid}.pkpass`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading Apple pass:', error);
      alert('Failed to download pass. Please try again.');
    } finally {
      setInstalling(false);
    }
  };

  const handleInstallGoogle = async () => {
    if (!passData?.googleSaveUrl) return;
    setInstalling(true);
    window.location.href = passData.googleSaveUrl;
  };

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    }
    return 'desktop';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your passes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const platform = detectPlatform();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Perk Wallet</h1>
            <p className="opacity-90">Your loyalty and rewards passes</p>
          </div>
          
          <div className="p-6">
            {passData && (
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-1">Member</div>
                <div className="font-medium text-gray-900">{passData.participant.email}</div>
                
                <div className="mt-4 flex justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Points</div>
                    <div className="text-2xl font-bold text-gray-900">{passData.participant.points}</div>
                  </div>
                  {passData.participant.tier && (
                    <div>
                      <div className="text-sm text-gray-500">Tier</div>
                      <div className="text-2xl font-bold text-gray-900">{passData.participant.tier}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {(platform === 'ios' || platform === 'desktop') && (
                <button
                  onClick={handleInstallApple}
                  disabled={installing}
                  className="w-full bg-black text-white rounded-lg py-3 px-4 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                  </svg>
                  <span>Add to Apple Wallet</span>
                </button>
              )}
              
              {(platform === 'android' || platform === 'desktop') && (
                <button
                  onClick={handleInstallGoogle}
                  disabled={installing}
                  className="w-full bg-white text-gray-900 border-2 border-gray-300 rounded-lg py-3 px-4 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Add to Google Wallet</span>
                </button>
              )}
            </div>

            {installing && (
              <p className="mt-4 text-sm text-gray-500 text-center">
                Opening wallet app...
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Your loyalty and rewards passes will be grouped together in your wallet app.</p>
        </div>
      </div>
    </div>
  );
}
