
const GITHUB_API = "https://api.github.com";

async function githubRequest(url, accessToken) {
    const token = (accessToken || process.env.GITHUB_TOKEN || "").trim();
    const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "SkillForge-Verification-Platform"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${GITHUB_API}${url}`, { headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            `GitHub API error: ${response.status} ${
                errorData.message || ""
            }`
        );
    }

    return response.json();
}

async function getGitHubUserProfile(username, accessToken) {
    return githubRequest(`/users/${encodeURIComponent(username)}`, accessToken);
}

async function getUserRepositories(username, accessToken) {
    // If accessToken is provided, check if the authenticated user matches the target username
    let useAuthUserEndpoint = false;
    if (accessToken) {
        try {
            const authUser = await githubRequest("/user", accessToken);
            if (authUser.login?.toLowerCase() === username?.toLowerCase()) {
                useAuthUserEndpoint = true;
            }
        } catch {
            useAuthUserEndpoint = false;
        }
    }

    const allRepos = [];
    let page = 1;

    while (true) {
        const path = useAuthUserEndpoint
            ? `/user/repos?sort=pushed&per_page=100&page=${page}&affiliation=owner`
            : `/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=100&page=${page}`;

        const repos = await githubRequest(path, accessToken);
        if (!Array.isArray(repos) || repos.length === 0) break;
        allRepos.push(...repos);
        page++;
        // Safety cap — 300 repos is more than enough
        if (allRepos.length >= 300 || repos.length < 100) break;
    }

    return allRepos;
}

async function getRepositoryCommits(
    owner,
    repo,
    accessToken
) {
    const allCommits = [];
    let page = 1;

    while (true) {
        const commits = await githubRequest(
            `/repos/${owner}/${repo}/commits?per_page=100&page=${page}`,
            accessToken
        );

        if (commits.length === 0) {
            break;
        }

        allCommits.push(...commits);
        page++;

        // Cap at 500 commits — enough for any practical skill verification.
        // Repos with 10 000+ commits would take minutes to fetch otherwise.
        if (allCommits.length >= 500) break;
    }

    return allCommits;
}

async function getCommitDetails(owner, repo, sha, accessToken) {
    return githubRequest(
        `/repos/${owner}/${repo}/commits/${sha}`,
        accessToken
    );
}

function calculateOwnership(commits, candidateUsername) {
    const candidateCommits = commits.filter((commit) => {
        return commit.author?.login === candidateUsername;
    });

    const totalCommits = commits.length;
    const candidateCommitCount = candidateCommits.length;

    const ownershipRatio =
        totalCommits === 0
            ? 0
            : candidateCommitCount / totalCommits;

    return {
        totalCommits,
        candidateCommitCount,
        ownershipRatio
    };
}

async function analyzeRepository(
    owner,
    repo,
    candidateUsername,
    accessToken
) {
    const commits = await getRepositoryCommits(
    owner,
    repo,
    accessToken,
);

    const candidateCommits = commits.filter((commit) => {
        return commit.author?.login === candidateUsername;
    });

    let totalAdditions = 0;
    let totalDeletions = 0;
let totalFilesChanged = 0;
const candidateFiles = new Set();
    for (const commit of candidateCommits) {
        const details = await getCommitDetails(
            owner,
            repo,
            commit.sha,
            accessToken
        );

        totalAdditions += details.stats?.additions || 0;
        totalDeletions += details.stats?.deletions || 0;
        totalFilesChanged += details.files?.length || 0;
        details.files?.forEach((file) => {
    candidateFiles.add(file.filename);
});
    }

    const totalCommits = commits.length;
    const candidateCommitCount = candidateCommits.length;

    const ownershipRatio =
        totalCommits === 0
            ? 0
            : candidateCommitCount / totalCommits;

    return {
        totalCommits,
        candidateCommitCount,
        ownershipRatio,
        totalAdditions,
        totalDeletions,
        totalFilesChanged,
        candidateFiles: [...candidateFiles]
    };
}


//
async function getRepositoryTree(owner, repo, accessToken) {

    const repository = await githubRequest(
        `/repos/${owner}/${repo}`,
        accessToken
    );

    const defaultBranch =
        repository.default_branch;

    const tree = await githubRequest(
        `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
        accessToken
    );

    return {
        tree: tree.tree,
        defaultBranch
    };
}


