// ✅ AniList API GraphQL endpoint
const ANILIST_API = "https://graphql.anilist.co";

import { format, addDays, startOfToday, isToday, isTomorrow } from "date-fns";

/* ================================
   🔸 TRENDING ANIME FETCH
================================== */

// GraphQL query for trending animes
const TRENDING_ANIME_QUERY = `
  query {
    Page(page: 1, perPage: 10) {
      media(type: ANIME, sort: TRENDING_DESC, status: RELEASING) {
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
        averageScore
        episodes
        status
        genres
        trailer {
          id
          site
          thumbnail
        }
        nextAiringEpisode {
          episode
          timeUntilAiring
        }
      }
    }
  }
`;

// ✅ Fetch trending anime
export const getTrendingAnimes = async () => {
  try {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: TRENDING_ANIME_QUERY }),
    });

    const { data } = await response.json();

    if (!data?.Page?.media) {
      throw new Error("No data received from AniList API");
    }

    return data.Page.media.map((anime, index) => ({
      id: anime.id,
      name: anime.title.english || anime.title.romaji,
      nativeName: anime.title.native,
      rating: anime.averageScore ? anime.averageScore / 10 : 0,
      episodes: anime.episodes || "TBA",
      status: anime.status,
      genres: anime.genres.slice(0, 3),
      imageUrl: anime.bannerImage || anime.coverImage.extraLarge,
      trailer: anime.trailer,
      color: anime.coverImage.color,
      description:
        anime.description?.replace(/<[^>]*>/g, "") ||
        "No description available.",
      rank: index + 1,
    }));
  } catch (error) {
    console.error("Error fetching trending animes:", error);
    throw error;
  }
};

// ✅ Fallback data for trending
export const getFallbackAnimes = () => [
  {
    id: 1,
    name: "One Piece",
    nativeName: "進撃の巨人",
    rating: 9.1,
    episodes: 1161,
    status: "Ongoing",
    genres: ["Action", "Drama", "Fantasy"],
    imageUrl: "https://youtu.be/BG89ff1tjLU?si=ipfMlMPWgwAtBG9K",
    color: "#4a4a4a",
    description:
      "One Piece is a legendary manga and anime series created by Eiichiro Oda, following the adventures of Monkey D. Luffy and his crew, the Straw Hat Pirates, as they search for the ultimate treasure known as the One Piece to become the next King of the Pirates.",
    rank: 1,
  },
  {
    id: 2,
    name: "Demon Slayer",
    nativeName: "鬼滅の刃",
    rating: 8.7,
    episodes: 55,
    status: "FINISHED",
    genres: ["Action", "Fantasy"],
    imageUrl:
      "https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=800",
    color: "#ff6b6b",
    description: "A boy becomes a demon slayer to save his sister.",
    rank: 2,
  },
];

/* ================================*/

const UPCOMING_QUERY = `
  query GetUpcoming($page: Int, $perPage: Int, $startDateGreater: FuzzyDateInt) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(sort: START_DATE, startDate_greater: $startDateGreater, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
        }
        bannerImage
        description
        averageScore
        status
        genres
        episodes
        format
        startDate {
          year
          month
          day
        }
        studios {
          nodes {
            name
          }
        }
      }
    }
  }
`;

const toFuzzyDateInt = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return parseInt(`${yyyy}${mm}${dd}`);
};

export const getUpcomingAnime = async (perPage = 25) => {
  try {
    const today = new Date();
    const startDateGreater = toFuzzyDateInt(today);

    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: UPCOMING_QUERY,
        variables: { page: 1, perPage, startDateGreater },
      }),
    });

    const { data, errors } = await res.json();
    if (errors) throw new Error(errors[0].message);

    return data.Page.media.map((anime) => {
      const start = anime.startDate;
      const releaseDate = start.year
        ? format(
            new Date(start.year, start.month - 1, start.day || 1),
            "MMM d, yyyy"
          )
        : "TBA";

      return {
        id: anime.id,
        title: anime.title.english || anime.title.romaji,
        nativeTitle: anime.title.native,
        image: anime.coverImage.large || anime.bannerImage || "",
        banner: anime.bannerImage,
        description:
          anime.description?.replace(/<[^>]*>/g, "") || "No description",
        rating: anime.averageScore ? anime.averageScore / 10 : 0,
        status: anime.status,
        genres: anime.genres,
        episodes: anime.episodes || "-",
        format: anime.format,
        studio: anime.studios?.nodes[0]?.name || "Unknown",
        releaseDate,
      };
    });
  } catch (err) {
    console.error("API error (TopUpcoming):", err);
    return [];
  }
};

/* ================================
   🔸 AIRING SCHEDULE FETCH
================================== */
// anilistApi.js
// GraphQL query to fetch airing schedule
const SCHEDULE_QUERY = `
  query GetSchedule($page: Int, $perPage: Int, $airingAtGreater: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      airingSchedules(
        sort: TIME
        airingAt_greater: $airingAtGreater
      ) {
        id
        airingAt
        episode
        media {
          id
          title { romaji english native }
          coverImage { large color }
          bannerImage
          description
          averageScore
          status
          genres
          episodes
          format
          studios { nodes { name } }
        }
      }
    }
  }
`;

