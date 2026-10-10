// Bridge entrypoint for Vercel Serverless Functions
const serverModule = require('../backend/dist/server.js');
const app = serverModule.default || serverModule;

module.exports = app;
module.exports.default = app;
