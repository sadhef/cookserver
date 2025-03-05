const asyncHandler = require('express-async-handler');
const nutritionService = require('../services/nutritionService');

// @desc    Calculate nutrition from ingredients
// @route   POST /api/nutrition/calculate
// @access  Public
exports.calculateNutrition = asyncHandler(async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of ingredients');
  }

  const nutritionData = await nutritionService.calculateNutritionValues(ingredients);

  res.status(200).json({
    success: true,
    data: {
      total: nutritionData,
      perServing: {
        calories: Math.round(nutritionData.calories.value / 4),
        protein: Math.round(nutritionData.protein.value / 4 * 10) / 10,
        carbs: Math.round(nutritionData.carbs.value / 4 * 10) / 10,
        fats: Math.round(nutritionData.fats.value / 4 * 10) / 10,
        fiber: Math.round(nutritionData.fiber.value / 4 * 10) / 10
      }
    }
  });
});

// @desc    Get nutrition data for common ingredients
// @route   GET /api/nutrition/ingredients
// @access  Public
exports.getNutritionData = asyncHandler(async (req, res) => {
  const nutritionData = await nutritionService.getIngredientsData();

  res.status(200).json({
    success: true,
    count: Object.keys(nutritionData).length,
    data: nutritionData
  });
});