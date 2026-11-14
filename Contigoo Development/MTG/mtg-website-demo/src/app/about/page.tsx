import Image from "next/image";

export default function About() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          About MTG
        </h1>
        <p className="text-muted">
          MTG is a premier provider of innovative solutions in the digital transformation sector.
        </p>
      </div>
    </section>
  );
}