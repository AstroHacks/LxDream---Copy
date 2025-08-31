import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for stream handling
  }
};

export default async function handler(req, res) {
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
      return res.status(response.status).send(`Failed to fetch ${url}`);
    }

    if (contentType.includes("text/html")) {
      let html = await response.text();

      const baseUrl = url;
      function rewriteUrl(resourceUrl) {
        try {
          if (resourceUrl.startsWith("/api/proxy?url=")) return resourceUrl;
          if (/^https?:\/\//i.test(resourceUrl)) return `/api/proxy?url=${encodeURIComponent(resourceUrl)}`;
          if (resourceUrl.startsWith("//")) return `/api/proxy?url=${encodeURIComponent("http:" + resourceUrl)}`;
          return `/api/proxy?url=${encodeURIComponent(new URL(resourceUrl, baseUrl).href)}`;
        } catch {
          return resourceUrl;
        }
      }

      html = html
        .replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*)>/gi,
          (match, pre, href, post) =>
            `<a ${pre}href="${rewriteUrl(href)}"${post}>`)
        .replace(/<link\s+([^>]*?)href="([^"]+)"([^>]*)>/gi,
          (match, pre, href, post) =>
            `<link ${pre}href="${rewriteUrl(href)}"${post}>`)
        .replace(/<script\s+([^>]*?)src="([^"]+)"([^>]*)>/gi,
          (match, pre, src, post) =>
            `<script ${pre}src="${rewriteUrl(src)}"${post}>`)
        .replace(/<img\s+([^>]*?)src="([^"]+)"([^>]*)>/gi,
          (match, pre, src, post) =>
            `<img ${pre}src="${rewriteUrl(src)}"${post}>`)
        .replace(/<iframe\s+([^>]*?)src="([^"]+)"([^>]*)>/gi,
          (match, pre, src, post) =>
            `<iframe ${pre}src="${rewriteUrl(src)}"${post}>`)
        .replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "");

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Frame-Options", "ALLOWALL");
      return res.send(html);

    } else if (contentType.includes("text/css")) {
      let css = await response.text();
      css = css.replace(/url\(([^)]+)\)/gi, (match, urlPath) => {
        urlPath = urlPath.replace(/^['"]|['"]$/g, "");
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
      });
      res.setHeader("Content-Type", contentType);
      return res.send(css);
    } else {
      res.setHeader("Content-Type", contentType);
      return response.body.pipe(res);
    }

  } catch (e) {
    res.status(500).send("Proxy error");
  }
}
