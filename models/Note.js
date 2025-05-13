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
    enum: [
      'pdf', 'doc', 'docx', 'ppt', 'pptx', 
      'xls', 'xlsx', 'txt', 'csv',
      'jpg', 'jpeg', 'png', 'gif', 'svg', 
      'unknown'
    ],
    required: [true, 'Please specify file type'],
    default: 'unknown'
  },
  fileSize: {
    type: Number,
    required: [true, 'Please specify file size']
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    trim: true,
    enum: [
      'Mathematics', 
      'Physics', 
      'Chemistry', 
      'Biology', 
      'History', 
      'Geography', 
      'English', 
      'Literature', 
      'Computer Science',
      'Economics',
      'Business Studies'
    ]
  },
  grade: {
    type: String,
    required: [true, 'Please add a grade'],
    enum: ['11', '12']
  },
  semester: {
    type: String,
    required: [true, 'Please add a semester'],
    enum: ['1', '2']
  },
  quarter: {
    type: String,
    required: [true, 'Please add a quarter'],
    enum: ['1', '2', '3', '4']
  },
  topic: {
    type: String,
    required: [true, 'Please add a topic'],
    trim: true
  },
  publicId: {
    type: String
  },
  assetId: {
    type: String
  },
  tags: {
    type: [String],
    default: []
  },
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
      value: {
        type: Number,
        min: 1,
        max: 5
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  averageRating: {
    type: Number,
    default: 0
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
    required: false
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
    return total + item.value;
  }, 0);
  
  this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
  return this.averageRating;
};

// Create indexes for better query performance
NoteSchema.index({ subject: 1, grade: 1, semester: 1, quarter: 1 });
NoteSchema.index({ topic: 'text', title: 'text', description: 'text' });
NoteSchema.index({ slug: 1 });
NoteSchema.index({ user: 1 });

module.exports = mongoose.model('Note', NoteSchema); 