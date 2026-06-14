require('dotenv').config();
const mongoose = require('mongoose');

const BASE_URI = 'mongodb+srv://PstuDBUser:vDyHAtRkc18QIIwk@cluster0.8z1vnf2.mongodb.net';
const QUERY    = '?appName=Cluster0';

const SOURCE_URI = `${BASE_URI}/test${QUERY}`;
const TARGET_URI = `${BASE_URI}/pstu-web-app${QUERY}`;

const migrate = async () => {
  console.log('Connecting to source (test) and target (pstu-web-app)...');

  const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
  const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();

  const collections = await sourceConn.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections in test db:`, collections.map(c => c.name));

  for (const col of collections) {
    const name = col.name;
    const docs = await sourceConn.db.collection(name).find({}).toArray();
    if (docs.length === 0) {
      console.log(`  Skipping ${name} (empty)`);
      continue;
    }
    await targetConn.db.collection(name).deleteMany({});
    await targetConn.db.collection(name).insertMany(docs);
    console.log(`  ✓ ${name}: ${docs.length} documents migrated`);
  }

  // Also list what's already in target
  const targetCols = await targetConn.db.listCollections().toArray();
  console.log(`\nTarget (pstu-web-app) now has: ${targetCols.map(c => c.name).join(', ')}`);

  console.log('\nMigration complete!');
  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
};

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
