const { OpenAI } = require('openai');
const config = require('../config/default');

// Initialize OpenAI client with OpenRouter configuration
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'https://cookify.com',
    'X-Title': process.env.SITE_NAME || 'COokiFy'
  },
  timeout: 180000 // 180 seconds timeout for OpenRouter calls (3 minutes)
});

// Build context about the application to help the model provide relevant answers
const systemMessage = {
  role: 'system',
  content: `You are Cookie 🎀, the friendly recipe assistant for COokiFy application.
  
  COokiFy is a recipe management platform where users can:
  - Browse and search recipes by name or ingredients
  - Filter recipes by various criteria
  - Save favorite recipes
  - Post reviews and ratings
  - Follow step-by-step cooking instructions with voice guidance
  
  When responding to users:
  - Focus on helping them find and cook recipes
  - Provide cooking tips and ingredient substitutions when asked
  - Answer questions about nutrition and dietary restrictions
  - Be friendly, knowledgeable, and food-related
  - If asked for a specific recipe, provide complete, detailed recipes including all ingredients, measurements, and cooking steps
  - Don't make up recipes that don't exist in the platform
  - If unsure about specific recipes in the database, suggest search terms instead
  
  You do NOT handle user account issues, payments, or non-cooking related topics. For those, direct users to customer support.`
};

/**
 * Wrapper for OpenRouter API calls with timeout and retry logic
 * @param {Function} apiCall - The API call function to execute
 * @param {number} retries - Number of retries on failure
 * @returns {Promise<any>} - API response
 */
const safeApiCall = async (apiCall, retries = 2) => {
  try {
    return await apiCall();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying API call (${retries} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      return safeApiCall(apiCall, retries - 1);
    }
    throw error;
  }
};

/**
 * Send a message to the chatbot and get a response
 * @param {string} message - The user's message
 * @param {Array} history - Previous messages in the conversation
 * @returns {Promise<string>} - The chatbot's response
 */
exports.getChatbotResponse = async (message, history = []) => {
  try {
    // Format conversation history
    const formattedHistory = history.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Check for recipe requests
    const isRecipeRequest = message.toLowerCase().includes('recipe') || 
                            message.toLowerCase().includes('how to make') ||
                            message.toLowerCase().includes('how do i cook');
    
    // Limit message length to prevent timeouts
    const trimmedMessage = message.length > 500 ? message.substring(0, 500) + '...' : message;
    
    // Add system message at the beginning
    const messages = [
      systemMessage,
      ...formattedHistory.slice(-10), // Include last 10 messages to provide better context
      { role: 'user', content: trimmedMessage }
    ];

    // For recipe requests, add an extra instruction to ensure complete recipe details
    if (isRecipeRequest) {
      messages.unshift({
        role: 'system', 
        content: 'When asked for recipes, always provide complete details including ALL ingredients with measurements, ALL preparation steps, cooking times, and serving suggestions. Do not abbreviate or summarize recipes.'
      });
    }
    
    // Call OpenRouter API with retry logic
    const completion = await safeApiCall(async () => {
      return await client.chat.completions.create({
        model: 'deepseek/deepseek-chat:free', // Using the specified model
        messages: messages,
        max_tokens: 1500, // Increased token limit for longer, more detailed responses
        temperature: 0.7, // Add some creativity but keep responses relevant
        timeout: 160000 // 160 seconds timeout
      });
    }, 2); // 2 retry attempts
    
    // Return the response text
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Chatbot API error:', error);
    
    // Provide graceful fallback
    if (error.message && error.message.includes('timeout')) {
      throw new Error('The request timed out. Please try a shorter message or try again later.');
    }
    
    throw new Error('Failed to get response from Cookie 🎀. Please try again later.');
  }
};

/**
 * Generate recipe suggestions based on ingredients
 * @param {Array} ingredients - List of available ingredients
 * @returns {Promise<string>} - Recipe suggestions
 */
exports.suggestRecipes = async (ingredients) => {
  try {
    // Limit number of ingredients to reduce context size
    const limitedIngredients = ingredients.slice(0, 10);
    
    const prompt = `Based on these ingredients: ${limitedIngredients.join(', ')}, suggest 3 possible recipes I could make. For each recipe, provide:
    
1. A descriptive name for the recipe
2. A complete list of ingredients with measurements (include these supplied ingredients and any other essential ingredients)
3. Detailed step-by-step cooking instructions
4. Approximate cooking time and servings
5. Any tips or variations

Please make each recipe complete and detailed enough that someone could actually cook it.`;
    
    const messages = [
      systemMessage,
      { role: 'user', content: prompt }
    ];
    
    // Call OpenRouter API with retry logic
    const completion = await safeApiCall(async () => {
      return await client.chat.completions.create({
        model: 'deepseek/deepseek-chat:free',
        messages: messages,
        max_tokens: 1500, // Increased token count for detailed recipes
        temperature: 0.7,
        timeout: 160000 // 160 seconds timeout
      });
    }, 2); // 2 retry attempts
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Recipe suggestion error:', error);
    
    // Provide graceful fallback
    if (error.message && error.message.includes('timeout')) {
      throw new Error('The suggestion request timed out. Please try with fewer ingredients or try again later.');
    }
    
    throw new Error('Failed to generate recipe suggestions. Please try again later.');
  }
};

/**
 * Fallback responses when the API is unavailable
 * @param {string} messageType - Type of message to generate
 * @param {Array|string} additionalInfo - Optional additional info (ingredients or message text)
 * @returns {string} - Fallback response
 */
exports.getFallbackResponse = (messageType, ingredients = []) => {
  switch (messageType) {
    case 'greeting':
      return "Hello! I'm Cookie 🎀, your recipe assistant. I can help you find recipes, answer cooking questions, and provide tips. How can I help you today?";
    
    case 'suggestion':
      return `Based on the ingredients you mentioned (${ingredients.join(', ')}), here are some simple ideas:
      
1. Quick Stir Fry: Use any vegetables and protein you have, add soy sauce, and serve over rice.

2. Simple Pasta: Boil pasta, then mix with olive oil, garlic, and any vegetables or protein you have.

3. Versatile Salad: Combine your fresh ingredients with a simple dressing of oil, vinegar, salt, and pepper.

Try searching for these basic recipes in the COokiFy search bar for more detailed instructions!`;
    
    default:
      return "I'm here to help with cooking questions and recipe ideas. What would you like to know?";
  }
};