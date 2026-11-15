import "../index.css";

const ServicesPage = () => {
  return (
    <section id="services" className="services-section">
      <div className="container">
        <div className="section-title">
          <h2>Our Services</h2>
          <p>
            We provide professional MTG-related services for players and
            collectors alike.
          </p>
        </div>
        <div className="service-grid">
          <div className="service-card">
            <h3>Card Collection</h3>
            <p>
              Professional organization and valuation of MTG card collections
              for players and collectors.
            </p>
          </div>
          <div className="service-card">
            <h3>Tournament Support</h3>
            <p>
              Event organization, rules consultation, and tournament management
              for local game stores.
            </p>
          </div>
          <div className="service-card">
            <h3>Custom Design</h3>
            <p>
              Custom card design, artwork commission, and personalized MTG
              merchandise creation.
            </p>
          </div>
          <div className="service-card">
            <h3>Community Building</h3>
            <p>
              Community management, event promotion, and engagement strategies
              for MTG groups and stores.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesPage;
