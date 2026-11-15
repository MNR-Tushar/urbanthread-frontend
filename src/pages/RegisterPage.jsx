import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../contexts/useAuth';

const getError = (err) => err.response?.data?.error || err.response?.data?.detail || Object.values(err.response?.data || {}).flat(Infinity).find((value) => typeof value === 'string') || 'Registration failed. Please try again.';

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('register');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, verifyEmail, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('');
    try {
      const result = await register({ username, email, password });
      setStep('verify'); setNotice(result.detail || 'Enter the code sent to your email.');
    } catch (err) {
      setError(getError(err));
      if (err.response?.status === 503) setStep('verify');
    } finally { setLoading(false); }
  };

  const resendCode = async () => {
    setLoading(true); setError(''); setNotice('');
    try {
      const { data } = await authAPI.resendEmailVerification(email);
      setNotice(data.detail || 'If verification is needed, a new code has been sent.');
      setStep('verify');
    } catch (err) { setError(getError(err)); }
    finally { setLoading(false); }
  };

  const confirmEmail = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('');
    try {
      await verifyEmail(email, otp);
      navigate('/', { replace: true });
    } catch (err) { setError(getError(err)); }
    finally { setLoading(false); }
  };

  const continueWithGoogle = async (credential) => {
    await googleSignIn(credential);
    navigate('/', { replace: true });
  };

  return <div className="page auth-page"><div className="auth-form">
    <h1>{step === 'register' ? 'Create Account' : 'Verify your email'}</h1>
    {error && <div className="error" role="alert">{error}</div>}
    {notice && <div className="success" role="status">{notice}</div>}
    {step === 'register' ? <>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label htmlFor="register-username">Username</label><input id="register-username" type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" required /></div>
        <div className="form-group"><label htmlFor="register-email">Email Address</label><input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
        <div className="form-group"><label htmlFor="register-password">Password</label><input id="register-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" required /></div>
        <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</button>
      </form>
      <div className="auth-divider"><span>or continue with</span></div>
      <GoogleSignInButton onCredential={continueWithGoogle} />
    </> : <form onSubmit={confirmEmail}>
      <p className="verify-email-copy">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
      <div className="form-group"><label htmlFor="email-verification-otp">Verification code</label><input id="email-verification-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required /></div>
      <button type="submit" className="btn-submit" disabled={loading || otp.length !== 6}>{loading ? 'Verifying…' : 'Verify email'}</button>
      <button type="button" className="password-resend" onClick={resendCode} disabled={loading}>Resend verification code</button>
      <button type="button" className="password-resend" onClick={() => { setStep('register'); setError(''); setNotice(''); }}>Back to registration</button>
    </form>}
    <p className="auth-switch-link">Already have an account? <Link to="/login">Sign in</Link></p>
  </div></div>;
};
