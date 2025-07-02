// utils/forwardToVenomBot.js
import axios from "axios";

/**
 * Forwards MT4 trade data to your venom-bot server (e.g., on Render)
 * @param {Object} data - Trade data to send
 */
export default async function forwardToVenomBot(data) {
  const VENOM_SERVER_URL = process.env.VENOM_SERVER_URL || "http://localhost:3000/message";

  try {
    console.log("📤 Forwarding to venom-bot server:", VENOM_SERVER_URL);
    const response = await axios.post(VENOM_SERVER_URL, data);
    console.log("✅ Venom-bot responded with:", response.status);
  } catch (error) {
    console.error("❌ Failed to forward to venom-bot:", error.message);
    throw error;
  }
}