export const getAnimeSchedule = async (daysAhead = 7, perPage = 25) => {
  try {
    const today = startOfToday();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const maxTimestamp = currentTimestamp + daysAhead * 24 * 60 * 60;

    let allSchedules = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      // Small delay between requests to avoid 429
      if (page > 1) await new Promise((r) => setTimeout(r, 250));

      const res = await fetch(ANILIST_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: SCHEDULE_QUERY,
          variables: { page, perPage, airingAtGreater: currentTimestamp },
        }),
      });

      const { data, errors } = await res.json();
      if (errors) throw new Error(errors[0].message);

      const schedules = data.Page.airingSchedules.filter(
        (item) => item.airingAt <= maxTimestamp
      );

      allSchedules = allSchedules.concat(schedules);

      hasNextPage = data.Page.pageInfo.hasNextPage;
      page++;
      // Stop if we already fetched enough episodes for daysAhead
      if (allSchedules.length >= daysAhead * 10) break;
    }

    // Map into usable format
    const formatted = allSchedules.map((item) => {
      const anime = item.media;
      const airingDate = new Date(item.airingAt * 1000);
      return {
        id: item.id,
        airingAt: item.airingAt,
        episode: item.episode,
        time: format(airingDate, "HH:mm"),
        date: format(airingDate, "EEE MMM d"),
        dayOfWeek: format(airingDate, "EEEE"),
        fullDate: airingDate,
        isToday: isToday(airingDate),
        isTomorrow: isTomorrow(airingDate),
        anime: {
          id: anime.id,
          title: anime.title.english || anime.title.romaji,
          nativeTitle: anime.title.native,
          coverImage: anime.coverImage.large,
          bannerImage: anime.bannerImage,
          color: anime.coverImage.color,
          description:
            anime.description?.replace(/<[^>]*>/g, "") ||
            "No description available",
          rating: anime.averageScore ? anime.averageScore / 10 : 0,
          status: anime.status,
          genres: anime.genres.slice(0, 3),
          totalEpisodes: anime.episodes,
          format: anime.format,
          studio: anime.studios?.nodes[0]?.name || "Unknown",
        },
      };
    });

    // Group by date
    const groupedByDate = formatted.reduce((acc, item) => {
      const key = item.date;
      if (!acc[key]) {
        acc[key] = {
          date: key,
          dayOfWeek: item.dayOfWeek,
          fullDate: item.fullDate,
          isToday: item.isToday,
          isTomorrow: item.isTomorrow,
          items: [],
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {});

    // Fill missing days
    const fullSchedule = [];
    for (let i = 0; i < daysAhead; i++) {
      const curDate = addDays(today, i);
      const key = format(curDate, "EEE MMM d");
      const dayGroup = groupedByDate[key] || {
        date: key,
        dayOfWeek: format(curDate, "EEEE"),
        fullDate: curDate,
        isToday: isToday(curDate),
        isTomorrow: isTomorrow(curDate),
        items: [],
      };
      fullSchedule.push(dayGroup);
    }

    return { schedule: fullSchedule };
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
};

// Fallback for offline or errors
export const getFallbackSchedule = (daysAhead = 7) => {
  const today = startOfToday();
  const genresSample = [
    ["Comedy", "Magic", "Slice of Life"],
    ["Romance", "School", "Drama"],
    ["Horror", "Thriller"],
    ["Fantasy", "Adventure"],
    ["Isekai", "Comedy"],
    ["Drama", "Music"],
    ["Slice of Life", "Outdoor"],
  ];

  const schedule = [];

  for (let i = 0; i < daysAhead; i++) {
    const curDate = addDays(today, i);
    const daySchedule = {
      date: format(curDate, "EEE MMM d"),
      dayOfWeek: format(curDate, "EEEE"),
      fullDate: curDate,
      isToday: isToday(curDate),
      isTomorrow: isTomorrow(curDate),
      items: [],
    };

    for (let j = 0; j < genresSample.length; j++) {
      daySchedule.items.push({
        id: i * 10 + j + 1,
        time: `${18 + j}:00`,
        episode: j + 1,
        anime: {
          id: i * 10 + j + 1,
          title: `Sample Anime ${j + 1}`,
          nativeTitle: `サンプルアニメ ${j + 1}`,
          coverImage: `https://picsum.photos/300/200?random=${i}${j}`,
          color: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"][j % 5],
          description: "This is a sample fallback anime schedule.",
          rating: Math.random() * 2 + 7,
          status: "RELEASING",
          genres: genresSample[j],
          totalEpisodes: 12,
          format: "TV",
          studio: "Fallback Studio",
        },
      });
    }
    schedule.push(daySchedule);
  }

  return {
    schedule,
    pageInfo: { total: 50, currentPage: 1, lastPage: 3, hasNextPage: true },
  };
};
