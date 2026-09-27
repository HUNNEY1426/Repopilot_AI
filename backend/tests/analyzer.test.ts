import test from 'node:test';
import assert from 'node:assert';
import { staticAnalyzer } from '../src/services/staticAnalyzer.js';
import type { RepoFile } from '../src/types/index.js';

test('StaticAnalyzer - detects critical security issues and calculates scores', () => {
  const sampleFiles: RepoFile[] = [
    {
      path: 'server.js',
      size: 500,
      content: `const express = require('express');
const STRIPE_SECRET_KEY = "sk_test_51M000000000000000000000000000000";
const DATABASE_URL = "postgres://admin:Password123!@db.internal:5432/production";
const JWT_SECRET = "super-secret-jwt-key";

app.get('/search', async (req, res) => {
  const q = req.query.q;
  const result = await pool.query("SELECT * FROM products WHERE name LIKE '%" + q + "%'");
  res.json(result);
});`,
    },
    {
      path: 'README.md',
      size: 100,
      content: '# Test Repo\nRun npm start',
    },
  ];

  const result = staticAnalyzer.analyze(sampleFiles);

  assert.ok(result.findings.length >= 4, 'Should detect at least 4 security findings');
  assert.ok(result.findings.some((f) => f.title.includes('Stripe')), 'Should detect Stripe key');
  assert.ok(result.findings.some((f) => f.title.includes('database credentials')), 'Should detect DB credentials');
  assert.ok(result.findings.some((f) => f.title.includes('SQL Injection')), 'Should detect SQL injection');

  assert.ok(result.scores.security <= 25, 'Security score should be <= 25 due to critical findings');
  assert.ok(result.scores.overall <= 75, 'Overall score should reflect security penalties');
});
