import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
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

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
  };
  return (
    <>
    <div className="announcement-bar"><span>THE EVERYDAY EDIT</span><i /> Thoughtful style, delivered to your door <span className="announcement-right">Free delivery on orders over ৳2,500</span></div>
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">urban<span>thread</span><b>®</b></Link>
        <form className="nav-search" onSubmit={(event) => { event.preventDefault(); navigate(`/products${searchText.trim() ? `?search=${encodeURIComponent(searchText.trim())}` : ''}`); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search the collection" aria-label="Search products" />
          <button type="submit">Search</button>
        </form>
        <div className="navbar-actions">
          <Link to="/">Home</Link>
          <Link to="/products">Shop</Link>
          <Link to="/cart" className="nav-cart-link"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.4L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>Bag</span></Link>
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

export const StoreFooter = () => (
  <footer className="store-footer">
    <Link to="/" className="footer-brand">UrbanThread<span>®</span></Link>
    <p>Everyday style, thoughtfully chosen.</p>
    <div><Link to="/products">Shop</Link><Link to="/orders">Orders</Link><Link to="/profile">Your account</Link><Link to="/reviews">Reviews</Link></div>
    <small>© {new Date().getFullYear()} UrbanThread. Made for everyday.</small>
  </footer>
);

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
