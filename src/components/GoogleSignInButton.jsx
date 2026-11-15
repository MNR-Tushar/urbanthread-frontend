import { useEffect, useRef, useState } from 'react';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const GoogleSignInButton = ({ onCredential, onError }) => {
  const containerRef = useRef(null);
  const callbacksRef = useRef({ onCredential, onError });
  const [error, setError] = useState('');

  useEffect(() => { callbacksRef.current = { onCredential, onError }; }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId) return undefined;
    let active = true;
    const renderButton = () => {
      if (!active || !window.google?.accounts?.id || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) return;
          setError('');
          try { await callbacksRef.current.onCredential(credential); }
          catch (err) { const message = err.response?.data?.error || 'Google sign-in failed. Please try again.'; setError(message); callbacksRef.current.onError?.(message); }
        },
      });
      containerRef.current.replaceChildren();
      window.google.accounts.id.renderButton(containerRef.current, { theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with', width: Math.min(containerRef.current.clientWidth || 360, 380) });
    };
    let script = document.getElementById('google-identity-services');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderButton);
    renderButton();
    return () => { active = false; script.removeEventListener('load', renderButton); };
  }, []);

  if (!clientId) return <p className="oauth-setup-note">Google sign-in requires <code>VITE_GOOGLE_CLIENT_ID</code>.</p>;
  return <div className="google-sign-in-wrap"><div ref={containerRef} className="google-sign-in-button" />{error && <div className="error" role="alert">{error}</div>}</div>;
};
