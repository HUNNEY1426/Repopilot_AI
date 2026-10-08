"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiProvider = exports.GeminiProvider = void 0;
const genai_1 = require("@google/genai");
const database_js_1 = require("../db/database.js");
const diffPkg = __importStar(require("diff"));
class GeminiProvider {
    name = 'Google Gemini';
    getApiKey() {
        return process.env.GEMINI_API_KEY || database_js_1.repoDb.getSetting('gemini_api_key') || undefined;
    }
    getModel() {
        return process.env.GEMINI_MODEL || database_js_1.repoDb.getSetting('gemini_model') || 'gemini-2.5-flash';
    }
    isAvailable() {
        return Boolean(this.getApiKey());
    }
    parseJsonResponse(text) {
        const cleaned = text
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '');
        try {
            return JSON.parse(cleaned);
        }
        catch {
            return {};
        }
    }
    async callWithModelFallback(ai, primaryModel, params) {
        const candidateModels = [
            primaryModel,
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-2.5-pro',
            'gemini-1.5-pro',
        ];
        const uniqueModels = [...new Set(candidateModels)];
        let lastError;
        for (const model of uniqueModels) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: params.contents,
                    config: params.config,
                });
                return { response, usedModel: model };
            }
            catch (err) {
                lastError = err;
                console.warn(`Model ${model} attempt failed: ${err.message}. Trying next candidate...`);
            }
        }
        throw lastError;
    }
    async analyzeRepository(context) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Gemini API key is not configured.');
        }
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const model = this.getModel();
        const prompt = `You are a Senior Principal Code Reviewer and Security Architect.
Analyze the following repository context and static analysis findings.

Repository: ${context.repoName}
Primary Language: ${context.language}

=== Static Analysis Findings ===
${JSON.stringify(context.staticFindings.slice(0, 30), null, 2)}

=== Key Source Code Files ===
${context.filesSummary}

Perform a rigorous, calibrated multi-dimensional assessment of this codebase.
Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Detailed multi-paragraph executive assessment of repository health, architectural design, security posture, and maintainability.",
  "scores": {
    "overall": 75,
    "security": 80,
    "codeQuality": 70,
    "testing": 40,
    "architecture": 85,
    "documentation": 60,
    "maintainability": 70,
    "dependencies": 85
  },
  "strengths": [
    "Key architectural or technical strength 1",
    "Key architectural or technical strength 2",
    "Key architectural or technical strength 3"
  ],
  "weaknesses": [
    "Key risk or weakness 1",
    "Key risk or weakness 2",
    "Key risk or weakness 3"
  ],
  "recommendations": [
    "Actionable strategic recommendation 1",
    "Actionable strategic recommendation 2",
    "Actionable strategic recommendation 3"
  ],
  "issues": [
    {
      "category": "security" | "quality" | "testing" | "architecture" | "documentation" | "dependencies",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "title": "Clear concise issue title",
      "description": "Detailed explanation of why this is a problem and its impact",
      "file_path": "path/to/existing/file",
      "line_number": 1,
      "code_snippet": "exact or relevant code snippet",
      "recommendation": "Concrete actionable steps to fix the issue"
    }
  ]
}

Score calibration rules (0-100 scale, must be integers):
- overall: Comprehensive quality & health score.
- security: Calibrate based on secrets, sanitization, shell execution risks, CORS.
- codeQuality: Calibrate based on cyclomatic complexity, modularity, error handling.
- testing: Calibrate based on tests presence and critical path coverage.
- architecture: Separation of concerns, modularity, layered design.
- documentation: README quality, setup guides, API reference.
- maintainability: Long-term extensibility and readability.
- dependencies: Up-to-date and pinned dependencies.
`;
        try {
            const { response, usedModel } = await this.callWithModelFallback(ai, model, {
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.2,
                },
            });
            console.log(`[GeminiProvider] Analysis generated using model: ${usedModel}`);
            const parsed = this.parseJsonResponse(response.text || '{}');
            return {
                summary: parsed.summary || 'AI Review completed successfully.',
                scores: parsed.scores,
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                issues: Array.isArray(parsed.issues) ? parsed.issues : [],
            };
        }
        catch (err) {
            console.error('Gemini analysis error:', err);
            throw new Error(`Gemini API error: ${err.message}`);
        }
    }
    async generateFix(params) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Gemini API key is not configured.');
        }
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const model = this.getModel();
        const prompt = `You are an expert software engineer fixing an issue in a codebase.

Issue:
Category: ${params.issue.category}
Title: ${params.issue.title}
Description: ${params.issue.description}
File: ${params.issue.file_path}
Line: ${params.issue.line_number}
Recommendation: ${params.issue.recommendation}

Target File Content:
\`\`\`${params.language}
${params.fileContent}
\`\`\`

Generate a precise fix for this file.
Respond ONLY with a JSON object in this format:
{
  "originalCode": "The exact original lines of code that should be replaced",
  "suggestedCode": "The new replacement lines of code",
  "explanation": "Clear explanation of the fix and why it safely resolves the issue."
}

Do NOT rewrite the whole file if only a few lines need changing.
Ensure the originalCode string EXACTLY matches a substring in the target file content so a patch can be applied cleanly.
`;
        const { response, usedModel } = await this.callWithModelFallback(ai, model, {
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.1,
            },
        });
        console.log(`[GeminiProvider] Fix generated using model: ${usedModel}`);
        const parsed = this.parseJsonResponse(response.text || '{}');
        const originalCode = parsed.originalCode || '';
        const suggestedCode = parsed.suggestedCode || '';
        const explanation = parsed.explanation || 'Fix generated by Gemini.';
        // Generate unified diff
        const patch = diffPkg.createPatch(params.issue.file_path, params.fileContent, params.fileContent.includes(originalCode)
            ? params.fileContent.replace(originalCode, suggestedCode)
            : params.fileContent, 'original', 'suggested');
        return {
            originalCode,
            suggestedCode,
            diff: patch,
            explanation,
        };
    }
}
exports.GeminiProvider = GeminiProvider;
exports.geminiProvider = new GeminiProvider();
