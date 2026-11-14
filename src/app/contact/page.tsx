"use client";

import Image from "next/image";

export default function Contact() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-indigo-800 mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Start planning your dream journey with us. Fill out the form and our
            travel specialists will get back to you within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
              Visit Us
            </h2>
            <p className="text-gray-500">
              TravelCo Headquarters
            </p>
            <p className="text-gray-500 mt-2">
              Dubai, UAE
            </p>
            <p className="text-gray-500 mt-2">
              +971 50 123 4567
            </p>
            <p className="text-gray-500 mt-2">
              info@travelco.com
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
              Send Us a Message
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  className="w-full rounded-xl px-4 py-3 border border-gray-300 focus outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-xl px-4 py-3 border border-gray-300 focus outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">Message</label>
                <textarea
                  name="message"
                  rows={4}
                  required
                  className="w-full rounded-xl px-4 py-3 border border-gray-300 focus outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Tell us about your dream trip..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-muted/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
            <div>
              <span>2026 TravelCo. All rights reserved.</span>
            </div>
            <div>
              <a href="/about" className="hover:text-indigo-300 transition-colors">
                Privacy Policy
              </a>
              <a
                href="/packages"
                className="hover:text-indigo-300 transition-colors"
              >
                Packages
              </a>
              <a href="/contact" className="hover:text-indigo-300 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}