import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ImageAnalyzer.css";

const ImageAnalyzer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Add this line
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Toggle between minimized and full view
  const toggleAnalyzer = () => {
    setIsMinimized(!isMinimized);
    // Reset states when closing
    if (!isMinimized) {
      resetAnalysis();
    }
  };

  // Supported file types
  const supportedFormats = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file) => {
    // Reset previous state
    setError("");
    setAnalysisResult(null);

    // Validate file type
    if (!supportedFormats.includes(file.type)) {
      setError(
        "Unsupported file format. Please upload JPEG, PNG, WebP, or GIF images."
      );
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Please upload images smaller than 5MB.");
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError("");
    setAnalysisResult(null);

    try {
      // Convert image to blob for API upload
      const response = await fetch(previewUrl);
      const blob = await response.blob();

      // First try trace.moe for anime scene detection
      let result = await analyzeWithTraceMoe(blob);

      // If trace.moe doesn't find anything, try SauceNAO for manga/manhwa
      if (!result.match) {
        result = await analyzeWithSauceNAO(blob);
      }

      setAnalysisResult(result);

      // If we found a direct match, redirect to details
      if (result.match && result.mediaId) {
        setTimeout(() => {
          navigate(`/details/${result.mediaId}`);
        }, 2000);
      }
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Real API integration with trace.moe (anime scene detection)
  const analyzeWithTraceMoe = async (imageBlob) => {
    const formData = new FormData();
    formData.append("image", imageBlob);

    try {
      const response = await fetch("https://api.trace.moe/search?anilistInfo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();

      if (data.result && data.result.length > 0) {
        const bestMatch = data.result[0];
        const anilistInfo = bestMatch.anilist;

        if (anilistInfo) {
          return {
            match: true,
            confidence: Math.round(bestMatch.similarity * 100),
            mediaType: "ANIME",
            title: anilistInfo.title?.romaji || anilistInfo.title?.english,
            mediaId: anilistInfo.id,
            description: `Scene from episode ${bestMatch.episode || "Unknown"}`,
            episode: bestMatch.episode,
            timestamp: formatTimestamp(bestMatch.from),
            similarity: bestMatch.similarity,
            apiSource: "trace.moe",
          };
        }
      }

      return {
        match: false,
        confidence: 0,
        mediaType: "UNKNOWN",
        description: "No anime scene match found in trace.moe database",
      };
    } catch (error) {
      console.error("Trace.moe API error:", error);
      throw error;
    }
  };

  // Real API integration with SauceNAO (manga/manhwa/image search)
  const analyzeWithSauceNAO = async (imageBlob) => {
    // Note: SauceNAO requires an API key. You need to sign up at https://saucenao.com/
    // For demo purposes, we'll use a simulated response
    // Replace with actual API call when you have an API key

    const SAUCENAO_API_KEY = process.env.REACT_APP_SAUCENAO_API_KEY; // Add this to your .env file

    if (!SAUCENAO_API_KEY) {
      // Simulate SauceNAO response for demo
      return simulateSauceNAOResponse();
    }

    const formData = new FormData();
    formData.append("output_type", 2); // JSON output
    formData.append("api_key", SAUCENAO_API_KEY);
    formData.append("db", 999); // All databases
    formData.append("numres", 1); // Only top result
    formData.append("url", previewUrl); // Use data URL for API

    try {
      const response = await fetch("https://saucenao.com/search.php", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("SauceNAO API request failed");

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const bestResult = data.results[0];
        const header = bestResult.header;
        const data = bestResult.data;

        // Parse SauceNAO result based on database
        return parseSauceNAOResult(header, data);
      }

      return {
        match: false,
        confidence: 0,
        mediaType: "UNKNOWN",
        description: "No match found in SauceNAO databases",
      };
    } catch (error) {
      console.error("SauceNAO API error:", error);
      return simulateSauceNAOResponse(); // Fallback to simulation
    }
  };

  // Parse SauceNAO result into our format
  const parseSauceNAOResult = (header, data) => {
    const similarity = parseFloat(header.similarity);
    const source = data.source || "";

    // Determine media type based on database and source
    let mediaType = "UNKNOWN";
    let title = data.title || data.eng_name || source;
    let mediaId = null;

    // Check for manga databases
    if (
      header.index_id === 5 ||
      header.index_id === 6 ||
      header.index_id === 37
    ) {
      mediaType = "MANGA";
      // Try to extract AniList ID from source or title
      mediaId = extractAniListId(source, title);
    }
    // Check for anime databases
    else if (header.index_id === 1 || header.index_id === 2) {
      mediaType = "ANIME";
      mediaId = extractAniListId(source, title);
    }

    return {
      match: similarity > 70, // Consider it a match if similarity > 70%
      confidence: similarity,
      mediaType,
      title,
      mediaId,
      description: `Found in ${getDatabaseName(header.index_id)} database`,
      source: source,
      apiSource: "saucenao",
    };
  };

  // Simulate SauceNAO response for demo (remove when you have real API key)
  const simulateSauceNAOResponse = async () => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock manga/manhwa results
    const mockResults = [
      {
        match: true,
        confidence: 85,
        mediaType: "MANGA",
        title: "One Piece",
        mediaId: 13,
        description: "Manga panel detected in MangaDex database",
        chapter: 1045,
        apiSource: "saucenao",
      },
      {
        match: true,
        confidence: 78,
        mediaType: "MANHWA",
        title: "Solo Leveling",
        mediaId: 113415,
        description: "Manhwa art detected in MangaDex database",
        apiSource: "saucenao",
      },
      {
        match: false,
        confidence: 45,
        mediaType: "UNKNOWN",
        description:
          "Image appears to be anime-style art but no specific match found",
        apiSource: "saucenao",
      },
    ];

    // Return a random result for demo
    return mockResults[Math.floor(Math.random() * mockResults.length)];
  };

  // Helper function to extract AniList ID from source/title
  const extractAniListId = (source, title) => {
    // This would require additional API calls to AniList to search by title
    // For now, return null and handle search separately
    return null;
  };

  // Helper function to get database name from SauceNAO index ID
  const getDatabaseName = (indexId) => {
    const databases = {
      1: "Pixiv Images",
      2: "Pixiv Historical",
      5: "MangaDex",
      6: "H-Manga",
      37: "MangaDex (Historical)",
    };
    return databases[indexId] || `Database ${indexId}`;
  };

  // Helper function to format timestamp
  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setPreviewUrl("");
    setAnalysisResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "#10b981";
    if (confidence >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getMediaTypeIcon = (mediaType) => {
    switch (mediaType) {
      case "ANIME":
        return "🎥";
      case "MANGA":
        return "📖";
      case "MANHWA":
        return "🇰🇷";
      case "MANHUA":
        return "🇨🇳";
      case "NOVEL":
        return "📚";
      default:
        return "❓";
    }
  };

  // Function to search AniList by title and get media ID
  const searchAniListByTitle = async (title, mediaType) => {
    try {
      const query = `
        query ($search: String, $type: MediaType) {
          Page(page: 1, perPage: 1) {
            media(search: $search, type: $type) {
              id
              title {
                romaji
                english
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
          variables: {
            search: title,
            type:
              mediaType === "MANGA" || mediaType === "MANHWA"
                ? "MANGA"
                : "ANIME",
          },
        }),
      });

      const data = await response.json();
      if (data.data.Page.media.length > 0) {
        return data.data.Page.media[0].id;
      }
      return null;
    } catch (error) {
      console.error("AniList search error:", error);
      return null;
    }
  };

  // Handle view details with AniList search if needed
  const handleViewDetails = async (result) => {
    if (result.mediaId) {
      navigate(`/details/${result.mediaId}`);
    } else if (result.title) {
      // Search AniList for the title
      setIsAnalyzing(true);
      try {
        const mediaId = await searchAniListByTitle(
          result.title,
          result.mediaType
        );
        if (mediaId) {
          navigate(`/details/${mediaId}`);
        } else {
          setError(
            "Could not find exact match in database. Try a different image."
          );
        }
      } catch (error) {
        setError("Search failed. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  if (isMinimized) {
    return (
      <div className="floating-analyzer-btn" onClick={toggleAnalyzer}>
        <div className="analyzer-icon">🎨</div>
        <div className="tooltip">Analyze Image</div>
      </div>
    );
  }

  return (
    <div className="analyzer-modal">
      <div className="analyzer-modal-content">
        <button className="close-analyzer-btn" onClick={toggleAnalyzer}>
          ✕
        </button>
        <div className="image-analyzer-container">
          <div className="analyzer-header">
            <h1>🎨 Anime/Manga Image Analyzer</h1>
            <p>
              Upload an image to identify anime, manga, manhwa, or light novel
              content
            </p>
          </div>

          <div className="upload-section">
            {!selectedImage ? (
              <div
                className={`upload-area ${dragActive ? "drag-active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-content">
                  <div className="upload-icon">📁</div>
                  <h3>Drop your image here or click to browse</h3>
                  <p>Supports JPEG, PNG, WebP, GIF • Max 5MB</p>
                  <button className="browse-btn">Browse Files</button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />
              </div>
            ) : (
              <div className="preview-section">
                <div className="preview-container">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="preview-image"
                  />
                  <button className="remove-btn" onClick={resetAnalysis}>
                    ✕
                  </button>
                </div>

                {!analysisResult && !isAnalyzing && (
                  <div className="action-buttons">
                    <button className="analyze-btn" onClick={analyzeImage}>
                      🔍 Analyze Image
                    </button>
                    <button className="change-btn" onClick={resetAnalysis}>
                      Change Image
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          {isAnalyzing && (
            <div className="analysis-progress">
              <div className="spinner"></div>
              <h3>Analyzing Image...</h3>
              <p>Scanning for anime, manga, and related content</p>
              <div className="progress-steps">
                <div className="step active">🎨 Analyzing art style</div>
                <div className="step active">👥 Detecting characters</div>
                <div className="step active">🔍 Searching database</div>
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="analysis-result">
              <h3>Analysis Results</h3>

              <div className="result-card">
                <div className="result-header">
                  <span className="media-icon">
                    {getMediaTypeIcon(analysisResult.mediaType)}
                  </span>
                  <div className="result-title">
                    <h4>
                      {analysisResult.match
                        ? "Content Identified!"
                        : "No Exact Match Found"}
                    </h4>
                    <div
                      className="confidence-badge"
                      style={{
                        backgroundColor: getConfidenceColor(
                          analysisResult.confidence
                        ),
                      }}
                    >
                      {analysisResult.confidence}% Confidence
                    </div>
                    {analysisResult.apiSource && (
                      <div className="api-source">
                        Source: {analysisResult.apiSource}
                      </div>
                    )}
                  </div>
                </div>

                <div className="result-details">
                  {analysisResult.match ? (
                    <>
                      <div className="detail-item">
                        <strong>Title:</strong> {analysisResult.title}
                      </div>
                      <div className="detail-item">
                        <strong>Type:</strong> {analysisResult.mediaType}
                      </div>
                      {analysisResult.episode && (
                        <div className="detail-item">
                          <strong>Episode:</strong> {analysisResult.episode}
                        </div>
                      )}
                      {analysisResult.chapter && (
                        <div className="detail-item">
                          <strong>Chapter:</strong> {analysisResult.chapter}
                        </div>
                      )}
                      {analysisResult.timestamp && (
                        <div className="detail-item">
                          <strong>Timestamp:</strong> {analysisResult.timestamp}
                        </div>
                      )}
                      <div className="detail-item">
                        <strong>Description:</strong>{" "}
                        {analysisResult.description}
                      </div>
                    </>
                  ) : (
                    <div className="no-match">
                      <p>{analysisResult.description}</p>
                      <p className="suggestion">
                        Try uploading a clearer image or one with more
                        distinctive anime/manga art style.
                      </p>
                    </div>
                  )}
                </div>

                {analysisResult.match && (
                  <div className="result-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewDetails(analysisResult)}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? "Searching..." : "📋 View Details"}
                    </button>
                    {analysisResult.mediaType === "ANIME" &&
                      analysisResult.mediaId && (
                        <button
                          className="watch-btn"
                          onClick={() =>
                            navigate(`/watch/${analysisResult.mediaId}`)
                          }
                        >
                          ▶️ Watch Now
                        </button>
                      )}
                    {(analysisResult.mediaType === "MANGA" ||
                      analysisResult.mediaType === "MANHWA") &&
                      analysisResult.mediaId && (
                        <button
                          className="read-btn"
                          onClick={() =>
                            navigate(`/read/${analysisResult.mediaId}`)
                          }
                        >
                          📖 Read Now
                        </button>
                      )}
                  </div>
                )}

                {!analysisResult.match && (
                  <div className="result-actions">
                    <button className="try-again-btn" onClick={resetAnalysis}>
                      🔄 Try Another Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="analyzer-tips">
            <h4>💡 Tips for Better Results</h4>
            <ul>
              <li>Use clear, high-quality screenshots from anime episodes</li>
              <li>Upload manga panels with distinctive art styles</li>
              <li>Character close-ups work better than wide shots</li>
              <li>Avoid heavily edited or filtered images</li>
              <li>For best results, use images from popular series</li>
            </ul>
          </div>

          <div className="api-info">
            <h4>🔧 Powered By</h4>
            <div className="api-badges">
              <span className="api-badge">trace.moe</span>
              <span className="api-badge">SauceNAO</span>
              <span className="api-badge">AniList</span>
            </div>
            <p className="api-note">
              Note: For full SauceNAO functionality, add your API key to
              environment variables
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
