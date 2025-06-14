const Skill = require('../models/skills');

const createSkill = async (req,res) =>{
    try{
        const { title,description,skillCategory } = req.body;

        const skills = new Skill({
            title,
            description,
            skillCategory,
        });
    
        await skills.save();
        res.json(skills);
    }
    catch(err){
      return res.status(404).json({ success: false, message: 'skill not created' });
    }   

};

const getAllSkills = async (req, res) => {
    try {
      const skills = await Skill.find({});
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };



module.exports = {
    createSkill,
    getAllSkills
   
}