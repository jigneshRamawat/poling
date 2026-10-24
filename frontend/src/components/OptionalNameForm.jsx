import React, { useState, useEffect } from 'react';
import { User, Send, Check, Loader2, Info } from 'lucide-react';

export default function OptionalNameForm({ initialName = '', onSaveName, isSaving }) {
  const [name, setName] = useState(initialName);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await onSaveName(name.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'नाम सहेजने में समस्या आई।');
    }
  };

  return (
    <section className="optional-name-section" id="optional-name-section">
      <div className="name-section-header">
        <div className="name-icon-box">
          <User size={20} className="name-icon" />
        </div>
        <div>
          <h3 className="name-section-title" id="name-form-heading">
            अपना नाम दर्ज करना चाहें तो नीचे लिखें
          </h3>
          <p className="name-section-subtitle">
            यह फ़ील्ड पूरी तरह ऐच्छिक (वैकल्पिक) है।
          </p>
        </div>
      </div>

      <div className="name-info-callout">
        <Info size={16} className="info-icon" />
        <span>
          नाम सबमिट करने पर आपका नाम आपके पहले से सुरक्षित किए गए वोट रिकॉर्ड के साथ जोड़ दिया जाएगा। इससे वोटों की कुल संख्या में कोई वृद्धि नहीं होगी और आपका चुना गया विकल्प नहीं बदलेगा।
        </span>
      </div>

      <form onSubmit={handleSubmit} className="name-form" id="optional-name-form">
        <div className="input-group">
          <input
            type="text"
            id="voter-name-input"
            className="name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="आपका नाम (वैकल्पिक)"
            maxLength={60}
            disabled={isSaving}
            aria-label="आपका नाम (वैकल्पिक)"
          />
          <span className="char-count">{name.length}/60</span>
        </div>

        <button
          type="submit"
          className="name-submit-btn"
          id="name-submit-button"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="btn-spinner" />
              <span>सहेजा जा रहा है...</span>
            </>
          ) : savedSuccess ? (
            <>
              <Check size={16} />
              <span>नाम सहेजा गया!</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>नाम सबमिट करें</span>
            </>
          )}
        </button>
      </form>

      {savedSuccess && (
        <div className="name-status-toast status-success" id="name-success-msg">
          ✓ आपका नाम आपके वोट रिकॉर्ड के साथ सफलतापूर्वक जोड़ दिया गया है।
        </div>
      )}

      {errorMsg && (
        <div className="name-status-toast status-error" id="name-error-msg">
          ⚠️ {errorMsg}
        </div>
      )}
    </section>
  );
}
