/**
 * Script to import recipe data from CSV into MongoDB
 * Usage:
 *   - Import data: node importRecipes.js
 *   - Destroy data: node importRecipes.js -d
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csvParser = require('csv-parser');
const config = require('../config/default');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

// Connect to MongoDB
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Create admin user for recipes
const createAdmin = async () => {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@cookify.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return adminExists._id;
    }
    
    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@cookify.com',
      password: 'admin123',
      role: 'admin'
    });
    
    console.log('Admin user created');
    return admin._id;
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

// Parse CSV file and import recipes
const importRecipes = async (adminId) => {
  try {
    const results = [];
    const csvFilePath = path.join(__dirname, '../../data/recipes.csv');
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error('CSV file not found at:', csvFilePath);
      process.exit(1);
    }
    
    // Parse CSV
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`Parsed ${results.length} recipes from CSV`);
        
        // Process and save each recipe
        let count = 0;
        for (const item of results) {
          try {
            // Parse ingredients and instructions from string to array
            let ingredients = item.ingredients || '[]';
            let instructions = item.instructions || '[]';
            
            try {
              ingredients = JSON.parse(ingredients);
            } catch (e) {
              ingredients = ingredients.split(',').map(i => i.trim());
            }
            
            try {
              instructions = JSON.parse(instructions);
            } catch (e) {
              instructions = instructions.split('\n').map(i => i.trim()).filter(Boolean);
            }
            
            // Parse nutrition
            let nutrition = item.nutrition || '{}';
            try {
              nutrition = JSON.parse(nutrition);
            } catch (e) {
              nutrition = {
                calories: { value: 0, unit: 'kcal' },
                protein: { value: 0, unit: 'g' },
                carbs: { value: 0, unit: 'g' },
                fats: { value: 0, unit: 'g' },
                fiber: { value: 0, unit: 'g' }
              };
            }
            
            // Create recipe
            await Recipe.create({
              title: item.title || 'Untitled Recipe',
              description: item.description || '',
              image: item.image || 'default-recipe.jpg',
              totalTime: item.total_time || '30 minutes',
              ingredients,
              instructions,
              nutrition,
              createdBy: adminId,
              averageRating: Math.random() * 3 + 2, // Random rating between 2-5
              ratingCount: Math.floor(Math.random() * 50) // Random number of ratings
            });
            
            count++;
            if (count % 10 === 0) {
              console.log(`Imported ${count} recipes...`);
            }
          } catch (error) {
            console.error(`Error importing recipe "${item.title}":`, error);
          }
        }
        
        console.log(`Successfully imported ${count} recipes`);
        process.exit(0);
      });
  } catch (error) {
    console.error('Error importing recipes:', error);
    process.exit(1);
  }
};

// Delete all data
const destroyData = async () => {
  try {
    await Recipe.deleteMany({});
    console.log('Recipes deleted');
    
    // Don't delete users by default
    // await User.deleteMany({});
    // console.log('Users deleted');
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting data:', error);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  // Check for destroy flag
  if (process.argv.includes('-d')) {
    console.log('Destroying data...');
    await destroyData();
    return;
  }
  
  console.log('Importing data...');
  const adminId = await createAdmin();
  await importRecipes(adminId);
};

// Run script
main();