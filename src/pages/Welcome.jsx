import React, { useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Welcome.css";
const Welcome = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(getUserName(user));
      setUserEmail(user.email || "");
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const getUserName = (user) => {
    const displayName = user.displayName;
    if (displayName) {
      const names = displayName.split(" ");
      if (names.length >= 2) {
        return `${names[0]} ${names[1]}`;
      }
      return displayName;
    }
    return user.email?.split("@")[0] || "User";
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: "🎬",
      title: "Browse Anime",
      description:
        "Discover thousands of anime titles with detailed information",
    },
    {
      icon: "⭐",
      title: "Rate & Review",
      description: "Share your thoughts and rate your favorite shows",
    },
    {
      icon: "👥",
      title: "Join Community",
      description: "Connect with fellow anime enthusiasts worldwide",
    },
    {
      icon: "📱",
      title: "Watch Anywhere",
      description: "Access your account across all your devices",
    },
  ];

  const quickActions = [
    { icon: "🔍", label: "Search Anime", action: () => navigate("/animehome") },
    { icon: "❤️", label: "Favorites", action: () => navigate("/favorites") },
    { icon: "📚", label: "Watchlist", action: () => navigate("/watchlist") },
    { icon: "⚙️", label: "Settings", action: () => navigate("/settings") },
  ];

  return (
    <div className="welcome-container">
      {/* Animated Background */}
      <div className="welcome-background"></div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-element">🎌</div>
        <div className="floating-element">🌟</div>
        <div className="floating-element">📺</div>
        <div className="floating-element">🎭</div>
      </div>

      <motion.div
        className="welcome-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section */}
        <div className="welcome-header">
          <motion.div
            className="welcome-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            🎉
          </motion.div>

          <h1 className="welcome-title">
            Welcome, <span className="user-greeting">{userName}</span>! 👋
          </h1>

          {/* Uncomment these if you want to use SearchBar and Carousel */}

          <p className="welcome-subtitle">
            Thank you for joining AnimeWorld. We're excited to have you as part
            of our community! Start exploring thousands of anime titles and
            connect with fellow fans.
          </p>

          {userEmail && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ color: "#a0a0a0", fontSize: "0.9rem" }}
            >
              Logged in as: {userEmail}
            </motion.p>
          )}
        </div>

        {/* Features Grid */}
        <motion.div
          className="features-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="quick-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="quick-actions-title">Quick Actions</h3>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                className="quick-action-btn"
                onClick={action.action}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <span className="quick-action-icon">{action.icon}</span>
                <span className="quick-action-label">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="action-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            className="action-btn btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/browse")}
          >
            🎬 Explore Anime
          </motion.button>

          <motion.button
            className="action-btn btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/profile")}
          >
            👤 My Profile
          </motion.button>

          <motion.button
            className={`action-btn btn-danger ${
              isLoading ? "btn-loading" : ""
            }`}
            onClick={logout}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? "" : "🚪 Logout"}
          </motion.button>
        </motion.div>

        {/* User Stats */}
        <motion.div
          className="user-stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Anime Titles</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">50K+</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100K+</span>
            <span className="stat-label">Reviews</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Welcome;
