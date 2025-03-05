const express = require('express');
const router = express.Router();
const {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  searchRecipesByIngredients,
  addToFavorites,
  removeFromFavorites
} = require('../controllers/recipeController');

const { protect, authorize } = require('../middleware/auth');

// Include review router
const reviewRouter = require('./reviewRoutes');
const { getAllReviews } = require('../controllers/reviewController');

// Re-route into review router for specific recipes
router.use('/:recipeId/reviews', reviewRouter);

// Special route to get ALL reviews across ALL recipes
router.get('/all/reviews', protect, authorize('admin'), getAllReviews);

router.route('/search')
  .post(searchRecipesByIngredients);

router.route('/')
  .get(getRecipes)
  .post(protect, createRecipe);

router.route('/:id')
  .get(getRecipe)
  .put(protect, updateRecipe)
  .delete(protect, deleteRecipe);

router.route('/:id/favorite')
  .put(protect, addToFavorites);

router.route('/:id/unfavorite')
  .put(protect, removeFromFavorites);

module.exports = router;