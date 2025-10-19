const { MongoClient } = require('mongodb');

async function migratePausedDuration() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-tracker';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('studysessions');

    // Update all documents that don't have pausedDuration field
    const result = await collection.updateMany(
      { pausedDuration: { $exists: false } },
      { $set: { pausedDuration: 0 } }
    );

    console.log(`Updated ${result.modifiedCount} documents with pausedDuration: 0`);

    // Also update any documents where pausedDuration is null
    const nullResult = await collection.updateMany(
      { pausedDuration: null },
      { $set: { pausedDuration: 0 } }
    );

    console.log(`Updated ${nullResult.modifiedCount} documents with null pausedDuration`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migratePausedDuration();