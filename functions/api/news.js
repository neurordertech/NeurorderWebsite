const NEWS_FEEDS = [
  {
    source: "News24",
    category: "South Africa",
    url:
      "https://news.google.com/rss/search?q=site%3Anews24.com%20South%20Africa&hl=en-ZA&gl=ZA&ceid=ZA%3Aen"
  },
  {
    source: "News24",
    category: "Technology",
    url:
      "https://news.google.com/rss/search?q=site%3Anews24.com%20technology%20OR%20fintech%20OR%20artificial%20intelligence&hl=en-ZA&gl=ZA&ceid=ZA%3Aen"
  },
  {
    source: "UNDP",
    category: "Development",
    url:
      "https://news.google.com/rss/search?q=site%3Aundp.org%20Africa%20OR%20South%20Africa%20OR%20digital%20development&hl=en-ZA&gl=ZA&ceid=ZA%3Aen"
  }
];

const NEWS_CACHE_KEY = "nous-intelligence-feed";
const NEWS_CACHE_DURATION = 20 * 60 * 1000;

export async function onRequestGet(context) {
  const { env } = context;

  try {
    /*
     * STEP 1:
     * Read the last successful feed from Cloudflare KV.
     */
    let cachedFeed = null;

    if (env.NEWS_CACHE) {
      cachedFeed = await env.NEWS_CACHE.get(
        NEWS_CACHE_KEY,
        "json"
      );
    }

    /*
     * STEP 2:
     * If the cached feed is less than 20 minutes old,
     * return it without requesting Google News again.
     */
    if (
      cachedFeed &&
      Array.isArray(cachedFeed.articles) &&
      cachedFeed.articles.length > 0 &&
      cachedFeed.cachedAt
    ) {
      const cacheAge =
        Date.now() -
        new Date(cachedFeed.cachedAt).getTime();

    console.log("Serving articles from Cloudflare KV cache");

      if (cacheAge < NEWS_CACHE_DURATION) {
        return createNewsResponse({
          articles: cachedFeed.articles,
          generatedAt: cachedFeed.generatedAt,
          cachedAt: cachedFeed.cachedAt,
          cacheStatus: "fresh-cache"
        });
      }
    }

    /*
     * STEP 3:
     * Cache is missing or older than 20 minutes.
     * Request fresh articles from every feed.
     */
    console.log("Fetching fresh RSS feeds...");
    const feedResults = await Promise.all(
      NEWS_FEEDS.map(fetchNewsFeed)
    );

    const freshArticles = removeDuplicates(
      feedResults.flat()
    )
      .filter(function (article) {
        return article && article.title && article.url;
      })
      .sort(function (a, b) {
        return (
          new Date(b.publishedAt || 0) -
          new Date(a.publishedAt || 0)
        );
      })
      .slice(0, 30);

    /*
     * STEP 4:
     * Save only a successful, non-empty feed.
     */
    if (freshArticles.length > 0) {
      const generatedAt =
        new Date().toISOString();

      const cacheRecord = {
        generatedAt,
        cachedAt: generatedAt,
        articles: freshArticles
      };

      if (env.NEWS_CACHE) {
        await env.NEWS_CACHE.put(
          NEWS_CACHE_KEY,
          JSON.stringify(cacheRecord)
        );
      }

      return createNewsResponse({
        articles: freshArticles,
        generatedAt,
        cachedAt: generatedAt,
        cacheStatus: "refreshed"
      });
    }

    /*
     * STEP 5:
     * Google returned no usable articles.
     * Serve the older successful cache instead.
     */
    if (
      cachedFeed &&
      Array.isArray(cachedFeed.articles) &&
      cachedFeed.articles.length > 0
    ) {
      return createNewsResponse({
        articles: cachedFeed.articles,
        generatedAt: cachedFeed.generatedAt,
        cachedAt: cachedFeed.cachedAt,
        cacheStatus: "stale-fallback"
      });
    }

    /*
     * No fresh feed and no previous cache exists.
     */
    return Response.json(
      {
        success: false,
        message:
          "No intelligence signals are currently available.",
        generatedAt: new Date().toISOString(),
        cacheStatus: "empty",
        articles: []
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff"
        }
      }
    );
  } catch (error) {
    console.error(
      "Neurorder News API error:",
      error
    );

    /*
     * Try the stored cache one final time
     * if an unexpected error occurs.
     */
    try {
      if (env.NEWS_CACHE) {
        const emergencyCache =
          await env.NEWS_CACHE.get(
            NEWS_CACHE_KEY,
            "json"
          );

        if (
          emergencyCache &&
          Array.isArray(
            emergencyCache.articles
          ) &&
          emergencyCache.articles.length > 0
        ) {
          return createNewsResponse({
            articles:
              emergencyCache.articles,
            generatedAt:
              emergencyCache.generatedAt,
            cachedAt:
              emergencyCache.cachedAt,
            cacheStatus:
              "emergency-fallback"
          });
        }
      }
    } catch (cacheError) {
      console.error(
        "Unable to read emergency news cache:",
        cacheError
      );
    }

    return Response.json(
      {
        success: false,
        message:
          "The intelligence feed is temporarily unavailable.",
        generatedAt: new Date().toISOString(),
        cacheStatus: "error",
        articles: []
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff"
        }
      }
    );
  }
}

