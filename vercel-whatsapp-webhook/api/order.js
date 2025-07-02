// api/order.js
import express from "express";
import forwardToVenomBot from "../utils/forwardToVenomBot.js"; // make sure this path is correct

const router = express.Router();

router.post("/order", async (req, res) => {
  try {
    const data = req.body;

    console.log("✅ Received POST /api/order:", data);

    // Optional safety check
    if (!data.ticket || !data.pair || !data.type) {
      return res.status(400).json({ error: "Missing fields in body" });
    }

    await forwardToVenomBot(data); // ⬅️ your own logic

    res.status(200).send("✅ Order forwarded to venom-bot server");
  } catch (error) {
    console.error("❌ Error in /api/order:", error.message);
    res.status(500).send("❌ Internal error: " + error.message);
  }
});

export default router;
