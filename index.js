import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import venom from "venom-bot";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Globals
let venomClient = null;
let currentWebhookURL = "";
const sentTickets = new Set();

// ✅ Logging
const log = (msg) =>
  console.log(`[${new Date().toLocaleString("en-IN")}] ${msg}`);

// ✅ Admin Mapping
const sheetAdmins = {
  Grid: ["919814953007", "917009522677", "919417270987", "919878998780"],
  Economy: ["919501649616", "918725998919", "7973741924"],
  PriceAction: ["917009522677"],
  AllIndicators: ["918728067795"],
  "Support & Resistence": ["919417270987"],
  Martangle: ["919878998780"],
  AllButtons: ["919814953007", "917009522677"],
  TwoPair: ["917009522677", "918728067795"],
};

// ✅ Save fixed webhook URL to include/webhook_url.mqh
function saveWebhookDefineToMQH() {
  try {
    const mqhPath = path.join(__dirname, "include", "webhook_url.mqh");
    const fixedURL = "https://whatsapp-webhook-eta-lilac.vercel.app/api/order";
    const defineLine = `#define NODE_WEBHOOK_URL   "${fixedURL}"\n`;

    fs.mkdirSync(path.dirname(mqhPath), { recursive: true });
    fs.writeFileSync(mqhPath, defineLine);

    log("📝 webhook_url.mqh updated at: " + mqhPath);
  } catch (err) {
    log("❌ Failed to write webhook_url.mqh: " + err.message);
  }
}

// ✅ Update webhook_url.mqh and webhook_url.txt
async function updateAllWebhookFiles() {
  try {
    const { NGROK_API, MQ4_PATHS } = process.env;
    if (!NGROK_API || !MQ4_PATHS) throw new Error("Env not set");

    const { data } = await axios.get(NGROK_API);
    const httpsTunnel = data.tunnels.find((t) => t.proto === "https");
    if (!httpsTunnel) throw new Error("No HTTPS tunnel");

    const newUrl = httpsTunnel.public_url;
    if (currentWebhookURL === newUrl) return;

    for (let mq4Path of MQ4_PATHS.split(",")) {
      mq4Path = mq4Path.trim();
      if (!mq4Path) continue;

      const defineLine = `#define WEBHOOK_URL "${newUrl}"\n`;
      fs.writeFileSync(mq4Path, defineLine);
      log(`✅ Updated webhook_url.mqh: ${mq4Path}`);

      const txtPath = path.join(path.dirname(mq4Path), "..", "Files", "webhook_url.txt");
      fs.mkdirSync(path.dirname(txtPath), { recursive: true });
      fs.writeFileSync(txtPath, newUrl);
      log(`📁 Updated webhook_url.txt: ${txtPath}`);
    }

    currentWebhookURL = newUrl;
    log(`🚀 Webhook updated to: ${newUrl}`);
  } catch (err) {
    log("❌ Webhook update failed: " + err.message);
  }
}

// ✅ WhatsApp Sender
async function sendWhatsAppMessage(numbers, message) {
  if (!venomClient) return log("❌ Venom not ready");

  for (const number of numbers) {
    const chatId = `${number}@c.us`;
    try {
      await venomClient.sendText(chatId, message);
      log(`✅ Sent to ${number}`);
    } catch (err) {
      log(`❌ Failed for ${number}: ${err.message}`);
    }
  }
}

// ✅ Venom Bot Setup (skip in production)
function startVenom() {
  if (process.env.NODE_ENV === "production") {
    log("⚠️ Venom Bot is disabled in production.");
    return;
  }

  venom
    .create({
      session: "whatsapp-bot",
      headless: false,
      useChrome: true,
      browserPath:
        process.env.CHROME_PATH ||
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      puppeteerOptions: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    })
    .then((client) => {
      venomClient = client;
      log("✅ Venom connected");

      client.onMessage((message) => {
        if (message.body.toLowerCase() === "hi") {
          client.sendText(message.from, "👋 Hello from Venom Bot!");
        }
      });
    })
    .catch((err) => {
      log("❌ Venom init failed: " + err.message);
      setTimeout(startVenom, 10000); // Retry
    });
}

// ✅ Health Routes
app.get("/", (req, res) => res.send("🟢 Node WhatsApp API is up!"));
app.get("/test", (req, res) => res.send("✅ API working fine!"));
app.get("/current-url", (req, res) =>
  currentWebhookURL
    ? res.send(currentWebhookURL)
    : res.status(404).send("Webhook URL not available")
);

// ✅ Main MT4 Order POST Handler
app.post("/api/order", async (req, res) => {
  log("✅ POST /api/order hit");
  const data = req.body;
  log("Data: " + JSON.stringify(data));

  if (!data.sheet) return res.status(400).send("❌ Missing sheet name");

  const adminNumbers = sheetAdmins[data.sheet];
  if (!adminNumbers) return res.status(404).send(`⚠️ No admin for ${data.sheet}`);

  const ticketKey = `${data.sheet}-${data.ticket}-${data.status}`;
  if (sentTickets.has(ticketKey)) {
    log(`🟡 Duplicate ignored: ${ticketKey}`);
    return res.send("🟡 Duplicate message");
  }

  const now = new Date();
  const dateTime = now.toLocaleString("en-GB", { timeZone: "Asia/Kolkata" });

  let message = "";
  if (data.status === "OPEN") {
    message = `📥 *NEW TRADE OPENED (${data.sheet})*\n\n📈 *Symbol:* ${data.symbol}\n📊 *Type:* ${
      data.type == 0 ? "BUY" : "SELL"
    }\n📥 *Lots:* ${data.lots}\n💰 *Open Price:* ${data.price}\n🕰️ *Opened At:* ${dateTime}`;
  } else if (data.status === "CLOSE") {
    const sign = data.profit >= 0 ? "+" : "";
    message = `📉 *TRADE CLOSED (${data.sheet})*\n\n📈 *Symbol:* ${data.symbol}\n📊 *Type:* ${
      data.type == 0 ? "BUY" : "SELL"
    }\n💰 *Profit/Loss:* ${sign}${data.profit} USD\n🕰️ *Closed At:* ${dateTime}`;
  } else {
    return res.send("⚠️ Unknown status");
  }

  await sendWhatsAppMessage(adminNumbers, message);
  sentTickets.add(ticketKey);

  fs.mkdirSync("logs", { recursive: true });
  fs.appendFileSync("logs/order_log.txt", `${dateTime} - ${message}\n`);

  res.send(`✅ Sent to ${adminNumbers.length} admins`);
});

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).send(`❌ Route not found: ${req.method} ${req.originalUrl}`);
});

// ✅ Auto Jobs
setInterval(() => {
  sentTickets.clear();
  log("♻️ Cleared ticket cache");
}, 12 * 60 * 60 * 1000);

setInterval(updateAllWebhookFiles, 15 * 60 * 1000);

// ✅ Init
updateAllWebhookFiles();
saveWebhookDefineToMQH();
startVenom();

// ✅ Start Express Server
app.listen(PORT, () => log(`🟢 API running at http://localhost:${PORT}`));

// ✅ Manual CLI test
if (process.argv.includes("--test-send")) {
  sendWhatsAppMessage(["919814953007"], "🧪 *Test message from Node API*");
}
