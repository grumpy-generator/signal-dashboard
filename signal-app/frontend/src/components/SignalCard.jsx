export function SignalCard({ signal, index, isSelected, onClick, onApprove, onReject, urgencyConfig, intentConfig }) {
  const urgency = urgencyConfig[signal.classification?.urgency] || urgencyConfig.medium;
  const intent = intentConfig[signal.classification?.intent_stage] || intentConfig.unknown;
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000 / 60; // minutes
    
    if (diff < 1) return 'just now';
    if (diff < 60) return `${Math.floor(diff)} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <div 
      onClick={onClick}
      className={`signal-card ${isSelected ? 'selected' : ''}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="urgency-line" style={{ background: urgency.color }} />
      <div className="signal-content">
        <div className="signal-header">
          <div className="actor-info">
            <span className="avatar">{signal.avatar || '👤'}</span>
            <div className="actor-details">
              <div className="actor-row">
                <span className="actor-name">{signal.actor}</span>
                <span className="followers">{signal.followers}</span>
              </div>
              <span className="signal-time">{formatTime(signal.timestamp || signal.createdAt)}</span>
            </div>
          </div>
          <div className="urgency-badge" style={{ background: urgency.bg, color: urgency.color }}>
            <span>{urgency.icon}</span>
            <span>{urgency.label}</span>
          </div>
        </div>
        
        <p className="signal-text">{signal.text}</p>
        
        <div className="signal-meta">
          <span className="intent-badge" style={{ borderColor: intent.color + '40' }}>
            <span>{intent.icon}</span>
            <span style={{ color: intent.color }}>
              {(signal.classification?.intent_stage || 'unknown').replace(/_/g, ' ')}
            </span>
          </span>
          {signal.classification?.momentum_flag && (
            <span className="momentum-badge">
              <span>🔥</span>
              <span>{signal.classification.momentum_count}</span>
            </span>
          )}
          <span className="confidence-badge">
            <span className="confidence-dot" />
            {Math.round((signal.classification?.confidence || 0.5) * 100)}%
          </span>
        </div>

        {!signal.status ? (
          <div className="quick-actions">
            <button className="approve-btn" onClick={(e) => { e.stopPropagation(); onApprove(); }}>
              <span>✓</span> Approve
            </button>
            <button className="reject-btn" onClick={(e) => { e.stopPropagation(); onReject(); }}>
              <span>✕</span> Skip
            </button>
          </div>
        ) : (
          <div className={`status-badge ${signal.status}`}>
            {signal.status === 'approved' ? '✓ Approved' : '✕ Skipped'}
          </div>
        )}
      </div>
    </div>
  );
}
