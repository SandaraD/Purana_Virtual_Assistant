const Site = require('../models/siteModel');
const { ChatOpenAI } = require('@langchain/openai');
const nlp = require('compromise'); // Using compromise for NLP

// Initialize OpenAI model
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  maxTokens: 100,
  apiKey: process.env.OPENAI_API_KEY,
});

const processMessage = async (userMessage) => {

  const { number, location, keywords } = parseMessage(userMessage);

  console.log("Parsed Query: ", { number, location, keywords });


  const searchKeywords = keywords.length > 0 ? keywords : ['archaeological', 'site']; 

  const searchQuery = { $and: [] };


  if (location) {
    searchQuery.$and.push({ location: { $regex: location, $options: 'i' } });
  }


  const keywordRegex = searchKeywords.map(keyword => `.*${keyword}.*`).join('|');
  searchQuery.$and.push({
    $or: [
      { name: { $regex: keywordRegex, $options: 'i' } },
      { description: { $regex: keywordRegex, $options: 'i' } }
    ]
  });


  const resultLimit = number ? parseInt(number) : 10;

  console.log("MongoDB Query: ", JSON.stringify(searchQuery));


  const results = await Site.find(searchQuery).limit(resultLimit);

  console.log("MongoDB Results: ", results);

  if (results.length > 0) {
    const siteDetails = results.map(site => (
      `Name: ${site.name}\nLocation: ${site.location}\nSize: ${site.size}\nDescription: ${site.description}`
    )).join('\n\n');

    return {
      source: 'MongoDB',
      response: `Here are the archaeological sites I found:\n\n${siteDetails}`
    };
  }


  return {
    source: 'MongoDB',
    response: "Sorry, I couldn't find any relevant information on that."
  };
};


function parseMessage(message) {
  let number = null;
  let location = null;
  const keywords = [];


  const numMatch = message.match(/\d+/);
  if (numMatch) {
    number = numMatch[0];
  }


  const locationMatch = message.match(/\b(Dambulla|Sigiriya|Colombo)\b/i); 
  if (locationMatch) {
    location = locationMatch[0];
  }


  const doc = nlp(message);
  const extractedKeywords = doc.match('(archaeological|site)').out('text').split(' ').filter(Boolean);

  if (extractedKeywords.length > 0) {
    keywords.push(...extractedKeywords);
  }

  return { number, location, keywords };
}

module.exports = { processMessage };
