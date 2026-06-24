
import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeAll = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    closeAll();
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="nav-logo">AutoDoc.ai</div>
      </div>

      <ul id="primary-navigation" className={`nav-links ${isOpen ? "open" : ""}`}>
        <li>
          <NavLink to="/" onClick={closeAll}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/generator" onClick={closeAll}>
            Generator
          </NavLink>
        </li>
        <li>
          <NavLink to="/contributors" onClick={closeAll}>
            Contributors
          </NavLink>
        </li>
        {user && (
          <li className="logout-mobile">
            <button onClick={handleLogout} className="logout-btn-mobile">
              Logout
            </button>
          </li>
        )}
      </ul>

      <div className="nav-actions">
        {user && (
          <div className="user-dropdown">
            <button className="user-dropdown-trigger" aria-label="User menu">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="user-dropdown-avatar" />
              ) : (
                <div className="user-dropdown-avatar user-dropdown-initial">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="user-dropdown-name">{user.name}</span>
              <svg className="user-dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="user-dropdown-menu">
              <Link to="/dashboard" className="user-dropdown-item" onClick={closeAll}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </Link>
              <Link to="/profile" className="user-dropdown-item" onClick={closeAll}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile
              </Link>
              <hr className="user-dropdown-divider" />
              <button onClick={handleLogout} className="user-dropdown-item user-dropdown-logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
        <ThemeToggle />

        <button
          type="button"
          className={`hamburger ${isOpen ? "toggle" : ""}`}
          onClick={toggleMenu}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
        >
          <div className="line1"></div>
          <div className="line2"></div>
          <div className="line3"></div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;