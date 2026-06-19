const Groq = require('groq-sdk');

let groqClient = null;

const getGroq = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

// Generate a chat response using Groq (llama-3.3-70b-versatile)
const groqChat = async (systemPrompt, userMessage) => {
  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return completion.choices[0].message.content;
};

module.exports = { groqChat };
