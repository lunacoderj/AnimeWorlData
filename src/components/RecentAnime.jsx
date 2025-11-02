import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RecentAnime.css";

const RecentAnime = () => {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredAnime, setHoveredAnime] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [visibleRows, setVisibleRows] = useState(2);
  const navigate = useNavigate();

  // Calculate cards per row based on screen size
  const getCardsPerRow = useCallback(() => {
    if (typeof window === "undefined") return 7;

    const width = window.innerWidth;
    if (width >= 1600) return 7;
    if (width >= 1280) return 6;
    if (width >= 1024) return 5;
    if (width >= 768) return 4;
    if (width >= 480) return 3;
    return 2;
  }, []);

  const [cardsPerRow, setCardsPerRow] = useState(getCardsPerRow());

  useEffect(() => {
    const handleResize = () => {
      setCardsPerRow(getCardsPerRow());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getCardsPerRow]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setError(null);
        const response = await axios.post("https://graphql.anilist.co", {
          query: `
            query {
              Page(perPage: 100) {
                media(type: ANIME, sort: START_DATE_DESC, season: FALL, seasonYear: 2024, isAdult: false) {
                  id
                  title { 
                    romaji
                    english
                  }
                  coverImage { 
                    large
                    extraLarge
                  }
                  episodes
                  averageScore
                  format
                  status
                  genres
                  isAdult
                }
              }
            }
          `,
        });

        if (response.data.errors) {
          throw new Error(response.data.errors[0].message);
        }

        const data = response.data.data.Page.media;
        const filtered = data.filter((anime) => !anime.isAdult);
        setAnimes(filtered);
      } catch (err) {
        console.error("Error fetching recent anime:", err);
        setError("Failed to load recent anime. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  const handleMouseMove = useCallback((e, animeId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos({
      x: rect.left + rect.width / 3,
      y: rect.top - 0,
    });
    setHoveredAnime(animeId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredAnime(null);
  }, []);

  const loadMore = () => {
    setVisibleRows((prev) => prev + 3);
  };

  const loadLess = () => {
    setVisibleRows((prev) => Math.max(3, prev - 3));
  };

  const handleCardClick = (animeId) => {
    navigate(`/anime/${animeId}`);
  };

  const handleWatchClick = (e, animeId) => {
    e.stopPropagation();
    navigate(`/anime/${animeId}/1`); // Consistent with your carousel path
  };

  const handleDetailsClick = (e, animeId) => {
    e.stopPropagation();
    navigate(`/anime/${animeId}`);
  };

  // Safe data access
  const getSafeAnimeData = (anime) => ({
    id: anime?.id || "",
    title: {
      romaji: anime?.title?.romaji || "Unknown Title",
      english: anime?.title?.english || "",
    },
    coverImage: {
      large: anime?.coverImage?.large || "/fallback-image.jpg",
      extraLarge: anime?.coverImage?.extraLarge || "/fallback-image.jpg",
    },
    episodes: anime?.episodes || "?",
    averageScore: anime?.averageScore || "N/A",
    format: anime?.format || "Unknown",
    status: anime?.status || "Unknown",
    genres: anime?.genres || [],
    isAdult: anime?.isAdult || false,
  });

  // Calculate total cards to show
  const totalCards = animes.length;
  const cardsToShow = Math.min(visibleRows * cardsPerRow, totalCards);
  const hasMoreCards = cardsToShow < totalCards;
  const canLoadLess = visibleRows > 3;

  if (error && animes.length === 0) {
    return (
      <div className="recent-section">
        <div className="error-state">
          <h3>😞 Unable to Load Anime</h3>
          <p>{error}</p>
          <button
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-section">
      <div className="section-header">
        <h2>🎥 Recent Anime & Movies</h2>
        <p className="section-subtitle">
          Latest releases and trending episodes
        </p>
        <div className="results-count">
          Showing {cardsToShow} of {totalCards} anime
        </div>
      </div>

      {loading ? (
        <div className="grid-cards">
          {Array.from({ length: 3 * cardsPerRow }).map((_, idx) => (
            <div key={idx} className="recent-card skeleton">
              <div className="skeleton-img"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-text shorter"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid-cards">
            {animes.slice(0, cardsToShow).map((anime, index) => {
              const safeAnime = getSafeAnimeData(anime);
              return (
                <div
                  key={safeAnime.id}
                  className="recent-card"
                  onClick={() => handleCardClick(safeAnime.id)}
                  onMouseMove={(e) => handleMouseMove(e, safeAnime.id)}
                  onMouseLeave={handleMouseLeave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(safeAnime.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${safeAnime.title.romaji}`}
                  style={{
                    animationDelay: `${(index % cardsPerRow) * 0.1}s`,
                  }}
                >
                  <div className="card-image-container">
                    <img
                      src={safeAnime.coverImage.large}
                      alt={`Cover image for ${safeAnime.title.romaji}`}
                      className="card-image"
                      loading="lazy"
                    />
                    <div className="card-overlay">
                      <div className="score-badge">
                        ⭐ {safeAnime.averageScore}%
                      </div>
                      {safeAnime.format && safeAnime.format !== "Unknown" && (
                        <div className="format-badge">{safeAnime.format}</div>
                      )}
                    </div>
                  </div>

                  <div className="card-info">
                    <h3 className="card-title">{safeAnime.title.romaji}</h3>
                    <div className="card-meta">
                      <span className="episodes">
                        📺 {safeAnime.episodes} EP
                      </span>
                      <span className="status">{safeAnime.status}</span>
                    </div>
                    {safeAnime.genres.length > 0 && (
                      <div className="genres">
                        {safeAnime.genres.slice(0, 2).map((genre) => (
                          <span key={genre} className="genre-tag">
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More/Load Less Buttons */}
          {(hasMoreCards || canLoadLess) && (
            <div className="load-buttons-container">
              {hasMoreCards && (
                <button
                  className="load-btn load-more-btn"
                  onClick={loadMore}
                  aria-label={`Load ${Math.min(
                    3 * cardsPerRow,
                    totalCards - cardsToShow
                  )} more anime`}
                >
                  <span className="btn-icon">⬇️</span>
                  Load More (
                  {Math.min(3 * cardsPerRow, totalCards - cardsToShow)} more)
                </button>
              )}

              {canLoadLess && (
                <button
                  className="load-btn load-less-btn"
                  onClick={loadLess}
                  aria-label="Show fewer anime"
                >
                  <span className="btn-icon">⬆️</span>
                  Show Less
                </button>
              )}
            </div>
          )}

          {/* Global Hover Tooltip */}
          {hoveredAnime && (
            <div
              className="global-hover-tooltip"
              style={{
                left: hoverPos.x,
                top: hoverPos.y,
              }}
            >
              {(() => {
                const anime = animes.find((a) => a.id === hoveredAnime);
                if (!anime) return null;

                const safeAnime = getSafeAnimeData(anime);
                return (
                  <>
                    <h4>{safeAnime.title.romaji}</h4>
                    {safeAnime.title.english &&
                      safeAnime.title.english !== safeAnime.title.romaji && (
                        <p className="english-title">
                          {safeAnime.title.english}
                        </p>
                      )}
                    <div className="tooltip-details">
                      <p>
                        <strong>Episodes:</strong> {safeAnime.episodes}
                      </p>
                      <p>
                        <strong>Rating:</strong> {safeAnime.averageScore}%
                      </p>
                      <p>
                        <strong>Format:</strong> {safeAnime.format}
                      </p>
                      <p>
                        <strong>Status:</strong> {safeAnime.status}
                      </p>
                      {safeAnime.genres.length > 0 && (
                        <p>
                          <strong>Genres:</strong>{" "}
                          {safeAnime.genres.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="tooltip-actions">
                      <button
                        className="tooltip-btn watch-btn"
                        onClick={(e) => handleWatchClick(e, safeAnime.id)}
                      >
                        ▶️ Watch
                      </button>
                      <button
                        className="tooltip-btn details-btn"
                        onClick={(e) => handleDetailsClick(e, safeAnime.id)}
                      >
                        📖 Details
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecentAnime;
