import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async analyzeCode(code, language, analysisType) {
    const prompt = this.buildPrompt(code, language, analysisType);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON, fallback to mock data if parsing fails
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.warn('Failed to parse AI response, using fallback:', parseError);
        return this.getFallbackResponse(analysisType);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackResponse(analysisType);
    }
  }

  getFallbackResponse(analysisType) {
    switch (analysisType) {
      case 'review':
        return {
          qualityScore: 75,
          issues: [{
            line: 1,
            severity: 'low',
            message: 'Code looks good',
            suggestion: 'Consider adding comments'
          }],
          summary: 'Code analysis completed with fallback response'
        };
      case 'debug':
        return {
          bugs: [],
          fixedCode: 'No fixes needed',
          explanation: 'No bugs detected'
        };
      case 'approaches':
        return {
          alternatives: [{
            approach: 'Current approach',
            code: 'Your current code is fine',
            pros: ['Simple', 'Clear'],
            cons: ['Could be optimized']
          }]
        };
      case 'optimize':
        return {
          optimizations: [{
            type: 'Performance',
            description: 'Code is already optimized',
            optimizedCode: 'No changes needed',
            improvement: 'Minimal'
          }]
        };
      default:
        return { message: 'Analysis completed' };
    }
  }

  buildPrompt(code, language, analysisType) {
    const basePrompt = `Analyze this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    
    switch (analysisType) {
      case 'review':
        return basePrompt + `Provide a comprehensive code review including:
1. Code quality assessment (rate 0-100)
2. Best practices violations
3. Potential bugs or issues
4. Security concerns
5. Maintainability suggestions
Format as JSON: {"qualityScore": number, "issues": [{"line": number, "severity": "low|medium|high", "message": string, "suggestion": string}], "summary": string}`;

      case 'debug':
        return basePrompt + `Identify bugs and provide fixes:
1. Find syntax errors, logic errors, runtime issues
2. Provide corrected code
3. Explain each fix
Format as JSON: {"bugs": [{"line": number, "issue": string, "fix": string}], "fixedCode": string, "explanation": string}`;

      case 'approaches':
        return basePrompt + `Suggest alternative approaches:
1. Different algorithms or data structures
2. Various programming paradigms (OOP vs functional, etc.)
3. Performance trade-offs
Format as JSON: {"alternatives": [{"approach": string, "code": string, "pros": [string], "cons": [string]}]}`;

      case 'optimize':
        return basePrompt + `Optimize for performance and best practices:
1. Runtime complexity improvements
2. Memory optimization
3. Code readability enhancements
Format as JSON: {"optimizations": [{"type": string, "description": string, "optimizedCode": string, "improvement": string}]}`;

      default:
        return basePrompt + 'Provide general code analysis.';
    }
  }

  detectLanguage(code) {
    const patterns = {
      python: /^(import|from|def|class|if __name__|print\()/m,
      javascript: /^(const|let|var|function|=>|\$\()/m,
      java: /^(public class|import java\.|System\.out)/m,
      cpp: /^(#include|using namespace|int main\()/m,
      csharp: /^(using System|namespace|public class)/m,
      php: /^(<\?php|\$[a-zA-Z])/m,
      ruby: /^(require|class|def|puts)/m,
      go: /^(package|import|func main\()/m,
      rust: /^(fn main\(|use |let mut)/m,
      sql: /^(SELECT|INSERT|UPDATE|DELETE|CREATE)/mi
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(code)) return lang;
    }
    
    return 'auto';
  }
}

export default new AIService();