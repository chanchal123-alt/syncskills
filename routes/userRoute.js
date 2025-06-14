const express = require('express');
const router = express.Router();
const { registerUser, loginUser,  getUserById, getAllUsers,addSkillToUser,getUserWithSkills,removeSkillFromUser } = require('../controllers/userController');
const { validateRegister } = require('../middlewares/validation');
const { verifyToken } = require('../middlewares/auth');


router.post('/register', validateRegister, registerUser);

router.post('/login', loginUser);

router.get('/', getAllUsers);
router.get('/:id', getUserById);

router.get('/:id/skills', getUserWithSkills);   

router.post('/:id/skills', verifyToken, addSkillToUser);
router.delete('/:id/skills/:skillId', verifyToken, removeSkillFromUser);

module.exports = router;