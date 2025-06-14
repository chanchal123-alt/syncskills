require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/user');  // your User schema file path
const jwt = require('jsonwebtoken');
const Skill = require('../models/skills');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, skills } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      skills,
    });

    await user.save();

    // Respond with user info (no password)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      skills: user.skills,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    // console.log('Received password:', password);
    // console.log('User found:', user);
    // console.log('User password in DB:', user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    if (!process.env.JWT_SECRET) {
      console.log(res.status(500).json({ message: 'JWT secret is not set' }));
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
      },
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const { skill } = req.query;

    // Base query: all users
    let query = {};

    // If skill is provided, find skill ID first
    if (skill) {
      const skillDoc = await Skill.findOne({ title: new RegExp(`^${skill}$`, 'i') });
      if (!skillDoc) {
        return res.status(404).json({ message: 'Skill not found' });
      }
      query.skills = skillDoc._id;
    }

    // Get users with populated skills (excluding passwords)
    const users = await User.find(query, '-password').populate('skills');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addSkillToUser = async (req, res) => {
  const { id } = req.params;
  const { skillId } = req.body;

  try {

    const user = await User.findById(id);
    if (!user) return res.status(404).send('User not found');

    const skill = await Skill.findById(skillId);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    // Avoid duplicate skills
    if (user.skills.includes(skillId)) {
      return res.status(400).json({ message: 'Skill already added to user' });
    }

    user.skills.push(skillId);
    await user.save();

    res.send('Skill added to user successfully');

  } catch (err) {
    res.status(500).send(err.message);
  }
};

const getUserWithSkills = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('skills');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const removeSkillFromUser = async (req, res) => {
  const { id } = req.params;
  const { skillId } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).send("User not found");

    const index = user.skills.findIndex(id => id.toString() === skillId);
    if (index === -1) return res.status(404).send("Skill not found");

    user.skills.splice(index, 1);
    await user.save();

    res.send("Skill removed from user successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};


module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  addSkillToUser,
  getUserWithSkills,
  removeSkillFromUser, 
  getUserByEmail,
  createUser,
};

