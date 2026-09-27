import test from 'node:test';
import assert from 'node:assert';
import { diffService } from '../src/services/diffService.js';

test('DiffService - creates unified diff and validates patch application', () => {
  const original = `const PORT = 3000;\nconst SECRET = "secret123";\napp.listen(PORT);`;
  const originalSnippet = `const SECRET = "secret123";`;
  const suggestedSnippet = `const SECRET = process.env.APP_SECRET;`;

  const validation = diffService.validateAndApplyPatch(
    original,
    originalSnippet,
    suggestedSnippet,
    'server.js'
  );

  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(validation.syntaxValid, true);
  assert.ok(validation.diff.includes('-const SECRET = "secret123";'));
  assert.ok(validation.diff.includes('+const SECRET = process.env.APP_SECRET;'));
  assert.ok(validation.patchedContent.includes('process.env.APP_SECRET'));
});

test('DiffService - rejects mismatched context', () => {
  const original = `const PORT = 3000;`;
  const wrongSnippet = `const OTHER = 4000;`;

  const validation = diffService.validateAndApplyPatch(
    original,
    wrongSnippet,
    'const NEW = 5000;',
    'server.js'
  );

  assert.strictEqual(validation.isValid, false);
  assert.ok(validation.error?.includes('does not match'));
});
