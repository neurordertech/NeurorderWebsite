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

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

const NAMESPACE_NAME =
  process.env.CLOUDFLARE_KV_NAMESPACE_NAME ||
  "neurorder_news_cache";

const CACHE_KEY = "nous-intelligence-feed";

if (!API_TOKEN || !ACCOUNT_ID) {
  throw new Error(
    "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID."
  );
}

async function main() {
  console.log("Collecting Nous intelligence signals...");

  const results = await Promise.all(
    NEWS_FEEDS.map(fetchFeed)
  );

  const articles = removeDuplicates(
    results.flat()
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

  if (articles.length === 0) {
    throw new Error(
      "No articles were collected. Existing KV data was not overwritten."
    );
  }

  console.log(`Collected ${articles.length} articles.`);

  const namespaceId =
    await findNamespaceId();

  const now = new Date().toISOString();

  const cacheRecord = {
    generatedAt: now,
    cachedAt: now,
    articles
  };

  await writeToKv(
    namespaceId,
    CACHE_KEY,
    JSON.stringify(cacheRecord)
  );

  console.log(
    `Successfully updated ${NAMESPACE_NAME}/${CACHE_KEY}`
  );
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NeurorderNewsCollector/1.0; +https://neurorder.com)",
        Accept:
          "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language":
          "en-ZA,en;q=0.9"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error(
        `${feed.source} returned HTTP ${response.status}`
      );
    }

    const xml = await response.text();
    const articles = parseRssFeed(xml, feed);

    console.log(
      `${feed.source} ${feed.category}: ${articles.length} articles`
    );

    return articles;
  } catch (error) {
    console.error(
      `${feed.source} ${feed.category} failed:`,
      error.message
    );

    return [];
  }
}

function parseRssFeed(xml, feed) {
  const items =
    xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  return items
    .slice(0, 15)
    .map(function (item) {
      const rawTitle = cleanText(
        getTagValue(item, "title")
      );

      const rawDescription =
        getTagValue(item, "description");

      const description =
        cleanText(rawDescription);

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

        image: null
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

function cleanDescription(description, title) {
  return String(description || "")
    .replace(title, "")
    .replace(/\s+-\s+[A-Za-z0-9 .&'-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
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
    .replace(/&nbsp;/g, " ")
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

  return articles.filter(function (article) {
    const key = String(article.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function findNamespaceId() {
  const response = await cloudflareRequest(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces?per_page=100`
  );

  const namespace =
    response.result.find(function (item) {
      return item.title === NAMESPACE_NAME;
    });

  if (!namespace) {
    throw new Error(
      `KV namespace "${NAMESPACE_NAME}" was not found.`
    );
  }

  console.log(
    `Found KV namespace: ${namespace.title}`
  );

  return namespace.id;
}

async function writeToKv(
  namespaceId,
  key,
  value
) {
  const encodedKey =
    encodeURIComponent(key);

  await cloudflareRequest(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodedKey}`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: value
    }
  );
}

async function cloudflareRequest(
  url,
  options = {}
) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization:
        `Bearer ${API_TOKEN}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data;

  try {
    data = text
      ? JSON.parse(text)
      : { success: response.ok };
  } catch {
    data = {
      success: response.ok,
      raw: text
    };
  }

  if (
    !response.ok ||
    data.success === false
  ) {
    throw new Error(
      `Cloudflare API request failed: ${response.status} ${JSON.stringify(
        data.errors || data
      )}`
    );
  }

  return data;
}

main().catch(function (error) {
  console.error(
    "Nous News Collector failed:",
    error
  );

  process.exit(1);
});