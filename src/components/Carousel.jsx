import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getTrendingAnimes, getFallbackAnimes } from "../utils/anilistapi";
import "./Carousel.css";

const Carousel = ({ onDetailsClick }) => {
  const [animes, setAnimes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const navigate = useNavigate();

  // Safe anime data access
  const getSafeAnimeData = (anime, index = currentIndex) => {
    const targetAnime = animes[index] || anime || {};
    return {
      id: targetAnime.id || index,
      name: targetAnime.name || "Unknown Title",
      nativeName: targetAnime.nativeName || "",
      rank: targetAnime.rank || "N/A",
      rating: targetAnime.rating || 0,
      episodes: targetAnime.episodes || "?",
      status: targetAnime.status || "Unknown",
      genres: targetAnime.genres || [],
      description: targetAnime.description || "No description available.",
      imageUrl: targetAnime.imageUrl || "/fallback-image.jpg",
      trailer: targetAnime.trailer || null,
      firstEpisodeId: targetAnime.firstEpisodeId || 1,
    };
  };

  // Fetch trending animes
  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTrendingAnimes();
        if (data && data.length > 0) {
          setAnimes(data);
        } else {
          throw new Error("No data received");
        }
      } catch (err) {
        console.error("Failed to fetch animes:", err);
        setError("Failed to load trending animes");
        const fallbackData = getFallbackAnimes();
        setAnimes(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimes();
  }, []);

  // Auto-play with safety checks
  useEffect(() => {
    if (!isAutoPlaying || animes.length === 0) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animes.length);
    }, 10000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, animes.length]);

  const goToSlide = useCallback(
    (index) => {
      if (animes.length === 0) return;

      const safeIndex = Math.max(0, Math.min(index, animes.length - 1));
      setCurrentIndex(safeIndex);

      // Reset autoplay
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      if (isAutoPlaying && animes.length > 0) {
        autoPlayRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % animes.length);
        }, 10000);
      }
    },
    [isAutoPlaying, animes.length]
  );

  const goToNext = useCallback(() => {
    if (animes.length === 0) return;
    goToSlide((currentIndex + 1) % animes.length);
  }, [currentIndex, animes.length, goToSlide]);

  const goToPrev = useCallback(() => {
    if (animes.length === 0) return;
    goToSlide(currentIndex === 0 ? animes.length - 1 : currentIndex - 1);
  }, [currentIndex, animes.length, goToSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || animes.length === 0)
      return;

    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      diff > 0 ? goToNext() : goToPrev();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleWatchNow = (anime) => {
    const safeAnime = getSafeAnimeData(anime);
    navigate(`/view/${safeAnime.id}/${safeAnime.firstEpisodeId}`);
  };
  const detailspage = (anime) => {
    const safeAnime = getSafeAnimeData(anime);
    navigate(`/anime/${safeAnime.id}`);
  };

  const SkeletonLoader = () => (
    <div className="carousel-skeleton">
      <div className="skeleton-video"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-details"></div>
        <div className="skeleton-buttons">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );

  if (error && animes.length === 0) {
    return (
      <div className="carousel-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const currentAnime = getSafeAnimeData(null, currentIndex);

  return (
    <div
      className="carousel-container"
      onMouseEnter={() => {
        setIsAutoPlaying(false);
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      }}
      onMouseLeave={() => setIsAutoPlaying(true)}
      role="region"
      aria-label="Anime carousel"
    >
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          <div
            className="carousel-track"
            ref={carouselRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {animes.map((anime, index) => {
              const safeAnime = getSafeAnimeData(anime, index);
              return (
                <div
                  key={safeAnime.id}
                  className={`carousel-slide ${
                    index === currentIndex ? "active" : ""
                  }`}
                  aria-hidden={index !== currentIndex}
                >
                  <div className="slide-background">
                    {safeAnime.trailer &&
                    safeAnime.trailer.site === "youtube" ? (
                      <iframe
                        className="background-video"
                        src={`https://www.youtube.com/embed/${safeAnime.trailer.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${safeAnime.trailer.id}&playsinline=1`}
                        title={`${safeAnime.name} trailer`}
                        frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      ></iframe>
                    ) : (
                      <img
                        src={safeAnime.imageUrl}
                        alt={safeAnime.name}
                        className="background-image"
                        loading="lazy"
                      />
                    )}
                    <div className="background-overlay"></div>
                  </div>

                  <div className="slide-content">
                    <div
                      className="anime-rank"
                      aria-label={`Rank ${safeAnime.rank}`}
                    >
                      #{safeAnime.rank}
                    </div>
                    <div className="content-main">
                      <h2 className="anime-title">{safeAnime.name}</h2>
                      {safeAnime.nativeName && (
                        <p className="anime-native">{safeAnime.nativeName}</p>
                      )}
                      <div className="anime-details">
                        <div className="rating">
                          ⭐ {Number(safeAnime.rating).toFixed(1)}
                        </div>
                        <div className="episodes">
                          📺 {safeAnime.episodes} Episodes
                        </div>
                        <div className="status">{safeAnime.status}</div>
                      </div>
                      {safeAnime.genres.length > 0 && (
                        <div className="anime-genres">
                          {safeAnime.genres.slice(0, 4).map((genre) => (
                            <span key={genre} className="genre-tag">
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="anime-description">
                        {safeAnime.description.length > 150
                          ? `${safeAnime.description.substring(0, 150)}...`
                          : safeAnime.description}
                      </p>
                      <div className="action-buttons">
                        <button
                          className="watch-now-btn"
                          onClick={() => handleWatchNow(safeAnime)}
                          aria-label={`Watch ${safeAnime.name} now`}
                        >
                          ▶ Watch Now
                        </button>
                        <button
                          className="details-btn"
                          onClick={()=> detailspage(safeAnime)}
                          aria-label={`See details for ${safeAnime.name}`}
                        >
                          ℹ️ Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {animes.length > 1 && (
            <>
              <button
                className="carousel-btn prev-btn"
                onClick={goToPrev}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                className="carousel-btn next-btn"
                onClick={goToNext}
                aria-label="Next slide"
              >
                ›
              </button>

              <div className="carousel-indicators">
                {animes.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator ${
                      index === currentIndex ? "active" : ""
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <div className="autoplay-control">
                <button
                  className="autoplay-btn"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  aria-label={
                    isAutoPlaying ? "Pause auto-play" : "Start auto-play"
                  }
                >
                  {isAutoPlaying ? "⏸️" : "▶️"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Carousel;
