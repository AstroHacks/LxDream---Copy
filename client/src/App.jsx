import React, { useState } from "react";
import AddressBar from "./components/AddressBar";
import TabBar from "./components/TabBar";
import BrowserViewport from "./components/BrowserViewport";
import logo from "./assets/logo.svg";

export default function App(){
  const [tabs, setTabs] = useState([
    { id: 1, title: "New Tab", url: "", history: [] }
  ]);
  const [activeId, setActiveId] = useState(1);

  const activeTab = tabs.find(t=>t.id===activeId);

  async function fetchTitle(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const match = html.match(/<title>(.*?)<\/title>/i);
      return match ? match[1] : url;
    } catch {
      return url;
    }
  }

  async function openUrl(url) {
    // Normalize the URL
    let final = url.trim();
    if (!/^https?:\/\//i.test(final) && final !== "about:blank") {
      final = "https://" + final;
    }
    // Route through the proxy
    const proxiedUrl = `/api/proxy?url=${encodeURIComponent(final)}`;
    const title = await fetchTitle(proxiedUrl);
    const newTabs = tabs.map(t =>
      t.id === activeId
        ? { ...t, url: proxiedUrl, history: [...t.history, proxiedUrl], title }
        : t
    );
    setTabs(newTabs);
  }

  function addTab() {
    const id = Date.now();
    setTabs([...tabs, { id, title: "New Tab", url: "about:blank", history: [] }]);
    setActiveId(id);
  }

  function closeTab(id){
    const idx = tabs.findIndex(t=>t.id===id);
    if(idx === -1) return;
    const next = tabs.filter(t=>t.id!==id);
    setTabs(next.length ? next : [{ id: Date.now(), title: "New Tab", url: "", history: [] }]);
    if(activeId === id){
      setActiveId(next.length ? next[Math.max(0, idx-1)].id : next[0].id);
    }
  }

  return (
    <div className="lx-app">
      <header className="lx-header">
        <div className="brand">
          <img src={logo} alt="LxDream logo" />
          <div className="brand-text">
            <div className="title">LxDream</div>
            <div className="subtitle">Luxury. Power.</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="ux-btn" onClick={addTab}>+ New Tab</button>
        </div>
      </header>

      <TabBar tabs={tabs} activeId={activeId} setActiveId={setActiveId} closeTab={closeTab} />

      <div className="addr-wrap">
        <AddressBar initialUrl={activeTab?.url || ""} onGo={(u)=>openUrl(u)} />
      </div>

      <main className="viewport">
        <BrowserViewport url={activeTab?.url} />
      </main>

      <footer className="lx-footer">
        <div>© LxDream — 2025 •</div>
      </footer>
    </div>
  );
}
