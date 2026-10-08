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
exports.openAIProvider = exports.OpenAIProvider = void 0;
const database_js_1 = require("../db/database.js");
const diffPkg = __importStar(require("diff"));
class OpenAIProvider {
    name = 'OpenAI / Compatible';
    getApiKey() {
        return database_js_1.repoDb.getSetting('openai_api_key') || process.env.OPENAI_API_KEY || undefined;
    }
    getBaseUrl() {
        return database_js_1.repoDb.getSetting('openai_base_url') || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    }
    getModel() {
        return database_js_1.repoDb.getSetting('openai_model') || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }
    isAvailable() {
        return Boolean(this.getApiKey());
    }
    async analyzeRepository(context) {
        const apiKey = this.getApiKey();
        if (!apiKey)
            throw new Error('OpenAI API key is not configured.');
        const prompt = `You are a Principal Code Reviewer and Security Architect.
Analyze the following repository context and static analysis findings.

Repository: ${context.repoName}
Primary Language: ${context.language}

=== Static Findings ===
${JSON.stringify(context.staticFindings, null, 2)}

=== Source Files ===
${context.filesSummary}

Respond in JSON matching schema:
{
  "summary": "High-level summary of code quality, architecture, security, and maintainability",
  "issues": [
    {
      "category": "security" | "quality" | "testing" | "architecture" | "documentation" | "dependencies",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "title": "Clear concise issue title",
      "description": "Detailed explanation of problem and impact",
      "file_path": "path/to/file",
      "line_number": 1,
      "code_snippet": "code snippet",
      "recommendation": "Actionable solution"
    }
  ]
}`;
        const res = await fetch(`${this.getBaseUrl()}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: this.getModel(),
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.2,
            }),
        });
        if (!res.ok) {
            throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
        }
        const data = (await res.json());
        const content = data.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        return {
            summary: parsed.summary || 'OpenAI Analysis completed.',
            issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        };
    }
    async generateFix(params) {
        const apiKey = this.getApiKey();
        if (!apiKey)
            throw new Error('OpenAI API key is not configured.');
        const prompt = `Fix the following code issue:
Issue: ${params.issue.title}
Description: ${params.issue.description}
File: ${params.issue.file_path}
Recommendation: ${params.issue.recommendation}

Content:
${params.fileContent}

Respond in JSON format:
{
  "originalCode": "exact substring to replace",
  "suggestedCode": "replacement code",
  "explanation": "explanation of fix"
}`;
        const res = await fetch(`${this.getBaseUrl()}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: this.getModel(),
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            }),
        });
        if (!res.ok) {
            throw new Error(`OpenAI API error: ${res.status}`);
        }
        const data = (await res.json());
        const parsed = JSON.parse(data.choices[0]?.message?.content || '{}');
        const originalCode = parsed.originalCode || '';
        const suggestedCode = parsed.suggestedCode || '';
        const patch = diffPkg.createPatch(params.issue.file_path, params.fileContent, params.fileContent.includes(originalCode)
            ? params.fileContent.replace(originalCode, suggestedCode)
            : params.fileContent, 'original', 'suggested');
        return {
            originalCode,
            suggestedCode,
            diff: patch,
            explanation: parsed.explanation || 'Fix generated by OpenAI.',
        };
    }
}
exports.OpenAIProvider = OpenAIProvider;
exports.openAIProvider = new OpenAIProvider();
