import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { createSignalsAPI } from '../api/signals';
import { SignalCard } from './SignalCard';
import { SignalDetail } from './SignalDetail';
import './Dashboard.css';

const urgencyConfig = {
  critical: { color: '#ff3b3b', bg: 'rgba(255, 59, 59, 0.12)', label: 'CRITICAL', icon: '🚨' },
  high: { color: '#ff9500', bg: 'rgba(255, 149, 0, 0.12)', label: 'HIGH', icon: '⚠️' },
  medium: { color: '#ffd60a', bg: 'rgba(255, 214, 10, 0.12)', label: 'MEDIUM', icon: '●' },
  low: { color: '#30d158', bg: 'rgba(48, 209, 88, 0.12)', label: 'LOW', icon: '○' }
};

const intentConfig = {
  frustration: { icon: '😤', color: '#ff6b6b' },
  seeking_help: { icon: '🆘', color: '#ffd93d' },
  onboarding: { icon: '👋', color: '#6bcb77' },
  positive_feedback: { icon: '💚', color: '#4d96ff' },
  feature_request: { icon: '💡', color: '#9b59b6' },
  churning: { icon: '👋', color: '#e74c3c' },
  unknown: { icon: '●', color: '#888' }
};

export function Dashboard() {
  const { user, logout, getToken } = useAuth();
  const api = useMemo(() => createSignalsAPI(getToken), [getToken]);
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({ pending: 0, momentum: 0, critical: 0, processed: 0 });
  const [filter, setFilter] = useState('all');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionHistory, setActionHistory] = useState([]);
  const [showToast, setShowToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSignals();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const refreshTimer = setInterval(loadSignals, 30000); // Refresh every 30s
    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, [filter, api]);

  async function loadSignals() {
    try {
      const data = await api.fetchSignals(filter);
      setSignals(data.signals);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load signals:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id, action) {
    try {
      const signal = signals.find(s => s.id === id);
      await api.updateSignalStatus(id, action);
      
      setSignals(prev => prev.map(s => 
        s.id === id ? { ...s, status: action } : s
      ));
      
      setActionHistory(prev => [...prev, { 
        id, 
        action, 
        actor: signal.actor, 
        time: new Date().toLocaleTimeString() 
      }]);
      
      setSelectedSignal(null);
      setShowToast({ 
        type: action, 
        message: action === 'approved' ? 'Signal approved' : 'Signal skipped' 
      });
      setTimeout(() => setShowToast(null), 2500);
      
      loadSignals(); // Refresh stats
    } catch (err) {
      console.error('Failed to update signal:', err);
    }
  }

  const filteredSignals = signals
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.classification?.urgency] || 2) - (order[b.classification?.urgency] || 2);
    });

  return (
    <div className="container">
      <div className="ambient-glow" />
      <div className="grid-pattern" />
      
      {showToast && (
        <div className={`toast ${showToast.type}`}>
          <span>{showToast.type === 'approved' ? '✓' : '✕'}</span>
          {showToast.message}
        </div>
      )}
      
      <header className="header">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon-wrapper">
              <span className="logo-icon">◉</span>
              <span className="logo-ring" />
            </div>
            <div className="logo-text-wrapper">
              <span className="logo-text">SIGNAL</span>
              <span className="logo-subtext">Feedback Intelligence</span>
            </div>
          </div>
        </div>
        <div className="header-center">
          <div className="search-box">
            <span className="search-icon">⌘</span>
            <span className="search-placeholder">Search signals...</span>
            <span className="search-shortcut">K</span>
          </div>
        </div>
        <div className="header-right">
          <div className="live-indicator">
            <span className="live-dot" />
            <span>LIVE</span>
          </div>
          <div className="divider" />
          <div className="timestamp">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</div>
          <button className="user-avatar" onClick={logout} title="Logout">
            {user?.avatar || '⚡'}
          </button>
        </div>
      </header>

      <div className="stats-bar">
        {[
          { key: 'all', label: 'PENDING', value: stats.pending, icon: '◎', color: '#fff' },
          { key: 'momentum', label: 'MOMENTUM', value: stats.momentum, icon: '🔥', color: '#ff9500' },
          { key: 'critical', label: 'HIGH PRIORITY', value: stats.critical, icon: '⚡', color: '#ff3b3b', pulse: stats.critical > 0 },
          { key: 'processed', label: 'PROCESSED', value: stats.processed, icon: '✓', color: '#30d158' }
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setFilter(stat.key)}
            className={`stat-card ${filter === stat.key ? 'active' : ''} ${stat.pulse ? 'pulse' : ''}`}
            style={{ '--stat-color': stat.color }}
          >
            <div className="stat-top">
              <span className="stat-icon">{stat.icon}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
            <span className="stat-label">{stat.label}</span>
          </button>
        ))}
      </div>

      <main className="main">
        <div className="signal-list">
          <div className="list-header">
            <div className="list-header-left">
              <span className="list-title">Signal Queue</span>
              <span className="list-count">{filteredSignals.length}</span>
            </div>
            <div className="sort-dropdown">
              <span>Urgency</span>
              <span className="dropdown-arrow">▾</span>
            </div>
          </div>
          
          <div className="signal-list-content">
            {loading ? (
              <div className="empty-state">
                <div className="empty-icon">◉</div>
                <div className="empty-title">Loading signals...</div>
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <div className="empty-title">All clear</div>
                <div className="empty-subtitle">No signals matching this filter</div>
              </div>
            ) : (
              filteredSignals.map((signal, index) => (
                <SignalCard 
                  key={signal.id}
                  signal={signal}
                  index={index}
                  isSelected={selectedSignal?.id === signal.id}
                  onClick={() => setSelectedSignal(signal)}
                  onApprove={() => handleAction(signal.id, 'approved')}
                  onReject={() => handleAction(signal.id, 'rejected')}
                  urgencyConfig={urgencyConfig}
                  intentConfig={intentConfig}
                />
              ))
            )}
          </div>
        </div>

        <div className={`detail-panel ${selectedSignal ? 'mobile-visible' : ''}`}>
          {selectedSignal ? (
            <SignalDetail 
              signal={selectedSignal}
              onApprove={() => handleAction(selectedSignal.id, 'approved')}
              onReject={() => handleAction(selectedSignal.id, 'rejected')}
              onClose={() => setSelectedSignal(null)}
              urgencyConfig={urgencyConfig}
              intentConfig={intentConfig}
            />
          ) : (
            <div className="no-selection">
              <div className="no-selection-graphic">
                <div className="no-selection-circle">
                  <span className="no-selection-icon">◎</span>
                </div>
              </div>
              <div className="no-selection-text">Select a signal to review</div>
              <div className="no-selection-hint">Click on any signal from the queue</div>
            </div>
          )}
        </div>
      </main>

      <div className="activity-bar">
        <div className="activity-label">Recent</div>
        <div className="activity-items">
          {actionHistory.slice(-5).reverse().map((item, i) => (
            <div key={i} className="activity-item">
              <span className={`activity-dot ${item.action}`} />
              <span className="activity-text">{item.action === 'approved' ? '✓' : '✕'} {item.actor}</span>
            </div>
          ))}
          {actionHistory.length === 0 && <span className="activity-empty">No activity yet</span>}
        </div>
      </div>
    </div>
  );
}
