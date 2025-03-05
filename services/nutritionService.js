const fs = require('fs').promises;
const path = require('path');

// Nutrition data cache
let nutritionData = null;

// Load nutrition data from JSON file
const loadNutritionData = async () => {
  if (nutritionData) return nutritionData;
  
  try {
    const dataPath = path.join(__dirname, '../data/nutritionData.json');
    const data = await fs.readFile(dataPath, 'utf8');
    nutritionData = JSON.parse(data);
    return nutritionData;
  } catch (error) {
    console.error('Error loading nutrition data:', error);
    // Fallback to empty object if file not found
    return {};
  }
};

// Parse ingredient string into amount, unit, and ingredient
const parseIngredient = (ingredientStr) => {
  ingredientStr = ingredientStr.toLowerCase().trim();
  
  // Regular expression to match amount, unit, and ingredient
  const pattern = /^([\d./]+)?\s*(cup|tablespoon|tbsp|teaspoon|tsp|whole|white|ounce|oz)?\s*(.*)/;
  const match = ingredientStr.match(pattern);
  
  if (!match) return { amount: 1, unit: null, ingredient: ingredientStr };

  let [, amount, unit, ingredient] = match;
  
  // Convert fractional amount to decimal
  if (amount) {
    if (amount.includes('/')) {
      const [num, denom] = amount.split('/');
      amount = parseFloat(num) / parseFloat(denom);
    } else {
      amount = parseFloat(amount);
    }
  } else {
    amount = 1;
  }

  // Standardize units
  const unitMap = {
    'tbsp': 'tablespoon',
    'tsp': 'teaspoon',
    'oz': 'ounce'
  };
  
  unit = unit ? unitMap[unit] || unit : null;
  ingredient = ingredient.trim();

  return { amount, unit, ingredient };
};

// Calculate nutrition values for a list of ingredients
exports.calculateNutritionValues = async (ingredients) => {
  const data = await loadNutritionData();
  
  const nutritionValues = {
    calories: { value: 0, unit: 'kcal' },
    protein: { value: 0, unit: 'g' },
    carbs: { value: 0, unit: 'g' },
    fats: { value: 0, unit: 'g' },
    fiber: { value: 0, unit: 'g' }
  };

  for (const ingredientStr of ingredients) {
    const { amount, unit, ingredient } = parseIngredient(ingredientStr);
    
    // Find the closest matching ingredient
    const matchedIngredient = findMatchingIngredient(ingredient, data.ingredients);
    
    if (matchedIngredient) {
      // Get the nutrition data for the ingredient
      const ingData = data.ingredients[matchedIngredient];
      
      // Calculate nutrition based on amount and unit
      let multiplier = amount;
      
      // Apply unit conversion if needed
      if (unit && unit !== ingData.unit) {
        // Simple unit conversion examples
        if (unit === 'tablespoon' && ingData.unit === 'cup') {
          multiplier = amount / 16; // 16 tbsp in a cup
        } else if (unit === 'teaspoon' && ingData.unit === 'tablespoon') {
          multiplier = amount / 3; // 3 tsp in a tbsp
        } else if (unit === 'teaspoon' && ingData.unit === 'cup') {
          multiplier = amount / 48; // 48 tsp in a cup
        }
      }
      
      // Add to total nutrition values
      nutritionValues.calories.value += multiplier * ingData.calories_per_unit;
      nutritionValues.protein.value += multiplier * ingData.protein_per_unit;
      nutritionValues.carbs.value += multiplier * ingData.carbs_per_unit;
      nutritionValues.fats.value += multiplier * ingData.fats_per_unit;
      nutritionValues.fiber.value += multiplier * ingData.fiber_per_unit;
    }
  }

  // Round values to 1 decimal place
  for (const nutrient in nutritionValues) {
    nutritionValues[nutrient].value = Math.round(nutritionValues[nutrient].value * 10) / 10;
  }

  return nutritionValues;
};

// Find the closest matching ingredient in the data
const findMatchingIngredient = (ingredient, ingredientsData) => {
  // Direct match
  if (ingredientsData[ingredient]) {
    return ingredient;
  }
  
  // Partial matches
  const ingredients = Object.keys(ingredientsData);
  
  // First, check if the ingredient is contained within any of the known ingredients
  for (const knownIng of ingredients) {
    if (ingredient.includes(knownIng)) {
      return knownIng;
    }
  }
  
  // Next, check if any known ingredient is contained within the given ingredient
  for (const knownIng of ingredients) {
    if (knownIng.includes(ingredient)) {
      return knownIng;
    }
  }
  
  return null;
};

// Get all ingredients nutrition data
exports.getIngredientsData = async () => {
  const data = await loadNutritionData();
  return data.ingredients || {};
};