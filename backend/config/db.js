const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Always load backend/.env, even when the server or a diagnostic script is
// launched from the repository root rather than from the backend directory.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PLACEHOLDER_VALUES = [
  'your_mongodb_connection_string',
  'your_atlas_username',
  'your_rotated_password',
  'replace_with_your_atlas_uri',
  '<db_password>',
  '<password>',
  '<db_name>',
  '<username>',
  '<cluster-host>',
];
const dns = require("node:dns");

const dnsServers = (
  process.env.MONGODB_DNS_SERVERS || ""
)
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
  console.log(
    "[MongoDB] Using DNS servers:",
    dnsServers.join(", ")
  );
}

async function connectDB() {
  const rawUri = (process.env.MONGODB_URI || '').trim();
  const dbName = (process.env.MONGODB_DB_NAME || 'ward5voting').trim();

  if (!rawUri || PLACEHOLDER_VALUES.some((value) => rawUri.toLowerCase().includes(value))) {
    throw new Error(
      'MONGODB_URI is missing or still contains a placeholder. Copy backend/.env.example to backend/.env and add your rotated MongoDB Atlas URI.'
    );
  }

  if (!/^mongodb(\+srv)?:\/\//i.test(rawUri)) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://.');
  }

  if (!dbName || dbName.includes('/') || dbName.includes(' ')) {
    throw new Error('MONGODB_DB_NAME must be a valid database name, for example ward5voting.');
  }

  try {
    console.log(`[MongoDB] Connecting to Atlas database "${dbName}"...`);
    await mongoose.connect(rawUri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      autoIndex: true,
      autoCreate: true,
    });

    // A ping ensures startup reports success only after the selected database
    // is actually reachable. Never fall back to a local or in-memory DB.
    await mongoose.connection.db.admin().command({ ping: 1 });

    console.log(`✅ [MongoDB] Connected. Database: "${mongoose.connection.name}"`);
    console.log(`[MongoDB] Atlas host: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (err) {
    console.error(`❌ [MongoDB] Atlas connection failed: ${err.message}`);
    console.error('[MongoDB] Check the rotated URI, database user/password, Atlas IP Access List, network access, and MONGODB_DB_NAME.');
    throw err;
  }
}

async function ensureAppCollections() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('Cannot initialize collections: MongoDB is not connected.');
  }

  const models = [
    require('../models/Vote'),
    require('../models/VoteTally'),
    require('../models/NamedVoter'),
  ];

  for (const Model of models) {
    try {
      await Model.createCollection();
    } catch (err) {
      // MongoDB error code 48 means the collection already exists.
      if (err.code !== 48 && err.codeName !== 'NamespaceExists') {
        throw err;
      }
    }

    // Ensure schema indexes (including unique duplicate-vote indexes) exist.
    await Model.init();
    console.log(`✅ [MongoDB] Collection ready: ${Model.collection.name}`);
  }

  const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  console.log(`[MongoDB] Collections in "${mongoose.connection.name}": ${collections.map((item) => item.name).sort().join(', ')}`);
  return collections.map((item) => item.name);
}

module.exports = { connectDB, ensureAppCollections };
