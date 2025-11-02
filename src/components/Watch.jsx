import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Watch.css";

const Watch = () => {
  const { id, episode } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState(parseInt(episode) || 1);
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    fetchAnimeDetails();
    fetchEpisodes();
  }, [id]);

  useEffect(() => {
    if (episode) {
      setCurrentEpisode(parseInt(episode));
    }
  }, [episode]);

  const fetchAnimeDetails = async () => {
    try {
      const query = `
        query ($id: Int) {
          Media(id: $id) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              color
            }
            bannerImage
            description
            episodes
            duration
            averageScore
            meanScore
            status
            genres
            studios {
              edges {
                isMain
                node {
                  name
                }
              }
            }
            relations {
              edges {
                relationType
                node {
                  id
                  title {
                    romaji
                    english
                  }
                  type
                  format
                }
              }
            }
            nextAiringEpisode {
              episode
              airingAt
            }
          }
        }
      `;

      const response = await axios.post("https://graphql.anilist.co", {
        query,
        variables: { id: parseInt(id) },
      });

      if (response.data.data.Media) {
        setAnime(response.data.data.Media);
        extractSeasons(response.data.data.Media);
      }
    } catch (error) {
      console.error("Error fetching anime details:", error);
    }
  };

  const extractSeasons = (animeData) => {
    const seasonsList = [];

    // Main series
    seasonsList.push({
      id: animeData.id,
      title: "Main Series",
      type: "SEASON",
      episodes: animeData.episodes || 0,
      isCurrent: true,
    });

    // Related seasons/sequels
    if (animeData.relations) {
      animeData.relations.edges.forEach((relation) => {
        if (
          relation.relationType === "SEQUEL" ||
          relation.relationType === "PREQUEL"
        ) {
          seasonsList.push({
            id: relation.node.id,
            title: `${relation.relationType}: ${relation.node.title.romaji}`,
            type: relation.relationType,
            episodes: 0,
            isCurrent: false,
          });
        }
      });
    }

    setSeasons(seasonsList);
  };

  const fetchEpisodes = async () => {
    try {
      // Since AniList doesn't provide episode details, we'll simulate them
      // In a real app, you'd fetch from an episodes API
      const simulatedEpisodes = simulateEpisodesData();
      setEpisodes(simulatedEpisodes);
    } catch (error) {
      console.error("Error fetching episodes:", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateEpisodesData = () => {
    if (!anime) return [];

    const totalEpisodes = anime.episodes || 24;
    const episodesList = [];

    for (let i = 1; i <= totalEpisodes; i++) {
      const isFiller = Math.random() > 0.7; // 30% chance of being filler
      const rating = (Math.random() * 2 + 8).toFixed(1); // Random rating 8.0-10.0

      episodesList.push({
        number: i,
        title: {
          romaji: `Episode ${i}`,
          english: `Episode ${i}: The Journey Continues`,
        },
        description: `Episode ${i} of ${anime.title.romaji}`,
        isFiller,
        rating: parseFloat(rating),
        duration: anime.duration || 24,
        thumbnail: anime.coverImage.large,
        hianimeUrl: `https://hianime.to/watch/${anime.title.romaji
          .toLowerCase()
          .replace(/ /g, "-")}-ep-${i}`,
      });
    }

    return episodesList;
  };

  const handleEpisodeSelect = (episodeNumber) => {
    setCurrentEpisode(episodeNumber);
    setVideoLoading(true);

    // Update URL without page reload
    navigate(`/watch/${id}/${episodeNumber}`, { replace: true });

    // Simulate video loading
    setTimeout(() => setVideoLoading(false), 1000);
  };

  const getNextEpisode = () => {
    if (currentEpisode < episodes.length) {
      return currentEpisode + 1;
    }
    return null;
  };

  const getPrevEpisode = () => {
    if (currentEpisode > 1) {
      return currentEpisode - 1;
    }
    return null;
  };

  const navigateToEpisode = (episodeNumber) => {
    if (episodeNumber) {
      handleEpisodeSelect(episodeNumber);
    }
  };

  if (loading) {
    return (
      <div className="watch-loading">
        <div className="loading-spinner"></div>
        <p>Loading anime details...</p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="watch-error">
        <h2>Anime not found</h2>
        <button onClick={() => navigate("/")}>Return to Home</button>
      </div>
    );
  }

  const currentEpisodeData =
    episodes.find((ep) => ep.number === currentEpisode) || episodes[0];

  return (
    <div className="watch-container">
      {/* Hero Section */}
      <div
        className="watch-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${
            anime.bannerImage || anime.coverImage.extraLarge
          })`,
        }}
      >
        <div className="hero-content">
          <div className="anime-poster">
            <img src={anime.coverImage.extraLarge} alt={anime.title.romaji} />
          </div>
          <div className="hero-info">
            <h1>{anime.title.romaji || anime.title.english}</h1>
            <h2>{anime.title.native}</h2>
            <div className="anime-meta">
              <span>⭐ {anime.averageScore || "N/A"}%</span>
              <span>📺 {anime.episodes || "?"} Episodes</span>
              <span>⏱️ {anime.duration || 24} min</span>
              <span className={`status ${anime.status.toLowerCase()}`}>
                {anime.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="genres">
              {anime.genres.map((genre) => (
                <span key={genre} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Section */}
      <div className="video-section">
        <div className="video-container">
          {videoLoading ? (
            <div className="video-loading">
              <div className="loading-spinner"></div>
              <p>Loading episode {currentEpisode}...</p>
            </div>
          ) : (
            <div className="video-placeholder">
              <div className="video-info">
                <h3>Now Playing: Episode {currentEpisode}</h3>
                <p>{currentEpisodeData?.title.english}</p>
                <div className="episode-meta">
                  <span
                    className={`type ${
                      currentEpisodeData?.isFiller ? "filler" : "canon"
                    }`}
                  >
                    {currentEpisodeData?.isFiller ? "FILLER" : "CANON"}
                  </span>
                  <span>⭐ {currentEpisodeData?.rating}/10</span>
                  <span>⏱️ {currentEpisodeData?.duration} min</span>
                </div>
                <a
                  href={currentEpisodeData?.hianimeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="watch-external-btn"
                >
                  ▶ Watch on HiAnime
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Episode Navigation */}
        <div className="episode-nav">
          <button
            className="nav-btn prev-btn"
            onClick={() => navigateToEpisode(getPrevEpisode())}
            disabled={!getPrevEpisode()}
          >
            ‹ Previous
          </button>
          <span className="episode-counter">
            Episode {currentEpisode} of {episodes.length}
          </span>
          <button
            className="nav-btn next-btn"
            onClick={() => navigateToEpisode(getNextEpisode())}
            disabled={!getNextEpisode()}
          >
            Next ›
          </button>
        </div>
      </div>

      {/* Seasons/Series List */}
      {seasons.length > 0 && (
        <div className="seasons-section">
          <h3>Seasons & Series</h3>
          <div className="seasons-grid">
            {seasons.map((season) => (
              <div
                key={season.id}
                className={`season-card ${season.isCurrent ? "current" : ""}`}
                onClick={() =>
                  season.isCurrent ? null : navigate(`/watch/${season.id}/1`)
                }
              >
                <h4>{season.title}</h4>
                <p>{season.episodes} Episodes</p>
                <span className="season-type">{season.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Episodes List */}
      <div className="episodes-section">
        <div className="section-header">
          <h3>All Episodes ({episodes.length})</h3>
          <div className="filters">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Canon</button>
            <button className="filter-btn">Filler</button>
          </div>
        </div>

        <div className="episodes-grid">
          {episodes.map((episode) => (
            <div
              key={episode.number}
              className={`episode-card ${
                episode.number === currentEpisode ? "active" : ""
              } ${episode.isFiller ? "filler" : "canon"}`}
              onClick={() => handleEpisodeSelect(episode.number)}
            >
              <div className="episode-thumbnail">
                <img
                  src={episode.thumbnail}
                  alt={`Episode ${episode.number}`}
                />
                <div className="episode-overlay">
                  <span className="episode-number">EP {episode.number}</span>
                  {episode.isFiller && (
                    <span className="filler-badge">FILLER</span>
                  )}
                </div>
              </div>
              <div className="episode-info">
                <h4>{episode.title.english}</h4>
                <p className="episode-title-jp">{episode.title.romaji}</p>
                <div className="episode-meta">
                  <span>⭐ {episode.rating}</span>
                  <span>⏱️ {episode.duration}m</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section Placeholder */}
      <div className="comments-section">
        <h3>Comments</h3>
        <div className="comments-placeholder">
          <p>Comments section will be implemented in the next update</p>
          <button className="login-to-comment-btn">Login to Comment</button>
        </div>
      </div>
    </div>
  );
};

export default Watch;
