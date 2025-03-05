const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats,
  moderateRecipe,
  getAllReviews
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

// Apply protection and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

router.route('/stats')
  .get(getDashboardStats);

router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.route('/recipes/:id/moderate')
  .put(moderateRecipe);

// Add route to get all reviews
router.route('/reviews')
  .get(getAllReviews);

module.exports = router;