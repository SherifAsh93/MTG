import "../index.css";
import { useState } from "react";
import { submitContactForm } from "../services/contactService";

const ContactPage = () => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      await submitContactForm(formState);
      setStatus("success");
      setFormState({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      console.error("Contact form error:", err);
    }

    setTimeout(() => setStatus(null), 3000);
  };

  if (status === "success") {
    return (
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="contact-content">
            <div className="contact-info">
              <h2>Contact Us</h2>
              <p>
                Thank you for your message! We'll get back to you within 2
                business days.
              </p>
            </div>
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <p style={{ color: "var(--mtg-primary)", fontWeight: "500" }}>
                Message sent successfully!
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="contact-content">
          <div className="contact-info">
            <h2>Contact Us</h2>
            <p>
              Have questions about MTG or our services? Fill out the form below
              and we'll get back to you soon.
            </p>
            <div className="contact-details">
              <p>
                <strong>Email:</strong> info@mtg-demo.com
              </p>
              <p>
                <strong>Phone:</strong> (555) 123-4567
              </p>
              <p>
                <strong>Address:</strong> 123 Magic Lane, Seattle, WA 98101
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Your name"
                required
                {...formState}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="your@email.com"
                required
                {...formState}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Your message..."
                rows={4}
                required
                {...formState}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn">
              Send Message
            </button>
          </form>
          {status && status !== "success" && (
            <div
              style={{
                textAlign: "center",
                marginTop: "1rem",
                color: "var(--mtg-accent)",
                fontSize: "0.9rem",
              }}
            >
              <p>Sending message...</p>
            </div>
          )}
          {status === "error" && (
            <div
              style={{
                textAlign: "center",
                marginTop: "1rem",
                color: "var(--mtg-accent)",
                fontSize: "0.9rem",
              }}
            >
              <p>Failed to send message. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
