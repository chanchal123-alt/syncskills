require('dotenv').config();
const express = require("express");
const cookieParser = require('cookie-parser');
const mongoose = require("mongoose");
const cors = require("cors");


// console.log("Loaded JWT_SECRET:", process.env.JWT_SECRET);

const userRoutes = require('./routes/userRoute');
const skillsRoutes = require('./routes/skillsRouter');
const viewRoutes = require('./routes/viewRoutes');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use('/api/users', userRoutes);
app.use('/api/skills', skillsRoutes);


app.use('/', viewRoutes);

mongoose
.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB connected");
})
.catch((err) => console.error("❌ DB Connection Error:", err));



// app.get("/", (req, res) => {
//     res.send("SyncSkills backend running 🚀");
// });


app.listen(3000, () => console.log("🚀 Server running on port 3000"));
