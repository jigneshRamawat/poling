const POLL_CONFIG = {
  pollId: process.env.POLL_ID || 'ward-5-voting-test',
  wardName: 'वार्ड नंबर 5',
  pollTitle: 'वार्ड नंबर 5 का वोटिंग टेस्ट',
  headerBanner: 'आपका वोट बहुमूल्य है। सोच-समझकर, ईमानदारी से दें।',
  subtitle: 'अपनी पसंद का विकल्प चुनें और अपनी राय दर्ज करें।',
  disclaimer: 'यह एक अनौपचारिक जनमत सर्वेक्षण (ओपिनियन पोल) है, आधिकारिक चुनाव या निर्वाचन आयोग की मतदान प्रणाली नहीं है।',
  locale: 'hi',
};

module.exports = POLL_CONFIG;
