import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { productsAPI } from '../api';
import { Loading } from '../components/common';

const asList = (data) => Array.isArray(data) ? data : data?.results || [];
const priceOf = (product) => Number(product.discount_price) > 0 ? Number(product.discount_price) : Number(product.price || 0);
const taka = (value) => `৳${Number(value || 0).toLocaleString('en-BD')}`;

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    let active = true;
    Promise.all([productsAPI.getProducts(), productsAPI.getCategories(), productsAPI.getBrands(), productsAPI.getBanners()])
      .then(([productResponse, categoryResponse, brandResponse, bannerResponse]) => {
        if (!active) return;
        setProducts(asList(productResponse.data));
        setCategories(asList(categoryResponse.data));
        setBrands(asList(brandResponse.data));
        setBanners(asList(bannerResponse.data));
      })
      .catch(() => { if (active) setError('We could not load the collection. Please refresh and try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = window.setInterval(() => setBannerIndex((index) => (index + 1) % banners.length), 6000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => setSearchQuery(searchParams.get('search') || ''), [searchParams]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const list = products.filter((product) => {
      const searchable = [product.product_name, product.description, product.brand?.brand_name, product.category?.category_name].filter(Boolean).join(' ').toLocaleLowerCase();
      return (!selectedCategory || String(product.category?.id) === selectedCategory)
        && (!selectedBrand || String(product.brand?.id) === selectedBrand)
        && (!query || searchable.includes(query));
    });
    if (sortBy === 'price-low') return list.sort((a, b) => priceOf(a) - priceOf(b));
    if (sortBy === 'price-high') return list.sort((a, b) => priceOf(b) - priceOf(a));
    if (sortBy === 'name') return list.sort((a, b) => a.product_name.localeCompare(b.product_name));
    return list;
  }, [products, searchQuery, selectedCategory, selectedBrand, sortBy]);

  const featured = filteredProducts[0] || products[0];
  const featuredImage = featured?.images?.[0]?.image;
  const activeBanner = banners.length ? banners[bannerIndex % banners.length] : null;

  if (loading) return <Loading />;

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
          {featured && <Link className="hero-feature-card" to={`/product/${featured.id}`}>
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
          <span className="collection-count">{filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}</span>
        </div>

        {error && <div className="error" role="alert">{error}</div>}
        {categories.length > 0 && <div className="category-rail" aria-label="Shop by category">
          <button className={`category-pill ${!selectedCategory ? 'active' : ''}`} onClick={() => setSelectedCategory('')}>Everything <span>{products.length}</span></button>
          {categories.map((category) => <button key={category.id} className={`category-pill ${selectedCategory === String(category.id) ? 'active' : ''}`} onClick={() => setSelectedCategory(String(category.id))}>{category.category_name}</button>)}
        </div>}

        <div className="catalog-toolbar">
          <p>{searchQuery ? <>Results for <strong>“{searchQuery}”</strong></> : 'Good clothes. No guesswork.'}</p>
          <div className="catalog-controls">
            <label className="catalog-select-label">Brand <select value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)}><option value="">All brands</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.brand_name}</option>)}</select></label>
            <label className="catalog-select-label">Sort <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select></label>
          </div>
        </div>

        <div className="product-grid">
          {filteredProducts.length === 0 ? <div className="catalog-empty"><span>⌕</span><h3>No pieces found</h3><p>Try a different search or clear your filters.</p><button className="text-button" onClick={() => { setSearchParams({}); setSelectedCategory(''); setSelectedBrand(''); }}>Clear filters</button></div> : filteredProducts.map((product, index) => {
            const image = product.images?.[0]?.image;
            const discounted = Number(product.discount_price) > 0;
            return <article key={product.id} className="product-card">
              <Link className="product-image-link" to={`/product/${product.id}`} aria-label={`View ${product.product_name}`}>
                {image ? <img src={image} alt={product.product_name} className="product-img" loading={index > 3 ? 'lazy' : 'eager'} /> : <div className="product-img product-image-placeholder">UrbanThread</div>}
                {discounted && <span className="product-badge">SPECIAL PRICE</span>}
                <span className="product-card-arrow" aria-hidden="true">↗</span>
              </Link>
              <div className="product-card-content">
                <div className="product-card-overline"><span>{product.category?.category_name || 'EVERYDAY ESSENTIALS'}</span><span>UT. {String(product.id).padStart(3, '0')}</span></div>
                <Link className="product-title-link" to={`/product/${product.id}`}><h3>{product.product_name}</h3></Link>
                <div className="product-card-bottom"><div className="product-price">{taka(priceOf(product))}{discounted && <span className="discount">{taka(product.price)}</span>}</div><Link className="product-view-link" to={`/product/${product.id}`}>Discover <span aria-hidden="true">→</span></Link></div>
              </div>
            </article>;
          })}
        </div>
      </section>

      {isHome && <section className="store-promise"><div><span>01</span><strong>Comfort, always</strong><p>Easy-to-wear fits for every day.</p></div><div><span>02</span><strong>Made to last</strong><p>Thoughtful details. Better basics.</p></div><div><span>03</span><strong>Simple delivery</strong><p>Reliable delivery, right to your door.</p></div></section>}
    </main>
  );
};
