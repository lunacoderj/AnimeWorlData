// src/components/AdminLogin.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { motion } from "framer-motion";
import "./AdminLogin.css";

const AdminLogin = ({ onAdminLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    secretKey: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // List of admin emails (you can store this in environment variables)
  const ADMIN_EMAILS = ["admin@animeworld.com", "jagadeesh@animeworld.com"];

  const SECRET_KEY = "101523"; // Store in environment variables

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate secret key first
      if (formData.secretKey !== SECRET_KEY) {
        throw new Error("Invalid admin secret key");
      }

      // Validate admin email
      if (!ADMIN_EMAILS.includes(formData.email)) {
        throw new Error("Unauthorized admin access");
      }

      // Firebase authentication
      const userCred = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Additional admin verification
      if (!ADMIN_EMAILS.includes(userCred.user.email)) {
        await auth.signOut();
        throw new Error("User is not authorized as admin");
      }

      console.log("Admin login successful:", userCred.user.email);
      onAdminLogin(userCred.user);
    } catch (error) {
      console.error("Admin login error:", error);
      setError(getAdminErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const getAdminErrorMessage = (error) => {
    switch (error.code) {
      case "auth/invalid-email":
        return "Invalid email format";
      case "auth/user-disabled":
        return "This account has been disabled";
      case "auth/user-not-found":
        return "No admin account found with this email";
      case "auth/wrong-password":
        return "Incorrect password";
      case "auth/too-many-requests":
        return "Too many failed attempts. Try again later";
      default:
        return error.message || "Admin authentication failed";
    }
  };

  return (
    <div className="admin-login-container">
      <motion.div
        className="admin-login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="admin-login-header">
          <div className="admin-icon">🔒</div>
          <h2>Admin Portal</h2>
          <p>Restricted Access - Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="input-group">
            <label>Admin Email</label>
            <input
              type="email"
              name="email"
              placeholder="admin@animeworld.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="username"
              className="admin-input"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="admin-input"
            />
          </div>

          <div className="input-group">
            <label>Secret Admin Key</label>
            <input
              type="password"
              name="secretKey"
              placeholder="Enter secret key"
              value={formData.secretKey}
              onChange={handleChange}
              required
              className="admin-input secret-input"
            />
          </div>

          {error && (
            <motion.div
              className="admin-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="admin-login-btn"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <div className="admin-loading">
                <div className="spinner"></div>
                Verifying Admin...
              </div>
            ) : (
              "🔓 Access Admin Dashboard"
            )}
          </motion.button>
        </form>

        <div className="admin-security-notice">
          <h4>Security Notice:</h4>
          <ul>
            <li>This portal is for authorized administrators only</li>
            <li>All access attempts are logged</li>
            <li>Unauthorized access is prohibited</li>
            <li>Contact system administrator for issues</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
