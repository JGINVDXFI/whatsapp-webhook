// Limit body size (optional safety)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// Import the forwarding function
import forwardToVenomBot from "../utils/forwardToVenomBot.js";

// Serverless handler for POST requests
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const data = req.body;

    console.log("✅ JSON Received from MT4:", data);

    // Forward to WhatsApp bot or log
    await forwardToVenomBot(data);

    res.status(200).send("✅ Order forwarded to venom-bot server");
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).send("❌ Error: " + error.message);
  }
}
