import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordersAPI, returnsAPI } from '../api';
import { Loading } from '../components/common';

const stages = [
  ['pending', 'Order placed'],
  ['confirmed', 'Confirmed'],
  ['packaging', 'Packaging'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
];
const progressFor = (status) => ({ pending: 0, confirmed: 1, processing: 1, packaging: 2, shipped: 3, delivered: 4, completed: 4 })[status] ?? -1;
const formatDate = (value) => value ? new Date(value).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' }) : '';

export const OrderTrackingPage = ({ adminView = false }) => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState({ courier_name: '', courier_tracking_id: '', courier_tracking_url: '' });
  const [notice, setNotice] = useState('');
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    let active = true;
    (adminView ? ordersAPI.getAdminOrders().then(({ data }) => {
      const list = data?.results || data || [];
      const match = list.find((item) => String(item.id) === String(orderId));
      if (!match) throw Object.assign(new Error('Order not found'), { response: { status: 404 } });
      return { data: match };
    }) : ordersAPI.getOrder(orderId)).then(({ data }) => { if (active) { setOrder(data); setTracking({ courier_name: data.courier_name || '', courier_tracking_id: data.courier_tracking_id || '', courier_tracking_url: data.courier_tracking_url || '' }); returnsAPI.getRequests().then((response) => { if (active) setReturnRequests(response.data.results || response.data); }).catch(() => {}); } })
      .catch((err) => { if (active) setError(err.response?.status === 404 ? 'Order not found.' : 'Could not load this order tracking information.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId, adminView]);

  if (loading) return <Loading />;
  if (!order) return <main className="page"><div className="error">{error}</div><Link to="/orders">Back to my orders</Link></main>;

  const progress = progressFor(order.order_status);
  const events = order.status_history?.length ? order.status_history : [{ status: 'pending', note: 'Order placed.', created_at: order.created_at }];
  const address = order.shipping_address || {};
  const saveTracking = async (event) => {
    event.preventDefault();
    try { const { data } = await ordersAPI.updateAdminTracking(order.id, tracking); setOrder(data); setNotice('Courier tracking saved.'); }
    catch (err) { setError(err.response?.data?.detail || 'Could not save courier tracking.'); }
  };
  const downloadInvoice = async () => {
    const { data } = await ordersAPI.getInvoice(order.id);
    const url = URL.createObjectURL(data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${order.order_number}.pdf`; anchor.click(); URL.revokeObjectURL(url);
  };
  const submitReturnRequest = async (event) => {
    event.preventDefault();
    try { await returnsAPI.createRequest({ order_id: order.id, reason: returnReason }); setReturnReason(''); const { data } = await returnsAPI.getRequests(); setReturnRequests(data.results || data); }
    catch (err) { setError(err.response?.data?.detail || err.response?.data?.order_id?.[0] || 'Could not submit a return request.'); }
  };
  return <main className="page order-tracking-page">
    <Link className="order-back-link" to={adminView ? '/admin' : '/orders'} state={adminView ? { adminTab: 'orders' } : undefined}>{adminView ? '← Store dashboard' : '← My orders'}</Link>
    <header className="order-tracking-heading"><div><p className="eyebrow">ORDER TRACKING</p><h1>{order.order_number}</h1><p>Placed {formatDate(order.created_at)}</p></div><span className={`status ${order.order_status}`}>{order.order_status}</span></header>
    {order.order_status === 'cancelled' ? <section className="order-tracking-cancelled"><strong>Order cancelled</strong><p>This order is no longer being prepared for delivery.</p></section> : <section className="order-tracking-card"><h2>Delivery progress</h2><ol className="order-tracking-steps">{stages.map(([status, title], index) => <li key={status} className={index < progress ? 'complete' : index === progress ? 'current' : ''}><span className="tracking-step-dot">{index < progress ? '✓' : index + 1}</span><strong>{title}</strong></li>)}</ol><p className="tracking-current-status">Current status: <strong>{order.order_status}</strong><span>Updated {formatDate(order.updated_at)}</span></p></section>}
    <div className="order-tracking-columns"><section className="order-tracking-card"><h2>Tracking history</h2><ol className="tracking-history">{events.map((event) => <li key={event.id || `${event.status}-${event.created_at}`}><span className="tracking-history-dot" /><div><strong>{event.status_display || event.status}</strong><p>{event.note || 'Order status updated.'}</p><time>{formatDate(event.created_at)}</time></div></li>)}</ol></section>
      <section className="order-tracking-card"><h2>Delivery details</h2><p><strong>{address.full_name || order.user?.first_name || order.user?.username}</strong></p><p>{address.address || 'Address not available'}{address.city ? `, ${address.city}` : ''}{address.state ? `, ${address.state}` : ''} {address.pincode || ''}</p><p>Phone: {address.phone || order.user?.phone || 'Not provided'}</p><p>Payment: {order.payment_status}</p><p>Total: ৳{order.total_amount}</p>{order.courier_name && <p>Courier: <strong>{order.courier_name}</strong></p>}{order.courier_tracking_id && <p>Tracking ID: <strong>{order.courier_tracking_id}</strong>{order.courier_tracking_url && <> · <a href={order.courier_tracking_url} target="_blank" rel="noreferrer">Track shipment</a></>}</p>}<button className="admin-quiet-button" type="button" onClick={downloadInvoice}>Download invoice PDF</button></section></div>
      {adminView && <section className="order-tracking-card"><h2>Courier tracking details</h2><form className="admin-form-grid" onSubmit={saveTracking}><label>Courier<input value={tracking.courier_name} onChange={(e) => setTracking({ ...tracking, courier_name: e.target.value })} placeholder="Pathao / Steadfast" /></label><label>Tracking ID<input value={tracking.courier_tracking_id} onChange={(e) => setTracking({ ...tracking, courier_tracking_id: e.target.value })} /></label><label className="admin-field-wide">Tracking URL<input type="url" value={tracking.courier_tracking_url} onChange={(e) => setTracking({ ...tracking, courier_tracking_url: e.target.value })} /></label><div className="admin-form-actions"><button className="btn-submit">Save courier details</button>{notice && <span className="success">{notice}</span>}</div></form></section>}
      {!adminView && ['delivered', 'completed'].includes(order.order_status) && <section className="order-tracking-card"><h2>Returns & refunds</h2>{returnRequests.some((row) => Number(row.order) === Number(order.id) && ['pending', 'approved', 'completed'].includes(row.status)) ? <p>Return request status: <strong>{returnRequests.find((row) => Number(row.order) === Number(order.id) && ['pending', 'approved', 'completed'].includes(row.status))?.status}</strong></p> : <form className="admin-form-grid" onSubmit={submitReturnRequest}><label className="admin-field-wide">Reason for return<textarea required maxLength={1200} rows="3" value={returnReason} onChange={(event) => setReturnReason(event.target.value)} /></label><div className="admin-form-actions"><button className="btn-submit">Request return</button></div></form>}</section>}
      <section className="order-tracking-card"><h2>Items in this order</h2><div className="tracking-order-items">{(order.items || []).map((item) => <div key={item.id}><span className="tracking-product"><Link to={item.product?.slug ? `/product/${item.product.slug}` : '/products'}>{item.product?.images?.[0]?.image && <img src={item.product.images[0].image} alt="" />}{item.product?.product_name || 'Product'}</Link><small>{item.color?.color} / {item.size?.size_type} × {item.quantity}</small></span><strong>৳{item.subtotal}</strong></div>)}</div></section>
  </main>;
};
