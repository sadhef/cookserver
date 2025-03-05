const express = require('express');
const router = express.Router();
const {
  calculateNutrition,
  getNutritionData
} = require('../controllers/nutritionController');

router.route('/calculate')
  .post(calculateNutrition);

router.route('/ingredients')
  .get(getNutritionData);

module.exports = router;