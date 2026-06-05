import React from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/NotFound.css";
import Navbar from "../components/Navbar";

const NotFound = () => {
  return (
    <div className="notfound-container">
      <Navbar />

      <main className="content-wrapper">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-desc">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Homepage
        </Link>
      </main>

      <footer>
        <p>
          ©AutoDoc.ai | Maintained by{" "}
          <a
            href="https://github.com/abhro05"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit maintainer's GitHub profile"
          >
            abhro05
          </a>{" "}
          | MIT License | 2026
        </p>
      </footer>
    </div>
  );
};

export default NotFound;
