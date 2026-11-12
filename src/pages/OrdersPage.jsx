import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ordersAPI } from '../api';
import { useAuth } from '../contexts/useAuth';
import { Loading } from '../components/common';

export const OrdersPage = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState({ start_date: '', end_date: '', format: 'csv' });
  const [reportNotice, setReportNotice] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchOrders = async () => {
      try {
        const res = await ordersAPI.getOrders();
        setOrders(res.data.results || res.data);
      } catch {
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated]);

  const cancelOrder = async (id) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await ordersAPI.cancelOrder(id);
      const res = await ordersAPI.getOrders();
      setOrders(res.data.results || res.data);
    } catch {
      setError('Failed to cancel order');
    }
  };

  const exportReport = async (event) => {
    event.preventDefault(); setReportLoading(true); setError(null); setReportNotice('');
    try {
      const { data } = await ordersAPI.exportSalesReport(report);
      setReportNotice(`${data.message}. Task ID: ${data.task_id}`);
    } catch (err) { setError(err.response?.data?.error || err.response?.data?.detail || 'Could not start the sales report.'); }
    finally { setReportLoading(false); }
  };

  if (loading) return <Loading />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page orders-page">
      <h1>My Orders</h1>
      {location.state?.orderPlaced && <div className="success" role="status">Order {location.state.orderPlaced} has been placed.</div>}
      {user?.is_staff && <section className="admin-panel sales-report-panel"><div className="admin-panel-heading"><div><span className="admin-step">ADMIN · REPORTS</span><h2>Export sales report</h2></div></div><form className="admin-form-grid" onSubmit={exportReport}><label>From<input type="date" value={report.start_date} onChange={(e) => setReport({ ...report, start_date: e.target.value })} /></label><label>To<input type="date" value={report.end_date} onChange={(e) => setReport({ ...report, end_date: e.target.value })} /></label><label>Format<select value={report.format} onChange={(e) => setReport({ ...report, format: e.target.value })}><option value="csv">CSV spreadsheet</option><option value="pdf">PDF document</option></select></label><div className="admin-form-actions"><button className="btn-submit" disabled={reportLoading}>{reportLoading ? 'Requesting…' : 'Generate report'}</button></div></form>{reportNotice && <div className="success" role="status">{reportNotice}</div>}</section>}
      {!isAuthenticated ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2>Please log in to view your orders</h2>
          <a href="/login" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '600' }}>Sign in here</a>
        </div>
      ) : (
        <>
          {orders.length === 0 ? (
            <div className="empty-orders">No orders found</div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>Order #{order.order_number}</h3>
                    <span className={`status ${order.order_status}`}>{order.order_status}</span>
                  </div>
                  <p>Total: ৳{order.total_amount}</p>
                  <p>Payment: {order.payment_status}</p>
                  <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  <div className="order-items">
                    {order.items?.map((item) => (
                      <div key={item.id} className="order-item">
                        {item.product?.product_name} - Qty: {item.quantity} - ৳{item.price}
                      </div>
                    ))}
                  </div>
                  {order.order_status === 'pending' && (
                    <button onClick={() => cancelOrder(order.id)} className="btn-cancel">Cancel Order</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
