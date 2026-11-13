import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { authAPI, ordersAPI } from '../api';
import { Loading } from '../components/common';

const unwrap = (data) => Array.isArray(data) ? data : data?.results || [];
const money = (value) => `৳${Number(value || 0).toLocaleString('en-BD')}`;

export const AdminCustomerProfilePage = () => {
  const { customerId } = useParams();
  const location = useLocation();
  const returnTab = location.state?.adminTab || 'customers';
  const [customer, setCustomer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([authAPI.getUsers(), authAPI.getProfiles(), authAPI.getAddresses(), ordersAPI.getAdminOrders()])
      .then(([usersRes, profilesRes, addressesRes, ordersRes]) => {
        const selected = unwrap(usersRes.data).find((user) => Number(user.id) === Number(customerId));
        if (!selected || selected.is_staff || selected.is_superuser) {
          setError('Customer profile not found.');
          return;
        }
        setCustomer(selected);
        setProfile(unwrap(profilesRes.data).find((item) => Number(item.user) === Number(customerId)) || null);
        setAddresses(unwrap(addressesRes.data).filter((item) => Number(item.user) === Number(customerId)));
        setOrders(unwrap(ordersRes.data).filter((item) => Number(item.user?.id) === Number(customerId)));
      })
      .catch((err) => setError(err.response?.data?.detail || 'Could not load customer profile.'))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <Loading />;
  const displayName = customer ? [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.username : 'Customer';
  return <main className="page admin-dashboard-page">
    <header className="admin-page-heading"><div><p className="eyebrow">URBANTHREAD · CUSTOMER</p><h1>{displayName}</h1><p>Customer profile and order history.</p></div><Link className="admin-preview-link" to="/admin" state={{ adminTab: returnTab }}>← Store dashboard</Link></header>
    {error && <div className="error" role="alert">{error}</div>}
    {customer && <>
      <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">ACCOUNT DETAILS</span><h2>{displayName}</h2></div><span className="stock">{customer.is_active ? 'Active' : 'Blocked'}</span></div>
        <div className="admin-entity-list">
          <div><span><strong>Email</strong></span><span>{customer.email || '—'}</span></div>
          <div><span><strong>Username</strong></span><span>{customer.username || '—'}</span></div>
          <div><span><strong>Phone</strong></span><span>{profile?.phone || customer.phone || '—'}</span></div>
          <div><span><strong>Joined</strong></span><span>{customer.date_joined ? new Date(customer.date_joined).toLocaleDateString('en-GB') : '—'}</span></div>
          <div><span><strong>Gender</strong></span><span>{profile?.gender || '—'}</span></div>
          <div><span><strong>Date of birth</strong></span><span>{profile?.date_of_birth || '—'}</span></div>
          <div><span><strong>Default address</strong></span><span>{customer.address || '—'}</span></div>
        </div>
      </section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">DELIVERY</span><h2>Saved addresses</h2></div></div>
        {addresses.length ? <div className="admin-entity-list">{addresses.map((address) => <div key={address.id}><span><strong>{address.full_name}</strong><small>{address.phone}</small></span><span>{[address.address, address.city, address.state, address.pincode].filter(Boolean).join(', ')}</span></div>)}</div> : <p>No saved addresses.</p>}
      </section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">PURCHASES</span><h2>Orders ({orders.length})</h2></div></div>
        {orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td>{order.order_number}</td><td>{order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB') : '—'}</td><td>{money(order.total_amount)}</td><td>{order.payment_status || '—'}</td><td>{order.order_status || '—'}</td></tr>)}</tbody></table></div> : <p>No orders yet.</p>}
      </section>
    </>}
  </main>;
};
