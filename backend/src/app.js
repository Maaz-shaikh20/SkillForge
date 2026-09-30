require("dotenv").config();
const express = require("express");
const cors = require("cors");
const githubRoutes = require("./routes/githubRoutes");
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

const app=express();

app.use(cors());
app.use(express.json());
app.use("/api/github",githubRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);

app.get("/",(req,res)=>{
    res.json({
        message:"SkillForge backend is running"
    });
});

module.exports=app;