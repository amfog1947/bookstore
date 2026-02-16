import { Link } from "react-router-dom";

import shelfVerseLogo from "../../shelfverse-logo.png.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col brand-col">
          <div className="footer-brand-lockup">
            <img className="footer-logo-img" src={shelfVerseLogo} alt="ShelfVerse logo" />
            <p>ShelfVerse</p>
          </div>
          <span>Modern bookstore platform built with React + Firebase.</span>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <div className="footer-links">
            <Link to="/">Books</Link>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/settings">Settings</Link>
          </div>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <div className="footer-links">
            <a href="mailto:support@shelfverse.com">support@shelfverse.com</a>
            <span>Mon - Sat, 9:00 AM - 8:00 PM</span>
            <span>India</span>
          </div>
        </div>

        <div className="footer-col">
          <h4>Social</h4>
          <div className="footer-social">
            <a href="#" aria-label="Instagram" title="Instagram">
              <span className="social-icon">IG</span>
            </a>
            <a href="#" aria-label="LinkedIn" title="LinkedIn">
              <span className="social-icon">in</span>
            </a>
            <a href="#" aria-label="GitHub" title="GitHub">
              <span className="social-icon">GH</span>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">(c) {year} ShelfVerse. All rights reserved.</div>
    </footer>
  );
}
