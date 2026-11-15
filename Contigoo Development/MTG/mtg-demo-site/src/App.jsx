import "./index.css";
import { useState } from "react";

// Page components
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";

// Header/Navigation component
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav>
      <div className="logo">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="15" fill="var(--mtg-primary)" />
          <text
            x="50"
            y="55"
            text-anchor="middle"
            fill="var(--mtg-white)"
            font-family="var(--sans)"
            font-size="20"
            font-weight="bold"
          >
            MTG
          </text>
        </svg>
      </div>

      <ul className="nav-links">
        <li>
          <a href="#home" onClick={() => setIsMenuOpen(false)}>
            Home
          </a>
        </li>
        <li>
          <a href="#about" onClick={() => setIsMenuOpen(false)}>
            About
          </a>
        </li>
        <li>
          <a href="#services" onClick={() => setIsMenuOpen(false)}>
            Services
          </a>
        </li>
        <li>
          <a href="#contact" onClick={() => setIsMenuOpen(false)}>
            Contact
          </a>
        </li>
      </ul>

      <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <span />
        <span />
        <span />
      </div>
    </nav>
  );
};

// Main App component
function App() {
  return (
    <div>
      <main>
        <Header />

        <section id="home" className="hero">
          <div className="container">
            <h1>
              Magic: The Gathering
              <br />
              <span>Demo Website</span>
            </h1>
            <p>Explore the world of MTG through our professional showcase.</p>
            <div className="home-cta">
              <a href="#services" className="btn">
                Explore Services
              </a>
              <a href="#contact" className="btn-secondary">
                Get in Touch
              </a>
            </div>
          </div>
        </section>

        <HomePage />
        <AboutPage />
        <ServicesPage />
        <ContactPage />
      </main>

      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>MTG Demo</h3>
            <p>Professional Magic: The Gathering website showcase.</p>
          </div>
          <div className="footer-links">
            <h4>Pages</h4>
            <ul>
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#services">Services</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>Contact</h4>
            <ul>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 3l6 18" />
                  <path d="M2 12l6 18" />
                </svg>
                <span>info@mtg-demo.com</span>
              </li>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>(555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>2024 MTG Demo Website. All rights reserved.</p>
          <div className="footer-social">
            <a href="https://twitter.com" target="_blank" aria-label="Twitter">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.733 5.093l-3.028.792 1.047 3.988h5.916l-2.818 1.016 1.011-3.605h-5.858l-.27-1.195.987-3.69h5.865l.995-3.578-2.928.785h-5.878l.027-1.085-3.003.808Z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              aria-label="LinkedIn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.253 3.038l-1.826 2.86 2.17-3.067a5.946 5.946 0 0 0-1.129-2.426 5.927 5.927 0 0 0-2.531-.516 5.988 5.988 0 0 0-1.425.263 5.955 5.955 0 0 0-.371 1.827l.541 2.727a5.96 5.96 0 0 0 1.168 2.298 5.918 5.918 0 0 0 .338 1.863c0 1.028-.017 2.082-.05 3.147h1.018l2.147 3.105a5.991 5.991 0 0 1-.608 2.288 5.93 5.93 0 0 1-2.518.596 5.967 5.967 0 0 1-2.507-.551 5.934 5.934 0 0 1-1.468-2.326 5.977 5.977 0 0 1-.378-2.6zM6.87 18.897h5.858l-.256-1.005-3.037.806ZM5.308 17.2l3.049-.805L5.308 17.2zm14.063-2.055c.03-.068.045-.141.045-.216v-5.858c0-.075-.015-.148-.045-.216l3.027-1.029 1.038 3.988h-5.865l-.99-3.565-2.963.795Zm-4.977 2.347a7.014 7.014 0 0 1-1.397 2.568 7.018 7.018 0 0 1-2.569 1.403 7.026 7.026 0 0 1-1.404-2.57 7.011 7.011 0 0 1 2.57-1.405 7.013 7.013 0 0 1 1.398 2.572c.029.055.053.108.074.162Zm13.943-5.198h-5.858l.024-1.092-3.029.81ZM20.61 6.895a5.987 5.987 0 0 0-1.68-1.478 5.952 5.952 0 0 0-2.473-.607 5.971 5.971 0 0 0-1.398.286 5.923 5.923 0 0 0-.525 2.088l.534 2.696a5.961 5.961 0 0 1-1.177 2.308 5.924 5.924 0 0 1-2.542.573 5.946 5.946 0 0 1-2.529-.607 5.989 5.989 0 0 0-1.427 2.332 5.951 5.951 0 0 0 .394 2.094l.544 2.748a5.927 5.927 0 0 1 .539 2.128 5.943 5.943 0 0 1 2.552.607 5.981 5.981 0 0 1 2.529-.585 5.965 5.965 0 0 1 1.442-2.357 5.951 5.951 0 0 0-.406-2.1z" />
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              aria-label="Facebook"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M13 3v3h5v18h-5v-18h-3v-3h5v-3h-3zM5 14h2v3H5v-3zm4 0h2v3h-2v-3zm4 0h2v3H9v-3zm4 0h2v3h-2v-3z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
