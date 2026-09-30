const express = require("express");
const {
    getUserRepositories,
    getRepositoryCommits,
    calculateOwnership,
    getCommitDetails,
    analyzeRepository,
    analyzeTechnologies,
    matchTechnologiesToFiles,
    calculateContributionDepth,

} = require("../services/githubService");

// Both functions come from the same module — import them together.
// Previously verifySkillInRepository was re-imported separately
// in the middle of the file, which is messy and confusing.
const {
    verifySkillsInRepository,
    verifySkillInRepository,
    verifySkillsAcrossAllRepositories
} = require("../services/skillVerificationService");

const router = express.Router();


router.get(
    "/repos/:owner/:repo/verify-skill/:skill",
    async (req, res) => {
        try {
            const {
                owner,
                repo,
                skill
            } = req.params;

            const accessToken =
                req.headers.authorization?.replace(
                    "Bearer ",
                    ""
                );

            
            if (!accessToken) {
                return res.status(401).json({
                    message: "GitHub access token is required"
                });
            }

           const result = await verifySkillInRepository(
    owner,
    repo,
    skill,
    owner,
    accessToken
);

            res.json(result);

        }  catch (error) {
    console.error("VERIFY SKILL ERROR:", error);

    res.status(500).json({
        message: "Failed to verify skill",
        error: error.message
    });
}
    }
);


// route to fetch all repositories of a specific user
router.get("/repos/:username", async (req, res) => {
    try {
        const { username } = req.params;

        // Read token from header — without it we hit GitHub as an
        // anonymous user (60 req/hour limit, no private repo access).
        const accessToken =
            req.headers.authorization?.replace("Bearer ", "");

        const repositories = await getUserRepositories(username, accessToken);

        res.json(repositories);
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to fetch GitHub repositories"
        });
    }
});


// route to fetch total commits of a specific repository
router.get("/repos/:owner/:repo/commits", async (req, res) => {
    try {
        const { owner, repo } = req.params;

        const accessToken =
            req.headers.authorization?.replace("Bearer ", "");

        const commits = await getRepositoryCommits(owner, repo, accessToken);

        res.json(commits);
    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to fetch repository commits"
        });
    }
});

// route to calculate ownership of a repository by a specific user by analyzing the commits
router.get(
    "/repos/:owner/:repo/ownership/:username",
    async (req, res) => {
        try {
            const { owner, repo, username } = req.params;

            const accessToken =
                req.headers.authorization?.replace("Bearer ", "");

            const commits = await getRepositoryCommits(
                owner,
                repo,
                accessToken
            );

            const ownership = calculateOwnership(
                commits,
                username
            );

            res.json(ownership);
        } catch (error) {
            console.error(error.message);

            res.status(500).json({
                message: "Failed to calculate repository ownership"
            });
        }
    }
);


// route to fetch details of a specific commit in a repository
router.get(
    "/repos/:owner/:repo/commits/:sha",
    async (req, res) => {
        try {
            const { owner, repo, sha } = req.params;

            const commit = await getCommitDetails(
                owner,
                repo,
                sha
            );

            res.json(commit);
        } catch (error) {
            console.error(error.message);

            res.status(500).json({
                message: "Failed to fetch commit details"
            });
        }
    }
);

// route to analyze a repository and calculate ownership of a specific user
router.get(
    "/repos/:owner/:repo/analyze/:username",
    async (req, res) => {
        try {
            const {
                owner,
                repo,
                username
            } = req.params;

            const accessToken =
                req.headers.authorization?.replace(
                    "Bearer ",
                    ""
                );

            if (!accessToken) {
                return res.status(401).json({
                    message: "GitHub access token is required"
                });
            }

           const contributionAnalysis = await analyzeRepository(
                        owner,
                        repo,
                         username,
                        accessToken
             );

            const technologies =await analyzeTechnologies(
                          owner,
                         repo,
                         accessToken
            );

           const technologyEvidence =matchTechnologiesToFiles(
                     technologies,
                     contributionAnalysis.candidateFiles
            );

            const technologyAnalysis =technologyEvidence.map((technology) => ({
                    ...technology,
                    contributionDepth:
                calculateContributionDepth(
                technology,
                contributionAnalysis
                )
            }));

                res.json({
                         contribution: contributionAnalysis,
                         technologies: technologyAnalysis
                });
        } catch (error) {
            console.error(error.message);

            res.status(500).json({
                message: "Failed to analyze repository"
            });
        }
    }
);

router.post(
    "/repos/:owner/:repo/verify-skills/:username",
    async (req, res) => {
        try {
            const {
                owner,
                repo,
                username
            } = req.params;

            const {
                skills
            } = req.body;

            const accessToken =
                req.headers.authorization?.replace(
                    "Bearer ",
                    ""
                );

            // Check token
            if (!accessToken) {
                return res.status(401).json({
                    message:
                        "GitHub access token is required"
                });
            }

            // Check skills
            if (
                !Array.isArray(skills) ||
                skills.length === 0
            ) {
                return res.status(400).json({
                    message:
                        "skills must be a non-empty array"
                });
            }

            const results =
                await verifySkillsInRepository(
                    owner,
                    repo,
                    skills,
                    username,
                    accessToken
                );

            res.json({
                repository: repo,
                candidate: username,
                results
            });

        } catch (error) {

            console.error(
                "BATCH SKILL VERIFICATION ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to verify skills",
                error: error.message
            });
        }
    }
);
router.post(
    "/user/:username/verify-skills-all",
    async (req, res) => {
        try {
            const { username } = req.params;
            const { skills }   = req.body;

            const accessToken = req.headers.authorization?.replace("Bearer ", "");

            if (!accessToken) {
                return res.status(401).json({ message: "GitHub access token is required" });
            }

            if (!Array.isArray(skills) || skills.length === 0) {
                return res.status(400).json({ message: "skills must be a non-empty array" });
            }

            const { results, reposScanned, reposAnalyzed } =
                await verifySkillsAcrossAllRepositories(
                    username,
                    skills,
                    accessToken
                );

            res.json({
                candidate:     username,
                mode:          "all-repos",
                reposScanned,
                reposAnalyzed,
                results
            });

        } catch (error) {
            console.error("ALL-REPOS SKILL VERIFICATION ERROR:", error);
            res.status(500).json({
                message: "Failed to verify skills across all repositories",
                error:   error.message
            });
        }
    }
);

module.exports = router;