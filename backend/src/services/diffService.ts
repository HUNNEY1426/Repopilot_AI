import * as diffPkg from 'diff';

export interface PatchValidationResult {
  isValid: boolean;
  error?: string;
  patchedContent: string;
  diff: string;
  syntaxValid: boolean;
}

export class DiffService {
  createUnifiedDiff(
    filePath: string,
    originalContent: string,
    suggestedContent: string
  ): string {
    return diffPkg.createPatch(
      filePath,
      originalContent,
      suggestedContent,
      'original',
      'suggested'
    );
  }

  validateAndApplyPatch(
    originalContent: string,
    originalSnippet: string,
    suggestedSnippet: string,
    filePath: string
  ): PatchValidationResult {
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
    let syntaxError: string | undefined;

    if (filePath.endsWith('.json')) {
      try {
        JSON.parse(patchedContent);
      } catch (e: any) {
        syntaxValid = false;
        syntaxError = `Invalid JSON syntax: ${e.message}`;
      }
    } else if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs')) {
      try {
        // Quick syntax parse via Function constructor (without executing)
        new Function(patchedContent);
      } catch (e: any) {
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

export const diffService = new DiffService();
