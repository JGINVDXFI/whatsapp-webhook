import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const data = req.body;

  try {
    const venomBotUrl = process.env.VENOM_BOT_URL;

    if (!venomBotUrl) {
      return res.status(500).send("❌ VENOM_BOT_URL not configured");
    }

    await axios.post(`${venomBotUrl}/api/order`, data);

    res.status(200).send("✅ Order forwarded to venom-bot server");
  } catch (error) {
    res.status(500).send("❌ Error forwarding order: " + error.message);
  }
}
