import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cartAPI, inventoryAPI, productsAPI, reviewsAPI } from '../api';
import { useAuth } from '../contexts/useAuth';
import { Loading } from '../components/common';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [pendingReview, setPendingReview] = useState(null);

  useEffect(() => {
    let active = true;
    setProduct(null); setVariants([]); setSelectedColor(''); setSelectedSize(''); setLoading(true); setError('');
    productsAPI.getProduct(slug)
      .then(async (productRes) => {
        if (!active) return;
        setProduct(productRes.data);
        const inventoryRes = await inventoryAPI.getProductInventory({ product_id: productRes.data.id });
        if (!active) return;
        setVariants(inventoryRes.data.results || inventoryRes.data);
      })
      .catch(() => { if (active) setError('Product or product options could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!product?.id) return;
    let active = true;
    reviewsAPI.getReviews({ product_id: product.id })
      .then(({ data }) => { if (active) setReviews(data.results || data); })
      .catch(() => { if (active) setReviewError('Reviews could not be loaded.'); });
    return () => { active = false; };
  }, [product?.id]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setReviewSaving(true); setReviewError(''); setReviewNotice('');
    try {
      const response = await reviewsAPI.createReview({ product: Number(product.id), rating: Number(reviewRating), review_text: reviewText.trim() });
      setReviewText(''); setReviewRating(5);
      setPendingReview(response.data);
      setReviewNotice('Thanks! Your review was submitted and will appear after approval.');
      try {
        const refreshedReviews = await reviewsAPI.getReviews({ product_id: product.id });
        setReviews(refreshedReviews.data.results || refreshedReviews.data);
      } catch { /* Keep the successful submission visible from the create response. */ }
    } catch (err) {
      const data = err.response?.data;
      const firstValidationError = data && Object.values(data).flat().find((value) => typeof value === 'string');
      setReviewError(firstValidationError || 'Could not submit your review. Please sign in again and try once more.');
    } finally { setReviewSaving(false); }
  };

  useEffect(() => {
    if (!product?.id || !selectedColor || !selectedSize) return;
    let active = true;
    const key = `${product?.id}:${selectedColor}:${selectedSize}`;
    inventoryAPI.checkAvailability({ product_id: product.id, color_id: selectedColor, size_id: selectedSize })
      .then(({ data }) => { if (active) setAvailability({ key, data }); })
      .catch(() => { if (active) setAvailability({ key, data: { available: false, quantity: 0 } }); });
    return () => { active = false; };
  }, [product?.id, selectedColor, selectedSize]);

  const addToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedColor || !selectedSize) { setError('Please choose a color and size.'); return; }
    setAdding(true); setError(''); setAddSuccess(false);
    try {
      await cartAPI.addItem({ product_id: product.id, color_id: Number(selectedColor), size_id: Number(selectedSize), quantity });
      setAddSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Could not add this item to your cart.');
    } finally { setAdding(false); }
  };

  if (loading) return <Loading />;
  if (!product) return <main className="page"><div className="error">{error || 'Product not found.'}</div><Link to="/products">Back to products</Link></main>;
  const variantKey = `${product?.id}:${selectedColor}:${selectedSize}`;
  const variantAvailability = availability?.key === variantKey ? availability.data : null;
  const availableQuantity = variantAvailability?.quantity ?? 0;
  const approvedReviews = reviews.filter((review) => review.is_approved);
  const displayedPendingReview = pendingReview || reviews.find((review) => !review.is_approved);

  return (
    <main className="page product-detail-page">
      <div className="product-images">
        {product.images?.length ? product.images.map((image) => (
          <img key={image.id} src={image.image} alt={product.product_name} className="product-img" />
        )) : <div className="product-img product-image-placeholder">No image available</div>}
      </div>
      <section className="product-info">
        <p className="eyebrow">{product.category?.category_name || 'UrbanThread collection'}</p>
        <h1>{product.product_name}</h1>
        <p>{product.description}</p>
        <div className="product-meta"><span><strong>Brand:</strong> {product.brand?.brand_name || '—'}</span></div>
        <div className="product-price">৳{product.discount_price > 0 ? product.discount_price : product.price}
          {product.discount_price > 0 && <span className="discount">৳{product.price}</span>}
        </div>
        <div className="variant-group">
          <label htmlFor="color-choice">Color</label>
          <select id="color-choice" value={selectedColor} onChange={(event) => { setSelectedColor(event.target.value); setSelectedSize(''); }}>
            <option value="">Choose a color</option>
            {[...new Map(variants.filter((variant) => variant.quantity > 0).map((variant) => [variant.color.id, variant.color])).values()].map((color) => <option key={color.id} value={color.id}>{color.color}</option>)}
          </select>
        </div>
        <div className="variant-group">
          <label htmlFor="size-choice">Size</label>
          <select id="size-choice" value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
            <option value="">Choose a size</option>
            {[...new Map(variants.filter((variant) => variant.quantity > 0 && String(variant.color.id) === selectedColor).map((variant) => [variant.size.id, variant.size])).values()].map((size) => <option key={size.id} value={size.id}>{size.size_type}</option>)}
          </select>
        </div>
        {variantAvailability && <p className={variantAvailability.available ? 'stock-message' : 'stock-message unavailable'}>
          {variantAvailability.available ? `${availableQuantity} available` : 'This color and size is currently out of stock.'}
        </p>}
        <div className="variant-group quantity-field">
          <label htmlFor="quantity">Quantity</label>
          <input id="quantity" type="number" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} min="1" max={variantAvailability?.quantity || undefined} />
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        {addSuccess && <div className="success" role="status">Added to cart. <Link to="/cart">View cart</Link></div>}
        <button className="btn-add" onClick={addToCart} disabled={adding || !variantAvailability?.available || quantity > availableQuantity}>
          {adding ? 'Adding…' : isAuthenticated ? 'Add to cart' : 'Sign in to add to cart'}
        </button>
      </section>
      <section className="product-reviews" aria-labelledby="product-reviews-title">
        <div className="product-reviews-heading">
          <div><p className="eyebrow">CUSTOMER FEEDBACK</p><h2 id="product-reviews-title">Reviews</h2></div>
          <span>{approvedReviews.length} {approvedReviews.length === 1 ? 'review' : 'reviews'}</span>
        </div>
        {reviewNotice && <p className="success" role="status">{reviewNotice}</p>}
        {reviewError && <p className="error" role="alert">{reviewError}</p>}
        <form className="product-review-form" onSubmit={submitReview}>
          <h3>Write a review</h3>
          {isAuthenticated ? <>
            <label htmlFor="product-review-rating">Rating</label>
            <select id="product-review-rating" value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? 'star' : 'stars'}</option>)}
            </select>
            <label htmlFor="product-review-text">Your review</label>
            <textarea id="product-review-text" value={reviewText} onChange={(event) => setReviewText(event.target.value)} rows="3" maxLength="1200" required placeholder="What did you think of this product?" />
            <button type="submit" disabled={reviewSaving || !reviewText.trim()}>{reviewSaving ? 'Submitting…' : 'Submit review'}</button>
          </> : <p><Link to="/login">Sign in</Link> to write a review.</p>}
        </form>
        <div className="product-review-list">
          {displayedPendingReview && <article className="product-review-card pending-review">
            <div><strong>Your review</strong><span>Pending approval</span></div>
            <p>{displayedPendingReview.review_text}</p>
            <time>{Number(displayedPendingReview.rating)}/5</time>
          </article>}
          {approvedReviews.length ? approvedReviews.map((review) => <article className="product-review-card" key={review.id}>
            <div><strong>{review.user?.username || 'Customer'}</strong><span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(Number(review.rating))}{'☆'.repeat(5 - Number(review.rating))}</span></div>
            <p>{review.review_text}</p>
            {review.created_at && <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time>}
          </article>) : !displayedPendingReview && <p className="product-review-empty">No reviews yet. Be the first to share your experience.</p>}
        </div>
      </section>
    </main>
  );
};
