import React from 'react';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';

export default function Header({ soundOn, onToggleSound }) {
  return (
    <header className="site-header" id="site-header">
      <div className="header-disclaimer-pill" id="header-disclaimer">
        <ShieldAlert size={15} className="disclaimer-icon" />
        <span>यह एक अनौपचारिक जनमत सर्वेक्षण है, आधिकारिक चुनाव या निर्वाचन आयोग की मतदान प्रणाली नहीं है।</span>
      </div>

      <div className="top-banner-card">
        <p className="moral-quote">
          "आपका वोट बहुमूल्य है।<br />
          सोच-समझकर, ईमानदारी से दें।"
        </p>
      </div>

      <div className="title-section">
        <div className="title-row">
          <h1 className="main-title" id="poll-main-heading">
            वार्ड नंबर 5 का वोटिंग टेस्ट
          </h1>
          <button
            type="button"
            className={`sound-toggle-btn ${soundOn ? 'sound-active' : 'sound-muted'}`}
            onClick={onToggleSound}
            title={soundOn ? 'EVM बीप ध्वनि बंद करें' : 'EVM बीप ध्वनि चालू करें'}
            aria-label={soundOn ? 'ध्वनि बंद करें' : 'ध्वनि चालू करें'}
            id="sound-toggle-button"
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span className="sound-text">{soundOn ? 'ध्वनि चालू' : 'ध्वनि मूक'}</span>
          </button>
        </div>
        <p className="subtitle" id="poll-subtitle">
          अपनी पसंद का विकल्प चुनें और अपनी राय दर्ज करें।
        </p>
      </div>
    </header>
  );
}
