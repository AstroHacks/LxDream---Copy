import React from "react";

export default function TabBar({ tabs, activeId, setActiveId, closeTab }){
  return (
    <div className="tabbar">
      {tabs.map(tab => (
        <div key={tab.id} className={"tab" + (tab.id===activeId ? " active" : "")} onClick={()=>setActiveId(tab.id)}>
          <div className="tab-title">{tab.title || "New Tab"}</div>
          <button className="tab-close" onClick={(e)=>{ e.stopPropagation(); closeTab(tab.id); }}>✕</button>
        </div>
      ))}
    </div>
  );
}