// async function getFileContent(
//     owner,
//     repo,
//     path,
//     accessToken,
//     ref
// ) {
//     let url =
//         `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

//     if (ref) {
//         url += `?ref=${encodeURIComponent(ref)}`;
//     }
//     console.log(
//     "GET FILE:",
//     url,
//     "REF:",
//     ref
// );

//     const file = await githubRequest(
//         url,
//         accessToken
//     );

//     if (!file.content) {
//         return "";
//     }

//     return Buffer.from(
//         file.content,
//         "base64"
//     ).toString("utf-8");
// }

async function getFileContent(
    owner,
    repo,
    path,
    accessToken,
    ref
) {
    const encodedPath = path
        .split("/")
        .map(encodeURIComponent)
        .join("/");

    const endpoint =
        `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;

    console.log("GET FILE:", endpoint);

    try {
        const file = await githubRequest(
            endpoint,
            accessToken
        );

        if (!file.content) {
            return "";
        }

        return Buffer.from(
            file.content,
            "base64"
        ).toString("utf-8");

    } catch (error) {
        console.error(
            `Failed to read ${path}:`,
            error.message
        );

        return "";
    }
}

function detectTechnologies(files, configFiles) {
    const technologies = [];

    const addTechnology = (name, evidence) => {
        const existing = technologies.find(
            (technology) => technology.name === name
        );

        if (existing) {
            existing.evidence.push(...evidence);
        } else {
            technologies.push({
                name,
                evidence
            });
        }
    };


    // JavaScript
    const javascriptFiles = files.filter(
        (file) =>
            file.endsWith(".js") ||
            file.endsWith(".jsx")
    );

    if (javascriptFiles.length > 0) {
        addTechnology(
            "JavaScript",
            javascriptFiles
        );
    }


    // TypeScript
    const typescriptFiles = files.filter(
        (file) =>
            file.endsWith(".ts") ||
            file.endsWith(".tsx")
    );

    if (typescriptFiles.length > 0) {
        addTechnology(
            "TypeScript",
            typescriptFiles
        );
    }


    // Python
    const pythonFiles = files.filter(
        (file) => file.endsWith(".py")
    );

    if (pythonFiles.length > 0) {
        addTechnology(
            "Python",
            pythonFiles
        );
    }


    // Java
    const javaFiles = files.filter(
        (file) => file.endsWith(".java")
    );

    if (javaFiles.length > 0) {
        addTechnology(
            "Java",
            javaFiles
        );
    }


    // Analyze configuration files
    for (const [filePath, content] of Object.entries(
        configFiles
    )) {

        const fileName = filePath
            .split("/")
            .pop();


        // package.json
        if (fileName === "package.json") {
            try {
                const packageJson =
                    JSON.parse(content);

                const dependencies = {
                    ...(packageJson.dependencies || {}),
                    ...(packageJson.devDependencies || {})
                };


                // React
                if (dependencies.react) {
                    addTechnology(
                        "React",
                        [filePath]
                    );
                }


                // Express
                if (dependencies.express) {
                    addTechnology(
                        "Express",
                        [filePath]
                    );

                    addTechnology(
                        "Node.js",
                        [filePath]
                    );
                }


                // TypeScript
                if (dependencies.typescript) {
                    addTechnology(
                        "TypeScript",
                        [filePath]
                    );
                }


                // MongoDB
                if (
                    dependencies.mongoose ||
                    dependencies.mongodb
                ) {
                    addTechnology(
                        "MongoDB",
                        [filePath]
                    );
                }

            } catch (error) {
                console.log(
                    `Invalid package.json: ${filePath}`
                );
            }
        }


        // pom.xml
        if (fileName === "pom.xml") {
            if (
                content.includes(
                    "spring-boot"
                )
            ) {
                addTechnology(
                    "Spring Boot",
                    [filePath]
                );
            }
        }


        // requirements.txt
        if (
            fileName === "requirements.txt"
        ) {
            const requirements =
                content.toLowerCase();


            if (
                requirements.includes(
                    "django"
                )
            ) {
                addTechnology(
                    "Django",
                    [filePath]
                );
            }


            if (
                requirements.includes(
                    "flask"
                )
            ) {
                addTechnology(
                    "Flask",
                    [filePath]
                );
            }


            if (
                requirements.includes(
                    "pymongo"
                )
            ) {
                addTechnology(
                    "MongoDB",
                    [filePath]
                );
            }
        }
    }


    return technologies;
}


async function analyzeTechnologies(
    owner,
    repo,
    accessToken
) {
    const tree = await getRepositoryTree(
        owner,
        repo,
        accessToken
    );

    // defaultBranch is needed as the `ref` when fetching file contents.
    // Without it, getFileContent builds a URL like ?ref=undefined
    // which GitHub treats as a missing branch → 404 → empty content.
    const defaultBranch = tree.defaultBranch;

    const files = tree.tree
        .filter((item) => item.type === "blob")
        .map((item) => item.path);

    const configFileNames = [
        "package.json",
        "pom.xml",
        "requirements.txt"
    ];

    const configFiles = {};

    for (const filePath of files) {
        const fileName = filePath.split("/").pop();

        if (configFileNames.includes(fileName)) {
            configFiles[filePath] =
                await getFileContent(
                    owner,
                    repo,
                    filePath,
                    accessToken,
                    defaultBranch  // ← was missing; caused ?ref=undefined
                );
        }
    }

    return detectTechnologies(
        files,
        configFiles
    );
}


//
function matchTechnologiesToFiles(
    technologies,
    candidateFiles
) {
    return technologies.map((technology) => {
        const technologyFiles = [];

        for (const file of technology.evidence) {
            technologyFiles.push(file);
        }

        // React / JavaScript
        if (
            technology.name === "React" ||
            technology.name === "JavaScript"
        ) {
            const sourceFiles = candidateFiles.filter(
                (file) =>
                    file.endsWith(".js") ||
                    file.endsWith(".jsx")
            );

            technologyFiles.push(...sourceFiles);
        }

        // TypeScript
        if (technology.name === "TypeScript") {
            const sourceFiles = candidateFiles.filter(
                (file) =>
                    file.endsWith(".ts") ||
                    file.endsWith(".tsx")
            );

            technologyFiles.push(...sourceFiles);
        }

        // Java / Spring Boot
        if (
            technology.name === "Java" ||
            technology.name === "Spring Boot"
        ) {
            const sourceFiles = candidateFiles.filter(
                (file) => file.endsWith(".java")
            );

            technologyFiles.push(...sourceFiles);
        }

        // Python
        if (
            technology.name === "Python" ||
            technology.name === "Django" ||
            technology.name === "Flask"
        ) {
            const sourceFiles = candidateFiles.filter(
                (file) => file.endsWith(".py")
            );

            technologyFiles.push(...sourceFiles);
        }

        // Remove duplicate files
        const uniqueFiles = [
            ...new Set(technologyFiles)
        ];

        return {
            name: technology.name,
            repositoryEvidence: technology.evidence,
            candidateEvidence: uniqueFiles,
            candidateFileCount: uniqueFiles.length
        };
    });
}

//
function calculateContributionDepth(
    technology,
    contributionAnalysis
) {
    const fileCount = technology.candidateFileCount;

    const additions = contributionAnalysis.totalAdditions;
    const deletions = contributionAnalysis.totalDeletions;
    const commits = contributionAnalysis.candidateCommitCount;

    let score = 0;

    // Number of files touched
    score += Math.min(fileCount * 1, 30);

    // Number of commits
    score += Math.min(commits * 0.5, 25);

    // Lines added
    score += Math.min(additions / 1000, 25);

    // Lines deleted
    score += Math.min(deletions / 500, 10);

    score = Math.round(Math.min(score, 100));

    let level;

    if (score >= 70) {
        level = "High";
    } else if (score >= 40) {
        level = "Medium";
    } else {
        level = "Low";
    }

    return {
        score,
        level
    };
}

module.exports = {
    getGitHubUserProfile,
    getUserRepositories,
    getRepositoryCommits,
    getCommitDetails,
    calculateOwnership,
    analyzeRepository,
    getRepositoryTree,
    getFileContent,
    detectTechnologies,
    analyzeTechnologies,
    matchTechnologiesToFiles,
    calculateContributionDepth
};