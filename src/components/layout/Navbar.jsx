import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export default function Navbar() {
  const { currentUser, userProfile, logout, isAdmin } = useAuth();
  const { cartItems } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [openSettings, setOpenSettings] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!settingsRef.current) return;
      if (!settingsRef.current.contains(event.target)) {
        setOpenSettings(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="nav-shell">
      <nav className={currentUser ? "nav signed-in" : "nav signed-out"}>
        <NavLink to={currentUser ? "/" : "/login"} className="brand">
          <span className="logo-stack">
            <span className="logo-dot one" />
            <span className="logo-dot two" />
            <span className="logo-letter">SV</span>
          </span>
          <span className="brand-name">ShelfVerse</span>
        </NavLink>

        {currentUser ? (
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => (isActive ? "link-btn active" : "link-btn")}>
              Books
            </NavLink>
            <NavLink
              to="/wishlist"
              className={({ isActive }) => (isActive ? "link-btn active" : "link-btn")}
            >
              Wishlist <span className="count-pill">{wishlistCount}</span>
            </NavLink>
            <NavLink
              to="/cart"
              className={({ isActive }) => (isActive ? "link-btn active" : "link-btn")}
            >
              Cart <span className="count-pill">{cartCount}</span>
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) => (isActive ? "link-btn active" : "link-btn")}
            >
              My Orders
            </NavLink>

            <div className="settings-dd" ref={settingsRef}>
              <button
                className={openSettings ? "link-btn settings-nav-btn active" : "link-btn settings-nav-btn"}
                onClick={() => setOpenSettings((prev) => !prev)}
                type="button"
              >
                Settings
              </button>
              {openSettings ? (
                <div className="settings-menu-pop">
                  <div className="settings-user">
                    <p>{userProfile?.fullName?.trim() || "My Account"}</p>
                    <span>{currentUser.email}</span>
                    {userProfile?.address ? <small>{userProfile.address}</small> : null}
                  </div>
                  <button
                    type="button"
                    className="settings-item"
                    onClick={() => {
                      setOpenSettings(false);
                      navigate("/settings?tab=account");
                    }}
                  >
                    Account
                  </button>
                  <button
                    type="button"
                    className="settings-item"
                    onClick={() => {
                      setOpenSettings(false);
                      navigate("/settings?tab=help");
                    }}
                  >
                    Help
                  </button>
                  <button
                    type="button"
                    className="settings-item danger"
                    onClick={() => {
                      setOpenSettings(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>

            {isAdmin && (
              <NavLink
                to="/admin/books"
                className={({ isActive }) => (isActive ? "link-btn active" : "link-btn")}
              >
                Admin
              </NavLink>
            )}
          </div>
        ) : (
          <div className="nav-user">
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? "link-btn active" : "link-btn")}
            >
              Login
            </NavLink>
            <NavLink
              to="/signup"
              className={({ isActive }) => (isActive ? "link-btn active" : "link-btn")}
            >
              Signup
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  );
}
