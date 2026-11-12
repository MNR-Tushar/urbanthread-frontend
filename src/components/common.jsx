import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { authAPI, cartAPI, productsAPI } from '../api';

const MenuIcon = ({ name }) => <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{name === 'account' ? <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6" /><circle cx="12" cy="12" r="10" /></> : name === 'orders' ? <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></> : name === 'reviews' ? <path d="m12 2.5 2.9 6 6.6 1-4.8 4.7 1.2 6.7L12 17.7l-5.9 3.2 1.1-6.7-4.8-4.7 6.7-1L12 2.5Z" /> : name === 'payments' ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 15h4" /></> : name === 'coupons' ? <><path d="M3 12 12 3h8v8l-9 10-8-9Z" /><circle cx="16" cy="8" r="1" /></> : name === 'wishlist' ? <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /> : <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>}</g></svg>;

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [profileAvatar, setProfileAvatar] = useState('');
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
        if (active) setCartCount(new Set((data.items || []).map((item) => item.product?.id).filter(Boolean)).size);
      }).catch(() => { if (active) setCartCount(0); });
    };
    refreshCartCount();
    window.addEventListener('urbanthread:cart-updated', refreshCartCount);
    return () => { active = false; window.removeEventListener('urbanthread:cart-updated', refreshCartCount); };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !user?.id) { setProfileAvatar(''); return undefined; }
    authAPI.getProfiles().then(({ data }) => {
      const profiles = Array.isArray(data) ? data : data?.results || [];
      const profile = profiles.find((item) => Number(item.user) === Number(user.id));
      if (active) setProfileAvatar(profile?.image || '');
    }).catch(() => { if (active) setProfileAvatar(''); });
    return () => { active = false; };
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
          {isAuthenticated ? <div className="profile-menu-wrap" ref={profileMenuRef} onPointerEnter={(event) => { if (event.pointerType === 'mouse') setProfileOpen(true); }} onPointerLeave={(event) => { if (event.pointerType === 'mouse') setProfileOpen(false); }}>
            <button
              type="button"
              className="profile-menu-trigger"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen(true)}
            >
              <span className="profile-trigger-avatar">{profileAvatar ? <img src={profileAvatar} alt="" /> : (user?.first_name || user?.username || 'U').slice(0, 1).toUpperCase()}</span>
              <span className="profile-trigger-copy"><small>Hello,</small><strong>{user?.first_name || user?.username || 'Account'}</strong></span>
              <svg className="profile-trigger-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d={profileOpen ? 'm3 10 5-5 5 5' : 'm3 6 5 5 5-5'} /></svg>
            </button>
            {profileOpen && <div className="profile-dropdown" role="menu">
              <Link role="menuitem" to="/profile" onClick={() => setProfileOpen(false)}><MenuIcon name="account" /><span>Account Info</span></Link>
              <Link role="menuitem" to="/orders" onClick={() => setProfileOpen(false)}><MenuIcon name="orders" /><span>Orders &amp; Tracking</span></Link>
              <Link role="menuitem" to="/reviews" onClick={() => setProfileOpen(false)}><MenuIcon name="reviews" /><span>Rating &amp; Reviews</span></Link>
              <Link role="menuitem" to="/payments" onClick={() => setProfileOpen(false)}><MenuIcon name="payments" /><span>Payment Info</span></Link>
              <Link role="menuitem" to="/wishlist" onClick={() => setProfileOpen(false)}><MenuIcon name="wishlist" /><span>Wishlist</span></Link>
              <Link role="menuitem" to="/coupons" onClick={() => setProfileOpen(false)}><MenuIcon name="coupons" /><span>Coupons</span></Link>
              {(user?.is_staff || user?.is_superuser) && <><Link role="menuitem" to="/admin" onClick={() => setProfileOpen(false)}><MenuIcon name="admin" /><span>Admin dashboard</span></Link><Link role="menuitem" to="/inventory" onClick={() => setProfileOpen(false)}><MenuIcon name="admin" /><span>Products &amp; inventory</span></Link></>}
              <button className="profile-signout" type="button" role="menuitem" onClick={handleLogout}><span aria-hidden="true">↪</span><span>Sign Out</span></button>
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
