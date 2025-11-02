import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Welcome from "./pages/Welcome";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import "./App.css";
import Details from "./components/Details";
import AnimeHome from "./pages/AnimeHome";
import Watch from "./components/Watch";
import Read from "./components/Read";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Public Routes - No authentication required */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* ALL OTHER ROUTES ARE PROTECTED */}
        <Route
          path="/animehome"
          element={
            <PrivateRoute>
              <AnimeHome />
            </PrivateRoute>
          }
        />

        {/* Protected Media Routes */}
        <Route
          path="/details/:id"
          element={
            <PrivateRoute>
              <Details />
            </PrivateRoute>
          }
        />

        {/* Protected Watch Routes for Anime */}
        <Route
          path="/watch/:id"
          element={
            <PrivateRoute>
              <Watch />
            </PrivateRoute>
          }
        />
        <Route
          path="/view/:id/:episode"
          element={
            <PrivateRoute>
              <Watch />
            </PrivateRoute>
          }
        />

        {/* Protected Read Routes for Manga/Manhwa */}
        <Route
          path="/read/:id"
          element={
            <PrivateRoute>
              <Read />
            </PrivateRoute>
          }
        />
        <Route
          path="/read/:id/:chapter"
          element={
            <PrivateRoute>
              <Read />
            </PrivateRoute>
          }
        />

        {/* Protected Legacy route */}
        <Route
          path="/anime/:id"
          element={
            <PrivateRoute>
              <Details />
            </PrivateRoute>
          }
        />

        {/* Protected User Routes */}
        <Route
          path="/welcome"
          element={
            <PrivateRoute>
              <Welcome />
            </PrivateRoute>
          }
        />

        {/* Protected Admin Route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
