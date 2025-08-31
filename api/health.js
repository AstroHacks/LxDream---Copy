export default function handler(req, res) {
  res.json({ status: "ok", name: "LxDream backend", timestamp: Date.now() });
}
