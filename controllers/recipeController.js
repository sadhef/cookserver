const Recipe = require('../models/Recipe');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get all recipes
// @route   GET /api/recipes
// @access  Public
exports.getRecipes = asyncHandler(async (req, res) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Remove fields from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  let query = Recipe.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Recipe.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Execute query
  const recipes = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: recipes.length,
    pagination,
    data: recipes
  });
});

// @desc    Get single recipe
// @route   GET /api/recipes/:id
// @access  Public
exports.getRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).populate({
    path: 'reviews',
    select: 'rating comment user',
    populate: {
      path: 'user',
      select: 'name avatar'
    }
  });

  if (!recipe) {
    res.status(404);
    throw new Error(`Recipe not found with id of ${req.params.id}`);
  }

  res.status(200).json({
    success: true,
    data: recipe
  });
});

// @desc    Create new recipe
// @route   POST /api/recipes
// @access  Private
exports.createRecipe = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const recipe = await Recipe.create(req.body);

  res.status(201).json({
    success: true,
    data: recipe
  });
});

// @desc    Update recipe
// @route   PUT /api/recipes/:id
// @access  Private
exports.updateRecipe = asyncHandler(async (req, res) => {
  let recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error(`Recipe not found with id of ${req.params.id}`);
  }

  // Make sure user is recipe owner or admin
  if (recipe.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to update this recipe`);
  }

  recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: recipe
  });
});

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
// @access  Private
exports.deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error(`Recipe not found with id of ${req.params.id}`);
  }

  // Make sure user is recipe owner or admin
  if (recipe.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to delete this recipe`);
  }

  await recipe.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Search recipes by ingredients with similarity scoring
// @route   POST /api/recipes/search
// @access  Public
exports.searchRecipesByIngredients = asyncHandler(async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of ingredients');
  }

  try {
    // Clean and normalize ingredient names (lowercase, trim)
    const normalizedIngredients = ingredients.map(ingredient => 
      ingredient.trim().toLowerCase()
    );

    // Get all recipes from the database
    const allRecipes = await Recipe.find().lean();
    
    // Calculate similarity score for each recipe
    const scoredRecipes = allRecipes.map(recipe => {
      // Make sure recipe.ingredients is an array
      const recipeIngredients = Array.isArray(recipe.ingredients) 
        ? recipe.ingredients 
        : [];
      
      // Normalize recipe ingredients
      const normalizedRecipeIngredients = recipeIngredients.map(ing => 
        typeof ing === 'string' ? ing.trim().toLowerCase() : ''
      );
      
      // Initialize similarity metrics
      let matchCount = 0;
      let totalIngredients = normalizedRecipeIngredients.length || 1; // Avoid division by zero
      
      // Count matching ingredients
      normalizedIngredients.forEach(userIngredient => {
        // Look for exact matches first
        const exactMatch = normalizedRecipeIngredients.some(recipeIng => 
          recipeIng === userIngredient || recipeIng.includes(userIngredient) || userIngredient.includes(recipeIng)
        );
        
        if (exactMatch) {
          matchCount += 1;
          return;
        }
        
        // If no exact match, look for partial matches (words within ingredients)
        const userWords = userIngredient.split(' ');
        let hasPartialMatch = false;
        
        for (const word of userWords) {
          if (word.length <= 2) continue; // Skip very short words
          
          const partialMatch = normalizedRecipeIngredients.some(recipeIng => 
            recipeIng.includes(word)
          );
          
          if (partialMatch) {
            hasPartialMatch = true;
            break;
          }
        }
        
        if (hasPartialMatch) {
          matchCount += 0.5; // Partial match has less weight
        }
      });
      
      // Calculate similarity score (as a percentage)
      const matchRatio = matchCount / totalIngredients;
      const coverageRatio = normalizedIngredients.length > 0 ? matchCount / normalizedIngredients.length : 0;
      
      // Final score combines both metrics (weighted average)
      const similarityScore = (matchRatio * 0.6) + (coverageRatio * 0.4);
      
      // Add the score to the recipe
      return {
        ...recipe,
        similarityScore,
        matchCount
      };
    });
    
    // Create two arrays: matching recipes and all other recipes
    const matchingRecipes = scoredRecipes.filter(recipe => recipe.matchCount > 0);
    const otherRecipes = scoredRecipes.filter(recipe => recipe.matchCount === 0);
    
    // Sort both arrays
    matchingRecipes.sort((a, b) => b.similarityScore - a.similarityScore);
    otherRecipes.sort((a, b) => b.averageRating - a.averageRating);
    
    // Take the top matching recipes (for the first page)
    let resultRecipes = [...matchingRecipes];
    
    // If we don't have at least 5 matching recipes, add some recommended recipes
    if (resultRecipes.length < 5) {
      const recommendedRecipes = otherRecipes
        .slice(0, Math.max(5 - resultRecipes.length, 0))
        .map(recipe => ({
          ...recipe,
          isSuggested: true
        }));
      
      resultRecipes = [...resultRecipes, ...recommendedRecipes];
    }
    
    res.status(200).json({
      success: true,
      count: resultRecipes.length,
      totalMatches: matchingRecipes.length,
      totalRecipes: allRecipes.length,
      data: resultRecipes
    });
  } catch (error) {
    console.error('Error searching recipes by ingredients:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during recipe search'
    });
  }
});

// @desc    Add recipe to favorites
// @route   PUT /api/recipes/:id/favorite
// @access  Private
exports.addToFavorites = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error(`Recipe not found with id of ${req.params.id}`);
  }

  // Check if recipe is already in favorites
  const user = await User.findById(req.user.id);
  
  if (user.favorites.includes(req.params.id)) {
    res.status(400);
    throw new Error('Recipe already in favorites');
  }

  // Add recipe to favorites
  await User.findByIdAndUpdate(
    req.user.id,
    { $push: { favorites: req.params.id } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Recipe added to favorites'
  });
});

// @desc    Remove recipe from favorites
// @route   PUT /api/recipes/:id/unfavorite
// @access  Private
exports.removeFromFavorites = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error(`Recipe not found with id of ${req.params.id}`);
  }

  // Check if recipe is in favorites
  const user = await User.findById(req.user.id);
  
  if (!user.favorites.includes(req.params.id)) {
    res.status(400);
    throw new Error('Recipe not in favorites');
  }

  // Remove recipe from favorites
  await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { favorites: req.params.id } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Recipe removed from favorites'
  });
});