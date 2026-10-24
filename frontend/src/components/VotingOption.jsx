import React from 'react';

export default function VotingOption({
  option,
  serialNumber,
  isSelected,
  isSubmitting,
  disabled,
  onSelect,
}) {
  const handleClick = () => {
    if (disabled || isSubmitting) return;
    onSelect(option);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      id={`voting-row-${option.id}`}
      className={`evm-option-row ${isSelected ? 'row-selected' : ''} ${
        disabled ? 'row-disabled' : 'row-clickable'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      aria-label={`${serialNumber}: ${option.name}`}
    >
      {/* 1. Serial Number Badge */}
      <div className="evm-col serial-col" id={`serial-badge-${option.id}`}>
        <span className="serial-num">{serialNumber}</span>
      </div>

      {/* 2. Candidate / Option Name */}
      <div className="evm-col name-col" id={`name-label-${option.id}`}>
        <span className="option-name-text">{option.name}</span>
      </div>

      {/* 3 & 4. EVM Blue Vote Button Area */}
      <div className="evm-col button-col">
        <button
          type="button"
          tabIndex={-1}
          id={`vote-btn-${option.id}`}
          className={`evm-blue-btn ${isSelected ? 'btn-pressed' : ''}`}
          disabled={disabled || isSubmitting}
          aria-hidden="true"
        >
          <span className="btn-inner">
            <span className="btn-arrow">▶</span>
            <span className="btn-label">मत दें</span>
          </span>
        </button>
      </div>

      {/* 5. Small Indicator Light (Red LED) */}
      <div className="evm-col led-col">
        <div
          id={`led-lamp-${option.id}`}
          className={`evm-led-lamp ${isSelected ? 'led-illuminated led-blinking' : 'led-off'}`}
          title={isSelected ? 'सत्यापित' : 'संकेतक'}
        >
          <div className="led-reflection"></div>
        </div>
      </div>
    </div>
  );
}
