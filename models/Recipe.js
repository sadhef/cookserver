const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    default: 'default-recipe.jpg'
  },
  totalTime: {
    type: String,
    required: [true, 'Please add preparation time']
  },
  ingredients: {
    type: [String],
    required: [true, 'Please add ingredients']
  },
  instructions: {
    type: [String],
    required: [true, 'Please add cooking instructions']
  },
  nutrition: {
    calories: {
      value: {
        type: Number,
        default: 0
      },
      unit: {
        type: String,
        default: 'kcal'
      }
    },
    protein: {
      value: {
        type: Number,
        default: 0
      },
      unit: {
        type: String,
        default: 'g'
      }
    },
    carbs: {
      value: {
        type: Number,
        default: 0
      },
      unit: {
        type: String,
        default: 'g'
      }
    },
    fats: {
      value: {
        type: Number,
        default: 0
      },
      unit: {
        type: String,
        default: 'g'
      }
    },
    fiber: {
      value: {
        type: Number,
        default: 0
      },
      unit: {
        type: String,
        default: 'g'
      }
    }
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5'],
    set: function(val) {
      return Math.round(val * 10) / 10; // Round to 1 decimal place
    }
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reviews
RecipeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'recipe',
  justOne: false
});

module.exports = mongoose.model('Recipe', RecipeSchema);