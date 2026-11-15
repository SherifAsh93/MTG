import "../index.css";

const HomePage = () => {
  return (
    <section id="home" className="home-section">
      <div className="container">
        <div className="home-content">
          <div className="home-image">
            <svg
              width="400"
              height="300"
              viewBox="0 0 400 300"
              fill="var(--mtg-accent)"
              className="decorative-shape"
            >
              <path
                d="M200 50 C150 100, 250 150, 300 120 C350 80, 200 50, 200 50 Z"
                opacity="0.3"
              />
            </svg>
            <img
              src="/src/assets/hero.png"
              alt="MTG Hero Image"
              className="hero-image"
            />
          </div>
          <div className="home-text">
            <h2>Welcome to the MTG Universe</h2>
            <p>
              Explore the world of Magic: The Gathering through our professional
              demo website. Discover card collections, learn about game
              mechanics, and connect with the MTG community.
            </p>
            <div className="home-cta">
              <a href="#services" className="btn">
                Explore Our Services
              </a>
              <a href="#contact" className="btn-secondary">
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
