const express = require('express');
const router = express.Router();

// @desc    Set language preference
// @route   POST /api/settings/language
// @access  Public
router.post('/language', (req, res) => {
  const { language } = req.body;
  
  if (!language) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a language'
    });
  }
  
  // In a production app, you'd save this to user session/profile
  console.log(`Language set to: ${language}`);
  
  res.status(200).json({
    success: true,
    data: { language }
  });
});

module.exports = router;