import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 font-sans">
      <header className="py-4 px-6 sm:px-8 sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <svg width={40} height={40} className="text-indigo-600">
              <path d="M12 3l8.96 5.88c.09.06.18.1.27.14l2.86 2.19a.75.75 0 0 0 .18.06l1.94-1.56c.16-.1.23-.25.23-.43v-3.77c0-.14-.07-.28-.2-.39L16.71 8.32a.75.75 0 0 0-1.12-.1l-1.67 5.5a1.125 1.125 0 0 1-.66.23l-2.16-1.35a.75.75 0 0 0-.18-.06L7.7 11.63a.75.75 0 0 0 .05-1.38l1.95-1.56c.07-.1.14-.25.22-.39M9.87 16.83a5.5 5.5 0 1 1 3.5-4.31 5.5 5.5 0 0 1-3.5 4.31ZM12 8v8l3.18 1.7a.5.5 0 0 0 .33-.15l-1.5-3.5L15 6l2.66 1.8a.5.5 0 0 0 .32-.33l-1.5-3.5L18 4.5l1.11 3.38a.5.5 0 0 0 .33-.15l3.38-1.5Z" fill="currentColor"/>
            </svg>
            TravelCo
          </a>
          <nav className="hidden sm:flex items-center gap-8">
            <a href="/destinations" className="text-gray-600 hover:text-indigo-600 transition-colors">Destinations</a>
            <a href="/packages" className="text-gray-600 hover:text-indigo-600 transition-colors">Packages</a>
            <a href="/about" className="text-gray-600 hover:text-indigo-600 transition-colors">About</a>
            <a href="/contact" className="text-gray-600 hover:text-indigo-600 transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-indigo-800 mb-6">
            Discover
            <span className="text-indigo-600">Extraordinary</span>
            Destinations
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            Experience luxury travel to the world's most breathtaking destinations.
            From pristine beaches to cultural heritage sites, we craft unforgettable journeys.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-8 border-t border-gray-100 mt-12">
            <a
              href="/packages"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse Packages
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
              className="inline-flex items-center gap-2 rounded-full border indigo-600 px-8 py-3 text-indigo-600 font-medium hover:bg-indigo-600 hover:text-white transition-colors"
            >
              Plan Your Trip
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <div className="group rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer">
            <img
              src="/images/beach-dest.jpg"
              alt="Bali tropical beach"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-indigo-800 mb-2">Bali, Indonesia</h3>
              <p className="text-gray-500 text-sm">Tropical paradise with culture</p>
            </div>
          </div>
          <div className="group rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer">
            <img
              src="/images/mountain-dest.jpg"
              alt="Swiss Alps"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-indigo-800 mb-2">Swiss Alps</h3>
              <p className="text-gray-500 text-sm">Majestic mountain experiences</p>
            </div>
          </div>
          <div className="group rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer">
            <img
              src="/images/city-dest.jpg"
              alt="Tokyo cityscape"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-indigo-800 mb-2">Tokyo, Japan</h3>
              <p className="text-gray-500 text-sm">Urban exploration awaits</p>
            </div>
          </div>
        </div>
      </main>

      <section className="py-16 px-6 bg-indigo-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-indigo-800 mb-8 text-center">
            Why Choose TravelCo?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h4l11 12H13" /></svg>
              </div>
              <h3 className="text-xl font-medium text-indigo-800 mb-2">Expert Guides</h3>
              <p className="text-gray-500 leading-relaxed">Our certified local guides provide insider knowledge and authentic experiences.</p>
            </div>
            <div className="rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M21 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" /></svg>
              </div>
              <h3 className="text-xl font-medium text-indigo-800 mb-2">Luxury Service</h3>
              <p className="text-gray-500 leading-relaxed">From private transfers to exclusive accommodations, we handle every detail.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <a href="#" className="flex items-center gap-2 text-indigo-200 hover:text-indigo-300 transition-colors">
                <svg width={32} height={32} className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="3" height="3" x="9" y="9" /><rect width="3" height="3" x="9" y="15" /><rect width="3" height="3" x="15" y="9" /><rect width="3" height="3" x="15" y="15" /></svg>
                TravelCo
              </a>
              <p className="text-gray-400 text-sm mt-2">Creating unforgettable travel experiences since 2026.</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Destinations</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><a href="#" className="hover:text-indigo-300 transition-colors">Bali</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition-colors">Maldives</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition-colors">Tokyo</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition-colors">Santorini</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><a href="/about" className="hover:text-indigo-300 transition-colors">About Us</a></li>
                <li><a href="/packages" className="hover:text-indigo-300 transition-colors">Packages</a></li>
                <li><a href="/destinations" className="hover:text-indigo-300 transition-colors">Destinations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><a href="/contact" className="hover:text-indigo-300 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center pt-8"><p className="text-gray-400 text-sm">2026 TravelCo. All rights reserved.</p><div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-indigo-300 transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-indigo-300 transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-indigo-300 transition-colors">Social</a>
          </div></div>
        </div>
      </footer>
    </div>
  );
}
