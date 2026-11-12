import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cartAPI, inventoryAPI, productsAPI } from '../api';
import { useAuth } from '../contexts/useAuth';
import { Loading } from '../components/common';

export const ProductDetailPage = () => {
  const { id } = useParams();
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

  useEffect(() => {
    let active = true;
    Promise.all([productsAPI.getProduct(id), inventoryAPI.getProductInventory({ product_id: id })])
      .then(([productRes, inventoryRes]) => {
        if (!active) return;
        setProduct(productRes.data);
        setVariants(inventoryRes.data.results || inventoryRes.data);
      })
      .catch(() => { if (active) setError('Product or product options could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!selectedColor || !selectedSize) return;
    let active = true;
    const key = `${id}:${selectedColor}:${selectedSize}`;
    inventoryAPI.checkAvailability({ product_id: id, color_id: selectedColor, size_id: selectedSize })
      .then(({ data }) => { if (active) setAvailability({ key, data }); })
      .catch(() => { if (active) setAvailability({ key, data: { available: false, quantity: 0 } }); });
    return () => { active = false; };
  }, [id, selectedColor, selectedSize]);

  const addToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedColor || !selectedSize) { setError('Please choose a color and size.'); return; }
    setAdding(true); setError(''); setAddSuccess(false);
    try {
      await cartAPI.addItem({ product_id: Number(id), color_id: Number(selectedColor), size_id: Number(selectedSize), quantity });
      setAddSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Could not add this item to your cart.');
    } finally { setAdding(false); }
  };

  if (loading) return <Loading />;
  if (!product) return <main className="page"><div className="error">{error || 'Product not found.'}</div><Link to="/products">Back to products</Link></main>;
  const variantKey = `${id}:${selectedColor}:${selectedSize}`;
  const variantAvailability = availability?.key === variantKey ? availability.data : null;
  const availableQuantity = variantAvailability?.quantity ?? 0;

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
    </main>
  );
};
