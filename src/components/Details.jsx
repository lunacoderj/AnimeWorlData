import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Recommendations from "./Recommendations";
import "./Details.css";

const Details = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [mediaType, setMediaType] = useState("anime"); // Default to anime

  useEffect(() => {
    fetchMediaDetails();
  }, [id]);

  const fetchMediaDetails = async () => {
    setLoading(true);
    try {
      const query = `
        query ($id: Int) {
          Media(id: $id) {
            id
            type
            title {
              romaji
              english
              native
              userPreferred
            }
            description
            bannerImage
            coverImage {
              extraLarge
              large
              color
            }
            format
            status
            episodes
            chapters
            volumes
            duration
            genres
            averageScore
            meanScore
            popularity
            favourites
            season
            seasonYear
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            studios {
              edges {
                isMain
                node {
                  name
                  siteUrl
                }
              }
            }
            staff {
              edges {
                role
                node {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    large
                  }
                }
              }
            }
            trailer {
              id
              site
              thumbnail
            }
            characters {
              edges {
                role
                node {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    large
                  }
                }
                voiceActors {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    large
                  }
                  language
                }
              }
            }
            recommendations {
              edges {
                node {
                  mediaRecommendation {
                    id
                    title {
                      userPreferred
                    }
                    coverImage {
                      large
                    }
                    format
                    averageScore
                    type
                  }
                }
              }
            }
            siteUrl
            isAdult
            source
            countryOfOrigin
            synonyms
            hashtag
            nextAiringEpisode {
              airingAt
              timeUntilAiring
              episode
            }
          }
        }
      `;

      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { id: parseInt(id) },
        }),
      });

      const data = await response.json();
      if (data.data.Media) {
        const mediaData = data.data.Media;
        setMedia(mediaData);
        setMediaType(mediaData.type.toLowerCase());
        setCharacters(mediaData.characters?.edges?.slice(0, 12) || []);
        setStaff(mediaData.staff?.edges?.slice(0, 10) || []);
      }
    } catch (error) {
      console.error("Error fetching media details:", error);
    } finally {
      setLoading(false);
    }
  };

  const cleanDescription = (html) => {
    if (!html) return "No description available.";
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

  const getMediaTypeLabel = () => {
    if (!media) return "Media";

    const format = media.format?.toLowerCase() || "";
    const title = media.title?.romaji?.toLowerCase() || "";

    if (format.includes("manhwa") || title.includes("manhwa")) return "Manhwa";
    if (format.includes("manhua") || title.includes("manhua")) return "Manhua";
    if (format.includes("novel")) return "Light Novel";
    if (format.includes("one_shot")) return "One Shot";
    if (media.type === "MANGA") return "Manga";
    return "Anime";
  };

  const getMediaSpecificInfo = () => {
    if (!media) return null;

    const isComic = media.type === "MANGA";
    const mediaTypeLabel = getMediaTypeLabel();

    if (isComic) {
      return {
        primaryCount: {
          label: "Chapters",
          value: media.chapters || "?",
        },
        secondaryCount: {
          label: "Volumes",
          value: media.volumes || "?",
        },
        actionButton: {
          text: "📖 Read Now",
          onClick: () => navigate(`/read/${id}/1`),
        },
        typeLabel: mediaTypeLabel,
      };
    } else {
      return {
        primaryCount: {
          label: "Episodes",
          value: media.episodes || "?",
        },
        secondaryCount: {
          label: "Duration",
          value: media.duration ? `${media.duration} min` : "?",
        },
        actionButton: {
          text: "▶ Watch Now",
          onClick: () => navigate(`/watch/${id}/1`),
        },
        typeLabel: "Anime",
      };
    }
  };

  const formatDate = (date) => {
    if (!date || !date.year) return "Unknown";
    return `${date.year}-${date.month || "??"}-${date.day || "??"}`;
  };

  const handleActionClick = () => {
    const mediaInfo = getMediaSpecificInfo();
    if (mediaInfo?.actionButton?.onClick) {
      mediaInfo.actionButton.onClick();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading {getMediaTypeLabel().toLowerCase()} details...</p>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="error-container">
        <h2>{getMediaTypeLabel()} not found</h2>
        <button onClick={() => navigate("/animehome")}>Return to Home</button>
      </div>
    );
  }

  const mediaInfo = getMediaSpecificInfo();
  const isComic = media.type === "MANGA";

  return (
    <div className="details-container">
      {/* Hero Banner */}
      <div
        className="hero-banner"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.74), rgba(93, 30, 201, 0.6)), url(${
            media.bannerImage || media.coverImage.extraLarge
          })`,
        }}
      >
        <div className="hero-content">
          <div className="media-poster">
            <img
              src={media.coverImage.extraLarge}
              alt={media.title.userPreferred}
            />
            <div className="media-type-badge">{mediaInfo.typeLabel}</div>
          </div>
          <div className="hero-info">
            <h1 className="media-title">
              {media.title.english || media.title.romaji}
            </h1>
            <h2 className="media-title-japanese">{media.title.native}</h2>

            <div className="media-meta">
              <div className="meta-item">
                <span className="label">Score:</span>
                <span className="value">
                  ★{" "}
                  {media.averageScore
                    ? (media.averageScore / 10).toFixed(1)
                    : "N/A"}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Format:</span>
                <span className="value">{media.format}</span>
              </div>
              <div className="meta-item">
                <span className="label">{mediaInfo.primaryCount.label}:</span>
                <span className="value">{mediaInfo.primaryCount.value}</span>
              </div>
              {mediaInfo.secondaryCount && (
                <div className="meta-item">
                  <span className="label">
                    {mediaInfo.secondaryCount.label}:
                  </span>
                  <span className="value">
                    {mediaInfo.secondaryCount.value}
                  </span>
                </div>
              )}
              <div className="meta-item">
                <span className="label">Status:</span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(media.status) }}
                >
                  {media.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="genres">
              {media.genres.map((genre, index) => (
                <span key={index} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>

            <button className="action-btn" onClick={handleActionClick}>
              {mediaInfo.actionButton.text}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        {!isComic && (
          <button
            className={`tab-btn ${activeTab === "characters" ? "active" : ""}`}
            onClick={() => setActiveTab("characters")}
          >
            Characters & Cast
          </button>
        )}
        {isComic && staff.length > 0 && (
          <button
            className={`tab-btn ${activeTab === "staff" ? "active" : ""}`}
            onClick={() => setActiveTab("staff")}
          >
            Staff
          </button>
        )}
        <button
          className={`tab-btn ${
            activeTab === "recommendations" ? "active" : ""
          }`}
          onClick={() => setActiveTab("recommendations")}
        >
          Recommendations
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="synopsis-section">
              <h3>Synopsis</h3>
              <p>{cleanDescription(media.description)}</p>
            </div>

            {media.trailer && !isComic && (
              <div className="trailer-section">
                <h3>Trailer</h3>
                <div className="trailer-container">
                  {media.trailer.site === "youtube" ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${media.trailer.id}`}
                      title={`${media.title.userPreferred} Trailer`}
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="trailer-placeholder">
                      <p>Trailer available on {media.trailer.site}</p>
                      <a
                        href={media.trailer.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Watch Trailer
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="info-grid">
              <div className="info-card">
                <h4>Details</h4>
                <div className="info-list">
                  {!isComic && media.studios?.edges?.length > 0 && (
                    <div className="info-item">
                      <span>Studios:</span>
                      <span>
                        {media.studios.edges
                          .filter((studio) => studio.isMain)
                          .map((studio) => studio.node.name)
                          .join(", ") || "Unknown"}
                      </span>
                    </div>
                  )}
                  {media.season && (
                    <div className="info-item">
                      <span>Season:</span>
                      <span>
                        {media.season} {media.seasonYear}
                      </span>
                    </div>
                  )}
                  <div className="info-item">
                    <span>Start Date:</span>
                    <span>{formatDate(media.startDate)}</span>
                  </div>
                  <div className="info-item">
                    <span>End Date:</span>
                    <span>{formatDate(media.endDate)}</span>
                  </div>
                  <div className="info-item">
                    <span>Source:</span>
                    <span>{media.source || "Original"}</span>
                  </div>
                  {media.countryOfOrigin && (
                    <div className="info-item">
                      <span>Country:</span>
                      <span>{media.countryOfOrigin}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span>Popularity:</span>
                    <span>#{media.popularity}</span>
                  </div>
                  <div className="info-item">
                    <span>Favorites:</span>
                    <span>{media.favourites}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "characters" && !isComic && (
          <div className="characters-tab">
            <h3>Characters & Voice Actors</h3>
            <div className="characters-grid">
              {characters.map((character) => (
                <div key={character.node.id} className="character-card">
                  <div className="character-main">
                    <img
                      src={character.node.image.large}
                      alt={character.node.name.full}
                      className="character-image"
                    />
                    <div className="character-info">
                      <h4>{character.node.name.full}</h4>
                      <p className="character-role">{character.role}</p>
                      <p className="character-name-native">
                        {character.node.name.native}
                      </p>
                    </div>
                  </div>

                  {character.voiceActors.length > 0 && (
                    <div className="voice-actors">
                      {character.voiceActors.map((actor) => (
                        <div key={actor.id} className="voice-actor">
                          <img
                            src={actor.image.large}
                            alt={actor.name.full}
                            className="actor-image"
                          />
                          <div className="actor-info">
                            <h5>{actor.name.full}</h5>
                            <p className="actor-language">{actor.language}</p>
                            <p className="actor-name-native">
                              {actor.name.native}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "staff" && isComic && (
          <div className="staff-tab">
            <h3>Staff & Creators</h3>
            <div className="staff-grid">
              {staff.map((member) => (
                <div key={member.node.id} className="staff-card">
                  <img
                    src={member.node.image.large}
                    alt={member.node.name.full}
                    className="staff-image"
                  />
                  <div className="staff-info">
                    <h4>{member.node.name.full}</h4>
                    <p className="staff-role">{member.role}</p>
                    <p className="staff-name-native">
                      {member.node.name.native}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "recommendations" && (
          <div className="recommendations-tab">
            <Recommendations mediaId={id} mediaType={mediaType} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Details;
