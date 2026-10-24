import React from 'react';

export default function ResultBar({
  option,
  totalVotes,
  isLeading,
  isUserChoice,
}) {
  const percentNumber = option.percentageNumber || 0;
  const percentText = option.percentage || '0.00%';
  const votes = option.votes || 0;

  return (
    <div
      className={`result-item-card ${isLeading && totalVotes > 0 ? 'item-leading' : ''} ${
        isUserChoice ? 'item-user-choice' : ''
      }`}
      id={`result-item-${option.id}`}
    >
      <div className="result-info-row">
        <div className="result-name-group">
          <span className="result-option-name">{option.name}</span>
          <div className="result-badges">
            {isUserChoice && (
              <span className="badge badge-user-vote">आपका मत</span>
            )}
            {isLeading && totalVotes > 0 && (
              <span className="badge badge-leader">अग्रणी</span>
            )}
          </div>
        </div>

        <div className="result-metric-group">
          <span className="result-vote-count">{votes} वोट</span>
          <span className="result-percent">{percentText}</span>
        </div>
      </div>

      <div className="result-bar-track" aria-hidden="true">
        <div
          className={`result-bar-fill ${isLeading && totalVotes > 0 ? 'fill-leading' : 'fill-standard'}`}
          style={{ width: `${percentNumber}%` }}
        ></div>
      </div>
    </div>
  );
}
