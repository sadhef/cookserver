const Review = require('../models/Review');
const Recipe = require('../models/Recipe');
const asyncHandler = require('express-async-handler');

// @desc    Get reviews for a recipe
// @route   GET /api/recipes/:recipeId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await Review.find({ recipe: req.params.recipeId })
      .populate({
        path: 'user',
        select: 'name avatar'
      })
      .populate({
        path: 'recipe',
        select: 'title'
      })
      .sort('-createdAt');

    console.log(`Found ${reviews.length} reviews for recipe ${req.params.recipeId}`);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error(`Error fetching reviews for recipe ${req.params.recipeId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching reviews'
    });
  }
});

// @desc    Get ALL reviews across ALL recipes
// @route   GET /api/recipes/all/reviews
// @access  Private/Admin
exports.getAllReviews = asyncHandler(async (req, res) => {
  try {
    console.log('getAllReviews endpoint called');
    
    const reviews = await Review.find()
      .populate({
        path: 'user',
        select: 'name avatar'
      })
      .populate({
        path: 'recipe',
        select: 'title'
      })
      .sort('-createdAt');

    console.log(`Found ${reviews.length} total reviews across all recipes`);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching all reviews'
    });
  }
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name avatar'
      })
      .populate({
        path: 'recipe',
        select: 'title'
      });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: `Review not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching review'
    });
  }
});

// @desc    Add review
// @route   POST /api/recipes/:recipeId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res) => {
  try {
    req.body.recipe = req.params.recipeId;
    req.body.user = req.user.id;

    // Check if recipe exists
    const recipe = await Recipe.findById(req.params.recipeId);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: `Recipe not found with id of ${req.params.recipeId}`
      });
    }

    // Check if user already reviewed this recipe
    const existingReview = await Review.findOne({
      user: req.user.id,
      recipe: req.params.recipeId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this recipe'
      });
    }

    const review = await Review.create(req.body);

    // Populate the user and recipe fields
    const populatedReview = await Review.findById(review._id)
      .populate({
        path: 'user',
        select: 'name avatar'
      })
      .populate({
        path: 'recipe',
        select: 'title averageRating ratingCount'
      });

    // Trigger recalculation of average rating
    try {
      await review.constructor.getAverageRating(review.recipe);
    } catch (err) {
      console.error('Error recalculating rating after adding review:', err);
    }

    res.status(201).json({
      success: true,
      data: populatedReview
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      error: 'Server error adding review'
    });
  }
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: `Review not found with id of ${req.params.id}`
      });
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this review'
      });
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'user',
      select: 'name avatar'
    }).populate({
      path: 'recipe',
      select: 'title'
    });

    // Trigger recalculation of average rating
    try {
      await review.constructor.getAverageRating(review.recipe);
    } catch (err) {
      console.error('Error recalculating rating after update:', err);
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating review'
    });
  }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: `Review not found with id of ${req.params.id}`
      });
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this review'
      });
    }

    const recipeId = review.recipe;
    
    await review.remove();

    // Manually trigger recalculation of average rating
    try {
      await Review.getAverageRating(recipeId);
    } catch (err) {
      console.error('Error recalculating rating after delete:', err);
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false, 
      error: 'Server error deleting review'
    });
  }
});