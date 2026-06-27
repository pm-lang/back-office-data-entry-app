const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const modelsToTest = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash-lite-001"
];

async function testModels() {
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Respond with exactly the word 'OK'");
      console.log(`[SUCCESS] ${modelName}:`, result.response.text());
    } catch (error) {
      console.error(`[ERROR] ${modelName}:`, error.message);
    }
  }
}

testModels();
