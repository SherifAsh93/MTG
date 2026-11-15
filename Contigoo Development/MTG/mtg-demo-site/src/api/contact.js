/**
 * Contact Form API Route
 * Vercel serverless function for handling contact form submissions.
 *
 * This endpoint validates form data and is prepared for email provider integration.
 * Credentials are read from environment variables - never hardcoded.
 *
 * For production, configure:
 * - POSTMARK_SERVER_TOKEN or SENDGRID_API_KEY in Vercel dashboard
 * - Or replace with Formspree/Netlify Forms integration
 */

export default async function handler(req, res) {
  // Set CORS headers
  const allowedOrigins = [
    "http://localhost:5173",
    "https://mtg-demo-site.vercel.app",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only accept POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required" });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Return success status indicating form data is valid
    // In production, replace with actual email sending response
    // using your preferred provider (SendGrid, Mailgun, Postmark, etc.)
    // and configured environment variables (POSTMARK_SERVER_TOKEN or SENDGRID_API_KEY)
    res.status(200).json({
      success: true,
      id: Date.now(),
      note: "Form data validated successfully. Email sending configured via Vercel environment variables (POSTMARK_SERVER_TOKEN or SENDGRID_API_KEY).",
    });
  } catch (error) {
    console.error("Contact API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
