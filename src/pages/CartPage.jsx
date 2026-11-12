import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, cartAPI, couponsAPI, ordersAPI, paymentsAPI, productsAPI } from '../api';
import { Loading } from '../components/common';

const asList = (data) => data?.results || data || [];

export const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [deliveryRates, setDeliveryRates] = useState({ dhaka_delivery_fee: 70, outside_delivery_fee: 130 });
  const [addressId, setAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reloadCart = async () => {
    const { data } = await cartAPI.getCart();
    setCart(data);
  };

  useEffect(() => {
    Promise.all([cartAPI.getCart(), authAPI.getAddresses(), productsAPI.getStoreSettings().catch(() => null)])
      .then(([cartRes, addressRes, settingsRes]) => {
        setCart(cartRes.data);
        const list = asList(addressRes.data);
        setAddresses(list);
        const config = settingsRes ? asList(settingsRes.data)[0] : null;
        if (config) setDeliveryRates({ dhaka_delivery_fee: Number(config.dhaka_delivery_fee), outside_delivery_fee: Number(config.outside_delivery_fee) });
        if (list.length) setAddressId(String(list[0].id));
      })
      .catch((err) => setError(err.response?.data?.detail || 'Could not load your cart. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const changeQuantity = async (itemId, quantity) => {
    setBusy(true); setError('');
    try { await cartAPI.updateItem({ item_id: itemId, quantity }); await reloadCart(); }
    catch (err) { setError(err.response?.data?.error || 'Could not update this item.'); }
    finally { setBusy(false); }
  };

  const removeItem = async (itemId) => {
    setBusy(true); setError('');
    try { await cartAPI.removeItem(itemId); await reloadCart(); }
    catch (err) { setError(err.response?.data?.error || 'Could not remove this item.'); }
    finally { setBusy(false); }
  };

  const validateCoupon = async (event) => {
    event.preventDefault(); setError(''); setCoupon(null);
    try { const { data } = await couponsAPI.validateCoupon(couponCode.trim()); setCoupon(data); }
    catch (err) { setError(err.response?.data?.error || 'This coupon could not be applied.'); }
  };

  const checkout = async () => {
    if (!addressId) { setError('Add a delivery address from your profile before checkout.'); return; }
    setBusy(true); setError('');
    try {
      const { data: order } = await ordersAPI.createOrder({
        address_id: Number(addressId), payment_method: paymentMethod, coupon_code: coupon?.valid ? coupon.code : '',
      });
      await reloadCart();
      let payment;
      try {
        ({ data: payment } = await paymentsAPI.initiatePayment({ order_number: order.order_number, payment_method: paymentMethod }));
      } catch (paymentError) {
        if (paymentMethod === 'sslcommerz') {
          navigate('/payments', { state: {
            orderNumber: order.order_number,
            paymentMethod,
            checkoutError: paymentError.response?.data?.error || 'Your order was placed, but online payment could not start. You can retry below.',
          } });
          return;
        }
        navigate('/orders', { replace: true, state: { orderPlaced: order.order_number } });
        return;
      }
      if (paymentMethod === 'sslcommerz' && payment.gateway_url) {
        window.location.assign(payment.gateway_url);
      } else {
        navigate('/orders', { replace: true, state: { orderPlaced: order.order_number } });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Checkout failed. Please check your delivery address and try again.');
    } finally { setBusy(false); }
  };

  const clearCart = async () => {
    if (!window.confirm('Remove every item from your cart?')) return;
    setBusy(true); setError('');
    try { await cartAPI.clearCart(); await reloadCart(); }
    catch (err) { setError(err.response?.data?.error || 'Could not clear your cart.'); }
    finally { setBusy(false); }
  };

  if (loading) return <Loading />;
  const items = cart?.items || [];
  const deliveryAddress = addresses.find((address) => String(address.id) === String(addressId));
  const shippingFee = deliveryAddress && ['dhaka', 'ঢাকা'].includes((deliveryAddress.city || '').trim().toLowerCase()) ? deliveryRates.dhaka_delivery_fee : deliveryRates.outside_delivery_fee;

  return (
    <main className="page cart-page">
      <h1>Your cart</h1>
      {error && <div className="error" role="alert">{error}</div>}
      {items.length === 0 ? <div className="empty-cart">Your cart is empty. <Link to="/products">Browse the collection</Link></div> : <>
        <div className="cart-layout">
          <section className="cart-items" aria-label="Cart items">
            {items.map((item) => <article key={item.id} className="cart-item">
              <div className="item-info">
                <h3><Link className="cart-product-link" to={`/product/${item.product?.slug}`}>{item.product?.product_name}</Link></h3>
                <p>Color: {item.color?.color || '—'} · Size: {item.size?.size_type || '—'}</p>
                <p>Unit price: ৳{item.product?.discount_price > 0 ? item.product.discount_price : item.product?.price}</p>
                <p>Subtotal: ৳{item.subtotal}</p>
              </div>
              <div className="item-actions">
                <button disabled={busy || item.quantity <= 1} aria-label="Decrease quantity" onClick={() => changeQuantity(item.id, item.quantity - 1)}>−</button>
                <span className="quantity-value">{item.quantity}</span>
                <button disabled={busy} aria-label="Increase quantity" onClick={() => changeQuantity(item.id, item.quantity + 1)}>+</button>
                <button disabled={busy} onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            </article>)}
            <button disabled={busy} onClick={clearCart} className="btn-clear">Clear cart</button>
          </section>
          <aside className="cart-summary">
            <h2>Order summary</h2>
            <p>{cart.total_items} {cart.total_items === 1 ? 'item' : 'items'}</p>
            {deliveryAddress && <p>Delivery fee <strong>৳{shippingFee}</strong></p>}
            <p className="summary-total">Total <strong>৳{(Number(cart.total_amount) + (deliveryAddress ? shippingFee : 0)).toFixed(2)}</strong></p>
            <form className="checkout-form" onSubmit={validateCoupon}>
              <label htmlFor="coupon-code">Discount code</label>
              <div className="coupon-apply-row"><input id="coupon-code" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter code" />
                <button type="submit" className="btn-secondary">Apply</button></div>
              {coupon?.valid && <p className="success">{coupon.message}</p>}
            </form>
            {addresses.length ? <div className="checkout-field">
              <label htmlFor="delivery-address">Delivery address</label>
              <select id="delivery-address" value={addressId} onChange={(event) => setAddressId(event.target.value)}>
                {addresses.map((address) => <option key={address.id} value={address.id}>{address.full_name} · {address.city}, {address.state}</option>)}
              </select>
            </div> : <p className="address-needed">No saved address. <Link to="/profile">Add one in your profile</Link>.</p>}
            <div className="checkout-field">
              <label htmlFor="payment-method">Payment method</label>
              <select id="payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="cash_on_delivery">Cash on delivery</option>
                <option value="sslcommerz">Pay online with SSLCommerz</option>
              </select>
            </div>
            <button className="btn-checkout" disabled={busy || !addresses.length} onClick={checkout}>{busy ? 'Processing…' : 'Place order'}</button>
          </aside>
        </div>
      </>}
    </main>
  );
};
