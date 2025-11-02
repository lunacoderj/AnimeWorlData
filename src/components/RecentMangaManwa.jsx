import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RecentAnime.css";

const RecentMangaManwa = () => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredComic, setHoveredComic] = useState(null);
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
    const fetchRecentComics = async () => {
      try {
        setError(null);
        const response = await axios.post("https://graphql.anilist.co", {
          query: `
            query {
              Page(perPage: 100) {
                media(type: MANGA, sort: START_DATE_DESC, isAdult: false) {
                  id
                  title { 
                    romaji
                    english
                  }
                  coverImage { 
                    large
                    extraLarge
                  }
                  chapters
                  volumes
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
        const filtered = data.filter((comic) => !comic.isAdult);
        setComics(filtered);
      } catch (err) {
        console.error("Error fetching recent manga/manhwa:", err);
        setError("Failed to load recent comics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecentComics();
  }, []);

  const handleMouseMove = useCallback((e, comicId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredComic(comicId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredComic(null);
  }, []);

  const loadMore = () => {
    setVisibleRows((prev) => prev + 3);
  };

  const loadLess = () => {
    setVisibleRows((prev) => Math.max(3, prev - 3));
  };

  const handleCardClick = (comicId) => {
    navigate(`/anime/${comicId}`);
  };

  const handleReadClick = (e, comicId) => {
    e.stopPropagation();
    navigate(`/anime/${comicId}/1`);
  };

  const handleDetailsClick = (e, comicId) => {
    e.stopPropagation();
    navigate(`/anime/${comicId}`);
  };

  // Safe data access
  const getSafeComicData = (comic) => ({
    id: comic?.id || "",
    title: {
      romaji: comic?.title?.romaji || "Unknown Title",
      english: comic?.title?.english || "",
    },
    coverImage: {
      large: comic?.coverImage?.large || "/fallback-image.jpg",
      extraLarge: comic?.coverImage?.extraLarge || "/fallback-image.jpg",
    },
    chapters: comic?.chapters || "?",
    volumes: comic?.volumes || "?",
    averageScore: comic?.averageScore || "N/A",
    format: comic?.format || "Unknown",
    status: comic?.status || "Unknown",
    genres: comic?.genres || [],
    isAdult: comic?.isAdult || false,
  });

  const getComicType = useCallback((comic) => {
    const safeComic = getSafeComicData(comic);
    const title = safeComic.title.romaji.toLowerCase();

    if (title.includes("manhwa") || safeComic.format === "MANHWA")
      return "Manhwa";
    if (title.includes("manhua") || safeComic.format === "MANHUA")
      return "Manhua";
    if (safeComic.format === "NOVEL") return "Light Novel";
    if (safeComic.format === "ONE_SHOT") return "One Shot";
    return "Manga";
  }, []);

  // Calculate total cards to show
  const totalCards = comics.length;
  const cardsToShow = Math.min(visibleRows * cardsPerRow, totalCards);
  const hasMoreCards = cardsToShow < totalCards;
  const canLoadLess = visibleRows > 3;

  if (error && comics.length === 0) {
    return (
      <div className="recent-section">
        <div className="error-state">
          <h3>😞 Unable to Load Comics</h3>
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
        <h2>📖 Recent Manga & Manhwa</h2>
        <p className="section-subtitle">
          Latest manga, manhwa, and manhua releases
        </p>
        <div className="results-count">
          Showing {cardsToShow} of {totalCards} comics
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
            {comics.slice(0, cardsToShow).map((comic, index) => {
              const safeComic = getSafeComicData(comic);
              const comicType = getComicType(comic);

              return (
                <div
                  key={safeComic.id}
                  className="recent-card"
                  onClick={() => handleCardClick(safeComic.id)}
                  onMouseMove={(e) => handleMouseMove(e, safeComic.id)}
                  onMouseLeave={handleMouseLeave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(safeComic.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${safeComic.title.romaji}`}
                  style={{
                    animationDelay: `${(index % cardsPerRow) * 0.1}s`,
                  }}
                >
                  <div className="card-image-container">
                    <img
                      src={safeComic.coverImage.large}
                      alt={`Cover image for ${safeComic.title.romaji}`}
                      className="card-image"
                      loading="lazy"
                    />
                    <div className="card-overlay">
                      <div className="score-badge">
                        ⭐ {safeComic.averageScore}%
                      </div>
                      <div className="format-badge">{comicType}</div>
                    </div>
                  </div>

                  <div className="card-info">
                    <h3 className="card-title">{safeComic.title.romaji}</h3>
                    <div className="card-meta">
                      <span className="episodes">
                        📖 {safeComic.chapters} CH
                      </span>
                      <span className="status">
                        {safeComic.volumes !== "?"
                          ? `📚 ${safeComic.volumes} Vol`
                          : "Ongoing"}
                      </span>
                    </div>
                    {safeComic.genres.length > 0 && (
                      <div className="genres">
                        {safeComic.genres.slice(0, 2).map((genre) => (
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
                  )} more comics`}
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
                  aria-label="Show fewer comics"
                >
                  <span className="btn-icon">⬆️</span>
                  Show Less
                </button>
              )}
            </div>
          )}

          {/* Global Hover Tooltip */}
          {hoveredComic && (
            <div
              className="global-hover-tooltip"
              style={{
                left: hoverPos.x,
                top: hoverPos.y,
              }}
            >
              {(() => {
                const comic = comics.find((c) => c.id === hoveredComic);
                if (!comic) return null;

                const safeComic = getSafeComicData(comic);
                const comicType = getComicType(comic);

                return (
                  <>
                    <h4>{safeComic.title.romaji}</h4>
                    {safeComic.title.english &&
                      safeComic.title.english !== safeComic.title.romaji && (
                        <p className="english-title">
                          {safeComic.title.english}
                        </p>
                      )}
                    <div className="tooltip-details">
                      <p>
                        <strong>Type:</strong> {comicType}
                      </p>
                      <p>
                        <strong>Chapters:</strong> {safeComic.chapters}
                      </p>
                      <p>
                        <strong>Volumes:</strong> {safeComic.volumes}
                      </p>
                      <p>
                        <strong>Rating:</strong> {safeComic.averageScore}%
                      </p>
                      <p>
                        <strong>Format:</strong> {safeComic.format}
                      </p>
                      <p>
                        <strong>Status:</strong> {safeComic.status}
                      </p>
                      {safeComic.genres.length > 0 && (
                        <p>
                          <strong>Genres:</strong>{" "}
                          {safeComic.genres.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="tooltip-actions">
                      <button
                        className="tooltip-btn watch-btn"
                        onClick={(e) => handleReadClick(e, safeComic.id)}
                      >
                        📖 Read Now
                      </button>
                      <button
                        className="tooltip-btn details-btn"
                        onClick={(e) => handleDetailsClick(e, safeComic.id)}
                      >
                        📋 Details
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

export default RecentMangaManwa;
