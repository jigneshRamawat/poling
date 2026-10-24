import React from 'react';
import ResultBar from './ResultBar';
import { Activity, RefreshCw } from 'lucide-react';

export default function LiveResults({
  results = [],
  totalVotes = 0,
  userVotedOptionId,
  isLiveConnected = true,
  onRefresh,
}) {
  // Find highest vote count to mark leader(s)
  const maxVotes = Math.max(0, ...results.map((r) => r.votes || 0));

  return (
    <section className="live-results-section" id="live-results-section" aria-label="लाइव वोटिंग परिणाम">
      <div className="results-header-card">
        <div className="results-header-left">
          <div className="live-indicator-tag" id="socket-live-badge">
            <span className={`live-pulse-dot ${isLiveConnected ? 'dot-connected' : 'dot-disconnected'}`}></span>
           
          </div>
          <h2 className="results-main-title" id="results-heading">
            लाइव वोटिंग परिणाम
          </h2>
        </div>

        <div className="results-header-right">
          <div className="total-votes-box" id="total-votes-counter">
            <span className="total-votes-label">कुल दर्ज वोट</span>
            <span className="total-votes-number">{totalVotes}</span>
          </div>
          {onRefresh && (
            <button
              type="button"
              className="refresh-results-btn"
              onClick={onRefresh}
              title="परिणाम रिफ्रेश करें"
              aria-label="परिणाम रिफ्रेश करें"
              id="refresh-results-button"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="results-list" id="results-bars-container">
        {results.length === 0 ? (
          <div className="no-results-msg">परिणाम लोड हो रहे हैं...</div>
        ) : (
          results.map((item) => {
            const isLeading = maxVotes > 0 && item.votes === maxVotes;
            const isUserChoice = userVotedOptionId === item.id;

            return (
              <ResultBar
                key={item.id}
                option={item}
                totalVotes={totalVotes}
                isLeading={isLeading}
                isUserChoice={isUserChoice}
              />
            );
          })
        )}
      </div>

  
    </section>
  );
}
