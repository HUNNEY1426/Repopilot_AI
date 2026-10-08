"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = void 0;
const database_js_1 = require("../db/database.js");
exports.settingsController = {
    getSettings(req, res) {
        const raw = database_js_1.repoDb.getAllSettings();
        const mask = (val) => {
            if (!val)
                return '';
            if (val.length <= 8)
                return '********';
            return `${val.substring(0, 4)}...${val.substring(val.length - 4)}`;
        };
        res.json({
            activeProvider: raw['active_ai_provider'] || 'gemini',
            geminiApiKeyConfigured: Boolean(raw['gemini_api_key'] || process.env.GEMINI_API_KEY),
            geminiApiKeyMasked: mask(raw['gemini_api_key'] || process.env.GEMINI_API_KEY),
            geminiModel: raw['gemini_model'] || 'gemini-2.5-flash',
            openaiApiKeyConfigured: Boolean(raw['openai_api_key'] || process.env.OPENAI_API_KEY),
            openaiApiKeyMasked: mask(raw['openai_api_key'] || process.env.OPENAI_API_KEY),
            openaiModel: raw['openai_model'] || 'gpt-4o-mini',
            githubTokenConfigured: Boolean(raw['github_token'] || process.env.GITHUB_TOKEN),
            githubTokenMasked: mask(raw['github_token'] || process.env.GITHUB_TOKEN),
        });
    },
    updateSettings(req, res) {
        const { activeProvider, geminiApiKey, geminiModel, openaiApiKey, openaiModel, githubToken, } = req.body;
        if (activeProvider)
            database_js_1.repoDb.setSetting('active_ai_provider', activeProvider);
        if (geminiApiKey !== undefined && geminiApiKey !== '')
            database_js_1.repoDb.setSetting('gemini_api_key', geminiApiKey);
        if (geminiModel)
            database_js_1.repoDb.setSetting('gemini_model', geminiModel);
        if (openaiApiKey !== undefined && openaiApiKey !== '')
            database_js_1.repoDb.setSetting('openai_api_key', openaiApiKey);
        if (openaiModel)
            database_js_1.repoDb.setSetting('openai_model', openaiModel);
        if (githubToken !== undefined && githubToken !== '')
            database_js_1.repoDb.setSetting('github_token', githubToken);
        res.json({ success: true, message: 'Settings updated successfully' });
    },
};
