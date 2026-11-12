import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api';
import { Loading } from '../components/common';
import { Paginated } from '../components/Paginated';

const asList = (data) => Array.isArray(data) ? data : data?.results || [];

export const WishlistPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = () => productsAPI.getWishlist().then(({ data }) => setItems(asList(data))).catch(() => setError('Could not load your wishlist.')).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);
  const removeItem = async (id) => {
    try { await productsAPI.removeFromWishlist(id); setItems((current) => current.filter((item) => item.id !== id)); }
    catch { setError('Could not remove this product from your wishlist.'); }
  };
  if (loading) return <Loading />;
  return <main className="page wishlist-page">
    <div className="wishlist-heading"><div><p className="eyebrow">YOUR SAVED PICKS</p><h1>Wishlist</h1><p>Products you want to come back to.</p></div><span className="collection-count">{items.length} saved</span></div>
    {error && <div className="error" role="alert">{error}</div>}
    {!items.length ? <div className="empty-cart">Your wishlist is empty. <Link to="/products">Explore products</Link></div> : <Paginated items={items} pageSize={12} label="saved products">{(pageItems) => <div className="wishlist-grid">{pageItems.map((item) => {
      const product = item.product;
      const image = product.images?.[0]?.image;
      return <article className="wishlist-card" key={item.id}><Link to={`/product/${product.slug}`} className="wishlist-image">{image ? <img src={image} alt={product.product_name} /> : <span>UrbanThread</span>}</Link><div className="wishlist-card-copy"><p>{product.category?.category_name || 'Collection'} · {product.brand?.brand_name || 'UrbanThread'}</p><Link to={`/product/${product.slug}`}><h2>{product.product_name}</h2></Link><strong>৳{Number(product.discount_price) > 0 ? product.discount_price : product.price}</strong><div className="wishlist-actions"><Link className="btn-secondary" to={`/product/${product.slug}`}>View product</Link><button type="button" className="admin-quiet-button" onClick={() => removeItem(item.id)}>Remove</button></div></div></article>;
    })}</div>}</Paginated>}
  </main>;
};
