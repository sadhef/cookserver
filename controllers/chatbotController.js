// server/controllers/chatbotController.js
const asyncHandler = require('express-async-handler');
const chatbotService = require('../services/chatbotService');

/**
 * @desc    Get response from chatbot
 * @route   POST /api/chatbot/message
 * @access  Public
 */
exports.getChatbotResponse = asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Please provide a message');
  }

  // Set a 3-minute timeout for the request (180 seconds)
  req.setTimeout(180000);

  try {
    // Try to get a response from the chatbot service
    const response = await chatbotService.getChatbotResponse(message, history);
    
    res.status(200).json({
      success: true,
      data: {
        response
      }
    });
  } catch (error) {
    console.error('Error in chatbot response:', error);
    
    // Use fallback response if API call fails
    let fallbackResponse;
    
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      fallbackResponse = chatbotService.getFallbackResponse('greeting');
    } else if (message.toLowerCase().includes('recipe') || message.toLowerCase().includes('cook')) {
      // Provide a more detailed recipe if they're asking for one
      fallbackResponse = chatbotService.getFallbackResponse('recipe', message);
    } else {
      fallbackResponse = chatbotService.getFallbackResponse('general');
    }
    
    // Return the fallback response with a 200 status to prevent client-side errors
    res.status(200).json({
      success: true,
      data: {
        response: fallbackResponse,
        isFallback: true
      }
    });
  }
});

/**
 * @desc    Get recipe suggestions based on ingredients
 * @route   POST /api/chatbot/suggest
 * @access  Public
 */
exports.suggestRecipes = asyncHandler(async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of ingredients');
  }

  // Set a 3-minute timeout for the request
  req.setTimeout(180000);

  try {
    // Try to get suggestions from the service
    const suggestions = await chatbotService.suggestRecipes(ingredients);
    
    res.status(200).json({
      success: true,
      data: {
        suggestions
      }
    });
  } catch (error) {
    console.error('Error in recipe suggestions:', error);
    
    // Use fallback suggestions if API call fails
    const fallbackSuggestions = chatbotService.getFallbackResponse('suggestion', ingredients);
    
    // Return the fallback response with a 200 status to prevent client-side errors
    res.status(200).json({
      success: true,
      data: {
        suggestions: fallbackSuggestions,
        isFallback: true
      }
    });
  }
});