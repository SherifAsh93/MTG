import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background font-sans min-h-screen">
      <header className="flex flex-col sm:flex-row items-center justify-between w-full max-w-7xl px-4 py-6">
        <div className="flex items-center gap-3">
          <svg width={120} height={40} className="dark:invert">
            <rect width="120" height="40" rx="8" fill="var(--primary)" />
            <text
              x="60"
              y="30"
              fill="var(--foreground)"
              fontFamily="Arial, sans-serif"
              fontSize="24"
              fontWeight="bold"
              textAnchor="middle"
            >
              MTG
            </text>
          </svg>
        </div>

        <nav className="hidden sm:flex items-center gap-8">
          <a
            href="/about"
            className="text-foreground hover:text-primary transition-colors"
          >
            About
          </a>
          <a
            href="/services"
            className="text-foreground hover:text-primary transition-colors"
          >
            Services
          </a>
          <a
            href="/contact"
            className="text-foreground hover:text-primary transition-colors"
          >
            Contact
          </a>
        </nav>
      </header>

      <main className="flex flex-1 w-full max-w-5xl flex flex-col items-center justify-center py-24 px-6">
        <div className="text-center w-full">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6">
            MTG — <span className="text-accent">Innovative</span> Solutions
          </h1>
          <p className="text-lg sm:text-xl text-muted mb-12 max-w-2xl">
            Comprehensive consulting and services focused on delivering
            excellence in every project, specializing in digital transformation,
            strategic planning, and operational excellence for organizations
            worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-8 border-t border-muted/30 mt-12">
            <a
              href="/services"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-white font-medium hover:bg-primary-hover transition-colors"
            >
              View Our Services
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 text-primary font-medium hover:bg-primary hover-text-white transition-colors"
            >
              Contact Us
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </main>

      <section className="py-24 px-6 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">About MTG</h2>
          <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            MTG is a leading provider of innovative solutions in the digital
            transformation sector. With years of experience and a commitment to
            excellence, we deliver projects that exceed expectations and create
            lasting value for our clients.
          </p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Our Services
            </h3>
            <ul className="space-y-3 text-left text-foreground">
              <li className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-primary flex-shrink-0 mt-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h4l11 12H13" />
                </svg>
                Strategic Consulting
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-primary flex-shrink-0 mt-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h4l11 12H13" />
                </svg>
                Project Management
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-primary flex-shrink-0 mt-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h4l11 12H13" />
                </svg>
                Delivery & Implementation
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Why Choose MTG?
            </h3>
            <ul className="space-y-3 text-left text-foreground">
              <li className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-success flex-shrink-0 mt-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M21 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
                </svg>
                Expertise
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-success flex-shrink-0 mt-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M21 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
                </svg>
                Quality Focus
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-success flex-shrink-0 mt-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M21 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
                </svg>
                Client Success
              </li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width={80} height={32} className="dark:invert">
              <rect width="80" height="32" rx="4" fill="var(--primary)" />
              <text
                x="40"
                y="24"
                fill="var(--foreground)"
                fontFamily="Arial, sans-serif"
                fontSize="16"
                fontWeight="bold"
                textAnchor="middle"
              >
                MTG
              </text>
            </svg>
            <span className="text-muted text-sm">
              2026 MTG. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="/about" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a
              href="/services"
              className="hover:text-primary transition-colors"
            >
              Terms of Service
            </a>
            <a href="/contact" className="hover:text-primary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
