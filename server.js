import express from "express";
import bodyParser from "body-parser";
import venom from "venom-bot";
import path from "path";
import { fileURLToPath } from "url";

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
app.use(bodyParser.json());

// Global variables
let clientGlobal = null;
let isReady = false;
let BOT_NUMBER = null;

// ✅ Start Venom Bot
venom
  .create({
    session: "my-session",
    multidevice: true,
    folderNameToken: "tokens",
    mkdirFolderToken: path.join(__dirname, "tokens"),
    headless: false,
  })
  .then((client) => {
    clientGlobal = client;
    isReady = true;
    console.log("✅ WhatsApp bot is ready");

    // Fetch bot number
    client.getHostDevice().then((info) => {
      console.log("📦 Full Host Device Info:", info);
      BOT_NUMBER = info?.wid?.user
        ? `${info.wid.user}@c.us`
        : "917888719300@c.us"; // fallback
      console.log(`🤖 Venom bot running as: +${BOT_NUMBER}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to init venom:", err);
  });

// 📡 Home Route (for health check)
app.get("/", (req, res) => {
  res.send("📡 WhatsApp Trade Alert HTTP Server is running");
});

// 📥 Webhook to receive trade alerts
app.post("/api/order", async (req, res) => {
  console.log("📥 New trade alert received");
  console.log("Raw Data:", req.body);

  const data = req.body;

  // Validation
  if (!data.symbol || !data.ticket || !data.status) {
    console.log("❌ Incomplete data received");
    return res.status(400).send({ status: "error", message: "Invalid or incomplete data" });
  }

  // Prepare message
  const message = `📊 *TRADE ALERT* 📊

📈 Symbol: ${data.symbol}
📑 Type: ${data.type == 0 ? "BUY" : "SELL"}
📦 Lot: ${data.lots}
💵 Price: ${data.price}
🕒 Time: ${data.time || "N/A"}
🎫 Ticket: ${data.ticket}
📌 Status: ${data.status}`;

  if (isReady && clientGlobal) {
    const adminNumbers = [
      "919814953007@c.us"
    ];
    const userNumbers = [
      "918728067795@c.us",
      "917009522677@c.us"
    ];

    const allRecipients = [...adminNumbers, ...userNumbers];

    for (const number of allRecipients) {
      if (number === BOT_NUMBER) continue;

      console.log(`👉 Sending to: ${number}`);
      try {
        await clientGlobal.sendText(number, message);
        console.log(`✅ Sent to: ${number}`);
      } catch (err) {
        console.error(`❌ Failed to send to ${number}:`, err);
      }
    }
  } else {
    console.log("⚠️ Bot not ready");
  }

  res.send({ status: "ok", received: data });
});

// ✅ Start HTTP Server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
