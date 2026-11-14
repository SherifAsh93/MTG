import Image from "next/image";
import Link from "next/link";

export default function Packages() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            Travel Packages
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Explore our curated travel packages to breathtaking destinations.
            From romantic getaways to adventure expeditions, find your perfect journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 hover:shadow-xl transition-shadow cursor-pointer">
            <Link
              href="/packages/bali-tour"
              className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors mb-6 self-center"
            >
              <svg
                className="h-6 w-6 text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h4l11 12H13" />
              </svg>
            </Link>
            <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
              Bali, Indonesia
            </h3>
            <p className="text-foreground text-muted leading-relaxed text-center">
              Tropical paradise with cultural experiences and beach relaxation.
            </p>
            <a
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Book Now
            </a>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 hover:shadow-xl transition-shadow cursor-pointer">
            <Link
              href="/packages/swiss-alps"
              className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors mb-6 self-center"
            >
              <svg
                className="h-6 w-6 text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M21 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
              </svg>
            </Link>
            <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
              Swiss Alps
            </h3>
            <p className="text-foreground text-muted leading-relaxed text-center">
              Majestic mountain adventures and ski experiences.
            </p>
            <a
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Book Now
            </a>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 hover:shadow-xl transition-shadow cursor-pointer">
            <Link
              href="/packages/tokyo-experience"
              className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors mb-6 self-center"
            >
              <svg
                className="h-6 w-6 text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </Link>
            <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
              Tokyo, Japan
            </h3>
            <p className="text-foreground text-muted leading-relaxed text-center">
              Urban exploration and cultural immersion in the capital.
            </p>
            <a
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Book Now
            </a>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-muted/30">
          <h2 className="text-3xl font-bold text-foreground text-center mb-6">
            Start Your Journey
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Request Quote
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
              href="mailto:info@travelco.com"
              className="inline-flex items-center gap-2 rounded-full border border-indigo-600 px-8 py-3 text-indigo-600 font-medium hover:bg-indigo-600 hover:text-white transition-colors"
            >
              Email Us
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M9 10h6" />
                <path d="M12 15l3 3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}