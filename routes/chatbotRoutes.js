const express = require('express');
const router = express.Router();
const {
  getChatbotResponse,
  suggestRecipes
} = require('../controllers/chatbotController');

// Basic chatbot message endpoint
router.post('/message', getChatbotResponse);

// Recipe suggestion endpoint
router.post('/suggest', suggestRecipes);

module.exports = router;