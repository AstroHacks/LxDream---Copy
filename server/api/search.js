import fetch from "node-fetch";

export default async function handler(req, res) {
  const q = req.query.q || "";
  if (!q) return res.json({ query: "", results: [] });

  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  try {
    const response = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await response.text();

    const results = [];
    const regex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html))) {
      results.push({
        title: match[2].replace(/<[^>]+>/g, ""),
        url: match[1],
        snippet: ""
      });
    }
    res.json({ query: q, results });
  } catch (e) {
    res.status(500).json({ error: "DuckDuckGo fetch failed" });
  }
}
