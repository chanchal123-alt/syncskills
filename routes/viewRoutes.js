// routes/viewRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcryptjs');
const Skill = require('../models/skills');
const User = require('../models/user');
const { verifyToken } = require('../middlewares/auth.js');

// Render Login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Handle login form submission
router.post('/login', async (req, res) => {
  try {
    // Use your existing loginUser controller, but modify to get user/token from it

    // Call loginUser logic manually here:
    const { email, password } = req.body;

    // Find user by email
    const user = await userController.getUserByEmail(email);
    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    // Compare password using bcrypt
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set token in cookie (or session)
    res.cookie('token', token, { httpOnly: true });

    // Redirect to dashboard or home page
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Server error. Please try again.' });
  }
});

// Render Register page
router.get('/register',(req, res) => {
  res.render('register', { error: null });
});

// Handle register form submission
router.post('/register', async (req, res) => {
  try {
    // Use your existing registerUser controller

    const { name, email, password, skills } = req.body;

    // Check if user exists
    const userExists = await userController.getUserByEmail(email);
    if (userExists) {
      return res.render('register', { error: 'Email already registered' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const skillNames = skills ? skills.split(',').map(s => s.trim().toLowerCase()) : [];

    const skillIds = [];
    
    for (const name of skillNames) {
      let skill = await Skill.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (!skill) {
        skill = await Skill.create({
          title: name,          // add this line
          description: '',      // optional
          skillCategory: '',    // optional
        });
      }
      skillIds.push(skill._id);
    }
    
    const newUser = {
      name,
      email,
      password: hashedPassword,
      skills: skillIds,
    };
    
    const createdUser = await userController.createUser(newUser);    
    // Redirect to login page after successful registration
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Server error. Please try again.' });
  }
});

// GET /dashboard — Show all users with skills
router.get('/dashboard', async (req, res) => {
  const token = req.cookies.token;
  const jwt = require('jsonwebtoken');

  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.userId);

    const skillFilter = req.query.skill;
    let usersQuery = {};

    if (skillFilter) {
      const skillDoc = await Skill.findOne({ title: new RegExp(`^${skillFilter}$`, 'i') });
      if (skillDoc) {
        usersQuery.skills = skillDoc._id;
      } else {
        usersQuery.skills = null; // No user will match
      }
    }

    const allUsers = await User.find(usersQuery, '-password').populate('skills');

    res.render('dashboard', { currentUser, allUsers });
  } catch (err) {
    return res.redirect('/login');
  }
});


router.get('/logout',(req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

async function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.redirect('/login');
  }
}

// Delete a single skill by ID
router.post('/skills/delete/:id', authenticate, async (req, res) => {
  const skillId = req.params.id;
  await User.findByIdAndUpdate(req.userId, { $pull: { skills: skillId } });
  res.redirect('/profile');
});

// Show edit skill form
router.get('/skills/edit/:id', authenticate, async (req, res) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) return res.redirect('/profile');
  res.render('edit-skills', { skill });
});

// Handle update skill (from edit form)
router.post('/skills/edit/:id', authenticate, async (req, res) => {
  const { title, skillCategory } = req.body;
  await Skill.findByIdAndUpdate(req.params.id, { title, skillCategory });
  res.redirect('/profile');
});

// Add new skill form (optional, if separate page)
router.get('/skills/add', authenticate, (req, res) => {
  res.render('add-skills'); // simple form to add skill title & category
});

// Handle adding new skills (you can keep your existing logic here)
router.post('/skills/add', authenticate, async (req, res) => {
  const user = await User.findById(req.userId);
  const { title, skillCategory } = req.body;

  if (!title) return res.redirect('/skills/add');

  let skill = await Skill.findOne({ title: new RegExp(`^${title}$`, 'i') });
  if (!skill) {
    skill = await Skill.create({
      title: name,
      skillCategory: "General", // default if none provided
      createdBy: user._id
    });
    
  }

  await User.findByIdAndUpdate(user._id, {
    $addToSet: { skills: skill._id }
  });

  res.redirect('/profile');
});


// Show profile page (with optional password success/error query)
router.get('/profile',async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('skills');
    // console.log(user.skills);

    if (!user) return res.redirect('/login');

    res.render('profile', {
      user,
      passwordSuccess: req.query.passwordSuccess,
      passwordError: req.query.passwordError
    });
  } catch (err) {
    console.error(err);
    return res.redirect('/login');
  }
});

// Handle profile update (name/email)
router.post('/profile', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, email } = req.body;

    await User.findByIdAndUpdate(decoded.userId, { name, email });
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    return res.redirect('/login');
  }
});

// Handle password change
router.post('/change-password',async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.redirect('/login');

    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.redirect('/profile?passwordError=Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.redirect('/profile?passwordSuccess=Password updated successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/profile?passwordError=Something went wrong');
  }
});

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post('/upload-photo', upload.single('profilePic'), async (req, res) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  await User.findByIdAndUpdate(decoded.userId, { profilePic: req.file.filename });
  res.redirect('/profile');
});




module.exports = router;
