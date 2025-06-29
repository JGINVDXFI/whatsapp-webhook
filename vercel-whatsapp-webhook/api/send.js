import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).send("❌ number and message are required");
  }

  try {
    const venomUrl = process.env.VENOM_BOT_URL;
    if (!venomUrl) {
      return res.status(500).send("❌ VENOM_BOT_URL not configured");
    }

    const result = await axios.post(`${venomUrl}/api/send`, {
      number,
      message,
    });

    res.status(200).json({ status: "✅ Message sent", data: result.data });
  } catch (error) {
    console.error("❌ Error sending message:", error.message);
    res.status(500).send("❌ Error sending message: " + error.message);
  }
}
