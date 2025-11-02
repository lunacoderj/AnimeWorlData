// src/components/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Strict admin email validation
  const ADMIN_EMAILS = ["admin@animeworld.com", "jagadeesh@animeworld.com"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-white text-lg">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default AdminRoute;
