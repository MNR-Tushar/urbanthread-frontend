import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { paymentsAPI } from '../api';
import { useAuth } from '../contexts/useAuth';
import { Paginated } from '../components/Paginated';

export const PaymentsPage = () => {
  const location = useLocation();
  const [orderNumber, setOrderNumber] = useState(location.state?.orderNumber || '');
  const [paymentMethod, setPaymentMethod] = useState(location.state?.paymentMethod || 'cash_on_delivery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [payments, setPayments] = useState([]);
  const [checkoutNotice] = useState(location.state?.checkoutError || '');
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [paymentLogs, setPaymentLogs] = useState({});
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundForm, setRefundForm] = useState({ refund_amount: '', refund_reason: '' });
  const [refundBusy, setRefundBusy] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const { isAuthenticated, user } = useAuth();
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

  useEffect(() => {
    if (!isAuthenticated) return;
    paymentsAPI.getPayments().then(({ data }) => setPayments(data.results || data)).catch(() => {});
  }, [isAuthenticated]);

  const initiatePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(null);
    try {
      const res = await paymentsAPI.initiatePayment({
        order_number: orderNumber,
        payment_method: paymentMethod,
      });
      setSuccess(res.data);
      if (paymentMethod === 'sslcommerz' && res.data.gateway_url) {
        window.location.assign(res.data.gateway_url);
        return;
      }
      const { data: history } = await paymentsAPI.getPayments();
      setPayments(history.results || history);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentLogs = async (payment) => {
    if (expandedPayment === payment.id) { setExpandedPayment(null); return; }
    setExpandedPayment(payment.id);
    if (paymentLogs[payment.id]) return;
    try { const { data } = await paymentsAPI.getPaymentLogs(payment.id); setPaymentLogs((current) => ({ ...current, [payment.id]: data.results || data })); }
    catch { setPaymentLogs((current) => ({ ...current, [payment.id]: [] })); }
  };

  const submitRefund = async (event) => {
    event.preventDefault(); if (!refundTarget) return;
    setRefundBusy(true); setActionNotice(''); setError('');
    try {
      const { data } = await paymentsAPI.refundPayment({ payment_id: refundTarget.id, refund_amount: Number(refundForm.refund_amount), refund_reason: refundForm.refund_reason });
      setActionNotice(data.message || data.error || 'Refund request processed.'); setRefundTarget(null); setRefundForm({ refund_amount: '', refund_reason: '' });
      const { data: history } = await paymentsAPI.getPayments(); setPayments(history.results || history);
    } catch (err) { setError(err.response?.data?.error || err.response?.data?.detail || 'Refund could not be processed.'); }
    finally { setRefundBusy(false); }
  };

  return (
    <div className="page payments-page">
      <h1>Payments</h1>
      {!isAuthenticated ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2>Please log in to make payments</h2>
          <a href="/login" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '600' }}>Sign in here</a>
        </div>
      ) : (
        <>
          {checkoutNotice && <div className="error" role="alert">{checkoutNotice}</div>}
          {error && <div className="error">{error}</div>}
          {actionNotice && <div className="success" role="status">{actionNotice}</div>}
          {success && (
            <div className="success">
              <h3>Payment Initiated!</h3>
              <p>Transaction ID: {success.transaction_id}</p>
              <p>Order: {success.order_number}</p>
                <p>Amount: ৳{success.amount}</p>
              {success.gateway_url && (
                <a href={success.gateway_url} className="btn-pay" style={{ display: 'inline-block', marginTop: '1rem' }}>
                  Pay Now via SSLCommerz
                </a>
              )}
            </div>
          )}
          <form onSubmit={initiatePayment} className="payment-form">
            <h3>Initiate New Payment</h3>
            <div className="form-group">
              <label>Order Number</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Paste the order number from My Orders"
                required
              />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="sslcommerz">SSLCommerz (Online Payment)</option>
              </select>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Processing...' : 'Initiate Payment'}
            </button>
          </form>
          <section className="payment-history">
            <h2>Payment history</h2>
            {payments.length ? <Paginated items={payments} pageSize={8} label="payments">{(pagePayments) => pagePayments.map((payment) => <article className="payment-history-item" key={payment.id}>
              <div><strong>{payment.order?.order_number || payment.transaction_id}</strong><p>{payment.payment_method_display || payment.payment_method}</p></div>
              <div><strong>৳{payment.amount}</strong><span className={`status ${payment.status}`}>{payment.status_display || payment.status}</span></div>
              <div className="payment-actions">
                {payment.status !== 'completed' && <button type="button" className="btn-secondary" onClick={() => { setOrderNumber(payment.order?.order_number || ''); setPaymentMethod(payment.payment_method === 'sslcommerz' ? 'sslcommerz' : 'cash_on_delivery'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Continue payment</button>}
                <button type="button" className="payment-logs-toggle" onClick={() => togglePaymentLogs(payment)}>{expandedPayment === payment.id ? 'Hide activity' : 'Payment activity'}</button>
                {isAdmin && payment.status === 'completed' && <button type="button" className="payment-logs-toggle danger" onClick={() => { setRefundTarget(payment); setRefundForm({ refund_amount: payment.amount, refund_reason: '' }); }}>Refund</button>}
              </div>
              {expandedPayment === payment.id && <div className="payment-log-list">{paymentLogs[payment.id]?.length ? paymentLogs[payment.id].map((log) => <p key={log.id}><strong>{log.event_type?.replaceAll('_', ' ') || 'Payment update'}</strong><span>{new Date(log.created_at).toLocaleString()}</span></p>) : <small>No payment activity recorded.</small>}</div>}
            </article>)}</Paginated> : <p>No payments yet. <Link to="/cart">Place an order</Link> to get started.</p>}
          </section>
          {refundTarget && <div className="refund-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRefundTarget(null); }}><form className="refund-dialog" onSubmit={submitRefund} role="dialog" aria-modal="true" aria-labelledby="refund-title"><button type="button" className="refund-close" aria-label="Close" onClick={() => setRefundTarget(null)}>×</button><span className="admin-step">PAYMENT · {refundTarget.transaction_id}</span><h2 id="refund-title">Request a refund</h2><p>This request is sent to the payment provider for processing.</p><label>Refund amount (BDT)<input type="number" min="0.01" max={refundTarget.amount} step="0.01" required value={refundForm.refund_amount} onChange={(e) => setRefundForm({ ...refundForm, refund_amount: e.target.value })} /></label><label>Reason<textarea required maxLength="500" rows="3" value={refundForm.refund_reason} onChange={(e) => setRefundForm({ ...refundForm, refund_reason: e.target.value })} /></label><button className="btn-submit" disabled={refundBusy}>{refundBusy ? 'Sending…' : 'Submit refund request'}</button></form></div>}
        </>
      )}
    </div>
  );
};
