import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

const fieldError = (error) => {
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  const first = data && Object.values(data).flat(Infinity).find((value) => typeof value === 'string');
  return first || 'Could not update your password. Please check the details and try again.';
};

export const PasswordResetPage = () => {
  const [step, setStep] = useState('request');
  const [channel, setChannel] = useState('email');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ new_password: '', confirm_password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const requestCode = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await authAPI.requestPasswordReset({ contact, channel });
      setNotice(data.detail || 'If an account matches, a reset code has been sent.');
      setStep('confirm');
    } catch (err) { setError(fieldError(err)); }
    finally { setBusy(false); }
  };

  const resetPassword = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await authAPI.confirmPasswordReset({ contact, channel, otp, ...passwords });
      setNotice(data.detail || 'Password reset successfully.'); setStep('complete');
    } catch (err) { setError(fieldError(err)); }
    finally { setBusy(false); }
  };

  return <main className="page auth-page"><section className="auth-form password-flow">
    <p className="eyebrow">ACCOUNT SECURITY</p>
    <h1>{step === 'request' ? 'Reset your password' : step === 'confirm' ? 'Enter your reset code' : 'Password updated'}</h1>
    <p className="password-flow-copy">{step === 'request' ? 'Choose where to receive a one-time code.' : step === 'confirm' ? `Enter the 6-digit code sent to your ${channel === 'email' ? 'email' : 'phone'}, then choose a new password.` : 'You can now sign in with your new password.'}</p>
    {error && <div className="error" role="alert">{error}</div>}
    {notice && <div className="success" role="status">{notice}</div>}
    {step === 'request' && <form onSubmit={requestCode}>
      <div className="password-channel-options"><label><input type="radio" name="reset-channel" value="email" checked={channel === 'email'} onChange={() => setChannel('email')} /> Email</label><label><input type="radio" name="reset-channel" value="phone" checked={channel === 'phone'} onChange={() => setChannel('phone')} /> Phone</label></div>
      <div className="form-group"><label htmlFor="reset-contact">{channel === 'email' ? 'Email address' : 'Phone number'}</label><input id="reset-contact" type={channel === 'email' ? 'email' : 'tel'} autoComplete={channel === 'email' ? 'email' : 'tel'} value={contact} onChange={(event) => setContact(event.target.value)} required /></div>
      <button className="btn-submit" disabled={busy}>{busy ? 'Sending code…' : 'Send reset code'}</button>
    </form>}
    {step === 'confirm' && <form onSubmit={resetPassword}>
      <div className="form-group"><label htmlFor="reset-otp">6-digit code</label><input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required /></div>
      <div className="form-group"><label htmlFor="reset-new-password">New password</label><input id="reset-new-password" type="password" autoComplete="new-password" minLength={8} value={passwords.new_password} onChange={(event) => setPasswords({ ...passwords, new_password: event.target.value })} required /></div>
      <div className="form-group"><label htmlFor="reset-confirm-password">Confirm new password</label><input id="reset-confirm-password" type="password" autoComplete="new-password" minLength={8} value={passwords.confirm_password} onChange={(event) => setPasswords({ ...passwords, confirm_password: event.target.value })} required /></div>
      <button className="btn-submit" disabled={busy || otp.length !== 6}>{busy ? 'Updating password…' : 'Reset password'}</button>
      <button type="button" className="password-resend" disabled={busy} onClick={() => { setStep('request'); setOtp(''); setError(''); setNotice(''); }}>Send another code</button>
    </form>}
    {step === 'complete' && <Link className="btn-submit password-signin" to="/login">Go to sign in</Link>}
    {step !== 'complete' && <p className="password-back-link"><Link to="/login">Back to sign in</Link></p>}
  </section></main>;
};

export const ChangePasswordForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await authAPI.changePassword(values);
      setNotice(data.detail || 'Password changed successfully.');
      setValues({ current_password: '', new_password: '', confirm_password: '' });
      setIsOpen(false);
    } catch (err) { setError(fieldError(err)); }
    finally { setBusy(false); }
  };
  return <section className="profile-info password-change-section"><div className="profile-section-heading"><div><h2>Change password</h2><p>Update your account password.</p></div><button type="button" className="admin-quiet-button" aria-expanded={isOpen} aria-controls="change-password-form" onClick={() => { setIsOpen((open) => !open); setError(''); }}>{isOpen ? 'Cancel' : 'Change password'}</button></div>{notice && <div className="success" role="status">{notice}</div>}{isOpen && <><p>Confirm your current password before setting a new one.</p>{error && <div className="error" role="alert">{error}</div>}<form id="change-password-form" className="profile-form" onSubmit={submit}>
    {[[ 'current_password', 'Current password', 'current-password' ], [ 'new_password', 'New password', 'new-password' ], [ 'confirm_password', 'Confirm new password', 'new-password' ]].map(([key, label, autoComplete]) => <div className="form-group" key={key}><label htmlFor={`change-${key}`}>{label}</label><input id={`change-${key}`} type="password" autoComplete={autoComplete} minLength={key === 'current_password' ? undefined : 8} value={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value })} required /></div>)}
    <button className="btn-submit" disabled={busy}>{busy ? 'Updating…' : 'Change password'}</button>
  </form></>}</section>;
};
