import axios from 'axios';

export default async function forwardToVenomBot(data) {
  const venomServerURL = process.env.LOCAL_NODE_SERVER || 'http://localhost:3000/api/order';

  try {
    const response = await axios.post(venomServerURL, data);
    return `✅ Forwarded to Venom Bot: ${response.status}`;
  } catch (err) {
    throw new Error(`❌ Forward failed: ${err.message}`);
  }
}
