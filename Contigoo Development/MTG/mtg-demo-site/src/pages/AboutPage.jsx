import "../index.css";

const AboutPage = () => {
  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <h2>About MTG</h2>
            <p>
              Magic: The Gathering, created by Richard Garfield and first
              published in 1993 by Wizards of the Coast, is the world's trading
              card game. With over 20 billion cards sold worldwide, MTG
              continues to captivate millions of players across the globe.
            </p>
            <p>
              Our website showcases the beauty and complexity of MTG through
              professional design, interactive features, and a deep respect for
              the game's rich lore and competitive ecosystem.
            </p>
            <div className="about-stats">
              <div className="stat">
                <div className="stat-number">20B+</div>
                <div className="stat-label">Cards Sold Worldwide</div>
              </div>
              <div className="stat">
                <div className="stat-number">35M+</div>
                <div className="stat-label">Active Players</div>
              </div>
              <div className="stat">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Card Varieties</div>
              </div>
            </div>
          </div>
          <div className="about-image">
            <img src="/favicon.svg" alt="MTG Logo" className="about-logo" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPage;
