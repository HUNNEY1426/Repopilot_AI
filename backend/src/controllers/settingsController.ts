import type { Request, Response } from 'express';
import { repoDb } from '../db/database.js';

export const settingsController = {
  getSettings(req: Request, res: Response) {
    const raw = repoDb.getAllSettings();
    const mask = (val?: string) => {
      if (!val) return '';
      if (val.length <= 8) return '********';
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

  updateSettings(req: Request, res: Response) {
    const {
      activeProvider,
      geminiApiKey,
      geminiModel,
      openaiApiKey,
      openaiModel,
      githubToken,
    } = req.body;

    if (activeProvider) repoDb.setSetting('active_ai_provider', activeProvider);
    if (geminiApiKey !== undefined && geminiApiKey !== '') repoDb.setSetting('gemini_api_key', geminiApiKey);
    if (geminiModel) repoDb.setSetting('gemini_model', geminiModel);
    if (openaiApiKey !== undefined && openaiApiKey !== '') repoDb.setSetting('openai_api_key', openaiApiKey);
    if (openaiModel) repoDb.setSetting('openai_model', openaiModel);
    if (githubToken !== undefined && githubToken !== '') repoDb.setSetting('github_token', githubToken);

    res.json({ success: true, message: 'Settings updated successfully' });
  },
};
