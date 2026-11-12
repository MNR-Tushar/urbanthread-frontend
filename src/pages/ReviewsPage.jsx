import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { reviewsAPI, productsAPI } from '../api';
import { useAuth } from '../contexts/useAuth';
import { Paginated } from '../components/Paginated';

export const ReviewsPage = () => {
  const { productId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, review_text: '', product: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes] = await Promise.all([productsAPI.getProducts()]);
        setProducts(prodRes.data.results || prodRes.data);
        
        if (productId) {
          const res = await reviewsAPI.getReviews({ product_id: productId });
          setReviews(res.data.results || res.data);
          setNewReview((current) => ({ ...current, product: productId }));
        } else {
          const res = await reviewsAPI.getReviews();
          setReviews(res.data.results || res.data);
        }
      } catch {
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [productId]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setSaving(true); setError(''); setNotice('');
    try {
      const payload = {
        product: parseInt(newReview.product),
        rating: newReview.rating,
        review_text: newReview.review_text,
      };
      if (editingId) await reviewsAPI.updateReview(editingId, payload);
      else await reviewsAPI.createReview(payload);
      setNewReview({ rating: 5, review_text: '', product: '' });
      setNotice(editingId ? 'Your review has been updated.' : 'Thanks for sharing your review.'); setEditingId(null);
      const res = await reviewsAPI.getReviews(productId ? { product_id: productId } : {});
      setReviews(res.data.results || res.data);
    } catch (err) { setError(err.response?.data?.detail || err.response?.data?.error || 'Could not save your review.'); }
    finally { setSaving(false); }
  };

  const editReview = (review) => {
    setEditingId(review.id); setNewReview({ rating: review.rating, review_text: review.review_text, product: String(review.product) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteReview = async (review) => {
    if (!window.confirm('Delete your review?')) return;
    setError(''); setNotice('');
    try { await reviewsAPI.deleteReview(review.id); setReviews((items) => items.filter((item) => item.id !== review.id)); setNotice('Your review has been removed.'); }
    catch (err) { setError(err.response?.data?.detail || 'Could not delete this review.'); }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="page reviews-page">
      <h1>Product Reviews</h1>
      {isAuthenticated ? (
        <form onSubmit={submitReview} className="review-form">
          <h3>{editingId ? 'Edit your review' : 'Share your experience'}</h3>
          {error && <div className="error" role="alert">{error}</div>}
          <div className="form-group">
            <label>Select Product</label>
            <select
              value={newReview.product}
              onChange={(e) => setNewReview({ ...newReview, product: e.target.value })}
              required
            >
              <option value="">Choose a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.product_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Rating (1-5)</label>
            <select value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}>
              {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} stars</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Your Review</label>
            <textarea value={newReview.review_text} onChange={(e) => setNewReview({...newReview, review_text: e.target.value})} required />
          </div>
          <div className="admin-form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Submit review'}</button>{editingId && <button className="admin-quiet-button" type="button" onClick={() => { setEditingId(null); setNewReview({ rating: 5, review_text: '', product: productId || '' }); }}>Cancel</button>}</div>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: '8px' }}>
          <p>Please log in to write reviews</p>
          <a href="/login" style={{ color: '#2563eb', fontWeight: '600' }}>Sign in here</a>
        </div>
      )}
      {error && !isAuthenticated && <div className="error">{error}</div>}{notice && <div className="success" role="status">{notice}</div>}
      <div className="review-list">
        <h2>Customer Reviews</h2>
        <Paginated items={reviews} pageSize={8} label="reviews">{(pageReviews) => pageReviews.map((r) => (
          <div key={r.id} className="review-card">
            <p><strong>{r.user?.username}</strong><span className="review-stars" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(Number(r.rating))}{'☆'.repeat(5 - Number(r.rating))}</span></p>
            <p>{r.review_text}</p>
            <small style={{ color: '#64748b' }}>{new Date(r.created_at).toLocaleDateString()}</small>
            {(user?.is_staff || user?.is_superuser || r.user?.id === user?.id) && <div className="admin-row-actions"><button type="button" onClick={() => editReview(r)}>Edit</button><button type="button" className="danger" onClick={() => deleteReview(r)}>Delete</button></div>}
          </div>
        ))}</Paginated>
      </div>
    </div>
  );
};
