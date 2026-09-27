import type { RepoFile } from '../types/index.js';

export interface DemoRepo {
  id: string;
  name: string;
  owner: string;
  url: string;
  defaultBranch: string;
  language: string;
  description: string;
  files: RepoFile[];
}

export const DEMO_REPOSITORIES: DemoRepo[] = [
  {
    id: 'demo-vulnerable-api',
    name: 'vulnerable-ecommerce-api',
    owner: 'sample-org',
    url: 'https://github.com/sample-org/vulnerable-ecommerce-api',
    defaultBranch: 'main',
    language: 'JavaScript',
    description: 'Deliberately problematic Node.js eCommerce API demonstrating security, quality, architecture, and testing issues.',
    files: [
      {
        path: 'package.json',
        size: 512,
        content: `{
  "name": "vulnerable-ecommerce-api",
  "version": "1.0.0",
  "description": "eCommerce API service",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^8.5.1",
    "pg": "^8.7.1",
    "request": "^2.88.2",
    "crypto": "1.0.1"
  }
}`
      },
      {
        path: 'README.md',
        size: 180,
        content: `# eCommerce API
Simple API for online shopping.

## Run
\`\`\`bash
npm start
\`\`\`
`
      },
      {
        path: 'server.js',
        size: 2150,
        content: `const express = require('express');
const { Pool } = require('pg');
const { exec } = require('child_process');
const userController = require('./controllers/userController');
const auth = require('./auth');

const app = express();
app.use(express.json());

// Hardcoded credential
const STRIPE_SECRET_KEY = "sk_test_51M000000000000000000000000000000";
const DATABASE_URL = "postgres://admin:Password123!@db.internal:5432/production";

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Insecure CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Monolithic route with SQL injection risk and business logic
app.get('/api/products/search', async (req, res) => {
  try {
    const query = req.query.q;
    // SQL Injection Vulnerability: Unsanitized concatenation
    const result = await pool.query("SELECT * FROM products WHERE name LIKE '%" + query + "%'");
    res.json(result.rows);
  } catch (err) {
    // Verbose error exposure
    console.log("Error searching products: " + err.stack);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Unsafe shell execution endpoint
app.post('/api/system/backup', (req, res) => {
  const targetDir = req.body.dir || '/tmp';
  // Command Injection Risk
  exec("tar -czf backup.tar.gz " + targetDir, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(error);
    }
    res.send("Backup completed: " + stdout);
  });
});

app.post('/api/users/login', auth.login);
app.get('/api/users', userController.getAllUsers);
app.post('/api/users', userController.createUser);

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
`
      },
      {
        path: 'auth.js',
        size: 1420,
        content: `const jwt = require('jsonwebtoken');

// Hardcoded JWT Secret
const JWT_SECRET = "super-secret-jwt-key-never-share";

function login(req, res) {
  const { username, password } = req.body;

  // Sensitive information logged
  console.log("Login attempt for user: " + username + " with password: " + password);

  // Missing input validation
  if (username === "admin" && password === "admin123") {
    // Token without expiration
    const token = jwt.sign({ user: username, role: "admin" }, JWT_SECRET);
    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Empty catch block / poor error handling
  }
  return next();
}

module.exports = { login, verifyToken };
`
      },
      {
        path: 'controllers/userController.js',
        size: 2850,
        content: `const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgres://admin:Password123!@db.internal:5432/production"
});

// Large controller directly executing database operations without service layer
async function getAllUsers(req, res) {
  try {
    const result = await pool.query('SELECT id, username, email FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Database error");
  }
}

// Deeply nested, duplicate validation logic, complex function
async function createUser(req, res) {
  try {
    const { username, email, password, role } = req.body;
    
    // Deep nesting anti-pattern
    if (username) {
      if (email) {
        if (password) {
          if (password.length >= 6) {
            // Duplicate DB query logic
            const checkUser = await pool.query("SELECT * FROM users WHERE email = '" + email + "'");
            if (checkUser.rows.length > 0) {
              return res.status(400).json({ error: "Email already exists" });
            } else {
              const insertResult = await pool.query(
                "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username",
                [username, email, password, role || 'user']
              );
              return res.status(201).json(insertResult.rows[0]);
            }
          } else {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
          }
        } else {
          return res.status(400).json({ error: "Password is required" });
        }
      } else {
        return res.status(400).json({ error: "Email is required" });
      }
    } else {
      return res.status(400).json({ error: "Username is required" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
}

module.exports = { getAllUsers, createUser };
`
      }
    ]
  },
  {
    id: 'demo-clean-ts-service',
    name: 'typescript-microservice-template',
    owner: 'modern-devs',
    url: 'https://github.com/modern-devs/typescript-microservice-template',
    defaultBranch: 'main',
    language: 'TypeScript',
    description: 'A clean, well-architected TypeScript microservice with testing and documentation.',
    files: [
      {
        path: 'package.json',
        size: 720,
        content: `{
  "name": "typescript-microservice-template",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "typescript": "^5.6.2"
  }
}`
      },
      {
        path: 'README.md',
        size: 650,
        content: `# TypeScript Microservice Template

Production-ready TypeScript microservice with Zod validation, Jest tests, and layered architecture.

## Architecture
\`\`\`text
Routes -> Controllers -> Services -> Repositories
\`\`\`

## Installation
\`\`\`bash
npm install
npm run build
\`\`\`

## Configuration
Copy \`.env.example\` to \`.env\`.
`
      },
      {
        path: '.env.example',
        size: 120,
        content: `PORT=4000
DATABASE_URL=postgres://user:password@localhost:5432/app_db
JWT_SECRET=replace_with_secure_random_key
`
      },
      {
        path: 'src/index.ts',
        size: 580,
        content: `import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
`
      },
      {
        path: 'tests/health.test.ts',
        size: 420,
        content: `describe('Health Check API', () => {
  it('should return 200 and ok status', () => {
    expect(true).toBe(true);
  });
});
`
      }
    ]
  }
];
