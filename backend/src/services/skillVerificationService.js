const {
    getRepositoryTree,
    getRepositoryCommits,
    getCommitDetails,
    getFileContent
} = require("./githubService");

const {
    analyzeJavaCode,
    analyzeDSA,
    analyzeAlgorithms,
    analyzeCodeForSkill,
    CODE_ANALYSIS_SKILLS,
    AUTO_VERIFIED_SKILLS,
    TREE_VERIFIED_SKILLS,
} = require("./codeAnalysisService");

/**
 * Run `tasks` (array of async functions) with at most `concurrency`
 * running at the same time. Prevents GitHub secondary rate limit (429)
 * when a user has many commits.
 */
async function pLimit(tasks, concurrency = 10) {
    const results = new Array(tasks.length);
    let index = 0;

    async function worker() {
        while (index < tasks.length) {
            const i = index++;
            results[i] = await tasks[i]();
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
    await Promise.all(workers);
    return results;
}


// Maps canonical skill name → file extensions that indicate its presence.
// Skills in CODE_ANALYSIS_SKILLS use code-pattern analysis (not just extensions).
// Skills in AUTO_VERIFIED_SKILLS / TREE_VERIFIED_SKILLS have special handling.
const skillFilePatterns = {
    // Languages
    Java:              [".java"],
    Python:            [".py", ".ipynb"],
    JavaScript:        [".js", ".jsx", ".mjs", ".cjs"],
    TypeScript:        [".ts", ".tsx"],
    "C++":             [".cpp", ".cc", ".cxx", ".h", ".hpp"],
    "C#":              [".cs"],
    Go:                [".go"],
    Rust:              [".rs"],
    Ruby:              [".rb"],
    PHP:               [".php"],
    Swift:             [".swift"],
    Kotlin:            [".kt", ".kts"],
    Dart:              [".dart"],
    Scala:             [".scala", ".sc"],
    Bash:              [".sh", ".bash"],

    // Frontend
    HTML:              [".html", ".htm"],
    CSS:               [".css"],
    SASS:              [".scss", ".sass"],
    React:             [".jsx", ".tsx"],
    "Vue.js":          [".vue"],
    Angular:           [".ts"],
    Svelte:            [".svelte"],
    "Next.js":         [".jsx", ".tsx", ".js", ".ts"],
    "Tailwind CSS":    [".html", ".jsx", ".tsx", ".vue", ".svelte"],

    // Backend
    "Node.js":         [".js", ".mjs", ".cjs"],
    "Express.js":      [".js"],
    "Spring Boot":     [".java"],
    Django:            [".py"],
    Flask:             [".py"],
    FastAPI:           [".py"],
    Laravel:           [".php"],
    NestJS:            [".ts"],
    GraphQL:           [".graphql", ".gql", ".js", ".ts"],

    // Mobile
    Flutter:           [".dart"],
    "React Native":    [".jsx", ".tsx", ".js"],
    Android:           [".kt", ".java"],
    iOS:               [".swift"],

    // Databases
    SQL:               [".sql"],
    MySQL:             [".sql"],
    PostgreSQL:        [".sql"],
    SQLite:            [".sql", ".db"],
    MongoDB:           [".js", ".ts", ".py"],
    Redis:             [".js", ".ts", ".py"],
    Firebase:          [".js", ".ts", ".dart"],

    // DevOps / Cloud
    Docker:            [".dockerfile", ".yml", ".yaml"],
    Kubernetes:        [".yml", ".yaml"],
    "CI/CD":           [".yml", ".yaml"],
    Nginx:             [".conf"],
    Terraform:         [".tf"],
    AWS:               [".yml", ".yaml", ".json", ".tf"],
    Azure:             [".yml", ".yaml", ".json", ".bicep"],
    "Oracle Cloud":    [".tf", ".yml"],

    // Stacks
    MERN:              [".js", ".jsx", ".ts", ".tsx"],
    MEAN:              [".js", ".ts"],

    // AI/ML
    "Machine Learning":[".py", ".ipynb"],
    "Deep Learning":   [".py", ".ipynb"],
    TensorFlow:        [".py"],
    PyTorch:           [".py"],
    Keras:             [".py"],
    "Scikit-learn":    [".py"],
    Pandas:            [".py", ".ipynb"],
    NumPy:             [".py", ".ipynb"],
    "Hugging Face":    [".py"],

    // Code-analysis skills: extensions below are for file filtering only;
    // actual verification uses pattern analysis, not just extension presence.
    OOP:               [".java", ".py", ".cpp", ".cs", ".ts"],
    DSA:               [".java", ".py", ".cpp", ".js", ".ts"],
    Algorithms:        [".java", ".py", ".cpp", ".js", ".ts"],
    "Data Structures": [".java", ".py", ".cpp", ".js", ".ts"],
    "REST API":        [".java", ".py", ".js", ".ts", ".jsx", ".tsx"],
    "Generative AI":   [".py", ".js", ".ts"],
    Matplotlib:        [".py", ".ipynb"],
    "Google Cloud":    [".py", ".js", ".ts", ".json", ".yml"],
    DBMS:              [".py", ".java", ".js", ".ts", ".sql"],
    "Operating Systems":[".py", ".c", ".cpp", ".java"],
    "Computer Networks":[".py", ".c", ".cpp", ".java", ".js"],
    // Git and GitHub are AUTO_VERIFIED (no extension needed)
    // VS Code is TREE_VERIFIED (looks for .vscode/ directory)
};

function getFileExtension(path) {
    const lastDot = path.lastIndexOf(".");

    if (lastDot === -1) {
        return "";
    }

    return path.substring(lastDot).toLowerCase();
}

function findSkillEvidence(files, skill) {
    const patterns = skillFilePatterns[skill];

    // Skills that require source-code analysis
//    if (
//     skill === "DSA" ||
//     skill === "Algorithms" ||
//     skill === "OOPs" ||
//     skill === "OOP"
// ) {
//     return {
//         skill,
//         matchingFiles: [],
//         fileCount: 0,
//         hasEvidence: false
//     };
// }

    const matchingFiles = files.filter(file => {
        const extension = getFileExtension(file);

        return patterns?.includes(extension);
    });

    return {
        skill,
        matchingFiles,
        fileCount: matchingFiles.length,
        hasEvidence: matchingFiles.length > 0
    };
}

async function verifySkillInRepository(
    owner,
    repo,
    skill,
    candidateUsername,
    accessToken
) {
    // --------------------------------
    // 1. Get repository file tree
    // --------------------------------
    const repositoryTree = await getRepositoryTree(
        owner,
        repo,
        accessToken
    );

    const files = repositoryTree.tree
        .filter(item => item.type === "blob")
        .map(item => item.path);

    const defaultBranch = repositoryTree.defaultBranch;

    // Find which repo files match the skill (e.g. .java for Java/OOPs)
    const fileEvidence = findSkillEvidence(files, skill);

    // --------------------------------
    // 2. Get all commits & filter to candidate
    // --------------------------------
    const commits = await getRepositoryCommits(
        owner,
        repo,
        accessToken
    );

    const candidateCommits = commits.filter(
        commit => commit.author?.login === candidateUsername
    );

    // --------------------------------
    // 3. Fetch candidate commit details in parallel
    //    (avoids slow sequential awaits for large repos)
    // --------------------------------
    const commitDetails = await Promise.all(
        candidateCommits.map(commit =>
            getCommitDetails(owner, repo, commit.sha, accessToken)
        )
    );

    // --------------------------------
    // 4. Collect all files the candidate modified
    // --------------------------------
    const candidateModifiedFiles = new Set();

    for (const details of commitDetails) {
        for (const file of details.files || []) {
            candidateModifiedFiles.add(file.filename);
        }
    }

    // -----------------------------------------------------------------------
    // 5. SPECIAL CASES: auto-verified and tree-verified skills
    // -----------------------------------------------------------------------

    // AUTO_VERIFIED: Git / GitHub — proved by the candidate having commits
    if (AUTO_VERIFIED_SKILLS.has(skill)) {
        const hasCommits = candidateCommits.length > 0;
        return {
            skill,
            verification: { skill, status: hasCommits ? "SUPPORTED" : "NO_EVIDENCE" },
            fileEvidence: { fileCount: 0, matchingFiles: [] },
            codeEvidence: [{ file: "GitHub Activity", evidence: hasCommits
                ? [`${candidateCommits.length} commit${candidateCommits.length !== 1 ? "s" : ""} on GitHub`]
                : [] }],
            contributionEvidence: {
                candidateCommitCount: candidateCommits.length,
                skillCommitCount: candidateCommits.length,
                modifiedSkillFiles: []
            },
            verificationNote: skill === "Git"
                ? "Verified: Candidate has commits on GitHub, proving direct Git usage."
                : "Verified: Candidate has a GitHub profile with commit activity."
        };
    }

    // TREE_VERIFIED: VS Code — look for .vscode/ directory in repo tree
    const treePatterns = TREE_VERIFIED_SKILLS[skill];
    if (treePatterns) {
        const allPaths = repositoryTree.tree.map(item => item.path);
        const matchedPaths = allPaths.filter(p =>
            treePatterns.some(pattern => p.startsWith(pattern) || p === pattern.replace(/\/$/, ""))
        );
        const hasVsCode = matchedPaths.length > 0;
        // Check if candidate touched those config files
        const candidateTouchedConfig = matchedPaths.some(p => candidateModifiedFiles.has(p));
        const status = hasVsCode
            ? (candidateTouchedConfig ? "SUPPORTED" : "REPOSITORY_EVIDENCE")
            : "NO_EVIDENCE";
        return {
            skill,
            verification: { skill, status },
            fileEvidence: { fileCount: matchedPaths.length, matchingFiles: matchedPaths.slice(0, 5) },
            codeEvidence: hasVsCode ? [{ file: matchedPaths[0], evidence: ["VS Code config file found"] }] : [],
            contributionEvidence: {
                candidateCommitCount: candidateCommits.length,
                skillCommitCount: candidateTouchedConfig ? 1 : 0,
                modifiedSkillFiles: []
            },
            verificationNote: "Verified via .vscode/ directory presence in repository."
        };
    }

    // -----------------------------------------------------------------------
    // 6. CODE-ANALYSIS or FILE-EXTENSION skills
    // -----------------------------------------------------------------------
    const isCodeAnalysisSkill = CODE_ANALYSIS_SKILLS.has(skill);

    const sourceExtensions = new Set([
        ".java", ".py", ".js", ".jsx", ".ts", ".tsx",
        ".cpp", ".c", ".cs", ".rb", ".go", ".rs",
        ".graphql", ".gql", ".sql", ".ipynb"
    ]);

    const codeEvidence = [];

    if (isCodeAnalysisSkill) {
        // Only look at files the candidate touched that still exist in the repo
        const candidateFiles = [...candidateModifiedFiles].filter(file =>
            files.includes(file) && sourceExtensions.has(getFileExtension(file))
        );

        const fileResults = await Promise.all(
            candidateFiles.map(async filePath => {
                try {
                    const content = await getFileContent(owner, repo, filePath, accessToken, defaultBranch);
                    return { filePath, content };
                } catch { return null; }
            })
        );

        for (const result of fileResults) {
            if (!result?.content) continue;
            const evidence = analyzeCodeForSkill(skill, result.content);
            if (evidence.length > 0) {
                codeEvidence.push({ file: result.filePath, evidence });
            }
        }
    }

    // -----------------------------------------------------------------------
    // 7. Count commits touching evidence files
    // -----------------------------------------------------------------------
    const evidenceFiles = new Set(
        isCodeAnalysisSkill
            ? codeEvidence.map(item => item.file)
            : fileEvidence.matchingFiles
    );

    const modifiedSkillFiles = new Set();
    let skillCommitCount = 0;

    for (const details of commitDetails) {
        let hit = false;
        for (const file of details.files || []) {
            if (evidenceFiles.has(file.filename)) {
                modifiedSkillFiles.add(file.filename);
                hit = true;
            }
        }
        if (hit) skillCommitCount++;
    }

    // -----------------------------------------------------------------------
    // 8. Determine status
    //    SUPPORTED            — real evidence + candidate contribution
    //    CODE_EVIDENCE        — patterns found but not in candidate's commits
    //    REPOSITORY_EVIDENCE  — file types exist but candidate didn't touch them
    //    NO_EVIDENCE          — nothing found
    // -----------------------------------------------------------------------
    let status = "NO_EVIDENCE";

    if (isCodeAnalysisSkill && codeEvidence.length > 0 && skillCommitCount > 0) {
        status = "SUPPORTED";
    } else if (!isCodeAnalysisSkill && fileEvidence.hasEvidence && skillCommitCount > 0) {
        status = "SUPPORTED";
    } else if (isCodeAnalysisSkill && codeEvidence.length > 0) {
        status = "CODE_EVIDENCE";
    } else if (!isCodeAnalysisSkill && fileEvidence.hasEvidence) {
        status = "REPOSITORY_EVIDENCE";
    }

    return {
        skill,
        verification: { skill, status },
        fileEvidence: { fileCount: evidenceFiles.size, matchingFiles: [...evidenceFiles] },
        codeEvidence,
        contributionEvidence: {
            candidateCommitCount: candidateCommits.length,
            skillCommitCount,
            modifiedSkillFiles: [...modifiedSkillFiles]
        }
    };
}


async function verifySkillsInRepository(
    owner,
    repo,
    skills,
    candidateUsername,
    accessToken
) {
    // =========================================================
    // 1. GET REPOSITORY TREE ONCE
    // =========================================================

    const repositoryTree = await getRepositoryTree(
        owner,
        repo,
        accessToken
    );

    const files = repositoryTree.tree
        .filter(item => item.type === "blob")
        .map(item => item.path);

    const currentRepositoryFiles = new Set(files);

    // =========================================================
    // 2. GET ALL COMMITS ONCE
    // =========================================================

    const commits = await getRepositoryCommits(
        owner,
        repo,
        accessToken
    );

    // =========================================================
    // 3. KEEP ONLY CANDIDATE COMMITS
    // =========================================================

    const candidateCommits = commits.filter(
        commit =>
            commit.author?.login === candidateUsername
    );

    // =========================================================
    // 4. GET CANDIDATE COMMIT DETAILS (max 10 at a time)
    //    Using pLimit to avoid GitHub secondary rate limit (429)
    // =========================================================

    const commitDetails = await pLimit(
        candidateCommits.map(commit => () =>
            getCommitDetails(
                owner,
                repo,
                commit.sha,
                accessToken
            )
        ),
        10
    );

    // =========================================================
    // 5. COLLECT ALL FILES MODIFIED BY CANDIDATE
    // =========================================================

    const candidateModifiedFiles = new Set();

    for (const details of commitDetails) {
        for (const file of details.files || []) {
            candidateModifiedFiles.add(file.filename);
        }
    }

    // =========================================================
    // 6. ONLY KEEP CURRENT SOURCE FILES
    //    THAT THE CANDIDATE ACTUALLY MODIFIED
    // =========================================================

    const sourceExtensions = new Set([
        ".java",
        ".py",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".cpp",
        ".c",
        ".cs"
    ]);

    const relevantFiles = [
        ...candidateModifiedFiles
    ].filter(file => {
        const extension = getFileExtension(file);

        return (
            currentRepositoryFiles.has(file) &&
            sourceExtensions.has(extension)
        );
    });

    // =========================================================
    // 7. DOWNLOAD FILE CONTENTS (max 5 at a time)
    //    Lower concurrency here since file downloads can be large.
    // =========================================================

    const fileResults = await pLimit(
        relevantFiles.map(filePath => async () => {
            try {
                const content = await getFileContent(
                    owner,
                    repo,
                    filePath,
                    accessToken,
                    repositoryTree.defaultBranch
                );

                return {
                    filePath,
                    content
                };

            } catch (error) {
                return null;
            }
        }),
        5
    );

    // =========================================================
    // 8. STORE FILE CONTENTS
    // =========================================================

    const fileContents = new Map();

    for (const result of fileResults) {
        if (
            result &&
            typeof result.content === "string" &&
            result.content.length > 0
        ) {
            fileContents.set(
                result.filePath,
                result.content
            );
        }
    }

    // =========================================================
    // 9. ANALYZE EACH FILE ONCE — for ALL code-analysis skills
    //    Each code-analysis skill gets its own evidence array.
    // =========================================================

    // Collect the unique set of code-analysis skills being requested
    const codeAnalysisSkillsRequested = skills.filter(s => CODE_ANALYSIS_SKILLS.has(s));

    const analyzedFiles = new Map(); // filePath → { [skill]: evidence[] }

    for (const [filePath, content] of fileContents.entries()) {
        const perFileAnalysis = {};
        for (const skill of codeAnalysisSkillsRequested) {
            perFileAnalysis[skill] = analyzeCodeForSkill(skill, content);
        }
        analyzedFiles.set(filePath, perFileAnalysis);
    }

    // =========================================================
    // 10. BUILD RESULTS FOR EACH REQUESTED SKILL
    // =========================================================

    const results = [];

    for (const skill of skills) {

        const isCodeAnalysisSkill = CODE_ANALYSIS_SKILLS.has(skill);

        // AUTO_VERIFIED skills (Git, GitHub): prove by commit count
        if (AUTO_VERIFIED_SKILLS.has(skill)) {
            const hasCommits = candidateCommits.length > 0;
            results.push({
                skill,
                verification: { skill, status: hasCommits ? "SUPPORTED" : "NO_EVIDENCE" },
                fileEvidence: { fileCount: 0, matchingFiles: [] },
                codeEvidence: [{ file: "GitHub Activity", evidence: hasCommits
                    ? [`${candidateCommits.length} commit${candidateCommits.length !== 1 ? "s" : ""} on GitHub`]
                    : [] }],
                contributionEvidence: {
                    candidateCommitCount: candidateCommits.length,
                    skillCommitCount: candidateCommits.length,
                    modifiedSkillFiles: []
                },
                verificationNote: `Auto-verified via GitHub commit activity.`
            });
            continue;
        }

        // TREE_VERIFIED skills (VS Code): look for .vscode/ in file tree
        const treePatterns = TREE_VERIFIED_SKILLS[skill];
        if (treePatterns) {
            const allPaths = files;
            const matchedPaths = allPaths.filter(p =>
                treePatterns.some(pattern => p.startsWith(pattern) || p === pattern.replace(/\/$/, ""))
            );
            const hasConfig = matchedPaths.length > 0;
            const candidateTouched = matchedPaths.some(p => candidateModifiedFiles.has(p));
            const status = hasConfig ? (candidateTouched ? "SUPPORTED" : "REPOSITORY_EVIDENCE") : "NO_EVIDENCE";
            results.push({
                skill,
                verification: { skill, status },
                fileEvidence: { fileCount: matchedPaths.length, matchingFiles: matchedPaths.slice(0, 5) },
                codeEvidence: hasConfig ? [{ file: matchedPaths[0], evidence: ["VS Code config file found"] }] : [],
                contributionEvidence: {
                    candidateCommitCount: candidateCommits.length,
                    skillCommitCount: candidateTouched ? 1 : 0,
                    modifiedSkillFiles: []
                },
                verificationNote: "Verified via .vscode/ directory in repository."
            });
            continue;
        }

        // =====================================================
        // 11. FILE-BASED EVIDENCE
        // =====================================================

        const repositoryFileEvidence =
            findSkillEvidence(
                files,
                skill
            );

        // =====================================================
        // 12. CODE EVIDENCE
        // =====================================================

        const codeEvidence = [];

        if (isCodeAnalysisSkill) {
            for (const [filePath, analysis] of analyzedFiles.entries()) {
                const evidence = analysis[skill];
                if (Array.isArray(evidence) && evidence.length > 0) {
                    codeEvidence.push({ file: filePath, evidence });
                }
            }
        }

        // =====================================================
        // 13. DETERMINE ACTUAL EVIDENCE FILES
        // =====================================================

        let evidenceFiles;

        if (isCodeAnalysisSkill) {

            // For OOPs / DSA / Algorithms,
            // only actual code evidence counts.

            evidenceFiles = new Set(
                codeEvidence.map(
                    item => item.file
                )
            );

        } else {

            // For technologies such as MERN,
            // repository file patterns count.

            evidenceFiles = new Set(
                repositoryFileEvidence.matchingFiles
            );
        }

        // =====================================================
        // 14. FIND CANDIDATE COMMITS TOUCHING
        //     EVIDENCE FILES
        // =====================================================

        const modifiedSkillFiles = new Set();

        let skillCommitCount = 0;

        for (const details of commitDetails) {

            let commitContainsSkillEvidence =
                false;

            for (const file of details.files || []) {

                if (
                    evidenceFiles.has(
                        file.filename
                    )
                ) {

                    modifiedSkillFiles.add(
                        file.filename
                    );

                    commitContainsSkillEvidence =
                        true;
                }
            }

            if (commitContainsSkillEvidence) {
                skillCommitCount++;
            }
        }

        // =====================================================
        // 15. DETERMINE VERIFICATION STATUS
        // =====================================================

        let status = "NO_EVIDENCE";

        // Actual code evidence + candidate contribution
        if (
            isCodeAnalysisSkill &&
            codeEvidence.length > 0 &&
            skillCommitCount > 0
        ) {

            status = "SUPPORTED";
        }

        // Repository/file evidence + candidate contribution
        else if (
            !isCodeAnalysisSkill &&
            repositoryFileEvidence.hasEvidence &&
            skillCommitCount > 0
        ) {

            status = "SUPPORTED";
        }

        // Actual code evidence but no matching contribution
        else if (
            isCodeAnalysisSkill &&
            codeEvidence.length > 0
        ) {

            status = "CODE_EVIDENCE";
        }

        // Repository evidence but no matching contribution
        else if (
            !isCodeAnalysisSkill &&
            repositoryFileEvidence.hasEvidence
        ) {

            status = "REPOSITORY_EVIDENCE";
        }

        // =====================================================
        // 16. FINAL RESULT
        // =====================================================

        results.push({

            skill,

            verification: {
                skill,
                status
            },

            fileEvidence: {

                fileCount:
                    evidenceFiles.size,

                matchingFiles:
                    [...evidenceFiles]
            },

            codeEvidence,

            contributionEvidence: {

                candidateCommitCount:
                    candidateCommits.length,

                skillCommitCount,

                modifiedSkillFiles:
                    [...modifiedSkillFiles]
            }
        });
    }

    return results;
}



// ============================================================
// STATUS RANKING — higher number = stronger evidence
// Used to pick the "best" result when merging across repos.
// ============================================================
const STATUS_RANK = {
    SUPPORTED:           4,
    CODE_EVIDENCE:       3,
    REPOSITORY_EVIDENCE: 2,
    NO_EVIDENCE:         1
};

/**
 * Verify a list of skills across ALL of the candidate's repositories.
 *
 * Strategy (two-pass for speed):
 *
 *  Pass 1 — file-tree scan (fast, O(repos))
 *    For every repo, fetch only the file tree and check if it contains
 *    files matching any claimed skill. Repos with no relevant files
 *    are skipped entirely.
 *
 *  Pass 2 — full analysis (only for repos that passed the scan)
 *    Run verifySkillsInRepository on each qualifying repo. This is the
 *    expensive step (commit downloads + code analysis) but we only do
 *    it for repos that actually matter.
 *
 *  Merge — pick best status per skill across all repos
 *    For each skill, keep the result with the highest evidence rank
 *    (SUPPORTED > CODE_EVIDENCE > REPOSITORY_EVIDENCE > NO_EVIDENCE).
 *    Attach a repoBreakdown[] so the UI can show which repos had evidence.
 *
 * @param {string}   candidateUsername  GitHub login of the candidate
 * @param {string[]} skills             Skills to verify
 * @param {string}   accessToken        GitHub OAuth / PAT
 * @param {Function} [onProgress]       Optional callback(msg) for streaming status
 * @returns {Promise<{results: Array, reposScanned: number, reposAnalyzed: number}>}
 */
async function verifySkillsAcrossAllRepositories(
    candidateUsername,
    skills,
    accessToken,
    onProgress = () => {}
) {
    // ----------------------------------------------------------
    // 1. FETCH ALL REPOS (uses /user/repos so private repos too)
    // ----------------------------------------------------------
    const { getUserRepositories } = require("./githubService");
    const allRepos = await getUserRepositories(candidateUsername, accessToken);
    onProgress(`Found ${allRepos.length} repositories`);

    const reposScanned = allRepos.length;
    if (reposScanned === 0) {
        return { results: skills.map(skill => ({
            skill,
            verification: { skill, status: "NO_EVIDENCE" },
            fileEvidence: { fileCount: 0, matchingFiles: [] },
            codeEvidence: [],
            contributionEvidence: { candidateCommitCount: 0, skillCommitCount: 0, modifiedSkillFiles: [] },
            repoBreakdown: []
        })), reposScanned: 0, reposAnalyzed: 0 };
    }

    // Work out the complete set of file extensions relevant to the requested skills
    const relevantExtensions = new Set(
        skills.flatMap(skill => skillFilePatterns[skill] || [])
    );
    // All code-analysis skills need source extensions
    const hasCodeAnalysisSkill = skills.some(s => CODE_ANALYSIS_SKILLS.has(s));
    if (hasCodeAnalysisSkill) {
        [".java", ".py", ".js", ".jsx", ".ts", ".tsx", ".cpp", ".c", ".cs", ".rb", ".go"]
            .forEach(e => relevantExtensions.add(e));
    }
    // Tree-verified skills need any file to be present (we check paths not extensions)
    // Auto-verified skills need no file extensions at all

    // ----------------------------------------------------------
    // 2. PASS 1 — FILE-TREE SCAN (concurrent, up to 8 at once)
    //    We only need the tree, not commits. Super fast.
    // ----------------------------------------------------------
    onProgress("Scanning repository file trees…");

    const treeTasks = allRepos.map(repo => async () => {
        try {
            const tree = await getRepositoryTree(
                repo.owner.login,
                repo.name,
                accessToken
            );
            const files = tree.tree
                .filter(item => item.type === "blob")
                .map(item => item.path);

            const hasRelevantFiles = files.some(f =>
                relevantExtensions.has(getFileExtension(f))
            );

            return { repo, files, defaultBranch: tree.defaultBranch, hasRelevantFiles };
        } catch {
            // Skip repos we can't access (e.g. archived, network error)
            return { repo, files: [], defaultBranch: "main", hasRelevantFiles: false };
        }
    });

    const treeResults = await pLimit(treeTasks, 8);
    const qualifyingRepos = treeResults.filter(r => r.hasRelevantFiles);

    onProgress(`${qualifyingRepos.length} of ${allRepos.length} repos have relevant files — starting full analysis…`);

    // ----------------------------------------------------------
    // 3. PASS 2 — FULL ANALYSIS (sequential to respect rate limits)
    //    Cap at 20 repos so we don't time out.
    // ----------------------------------------------------------
    const MAX_REPOS_TO_ANALYZE = 20;
    const reposToAnalyze = qualifyingRepos.slice(0, MAX_REPOS_TO_ANALYZE);
    const reposAnalyzed = reposToAnalyze.length;

    // repoResultsMap: repo.name → results array from verifySkillsInRepository
    const repoResultsMap = new Map();

    for (const { repo } of reposToAnalyze) {
        onProgress(`Analyzing ${repo.name}…`);
        try {
            const repoResults = await verifySkillsInRepository(
                repo.owner.login,
                repo.name,
                skills,
                candidateUsername,
                accessToken
            );
            repoResultsMap.set(repo.name, repoResults);
        } catch (err) {
            console.error(`Failed to analyze ${repo.name}:`, err.message);
        }
    }

    // ----------------------------------------------------------
    // 4. MERGE — per skill, pick best result across all repos
    // ----------------------------------------------------------
    const results = skills.map(skill => {
        // Collect all per-repo results for this skill
        const repoBreakdown = [];
        let bestResult = null;
        let bestRank   = 0;

        for (const [repoName, repoResults] of repoResultsMap.entries()) {
            const r = repoResults.find(res => res.skill === skill);
            if (!r) continue;

            const rank = STATUS_RANK[r.verification?.status] || 1;

            repoBreakdown.push({
                repo:    repoName,
                status:  r.verification?.status || "NO_EVIDENCE",
                commits: r.contributionEvidence?.skillCommitCount || 0,
                files:   r.fileEvidence?.fileCount || 0,
            });

            if (rank > bestRank) {
                bestRank   = rank;
                bestResult = r;
            }
        }

        // Sort breakdown: best status first, then by commits
        repoBreakdown.sort((a, b) =>
            (STATUS_RANK[b.status] - STATUS_RANK[a.status]) ||
            (b.commits - a.commits)
        );

        if (!bestResult) {
            return {
                skill,
                verification:       { skill, status: "NO_EVIDENCE" },
                fileEvidence:       { fileCount: 0, matchingFiles: [] },
                codeEvidence:       [],
                contributionEvidence: { candidateCommitCount: 0, skillCommitCount: 0, modifiedSkillFiles: [] },
                repoBreakdown
            };
        }

        return {
            ...bestResult,
            repoBreakdown
        };
    });

    return { results, reposScanned, reposAnalyzed };
}


module.exports = {
    findSkillEvidence,
    verifySkillInRepository,
    verifySkillsInRepository,
    verifySkillsAcrossAllRepositories
};