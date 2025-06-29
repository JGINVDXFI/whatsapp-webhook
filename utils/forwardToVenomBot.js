import axios from "axios";

export default async function forwardToVenomBot(data) {
  const venomBotUrl = process.env.VENOM_BOT_URL;

  if (!venomBotUrl) {
    throw new Error("❌ VENOM_BOT_URL not configured in environment variables");
  }

  try {
    const response = await axios.post(`${venomBotUrl}/api/order`, data);
    console.log("✅ Forwarded to venom-bot:", response.data || "No response body");
  } catch (error) {
    console.error("❌ Error sending to venom-bot:", error.message);
    throw error;
  }
}
