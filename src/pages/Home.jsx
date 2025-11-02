import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Home.css";
import AuthPage from "./AuthPage";
const Home = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      title: "Discover Anime",
      description:
        "Explore thousands of anime titles with detailed information",
      icon: "🎬",
    },
    {
      title: "Track Progress",
      description: "Keep track of your watching progress and favorites",
      icon: "📊",
    },
    {
      title: "Community",
      description: "Join discussions with fellow anime enthusiasts",
      icon: "👥",
    },
  ];

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  return (
    <div className="landing-container">
      {/* Animated Background */}
      <div className="animated-bg"></div>

      {/* Navigation */}
      <div className="divbar">
        <motion.div
          className="logo"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="logo-icon">🎭</span>
          <span className="logo-text">AnimeWorld</span>
        </motion.div>

        <div className="div-links">
          <motion.button
            onClick={() => navigate("/auth?tab=login")}
            className="div-link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Login
          </motion.button>
          <motion.button
            onClick={() => navigate("/auth?tab=signup")}
            className="div-link signup-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign Up
          </motion.button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="hero-title">
            Welcome to
            <span className="gradient-text"> AnimeWorld</span>
          </h1>
          <p className="hero-subtitle">
            Your ultimate destination for anime discovery, tracking, and
            community
          </p>

          <motion.div
            className="feature-showcase"
            key={currentFeature}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="feature-icon">{features[currentFeature].icon}</div>
            <h3>{features[currentFeature].title}</h3>
            <p>{features[currentFeature].description}</p>
          </motion.div>

          <div className="cta-buttons">
            <motion.button
              onClick={() => navigate("/auth?tab=signup")}
              className="cta-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
            <motion.button
              className="cta-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>

        {!isMobile && (
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="floating-card card-1">🎌</div>
            <div className="floating-card card-2">🌟</div>
            <div className="floating-card card-3">📺</div>
          </motion.div>
        )}
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <motion.div className="stat" whileHover={{ scale: 1.05 }}>
            <h3>10K+</h3>
            <p>Anime Titles</p>
          </motion.div>
          <motion.div className="stat" whileHover={{ scale: 1.05 }}>
            <h3>50K+</h3>
            <p>Active Users</p>
          </motion.div>
          <motion.div className="stat" whileHover={{ scale: 1.05 }}>
            <h3>100K+</h3>
            <p>Reviews</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
