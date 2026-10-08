"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskSecrets = maskSecrets;
const SECRET_PATTERNS = [
    // AWS Access Key ID
    /(AKIA[0-9A-Z]{16})/g,
    // GitHub Personal Access Token
    /(gh[pousr]_[A-Za-z0-9_]{36,255})/g,
    // Generic Bearer / API token
    /(Bearer\s+)([A-Za-z0-9\-._~+/]+=*)/gi,
    // Generic password in URLs / strings
    /(password\s*[:=]\s*["'])([^"'\n]{3,})(["'])/gi,
    /(api[_-]?key\s*[:=]\s*["'])([^"'\n]{6,})(["'])/gi,
    /(secret\s*[:=]\s*["'])([^"'\n]{6,})(["'])/gi,
    /(token\s*[:=]\s*["'])([^"'\n]{6,})(["'])/gi,
    // Connection strings
    /(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@)/gi,
    /(postgres(ql)?:\/\/[^:]+:)([^@]+)(@)/gi,
    /(mysql:\/\/[^:]+:)([^@]+)(@)/gi,
];
function maskSecrets(input) {
    if (!input)
        return input;
    let masked = input;
    for (const pattern of SECRET_PATTERNS) {
        masked = masked.replace(pattern, (match, p1, p2, p3) => {
            if (p3) {
                // e.g. apiKey = "..."
                return `${p1}***REDACTED***${p3}`;
            }
            if (p2) {
                return `${p1}***REDACTED***`;
            }
            return '***REDACTED_SECRET***';
        });
    }
    return masked;
}
