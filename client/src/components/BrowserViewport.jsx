import React from "react";

export default function BrowserViewport({ url }){
  const src = url ? (url.startsWith("http") ? `/api/proxy?url=${encodeURIComponent(url)}` : url) : "data:text/html,<h2 style='font-family:Inter;padding:24px;color:#cfc1ff'>Welcome to LxDream — your luxury preview browser.</h2>";
  return (
    <div className="viewport-inner">
      <iframe title="LxDream-viewport" src={src} sandbox="allow-forms allow-scripts allow-same-origin" />
    </div>
  );
}
