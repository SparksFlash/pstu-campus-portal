const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// Returns a 768-dim float array for the given text
const getEmbedding = async (text) => {
  const model = getGenAI().getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(String(text).slice(0, 8000));
  return result.embedding.values;
};

// Returns a Gemini chat model instance
const getChatModel = () =>
  getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });

module.exports = { getEmbedding, getChatModel };
