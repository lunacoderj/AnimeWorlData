import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";
import GenereFilter from "./GenereFilter";
import ImageAnalyzer from "./ImageAnalyzer";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth");
    setIsProfileOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Left: Logo */}
          <div className="navbar-brand" onClick={() => navigate("/animehome")}>
            <div className="brand-logo">🎬</div>
            <span>AnimeHub</span>
          </div>

          {/* Center: Search + Filter + Analyzer */}
          <div className="navbar-center">
            <div className="navbar-search">
              <SearchBar />
            </div>
            <GenereFilter />
            <ImageAnalyzer />
          </div>

          {/* Right: Profile + Logout */}
          <div className="navbar-actions" ref={profileRef}>
            <button
              className="user-profile"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="user-avatar">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <span>{user?.email?.split("@")[0] || "User"}</span>
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate("/profile");
                    setIsProfileOpen(false);
                  }}
                >
                  👤 Profile
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate("/settings");
                    setIsProfileOpen(false);
                  }}
                >
                  ⚙️ Settings
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="nav-spacer"></div>
    </>
  );
};

export default Navbar;
