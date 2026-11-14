import Image from "next/image";
import Link from "next/link";

export default function Services() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            Our Services
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            MTG provides comprehensive services tailored to meet the unique
            needs of each client. Our expert team delivers results that drive
            growth and create sustainable value.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 hover:shadow-xl transition-shadow cursor-pointer">
            <Link
              href="/services/strategic-consulting"
              className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors mb-6 self-center"
            >
              <svg
                className="h-6 w-6 text-primary"
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
              Strategic Consulting
            </h3>
            <p className="text-foreground text-muted leading-relaxed text-center">
              Expert guidance to help you navigate complex challenges and
              identify opportunities for growth and improvement.
            </p>
            <a
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-hover transition-colors"
            >
              Get in Touch
            </a>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 hover:shadow-xl transition-shadow cursor-pointer">
            <Link
              href="/services/project-management"
              className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors mb-6 self-center"
            >
              <svg
                className="h-6 w-6 text-success"
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
              Project Management
            </h3>
            <p className="text-foreground text-muted leading-relaxed text-center">
              End-to-end project oversight ensuring timelines, budgets, and
              quality standards are met consistently.
            </p>
            <a
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-medium text-success hover:bg-success-hover transition-colors"
            >
              Get in Touch
            </a>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 hover:shadow-xl transition-shadow cursor-pointer">
            <Link
              href="/services/delivery-implementation"
              className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors mb-6 self-center"
            >
              <svg
                className="h-6 w-6 text-accent"
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
              Delivery & Implementation
            </h3>
            <p className="text-foreground text-muted leading-relaxed text-center">
              Seamless execution of strategies and solutions from concept to
              completion with measurable results.
            </p>
            <a
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent-hover transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-muted/30">
          <h2 className="text-3xl font-bold text-foreground text-center mb-6">
            Ready to Start Your Project?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-white font-medium hover:bg-primary-hover transition-colors"
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
            <a
              href="mailto:info@mtg.com"
              className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 text-primary font-medium hover:bg-primary hover-text-white transition-colors"
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