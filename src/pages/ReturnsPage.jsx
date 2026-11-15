import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI, returnsAPI } from '../api';
import { useAuth } from '../contexts/useAuth';
import { Loading } from '../components/common';

export const ReturnsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reasons, setReasons] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setError('');
    try {
      const [{ data: requestData }, orderResponse] = await Promise.all([
        returnsAPI.getRequests(), isAuthenticated && !isAdmin ? ordersAPI.getOrders() : Promise.resolve({ data: [] }),
      ]);
      setRequests(requestData.results || requestData);
      const orderData = orderResponse.data?.results || orderResponse.data || [];
      setOrders(orderData.filter((order) => ['delivered', 'completed'].includes(order.order_status)));
    } catch (err) { setError(err.response?.data?.detail || 'Could not load return requests.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [isAuthenticated, isAdmin]);

  const submit = async (orderId) => {
    setBusy(true); setError(''); setNotice('');
    try { await returnsAPI.createRequest({ order_id: orderId, reason: reasons[orderId] || '' }); setNotice('Your return request was sent to the store team.'); setReasons({ ...reasons, [orderId]: '' }); await load(); }
    catch (err) { const data = err.response?.data; setError(data?.detail || data?.order_id?.[0] || data?.reason?.[0] || 'Could not submit this request.'); }
    finally { setBusy(false); }
  };
  const review = async (id, status) => {
    setBusy(true); setError('');
    try { await returnsAPI.reviewRequest(id, { status, admin_note: status === 'approved' ? 'Return approved by store admin.' : 'Return request rejected by store admin.' }); await load(); }
    catch (err) { setError(err.response?.data?.detail || 'Could not update the return request.'); }
    finally { setBusy(false); }
  };

  if (loading) return <Loading />;
  const activeOrderIds = new Set(requests.filter((row) => ['pending', 'approved', 'completed'].includes(row.status)).map((row) => Number(row.order)));
  return <main className="page returns-page">
    <header className="admin-page-heading"><div><p className="eyebrow">URBANTHREAD · RETURNS</p><h1>Returns & refunds</h1><p>Request a return for a delivered order and follow the review status.</p></div><Link className="admin-preview-link" to={isAdmin ? '/admin' : '/orders'}>{isAdmin ? 'Store dashboard' : 'My orders'}</Link></header>
    {error && <div className="error" role="alert">{error}</div>}{notice && <div className="success" role="status">{notice}</div>}
    {isAdmin ? <section className="admin-panel"><h2>Customer requests</h2>{requests.length ? <div className="admin-entity-list">{requests.map((row) => <article key={row.id}><span><strong>{row.order_number} · {row.status}</strong><small>{row.reason}</small>{row.admin_note && <small>{row.admin_note}</small>}</span>{row.status === 'pending' && <span className="admin-row-actions"><button disabled={busy} onClick={() => review(row.id, 'approved')}>Approve</button><button className="danger" disabled={busy} onClick={() => review(row.id, 'rejected')}>Reject</button></span>}</article>)}</div> : <p>No return requests have been submitted.</p>}</section> : !isAuthenticated ? <section className="admin-panel"><p>Open a delivered order tracking link in the same browser to submit a guest return request.</p></section> : <section className="admin-panel"><h2>Your delivered orders</h2>{orders.length ? <div className="admin-entity-list">{orders.map((order) => <article key={order.id}><span><strong><Link to={`/orders/${order.id}/track`}>{order.order_number}</Link> · {order.order_status}</strong><small>Total ৳{order.total_amount}</small>{activeOrderIds.has(Number(order.id)) && <small>Request status: {requests.find((row) => Number(row.order) === Number(order.id))?.status}</small>}</span>{!activeOrderIds.has(Number(order.id)) && <span className="return-request-form"><textarea aria-label={`Return reason for ${order.order_number}`} maxLength={1200} required value={reasons[order.id] || ''} onChange={(event) => setReasons({ ...reasons, [order.id]: event.target.value })} placeholder="Tell us why you want to return this order" /><button disabled={busy || !(reasons[order.id] || '').trim()} onClick={() => submit(order.id)}>Request return</button></span>}</article>)}</div> : <p>Return requests are available after an order is delivered.</p>}</section>}
  </main>;
};
