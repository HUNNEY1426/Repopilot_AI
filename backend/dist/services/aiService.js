"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const geminiProvider_js_1 = require("../providers/geminiProvider.js");
const openaiProvider_js_1 = require("../providers/openaiProvider.js");
const fallbackProvider_js_1 = require("../providers/fallbackProvider.js");
const database_js_1 = require("../db/database.js");
class AIService {
    getActiveProvider() {
        const configured = database_js_1.repoDb.getSetting('active_ai_provider');
        if (configured === 'gemini' && geminiProvider_js_1.geminiProvider.isAvailable()) {
            return geminiProvider_js_1.geminiProvider;
        }
        if (configured === 'openai' && openaiProvider_js_1.openAIProvider.isAvailable()) {
            return openaiProvider_js_1.openAIProvider;
        }
        // Auto-detect based on available keys
        if (geminiProvider_js_1.geminiProvider.isAvailable()) {
            return geminiProvider_js_1.geminiProvider;
        }
        if (openaiProvider_js_1.openAIProvider.isAvailable()) {
            return openaiProvider_js_1.openAIProvider;
        }
        return fallbackProvider_js_1.fallbackProvider;
    }
    async reviewRepository(params) {
        const provider = this.getActiveProvider();
        // Prepare files summary (truncate large files for token safety)
        const filesSummary = params.files
            .slice(0, 15)
            .map((f) => {
            const preview = f.content.length > 2500 ? f.content.substring(0, 2500) + '\n... [truncated]' : f.content;
            return `--- File: ${f.path} ---\n${preview}`;
        })
            .join('\n\n');
        let aiResult;
        try {
            aiResult = await provider.analyzeRepository({
                repoName: params.repoName,
                language: params.language,
                filesSummary,
                staticFindings: params.staticFindings,
            });
        }
        catch (err) {
            console.warn(`Primary AI provider (${provider.name}) failed, falling back to Intelligent Rule Engine:`, err);
            aiResult = await fallbackProvider_js_1.fallbackProvider.analyzeRepository({
                repoName: params.repoName,
                language: params.language,
                filesSummary,
                staticFindings: params.staticFindings,
            });
        }
        // Combine static findings and AI findings, applying Hallucination Protection
        const validIssues = [];
        const filesMap = new Map();
        for (const f of params.files) {
            filesMap.set(f.path.toLowerCase(), f);
        }
        // 1. First add validated static findings
        for (const sf of params.staticFindings) {
            validIssues.push({
                category: sf.category,
                severity: sf.severity,
                title: sf.title,
                description: sf.description,
                file_path: sf.file,
                line_number: sf.line,
                code_snippet: sf.codeSnippet,
                recommendation: sf.recommendation,
            });
        }
        // 2. Add AI issues if they pass hallucination checks
        for (const aiIssue of aiResult.issues || []) {
            const lowerPath = (aiIssue.file_path || '').toLowerCase();
            // Hallucination check 1: File must exist in repo (or be a recognized project file like README)
            const matchedFile = filesMap.get(lowerPath);
            if (!matchedFile && lowerPath !== 'readme.md' && lowerPath !== '.gitignore' && lowerPath !== 'package.json') {
                console.warn(`AI Hallucination rejected: File ${aiIssue.file_path} does not exist in repo.`);
                continue;
            }
            // Hallucination check 2: Deduplicate if static analyzer already found the same problem on the same file/line
            const isDuplicate = validIssues.some((v) => v.file_path.toLowerCase() === lowerPath &&
                (Math.abs(v.line_number - (aiIssue.line_number || 1)) <= 3 || v.title.toLowerCase() === aiIssue.title.toLowerCase()));
            if (!isDuplicate) {
                validIssues.push({
                    category: aiIssue.category || 'quality',
                    severity: aiIssue.severity || 'medium',
                    title: aiIssue.title,
                    description: aiIssue.description,
                    file_path: aiIssue.file_path,
                    line_number: Math.max(1, aiIssue.line_number || 1),
                    code_snippet: aiIssue.code_snippet || '',
                    recommendation: aiIssue.recommendation,
                });
            }
        }
        return {
            summary: aiResult.summary,
            scores: aiResult.scores,
            strengths: aiResult.strengths,
            weaknesses: aiResult.weaknesses,
            recommendations: aiResult.recommendations,
            issues: validIssues,
            providerName: provider.name,
        };
    }
    async generateFix(params) {
        const provider = this.getActiveProvider();
        try {
            return await provider.generateFix({
                issue: params.issue,
                fileContent: params.fileContent,
                language: params.language,
            });
        }
        catch (err) {
            console.warn(`Primary fix provider failed, using fallback:`, err);
            return await fallbackProvider_js_1.fallbackProvider.generateFix({
                issue: params.issue,
                fileContent: params.fileContent,
                language: params.language,
            });
        }
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
