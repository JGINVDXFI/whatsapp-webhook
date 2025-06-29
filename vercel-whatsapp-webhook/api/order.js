 import forwardToVenomBot from "../utils/forwardToVenomBot";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const data = req.body;

  try {
    await forwardToVenomBot(data);
    res.status(200).send("✅ Order forwarded to venom-bot server");
  } catch (error) {
    console.error("❌ Error forwarding order:", error.message);
    res.status(500).send("❌ Error forwarding order: " + error.message);
  }
}
