const express = require("express");

const router = express.Router();

router.get("/github", (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
        scope: "read:user repo"
    });

    const githubUrl =
        `https://github.com/login/oauth/authorize?${params.toString()}`;

    res.redirect(githubUrl);
});

router.get("/github/callback", async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                message: "Authorization code is missing"
            });
        }

        const response = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `GitHub OAuth error: ${response.status}`
            );
        }

        const data = await response.json();

        // Redirect the browser back to the frontend with the token as a query param.
        // StepGitHub.jsx reads it from window.location.search (?accessToken=...).
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}?accessToken=${data.access_token}`);
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "GitHub authentication failed"
        });
    }
});

module.exports = router;