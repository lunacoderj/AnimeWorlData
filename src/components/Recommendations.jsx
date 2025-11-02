import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Recommendations.css";

const Recommendations = ({ mediaId, mediaType = "anime" }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, [mediaId, mediaType]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const query = `
        query ($id: Int) {
          Media(id: $id) {
            recommendations {
              edges {
                node {
                  mediaRecommendation {
                    id
                    type
                    title {
                      userPreferred
                    }
                    coverImage {
                      large
                    }
                    format
                    averageScore
                    status
                    episodes
                    chapters
                    volumes
                  }
                }
              }
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
          variables: { id: parseInt(mediaId) },
        }),
      });

      const data = await response.json();
      if (data.data.Media) {
        const recs = data.data.Media.recommendations.edges
          .slice(0, 12)
          .map((edge) => edge.node.mediaRecommendation)
          .filter((media) => media !== null);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaClick = (mediaId, mediaType) => {
    navigate(`/details/${mediaId}`);
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

  const getMediaTypeLabel = (media) => {
    const format = media.format?.toLowerCase() || "";
    const title = media.title?.userPreferred?.toLowerCase() || "";
    
    if (format.includes("manhwa") || title.includes("manhwa")) return "Manhwa";
    if (format.includes("manhua") || title.includes("manhua")) return "Manhua";
    if (format.includes("novel")) return "Light Novel";
    if (format.includes("one_shot")) return "One Shot";
    if (media.type === "MANGA") return "Manga";
    return "Anime";
  };

  const getMediaSpecificInfo = (media) => {
    const isComic = media.type === "MANGA";
    const mediaTypeLabel = getMediaTypeLabel(media);

    if (isComic) {
      return {
        countLabel: "Chapters",
        countValue: media.chapters || "?",
        secondaryInfo: media.volumes ? `${media.volumes} vols` : null,
        typeLabel: mediaTypeLabel
      };
    } else {
      return {
        countLabel: "Episodes",
        countValue: media.episodes || "?",
        secondaryInfo: null,
        typeLabel: "Anime"
      };
    }
  };

  if (loading) {
    return (
      <div className="recommendations-loading">
        <div className="loading-spinner"></div>
        <p>Loading recommendations...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="no-recommendations">
        <h3>No recommendations available</h3>
        <p>We couldn't find any similar {mediaType === "anime" ? "anime" : "manga"} recommendations.</p>
      </div>
    );
  }

  return (
    <div className="recommendations-container">
      <h3>You Might Also Like</h3>
      <div className="recommendations-grid">
        {recommendations.map((media) => {
          const mediaInfo = getMediaSpecificInfo(media);
          
          return (
            <div
              key={media.id}
              className="recommendation-card"
              onClick={() => handleMediaClick(media.id, media.type.toLowerCase())}
            >
              <div className="rec-image-container">
                <img
                  src={media.coverImage.large}
                  alt={media.title.userPreferred}
                  className="rec-image"
                />
                <div className="rec-overlay">
                  <div className="rec-score">
                    ★ {media.averageScore ? (media.averageScore / 10).toFixed(1) : "N/A"}
                  </div>
                  <div className="rec-type-badge">
                    {mediaInfo.typeLabel}
                  </div>
                </div>
              </div>
              <div className="rec-content">
                <h4 className="rec-title">{media.title.userPreferred}</h4>
                <div className="rec-details">
                  <span className="rec-format">{media.format}</span>
                  <span
                    className="rec-status"
                    style={{ backgroundColor: getStatusColor(media.status) }}
                  >
                    {media.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="rec-meta">
                  <span className="rec-count">
                    {mediaInfo.countValue} {mediaInfo.countLabel.toLowerCase()}
                  </span>
                  {mediaInfo.secondaryInfo && (
                    <span className="rec-secondary">
                      • {mediaInfo.secondaryInfo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Recommendations;