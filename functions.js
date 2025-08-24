const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
admin.initializeApp();
const db = admin.firestore();

const BOT_TOKEN = functions.config().telegram.token;
const CHAT_ID = functions.config().telegram.chatid;

exports.scheduledCheck = functions.pubsub.schedule("every 15 minutes").onRun(async (context) => {
  const now = new Date();

  // --- Payment reminders ---
  const subs = await db.collection("subscribers").get();
  subs.forEach(doc => {
    const s = doc.data();
    const start = new Date(s.startDate);
    if (start.getDate() === now.getDate()) {
      sendMessage(`💰 Payment due: ${s.name} - ${s.amount}`);
    }
  });

  // --- Call reminders ---
  const calls = await db.collection("calls").get();
  calls.forEach(doc => {
    const c = doc.data();
    const callTime = new Date(c.callTime);
    if (Math.abs(callTime - now) < 15 * 60 * 1000) {
      sendMessage(`📞 Reminder: Call ${c.name} (${c.phone}) - ${c.reason}`);
    }
  });

  return null;
});

async function sendMessage(text) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text
    });
  } catch (err) {
    console.error("Telegram error", err.response?.data || err.message);
  }
}
