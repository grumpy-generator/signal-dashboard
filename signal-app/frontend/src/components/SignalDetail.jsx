import { useState } from 'react';

export function SignalDetail({ signal, onApprove, onReject, onClose, urgencyConfig, intentConfig }) {
  const urgency = urgencyConfig[signal.classification?.urgency] || urgencyConfig.medium;
  const intent = intentConfig[signal.classification?.intent_stage] || intentConfig.unknown;
  const [copied, setCopied] = useState(false);

  const copyReply = () => {
    navigator.clipboard.writeText(signal.classification?.suggested_reply || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  return (
    <div className="detail">
      <div className="detail-header">
        <div>
          <div className="detail-title">Signal Analysis</div>
          <div className="detail-id">{signal.id}</div>
        </div>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="detail-section">
        <div className="section-label">ORIGINAL SIGNAL</div>
        <div className="original-signal">
          <div className="original-header">
            <div className="original-actor">
              <span className="avatar-large">{signal.avatar || '👤'}</span>
              <div>
                <div className="actor-name-large">{signal.actor}</div>
                <div className="actor-meta">{signal.followers} followers · {formatTime(signal.timestamp || signal.createdAt)}</div>
              </div>
            </div>
            {signal.tweetUrl && (
              <a href={signal.tweetUrl} target="_blank" rel="noopener noreferrer" className="source-link">
                <span>View on 𝕏</span>
                <span>↗</span>
              </a>
            )}
          </div>
          <p className="original-text">{signal.text}</p>
        </div>
      </div>

      <div className="detail-section">
        <div className="section-label">CLASSIFICATION</div>
        <div className="classification-grid">
          <div className="class-item">
            <span className="class-label">Intent Stage</span>
            <span className="class-value" style={{ color: intent.color }}>
              {intent.icon} {(signal.classification?.intent_stage || 'unknown').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="class-item">
            <span className="class-label">Primary Pain</span>
            <span className="class-value">
              {(signal.classification?.primary_pain || 'unknown').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="class-item">
            <span className="class-label">Urgency Level</span>
            <span className="class-value" style={{ color: urgency.color }}>
              {urgency.icon} {urgency.label}
            </span>
          </div>
          <div className="class-item">
            <span className="class-label">Confidence</span>
            <div className="confidence-wrapper">
              <div className="confidence-bar-bg">
                <div 
                  className="confidence-fill" 
                  style={{ width: `${(signal.classification?.confidence || 0.5) * 100}%` }} 
                />
              </div>
              <span className="confidence-percent">
                {Math.round((signal.classification?.confidence || 0.5) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {signal.classification?.momentum_flag && (
        <div className="detail-section">
          <div className="section-label">🔥 MOMENTUM DETECTED</div>
          <div className="momentum-box">
            <div className="momentum-left">
              <span className="momentum-number">{signal.classification.momentum_count}</span>
              <span className="momentum-label">similar signals</span>
            </div>
            <div className="momentum-right">
              <div className="momentum-bar">
                <div className="momentum-bar-fill" />
              </div>
              <span className="momentum-trend">↑ Trending 24h</span>
            </div>
          </div>
        </div>
      )}

      {signal.classification?.recommended_action && (
        <div className="detail-section">
          <div className="section-label">RECOMMENDED ACTION</div>
          <div className="action-box">
            <div className="action-header">
              <span className="action-icon">→</span>
              <span className="action-text">
                {signal.classification.recommended_action.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {signal.classification?.suggested_reply && (
        <div className="detail-section">
          <div className="section-label-row">
            <span className="section-label">SUGGESTED REPLY</span>
            <button onClick={copyReply} className="copy-btn">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="reply-box">
            <p className="reply-text">{signal.classification.suggested_reply}</p>
          </div>
        </div>
      )}

      <div className="detail-actions">
        <button className="approve-main-btn" onClick={onApprove}>
          <span>✓</span>
          <span>Approve & Execute</span>
        </button>
        <button className="reject-main-btn" onClick={onReject}>
          <span>✕</span>
          <span>Skip</span>
        </button>
      </div>

      <div className="detail-footer">
        <span className="footer-hint">⌘ + Enter to approve · Esc to close</span>
      </div>
    </div>
  );
}
