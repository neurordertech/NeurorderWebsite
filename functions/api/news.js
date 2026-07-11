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

export async function onRequestGet() {
  try {
    const feedResults = await Promise.all(
      NEWS_FEEDS.map(fetchNewsFeed)
    );

    const articles = removeDuplicates(
      feedResults.flat()
    )
      .filter(function (article) {
        return article.title && article.url;
      })
      .sort(function (a, b) {
        return (
          new Date(b.publishedAt || 0) -
          new Date(a.publishedAt || 0)
        );
      })
      .slice(0, 30);

    return Response.json(
      {
        success: true,
        generatedAt: new Date().toISOString(),
        articles
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=1800",
          "X-Content-Type-Options": "nosniff"
        }
      }
    );
  } catch (error) {
    console.error(
      "Neurorder News API error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "The intelligence feed is temporarily unavailable.",
        generatedAt: new Date().toISOString(),
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

async function fetchNewsFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        Accept:
          "application/rss+xml, application/xml, text/xml"
      }
    });

    if (!response.ok) {
      throw new Error(
        `${feed.source} feed returned ${response.status}`
      );
    }

    const xml = await response.text();

    return parseRssFeed(xml, feed);
  } catch (error) {
    console.error(
      `Unable to load ${feed.source}:`,
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