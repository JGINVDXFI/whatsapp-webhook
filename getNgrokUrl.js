import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

// .env config load
dotenv.config();

export async function updateWebhookUrl() {
  try {
    // Ngrok API endpoint from env
    const NGROK_API = process.env.NGROK_API;
    if (!NGROK_API) throw new Error("NGROK_API not set in .env");

    const response = await axios.get(NGROK_API);
    const httpsTunnel = response.data.tunnels.find(t => t.proto === "https");

    if (!httpsTunnel) throw new Error("No HTTPS tunnel found");

    const ngrokUrl = httpsTunnel.public_url;
    const newLine = `#define WEBHOOK_URL "${ngrokUrl}"`;

    // MQ4 paths from env, support multiple comma-separated paths
    const MQ4_PATHS = process.env.MQ4_PATHS;
    if (!MQ4_PATHS) throw new Error("MQ4_PATHS not set in .env");

    const mq4Files = MQ4_PATHS.split(",");

    mq4Files.forEach(mq4FilePath => {
      mq4FilePath = mq4FilePath.trim();
      if (!mq4FilePath) return;

      let lines = [];
      if (fs.existsSync(mq4FilePath)) {
        lines = fs.readFileSync(mq4FilePath, "utf-8").split("\n");
        const index = lines.findIndex(line => line.startsWith("#define WEBHOOK_URL"));
        if (index !== -1) lines[index] = newLine;
        else lines.push(newLine);
      } else {
        lines.push(newLine);
      }
      fs.writeFileSync(mq4FilePath, lines.join("\n"));
      console.log(`✅ webhook_url.mqh updated: ${mq4FilePath}`);
      
      // webhook_url.txt path banate hue
      const txtFilePath = mq4FilePath.replace("\\Include\\webhook_url.mqh", "\\Files\\webhook_url.txt");
      fs.writeFileSync(txtFilePath, ngrokUrl);
      console.log(`✅ webhook_url.txt created/updated: ${txtFilePath}`);
    });

    return ngrokUrl;

  } catch (err) {
    console.error("❌ Error updating webhook URL:", err.message);
    return "";
  }
}
