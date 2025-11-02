import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Read.css";

const Read = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(parseInt(chapter) || 1);
  const [currentVolume, setCurrentVolume] = useState(1);

  useEffect(() => {
    fetchMangaDetails();
  }, [id]);

  useEffect(() => {
    if (chapter) {
      setCurrentChapter(parseInt(chapter));
    }
  }, [chapter]);

  const fetchMangaDetails = async () => {
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
            chapters
            volumes
            averageScore
            meanScore
            status
            genres
            format
            countryOfOrigin
            staff {
              edges {
                role
                node {
                  name {
                    full
                  }
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
          }
        }
      `;

      const response = await axios.post("https://graphql.anilist.co", {
        query,
        variables: { id: parseInt(id) },
      });

      if (response.data.data.Media) {
        const mangaData = response.data.data.Media;
        setManga(mangaData);
        extractVolumes(mangaData);
        fetchChapters(mangaData); // Pass mangaData to fetchChapters
      }
    } catch (error) {
      console.error("Error fetching manga details:", error);
      setLoading(false);
    }
  };

  const extractVolumes = (mangaData) => {
    const volumesList = [];
    const totalVolumes = mangaData.volumes || 1;

    for (let i = 1; i <= totalVolumes; i++) {
      volumesList.push({
        number: i,
        title: `Volume ${i}`,
        chapters: Math.floor((mangaData.chapters || 0) / totalVolumes),
        cover: mangaData.coverImage.large,
      });
    }

    setVolumes(volumesList);
  };

  const fetchChapters = (mangaData) => {
    try {
      // Simulate chapters data using the actual manga data
      const simulatedChapters = simulateChaptersData(mangaData);
      setChapters(simulatedChapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateChaptersData = (mangaData) => {
    if (!mangaData) return [];

    const totalChapters = mangaData.chapters || 50;
    const chaptersList = [];

    for (let i = 1; i <= totalChapters; i++) {
      const isSpecial = Math.random() > 0.9; // 10% chance of being special chapter
      const pages = Math.floor(Math.random() * 30) + 15; // 15-45 pages

      chaptersList.push({
        number: i,
        title: {
          romaji: isSpecial ? `Special Chapter ${i}` : `Chapter ${i}`,
          english: isSpecial
            ? `Special: The Untold Story`
            : `Chapter ${i}: New Beginnings`,
        },
        volume: Math.ceil(i / 10), // 10 chapters per volume
        pages: pages,
        isSpecial,
        releaseDate: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        readUrl: `https://manga-reader.com/read/${mangaData.title.romaji
          .toLowerCase()
          .replace(/ /g, "-")}/chapter-${i}`,
      });
    }

    return chaptersList;
  };

  // Safe manga type detection
  const getMangaType = () => {
    if (!manga) return "Manga"; // Default fallback

    const format = manga.format?.toLowerCase() || "";
    const country = manga.countryOfOrigin || "";

    if (country === "KR") return "Manhwa";
    if (country === "CN") return "Manhua";
    if (format.includes("novel")) return "Light Novel";
    if (format.includes("one_shot")) return "One Shot";
    return "Manga";
  };

  const handleChapterSelect = (chapterNumber) => {
    setCurrentChapter(chapterNumber);
    navigate(`/read/${id}/${chapterNumber}`, { replace: true });
  };

  const handleVolumeSelect = (volumeNumber) => {
    setCurrentVolume(volumeNumber);
    // Find first chapter of selected volume
    const firstChapter = chapters.find((ch) => ch.volume === volumeNumber);
    if (firstChapter) {
      handleChapterSelect(firstChapter.number);
    }
  };

  const getNextChapter = () => {
    if (currentChapter < chapters.length) {
      return currentChapter + 1;
    }
    return null;
  };

  const getPrevChapter = () => {
    if (currentChapter > 1) {
      return currentChapter - 1;
    }
    return null;
  };

  const navigateToChapter = (chapterNumber) => {
    if (chapterNumber) {
      handleChapterSelect(chapterNumber);
    }
  };

  if (loading) {
    return (
      <div className="read-loading">
        <div className="loading-spinner"></div>
        <p>Loading {getMangaType().toLowerCase()} details...</p>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="read-error">
        <h2>Manga not found</h2>
        <button onClick={() => navigate("/")}>Return to Home</button>
      </div>
    );
  }

  const currentChapterData =
    chapters.find((ch) => ch.number === currentChapter) || chapters[0];
  const currentChapters = chapters.filter((ch) => ch.volume === currentVolume);

  return (
    <div className="read-container">
      {/* Hero Section */}
      <div
        className="read-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${
            manga.bannerImage || manga.coverImage.extraLarge
          })`,
        }}
      >
        <div className="hero-content">
          <div className="manga-poster">
            <img src={manga.coverImage.extraLarge} alt={manga.title.romaji} />
            <div className="manga-type-badge">{getMangaType()}</div>
          </div>
          <div className="hero-info">
            <h1>{manga.title.romaji || manga.title.english}</h1>
            <h2>{manga.title.native}</h2>
            <div className="manga-meta">
              <span>⭐ {manga.averageScore || "N/A"}%</span>
              <span>📖 {manga.chapters || "?"} Chapters</span>
              <span>📚 {manga.volumes || "?"} Volumes</span>
              <span className={`status ${manga.status.toLowerCase()}`}>
                {manga.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="genres">
              {manga.genres.map((genre) => (
                <span key={genre} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reader Section */}
      <div className="reader-section">
        <div className="reader-header">
          <h3>Now Reading: {currentChapterData?.title.romaji}</h3>
          <div className="reader-meta">
            <span>Volume {currentChapterData?.volume}</span>
            <span>{currentChapterData?.pages} pages</span>
            <span>{currentChapterData?.releaseDate}</span>
            {currentChapterData?.isSpecial && (
              <span className="special-badge">SPECIAL</span>
            )}
          </div>
        </div>

        <div className="reader-container">
          <div className="reader-placeholder">
            <div className="reader-info">
              <h4>Chapter {currentChapter}</h4>
              <p>{currentChapterData?.title.english}</p>
              <div className="reader-actions">
                <a
                  href={currentChapterData?.readUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="read-external-btn"
                >
                  📖 Read on MangaReader
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Navigation */}
        <div className="chapter-nav">
          <button
            className="nav-btn prev-btn"
            onClick={() => navigateToChapter(getPrevChapter())}
            disabled={!getPrevChapter()}
          >
            ‹ Previous Chapter
          </button>
          <span className="chapter-counter">
            Chapter {currentChapter} of {chapters.length}
          </span>
          <button
            className="nav-btn next-btn"
            onClick={() => navigateToChapter(getNextChapter())}
            disabled={!getNextChapter()}
          >
            Next Chapter ›
          </button>
        </div>
      </div>

      {/* Volumes Navigation */}
      {volumes.length > 0 && (
        <div className="volumes-section">
          <h3>Volumes</h3>
          <div className="volumes-grid">
            {volumes.map((volume) => (
              <div
                key={volume.number}
                className={`volume-card ${
                  volume.number === currentVolume ? "active" : ""
                }`}
                onClick={() => handleVolumeSelect(volume.number)}
              >
                <img src={volume.cover} alt={volume.title} />
                <div className="volume-info">
                  <h4>{volume.title}</h4>
                  <p>{volume.chapters} chapters</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapters List */}
      <div className="chapters-section">
        <div className="section-header">
          <h3>
            Volume {currentVolume} Chapters ({currentChapters.length})
          </h3>
          <div className="volume-selector">
            <select
              value={currentVolume}
              onChange={(e) => handleVolumeSelect(parseInt(e.target.value))}
            >
              {volumes.map((volume) => (
                <option key={volume.number} value={volume.number}>
                  Volume {volume.number}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chapters-list">
          {currentChapters.map((chapter) => (
            <div
              key={chapter.number}
              className={`chapter-item ${
                chapter.number === currentChapter ? "active" : ""
              } ${chapter.isSpecial ? "special" : ""}`}
              onClick={() => handleChapterSelect(chapter.number)}
            >
              <div className="chapter-info">
                <h4>{chapter.title.romaji}</h4>
                <p>{chapter.title.english}</p>
                <div className="chapter-meta">
                  <span>{chapter.pages} pages</span>
                  <span>{chapter.releaseDate}</span>
                  {chapter.isSpecial && (
                    <span className="special-tag">Special</span>
                  )}
                </div>
              </div>
              <div className="chapter-number">{chapter.number}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section Placeholder */}
      <div className="comments-section">
        <h3>Discussion</h3>
        <div className="comments-placeholder">
          <p>Discussion section will be implemented in the next update</p>
          <button className="login-to-comment-btn">Login to Discuss</button>
        </div>
      </div>
    </div>
  );
};

export default Read;
