import React from 'react';
import VotingOption from './VotingOption';
import { Loader2 } from 'lucide-react';

export default function PollPanel({
  options = [],
  wardName = 'वार्ड नंबर 5',
  selectedOptionId,
  isSubmitting,
  hasVoted,
  onVote,
}) {
  return (
    <section className="evm-machine-panel" id="evm-polling-panel" aria-label="EVM Voting Machine">
      {/* EVM Top Header Casing */}
      <div className="evm-panel-header">
        <div className="evm-header-left">
          <div className="evm-unit-tag">इलेक्ट्रॉनिक मतपत्र इकाई</div>
          <h2 className="evm-ward-title" id="panel-ward-heading">{wardName}</h2>
        </div>

        <div className="evm-header-right">
          <div className="evm-ready-status">
            <span className={`ready-led ${hasVoted ? 'ready-led-locked' : 'ready-led-active'}`}></span>
            <span className="ready-text">{hasVoted ? 'मतदान संपन्न' : 'तैयार (READY)'}</span>
          </div>
          <div className="evm-serial-tag">BU-05</div>
        </div>
      </div>

      {/* EVM Column Header Guide */}
      <div className="evm-columns-legend">
        <div className="legend-col legend-serial">क्र.सं.</div>
        <div className="legend-col legend-name">उम्मीदवार / विकल्प का नाम</div>
        <div className="legend-col legend-btn">नीला बटन दबाएं</div>
        <div className="legend-col legend-led">बत्ती</div>
      </div>

      {/* EVM Options List */}
      <div className="evm-options-list" id="evm-options-list">
        {options.map((option, index) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <VotingOption
              key={option.id}
              option={option}
              serialNumber={index + 1}
              isSelected={isSelected}
              isSubmitting={isSubmitting}
              disabled={hasVoted || isSubmitting}
              onSelect={onVote}
            />
          );
        })}
      </div>

      {/* Submitting Overlay or EVM Footer bar */}
      <div className="evm-panel-footer">
        {isSubmitting ? (
          <div className="evm-submitting-state" id="voting-submitting-indicator">
            <Loader2 size={18} className="spinner-icon" />
            <span>वोट डेटाबेस में दर्ज किया जा रहा है... कृपया प्रतीक्षा करें</span>
          </div>
        ) : hasVoted ? (
          <div className="evm-locked-state">
            <span className="lock-icon">🔒</span>
            <span>इस मशीन पर आपका मत दर्ज हो चुका है। नीचे लाइव परिणाम देखें।</span>
          </div>
        ) : (
          <div className="evm-instruction-text">
            <span>💡 किसी भी विकल्प के सामने दिए गए नीले बटन पर क्लिक करके तुरंत अपना वोट दर्ज करें।</span>
          </div>
        )}
      </div>
    </section>
  );
}
