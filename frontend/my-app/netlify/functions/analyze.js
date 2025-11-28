import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { code, language, type } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error("API Key missing");
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "Server configuration error: API Key missing" }) 
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const commonInstruction = `
      You are an expert senior software architect.
      Analyze the following ${language} code.
      Return ONLY a raw JSON object (no markdown formatting, no backticks) with the following structure:
      {
        "detectedLanguage": "${language}",
        "codeAnalysis": ["point 1", "point 2", "point 3"],
        "optimizedCode": "string (the full improved code)"
      }
      Ensure the JSON is valid and strictly follows this format.
    `;

    let prompt = "";
    switch (type) {
      case "review":
        prompt = `${commonInstruction}
        Perform a comprehensive code review. Focus on code quality, best practices, security, and maintainability.
        
        Code to analyze:
        ${code}`;
        break;
      case "debug":
        prompt = `${commonInstruction}
        Debug this code. Find and fix bugs, logical errors, and handle edge cases.
        
        Code to analyze:
        ${code}`;
        break;
      case "optimize":
        prompt = `${commonInstruction}
        Optimize this code. Focus on performance, time complexity, and space complexity.
        
        Code to analyze:
        ${code}`;
        break;
      case "approaches":
        prompt = `${commonInstruction}
        Suggest different approaches or algorithms to solve the same problem.
        
        Code to analyze:
        ${code}`;
        break;
      default:
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: "Invalid analysis type" }) 
        };
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown if present (Gemini often adds ```json ... ```)
    text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

    // Validate JSON
    try {
      JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON received from AI:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI response was not valid JSON", raw: text })
      };
    }

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow CORS for development
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: text,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to analyze code", details: error.message }),
    };
  }
};