function createNewsResponse({
  articles,
  generatedAt,
  cachedAt,
  cacheStatus
}) {
  return Response.json(
    {
      success: true,
      generatedAt:
        generatedAt ||
        new Date().toISOString(),
      cachedAt:
        cachedAt || null,
      cacheStatus,
      refreshIntervalMinutes: 20,
      articles
    },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options":
          "nosniff"
      }
    }
  );
}

async function fetchNewsFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      method: "GET",

      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NeurorderNewsBot/1.0; +https://neurorder.com)",

        Accept:
          "application/rss+xml, application/xml, text/xml, */*",

        "Accept-Language":
          "en-ZA,en;q=0.9",

        "Cache-Control":
          "no-cache"
      },

      redirect: "follow"
    });

    const xml = await response.text();

    console.log(
      `${feed.source} ${feed.category}`,
      {
        status: response.status,
        contentType:
          response.headers.get("content-type"),
        length: xml.length,
        preview: xml.slice(0, 200)
      }
    );

    if (!response.ok) {
      throw new Error(
        `${feed.source} feed returned ${response.status}`
      );
    }

    const articles =
      parseRssFeed(xml, feed);

    console.log(
      `${feed.source} ${feed.category} parsed ${articles.length} articles`
    );

    return articles;
  } catch (error) {
    console.error(
      `Unable to load ${feed.source} ${feed.category}:`,
      error
    );

    return [];
  }
}



function parseRssFeed(xml, feed) {
  const itemBlocks =
    xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  return itemBlocks
    .slice(0, 15)
    .map(function (item) {
      const rawTitle = cleanText(
        getTagValue(item, "title")
      );

      const rawDescription =
        getTagValue(item, "description");

      const description =
        cleanText(rawDescription);

      const image =
        getMediaImage(item) ||
        getImageFromDescription(rawDescription) ||
        null;

      return {
        title: cleanHeadline(rawTitle),
        summary: cleanDescription(
          description,
          rawTitle
        ).slice(0, 240),
        url: cleanText(
          getTagValue(item, "link")
        ),
        source: feed.source,
        category: feed.category,
        publishedAt:
          cleanText(
            getTagValue(item, "pubDate")
          ) || null,
        image
      };
    });
}

function getTagValue(xmlBlock, tagName) {
  const expression = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`,
    "i"
  );

  const match = xmlBlock.match(expression);

  return match ? match[1] : "";
}

function getMediaImage(item) {
  const mediaContent = item.match(
    /<media:content[^>]+url=["']([^"']+)["']/i
  );

  if (mediaContent) {
    return normaliseImageUrl(
      mediaContent[1]
    );
  }

  const mediaThumbnail = item.match(
    /<media:thumbnail[^>]+url=["']([^"']+)["']/i
  );

  if (mediaThumbnail) {
    return normaliseImageUrl(
      mediaThumbnail[1]
    );
  }

  const enclosure = item.match(
    /<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["']/i
  );

  if (enclosure) {
    return normaliseImageUrl(
      enclosure[1]
    );
  }

  const enclosureAlternative = item.match(
    /<enclosure[^>]+type=["']image\/[^"']+["'][^>]*url=["']([^"']+)["']/i
  );

  if (enclosureAlternative) {
    return normaliseImageUrl(
      enclosureAlternative[1]
    );
  }

  return null;
}

function getImageFromDescription(description) {
  const decodedDescription =
    decodeXml(description);

  const match = decodedDescription.match(
    /<img[^>]+src=["']([^"']+)["']/i
  );

  return match
    ? normaliseImageUrl(match[1])
    : null;
}

function normaliseImageUrl(value) {
  const imageUrl = decodeXml(value).trim();

  if (
    !imageUrl.startsWith("https://") &&
    !imageUrl.startsWith("http://")
  ) {
    return null;
  }

  return imageUrl;
}

function cleanDescription(
  description,
  title
) {
  let result = String(description || "");

  result = result
    .replace(title, "")
    .replace(/\s+-\s+[A-Za-z0-9 .&'-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  return result;
}

function cleanText(value) {
  return decodeXml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXml(value) {
  return String(value || "")
    .replace(
      /<!\[CDATA\[([\s\S]*?)\]\]>/g,
      "$1"
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

function cleanHeadline(title) {
  return String(title || "")
    .replace(/\s+-\s+News24\s*$/i, "")
    .replace(/\s+-\s+UNDP\s*$/i, "")
    .replace(
      /\s+-\s+United Nations Development Programme\s*$/i,
      ""
    )
    .trim();
}

function removeDuplicates(articles) {
  const seen = new Set();

  return articles.filter(
    function (article) {
      const key = String(
        article.title || ""
      )
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    }
  );
}