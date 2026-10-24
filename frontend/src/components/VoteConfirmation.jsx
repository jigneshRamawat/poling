import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function VoteConfirmation({
  message,
  selectedOptionName,
  isExistingVote = false,
  timestamp,
}) {
  return (
    <div
      className={`vote-confirmation-card ${isExistingVote ? 'conf-existing' : 'conf-new'}`}
      id="vote-confirmation-box"
      role="alert"
    >
      <div className="conf-icon-wrapper">
        {isExistingVote ? (
          <AlertCircle size={32} className="conf-icon icon-info" />
        ) : (
          <CheckCircle2 size={36} className="conf-icon icon-success" />
        )}
      </div>

      <div className="conf-content">
        <h3 className="conf-title" id="confirmation-title">
          {message || 'आपका वोट सफलतापूर्वक दर्ज हो गया है।'}
        </h3>

        {selectedOptionName && (
          <div className="conf-choice-badge" id="recorded-choice-display">
            <span className="choice-label">दर्ज किया गया विकल्प:</span>
            <span className="choice-name">"{selectedOptionName}"</span>
          </div>
        )}

        <div className="conf-meta">
          <span className="vvpat-indicator">✓ डेटाबेस में सत्यापित एवं सुरक्षित</span>
          {timestamp && (
            <span className="conf-timestamp">
              {new Date(timestamp).toLocaleTimeString('hi-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
