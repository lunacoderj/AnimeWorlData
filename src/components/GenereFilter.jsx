import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./GenereFilter.css";

const GenereFilter = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    genres: [],
    categories: [],
    status: [],
    years: [],
    types: [],
    studios: [],
    producers: [],
    broadcast: [],
    rating: [],
    sort: "TRENDING_DESC",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableOptions, setAvailableOptions] = useState({
    genres: [],
    years: [],
    studios: [],
  });
  const filterRef = useRef(null);

  // Available options data
  const filterOptions = {
    genres: [
      "Action",
      "Adventure",
      "Comedy",
      "Drama",
      "Fantasy",
      "Horror",
      "Mystery",
      "Romance",
      "Sci-Fi",
      "Slice of Life",
      "Sports",
      "Supernatural",
      "Thriller",
      "Isekai",
      "Mecha",
      "Psychological",
      "School",
      "Shounen",
      "Shoujo",
      "Seinen",
      "Josei",
    ],
    categories: [
      "Top Airing",
      "Trending",
      "Most Popular",
      "Highest Rated",
      "Upcoming",
      "Classic",
      "New Releases",
      "Ongoing Series",
      "Completed",
    ],
    status: [
      "RELEASING",
      "FINISHED",
      "NOT_YET_RELEASED",
      "CANCELLED",
      "HIATUS",
    ],
    types: ["ANIME", "MANGA", "MANHWA", "MANHUA", "NOVEL", "ONE_SHOT"],
    broadcast: ["SUBS", "DUBS", "BOTH"],
    rating: ["G", "PG", "PG-13", "R", "R+"],
    sort: [
      { value: "TRENDING_DESC", label: "🔥 Trending" },
      { value: "POPULARITY_DESC", label: "👥 Popular" },
      { value: "SCORE_DESC", label: "⭐ Highest Rated" },
      { value: "START_DATE_DESC", label: "🆕 Newest" },
      { value: "START_DATE", label: "📅 Oldest" },
      { value: "FAVOURITES_DESC", label: "❤️ Most Favorited" },
    ],
  };

  // Generate recent years (2000-current)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1999 },
    (_, i) => currentYear - i
  );

  useEffect(() => {
    fetchPopularStudios();
    fetchAvailableData();
  }, []);

  // Close filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPopularStudios = async () => {
    try {
      const query = `
        query {
          Page(page: 1, perPage: 20) {
            studios(sort: FAVOURITES_DESC) {
              name
            }
          }
        }
      `;
      const response = await axios.post("https://graphql.anilist.co", {
        query,
      });
      const studios = response.data.data.Page.studios.map(
        (studio) => studio.name
      );
      setAvailableOptions((prev) => ({ ...prev, studios }));
    } catch (error) {
      console.error("Error fetching studios:", error);
    }
  };

  const fetchAvailableData = () => {
    setAvailableOptions((prev) => ({
      ...prev,
      years,
      genres: filterOptions.genres,
    }));
  };

  const handleFilterChange = (category, value) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

  const handleSortChange = (value) => {
    setFilters((prev) => ({ ...prev, sort: value }));
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const response = await axios.post("https://graphql.anilist.co", {
        query,
      });

      const media = response.data.data.Page.media.filter(
        (item) => item !== null
      );
      setResults(media);
      setIsFilterOpen(false);
    } catch (error) {
      console.error("Error fetching filtered results:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildQuery = () => {
    const { genres, status, years, types, sort } = filters;

    let genreFilter =
      genres.length > 0
        ? `genre_in: [${genres.map((g) => `"${g}"`).join(", ")}]`
        : "";
    let statusFilter =
      status.length > 0 ? `status_in: [${status.join(", ")}]` : "";
    let yearFilter =
      years.length > 0
        ? `startDate_greater: ${Math.min(
            ...years
          )}0101, startDate_lesser: ${Math.max(...years)}1231`
        : "";
    let typeFilter =
      types.length > 0
        ? `type_in: [${types
            .map((t) => (t === "MANHWA" || t === "MANHUA" ? "MANGA" : t))
            .join(", ")}]`
        : "";

    const filtersCombined = [genreFilter, statusFilter, yearFilter, typeFilter]
      .filter(Boolean)
      .join(", ");

    return `
      query {
        Page(page: 1, perPage: 50) {
          media(sort: ${sort}, ${
      filtersCombined
        ? `${
            filtersCombined.includes("type_in")
              ? "type: MANGA,"
              : "type: ANIME,"
          } ${filtersCombined}`
        : "type: ANIME"
    }) {
            id
            title {
              romaji
              english
            }
            coverImage {
              large
            }
            type
            format
            status
            averageScore
            episodes
            chapters
            genres
            startDate {
              year
            }
          }
        }
      }
    `;
  };

  const clearFilters = () => {
    setFilters({
      genres: [],
      categories: [],
      status: [],
      years: [],
      types: [],
      studios: [],
      producers: [],
      broadcast: [],
      rating: [],
      sort: "TRENDING_DESC",
    });
    setResults([]);
  };

  const getSelectedCount = () => {
    return Object.values(filters).reduce(
      (total, category) => total + category.length,
      0
    );
  };

  const FilterSection = ({ title, options, category, type = "checkbox" }) => (
    <div className="filter-section">
      <h4>{title}</h4>
      <div className="filter-options">
        {options.map((option) => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          return (
            <label key={value} className="filter-option">
              <input
                type={type}
                checked={filters[category].includes(value)}
                onChange={() =>
                  type === "checkbox"
                    ? handleFilterChange(category, value)
                    : handleSortChange(value)
                }
              />
              <span className="checkmark"></span>
              {label}
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="genere-filter-container" ref={filterRef}>
      {/* Filter Button */}
      <button
        className={`filter-toggle-btn ${
          getSelectedCount() > 0 ? "has-filters" : ""
        }`}
        onClick={() => setIsFilterOpen(!isFilterOpen)}
      >
        <span className="filter-icon">🎛️</span>
        Filters
        {getSelectedCount() > 0 && (
          <span className="filter-count">{getSelectedCount()}</span>
        )}
      </button>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="filter-panel">
          <div className="filter-header">
            <h3>Advanced Filters</h3>
            <button className="clear-btn" onClick={clearFilters}>
              Clear All
            </button>
          </div>

          <div className="filter-content">
            <div className="filter-column">
              <FilterSection
                title="📺 Media Type"
                options={filterOptions.types}
                category="types"
              />
              <FilterSection
                title="⭐ Rating"
                options={filterOptions.rating}
                category="rating"
              />
              <FilterSection
                title="📡 Broadcast"
                options={filterOptions.broadcast}
                category="broadcast"
              />
            </div>

            <div className="filter-column">
              <FilterSection
                title="🎭 Genres"
                options={availableOptions.genres.slice(0, 10)}
                category="genres"
              />
              <FilterSection
                title="📅 Years"
                options={availableOptions.years.slice(0, 8)}
                category="years"
              />
            </div>

            <div className="filter-column">
              <FilterSection
                title="📊 Status"
                options={filterOptions.status}
                category="status"
              />
              <FilterSection
                title="🏷️ Categories"
                options={filterOptions.categories}
                category="categories"
              />
              <FilterSection
                title="🔧 Sort By"
                options={filterOptions.sort}
                category="sort"
                type="radio"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button
              className="apply-btn"
              onClick={applyFilters}
              disabled={loading}
            >
              {loading
                ? "Applying..."
                : `Apply Filters (${getSelectedCount()})`}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="results-container">
          <h3>Results ({results.length})</h3>
          <button className="close-results-btn" onClick={() => setResults([])}>
            ✕
          </button>
          <div className="results-grid">
            {results.map((item) => (
              <div
                key={item.id}
                className="result-card"
                onClick={() => window.open(`/details/${item.id}`, "_blank")}
              >
                <img src={item.coverImage.large} alt={item.title.romaji} />
                <div className="result-info">
                  <h4>{item.title.romaji || item.title.english}</h4>
                  <p>
                    {item.type} • {item.format}
                  </p>
                  <div className="result-meta">
                    <span>⭐ {item.averageScore || "N/A"}%</span>
                    <span>
                      {item.episodes || item.chapters || "?"}{" "}
                      {item.type === "ANIME" ? "EP" : "CH"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="close-results-btn" onClick={() => setResults([])}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default GenereFilter;
