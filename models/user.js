const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {          // ✅ This must exist
    type: String,
    required: true
  },
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  profilePic: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('User', userSchema);
