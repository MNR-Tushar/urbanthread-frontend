import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, couponsAPI, ordersAPI, paymentsAPI, productsAPI, reviewsAPI } from '../api';
import { Loading } from '../components/common';

const unwrap = (value) => Array.isArray(value) ? value : value?.results || [];
const money = (value) => `৳${Number(value || 0).toLocaleString('en-BD')}`;
const safeText = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const salesLabel = (value, period) => {
  const raw = String(value ?? '');
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10) || '—';
  const options = period === 'monthly' ? { month: 'short' } : period === 'weekly' ? { month: 'short', day: 'numeric' } : { weekday: 'short' };
  return date.toLocaleDateString('en', { ...options, timeZone: 'Asia/Dhaka' });
};
const tabs = [['overview', 'Overview'], ['orders', 'Orders'], ['customers', 'Customers'], ['reviews', 'Reviews'], ['payments', 'Payments & refunds'], ['coupons', 'Coupons'], ['reports', 'Reports'], ['settings', 'Store settings']];

export const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [salesPeriod, setSalesPeriod] = useState('daily');
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [coupon, setCoupon] = useState({ code: '', discount: '', start_date: '', expiration_date: '', is_active: true });
  const [reportDates, setReportDates] = useState({ start: '', end: '' });
  const [refund, setRefund] = useState({ payment_id: '', refund_amount: '', refund_reason: '' });
  const [storeSettings, setStoreSettings] = useState({ id: null, store_name: 'UrbanThread', help_phone: '', social_facebook: '', social_instagram: '', social_youtube: '', dhaka_delivery_fee: '70', outside_delivery_fee: '130', store_logo: null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setError('');
    try {
      const [dash, orderRows, customerRows, reviewRows, paymentRows, couponRows, settingsRows] = await Promise.all([
        ordersAPI.getAdminDashboard({ period: salesPeriod }), ordersAPI.getAdminOrders(), authAPI.getUsers(), reviewsAPI.getReviews(), paymentsAPI.getAllPayments(), couponsAPI.getCoupons(), productsAPI.getStoreSettings(),
      ]);
      setDashboard(dash.data); setOrders(unwrap(orderRows.data)); setCustomers(unwrap(customerRows.data));
      setReviews(unwrap(reviewRows.data)); setPayments(unwrap(paymentRows.data)); setCoupons(unwrap(couponRows.data));
      const setting = unwrap(settingsRows.data)[0];
      if (setting) setStoreSettings({ ...setting, dhaka_delivery_fee: String(setting.dhaka_delivery_fee), outside_delivery_fee: String(setting.outside_delivery_fee), store_logo: null });
    } catch (err) { setError(err.response?.data?.detail || 'Could not load admin data.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [salesPeriod]);

  const filteredOrders = useMemo(() => orders.filter((order) => !statusFilter || order.order_status === statusFilter), [orders, statusFilter]);
  const updateStatus = async (id, value) => {
    setBusy(true); setError('');
    try { await ordersAPI.updateAdminOrderStatus(id, value); await load(); setNotice('Order status updated.'); }
    catch (err) { setError(err.response?.data?.detail || 'Could not update order status.'); }
    finally { setBusy(false); }
  };
  const removeReview = async (id) => {
    if (!window.confirm('Delete this customer review?')) return;
    setBusy(true); try { await reviewsAPI.deleteReview(id); await load(); setNotice('Review deleted.'); } catch { setError('Could not delete review.'); } finally { setBusy(false); }
  };
  const toggleReviewApproval = async (review) => {
    setBusy(true); setError('');
    try { await reviewsAPI.updateReview(review.id, { is_approved: !review.is_approved }); await load(); setNotice(review.is_approved ? 'Review hidden from the storefront.' : 'Review approved and published.'); }
    catch (err) { setError(err.response?.data?.detail || 'Could not update review approval.'); }
    finally { setBusy(false); }
  };
  const saveCoupon = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await couponsAPI.createCoupon({ ...coupon, discount: Number(coupon.discount) }); setCoupon({ code: '', discount: '', start_date: '', expiration_date: '', is_active: true }); await load(); setNotice('Coupon created.'); }
    catch (err) { setError(err.response?.data?.detail || 'Could not create coupon.'); }
    finally { setBusy(false); }
  };
  const deleteCoupon = async (id) => {
    try { await couponsAPI.deleteCoupon(id); await load(); setNotice('Coupon deleted.'); } catch { setError('Could not delete coupon.'); }
  };
  const setCustomerAccess = async (customer) => {
    setBusy(true); setError('');
    try { await authAPI.updateUserById(customer.id, { is_active: !customer.is_active }); await load(); setNotice(customer.is_active ? 'Customer account blocked.' : 'Customer account restored.'); }
    catch (err) { setError(err.response?.data?.detail || 'Could not update customer access.'); }
    finally { setBusy(false); }
  };
  const issueRefund = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const result = await paymentsAPI.refundPayment({ ...refund, payment_id: Number(refund.payment_id), refund_amount: Number(refund.refund_amount) }); if (result.data.success) { setNotice(result.data.message); setRefund({ payment_id: '', refund_amount: '', refund_reason: '' }); await load(); } else setError(result.data.error || 'Refund could not be started.'); }
    catch (err) { setError(err.response?.data?.detail || err.response?.data?.error || 'Refund could not be started.'); }
    finally { setBusy(false); }
  };
  const saveSettings = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = new FormData();
      Object.entries(storeSettings).forEach(([key, value]) => { if (key !== 'id' && value !== null && value !== '') payload.append(key, value); });
      const { data } = await productsAPI.saveStoreSettings(storeSettings.id, payload);
      setStoreSettings({ ...data, dhaka_delivery_fee: String(data.dhaka_delivery_fee), outside_delivery_fee: String(data.outside_delivery_fee), store_logo: null });
      setNotice('Store settings saved.');
    } catch (err) { setError(err.response?.data?.detail || 'Could not save store settings.'); }
    finally { setBusy(false); }
  };
  const downloadCsv = () => {
    const rows = orders.filter((o) => (!reportDates.start || o.created_at.slice(0, 10) >= reportDates.start) && (!reportDates.end || o.created_at.slice(0, 10) <= reportDates.end));
    const csv = [['Order', 'Order date', 'Order time (Dhaka)', 'Customer', 'Phone', 'Address name', 'Address', 'City', 'State', 'Postcode', 'Units sold', 'Unique products', 'Shipping fee', 'Payment status', 'Order status', 'Total'], ...rows.map((o) => {
      const address = o.shipping_address || {};
      const placedAt = new Date(o.created_at);
      const orderDate = placedAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
      const orderTime = placedAt.toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return [o.order_number, orderDate, orderTime, o.user?.email, address.phone || o.user?.phone, address.full_name, address.address, address.city, address.state, address.pincode, (o.items || []).reduce((count, item) => count + Number(item.quantity || 0), 0), new Set((o.items || []).map((item) => item.product?.id).filter(Boolean)).size, o.shipping_fee, o.payment_status, o.order_status, o.total_amount];
    })].map((row) => row.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'urbanthread-sales-report.csv'; link.click(); URL.revokeObjectURL(url);
  };
  if (loading) return <Loading />;
  const bars = dashboard?.daily_sales || [];
  const maxSales = Math.max(1, ...bars.map((day) => Number(day.sales || 0)));
  return <main className="page admin-dashboard-page">
    <header className="admin-page-heading"><div><p className="eyebrow">URBANTHREAD · ADMIN</p><h1>Store dashboard</h1><p>Orders, customers, payments and store activity.</p></div><Link className="admin-preview-link" to="/inventory">Products & inventory →</Link></header>
    {error && <div className="error" role="alert">{error}</div>}{notice && <div className="success" role="status">{notice}</div>}
    <div className="admin-tabs" role="tablist">{tabs.map(([id, name]) => <button type="button" key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setNotice(''); }}>{name}</button>)}</div>
    {tab === 'overview' && <>
      <div className="admin-stat-grid"><div className="admin-stat-card"><span>TODAY SALES</span><strong>{money(dashboard?.today_sales)}</strong></div><div className="admin-stat-card"><span>ALL ORDERS</span><strong>{dashboard?.total_orders || 0}</strong></div><div className="admin-stat-card"><span>PENDING</span><strong>{dashboard?.pending_orders || 0}</strong></div><div className="admin-stat-card"><span>CUSTOMERS</span><strong>{dashboard?.customers || 0}</strong></div></div>
      <div className="admin-dashboard-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">SALES ANALYTICS</span><h2>Sales activity</h2></div><select aria-label="Sales chart period" value={salesPeriod} onChange={(e) => setSalesPeriod(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div><div className="admin-sales-chart">{bars.map((day) => <div className="admin-sales-bar" key={day.day} title={`${day.day}: ${money(day.sales)}`}><div style={{ height: `${Math.max(5, Number(day.sales || 0) / maxSales * 100)}%` }} /><small>{salesLabel(day.day, salesPeriod)}</small></div>)}</div></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">STOCK ALERTS</span><h2>Low stock</h2></div></div>{dashboard?.low_stock?.length ? <div className="admin-entity-list">{dashboard.low_stock.map((item) => <div key={item.id}><span><strong>{item.product__product_name}</strong><small>{item.color__color} · {item.size__size_type}</small></span><span className="stock low-stock">{item.quantity} left</span></div>)}</div> : <p>All variants have sufficient stock.</p>}</section>
      <section className="admin-panel admin-panel-wide"><div className="admin-panel-heading"><div><span className="admin-step">LATEST ACTIVITY</span><h2>Recent orders</h2></div><button className="admin-quiet-button" onClick={() => setTab('orders')}>View all orders</button></div><OrderTable rows={(dashboard?.recent_orders || []).slice(0, 6)} onStatus={updateStatus} busy={busy} /></section></div>
    </>}
    {tab === 'orders' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">ORDER MANAGEMENT</span><h2>All orders</h2></div><label className="admin-inline-filter">Status<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{['pending', 'processing', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label></div><OrderTable rows={filteredOrders} onStatus={updateStatus} busy={busy} /></section>}
    {tab === 'customers' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">CUSTOMER MANAGEMENT</span><h2>Registered customers</h2></div><span className="collection-count">{customers.filter((c) => !c.is_staff).length} customers</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Access</th></tr></thead><tbody>{customers.filter((c) => !c.is_staff && !c.is_superuser).map((c) => <tr key={c.id}><td>{c.first_name || c.username} {c.last_name}</td><td>{c.email}</td><td>{c.phone || '—'}</td><td>{orders.filter((o) => o.user?.id === c.id).length}</td><td><button className="admin-quiet-button" disabled={busy} onClick={() => setCustomerAccess(c)}>{c.is_active ? 'Block' : 'Unblock'}</button></td></tr>)}</tbody></table></div></section>}
    {tab === 'reviews' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">REVIEW MODERATION</span><h2>Customer reviews</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Approval</th><th>Action</th></tr></thead><tbody>{reviews.map((r) => <tr key={r.id}><td>{r.product_detail?.product_name || r.product?.product_name || r.product}</td><td>{r.user?.username || r.user?.email}</td><td>{r.rating}/5</td><td>{r.review_text}</td><td><button className="admin-quiet-button" disabled={busy} onClick={() => toggleReviewApproval(r)}>{r.is_approved ? 'Approved · hide' : 'Pending · approve'}</button></td><td><button className="danger" disabled={busy} onClick={() => removeReview(r.id)}>Delete</button></td></tr>)}</tbody></table></div></section>}
    {tab === 'payments' && <div className="admin-dashboard-grid"><section className="admin-panel admin-panel-wide"><div className="admin-panel-heading"><div><span className="admin-step">TRANSACTIONS</span><h2>Payment history</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Transaction</th><th>Customer</th><th>Order</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payments.map((p) => <tr key={p.id}><td>{p.transaction_id}</td><td>{p.user}</td><td>{p.order?.order_number}</td><td>{p.payment_method_display || p.payment_method}</td><td>{money(p.amount)}</td><td>{p.status_display || p.status}</td></tr>)}</tbody></table></div></section><section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">RETURNS & REFUNDS</span><h2>Start a refund</h2></div></div><form className="admin-form-grid" onSubmit={issueRefund}><label className="admin-field-wide">Payment<select required value={refund.payment_id} onChange={(e) => { const p = payments.find((item) => String(item.id) === e.target.value); setRefund({ ...refund, payment_id: e.target.value, refund_amount: p?.amount || '' }); }}><option value="">Choose payment</option>{payments.filter((p) => p.status === 'completed').map((p) => <option key={p.id} value={p.id}>{p.transaction_id} · {money(p.amount)}</option>)}</select></label><label>Refund amount<input required type="number" min="0.01" step="0.01" value={refund.refund_amount} onChange={(e) => setRefund({ ...refund, refund_amount: e.target.value })} /></label><label className="admin-field-wide">Reason<input required value={refund.refund_reason} onChange={(e) => setRefund({ ...refund, refund_reason: e.target.value })} /></label><div className="admin-form-actions"><button className="btn-submit" disabled={busy}>Process refund</button></div></form><small>Refund processing requires a payment provider refund configuration.</small></section></div>}
    {tab === 'coupons' && <div className="admin-dashboard-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">PROMOTIONS</span><h2>Create coupon</h2></div></div><form className="admin-form-grid" onSubmit={saveCoupon}><label>Promo code<input required maxLength="10" value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} /></label><label>Discount (%)<input required type="number" min="0.01" max="100" step="0.01" value={coupon.discount} onChange={(e) => setCoupon({ ...coupon, discount: e.target.value })} /></label><label>Starts<input type="date" value={coupon.start_date} onChange={(e) => setCoupon({ ...coupon, start_date: e.target.value })} /></label><label>Expires<input required type="date" value={coupon.expiration_date} onChange={(e) => setCoupon({ ...coupon, expiration_date: e.target.value })} /></label><div className="admin-form-actions"><button className="btn-submit" disabled={busy}>Create coupon</button></div></form></section><section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">ACTIVE PROMOS</span><h2>Coupons</h2></div></div><div className="admin-entity-list">{coupons.map((c) => <div key={c.id}><span><strong>{c.code} · {c.discount}%</strong><small>Expires {c.expiration_date} · {c.is_active ? 'Active' : 'Inactive'}</small></span><button className="danger" onClick={() => deleteCoupon(c.id)}>Delete</button></div>)}</div></section></div>}
    {tab === 'reports' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">REPORTS & ANALYTICS</span><h2>Sales report</h2></div></div><div className="admin-form-grid"><label>From<input type="date" value={reportDates.start} onChange={(e) => setReportDates({ ...reportDates, start: e.target.value })} /></label><label>To<input type="date" value={reportDates.end} onChange={(e) => setReportDates({ ...reportDates, end: e.target.value })} /></label><div className="admin-form-actions"><button className="btn-submit" type="button" onClick={downloadCsv}>Download orders CSV</button></div></div><p>CSV includes delivery address, customer phone, item quantities, shipping fee, payment and order totals. Product costs are not stored, so profit cannot be calculated yet.</p></section>}
    {tab === 'settings' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">STORE CONFIGURATION</span><h2>General & delivery settings</h2></div></div><form className="admin-form-grid" onSubmit={saveSettings}><label>Store name<input required maxLength="120" value={storeSettings.store_name} onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })} /></label><label>Help line<input value={storeSettings.help_phone} onChange={(e) => setStoreSettings({ ...storeSettings, help_phone: e.target.value })} /></label><label>Facebook URL<input type="url" value={storeSettings.social_facebook} onChange={(e) => setStoreSettings({ ...storeSettings, social_facebook: e.target.value })} /></label><label>Instagram URL<input type="url" value={storeSettings.social_instagram} onChange={(e) => setStoreSettings({ ...storeSettings, social_instagram: e.target.value })} /></label><label>YouTube URL<input type="url" value={storeSettings.social_youtube} onChange={(e) => setStoreSettings({ ...storeSettings, social_youtube: e.target.value })} /></label><label>Dhaka delivery fee (BDT)<input type="number" min="0" step="0.01" value={storeSettings.dhaka_delivery_fee} onChange={(e) => setStoreSettings({ ...storeSettings, dhaka_delivery_fee: e.target.value })} /></label><label>Outside Dhaka fee (BDT)<input type="number" min="0" step="0.01" value={storeSettings.outside_delivery_fee} onChange={(e) => setStoreSettings({ ...storeSettings, outside_delivery_fee: e.target.value })} /></label><label className="admin-field-wide">Store logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setStoreSettings({ ...storeSettings, store_logo: e.target.files?.[0] || null })} /></label><div className="admin-form-actions"><button className="btn-submit" disabled={busy}>Save settings</button></div></form><p>Delivery rates are saved for configuration; checkout charging will require connecting these settings to the order total.</p></section>}
  </main>;
};

function OrderTable({ rows, onStatus, busy }) {
  const printInvoice = (order) => {
    const address = order.shipping_address || {};
    const popup = window.open('', '_blank', 'width=850,height=700');
    if (!popup) return;
    const itemRows = (order.items || []).map((item) => `<tr><td>${safeText(item.product?.product_name)}</td><td>${safeText(item.color?.color)} / ${safeText(item.size?.size_type)}</td><td>${item.quantity}</td><td>৳${safeText(item.price)}</td><td>৳${safeText(item.subtotal ?? Number(item.price) * item.quantity)}</td></tr>`).join('');
    popup.document.write(`<!doctype html><html><head><title>Invoice ${safeText(order.order_number)}</title><style>body{font:14px Arial,sans-serif;color:#222;max-width:800px;margin:40px auto}header{display:flex;justify-content:space-between;border-bottom:2px solid #536b4d;padding-bottom:16px}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin:25px 0}th,td{text-align:left;padding:10px;border-bottom:1px solid #ddd}tfoot{text-align:right;font-size:18px}.muted{color:#666}@media print{button{display:none}}</style></head><body><header><div><h1>UrbanThread · Invoice</h1><div>Order ${safeText(order.order_number)}</div></div><div>${new Date(order.created_at).toLocaleDateString()}<br>${safeText(order.order_status)} · ${safeText(order.payment_status)}</div></header><h3>Ship to</h3><p>${safeText(address.full_name || order.user?.first_name || order.user?.username)}<br>${safeText(address.phone || order.user?.phone)}<br>${safeText(address.address)}<br>${safeText(address.city)} ${safeText(address.state)} ${safeText(address.pincode)}</p><table><thead><tr><th>Product</th><th>Variant</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>${itemRows}</tbody></table><p class="muted">Payment status: ${safeText(order.payment_status)}</p><h2 style="text-align:right">Total: ৳${safeText(order.total_amount)}</h2><button onclick="window.print()">Print / Save PDF</button></body></html>`);
    popup.document.close();
  };
  const statuses = ['pending', 'confirmed', 'packaging', 'shipped', 'delivered', 'cancelled', 'processing', 'completed'];
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Date</th><th>Time (Dhaka)</th><th>Customer</th><th>Units</th><th>Total</th><th>Payment</th><th>Status</th><th>Invoice</th></tr></thead><tbody>{rows.map((o) => <tr key={o.id}><td>{o.order_number}</td><td>{new Date(o.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' })}</td><td>{new Date(o.created_at).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' })}</td><td>{o.user?.first_name || o.user?.username}<small>{o.user?.email}<br />{o.shipping_address?.phone || o.user?.phone}</small></td><td>{(o.items || []).reduce((count, item) => count + Number(item.quantity || 0), 0)}</td><td>{money(o.total_amount)}</td><td>{o.payment_status}</td><td><select disabled={busy} value={o.order_status} onChange={(e) => onStatus(o.id, e.target.value)}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></td><td><button className="admin-quiet-button" onClick={() => printInvoice(o)}>Invoice</button></td></tr>)}</tbody></table></div>;
}
