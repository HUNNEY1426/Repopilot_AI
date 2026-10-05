import test from 'node:test';
import assert from 'node:assert';
import { shouldIgnorePath, isSensitiveFile, isSupportedSourceFile, isTestFile } from '../src/utils/fileFilter.js';

test('FileFilter - should ignore vendor and build directories', () => {
  assert.strictEqual(shouldIgnorePath('node_modules/express/index.js'), true);
  assert.strictEqual(shouldIgnorePath('dist/bundle.js'), true);
  assert.strictEqual(shouldIgnorePath('.git/config'), true);
  assert.strictEqual(shouldIgnorePath('package-lock.json'), true);
  assert.strictEqual(shouldIgnorePath('image.png'), true);
  assert.strictEqual(shouldIgnorePath('src/controllers/userController.js'), false);
  assert.strictEqual(shouldIgnorePath('server.js'), false);
  assert.strictEqual(shouldIgnorePath('README.md'), false);
});

test('FileFilter - should detect sensitive configuration files', () => {
  assert.strictEqual(isSensitiveFile('.env'), true);
  assert.strictEqual(isSensitiveFile('.env.production'), true);
  assert.strictEqual(isSensitiveFile('server.key'), true);
  assert.strictEqual(isSensitiveFile('server.js'), false);
});

test('FileFilter - should identify supported source files', () => {
  assert.strictEqual(isSupportedSourceFile('server.js'), true);
  assert.strictEqual(isSupportedSourceFile('src/index.ts'), true);
  assert.strictEqual(isSupportedSourceFile('package.json'), true);
  assert.strictEqual(isSupportedSourceFile('.gitignore'), true);
  assert.strictEqual(isSupportedSourceFile('.env.example'), true);
  assert.strictEqual(isSupportedSourceFile('binary.exe'), false);
});

test('FileFilter - should identify test files', () => {
  assert.strictEqual(isTestFile('tests/user.test.js'), true);
  assert.strictEqual(isTestFile('src/__tests__/auth.spec.ts'), true);
  assert.strictEqual(isTestFile('src/services/userService.ts'), false);
});
