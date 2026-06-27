const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function checkModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("hello");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Error with gemini-1.5-flash:", error.message);
  }

  try {
    const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result2 = await model2.generateContent("hello");
    console.log("Response (latest):", result2.response.text());
  } catch (error) {
    console.error("Error with gemini-1.5-flash-latest:", error.message);
  }
}

checkModels();
