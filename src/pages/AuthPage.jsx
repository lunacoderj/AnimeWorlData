// src/pages/AuthPage.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";
import { useSearchParams } from "react-router-dom";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "signup";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [formData, setFormData] = useState({
    // Common fields
    email: "",
    password: "",

    // Signup fields
    username: "",
    firstName: "",
    lastName: "",
    phone: "",
    rePassword: "",
  });

  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const flipVariants = {
    hidden: {
      opacity: 0,
      rotateY: 90,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      rotateY: -90,
      scale: 0.8,
      transition: {
        duration: 0.4,
        ease: "easeIn",
      },
    },
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Signup specific validations
    if (!isLogin) {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      }
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (!formData.phone) {
        newErrors.phone = "Phone number is required";
      } else if (!/^[0-9]{10}$/.test(formData.phone)) {
        newErrors.phone = "Phone must be exactly 10 digits";
      }
      if (!formData.rePassword) {
        newErrors.rePassword = "Please re-enter password";
      } else if (formData.password !== formData.rePassword) {
        newErrors.rePassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Email/Password Authentication
  // Email/Password Authentication - FIX THIS FUNCTION
  const handleEmailAuth = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const userCred = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        console.log("✅ Login successful:", userCred.user.email);
        navigate("/welcome");
      } else {
        // Sign Up
        const { username, firstName, lastName, phone, email, password } =
          formData;

        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Update profile
        const displayName = `${firstName} ${lastName}`;
        await updateProfile(userCred.user, {
          displayName: displayName,
        });

        // ✅ FIXED: Use environment variable for API URL
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        await axios.post(`${API_URL}/api/users`, {
          username,
          firstName,
          lastName,
          displayName,
          phone: `+91${phone}`,
          email,
          uid: userCred.user.uid,
          createdAt: new Date(),
        });

        console.log("✅ Signup successful:", userCred.user.email);
        navigate("/welcome");
      }
    } catch (error) {
      console.error("❌ Authentication error:", error);
      setErrors({ submit: getAuthErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  // Google Authentication - FIX THIS FUNCTION TOO
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Prepare user data for MongoDB
      const userData = {
        uid: user.uid,
        username:
          user.displayName?.replace(/\s+/g, "").toLowerCase() ||
          user.email.split("@")[0],
        firstName: user.displayName?.split(" ")[0] || "Google",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "User",
        displayName: user.displayName || user.email.split("@")[0],
        email: user.email,
        googleAuth: true,
      };

      // ✅ FIXED: Use environment variable for API URL
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      await axios.post(`${API_URL}/api/users`, userData);
      console.log("✅ Google auth successful");
      navigate("/welcome");
    } catch (error) {
      console.error("❌ Google auth error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        setErrors({ submit: getAuthErrorMessage(error) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Error message handler
  const getAuthErrorMessage = (error) => {
    switch (error.code) {
      case "auth/invalid-email":
        return "Invalid email address format.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password is too weak. Please use a stronger password.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      default:
        return error.message || "Authentication failed. Please try again.";
    }
  };

  // Toggle between login and signup
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    // Reset form but keep email for better UX
    setFormData((prev) => ({
      email: prev.email, // Keep email
      password: "",
      username: "",
      firstName: "",
      lastName: "",
      phone: "",
      rePassword: "",
    }));
  };

  return (
    <div className="auth-container">
      {/* Animated Background */}
      <div className="auth-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <motion.div
        className="auth-card"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div className="auth-header" variants={itemVariants}>
          <div className="logo-container">
            <motion.div
              className="logo"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              🎬
            </motion.div>
          </div>
          <motion.h2
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isLogin ? "Welcome Back! 👋" : "Join AnimeWorld! 🎉"}
          </motion.h2>
          <p className="auth-subtitle">
            {isLogin
              ? "Sign in to continue your anime journey"
              : "Create your account and dive into the anime universe"}
          </p>
        </motion.div>

        {/* Toggle Switch */}
        <motion.div className="auth-toggle" variants={itemVariants}>
          <div className="toggle-container">
            <button
              className={`toggle-option ${isLogin ? "active" : ""}`}
              onClick={() => !isLogin && toggleAuthMode()}
            >
              Login
            </button>
            <button
              className={`toggle-option ${!isLogin ? "active" : ""}`}
              onClick={() => isLogin && toggleAuthMode()}
            >
              Sign Up
            </button>
            <motion.div
              className="toggle-slider"
              initial={false}
              animate={{ x: isLogin ? "0%" : "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </motion.div>

        {/* Form Section */}
        <AnimatePresence mode="wait">
          <motion.form
            key={isLogin ? "login" : "signup"}
            variants={flipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onSubmit={handleEmailAuth}
            className="auth-form"
          >
            {/* Signup Fields - Only show when signing up */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="signup-fields"
              >
                <div className="form-row">
                  <div className="input-group">
                    <input
                      type="text"
                      name="username"
                      placeholder="Create Username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`auth-input ${errors.username ? "error" : ""}`}
                    />
                    {errors.username && (
                      <span className="error-message">{errors.username}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`auth-input ${
                        errors.firstName ? "error" : ""
                      }`}
                    />
                    {errors.firstName && (
                      <span className="error-message">{errors.firstName}</span>
                    )}
                  </div>

                  <div className="input-group">
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`auth-input ${errors.lastName ? "error" : ""}`}
                    />
                    {errors.lastName && (
                      <span className="error-message">{errors.lastName}</span>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number (10 digits)"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength="10"
                    className={`auth-input ${errors.phone ? "error" : ""}`}
                  />
                  {errors.phone && (
                    <span className="error-message">{errors.phone}</span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Common Fields */}
            <motion.div variants={itemVariants} className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className={`auth-input ${errors.email ? "error" : ""}`}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="input-group">
              <input
                type="password"
                name="password"
                placeholder={isLogin ? "Password" : "Create Password"}
                value={formData.password}
                onChange={handleChange}
                className={`auth-input ${errors.password ? "error" : ""}`}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </motion.div>

            {/* Confirm Password - Only for signup */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="input-group"
              >
                <input
                  type="password"
                  name="rePassword"
                  placeholder="Re-enter Password"
                  value={formData.rePassword}
                  onChange={handleChange}
                  className={`auth-input ${errors.rePassword ? "error" : ""}`}
                />
                {errors.rePassword && (
                  <span className="error-message">{errors.rePassword}</span>
                )}
              </motion.div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="submit-error"
              >
                ⚠️ {errors.submit}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="auth-submit-btn"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : isLogin ? (
                "🚀 Sign In"
              ) : (
                "🎉 Create Account"
              )}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <motion.div className="auth-divider" variants={itemVariants}>
          <span>or continue with</span>
        </motion.div>

        {/* Google Auth Button */}
        <motion.button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="google-auth-btn"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isLogin ? "Sign in with Google" : "Sign up with Google"}
        </motion.button>

        {/* Auth Switch */}
        <motion.div className="auth-switch" variants={itemVariants}>
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <motion.button
              className="switch-btn"
              onClick={toggleAuthMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </motion.button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
