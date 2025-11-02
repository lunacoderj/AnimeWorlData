// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import AdminLogin from "./AdminLogin";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayLogins: 0,
    googleUsers: 0,
    phoneUsers: 0,
  });
  const navigate = useNavigate();

  // Strict admin email validation
  const ADMIN_EMAILS = ["admin@animeworld.com", "jagadeesh@animeworld.com"];

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const user = auth.currentUser;
    if (user && ADMIN_EMAILS.includes(user.email)) {
      setIsAdmin(true);
      fetchUsers();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users");
      const usersData = response.data;

      setUsers(usersData);

      // Calculate stats
      const today = new Date().toDateString();
      const todayLogins = usersData.filter(
        (user) => new Date(user.lastLogin).toDateString() === today
      ).length;

      const googleUsers = usersData.filter((user) => user.googleAuth).length;
      const phoneUsers = usersData.filter((user) => user.phoneAuth).length;

      setStats({
        totalUsers: usersData.length,
        todayLogins,
        googleUsers,
        phoneUsers,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (user) => {
    if (ADMIN_EMAILS.includes(user.email)) {
      setIsAdmin(true);
      fetchUsers();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!isAdmin) {
    return <AdminLogin onAdminLogin={handleAdminLogin} />;
  }

  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <motion.header
        className="admin-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>👑 Admin Dashboard</h1>
            <p>User Management & Analytics</p>
          </div>
          <div className="admin-actions">
            <button onClick={fetchUsers} className="refresh-btn">
              🔄 Refresh
            </button>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </motion.header>

      {/* Stats Overview */}
      <motion.section
        className="stats-overview"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>{stats.todayLogins}</h3>
              <p>Today's Logins</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔵</div>
            <div className="stat-info">
              <h3>{stats.googleUsers}</h3>
              <p>Google Users</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-info">
              <h3>{stats.phoneUsers}</h3>
              <p>Phone Users</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Users Table */}
      <motion.section
        className="users-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="section-header">
          <h2>User Accounts</h2>
          <span className="user-count">{users.length} users</span>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Auth Method</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.displayName?.charAt(0) || "U"}
                      </div>
                      <div className="user-details">
                        <strong>{user.displayName || "User"}</strong>
                        <span>@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.email || "N/A"}</td>
                  <td>{user.phone || "N/A"}</td>
                  <td>
                    <span
                      className={`auth-badge ${
                        user.googleAuth
                          ? "google"
                          : user.phoneAuth
                          ? "phone"
                          : "email"
                      }`}
                    >
                      {user.googleAuth
                        ? "Google"
                        : user.phoneAuth
                        ? "Phone"
                        : "Email"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="login-info">
                      <span>{formatDate(user.lastLogin)}</span>
                      <small>{getTimeAgo(user.lastLogin)}</small>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge active">Active</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="no-users">
            <div className="no-users-icon">📝</div>
            <h3>No Users Found</h3>
            <p>User data will appear here once users start registering.</p>
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default AdminDashboard;
