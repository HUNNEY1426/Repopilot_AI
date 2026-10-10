// Bridge entrypoint for Vercel Express framework
const serverModule = require('./dist/server.js');
const app = serverModule.default || serverModule;

module.exports = app;
module.exports.default = app;
