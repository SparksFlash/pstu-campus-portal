/**
 * One-time script: embed all existing notices and courses that don't have an embedding yet.
 * Run with: node server/scripts/embedExisting.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Notice   = require('../models/Notice');
const Course   = require('../models/Course');
const { getEmbedding } = require('../utils/embeddings');
const { connectDatabase } = require('../config/database');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function embedCollection(Model, textFn, label) {
  // select: false bypass — use lean + projection
  const docs = await Model.collection.find({ embedding: { $exists: false } }).toArray();
  console.log(`[${label}] ${docs.length} documents to embed`);

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    try {
      const text = textFn(doc);
      const vec  = await getEmbedding(text);
      await Model.collection.updateOne({ _id: doc._id }, { $set: { embedding: vec } });
      console.log(`  ✓ [${i + 1}/${docs.length}] ${doc.title || doc.code}`);
      await sleep(300); // stay within free-tier rate limits
    } catch (err) {
      console.error(`  ✗ ${doc._id}: ${err.message}`);
      await sleep(1000);
    }
  }
}

(async () => {
  await connectDatabase();

  await embedCollection(
    Notice,
    d => `${d.title}. ${d.content}`,
    'Notices'
  );

  await embedCollection(
    Course,
    d => `Course: ${d.code} - ${d.title}. Semester: ${d.semester}. ${d.description || ''}`,
    'Courses'
  );

  console.log('\nAll done! Now create Atlas Vector Search indexes:');
  console.log('  Collection: notices  → Index name: notice_vector_index');
  console.log('  Collection: courses  → Index name: course_vector_index');
  console.log('  numDimensions: 768, similarity: cosine, path: embedding');
  mongoose.disconnect();
})();
