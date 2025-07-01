import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const apiUrl = process.env.NGROK_API;
const paths = process.env.MQ4_PATHS.split(",");

async function updateWebhookUrl() {
  try {
    const { data } = await axios.get(apiUrl);
    const publicUrl = data.tunnels[0]?.public_url;

    if (!publicUrl) {
      console.log("❌ Ngrok tunnel not available");
      return;
    }

    paths.forEach(filePath => {
      const content = `#property strict\nstring webhook_url = "${publicUrl}/api/order";\n`;
      fs.writeFileSync(filePath, content);
      console.log(`✅ Webhook URL updated in: ${filePath}`);
    });

  } catch (error) {
    console.error("❌ Error updating webhook URLs:", error);
  }
}

updateWebhookUrl();
