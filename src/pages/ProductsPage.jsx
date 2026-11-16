import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { productsAPI } from '../api';
import { useAuth } from '../contexts/useAuth';
import { ResponsiveImage } from '../components/ResponsiveImage';

const asList = (data) => Array.isArray(data) ? data : data?.results || [];
const priceOf = (product) => Number(product.current_price ?? product.discount_price) > 0 ? Number(product.current_price ?? product.discount_price) : Number(product.price || 0);
const taka = (value) => `৳${Number(value || 0).toLocaleString('en-BD')}`;

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isHome = location.pathname === '/';
  const [products, setProducts] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [banners, setBanners] = useState([]);
  const [homeSections, setHomeSections] = useState({ featured: [], new_arrivals: [], best_sellers: [] });
  const [bannerIndex, setBannerIndex] = useState(0);
  const [wishlistItems, setWishlistItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    let active = true;
    Promise.all([productsAPI.getCategories({ limit: 100 }), productsAPI.getBrands({ limit: 100 }), productsAPI.getBanners(), productsAPI.getProductSections()])
      .then(([categoryResponse, brandResponse, bannerResponse, sectionResponse]) => {
        if (!active) return;
        setCategories(asList(categoryResponse.data));
        setBrands(asList(brandResponse.data));
        setBanners(asList(bannerResponse.data));
        setHomeSections(sectionResponse.data);
      })
      .catch(() => { if (active) setError('We could not load the collection. Please refresh and try again.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const ordering = { featured: '-is_featured,-created_at', 'price-low': 'price', 'price-high': '-price', name: 'product_name' }[sortBy];
    productsAPI.getProducts({
      limit: 12,
      offset: (page - 1) * 12,
      ...(selectedCategory ? { category: selectedCategory } : {}),
      ...(selectedBrand ? { brand: selectedBrand } : {}),
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      ordering,
    }).then(({ data }) => {
      if (!active) return;
      setProducts(asList(data));
      setProductCount(data.count ?? asList(data).length);
    }).catch(() => {
      if (active) setError('We could not load the collection. Please refresh and try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, selectedCategory, selectedBrand, searchQuery, sortBy]);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = window.setInterval(() => setBannerIndex((index) => (index + 1) % banners.length), 6000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) { setWishlistItems({}); return undefined; }
    let active = true;
    productsAPI.getWishlist().then(({ data }) => {
      const list = asList(data);
      if (active) setWishlistItems(Object.fromEntries(list.map((item) => [item.product.id, item.id])));
    }).catch(() => { if (active) setWishlistItems({}); });
    return () => { active = false; };
  }, [isAuthenticated]);

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) { navigate('/login', { state: { from: location.pathname } }); return; }
    try {
      if (wishlistItems[product.id]) {
        await productsAPI.removeFromWishlist(wishlistItems[product.id]);
        setWishlistItems((current) => { const next = { ...current }; delete next[product.id]; return next; });
      } else {
        const { data } = await productsAPI.addToWishlist(product.id);
        setWishlistItems((current) => ({ ...current, [product.id]: data.id }));
      }
    } catch { setError('Could not update your wishlist. Please try again.'); }
  };

  const filteredProducts = products;

  const featured = filteredProducts[0] || products[0];
  const featuredImage = featured?.images?.[0]?.image;
  const activeBanner = banners.length ? banners[bannerIndex % banners.length] : null;

  return (
    <main className={`storefront ${isHome ? 'storefront-home' : 'storefront-catalog'}`}>
      {isHome && <section className="home-hero">
        <div className="home-hero-copy">
          <p className="hero-kicker"><span /> {activeBanner?.title || 'New season · 2026 collection'}</p>
          <h1>{activeBanner ? activeBanner.title : <>Wear your<br /><em>own story.</em></>}</h1>
          <p className="hero-description">{activeBanner?.subtitle || 'Thoughtful everyday essentials, made for the way you move. Find your next favourite in the UrbanThread collection.'}</p>
          <div className="hero-actions"><a className="hero-cta" href={activeBanner?.link || '#collection'}>Shop the collection <span aria-hidden="true">↗</span></a><span className="hero-note">Free delivery on orders over ৳2,500</span></div>
          <div className="hero-proof"><div className="proof-avatars" aria-hidden="true"><i>U</i><i>T</i><i>+</i></div><p><strong>Made for real life</strong><br />Easy fits. Better basics.</p></div>
        </div>
        <div className="home-hero-art" style={(activeBanner?.image || featuredImage) ? { backgroundImage: `linear-gradient(180deg, rgba(22,31,26,.02), rgba(22,31,26,.15)), url("${activeBanner?.image || featuredImage}")` } : undefined}>
          {!featuredImage && <div className="hero-art-shape"><span>UT</span></div>}
          <div className="hero-edition">URBANTHREAD<br /><strong>THE EVERYDAY EDIT</strong></div>
          {featured && <Link className="hero-feature-card" to={`/product/${featured.slug}`}>
            <span className="feature-label">The collection pick</span><strong>{featured.product_name}</strong>
            <span className="feature-price">{taka(priceOf(featured))} <span aria-hidden="true">↗</span></span>
          </Link>}
          <span className="hero-orbit" aria-hidden="true">EST. FOR EVERY DAY</span>
          {banners.length > 1 && <div className="hero-slide-dots" aria-label="Homepage slides">{banners.map((banner, index) => <button key={banner.id} type="button" aria-label={`Show slide ${index + 1}`} aria-current={index === bannerIndex} onClick={() => setBannerIndex(index)} />)}</div>}
        </div>
      </section>}

      <section className="collection-section" id="collection">
        <div className="collection-heading">
          <div><p className="section-kicker">CURATED FOR YOU</p><h2>{isHome ? 'Find your fit.' : 'The collection.'}</h2><p className="collection-subtitle">Pieces you will reach for, season after season.</p></div>
          <span className="collection-count">{productCount} {productCount === 1 ? 'piece' : 'pieces'}</span>
        </div>

        {error && <div className="error" role="alert">{error}</div>}
        <div className="catalog-toolbar">
          <p>{searchQuery ? <>Results for <strong>“{searchQuery}”</strong></> : 'Good clothes. No guesswork.'}</p>
          <div className="catalog-controls">
            <label className="catalog-select-label">Category <select value={selectedCategory} onChange={(event) => { setSelectedCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.category_name}</option>)}</select></label>
            <label className="catalog-select-label">Brand <select value={selectedBrand} onChange={(event) => { setSelectedBrand(event.target.value); setPage(1); }}><option value="">All brands</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.brand_name}</option>)}</select></label>
            <label className="catalog-select-label">Sort <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select></label>
          </div>
        </div>

        <div className="product-grid">
          {loading && filteredProducts.length === 0 ? Array.from({ length: 4 }, (_, index) => <article className="skeleton-card" key={`loading-${index}`} aria-hidden="true"><i /><span /><span /><b /></article>) : filteredProducts.length === 0 ? <div className="catalog-empty"><span>⌕</span><h3>No pieces found</h3><p>Try a different search or clear your filters.</p><button className="text-button" onClick={() => { setSearchParams({}); setSelectedCategory(''); setSelectedBrand(''); setPage(1); }}>Clear filters</button></div> : filteredProducts.map((product, index) => {
            const image = product.images?.[0]?.image;
            const discounted = priceOf(product) < Number(product.price);
            return <article key={product.id} className="product-card">
              <Link className="product-image-link" to={`/product/${product.slug}`} aria-label={`View ${product.product_name}`}>
                {image ? <ResponsiveImage image={product.images[0]} alt={product.product_name} className="product-img" loading={index > 3 ? 'lazy' : 'eager'} /> : <div className="product-img product-image-placeholder">UrbanThread</div>}
                {discounted && <span className="product-badge">SALE</span>}
                <span className="product-card-arrow" aria-hidden="true">↗</span>
              </Link>
              <button type="button" className={`wishlist-toggle ${wishlistItems[product.id] ? 'saved' : ''}`} aria-label={wishlistItems[product.id] ? `Remove ${product.product_name} from wishlist` : `Add ${product.product_name} to wishlist`} aria-pressed={Boolean(wishlistItems[product.id])} onClick={() => toggleWishlist(product)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg></button>
              <div className="product-card-content">
                <div className="product-card-overline"><span>{product.category?.category_name || 'EVERYDAY ESSENTIALS'}</span><span>UT. {String(product.id).padStart(3, '0')}</span></div>
                <Link className="product-title-link" to={`/product/${product.slug}`}><h3>{product.product_name}</h3></Link>
                <div className="product-card-bottom"><div className="product-price">{taka(priceOf(product))}{(discounted || Number(product.compare_at_price) > priceOf(product)) && <span className="discount">{taka(Number(product.compare_at_price) > priceOf(product) ? product.compare_at_price : product.price)}</span>}</div><Link className="product-view-link" to={`/product/${product.slug}`}>Discover <span aria-hidden="true">→</span></Link></div>
              </div>
            </article>;
          })}
        </div>
        {productCount > 12 && <nav className="pagination" aria-label="Product pages">
          <span className="pagination-summary">{(page - 1) * 12 + 1}–{Math.min(page * 12, productCount)} of {productCount}</span>
          <div className="pagination-pages">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">‹</button>
            <span className="pagination-number"><button type="button" className="active" aria-current="page">{page}</button></span>
            <button type="button" onClick={() => setPage((current) => Math.min(Math.ceil(productCount / 12), current + 1))} disabled={page >= Math.ceil(productCount / 12)} aria-label="Next page">›</button>
          </div>
        </nav>}
      </section>

      {isHome && <div className="home-product-sections">{[['featured', 'Featured picks'], ['new_arrivals', 'New arrivals'], ['best_sellers', 'Best sellers']].map(([key, title]) => homeSections[key]?.length > 0 && <section className="collection-section home-product-section" key={key}><div className="collection-heading"><div><p className="section-kicker">URBANTHREAD EDIT</p><h2>{title}</h2></div></div><div className="product-grid">{homeSections[key].slice(0, 4).map((product) => <article className="product-card" key={product.id}><Link className="product-image-link" to={`/product/${product.slug}`}>{product.images?.[0]?.image ? <ResponsiveImage image={product.images[0]} alt={product.product_name} className="product-img" /> : <div className="product-img product-image-placeholder">UrbanThread</div>}</Link><div className="product-card-content"><span>{product.category?.category_name}</span><Link className="product-title-link" to={`/product/${product.slug}`}><h3>{product.product_name}</h3></Link><strong>{taka(priceOf(product))}</strong></div></article>)}</div></section>)}</div>}
      {isHome && <section className="store-promise"><div><span>01</span><strong>Comfort, always</strong><p>Easy-to-wear fits for every day.</p></div><div><span>02</span><strong>Made to last</strong><p>Thoughtful details. Better basics.</p></div><div><span>03</span><strong>Simple delivery</strong><p>Reliable delivery, right to your door.</p></div></section>}
    </main>
  );
};
