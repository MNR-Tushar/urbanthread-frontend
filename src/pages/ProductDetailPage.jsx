import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cartAPI, inventoryAPI, productsAPI, reviewsAPI } from '../api';
import { useAuth } from '../contexts/useAuth';
import { Loading } from '../components/common';
import { Paginated } from '../components/Paginated';
import { ResponsiveImage } from '../components/ResponsiveImage';

const formatSaleDateTime = (value) => new Intl.DateTimeFormat('en-BD', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka',
}).format(new Date(value));

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
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
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [reviewImages, setReviewImages] = useState([]);
  const [wishlistId, setWishlistId] = useState(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [pendingReview, setPendingReview] = useState(null);

  useEffect(() => {
    let active = true;
    setProduct(null); setImageIndex(0); setIsZoomed(false); setVariants([]); setSelectedColor(''); setSelectedSize(''); setLoading(true); setError('');
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

  useEffect(() => {
    if (!product?.id) return;
    let active = true;
    productsAPI.getRelatedProducts(product.slug).then(({ data }) => { if (active) setRelatedProducts(data.results || data); }).catch(() => {});
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('recently_viewed_products') || '[]'); } catch { stored = []; }
    const previous = stored.filter((item) => Number(item.id) !== Number(product.id));
    setRecentlyViewed(previous.slice(0, 4));
    localStorage.setItem('recently_viewed_products', JSON.stringify([product, ...previous].slice(0, 5)));
    return () => { active = false; };
  }, [product?.id]);

  useEffect(() => {
    if (!isAuthenticated || !product?.id) { setWishlistId(null); return undefined; }
    let active = true;
    productsAPI.getWishlist().then(({ data }) => {
      const items = data.results || data;
      const savedItem = items.find((item) => Number(item.product?.id) === Number(product.id));
      if (active) setWishlistId(savedItem?.id || null);
    }).catch(() => { if (active) setWishlistId(null); });
    return () => { active = false; };
  }, [isAuthenticated, product?.id]);

  const toggleWishlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setWishlistBusy(true); setWishlistError('');
    try {
      if (wishlistId) {
        await productsAPI.removeFromWishlist(wishlistId);
        setWishlistId(null);
      } else {
        const { data } = await productsAPI.addToWishlist(product.id);
        setWishlistId(data.id);
      }
    } catch (err) {
      setWishlistError(err.response?.data?.detail || 'Could not update your wishlist. Please try again.');
    } finally { setWishlistBusy(false); }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setReviewSaving(true); setReviewError(''); setReviewNotice('');
    try {
      const payload = new FormData(); payload.append('product', product.id); payload.append('rating', reviewRating); payload.append('review_text', reviewText.trim());
      reviewImages.forEach((image) => payload.append('images', image));
      const response = await reviewsAPI.createReview(payload);
      setReviewText(''); setReviewRating(5); setReviewImages([]);
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
  const productImages = (product.images || []).slice(0, 5);
  const salePrice = Number(product.discount_price || 0);
  const hasSalePrice = salePrice > 0 && salePrice < Number(product.price);
  const now = Date.now();
  const saleStartsAt = product.sale_starts_at && new Date(product.sale_starts_at).getTime() > now ? product.sale_starts_at : null;
  const saleEndsAt = product.sale_ends_at && new Date(product.sale_ends_at).getTime() > now ? product.sale_ends_at : null;
  const showPreviousImage = () => setImageIndex((current) => (current - 1 + productImages.length) % productImages.length);
  const showNextImage = () => setImageIndex((current) => (current + 1) % productImages.length);

  return (
    <main className="page product-detail-page">
      <div className="product-gallery">
        <div className={`product-gallery-main${isZoomed ? ' is-zoomed' : ''}`}>
          {productImages.length ? <ResponsiveImage image={productImages[imageIndex]} alt={`${product.product_name} image ${imageIndex + 1}`} className="product-img" loading="eager" sizes="(max-width: 800px) 100vw, 55vw" />
            : <div className="product-img product-image-placeholder">No image available</div>}
          {productImages.length > 0 && <button type="button" className="product-gallery-zoom" onClick={() => setIsZoomed((zoomed) => !zoomed)} aria-label={isZoomed ? 'Zoom out of product image' : 'Zoom in on product image'} aria-pressed={isZoomed}>{isZoomed ? '−' : '+'}</button>}
          {productImages.length > 1 && <>
            <button type="button" className="product-gallery-arrow previous" onClick={showPreviousImage} aria-label="Previous product image">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button type="button" className="product-gallery-arrow next" onClick={showNextImage} aria-label="Next product image">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <span className="product-gallery-count">{imageIndex + 1} / {productImages.length}</span>
          </>}
        </div>
        {productImages.length > 1 && <div className="product-gallery-thumbnails" aria-label="Product images">
          {productImages.slice(0, 5).map((image, index) => <button key={image.id} type="button" className={index === imageIndex ? 'active' : ''} onClick={() => setImageIndex(index)} aria-label={`Show image ${index + 1}`} aria-current={index === imageIndex ? 'true' : undefined}>
            <ResponsiveImage image={image} alt="" sizes="96px" />
          </button>)}
        </div>}
      </div>
      <section className="product-info">
        <p className="eyebrow">{product.category?.category_name || 'UrbanThread collection'}</p>
        <div className="product-info-title-row">
          <h1>{product.product_name}</h1>
          <button type="button" className={`product-wishlist-toggle${wishlistId ? ' saved' : ''}`} onClick={toggleWishlist} disabled={wishlistBusy} aria-label={wishlistId ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={Boolean(wishlistId)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
          </button>
        </div>
        {wishlistError && <p className="product-wishlist-error" role="alert">{wishlistError}</p>}
        <p>{product.description}</p>
        <div className="product-meta"><span><strong>Brand:</strong> {product.brand?.brand_name || '—'}</span></div>
        <div className="product-price">৳{product.current_price ?? (product.discount_price > 0 ? product.discount_price : product.price)}
          {Number(product.current_price ?? product.price) < Number(product.compare_at_price || product.price) && <span className="discount">৳{product.compare_at_price || product.price}</span>}
        </div>
        {hasSalePrice && (saleStartsAt || saleEndsAt) && <div className="sale-schedule" aria-label="Sale schedule">
          {saleStartsAt && <p>Sale starts: <time dateTime={saleStartsAt}>{formatSaleDateTime(saleStartsAt)}</time></p>}
          {saleEndsAt && <p>Sale ends: <time dateTime={saleEndsAt}>{formatSaleDateTime(saleEndsAt)}</time></p>}
        </div>}
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
          {adding ? 'Adding…' : 'Add to cart'}
        </button>
      </section>
      <section className="product-reviews" aria-labelledby="product-reviews-title">
        <div className="product-reviews-heading">
          <div><p className="eyebrow">CUSTOMER FEEDBACK</p><h2 id="product-reviews-title">Reviews</h2></div>
          <span aria-label={`${product.average_rating} average rating`}>{'★'.repeat(Math.round(Number(product.average_rating || 0)))} {Number(product.average_rating || 0).toFixed(1)} · {product.review_count || approvedReviews.length} reviews</span>
        </div>
        {reviewNotice && <p className="success" role="status">{reviewNotice}</p>}
        {reviewError && <p className="error" role="alert">{reviewError}</p>}
        <form className="product-review-form" onSubmit={submitReview}>
          <h3>Write a review</h3>
          {isAuthenticated ? <>
            <label htmlFor="product-review-rating">Rating</label>
            <select id="product-review-rating" value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{String.fromCodePoint(9733).repeat(rating)}{String.fromCodePoint(9734).repeat(5 - rating)} ({rating}/5)</option>)}
            </select>
            <label htmlFor="product-review-text">Your review</label>
            <textarea id="product-review-text" value={reviewText} onChange={(event) => setReviewText(event.target.value)} rows="3" maxLength="1200" required placeholder="What did you think of this product?" />
            <label htmlFor="product-review-images">Add photos (up to 5)</label>
            <input id="product-review-images" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => setReviewImages(Array.from(event.target.files || []).slice(0, 5))} />
            <button type="submit" disabled={reviewSaving || !reviewText.trim()}>{reviewSaving ? 'Submitting…' : 'Submit review'}</button>
          </> : <p><Link to="/login">Sign in</Link> to write a review.</p>}
        </form>
        <div className="product-review-list">
          {displayedPendingReview && <article className="product-review-card pending-review">
            <div><strong>Your review</strong><span>Pending approval</span></div>
            <p>{displayedPendingReview.review_text}</p>
            <time>{Number(displayedPendingReview.rating)}/5</time>
          </article>}
          {approvedReviews.length ? <Paginated items={approvedReviews} pageSize={5} label="product reviews">{(pageReviews) => pageReviews.map((review) => <article className="product-review-card" key={review.id}>
            <div><strong>{review.user?.username || 'Customer'}</strong>{review.verified_purchase && <span className="verified-purchase">Verified purchase</span>}<span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(Number(review.rating))}{'☆'.repeat(5 - Number(review.rating))}</span></div>
            <p>{review.review_text}</p>
            {review.review_images?.length > 0 && <div className="review-image-gallery">{review.review_images.map((src) => <img key={src} src={src} alt="Customer review" loading="lazy" />)}</div>}
            <button type="button" className="admin-quiet-button" disabled={!isAuthenticated || review.user_found_helpful} onClick={async () => { try { await reviewsAPI.markHelpful(review.id); setReviews((current) => current.map((row) => row.id === review.id ? { ...row, helpful_count: (row.helpful_count || 0) + 1, user_found_helpful: true } : row)); } catch {} }}>Helpful · {review.helpful_count || 0}</button>
            {review.created_at && <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time>}
          </article>)}</Paginated> : !displayedPendingReview && <p className="product-review-empty">No reviews yet. Be the first to share your experience.</p>}
        </div>
      </section>
      {relatedProducts.length > 0 && <ProductRecommendations title="You may also like" products={relatedProducts} />}
      {recentlyViewed.length > 0 && <ProductRecommendations title="Recently viewed" products={recentlyViewed} />}
    </main>
  );
};

function ProductRecommendations({ title, products }) {
  return <section className="collection-section product-recommendations"><div className="collection-heading"><div><p className="section-kicker">URBANTHREAD EDIT</p><h2>{title}</h2></div></div><div className="product-grid">{products.map((item) => <article className="product-card" key={item.id}><Link className="product-image-link" to={`/product/${item.slug}`}>{item.images?.[0]?.image ? <ResponsiveImage className="product-img" image={item.images[0]} alt={item.product_name} /> : <div className="product-img product-image-placeholder">UrbanThread</div>}</Link><div className="product-card-content"><Link className="product-title-link" to={`/product/${item.slug}`}><h3>{item.product_name}</h3></Link><strong>৳{item.current_price ?? item.price}</strong></div></article>)}</div></section>;
}
