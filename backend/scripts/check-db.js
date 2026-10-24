const mongoose = require('mongoose');
const { connectDB, ensureAppCollections } = require('../config/db');

async function main() {
  try {
    await connectDB();
    await ensureAppCollections();
    const db = mongoose.connection.db;
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    console.log('\n✅ MongoDB check passed.');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Collections: ${collections.map((item) => item.name).sort().join(', ')}`);
  } catch (error) {
    console.error('\n❌ MongoDB check failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
