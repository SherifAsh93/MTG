import Image from "next/image";

export default function About() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-800 mb-4">
          About TravelCo
        </h1>
        <p className="text-gray-500">
          Since 2026, TravelCo has been creating unforgettable travel experiences for discerning travelers who seek authenticity and luxury. Our curated journeys combine local expertise with world-class service to create memories that last a lifetime.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
          <div>
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Our Mission</h2>
            <p className="text-gray-500 leading-relaxed">
              To provide exceptional travel experiences that combine adventure, comfort, and cultural immersion, while maintaining the highest standards of sustainability and responsible tourism.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Our Team</h2>
            <p className="text-gray-500 leading-relaxed">
              Our team of travel experts, local guides, and logistics specialists are passionate about creating exceptional journeys. With decades of combined experience, we know how to deliver the perfect trip.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}