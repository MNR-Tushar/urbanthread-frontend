import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { couponsAPI } from '../api';
import { useAuth } from '../contexts/useAuth';

export const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState('');
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [couponForm, setCouponForm] = useState({ code: '', discount: '', start_date: '', expiration_date: '', is_active: true });
  const { isAuthenticated, user } = useAuth();
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

  useEffect(() => {
    couponsAPI.getCoupons()
      .then(res => setCoupons(res.data.results || res.data))
      .catch(() => setError('Failed to load coupons'))
      .finally(() => setLoading(false));
  }, []);

  const validateCoupon = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await couponsAPI.validateCoupon(code);
      setValidation(res.data);
    } catch (err) {
      setValidation({ valid: false, error: err.response?.data?.error || 'Invalid coupon' });
    }
  };

  const saveCoupon = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const data = { ...couponForm, code: couponForm.code.trim().toUpperCase(), discount: Number(couponForm.discount), start_date: couponForm.start_date || null };
    try {
      if (editing) await couponsAPI.updateCoupon(editing, data);
      else await couponsAPI.createCoupon(data);
      const result = await couponsAPI.getCoupons(); setCoupons(result.data.results || result.data);
      setNotice(editing ? 'Coupon updated.' : 'Coupon created.'); setCouponForm({ code: '', discount: '', start_date: '', expiration_date: '', is_active: true }); setEditing(null);
    } catch (err) { setError(err.response?.data?.detail || err.response?.data?.error || 'Could not save this coupon.'); }
    finally { setSaving(false); }
  };

  const editCoupon = (coupon) => {
    setEditing(coupon.id); setCouponForm({ code: coupon.code, discount: coupon.discount, start_date: coupon.start_date || '', expiration_date: coupon.expiration_date, is_active: coupon.is_active });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    setError(''); setNotice('');
    try { await couponsAPI.deleteCoupon(coupon.id); setCoupons((items) => items.filter((item) => item.id !== coupon.id)); setNotice('Coupon deleted.'); }
    catch (err) { setError(err.response?.data?.detail || 'Could not delete coupon.'); }
  };

  if (loading) return <div className="loading">Loading coupons...</div>;

  return (
    <div className="page coupons-page">
      <h1>Coupons</h1>
      {error && <div className="error" role="alert">{error}</div>}
      {notice && <div className="success" role="status">{notice}</div>}
      {isAdmin && <section className="admin-panel coupon-admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">ADMIN · PROMOTIONS</span><h2>{editing ? 'Edit promotion' : 'Create a promotion'}</h2></div></div>
        <form className="admin-form-grid" onSubmit={saveCoupon}>
          <label>Coupon code<input maxLength="10" required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="e.g. WELCOME10" /></label>
          <label>Discount (%)<input type="number" min="0.01" max="100" step="0.01" required value={couponForm.discount} onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })} /></label>
          <label>Starts on<input type="date" value={couponForm.start_date} onChange={(e) => setCouponForm({ ...couponForm, start_date: e.target.value })} /></label>
          <label>Expires on<input type="date" required value={couponForm.expiration_date} onChange={(e) => setCouponForm({ ...couponForm, expiration_date: e.target.value })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={couponForm.is_active} onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })} /> Active promotion</label>
          <div className="admin-form-actions"><button className="btn-submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}</button>{editing && <button type="button" className="admin-quiet-button" onClick={() => { setEditing(null); setCouponForm({ code: '', discount: '', start_date: '', expiration_date: '', is_active: true }); }}>Cancel</button>}</div>
        </form>
      </section>}
      <div className="coupon-validate">
        {isAuthenticated ? (
          <>
            <form onSubmit={validateCoupon}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter coupon code"
                required
              />
              <button type="submit">Validate Coupon</button>
            </form>
            {validation && (
              <div className={validation.valid ? 'success' : 'error'}>
                {validation.valid ? `Coupon applied! You get ${validation.discount}% off` : validation.error}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: '8px' }}>
            <p>Please log in to validate coupons</p>
            <Link to="/login">Sign in here</Link>
          </div>
        )}
      </div>
      <div className="coupon-list">
        <h2>Available Coupons</h2>
        {coupons.length === 0 ? <p className="empty-coupons">No active coupons are available right now.</p> : coupons.map((c) => (
          <div key={c.id} className="coupon-card">
            <h3>{c.code}</h3>
            <p>Discount: {c.discount}%</p>
            <p>Status: {c.is_active ? 'Active' : 'Inactive'}</p>
            <p>Valid: {c.is_valid ? 'Yes' : 'No'}</p>
            <p>Expires: {c.expiration_date}</p>
            {isAdmin && <div className="admin-row-actions coupon-card-actions"><button type="button" onClick={() => editCoupon(c)}>Edit</button><button type="button" className="danger" onClick={() => deleteCoupon(c)}>Delete</button></div>}
          </div>
        ))}
      </div>
    </div>
  );
};
