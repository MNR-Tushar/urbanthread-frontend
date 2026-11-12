import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { paymentsAPI } from '../api';

const resultCopy = {
  success: { title: 'Payment received', message: 'Your payment provider returned a successful result.' },
  failed: { title: 'Payment could not be completed', message: 'Your order may still be pending. You can retry payment from the Payments page.' },
  cancelled: { title: 'Payment cancelled', message: 'The payment was cancelled. Your order remains available in your order history.' },
};

export const PaymentResultPage = ({ outcome }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get('order_id');
  const transactionId = params.get('transaction_id');
  const [payment, setPayment] = useState(null);
  const copy = resultCopy[outcome] || resultCopy.failed;

  useEffect(() => {
    paymentsAPI.getPayments().then(({ data }) => {
      const list = data.results || data;
      const match = list.find((item) =>
        (orderId && String(item.order?.id) === orderId) ||
        (transactionId && item.transaction_id === transactionId)
      );
      setPayment(match || null);
    }).catch(() => setPayment(null));
  }, [orderId, transactionId]);

  return (
    <main className="page payment-result-page">
      <section className={`payment-result-card ${outcome}`}>
        <span className="payment-result-icon" aria-hidden="true">{outcome === 'success' ? '✓' : outcome === 'cancelled' ? '↩' : '!'}</span>
        <h1>{copy.title}</h1>
        <p>{copy.message}</p>
        {payment && <div className="payment-result-details">
          <p>Order: <strong>{payment.order?.order_number}</strong></p>
          <p>Payment status: <strong>{payment.status_display || payment.status}</strong></p>
          <p>Amount: <strong>৳{payment.amount}</strong></p>
        </div>}
        {transactionId && <p className="transaction-ref">Transaction: {transactionId}</p>}
        <div className="payment-result-actions"><Link className="btn-add" to="/orders">View my orders</Link><Link className="btn-secondary" to="/payments">Payment history</Link></div>
      </section>
    </main>
  );
};
