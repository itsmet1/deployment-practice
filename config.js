// config.js
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,
  message: process.env.MESSAGE || "Hello World!",
  geminiApiKey: process.env.GEMINI_API_KEY,
  nodeEnv: process.env.NODE_ENV || "development"
};