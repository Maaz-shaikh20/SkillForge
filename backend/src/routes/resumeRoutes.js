const express = require("express");
const multer = require("multer");

const {
    extractResumeText,
    extractResumeSections,
    extractSkillClaims,
    extractGitHubInfo
} = require("../services/resumeService");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

router.post(
    "/upload",
    upload.single("resume"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "Resume PDF is required"
                });
            }

            const text =
                await extractResumeText(
                    req.file.buffer
                );

            const sections =
    extractResumeSections(text);

            const skillClaims =
    extractSkillClaims(text);

            const detectedGithub =
    extractGitHubInfo(text, req.file.buffer);

            res.json({
                filename: req.file.originalname,
                text,
                sections,
                skillClaims,
                detectedGithub
            });

        } catch (error) {
            console.error("RESUME EXTRACTION ERROR:", error.message);

            res.status(500).json({
                message: "Failed to extract resume text",
                error: error.message
            });
        }
    }
);

module.exports = router;