const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  'vendor',
  'tmp',
  'temp',
  '.cache',
  '__pycache__',
  '.pytest_cache',
  'bin',
  'obj',
]);

const IGNORED_EXTENSIONS = new Set([
  '.lock',
  '.lockb',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  '.pdf',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.mp4',
  '.mp3',
  '.wav',
  '.avi',
  '.mov',
  '.map',
  '.min.js',
  '.min.css',
  '.pyc',
  '.class',
  '.jar',
]);

const IGNORED_FILENAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'cargo.lock',
  'gemfile.lock',
  'composer.lock',
  'poetry.lock',
  '.ds_store',
  'thumbs.db',
]);

const SENSITIVE_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /id_rsa/i,
  /\.pem$/i,
  /\.key$/i,
  /\.keystore$/i,
  /\.p12$/i,
  /credentials\.json$/i,
  /service-account.*\.json$/i,
];

export function shouldIgnorePath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const fileName = parts[parts.length - 1].toLowerCase();

  // 1. Directory check
  for (let i = 0; i < parts.length - 1; i++) {
    const dir = parts[i].toLowerCase();
    if (IGNORED_DIRECTORIES.has(dir) || dir.startsWith('.')) {
      if (dir !== '.' && dir !== '..') {
        return true;
      }
    }
  }

  // 2. Exact filename check
  if (IGNORED_FILENAMES.has(fileName)) {
    return true;
  }

  // 3. Extension check
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex !== -1) {
    const ext = fileName.substring(dotIndex).toLowerCase();
    if (IGNORED_EXTENSIONS.has(ext)) {
      return true;
    }
  }

  return false;
}

export function isSensitiveFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const fileName = normalized.split('/').pop() || '';
  return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

export function isSupportedSourceFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const fileName = normalized.split('/').pop() || '';

  const supportedConfigFilenames = new Set([
    '.gitignore',
    '.env.example',
    '.env.sample',
    'sample.env',
    'dockerfile',
    'procfile',
    'license',
    'makefile',
    '.editorconfig',
    '.eslintignore',
    '.prettierignore',
  ]);

  if (supportedConfigFilenames.has(fileName) || fileName.endsWith('.gitignore')) {
    return true;
  }

  const supportedExtensions = [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.mjs',
    '.cjs',
    '.json',
    '.py',
    '.go',
    '.java',
    '.rb',
    '.php',
    '.cs',
    '.cpp',
    '.c',
    '.rs',
    '.md',
    '.yml',
    '.yaml',
    '.toml',
    '.html',
    '.css',
    '.sql',
  ];

  return supportedExtensions.some((ext) => normalized.endsWith(ext));
}

export function isTestFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  return (
    normalized.includes('__tests__') ||
    normalized.includes('/tests/') ||
    normalized.startsWith('tests/') ||
    normalized.includes('/test/') ||
    normalized.startsWith('test/') ||
    normalized.includes('/spec/') ||
    normalized.startsWith('spec/') ||
    /\.(test|spec)\.(js|jsx|ts|tsx|py|go|rb)$/i.test(normalized) ||
    normalized.endsWith('_test.go') ||
    normalized.endsWith('test.py')
  );
}

export function isDocumentationFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const fileName = normalized.split('/').pop() || '';
  return (
    fileName.startsWith('readme') ||
    fileName.startsWith('contributing') ||
    fileName.startsWith('license') ||
    fileName.startsWith('changelog') ||
    fileName.startsWith('code_of_conduct') ||
    normalized.startsWith('docs/') ||
    normalized.includes('/docs/') ||
    fileName.endsWith('.md')
  );
}
