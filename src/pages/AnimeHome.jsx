import React from "react";
import { useAuth } from "../context/AuthContext";
import SearchBar from "../components/SearchBar";
import Carousel from "../components/Carousel";
import Trending from "../components/Trending";
import TrendingManhwaManga from "../components/TrendingManhwaManga";
import RecentAnime from "../components/RecentAnime";
import RecentMangaManwa from "../components/RecentMangaManwa";
import ImageAnalyzer from "../components/ImageAnalyzer";
import GenereFilter from "../components/GenereFilter";
import Navbar from "../components/Navbar";

const AnimeHome = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header with user info and logout */}
      {/* <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🎬 AnimeHub</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user?.email}</span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header> */}
      <Navbar/>

      {/* Your existing components */}
      <div className="container mx-auto px-4 py-8">
        {/* <SearchBar />
        <GenereFilter />
        <ImageAnalyzer /> */}
        <Carousel />
        <Trending />
        <TrendingManhwaManga />
        <RecentAnime />
        <RecentMangaManwa />
      </div>
    </div>
  );
};

export default AnimeHome;
