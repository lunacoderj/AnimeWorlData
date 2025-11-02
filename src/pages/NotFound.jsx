// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./NotFound.css";

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <motion.div
        className="not-found-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="not-found-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          🔍
        </motion.div>

        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>

        <p className="not-found-description">
          Oops! The page you're looking for seems to have wandered off into the
          anime universe. It might have been moved, deleted, or never existed in
          the first place.
        </p>

        <div className="not-found-actions">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="not-found-btn primary"
          >
            <Link to="/">🏠 Go Home</Link>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="not-found-btn secondary"
          >
            <Link to="/auth">🔐 Back to Login</Link>
          </motion.button>
        </div>

        <div className="not-found-tips">
          <h3>Quick Tips:</h3>
          <ul>
            <li>Check the URL for typos</li>
            <li>Use the navigation menu</li>
            <li>Return to the homepage</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
