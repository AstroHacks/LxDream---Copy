import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import fetch from "node-fetch";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", name: "LxDream backend", timestamp: Date.now() });
});

// DuckDuckGo Search
app.get("/api/search", async (req, res) => {
  const q = req.query.q || "";
  if (!q) return res.json({ query: "", results: [] });

  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  try {
    const response = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await response.text();

    // Extract results (simple regex, not robust)
    const results = [];
    const regex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html))) {
      results.push({
        title: match[2].replace(/<[^>]+>/g, ""), // Strip HTML tags
        url: match[1],
        snippet: ""
      });
    }
    res.json({ query: q, results });
  } catch (e) {
    res.status(500).json({ error: "DuckDuckGo fetch failed" });
  }
});

// Proxy and rewrite links
app.get("/api/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url || !/^https?:\/\//.test(url)) {
    return res.status(400).send("Invalid or missing URL");
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.statusText}`);
      return res.status(response.status).send(`Failed to fetch ${url}`);
    }

    // Handle content types (HTML, CSS, etc.)
    if (contentType.includes("text/html")) {
      // Handle HTML: Rewrite links and remove CSP meta tags
      let html = await response.text();

      function rewriteUrl(resourceUrl, baseUrl) {
        try {
          if (resourceUrl.startsWith("/api/proxy?url=")) return resourceUrl;
          if (/^https?:\/\//i.test(resourceUrl)) {
            return `/api/proxy?url=${encodeURIComponent(resourceUrl)}`;
          }
          if (resourceUrl.startsWith("//")) {
            return `/api/proxy?url=${encodeURIComponent("http:" + resourceUrl)}`;
          }
          const abs = new URL(resourceUrl, baseUrl).href;
          return `/api/proxy?url=${encodeURIComponent(abs)}`;
        } catch {
          return resourceUrl;
        }
      }

      const baseUrl = url;
      html = html
        .replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*)>/gi,
          (match, pre, href, post) =>
            `<a ${pre}href="${rewriteUrl(href, baseUrl)}"${post}>`)
        .replace(/<link\s+([^>]*?)href="([^"]+)"([^>]*)>/gi,
          (match, pre, href, post) =>
            `<link ${pre}href="${rewriteUrl(href, baseUrl)}"${post}>`)
        .replace(/<script\s+([^>]*?)src="([^"]+)"([^>]*)>/gi,
          (match, pre, src, post) =>
            `<script ${pre}src="${rewriteUrl(src, baseUrl)}"${post}>`)
        .replace(/<img\s+([^>]*?)src="([^"]+)"([^>]*)>/gi,
          (match, pre, src, post) =>
            `<img ${pre}src="${rewriteUrl(src, baseUrl)}"${post}>`)
        .replace(/<iframe\s+([^>]*?)src="([^"]+)"([^>]*)>/gi,
          (match, pre, src, post) =>
            `<iframe ${pre}src="${rewriteUrl(src, baseUrl)}"${post}>`)
        .replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "");

      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("X-Frame-Options", "ALLOWALL");
      res.send(html);

    } else if (contentType.includes("text/css")) {
      // Handle CSS: Rewrite url(...) references
      let css = await response.text();

      function rewriteCssUrl(match, urlPath) {
        urlPath = urlPath.replace(/^['"]|['"]$/g, ""); // Remove quotes
        if (urlPath.startsWith("data:") || urlPath.startsWith("/api/proxy?url=")) return match;
        let abs;
        try {
          if (/^https?:\/\//i.test(urlPath)) {
            abs = urlPath;
          } else if (urlPath.startsWith("//")) {
            abs = "http:" + urlPath;
          } else {
            abs = new URL(urlPath, url).href;
          }
          return `url("/api/proxy?url=${encodeURIComponent(abs)}")`;
        } catch {
          return match;
        }
      }

      css = css.replace(/url\(([^)]+)\)/gi, rewriteCssUrl);
      res.set("Content-Type", contentType);
      res.send(css);

    } else {
      // Handle all other resources (JS, images, fonts, etc.)
      res.set("Content-Type", contentType);
      response.body.pipe(res); // Pipe the raw response directly
    }

  } catch (e) {
    console.error("Proxy error:", e.message);
    res.status(500).send("Failed to fetch URL");
  }
});

const port = process.env.PORT || 8080;
const host = "0.0.0.0";

app.listen(port, host, () => {
  console.log(`LxDream server listening on ${host}:${port}`);
});