import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Trending.css";

const Trending = () => {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredAnime, setHoveredAnime] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [isHoverVisible, setIsHoverVisible] = useState(false);
  const scrollRef = useRef(null);
  const hoverRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const response = await axios.post("https://graphql.anilist.co", {
          query: `
            query {
              Page(perPage: 20) {
                media(type: ANIME, sort: TRENDING_DESC, status: RELEASING) {
                  id
                  title { 
                    romaji
                    english
                  }
                  coverImage { 
                    large
                    color
                  }
                  bannerImage
                  episodes
                  averageScore
                  genres
                  description(asHtml: false)
                  status
                  startDate { year month day }
                  endDate { year month day }
                  duration
                  format
                  season
                  seasonYear
                  studios {
                    nodes {
                      name
                    }
                  }
                }
              }
            }
          `,
        });
        setAnimes(response.data.data.Page.media);
      } catch (error) {
        console.error("Error fetching trending anime:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const scroll = (direction = "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj || !dateObj.year) return "TBD";
    return `${dateObj.year}-${String(dateObj.month || 1).padStart(
      2,
      "0"
    )}-${String(dateObj.day || 1).padStart(2, "0")}`;
  };

  const handleMouseEnter = (e, anime) => {
    setIsHoverVisible(true);
    updateHoverPosition(e, anime);
  };

  const handleMouseMove = (e, anime) => {
    updateHoverPosition(e, anime);
  };

  const handleMouseLeave = () => {
    setIsHoverVisible(false);
    setHoveredAnime(null);
  };

  const updateHoverPosition = (e, anime) => {
    if (!hoverRef.current) return;

    const hoverCard = hoverRef.current;
    const cardWidth = 320;
    const cardHeight = 480;
    const offset = 20;

    let posX = e.clientX + offset;
    let posY = e.clientY + offset;

    // Prevent overflow on right
    if (posX + cardWidth > window.innerWidth - 20) {
      posX = e.clientX - cardWidth - offset;
    }

    // Prevent overflow on bottom
    if (posY + cardHeight > window.innerHeight - 20) {
      posY = e.clientY - cardHeight - offset;
    }

    // Prevent overflow on left
    if (posX < 20) {
      posX = 20;
    }

    // Prevent overflow on top
    if (posY < 20) {
      posY = 20;
    }

    setHoveredAnime(anime);
    setHoverPos({ x: posX, y: posY });
  };

  const getScoreColor = (score) => {
    if (!score) return "#6c757d";
    if (score >= 80) return "#28a745";
    if (score >= 70) return "#ffc107";
    if (score >= 60) return "#fd7e14";
    return "#dc3545";
  };

  const truncateDescription = (description, maxLength = 200) => {
    if (!description) return "No description available.";
    const cleanDescription = description.replace(/<[^>]*>/g, "");
    if (cleanDescription.length <= maxLength) return cleanDescription;
    return cleanDescription.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="trending-section">
        <div className="section-header">
          <h2>🔥 Trending Anime</h2>
          <div className="section-controls">
            <button className="nav-btn" disabled>
              ‹
            </button>
            <button className="nav-btn" disabled>
              ›
            </button>
          </div>
        </div>
        <div className="loading-cards">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="loading-card">
              <div className="loading-image"></div>
              <div className="loading-content">
                <div className="loading-title"></div>
                <div className="loading-meta"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="trending-section">
      <div className="section-header">
        <h2>🔥 Trending Anime</h2>
        <div className="section-controls">
          <button className="nav-btn btn1" onClick={() => scroll("left")}>
            ‹
          </button>
          <button className="nav-btn btn2" onClick={() => scroll("right")}>
            ›
          </button>
        </div>
      </div>

      <div className="scroll-container">
        <div className="trending-cards" ref={scrollRef}>
          {animes.map((anime, index) => (
            <div
              key={anime.id}
              className="trending-card"
              onMouseEnter={(e) => handleMouseEnter(e, anime)}
              onMouseMove={(e) => handleMouseMove(e, anime)}
              onMouseLeave={handleMouseLeave}
              onClick={() => navigate(`/anime/${anime.id}`)}
            >
              <div className="card-rank">#{index + 1}</div>
              {anime.averageScore && (
                <div
                  className="score-badge"
                  style={{ backgroundColor: getScoreColor(anime.averageScore) }}
                >
                  ⭐ {anime.averageScore}%
                </div>
              )}
              <div className="image-container">
                <img
                  src={anime.coverImage.large}
                  alt={anime.title.romaji || anime.title.english}
                  loading="lazy"
                />
                <div className="card-overlay"></div>
              </div>
              <div className="card-info">
                <h3>{anime.title.romaji || anime.title.english}</h3>
                <div className="card-meta">
                  <span className="episodes">
                    {anime.episodes ? `${anime.episodes} EP` : "Ongoing"}
                  </span>
                  <span className="format">{anime.format}</span>
                </div>
                <div className="genres">
                  {anime.genres.slice(0, 2).map((genre) => (
                    <span key={genre} className="genre-tag">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Hover Card */}
      {hoveredAnime && isHoverVisible && (
        <div
          ref={hoverRef}
          className="hover-card"
          style={{
            left: `${hoverPos.x}px`,
            top: `${hoverPos.y}px`,
            opacity: isHoverVisible ? 1 : 0,
          }}
        >
          <div
            className="hover-card-background"
            style={{
              backgroundImage: `url(${
                hoveredAnime.bannerImage || hoveredAnime.coverImage.large
              })`,
            }}
          ></div>
          <div className="hover-card-content">
            <div className="hover-header">
              <h3>{hoveredAnime.title.romaji || hoveredAnime.title.english}</h3>
              {hoveredAnime.averageScore && (
                <div
                  className="hover-score"
                  style={{ color: getScoreColor(hoveredAnime.averageScore) }}
                >
                  ⭐ {hoveredAnime.averageScore}%
                </div>
              )}
            </div>

            <div className="hover-meta">
              <div className="meta-item">
                <strong>Status:</strong> {hoveredAnime.status}
              </div>
              <div className="meta-item">
                <strong>Episodes:</strong> {hoveredAnime.episodes || "N/A"}
              </div>
              <div className="meta-item">
                <strong>Format:</strong> {hoveredAnime.format}
              </div>
              {hoveredAnime.duration && (
                <div className="meta-item">
                  <strong>Duration:</strong> {hoveredAnime.duration} min/ep
                </div>
              )}
            </div>

            <div className="hover-genres">
              {hoveredAnime.genres.slice(0, 4).map((genre) => (
                <span key={genre} className="genre-badge">
                  {genre}
                </span>
              ))}
            </div>

            <div className="hover-description">
              {truncateDescription(hoveredAnime.description)}
            </div>

            <div className="hover-dates">
              <div className="date-item">
                <strong>Aired:</strong> {formatDate(hoveredAnime.startDate)}
                {hoveredAnime.endDate &&
                  hoveredAnime.endDate.year &&
                  ` to ${formatDate(hoveredAnime.endDate)}`}
              </div>
              {hoveredAnime.season && hoveredAnime.seasonYear && (
                <div className="date-item">
                  <strong>Season:</strong> {hoveredAnime.season}{" "}
                  {hoveredAnime.seasonYear}
                </div>
              )}
            </div>

            <button
              className="view-details-btn"
              onClick={() => navigate(`/details/${hoveredAnime.id}`)}
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trending;
