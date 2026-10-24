import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function Footer({ onResetVoterId }) {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="footer-content">
        <div className="footer-disclaimer-box">
          <p className="disclaimer-title">महत्वपूर्ण वैधानिक सूचना एवं अस्वीकरण</p>
          <p className="disclaimer-text">
            यह वेबसाइट केवल एक स्थानीय अनौपचारिक ओपिनियन पोल (वार्ड नंबर 5 का वोटिंग टेस्ट) है। इसका भारत निर्वाचन आयोग (ECI), राज्य निर्वाचन आयोग, या किसी भी सरकारी निकाय से कोई संबंध नहीं है।
          </p>
          <p className="disclaimer-subtext">
            डुप्लीकेट वोट सुरक्षा ब्राउज़र-आधारित लोकल पहचान पर निर्भर करती है। यह आधिकारिक चुनावों में प्रयुक्त बायोमेट्रिक या मतदाता पहचान पत्र सत्यापन के समान नहीं है।
          </p>
        </div>

       
      </div>
    </footer>
  );
}
