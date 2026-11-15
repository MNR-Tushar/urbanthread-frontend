import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getAllPages, reviewsAPI } from '../api';
import { Loading } from '../components/common';
import { Paginated } from '../components/Paginated';
import { useAuth } from '../contexts/useAuth';

const responseError = (error) => error.response?.data?.detail || error.response?.data?.error || 'Could not complete that action. Please try again.';

export const ReviewsPage = () => {
  const { productId } = useParams();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ rating: 5, review_text: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadReviews = useCallback(async () => {
    if (!isAuthenticated || !user?.id) { setReviews([]); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const ownReviews = await getAllPages((params) => reviewsAPI.getReviews({ ...params, ...(productId ? { product_id: productId } : {}) }));
      setReviews(ownReviews.filter((review) => Number(review.user?.id) === Number(user.id)));
    } catch (err) { setError(responseError(err)); }
    finally { setLoading(false); }
  }, [isAuthenticated, user?.id, productId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const startEditing = (review) => {
    setEditingId(review.id);
    setEditValues({ rating: Number(review.rating), review_text: review.review_text || '' });
    setError(''); setNotice('');
  };

  const saveReview = async (event, review) => {
    event.preventDefault(); setSavingId(review.id); setError(''); setNotice('');
    try {
      const { data } = await reviewsAPI.updateReview(review.id, editValues);
      setReviews((items) => items.map((item) => item.id === review.id ? { ...item, ...data, product_detail: item.product_detail } : item));
      setEditingId(null); setNotice('Your review was updated.');
    } catch (err) { setError(responseError(err)); }
    finally { setSavingId(null); }
  };

  const deleteReview = async (review) => {
    if (!window.confirm(`Delete your review for ${review.product_detail?.product_name || 'this product'}?`)) return;
    setDeletingId(review.id); setError(''); setNotice('');
    try {
      await reviewsAPI.deleteReview(review.id);
      setReviews((items) => items.filter((item) => item.id !== review.id));
      if (editingId === review.id) setEditingId(null);
      setNotice('Your review was deleted.');
    } catch (err) { setError(responseError(err)); }
    finally { setDeletingId(null); }
  };

  if (authLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) return <Loading />;

  return <main className="page reviews-page my-reviews-page">
    <p className="eyebrow">YOUR ACCOUNT</p>
    <h1>My product reviews</h1>
    <p className="my-reviews-intro">See the products you reviewed, and update or remove your review any time.</p>
    {error && <div className="error" role="alert">{error}</div>}
    {notice && <div className="success" role="status">{notice}</div>}
    {!reviews.length ? <section className="my-reviews-empty"><span aria-hidden="true">☆</span><h2>No reviews yet</h2><p>After a delivered purchase, open that product page to share your experience.</p><Link className="btn-submit" to="/orders">View your orders</Link></section> : <Paginated items={reviews} pageSize={8} label="your reviews">{(pageReviews) => <div className="my-review-list">{pageReviews.map((review) => {
      const product = review.product_detail;
      const image = product?.images?.[0]?.image;
      const isEditing = editingId === review.id;
      return <article className="my-review-card" key={review.id}>
        <div className="my-review-product">{image ? <Link to={product?.slug ? `/product/${product.slug}` : '/products'} className="my-review-product-image"><img src={image} alt={product?.product_name || 'Reviewed product'} loading="lazy" /></Link> : <div className="my-review-product-image my-review-image-placeholder" aria-hidden="true">UT</div>}
          <div><p className="eyebrow">REVIEWED PRODUCT</p><h2><Link to={product?.slug ? `/product/${product.slug}` : '/products'}>{product?.product_name || 'Product'}</Link></h2><small>{product?.brand?.brand_name || product?.category?.category_name || 'UrbanThread'}</small></div>
        </div>
        {isEditing ? <form className="my-review-edit-form" onSubmit={(event) => saveReview(event, review)}>
          <label>Rating<select value={editValues.rating} onChange={(event) => setEditValues({ ...editValues, rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? 'star' : 'stars'}</option>)}</select></label>
          <label>Your review<textarea value={editValues.review_text} onChange={(event) => setEditValues({ ...editValues, review_text: event.target.value })} maxLength={3000} required /></label>
          <div className="admin-form-actions"><button type="submit" disabled={savingId === review.id}>{savingId === review.id ? 'Saving…' : 'Save changes'}</button><button type="button" className="admin-quiet-button" onClick={() => setEditingId(null)}>Cancel</button></div>
        </form> : <div className="my-review-copy"><p className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(Number(review.rating))}{'☆'.repeat(5 - Number(review.rating))}</p><p>{review.review_text}</p><small>Posted {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'recently'}{review.verified_purchase ? ' · Verified purchase' : ''}</small>
          <div className="admin-row-actions"><button type="button" onClick={() => startEditing(review)}>Edit review</button><button type="button" className="danger" disabled={deletingId === review.id} onClick={() => deleteReview(review)}>{deletingId === review.id ? 'Deleting…' : 'Delete'}</button></div>
        </div>}
      </article>;
    })}</div>}</Paginated>}
  </main>;
};
