const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Load models
const Badge = require('./models/Badge');
const User = require('./models/User');
const Note = require('./models/Note');

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Read JSON files
const badges = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/badges.json`, 'utf-8')
);

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
);

const notes = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/notes.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
  try {
    await Badge.create(badges);
    await User.create(users);
    await Note.create(notes);
    console.log('Data Imported...'.green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Badge.deleteMany();
    await User.deleteMany();
    await Note.deleteMany();
    console.log('Data Destroyed...'.red.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please provide proper flag: -i to import, -d to delete'.yellow);
  process.exit();
} 