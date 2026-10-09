import React from "react";

export default function Navbar() {
  return (
    <header className="navbar">
      <a href="#" className="nav-pill-badge" title="Vaani — Speech Translation">
        <div className="nav-logo-circle">
          <img
            src="/vaani_emblem.png"
            alt="Vaani Crest"
            className="nav-logo-img"
            onError={(e) => (e.currentTarget.src = "/logo.png")}
          />
        </div>
        <span className="nav-brand-title">Vaani</span>
        <span className="nav-divider">|</span>
        <span className="nav-tagline">Speech, Understood</span>
      </a>

      <div className="nav-right-group">
        <a
          href="https://banasthali.org"
          target="_blank"
          rel="noreferrer"
          className="banasthali-header-badge"
          title="Banasthali Vidyapith"
        >
          <img
            src="/banasthali_logo.png"
            alt="Banasthali University"
            className="banasthali-header-img"
          />
        </a>
      </div>
    </header>
  );
}
