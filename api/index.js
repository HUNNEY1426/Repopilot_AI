// Bridge entrypoint for Vercel Serverless Functions
const app = require('../backend/dist/server.js');

module.exports = app;
module.exports.default = app;
