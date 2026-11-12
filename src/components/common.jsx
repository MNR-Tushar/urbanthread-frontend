import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { cartAPI, productsAPI } from '../api';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    let active = true;
    const refreshCartCount = () => {
      if (!isAuthenticated) { setCartCount(0); return; }
      cartAPI.getCart().then(({ data }) => {
        if (active) setCartCount((data.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0));
      }).catch(() => { if (active) setCartCount(0); });
    };
    refreshCartCount();
    window.addEventListener('urbanthread:cart-updated', refreshCartCount);
    return () => { active = false; window.removeEventListener('urbanthread:cart-updated', refreshCartCount); };
  }, [isAuthenticated, user?.id]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
  };
  return (
    <>
    <div className="announcement-bar"><span>THE EVERYDAY EDIT</span><i /> Thoughtful style, delivered to your door <span className="announcement-right">Free delivery on orders over &#2547;2,500</span></div>
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">urban<span>thread</span><b>Â®</b></Link>
        <form className="nav-search" onSubmit={(event) => { event.preventDefault(); navigate(`/products${searchText.trim() ? `?search=${encodeURIComponent(searchText.trim())}` : ''}`); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search the collection" aria-label="Search products" />
          <button type="submit">Search</button>
        </form>
        <div className="navbar-actions">
          <Link to="/">Home</Link>
          <Link to="/products">Shop</Link>
          <Link to="/cart" className="nav-cart-link" aria-label={`Bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}><span className="nav-cart-icon-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.4L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>{cartCount > 0 && <span className="nav-cart-count">{cartCount > 99 ? '99+' : cartCount}</span>}</span><span>Bag</span></Link>
          {isAuthenticated ? <div className="profile-menu-wrap" ref={profileMenuRef}>
            <button
              type="button"
              className="profile-menu-trigger"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
            >
              Profile <span aria-hidden="true">{profileOpen ? '⌃' : '⌄'}</span>
            </button>
            {profileOpen && <div className="profile-dropdown" role="menu">
              <p className="profile-dropdown-welcome">Welcome, <strong>{user?.username}</strong></p>
              <Link role="menuitem" to="/profile" onClick={() => setProfileOpen(false)}>Profile</Link>
              <Link role="menuitem" to="/orders" onClick={() => setProfileOpen(false)}>My Orders</Link>
              <Link role="menuitem" to="/coupons" onClick={() => setProfileOpen(false)}>Coupons</Link>
              <Link role="menuitem" to="/payments" onClick={() => setProfileOpen(false)}>Payments</Link>
              {(user?.is_staff || user?.is_superuser) && <><Link role="menuitem" to="/admin" onClick={() => setProfileOpen(false)}>Admin dashboard</Link><Link role="menuitem" to="/inventory" onClick={() => setProfileOpen(false)}>Products & inventory</Link></>}
              <button type="button" role="menuitem" onClick={handleLogout}>Logout</button>
            </div>}
          </div> : <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>}
        </div>
      </div>
    </nav>
    </>
  );
};

export const StoreFooter = () => {
  const [socialLinks, setSocialLinks] = useState({});
  useEffect(() => {
    productsAPI.getStoreSettings().then(({ data }) => {
      const settings = Array.isArray(data) ? data[0] : data?.results?.[0];
      if (settings) setSocialLinks(settings);
    }).catch(() => {});
  }, []);
  const networks = [
    ['Facebook', socialLinks.social_facebook, <path key="f" d="M13.4 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2v2.3H7.6v3.1h2.7v8h3.1Z" />],
    ['Instagram', socialLinks.social_instagram, <><rect key="box" x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle key="lens" cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle key="dot" cx="18" cy="6" r="1.2" /></>],
    ['YouTube', socialLinks.social_youtube, <path key="yt" d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z" />],
  ];
  return (
    <footer className="store-footer">
      <Link to="/" className="footer-brand">{socialLinks.store_name || 'UrbanThread'}<span>®</span></Link>
      <p>Everyday style, thoughtfully chosen.</p>
      <div><Link to="/products">Shop</Link><Link to="/orders">Orders</Link><Link to="/profile">Your account</Link><Link to="/reviews">Reviews</Link></div>
      <nav className="footer-social-links" aria-label="Social media">{networks.map(([name, url, icon]) => url ? <a key={name} href={url} target="_blank" rel="noreferrer" aria-label={name} title={name}><svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg></a> : <span key={name} className="footer-social-disabled" aria-label={`${name} link not configured`} title={`${name} link not configured`}><svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg></span>)}</nav>
      <small>© {new Date().getFullYear()} {socialLinks.store_name || 'UrbanThread'}. Made for everyday.</small>
    </footer>
  );
};
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_staff && !user?.is_superuser) return <Navigate to="/" replace />;
  return children;
};

export const Loading = () => (
  <div className="loading">Loading...</div>
);
