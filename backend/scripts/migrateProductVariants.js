// One-time migration: converts each product's flat { price, unit, stock }
// into a variants: [{ unit, price, stock }] array (its only variant to
// start with). Run once after deploying the variants schema change.
// Safe to re-run: products that already have a non-empty variants array
// are skipped.
const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amanspices');
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const products = db.collection('products');

  const cursor = products.find({
    $or: [{ variants: { $exists: false } }, { variants: { $size: 0 } }]
  });

  let migrated = 0;
  let skipped = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();

    if (doc.price === undefined || doc.unit === undefined || doc.stock === undefined) {
      console.warn(`⚠️  Skipping "${doc.name}" (${doc._id}) — missing price/unit/stock, nothing to migrate from`);
      skipped++;
      continue;
    }

    await products.updateOne(
      { _id: doc._id },
      {
        $set: {
          variants: [{ unit: doc.unit, price: doc.price, stock: doc.stock }]
        },
        $unset: { price: '', unit: '', stock: '' }
      }
    );
    migrated++;
  }

  console.log(`✅ Migrated ${migrated} product(s). Skipped ${skipped}.`);
  await mongoose.connection.close();
  console.log('Database connection closed');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
