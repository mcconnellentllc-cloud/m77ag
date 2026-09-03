// Drop stale indexes left on the users collection by earlier schema versions.
// Run with: npm run fix:user-indexes
//
// The users collection carries a unique index on "username", a field the User
// model no longer defines. Every account is therefore written with username
// null, and the second such account fails with:
//   E11000 duplicate key error collection: m77ag.users index: username_1
// The index serves nothing now, so it is dropped.
require('dotenv').config();

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Indexes on fields the current User schema does not define
const STALE_INDEXES = ['username_1'];

(async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Set it and run again.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const collection = mongoose.connection.db.collection('users');
  const indexes = await collection.indexes();

  console.log('Current indexes on users:');
  indexes.forEach(index => console.log(`  ${index.name}  ${JSON.stringify(index.key)}${index.unique ? '  (unique)' : ''}`));
  console.log('');

  let dropped = 0;
  for (const name of STALE_INDEXES) {
    if (!indexes.some(index => index.name === name)) {
      console.log(`${name}: not present, nothing to do`);
      continue;
    }

    await collection.dropIndex(name);
    dropped++;
    console.log(`${name}: dropped`);
  }

  // Clear the leftover null field so the documents match the current schema
  if (dropped) {
    const result = await collection.updateMany(
      { username: { $exists: true } },
      { $unset: { username: '' } }
    );
    console.log(`\nRemoved the unused username field from ${result.modifiedCount} account(s)`);
  }

  console.log(`\nDone. ${dropped} stale index(es) dropped.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (error) => {
  console.error('Failed to fix user indexes:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
