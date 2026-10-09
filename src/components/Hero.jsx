import React from "react";

export default function Hero() {
  return (
    <section className="hero-block" id="home">
      <div className="rajasthan-eyebrow">
        <span className="eyebrow-flourish">✤</span>
        <span>Pādhāro Māre Des</span>
        <span className="eyebrow-flourish">✤</span>
      </div>

      <div className="hero-title-graphic-container">
        <img
          src="/vaani_title.png"
          alt="Vaani — Speech, Understood"
          className="hero-title-img"
        />
      </div>

      <p className="hero-tagline">
        Speak naturally. See the words. Hear the translation.
      </p>
    </section>
  );
}
