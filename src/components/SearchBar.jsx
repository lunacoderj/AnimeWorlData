import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchBar.css";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Simple API implementation
  const searchAnime = async (search = "", page = 1, perPage = 10) => {
    const graphqlQuery = `
            query ($search: String, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        perPage
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    media(search: $search, type: ANIME) {
                        id
                        title {
                            romaji
                            english
                            native
                            userPreferred
                        }
                        type
                        format
                        status
                        description
                        season
                        seasonYear
                        episodes
                        duration
                        genres
                        averageScore
                        popularity
                        coverImage {
                            large
                            medium
                            color
                        }
                        bannerImage
                        siteUrl
                        nextAiringEpisode {
                            airingAt
                            episode
                        }
                    }
                }
            }
        `;

    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { search, page, perPage },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL Error: ${data.errors[0].message}`);
      }

      return data.data;
    } catch (error) {
      console.error("AniList API Error:", error);
      throw error;
    }
  };

  // Handle search input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length > 2) {
      setIsLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        performLiveSearch(value);
      }, 300);
    } else {
      setResults([]);
      setIsLoading(false);
      setShowResults(false);
    }
  };

  // Perform live search
  const performLiveSearch = async (searchQuery) => {
    try {
      const data = await searchAnime(searchQuery, 1, 8);
      setResults(data.Page.media || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      await performMainSearch(query);
    }
  };

  // Handle search button click
  const handleSearchClick = async () => {
    if (query.trim().length > 0) {
      await performMainSearch(query);
    }
  };

  // Perform main search
  const performMainSearch = async (searchQuery) => {
    setIsLoading(true);
    try {
      const data = await searchAnime(searchQuery, 1, 20);
      setResults(data.Page.media || []);
      setShowResults(false);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle anime selection from live results
  const handleAnimeSelect = (anime) => {
    navigate(`/anime/${anime.id}`);
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".search-container")) {
        setShowResults(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Function to clean HTML description
  const cleanDescription = (html) => {
    if (!html) return "";
    return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "RELEASING":
        return "#48bb78";
      case "FINISHED":
        return "#4299e1";
      case "NOT_YET_RELEASED":
        return "#ed8936";
      case "CANCELLED":
        return "#f56565";
      case "HIATUS":
        return "#9f7aea";
      default:
        return "#a0aec0";
    }
  };

  const getFormatText = (format) => {
    switch (format) {
      case "TV":
        return "TV Series";
      case "TV_SHORT":
        return "TV Short";
      case "MOVIE":
        return "Movie";
      case "SPECIAL":
        return "Special";
      case "OVA":
        return "OVA";
      case "ONA":
        return "ONA";
      case "MUSIC":
        return "Music";
      default:
        return format;
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search for anime..."
            className="search-input"
            aria-label="Search anime"
          />
          <button
            type="submit"
            className="search-button"
            onClick={handleSearchClick}
            aria-label="Search"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <SearchIcon />
            )}
          </button>
        </div>
      </form>

      {/* Live Search Results */}
      {showResults && (results.length > 0 || isLoading) && (
        <div className="live-results">
          {isLoading ? (
            <div className="loading-spinner">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Searching...
            </div>
          ) : (
            <div className="results-list">
              {results.map((anime) => (
                <div
                  key={anime.id}
                  className="result-item"
                  onClick={() => handleAnimeSelect(anime)}
                >
                  <img
                    src={anime.coverImage.medium || anime.coverImage.large}
                    alt={anime.title.userPreferred}
                    className="anime-cover"
                  />
                  <div className="anime-info">
                    <h4 className="anime-title">{anime.title.userPreferred}</h4>
                    <div className="anime-details">
                      <span className="anime-format">
                        {getFormatText(anime.format)}
                      </span>
                      <span
                        className="anime-status-badge"
                        style={{
                          backgroundColor: getStatusColor(anime.status),
                        }}
                      >
                        {anime.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Results Display */}
      {results.length > 0 && !showResults && (
        <div className="main-results-section">
          <h2 className="results-title">Search Results for "{query}"</h2>
          <div className="results-grid">
            {results.map((anime) => (
              <div
                key={anime.id}
                className="anime-card"
                onClick={() => handleAnimeSelect(anime)}
              >
                <div className="card-image-container">
                  <img
                    src={anime.coverImage.large}
                    alt={anime.title.userPreferred}
                    className="card-image"
                  />
                  <div className="card-overlay">
                    <div className="score-badge">
                      ★{" "}
                      {anime.averageScore
                        ? (anime.averageScore / 10).toFixed(1)
                        : "N/A"}
                    </div>
                  </div>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{anime.title.userPreferred}</h3>
                  <div className="card-details">
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">
                        {getFormatText(anime.format)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Episodes:</span>
                      <span className="detail-value">
                        {anime.episodes || "?"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(anime.status),
                        }}
                      >
                        {anime.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <span className="dub-badge">SUB</span>
                    <span className="dub-badge">DUB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Search icon component
const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default SearchBar;
