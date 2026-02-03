import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { signals } from './signals.js';

export const webhookRouter = Router();

// Verify webhook token
function verifyWebhookToken(req, res, next) {
  const token = req.headers['x-webhook-token'] || req.query.token;
  
  if (!token || token !== process.env.SIGNAL_AGENT_TOKEN) {
    return res.status(401).json({ error: 'Invalid webhook token' });
  }
  
  next();
}

// Receive signal from SignalIntell agent
webhookRouter.post('/signal', verifyWebhookToken, (req, res) => {
  const {
    actor,
    avatar,
    text,
    source = 'twitter',
    followers,
    tweetId,
    tweetUrl,
    classification
  } = req.body;

  if (!actor || !text) {
    return res.status(400).json({ error: 'Missing required fields: actor, text' });
  }

  const signal = {
    id: 'sig_' + uuidv4().slice(0, 8),
    actor,
    avatar: avatar || '👤',
    text,
    source,
    followers: followers || '0',
    tweetId,
    tweetUrl,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    classification: classification || {
      intent_stage: 'unknown',
      primary_pain: 'unknown',
      urgency: 'medium',
      confidence: 0.5,
      momentum_flag: false,
      momentum_count: 0,
      recommended_action: 'review',
      suggested_reply: ''
    },
    status: null
  };

  signals.set(signal.id, signal);

  console.log(`[WEBHOOK] New signal from ${actor}: ${text.slice(0, 50)}...`);

  res.json({ 
    success: true, 
    signal_id: signal.id,
    message: 'Signal received'
  });
});

// Batch import signals
webhookRouter.post('/signals/batch', verifyWebhookToken, (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items must be an array' });
  }

  const imported = [];
  
  for (const item of items) {
    if (!item.actor || !item.text) continue;

    const signal = {
      id: 'sig_' + uuidv4().slice(0, 8),
      actor: item.actor,
      avatar: item.avatar || '👤',
      text: item.text,
      source: item.source || 'twitter',
      followers: item.followers || '0',
      tweetId: item.tweetId,
      tweetUrl: item.tweetUrl,
      timestamp: item.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      classification: item.classification || {
        intent_stage: 'unknown',
        primary_pain: 'unknown',
        urgency: 'medium',
        confidence: 0.5,
        momentum_flag: false,
        momentum_count: 0,
        recommended_action: 'review',
        suggested_reply: ''
      },
      status: null
    };

    signals.set(signal.id, signal);
    imported.push(signal.id);
  }

  console.log(`[WEBHOOK] Batch import: ${imported.length} signals`);

  res.json({ 
    success: true, 
    imported: imported.length,
    signal_ids: imported
  });
});

// Get webhook status
webhookRouter.get('/status', verifyWebhookToken, (req, res) => {
  res.json({
    status: 'active',
    signals_count: signals.size,
    timestamp: new Date().toISOString()
  });
});
