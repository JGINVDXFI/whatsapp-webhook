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

let venomClient = null;
const sentTickets = new Set();
let currentWebhookURL = "";

const log = (msg) => console.log(`[${new Date().toLocaleString()}] ${msg}`);

// ✅ Sheet-to-Admin Mapping
const sheetAdmins = {
  "Grid": ["919814953007", "917009522677", "919417270987", "919878998780"],
  "Economy": ["919501649616", "918725998919", "7973741924"],
  "PriceAction": ["917009522677"],
  "AllIndicators": ["918728067795"],
  "Support & Resistence": ["919417270987"],
  "Martangle": ["919878998780"],
  "AllButtons": ["919814953007", "917009522677"],
  "TwoPair": ["917009522677", "918728067795"]
};

// ✅ Scan MetaTrader terminal directories and locate webhook_url.mqh
function findWebhookPaths(rootDir) {
  const mq4Paths = [];
  try {
    const terminals = fs.readdirSync(rootDir, { withFileTypes: true });
    terminals.forEach(dirent => {
      if (dirent.isDirectory()) {
        const includeFile = path.join(rootDir, dirent.name, "MQL4", "Include", "webhook_url.mqh");
        if (fs.existsSync(includeFile)) {
          mq4Paths.push(includeFile);
        }
      }
    });
  } catch (err) {
    log("❌ Terminal scan failed: " + err.message);
  }
  return mq4Paths;
}

// ✅ Update webhook_url.mqh and webhook_url.txt
async function updateAllWebhookFiles() {
  try {
    const NGROK_API = process.env.NGROK_API;
    if (!NGROK_API) throw new Error("❌ NGROK_API not set in .env");

    const res = await axios.get(NGROK_API);
    const httpsTunnel = res.data.tunnels.find(t => t.proto === "https");

    if (!httpsTunnel) throw new Error("No HTTPS ngrok tunnel found");

    const newUrl = httpsTunnel.public_url;
    if (currentWebhookURL === newUrl) return;

    const MQ4_PATHS = process.env.MQ4_PATHS;
    if (!MQ4_PATHS) throw new Error("❌ MQ4_PATHS not set in .env");

    const mq4Files = MQ4_PATHS.split(",");

    mq4Files.forEach(mq4Path => {
      mq4Path = mq4Path.trim();
      if (!mq4Path) return;

      const defineLine = `#define WEBHOOK_URL "${newUrl}"\n`;

      fs.writeFileSync(mq4Path, defineLine);
      log(`✅ Updated webhook_url.mqh: ${mq4Path}`);

      const txtPath = path.join(path.dirname(mq4Path), "..", "Files", "webhook_url.txt");
      fs.mkdirSync(path.dirname(txtPath), { recursive: true });
      fs.writeFileSync(txtPath, newUrl);
      log(`📁 Updated webhook_url.txt: ${txtPath}`);
    });

    currentWebhookURL = newUrl;
    log(`🚀 Webhook updated to: ${newUrl}`);
  } catch (err) {
    log("❌ Webhook update failed: " + err.message);
  }
}


// ✅ Send WhatsApp message
async function sendWhatsAppMessage(numbers, message) {
  if (!venomClient) {
    log("❌ Venom not ready");
    return;
  }

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

// ✅ Start Venom bot
function startVenom() {
  venom.create({
    session: "whatsapp-bot",
    headless: false,
    useChrome: true,
    executablePath: process.env.CHROME_PATH
  })
    .then(client => {
      venomClient = client;
      log("✅ Venom connected");
    })
    .catch(err => {
      log("❌ Venom init failed: " + err.message);
      setTimeout(startVenom, 10000);
    });
}
// ✅ Venom Health Check
app.get("/api/venom-status", (req, res) => {
  if (venomClient) {
    res.send("✅ Venom is connected");
  } else {
    res.status(503).send("❌ Venom is NOT connected");
  }
});

// ✅ Handle MT4 webhook
app.post("/api/order", async (req, res) => {
  const data = req.body;
  if (!data.sheet) return res.status(400).send("❌ Missing sheet name");

  const adminNumbers = sheetAdmins[data.sheet];
  if (!adminNumbers || adminNumbers.length === 0) {
    log(`⚠️ No admins for: ${data.sheet}`);
    return res.status(404).send(`⚠️ No admin for ${data.sheet}`);
  }

  const ticketKey = `${data.sheet}-${data.ticket}-${data.status}`;
  if (sentTickets.has(ticketKey)) {
    log(`🟡 Duplicate ignored: ${ticketKey}`);
    return res.send("🟡 Duplicate message");
  }

  const now = new Date();
  const dateTime = now.toLocaleString("en-GB", { timeZone: "Asia/Kolkata" });

  let message = "";
  if (data.status === "OPEN") {
    message = `📥 *NEW TRADE OPENED (${data.sheet})*\n\n📈 *Symbol:* ${data.symbol}\n📊 *Type:* ${data.type == 0 ? "BUY" : "SELL"}\n📥 *Lots:* ${data.lots}\n💰 *Open Price:* ${data.price}\n🕰️ *Opened At:* ${dateTime}`;
  } else if (data.status === "CLOSE") {
    const sign = data.profit >= 0 ? "+" : "";
    message = `📉 *TRADE CLOSED (${data.sheet})*\n\n📈 *Symbol:* ${data.symbol}\n📊 *Type:* ${data.type == 0 ? "BUY" : "SELL"}\n💰 *Profit/Loss:* ${sign}${data.profit} USD\n🕰️ *Closed At:* ${dateTime}`;
  } else {
    return res.send("⚠️ Unknown status");
  }

  await sendWhatsAppMessage(adminNumbers, message);
  sentTickets.add(ticketKey);
  fs.appendFileSync("logs/order_log.txt", `${dateTime} - ${message}\n`);
  return res.send(`✅ Sent to ${adminNumbers.length} admins`);
});

// ✅ Routes
app.get("/", (req, res) => res.send("🟢 Node WhatsApp API is up!"));
app.get("/test", (req, res) => res.send("✅ API working fine!"));
app.get("/current-url", (req, res) => {
  if (currentWebhookURL) {
    res.send(currentWebhookURL);
  } else {
    res.status(404).send("Webhook URL not available");
  }
});

// ✅ Scheduled Tasks
setInterval(() => {
  sentTickets.clear();
  log("♻️ Cleared ticket cache");
}, 12 * 60 * 60 * 1000);

setInterval(() => {
  updateAllWebhookFiles();
}, 15 * 60 * 1000);

// ✅ Start everything
updateAllWebhookFiles();
startVenom();
app.listen(PORT, () => {
  log(`🟢 API running at http://localhost:${PORT}`);
});

// ✅ CLI Test
if (process.argv.includes("--test-send")) {
  sendWhatsAppMessage(["919814953007"], "🧪 *Test message from Node API*");
}
