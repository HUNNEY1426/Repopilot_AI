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
exports.diffService = exports.DiffService = void 0;
const diffPkg = __importStar(require("diff"));
class DiffService {
    createUnifiedDiff(filePath, originalContent, suggestedContent) {
        return diffPkg.createPatch(filePath, originalContent, suggestedContent, 'original', 'suggested');
    }
    validateAndApplyPatch(originalContent, originalSnippet, suggestedSnippet, filePath) {
        // 1. Context matching check
        if (!originalSnippet || !originalContent.includes(originalSnippet)) {
            // Try relaxed whitespace matching
            const normalizedOriginal = originalContent.replace(/\r\n/g, '\n');
            const normalizedSnippet = originalSnippet.replace(/\r\n/g, '\n').trim();
            if (!normalizedOriginal.includes(normalizedSnippet)) {
                return {
                    isValid: false,
                    error: 'Original code snippet does not match target file content.',
                    patchedContent: originalContent,
                    diff: '',
                    syntaxValid: false,
                };
            }
        }
        // 2. Apply patch in memory
        const patchedContent = originalContent.replace(originalSnippet, suggestedSnippet);
        // 3. Syntax validation for JS/TS/JSON
        let syntaxValid = true;
        let syntaxError;
        if (filePath.endsWith('.json')) {
            try {
                JSON.parse(patchedContent);
            }
            catch (e) {
                syntaxValid = false;
                syntaxError = `Invalid JSON syntax: ${e.message}`;
            }
        }
        else if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs')) {
            try {
                // Quick syntax parse via Function constructor (without executing)
                new Function(patchedContent);
            }
            catch (e) {
                // Function constructor may not support import/export statements in ES modules, so only flag severe syntax error
                if (e.name === 'SyntaxError' && !e.message.includes('import') && !e.message.includes('export')) {
                    syntaxValid = false;
                    syntaxError = `JavaScript syntax error: ${e.message}`;
                }
            }
        }
        const diff = this.createUnifiedDiff(filePath, originalContent, patchedContent);
        return {
            isValid: syntaxValid,
            error: syntaxError,
            patchedContent,
            diff,
            syntaxValid,
        };
    }
}
exports.DiffService = DiffService;
exports.diffService = new DiffService();
