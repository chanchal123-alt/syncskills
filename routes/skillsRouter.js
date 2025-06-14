const express = require('express');
const router = express.Router();

const { createSkill, getAllSkills} = require('../controllers/skillsController');

router.post('/', createSkill);
router.get('/', getAllSkills);


module.exports = router;
