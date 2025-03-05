const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Review = require('../models/Review');
const asyncHandler = require('express-async-handler');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error(`User not found with id of ${req.params.id}`);
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    res.status(404);
    throw new Error(`User not found with id of ${req.params.id}`);
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error(`User not found with id of ${req.params.id}`);
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user.id) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  await user.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const recipeCount = await Recipe.countDocuments();
    const reviewCount = await Review.countDocuments();

    // Get top rated recipes
    const topRatedRecipes = await Recipe.find()
      .sort({ averageRating: -1 })
      .limit(5)
      .select('title image averageRating ratingCount');

    // Get recent reviews
    const recentReviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'user',
        select: 'name avatar'
      })
      .populate({
        path: 'recipe',
        select: 'title'
      });

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email avatar createdAt role');

    res.status(200).json({
      success: true,
      data: {
        counts: {
          users: userCount,
          recipes: recipeCount,
          reviews: reviewCount
        },
        topRatedRecipes,
        recentReviews,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error - Failed to get dashboard stats'
    });
  }
});

// @desc    Approve/reject recipe
// @route   PUT /api/admin/recipes/:id/moderate
// @access  Private/Admin
exports.moderateRecipe = asyncHandler(async (req, res) => {
  const { status, moderationNote } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Please provide a status (approved or rejected)');
  }

  let recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error(`Recipe not found with id of ${req.params.id}`);
  }

  recipe = await Recipe.findByIdAndUpdate(
    req.params.id,
    { 
      status,
      moderationNote: moderationNote || '',
      moderatedBy: req.user.id,
      moderatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: recipe
  });
});

// @desc    Get all reviews (admin function)
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getAllReviews = asyncHandler(async (req, res) => {
  try {
    console.log('Admin getAllReviews function called');
    // Get all reviews with user and recipe information
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
    
    console.log(`Found ${reviews.length} reviews in admin controller`);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching all reviews in admin controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching all reviews'
    });
  }
});