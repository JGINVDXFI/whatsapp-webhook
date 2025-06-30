import axios from "axios";

export default async function forwardToVenomBot(data) {
  const venomBotUrl = process.env.VENOM_BOT_URL;

  if (!venomBotUrl) {
    throw new Error("❌ VENOM_BOT_URL not configured in .env");
  }

  // Forward the trade data to your venom-bot backend
  await axios.post(`${venomBotUrl}/api/order`, data);
}
