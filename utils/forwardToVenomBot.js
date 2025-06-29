import axios from "axios";

export default async function forwardToVenomBot(data) {
  const venomBotUrl = process.env.VENOM_BOT_URL;

  if (!venomBotUrl) {
    throw new Error("❌ VENOM_BOT_URL not configured");
  }

  await axios.post(`${venomBotUrl}/api/order`, data);
}
