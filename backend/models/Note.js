const mongoose = require('mongoose');
const slugify = require('slugify');

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: String,
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  fileUrl: {
    type: String,
    required: [true, 'Please add a file URL']
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png'],
    required: [true, 'Please specify file type']
  },
  fileSize: {
    type: Number,
    required: [true, 'Please specify file size']
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    enum: ['mathematics', 'physics', 'chemistry', 'biology', 'computer science', 
           'literature', 'history', 'geography', 'economics', 'business', 'arts', 
           'music', 'physical education', 'foreign languages', 'other']
  },
  grade: {
    type: String,
    enum: ['primary', 'middle school', 'high school', 'undergraduate', 'graduate', 'professional'],
    required: [true, 'Please specify grade level']
  },
  tags: [String],
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  ratings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  aiSummary: {
    type: String,
    maxlength: [2000, 'AI summary cannot be more than 2000 characters']
  },
  flashcards: [
    {
      question: String,
      answer: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      }
    }
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create slug from title
NoteSchema.pre('save', function(next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

// Calculate average rating
NoteSchema.methods.getAverageRating = function() {
  if (this.ratings.length === 0) return null;
  
  const sum = this.ratings.reduce((total, item) => {
    return total + item.rating;
  }, 0);
  
  this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
  return this.averageRating;
};

// Indexes for better querying
NoteSchema.index({ slug: 1 });
NoteSchema.index({ subject: 1, grade: 1 });
NoteSchema.index({ tags: 1 });
NoteSchema.index({ user: 1 });
NoteSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text',
  subject: 'text'
});

module.exports = mongoose.model('Note', NoteSchema); 