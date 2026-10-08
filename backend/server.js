// Bridge entrypoint for Vercel Express framework
const app = require('./dist/server.js');

module.exports = app;
module.exports.default = app;
