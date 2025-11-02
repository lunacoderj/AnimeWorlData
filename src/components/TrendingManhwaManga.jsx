import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Trending.css";

const TrendingManhwaManga = () => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredComic, setHoveredComic] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [isHoverVisible, setIsHoverVisible] = useState(false);
  const scrollRef = useRef(null);
  const hoverRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setLoading(true);
        const response = await axios.post("https://graphql.anilist.co", {
          query: `
            query {
              Page(perPage: 20) {
                media(type: MANGA, sort: TRENDING_DESC) {
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
                  chapters
                  volumes
                  averageScore
                  genres
                  description(asHtml: false)
                  status
                  startDate { year month day }
                  endDate { year month day }
                  format
                  countryOfOrigin
                }
              }
            }
          `,
        });
        setComics(response.data.data.Page.media);
      } catch (err) {
        console.error("Error fetching manga:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComics();
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

  const handleMouseEnter = (e, comic) => {
    setIsHoverVisible(true);
    updateHoverPosition(e, comic);
  };

  const handleMouseMove = (e, comic) => {
    updateHoverPosition(e, comic);
  };

  const handleMouseLeave = () => {
    setIsHoverVisible(false);
    setHoveredComic(null);
  };

  const updateHoverPosition = (e, comic) => {
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

    setHoveredComic(comic);
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

  const formatDate = (dateObj) => {
    if (!dateObj || !dateObj.year) return "TBD";
    return `${dateObj.year}-${String(dateObj.month || 1).padStart(
      2,
      "0"
    )}-${String(dateObj.day || 1).padStart(2, "0")}`;
  };

  const getComicType = (comic) => {
    if (comic.countryOfOrigin === "KR") return "Manhwa";
    if (comic.countryOfOrigin === "CN") return "Manhua";
    if (comic.countryOfOrigin === "JP") return "Manga";
    return comic.format || "Comic";
  };

  const formatChaptersVolumes = (comic) => {
    const chapters = comic.chapters ? `${comic.chapters} Ch` : "Ongoing";
    const volumes = comic.volumes ? `${comic.volumes} Vol` : null;
    return volumes ? `${chapters} • ${volumes}` : chapters;
  };

  if (loading) {
    return (
      <div className="trending-section">
        <div className="section-header">
          <h2>📚 Trending Manhwa & Manga</h2>
          <div className="section-controls">
            <button className="nav-btn btn1" disabled>
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
        <h2>📚 Trending Manhwa & Manga</h2>
        <div className="section-controls">
          <button className="nav-btn" onClick={() => scroll("left")}>
            ‹
          </button>
          <button className="nav-btn" onClick={() => scroll("right")}>
            ›
          </button>
        </div>
      </div>

      <div className="scroll-container">
        <div className="trending-cards" ref={scrollRef}>
          {comics.map((comic, index) => (
            <div
              key={comic.id}
              className="trending-card"
              onMouseEnter={(e) => handleMouseEnter(e, comic)}
              onMouseMove={(e) => handleMouseMove(e, comic)}
              onMouseLeave={handleMouseLeave}
              onClick={() => navigate(`/details/${comic.id}`)}
            >
              <div className="card-rank">#{index + 1}</div>
              {comic.averageScore && (
                <div
                  className="score-badge"
                  style={{ backgroundColor: getScoreColor(comic.averageScore) }}
                >
                  ⭐ {comic.averageScore}%
                </div>
              )}
              <div className="image-container">
                <img
                  src={comic.coverImage.large}
                  alt={comic.title.romaji || comic.title.english}
                  loading="lazy"
                />
                <div className="card-overlay"></div>
              </div>
              <div className="card-info">
                <h3>{comic.title.romaji || comic.title.english}</h3>
                <div className="card-meta">
                  <span className="episodes">
                    {formatChaptersVolumes(comic)}
                  </span>
                  <span className="format">{getComicType(comic)}</span>
                </div>
                <div className="genres">
                  {comic.genres.slice(0, 2).map((genre) => (
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
      {hoveredComic && isHoverVisible && (
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
                hoveredComic.bannerImage || hoveredComic.coverImage.large
              })`,
            }}
          ></div>
          <div className="hover-card-content">
            <div className="hover-header">
              <h3>{hoveredComic.title.romaji || hoveredComic.title.english}</h3>
              {hoveredComic.averageScore && (
                <div
                  className="hover-score"
                  style={{ color: getScoreColor(hoveredComic.averageScore) }}
                >
                  ⭐ {hoveredComic.averageScore}%
                </div>
              )}
            </div>

            <div className="hover-meta">
              <div className="meta-item">
                <strong>Type:</strong> {getComicType(hoveredComic)}
              </div>
              <div className="meta-item">
                <strong>Status:</strong> {hoveredComic.status}
              </div>
              <div className="meta-item">
                <strong>Chapters:</strong> {hoveredComic.chapters || "Ongoing"}
              </div>
              {hoveredComic.volumes && (
                <div className="meta-item">
                  <strong>Volumes:</strong> {hoveredComic.volumes}
                </div>
              )}
            </div>

            <div className="hover-genres">
              {hoveredComic.genres.slice(0, 4).map((genre) => (
                <span key={genre} className="genre-badge">
                  {genre}
                </span>
              ))}
            </div>

            <div className="hover-description">
              {truncateDescription(hoveredComic.description)}
            </div>

            <div className="hover-dates">
              <div className="date-item">
                <strong>Published:</strong> {formatDate(hoveredComic.startDate)}
                {hoveredComic.endDate &&
                  hoveredComic.endDate.year &&
                  ` to ${formatDate(hoveredComic.endDate)}`}
              </div>
              {hoveredComic.countryOfOrigin && (
                <div className="date-item">
                  <strong>Origin:</strong> {hoveredComic.countryOfOrigin}
                </div>
              )}
            </div>

            <button
              className="view-details-btn"
              onClick={() => navigate(`/details/${hoveredComic.id}`)}
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingManhwaManga;
