# वार्ड नंबर 5 का वोटिंग टेस्ट (Ward 5 EVM Voting Poll)

इलेक्ट्रॉनिक वोटिंग मशीन (EVM) प्रेरित, आधुनिक, न्यूनतम और पूर्णतः कार्यशील हिंदी जनमत सर्वेक्षण वेब एप्लिकेशन।

---

## 🗳️ मुख्य विशेषताएं (Key Features)

1. **ईवीएम-प्रेरित इंटरफ़ेस (EVM Industrial Interface)**:
   - ऑफ-व्हाइट / इंडस्ट्रियल ग्रे मतपत्र इकाई (Ballot Unit) डिजाइन।
   - क्रम संख्या, उम्मीदवार/विकल्प का नाम, नीला मतदान बटन (Blue EVM Tactile Button)।
   - मतदान करने पर लाल बत्ती (Red LED Indicator Lamp) चमकती और ब्लिंक करती है।
   - ऑथेंटिक ईवीएम बीप साउंड (Web Audio API द्वारा संश्लेषित ध्वनि, किसी बाहरी फ़ाइल की आवश्यकता नहीं)।
   - ऑडियो म्यूट/अनम्यूट टॉगल।

2. **एकल स्रोत कॉन्फ़िगरेशन (Source of Truth)**:
   - सभी विकल्प [`backend/config/pollOptions.js`](file:///Users/jignesh/Desktop/pol/backend/config/pollOptions.js) से नियंत्रित होते हैं।
   - नए विकल्प जोड़ें, हटाएं या नाम बदलें - फ्रंटएंड स्वतः अपडेट हो जाता है।
   - हिंदी देवनागरी वर्णमाला के अनुसार स्वतः वर्णानुक्रम सॉर्टिंग (`Intl.Collator`).

3. **तत्काल एवं वास्तविक डेटाबेस वोटिंग (Direct MongoDB Persistence)**:
   - नीले बटन पर क्लिक करते ही वोट तुरंत MongoDB में Mongoose द्वारा सुरक्षित हो जाता है।
   - कोई अलग "सबमिट" बटन की आवश्यकता नहीं।
   - केवल डेटाबेस में वोट सुरक्षित होने के बाद ही सफलता संदेश दिखाया जाता है।

4. **वैकल्पिक नाम प्रविष्टि (Optional Name Entry)**:
   - वोट सुरक्षित होने के बाद उपयोगकर्ता अपना नाम दर्ज कर सकता है।
   - नाम सबमिट करने पर कोई नया वोट नहीं बनता और न ही चुना गया विकल्प बदलता है।
   - यह केवल मौजूदा वोट रिकॉर्ड में नाम जोड़ता है।

5. **रीयल-टाइम परिणाम (Live Results with Socket.IO)**:
   - मतदान के तुरंत बाद लाइव परिणाम प्रदर्शित होते हैं।
   - किसी अन्य मतदाता द्वारा वोट देने पर Socket.IO द्वारा परिणाम बिना पेज रिफ्रेश किए स्वतः अपडेट होते हैं।
   - कुल वोट, प्रतिशत, और स्मूथ हॉरिजॉन्टल प्रोग्रेस बार।

6. **डुप्लीकेट वोट सुरक्षा (Browser-Based Duplicate Protection)**:
   - `crypto.randomUUID()` द्वारा निर्मित स्थायी ब्राउज़र वोटर आईडी।
   - MongoDB कंपाउंड यूनिक इंडेक्स `{ pollId: 1, voterId: 1 }` द्वारा एक ब्राउज़र से केवल एक वोट की अनुमति।
   - टेस्टिंग के लिए पादलेख (Footer) में "वोटर आईडी रीसेट" बटन उपलब्ध है।

7. **वैधानिक अस्वीकरण (Disclaimers)**:
   - स्पष्ट उल्लेख कि यह एक अनौपचारिक ओपिनियन पोल है, भारत निर्वाचन आयोग का आधिकारिक मतदान नहीं।

---

## 📁 प्रोजेक्ट संरचना (Project Structure)

```
pol/
├── backend/
│   ├── config/
│   │   ├── db.js                 # Explicit MongoDB Atlas connection + collection initialization
│   │   ├── pollConfig.js         # पोल मेटाडेटा और सेटिंग्स
│   │   └── pollOptions.js        # मतदान विकल्पों का एकमात्र स्रोत (Source of Truth)
│   ├── controllers/
│   │   ├── pollController.js     # पोल एवं परिणाम कंट्रोलर
│   │   └── voteController.js     # वोटिंग, स्टेटस, एवं वैकल्पिक नाम कंट्रोलर
│   ├── middleware/
│   │   ├── rateLimiter.js        # स्पैम एवं दर नियंत्रण (Rate Limiting)
│   │   └── validation.js         # पेलोड, वोटर आईडी, एवं नाम सत्यापन
│   ├── models/
│   │   └── Vote.js               # Mongoose मॉडल (कंपाउंड यूनिक इंडेक्स सहित)
│   ├── routes/
│   │   ├── pollRoutes.js         # /api/poll रूट्स
│   │   └── voteRoutes.js         # /api/votes रूट्स
│   ├── services/
│   │   └── resultsService.js     # MongoDB एग्रीगेशन एवं परिणाम गणना
│   ├── server.js                 # Express + Socket.IO सर्वर
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # शीर्ष संदेश एवं ध्वनि नियंत्रण
│   │   │   ├── PollPanel.jsx        # ईवीएम मतपत्र पैनल
│   │   │   ├── VotingOption.jsx     # ईवीएम विकल्प रो (बटन व लाल बत्ती)
│   │   │   ├── VoteConfirmation.jsx # सफल मतदान पुष्टि कार्ड
│   │   │   ├── OptionalNameForm.jsx # वैकल्पिक नाम प्रविष्टि फॉर्म
│   │   │   ├── LiveResults.jsx      # रीयल-टाइम परिणाम पैनल
│   │   │   ├── ResultBar.jsx        # एनिमेटेड प्रोग्रेस बार
│   │   │   └── Footer.jsx           # अस्वीकरण एवं टेस्ट रीसेट
│   │   ├── services/
│   │   │   ├── api.js               # बैकएंड एपीआई क्लाइंट
│   │   │   ├── socket.js            # Socket.IO क्लाइंट
│   │   │   ├── sound.js             # ईवीएम बीप साउंड सिंथेसाइज़र
│   │   │   └── voterId.js           # परसिस्टेंट ब्राउज़र वोटर आईडी सर्विस
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                # संपूर्ण ईवीएम डिज़ाइन सिस्टम
│   ├── index.html
│   ├── vite.config.js               # Vite प्रॉक्सी कॉन्फ़िगरेशन
│   ├── .env.example
│   └── package.json
│
├── tests/
│   └── test_full_flow.js            # स्वचालित एंड-टू-एंड एकीकरण टेस्ट
├── package.json                     # रूट ऑर्केस्ट्रेशन
└── README.md
```

---

## ⚙️ पर्यावरण चर (Environment Variables)

### बैकएंड (`backend/.env`):
```env
PORT=5001
MONGODB_URI=mongodb+srv://YOUR_ATLAS_USERNAME:YOUR_ROTATED_PASSWORD@YOUR_CLUSTER_HOST/?retryWrites=true&w=majority&appName=ward5-voting
MONGODB_DB_NAME=ward5voting
CLIENT_URL=http://localhost:5173
POLL_ID=ward-5-voting-test
```
> **नोट**: जब `MONGODB_URI` में वास्तविक Atlas पासवर्ड दर्ज किया जाएगा, सर्वर सीधे MongoDB Atlas से कनेक्ट हो जाता है। यदि पासवर्ड प्लेसहोल्डर रहता है, तो सर्वर शून्य-कॉन्फ़िगरेशन के साथ स्थानीय परसिस्टेंट मोंगोडीबी पर सुचारू रूप से चलता है।

### फ्रंटएंड (`frontend/.env`):
```env
VITE_API_URL=
VITE_SOCKET_URL=
```
*(स्थानीय विकास में Vite प्रॉक्सी स्वतः `/api` और `/socket.io` को बैकएंड पोर्ट `5001` पर अग्रेषित करता है)*

---

## 🚀 एप्लिकेशन प्रारंभ करने की विधि (How to Run)

### 1. Dependencies install करें (repository root से):
```bash
npm run install:all
```

### 2. Backend environment बनाएं (repository root से):
```bash
cp backend/.env.example backend/.env
# backend/.env में YOUR_ATLAS_USERNAME और YOUR_ROTATED_PASSWORD बदलें; host पहले से सेट है
```

### 3. Database connection और collections जांचें:
```bash
cd backend
npm run check:db
```
यह Atlas connection, selected database name और collections की पुष्टि करेगा। Check सफल होने के बाद `npm run dev` से backend शुरू करें।

### 4. फ्रंटएंड प्रारंभ करें:
```bash
cd frontend
npm run dev
```

ब्राउज़र में खोलें:
👉 **`http://localhost:5173`**

MongoDB में collection names Mongoose models के हिसाब से `votes`, `votetallies` और `namedvoters` हैं। Data Explorer में `ward5voting` database चुनें। तीनों empty collections भी backend startup पर बनाई जाती हैं.

---

## 🧪 स्वचालित टेस्ट चलाएं (Run Verification Tests)

सभी 7 एकीकरण परीक्षणों को चलाने के लिए:
```bash
node tests/test_full_flow.js
```
यह टेस्ट स्वचालित रूप से सत्यापित करता है:
1. `GET /api/poll` विकल्पों की प्राप्ति।
2. Socket.IO लाइव कनेक्शन।
3. क्लाइंट A द्वारा वोट दर्ज होना एवं MongoDB में सुरक्षित होना।
4. क्लाइंट B को बिना रिफ्रेश किए रीयल-टाइम में परिणाम मिलना।
5. वैकल्पिक नाम सबमिट करने पर वोटों की संख्या न बढ़ना।
6. उसी ब्राउज़र से पुनः वोट देने पर 409 एरर द्वारा ब्लॉक होना।
7. सर्वर रीस्टार्ट के बाद सभी वोट सुरक्षित रहना।
