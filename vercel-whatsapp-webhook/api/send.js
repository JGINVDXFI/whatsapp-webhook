export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const data = req.body;

    console.log("✅ JSON Received from MT4:", data);

    // koi processing ya forward ka code
    res.status(200).send("✅ Order forwarded to venom-bot server");
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).send("❌ Error: " + error.message);
  }
}
