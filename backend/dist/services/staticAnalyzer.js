"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticAnalyzer = exports.StaticAnalyzer = void 0;
const fileFilter_js_1 = require("../utils/fileFilter.js");
class StaticAnalyzer {
    analyze(files, tree) {
        const findings = [];
        let totalLinesAnalyzed = 0;
        let functionsAnalyzed = 0;
        let qualityIssuesCount = 0;
        let vulnerabilitiesDetected = 0;
        let testFilesCount = 0;
        let docFilesCount = 0;
        let hasReadme = false;
        let hasEnvExample = false;
        let hasGitignore = false;
        let gitignoreIgnoresEnv = false;
        let dependenciesCount = 0;
        let detectedFramework = 'None';
        const sourceFiles = files.filter((f) => !(0, fileFilter_js_1.isTestFile)(f.path) && !(0, fileFilter_js_1.isDocumentationFile)(f.path));
        const testedAreas = new Set();
        const criticalAreasPresent = new Set();
        // 0. Preliminary inspection of full repository tree (if provided)
        if (tree && Array.isArray(tree)) {
            for (const node of tree) {
                const lowerPath = node.path.toLowerCase();
                const baseName = lowerPath.split('/').pop() || '';
                if (baseName === '.gitignore') {
                    hasGitignore = true;
                    // Assume it excludes .env unless inspection of fetched content proves otherwise
                    gitignoreIgnoresEnv = true;
                }
                if (baseName === '.env.example' || baseName === '.env.sample' || baseName === 'sample.env') {
                    hasEnvExample = true;
                }
                if (baseName.startsWith('readme')) {
                    hasReadme = true;
                }
                if ((0, fileFilter_js_1.isTestFile)(node.path)) {
                    testFilesCount++;
                }
                if ((0, fileFilter_js_1.isDocumentationFile)(node.path)) {
                    docFilesCount++;
                }
            }
        }
        // 1. First pass: detect global files (.gitignore, .env.example, README, package.json)
        for (const file of files) {
            const lowerPath = file.path.toLowerCase();
            const baseName = lowerPath.split('/').pop() || '';
            if (baseName === '.gitignore') {
                hasGitignore = true;
                gitignoreIgnoresEnv = file.content.includes('.env');
            }
            if (baseName === '.env.example' || baseName === '.env.sample' || baseName === 'sample.env') {
                hasEnvExample = true;
            }
            if (baseName.startsWith('readme')) {
                hasReadme = true;
            }
            if ((0, fileFilter_js_1.isTestFile)(file.path)) {
                if (!tree)
                    testFilesCount++;
                // track tested area
                if (lowerPath.includes('auth'))
                    testedAreas.add('Authentication');
                if (lowerPath.includes('user'))
                    testedAreas.add('User Controller');
                if (lowerPath.includes('pay') || lowerPath.includes('checkout'))
                    testedAreas.add('Payments');
                if (lowerPath.includes('order'))
                    testedAreas.add('Orders');
            }
            if ((0, fileFilter_js_1.isDocumentationFile)(file.path) && !tree) {
                docFilesCount++;
            }
        }
        // 2. Dependency Analysis (package.json)
        const packageJsonFile = files.find((f) => f.path.toLowerCase() === 'package.json');
        if (packageJsonFile) {
            try {
                const pkg = JSON.parse(packageJsonFile.content);
                const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
                dependenciesCount = Object.keys(deps).length;
                // Check testing framework
                if (deps.jest)
                    detectedFramework = 'Jest';
                else if (deps.vitest)
                    detectedFramework = 'Vitest';
                else if (deps.mocha)
                    detectedFramework = 'Mocha';
                else if (deps.jasmine)
                    detectedFramework = 'Jasmine';
                else if (deps['@playwright/test'])
                    detectedFramework = 'Playwright';
                // Check for deprecated/risky dependencies
                if (deps.request) {
                    findings.push({
                        ruleId: 'DEP-001',
                        category: 'dependencies',
                        severity: 'medium',
                        title: 'Deprecated "request" library used',
                        description: 'The "request" HTTP client has been deprecated since 2020 and does not receive security fixes.',
                        file: packageJsonFile.path,
                        line: 1,
                        codeSnippet: '"request": "' + deps.request + '"',
                        recommendation: 'Replace "request" with native "fetch" or "axios".',
                    });
                }
                if (deps.crypto) {
                    findings.push({
                        ruleId: 'DEP-002',
                        category: 'dependencies',
                        severity: 'high',
                        title: 'Suspicious / redundant "crypto" npm package',
                        description: 'The npm package "crypto" is an obsolete third-party placeholder. Node.js provides native "node:crypto".',
                        file: packageJsonFile.path,
                        line: 1,
                        codeSnippet: '"crypto": "' + deps.crypto + '"',
                        recommendation: 'Remove "crypto" from dependencies and use built-in require("node:crypto").',
                    });
                }
                // Check for wildcard / loose versions
                for (const [depName, version] of Object.entries(deps)) {
                    if (typeof version === 'string' && (version === '*' || version === 'latest')) {
                        findings.push({
                            ruleId: 'DEP-003',
                            category: 'dependencies',
                            severity: 'low',
                            title: `Unpinned dependency version for "${depName}"`,
                            description: `Dependency "${depName}" is pinned to "${version}", which can lead to unpredictable builds and supply-chain vulnerabilities.`,
                            file: packageJsonFile.path,
                            line: 1,
                            codeSnippet: `"${depName}": "${version}"`,
                            recommendation: `Pin "${depName}" to an explicit semantic version (e.g. ^1.2.0).`,
                        });
                    }
                }
            }
            catch (e) {
                // ignore parse error
            }
        }
        // 3. Environment & Documentation Checks
        if (!hasGitignore || !gitignoreIgnoresEnv) {
            findings.push({
                ruleId: 'ENV-001',
                category: 'security',
                severity: 'high',
                title: !hasGitignore ? 'Missing .gitignore file' : '.gitignore does not exclude .env files',
                description: !hasGitignore
                    ? 'Repository is missing a .gitignore file, which risks accidentally committing node_modules, build artifacts, and secret credentials.'
                    : 'Repository .gitignore is present but does not include ".env", which risks accidentally committing secret credentials.',
                file: hasGitignore ? '.gitignore' : 'README.md',
                line: 1,
                codeSnippet: hasGitignore ? '# Missing .env in .gitignore' : '# No .gitignore found',
                recommendation: 'Add ".env" and ".env.*.local" to your .gitignore file immediately.',
            });
        }
        if (!hasReadme) {
            findings.push({
                ruleId: 'DOC-001',
                category: 'documentation',
                severity: 'high',
                title: 'Missing README.md file',
                description: 'The repository lacks a README file explaining what the project does and how to run it.',
                file: 'README.md',
                line: 1,
                codeSnippet: 'N/A',
                recommendation: 'Create a comprehensive README.md with Overview, Getting Started, and API documentation.',
            });
        }
        else {
            const readmeFile = files.find((f) => f.path.toLowerCase().startsWith('readme'));
            if (readmeFile) {
                const lowerContent = readmeFile.content.toLowerCase();
                if (!lowerContent.includes('install') && !lowerContent.includes('run') && !lowerContent.includes('start')) {
                    findings.push({
                        ruleId: 'DOC-002',
                        category: 'documentation',
                        severity: 'medium',
                        title: 'README missing setup and installation guide',
                        description: 'The README file does not provide instructions on how to install or run the application.',
                        file: readmeFile.path,
                        line: 1,
                        codeSnippet: readmeFile.content.substring(0, 100),
                        recommendation: 'Add an "Installation" and "Running the project" section to README.md.',
                    });
                }
                if (!hasEnvExample && !lowerContent.includes('env')) {
                    findings.push({
                        ruleId: 'DOC-003',
                        category: 'documentation',
                        severity: 'low',
                        title: 'Missing environment variables documentation or .env.example',
                        description: 'No .env.example was found and README lacks environment variable configuration details.',
                        file: readmeFile.path,
                        line: 1,
                        codeSnippet: '# Missing environment variable setup',
                        recommendation: 'Provide a .env.example file and document required environment variables.',
                    });
                }
            }
        }
        // 4. Source Code Analysis
        for (const file of files) {
            if ((0, fileFilter_js_1.isDocumentationFile)(file.path))
                continue;
            const lines = file.content.split('\n');
            totalLinesAnalyzed += lines.length;
            // Track critical areas
            const lower = file.path.toLowerCase();
            if (lower.includes('auth'))
                criticalAreasPresent.add('Authentication');
            if (lower.includes('user'))
                criticalAreasPresent.add('User Controller');
            if (lower.includes('pay') || lower.includes('checkout'))
                criticalAreasPresent.add('Payments');
            if (lower.includes('order'))
                criticalAreasPresent.add('Orders');
            // Check Large File (> 300 lines)
            if (lines.length > 300) {
                findings.push({
                    ruleId: 'QUAL-001',
                    category: 'quality',
                    severity: 'medium',
                    title: `Large source file (${lines.length} lines)`,
                    description: `File "${file.path}" has ${lines.length} lines. Very large files often violate the Single Responsibility Principle and become difficult to maintain.`,
                    file: file.path,
                    line: 1,
                    codeSnippet: lines.slice(0, 5).join('\n'),
                    recommendation: 'Split this file into smaller, modular services or utility components.',
                });
            }
            // Check Monolithic server.js architecture
            if ((file.path === 'server.js' || file.path === 'server.ts' || file.path === 'src/server.ts') &&
                lines.length > 40 &&
                (file.content.includes('SELECT ') || file.content.includes('pool.query'))) {
                findings.push({
                    ruleId: 'ARCH-001',
                    category: 'architecture',
                    severity: 'high',
                    title: 'Monolithic server entry point executing database queries',
                    description: 'server.js contains routing, business logic, and direct database queries instead of delegating to dedicated controller and service layers.',
                    file: file.path,
                    line: 1,
                    codeSnippet: lines.slice(15, 25).join('\n'),
                    recommendation: 'Extract route handlers into separate route files and isolate database access within repository or service classes.',
                });
            }
            let currentFunctionStart = -1;
            let currentFunctionBraceDepth = 0;
            let maxNestingInFunc = 0;
            for (let i = 0; i < lines.length; i++) {
                const lineNum = i + 1;
                const line = lines[i];
                const trimmed = line.trim();
                // Count functions
                if (/\b(function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>|(async\s+)?function\s*\()/.test(trimmed)) {
                    functionsAnalyzed++;
                    currentFunctionStart = lineNum;
                    currentFunctionBraceDepth = 0;
                    maxNestingInFunc = 0;
                }
                // Track indentation level for deep nesting (flag only extreme nesting >= 6, max 3 per file)
                const leadingSpaces = line.search(/\S|$/);
                const indentLevel = Math.floor(leadingSpaces / 2);
                const existingQual002 = findings.filter((f) => f.ruleId === 'QUAL-002' && f.file === file.path);
                if (indentLevel >= 6 && existingQual002.length < 3) {
                    if (!existingQual002.some((f) => Math.abs(f.line - lineNum) < 8)) {
                        findings.push({
                            ruleId: 'QUAL-002',
                            category: 'quality',
                            severity: 'low',
                            title: `Deeply nested block (nesting depth ${indentLevel})`,
                            description: 'Excessive nesting of control flow statements increases cyclomatic complexity and impairs maintainability.',
                            file: file.path,
                            line: lineNum,
                            codeSnippet: line,
                            recommendation: 'Use early return guard clauses or extract nested branches into helper functions.',
                        });
                        qualityIssuesCount++;
                    }
                }
                // Check Hardcoded Credentials / Secrets
                // Stripe secret key
                if (/(sk_live|sk_test)_[0-9a-zA-Z]{24,}/.test(line)) {
                    findings.push({
                        ruleId: 'SEC-001',
                        category: 'security',
                        severity: 'critical',
                        title: 'Hardcoded Stripe secret key detected',
                        description: 'A Stripe API secret key is embedded directly in the source code.',
                        file: file.path,
                        line: lineNum,
                        codeSnippet: line,
                        recommendation: 'Move the Stripe key to process.env.STRIPE_SECRET_KEY and rotate the exposed secret immediately.',
                    });
                    vulnerabilitiesDetected++;
                }
                // Hardcoded Database URI with credentials
                if (/(postgres|postgresql|mongodb|mysql):\/\/[a-zA-Z0-9_-]+:[^@]+@[a-zA-Z0-9.-]+/.test(line)) {
                    findings.push({
                        ruleId: 'SEC-002',
                        category: 'security',
                        severity: 'critical',
                        title: 'Hardcoded database credentials in connection URI',
                        description: 'A database connection string with plaintext username and password was found in code.',
                        file: file.path,
                        line: lineNum,
                        codeSnippet: line,
                        recommendation: 'Store DATABASE_URL in environment configuration (process.env.DATABASE_URL).',
                    });
                    vulnerabilitiesDetected++;
                }
                // Hardcoded JWT Secret
                if (/JWT_SECRET\s*=\s*["'][^"']+["']/.test(line)) {
                    findings.push({
                        ruleId: 'SEC-003',
                        category: 'security',
                        severity: 'high',
                        title: 'Hardcoded JWT signing secret',
                        description: 'A static secret string is used to sign JSON Web Tokens, allowing attackers who view the code to forge arbitrary tokens.',
                        file: file.path,
                        line: lineNum,
                        codeSnippet: line,
                        recommendation: 'Load JWT_SECRET from environment variables: process.env.JWT_SECRET.',
                    });
                    vulnerabilitiesDetected++;
                }
                // Insecure CORS
                if (/Access-Control-Allow-Origin.*\*.*Access-Control-Allow-Credentials.*true/i.test(file.content)) {
                    if (/Access-Control-Allow-Origin.*["']\*["']/i.test(line)) {
                        findings.push({
                            ruleId: 'SEC-004',
                            category: 'security',
                            severity: 'medium',
                            title: 'Insecure wildcard CORS with credentials allowed',
                            description: 'Allowing wildcard origin (*) alongside Access-Control-Allow-Credentials violates browser security and enables CSRF/data leakage.',
                            file: file.path,
                            line: lineNum,
                            codeSnippet: line,
                            recommendation: 'Specify explicit trusted origins in CORS configuration instead of "*".',
                        });
                        vulnerabilitiesDetected++;
                    }
                }
                // SQL Injection Risk
                if (/\b(SELECT|INSERT|UPDATE|DELETE)\b.*WHERE.*\+\s*(req\.|query|params|body|input)/i.test(line) ||
                    (line.includes('pool.query') && line.includes(' + '))) {
                    findings.push({
                        ruleId: 'SEC-005',
                        category: 'security',
                        severity: 'critical',
                        title: 'Potential SQL Injection via string concatenation',
                        description: 'User input is concatenated directly into a SQL query string without parameterization, exposing the database to SQL injection attacks.',
                        file: file.path,
                        line: lineNum,
                        codeSnippet: line,
                        recommendation: 'Use parameterized queries ($1, $2 or ?) to bind user variables safely.',
                    });
                    vulnerabilitiesDetected++;
                }
                // Unsafe Shell Command Execution (Command Injection)
                if (/\b(exec|execSync)\s*\([^)]*\+[^)]*\)/.test(line) && !line.includes('// safe')) {
                    findings.push({
                        ruleId: 'SEC-006',
                        category: 'security',
                        severity: 'high',
                        title: 'Potentially unsafe shell command execution',
                        description: 'child_process.exec() invokes a system shell with concatenated strings, enabling arbitrary command injection if arguments are user-controlled.',
                        file: file.path,
                        line: lineNum,
                        codeSnippet: line,
                        recommendation: 'Use child_process.execFile() or spawn() with argument arrays rather than string concatenation in a shell.',
                    });
                    vulnerabilitiesDetected++;
                }
                // Sensitive information in logs
                if (/console\.(log|info|debug)\(.*(password|token|secret|apiKey).*\)/i.test(line)) {
                    findings.push({
                        ruleId: 'SEC-007',
                        category: 'security',
                        severity: 'medium',
                        title: 'Sensitive information leaked in console logs',
                        description: 'Password, authorization token, or secret variable is printed to standard output.',
                        file: file.path,
                        line: lineNum,
                        codeSnippet: line,
                        recommendation: 'Mask or redact sensitive fields before logging.',
                    });
                    vulnerabilitiesDetected++;
                }
                // Verbose error stack exposure
                if (/res\.(json|send)\(.*err\.stack.*\)/i.test(line)) {
                    findings.push({
                        ruleId: 'SEC-008',
                        category: 'security',
                        severity: 'low',
                        title: 'Internal stack trace exposed in API error response',
                        description: 'Printing err.stack in production API responses leaks internal filesystem and module details to clients.',
                        file: file.path,
                        line: lineNum,
                        codeSnippet: line,
                        recommendation: 'Log stack traces internally on the server and return generic error messages to clients.',
                    });
                }
                // Empty Catch Block (Poor Error Handling)
                if (trimmed.startsWith('catch') && (line.includes('{}') || lines[i + 1]?.trim() === '}')) {
                    findings.push({
                        ruleId: 'QUAL-003',
                        category: 'quality',
                        severity: 'medium',
                        title: 'Empty catch block suppresses errors silently',
                        description: 'Errors caught in this block are discarded without logging or handling, creating silent failures.',
                        file: file.path,
                        line: lineNum,
                        codeSnippet: line,
                        recommendation: 'Log the error or pass it to an error handling middleware.',
                    });
                    qualityIssuesCount++;
                }
                // Missing request validation in controllers
                if (file.path.includes('controller') &&
                    trimmed.startsWith('const {') &&
                    trimmed.includes('} = req.body') &&
                    !file.content.includes('zod') &&
                    !file.content.includes('joi') &&
                    !file.content.includes('validator')) {
                    if (!findings.some((f) => f.ruleId === 'QUAL-004' && f.file === file.path)) {
                        findings.push({
                            ruleId: 'QUAL-004',
                            category: 'quality',
                            severity: 'medium',
                            title: 'Controller lacks schema-based request validation',
                            description: 'Request payload is destructured directly without schema validation (such as Zod, Joi, or express-validator).',
                            file: file.path,
                            line: lineNum,
                            codeSnippet: line,
                            recommendation: 'Validate request bodies with a schema validator like Zod before processing.',
                        });
                        qualityIssuesCount++;
                    }
                }
            }
        }
        // 5. Testing Analysis & Untested Areas
        const untestedAreas = [];
        for (const area of criticalAreasPresent) {
            if (!testedAreas.has(area)) {
                untestedAreas.push(area);
            }
        }
        if (untestedAreas.length > 0 && sourceFiles.length > 0) {
            findings.push({
                ruleId: 'TEST-001',
                category: 'testing',
                severity: 'high',
                title: `Untested critical application areas: ${untestedAreas.join(', ')}`,
                description: `Source files for ${untestedAreas.join(', ')} exist, but no corresponding test files were found.`,
                file: 'tests/',
                line: 1,
                codeSnippet: `Missing tests for: ${untestedAreas.join(', ')}`,
                recommendation: `Write automated unit or integration tests for ${untestedAreas.join(', ')}.`,
            });
        }
        // Calculate Estimated Test Coverage
        const sourceFilesCount = Math.max(sourceFiles.length, 1);
        let estimatedTestCoverage = 0;
        if (testFilesCount > 0) {
            const ratio = testFilesCount / sourceFilesCount;
            estimatedTestCoverage = Math.min(Math.round(ratio * 75) + 15, 95);
        }
        // 6. Score Calculation (Documented methodology, calibrated 0-100)
        // Security Score (100 base, deductions for critical: -25, high: -15, medium: -8, low: -3)
        let securityDeduction = 0;
        let qualityDeduction = 0;
        let archDeduction = 0;
        let docDeduction = 0;
        let depDeduction = 0;
        for (const f of findings) {
            const penalty = f.severity === 'critical' ? 25 : f.severity === 'high' ? 15 : f.severity === 'medium' ? 8 : 3;
            if (f.category === 'security')
                securityDeduction += penalty;
            else if (f.category === 'quality')
                qualityDeduction += penalty;
            else if (f.category === 'architecture')
                archDeduction += penalty;
            else if (f.category === 'documentation')
                docDeduction += penalty;
            else if (f.category === 'dependencies')
                depDeduction += penalty;
        }
        const securityScore = Math.max(10, 100 - securityDeduction);
        const qualityScore = Math.max(15, 100 - qualityDeduction);
        const archScore = Math.max(20, 100 - archDeduction);
        const docScore = Math.max(20, 100 - docDeduction - (!hasReadme ? 40 : 0));
        const depScore = Math.max(25, 100 - depDeduction);
        const testingScore = testFilesCount === 0 ? (sourceFilesCount > 2 ? 18 : 50) : estimatedTestCoverage;
        const maintainabilityScore = Math.round((qualityScore * 0.5 + archScore * 0.3 + docScore * 0.2));
        const overallScore = Math.round(securityScore * 0.25 +
            qualityScore * 0.2 +
            testingScore * 0.15 +
            archScore * 0.15 +
            docScore * 0.1 +
            maintainabilityScore * 0.1 +
            depScore * 0.05);
        const scores = {
            overall: Math.min(100, Math.max(0, overallScore)),
            codeQuality: Math.min(100, Math.max(0, qualityScore)),
            security: Math.min(100, Math.max(0, securityScore)),
            testing: Math.min(100, Math.max(0, testingScore)),
            architecture: Math.min(100, Math.max(0, archScore)),
            documentation: Math.min(100, Math.max(0, docScore)),
            maintainability: Math.min(100, Math.max(0, maintainabilityScore)),
            dependencies: Math.min(100, Math.max(0, depScore)),
        };
        const metrics = {
            totalFilesScanned: files.length,
            totalLinesAnalyzed,
            testFilesCount,
            estimatedTestCoverage,
            functionsAnalyzed: Math.max(functionsAnalyzed, 1),
            dependenciesCount,
            vulnerabilitiesDetected,
            qualityIssuesCount,
            untestedAreas,
        };
        return {
            findings,
            scores,
            metrics,
        };
    }
}
exports.StaticAnalyzer = StaticAnalyzer;
exports.staticAnalyzer = new StaticAnalyzer();
