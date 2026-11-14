"use client";

import Image from "next/image";

export default function Contact() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            Contact MTG
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Have a project in mind? Get in touch with our team to discuss how we
            can help you achieve your goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Location
            </h2>
            <p className="text-foreground text-muted">
              MTG Headquarters Dubai, UAE
            </p>
            <p className="text-foreground text-muted mt-2">
              Phone: +971 50 123 4567
            </p>
            <p className="text-foreground text-muted mt-4">
              Email: info@mtg.com
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Get in Touch
            </h2>
            <div className="space-y-4">
              <p>
                Have a project in mind? Get in touch with our team to discuss
                how we can help you achieve your goals.
              </p>
              <button
                onClick={handleSendMessage}
                className="w-full rounded-full bg-primary px-6 py-3 text-white font-medium hover:bg-primary-hover transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-muted/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
            <div>
              <span>2026 MTG. All rights reserved.</span>
            </div>
            <div>
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
        </div>
      </div>
    </section>
  );
}

function handleSendMessage() {
  // Simulate form submission
  const button = document.querySelector('button[class*="bg-primary"]') as HTMLButtonElement;
  if (button) {
    const originalText = button.textContent;
    button.textContent = "Sending...";
    button.disabled = true;

    // Simulate API call
    setTimeout(() => {
      button.textContent = "Message Sent!";
      button.className = "w-full rounded-full bg-success px-6 py-3 text-white font-medium";
      alert("Thank you for contacting us! We will get back to you soon.");
      button.textContent = "Send Message";
      button.disabled = false;
      button.className = "w-full rounded-full bg-primary px-6 py-3 text-white font-medium hover:bg-primary-hover transition-colors";
    }, 1500);
  }
}