import { GoogleGenAI } from '@google/genai';
import type { AIProvider, AIAnalyzeResult, AIFixResult } from './aiProvider.js';
import { repoDb } from '../db/database.js';
import * as diffPkg from 'diff';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini';

  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY || repoDb.getSetting('gemini_api_key') || undefined;
  }

  private getModel(): string {
    return process.env.GEMINI_MODEL || repoDb.getSetting('gemini_model') || 'gemini-flash-latest';
  }

  isAvailable(): boolean {
    return Boolean(this.getApiKey());
  }

  private parseJsonResponse(text: string): any {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
    try {
      return JSON.parse(cleaned);
    } catch {
      return {};
    }
  }

  private async callWithModelFallback(
    ai: GoogleGenAI,
    primaryModel: string,
    params: { contents: string; config?: any }
  ) {
    const candidateModels = [
      primaryModel,
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
    ];
    const uniqueModels = [...new Set(candidateModels)];

    let lastError: any;
    for (const model of uniqueModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return { response, usedModel: model };
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} attempt failed: ${err.message}. Trying next candidate...`);
      }
    }
    throw lastError;
  }

  async analyzeRepository(context: {
    repoName: string;
    language: string;
    filesSummary: string;
    staticFindings: any[];
  }): Promise<AIAnalyzeResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = this.getModel();

    const prompt = `You are a Senior Principal Code Reviewer and Security Architect.
Analyze the following repository context and static analysis findings.

Repository: ${context.repoName}
Primary Language: ${context.language}

=== Static Analysis Findings ===
${JSON.stringify(context.staticFindings.slice(0, 30), null, 2)}

=== Key Source Code Files ===
${context.filesSummary}

Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "High-level 2-3 paragraph executive summary of repository health, architectural strengths, and key risks.",
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

Ensure:
1. Every file_path refers to a real file from the repository.
2. Clearly distinguish potential issues from confirmed vulnerabilities.
3. Prioritize high-impact security vulnerabilities and architectural design flaws.
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
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      };
    } catch (err: any) {
      console.error('Gemini analysis error:', err);
      throw new Error(`Gemini API error: ${err.message}`);
    }
  }

  async generateFix(params: {
    issue: any;
    fileContent: string;
    language: string;
  }): Promise<AIFixResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });
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
    const patch = diffPkg.createPatch(
      params.issue.file_path,
      params.fileContent,
      params.fileContent.includes(originalCode)
        ? params.fileContent.replace(originalCode, suggestedCode)
        : params.fileContent,
      'original',
      'suggested'
    );

    return {
      originalCode,
      suggestedCode,
      diff: patch,
      explanation,
    };
  }
}

export const geminiProvider = new GeminiProvider();
