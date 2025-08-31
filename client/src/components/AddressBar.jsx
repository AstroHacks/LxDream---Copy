import React, { useState, useEffect } from "react";

export default function AddressBar({ initialUrl="", onGo }){
  const [value, setValue] = useState(initialUrl);

  useEffect(()=> setValue(initialUrl), [initialUrl]);

  function submit(e){
    e.preventDefault();
    if(!value) return;
    // If single word, treat as search; otherwise open url
    if(!value.includes(".") && !value.startsWith("http")) {
      onGo(`https://duckduckgo.com/?q=${encodeURIComponent(value)}`);
    } else {
      onGo(value);
    }
  }

  return (
    <form className="address-bar" onSubmit={submit}>
      <input
        value={value}
        onChange={(e)=>setValue(e.target.value)}
        placeholder="Search or enter site (e.g. example.com)"
      />
      <button type="submit" className="go-btn">Go</button>
    </form>
  );
}
