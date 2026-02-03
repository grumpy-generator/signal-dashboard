// Signal Classifier - polls Telegram and sends classified signals to dashboard
// Runs alongside OpenClaw but only for classification

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3001/webhook/signal";
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;

if (!BOT_TOKEN || !WEBHOOK_TOKEN) {
  console.error("[ERROR] Missing required env vars: TELEGRAM_BOT_TOKEN, WEBHOOK_TOKEN");
  process.exit(1);
}

let lastUpdateId = 0;

// Classification function
function classifyMessage(text) {
  const lowerText = text.toLowerCase();
  
  // Check for churning (critical)
  if (lowerText.match(/annuler|cancel|partir|leaving|je pars|resilier|refund|remboursement/)) {
    return { intent: "churning", urgency: "critical", confidence: 0.9 };
  }
  
  // Check for frustration (high)
  if (lowerText.match(/marche pas|not working|bug|broken|nul|horrible|impossible|furieux|upset|angry|frustrat|annoying|terrible|worst|hate|sucks/)) {
    return { intent: "frustration", urgency: "high", confidence: 0.85 };
  }
  
  // Check for positive feedback (low)
  if (lowerText.match(/merci|thanks|super|genial|excellent|parfait|bravo|great|awesome|love/)) {
    return { intent: "positive_feedback", urgency: "low", confidence: 0.9 };
  }
  
  // Check for help seeking (medium)
  if (lowerText.match(/comment|how|aide|help|question|\?|pourquoi|why|expliquer/)) {
    return { intent: "seeking_help", urgency: "medium", confidence: 0.75 };
  }
  
  // Check for feature request (medium)
  if (lowerText.match(/suggestion|feature|ameliorer|ajouter|ce serait bien|il faudrait|idea|idee/)) {
    return { intent: "feature_request", urgency: "medium", confidence: 0.8 };
  }
  
  // Default
  return { intent: "general", urgency: "low", confidence: 0.5 };
}

// Send signal to dashboard
async function sendSignal(username, text, classification) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-token": WEBHOOK_TOKEN
      },
      body: JSON.stringify({
        actor: username,
        text: text,
        source: "telegram",
        classification: {
          intent: classification.intent,
          urgency: classification.urgency,
          confidence: classification.confidence,
          model: "signal-classifier-v1"
        }
      })
    });
    
    const result = await response.json();
    console.log(`[SIGNAL] Sent: ${classification.intent} (${classification.urgency}) - ${text.substring(0, 50)}...`);
    return result;
  } catch (err) {
    console.error("[SIGNAL] Error sending:", err.message);
  }
}

// Get updates from Telegram
async function getUpdates() {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.ok || !data.result) return;
    
    for (const update of data.result) {
      lastUpdateId = update.update_id;
      
      const message = update.message;
      if (!message || !message.text) continue;
      
      const username = message.from.username || message.from.first_name || `user_${message.from.id}`;
      const text = message.text;
      
      // Skip commands
      if (text.startsWith("/")) continue;
      
      // Classify and send
      const classification = classifyMessage(text);
      await sendSignal(username, text, classification);
    }
  } catch (err) {
    console.error("[POLL] Error:", err.message);
  }
}

// Main loop
async function main() {
  console.log("[CLASSIFIER] Starting signal classifier...");
  console.log("[CLASSIFIER] Polling Telegram for messages...");
  
  // Delete webhook to enable polling
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
  
  while (true) {
    await getUpdates();
  }
}

main().catch(console.error);
