import { exec } from 'child_process';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Config from .env
const ngrokPort = process.env.NGROK_PORT || 3000;
const deployHookURL = process.env.RENDER_DEPLOY_HOOK;
const mq4Paths = process.env.MQ4_PATHS ? process.env.MQ4_PATHS.split(",") : [];

console.log("🚀 Starting ngrok...");
exec(`npx ngrok http ${ngrokPort} --log=stdout`, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Ngrok error: ${error.message}`);
    return;
  }
  console.log("Ngrok started...");
});

// Wait for tunnel to open and fetch public URL
setTimeout(async () => {
  try {
    const res = await axios.get(process.env.NGROK_API);
    const publicURL = res.data.tunnels[0].public_url;
    console.log("✅ Ngrok Public URL: ", publicURL);

    // 1️⃣ Update include/webhook_url.mqh
    const webhookFile = 'include/webhook_url.mqh';
    const webhookContent = `#define NodeWebhookURL "${publicURL}"\n`;
    fs.writeFileSync(webhookFile, webhookContent);
    console.log(`✅ Webhook URL updated in: ${webhookFile}`);

    // 2️⃣ Update all MQ4 Include files
    mq4Paths.forEach(filePath => {
      const content = `#property strict\nstring webhook_url = "${publicURL}/api/order";\n`;
      fs.writeFileSync(filePath.trim(), content);
      console.log(`✅ Webhook URL updated in: ${filePath.trim()}`);
    });

    // 3️⃣ Trigger Render Deploy Hook
    if (deployHookURL) {
      await axios.post(deployHookURL);
      console.log("✅ Render Deploy Triggered");
    } else {
      console.log("⚠️ RENDER_DEPLOY_HOOK not set in .env");
    }

    // 4️⃣ Start Venom Bot
    console.log("🚀 Starting Venom Bot...");
    exec('npm run start', (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ Venom Bot error: ${err.message}`);
        return;
      }
      console.log(stdout);
    });

  } catch (err) {
    console.error("❌ Error fetching Ngrok or triggering deploy: ", err.message);
  }
}, 5000);
