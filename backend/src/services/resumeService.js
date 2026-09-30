// pdf-parse exports a plain async function — NOT a class.
// Correct usage: const result = await pdfParse(buffer);
// result.text contains the extracted plain text.
const pdfParse = require("pdf-parse");

async function extractResumeText(buffer) {
    // Suppress noisy pdf.js TT font hinting warnings (e.g. Warning: TT: undefined function: 32)
    const originalWarn = console.warn;
    console.warn = (...args) => {
        if (typeof args[0] === "string" && args[0].includes("TT:")) return;
        originalWarn.apply(console, args);
    };

    try {
        const result = await pdfParse(buffer);
        return result.text;
    } finally {
        console.warn = originalWarn;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────
function extractResumeSections(text) {
    const sections = {
        objective: "",
        education: "",
        technicalSkills: "",
        projects: "",
        internships: "",
        certificates: "",
        extracurricular: "",
        interests: ""
    };

    const sectionPatterns = [
        { name: "objective",       pattern: /^(objective|career objective|profile|summary|about me)$/i },
        { name: "technicalSkills", pattern: /^(technical skills?|skills?|technical knowledge|core competencies|technologies|tech stack|tools? [&and]+ technologies|programming languages?)$/i },
        { name: "projects",        pattern: /^(projects?|academic projects?|personal projects?|side projects?|portfolio)$/i },
        { name: "education",       pattern: /^(education|academic background|qualification|academics)$/i },
        { name: "internships",     pattern: /^(internships?|experience|work experience|professional experience|employment)$/i },
        { name: "certificates",    pattern: /^(certificates?|certifications?|courses?|achievements?)$/i },
        { name: "extracurricular", pattern: /^(extra.?curricular activities?|activities?|leadership|volunteer)$/i },
        { name: "interests",       pattern: /^(interest|interests|hobbies|passions?)$/i },
    ];

    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

    let currentSection = null;

    for (const line of lines) {
        const section = sectionPatterns.find(item => item.pattern.test(line));
        if (section) {
            currentSection = section.name;
            continue;
        }
        if (currentSection) {
            sections[currentSection] += line + "\n";
        }
    }

    return sections;
}


// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL SKILL DICTIONARY
// canonical  — normalized display name
// aliases    — all name variants matched case-insensitively
// category   — grouping label
// ─────────────────────────────────────────────────────────────────────────────
const SKILL_DICTIONARY = [
    // Languages
    { canonical: "JavaScript",  aliases: ["javascript", "js", "ecmascript", "es6", "es2015", "vanilla js"], category: "Language" },
    { canonical: "TypeScript",  aliases: ["typescript", "ts"], category: "Language" },
    { canonical: "Python",      aliases: ["python", "python3", "python2"], category: "Language" },
    { canonical: "Java",        aliases: ["java"], category: "Language" },
    { canonical: "C++",         aliases: ["c++", "cpp", "c plus plus"], category: "Language" },
    { canonical: "C",           aliases: ["c programming", "c language"], category: "Language" },
    { canonical: "C#",          aliases: ["c#", "csharp", "c sharp"], category: "Language" },
    { canonical: "Go",          aliases: ["golang", "go lang"], category: "Language" },
    { canonical: "Rust",        aliases: ["rust", "rust-lang"], category: "Language" },
    { canonical: "Ruby",        aliases: ["ruby", "ruby on rails"], category: "Language" },
    { canonical: "PHP",         aliases: ["php"], category: "Language" },
    { canonical: "Swift",       aliases: ["swift", "swiftui"], category: "Language" },
    { canonical: "Kotlin",      aliases: ["kotlin"], category: "Language" },
    { canonical: "Dart",        aliases: ["dart"], category: "Language" },
    { canonical: "Scala",       aliases: ["scala"], category: "Language" },
    { canonical: "R",           aliases: ["r programming", "r language"], category: "Language" },
    { canonical: "MATLAB",      aliases: ["matlab"], category: "Language" },
    { canonical: "Bash",        aliases: ["bash", "shell scripting", "shell script", "bash scripting"], category: "Language" },
    { canonical: "Perl",        aliases: ["perl"], category: "Language" },
    { canonical: "Elixir",      aliases: ["elixir"], category: "Language" },

    // Frontend
    { canonical: "React",       aliases: ["react", "reactjs", "react.js", "react js"], category: "Frontend" },
    { canonical: "Vue.js",      aliases: ["vue", "vuejs", "vue.js", "vue js"], category: "Frontend" },
    { canonical: "Angular",     aliases: ["angular", "angularjs", "angular.js"], category: "Frontend" },
    { canonical: "Svelte",      aliases: ["svelte", "sveltejs", "svelte.js"], category: "Frontend" },
    { canonical: "Next.js",     aliases: ["nextjs", "next.js", "next js"], category: "Frontend" },
    { canonical: "Nuxt.js",     aliases: ["nuxtjs", "nuxt.js", "nuxt js"], category: "Frontend" },
    { canonical: "HTML",        aliases: ["html", "html5"], category: "Frontend" },
    { canonical: "CSS",         aliases: ["css", "css3"], category: "Frontend" },
    { canonical: "Tailwind CSS",aliases: ["tailwind css", "tailwindcss", "tailwind"], category: "Frontend" },
    { canonical: "Bootstrap",   aliases: ["bootstrap"], category: "Frontend" },
    { canonical: "Material UI", aliases: ["material ui", "material-ui", "mui"], category: "Frontend" },
    { canonical: "Redux",       aliases: ["redux", "redux toolkit"], category: "Frontend" },
    { canonical: "jQuery",      aliases: ["jquery"], category: "Frontend" },
    { canonical: "SASS",        aliases: ["sass", "scss"], category: "Frontend" },
    { canonical: "Webpack",     aliases: ["webpack"], category: "Frontend" },
    { canonical: "Vite",        aliases: ["vite", "vitejs"], category: "Frontend" },

    // Backend / Runtime
    { canonical: "Node.js",     aliases: ["nodejs", "node.js", "node js", "node"], category: "Backend" },
    { canonical: "Express.js",  aliases: ["express", "expressjs", "express.js", "express js"], category: "Backend" },
    { canonical: "Spring Boot", aliases: ["spring boot", "springboot"], category: "Backend" },
    { canonical: "Spring",      aliases: ["spring framework", "spring mvc"], category: "Backend" },
    { canonical: "Django",      aliases: ["django"], category: "Backend" },
    { canonical: "Flask",       aliases: ["flask"], category: "Backend" },
    { canonical: "FastAPI",     aliases: ["fastapi", "fast api"], category: "Backend" },
    { canonical: "Laravel",     aliases: ["laravel"], category: "Backend" },
    { canonical: "NestJS",      aliases: ["nestjs", "nest.js", "nest js"], category: "Backend" },
    { canonical: "GraphQL",     aliases: ["graphql", "graph ql"], category: "Backend" },
    { canonical: "REST API",    aliases: ["rest api", "restful api", "rest apis", "restful apis", "restful"], category: "Backend" },
    { canonical: "gRPC",        aliases: ["grpc"], category: "Backend" },

    // Mobile
    { canonical: "Flutter",     aliases: ["flutter"], category: "Mobile" },
    { canonical: "React Native",aliases: ["react native", "react-native"], category: "Mobile" },
    { canonical: "Android",     aliases: ["android development", "android sdk", "android studio"], category: "Mobile" },
    { canonical: "iOS",         aliases: ["ios development", "ios sdk", "xcode"], category: "Mobile" },

    // Databases
    { canonical: "SQL",            aliases: ["sql", "structured query language"], category: "Database" },
    { canonical: "MySQL",          aliases: ["mysql"], category: "Database" },
    { canonical: "PostgreSQL",     aliases: ["postgresql", "postgres", "psql"], category: "Database" },
    { canonical: "MongoDB",        aliases: ["mongodb", "mongo db", "mongo"], category: "Database" },
    { canonical: "SQLite",         aliases: ["sqlite", "sqlite3"], category: "Database" },
    { canonical: "Redis",          aliases: ["redis"], category: "Database" },
    { canonical: "Firebase",       aliases: ["firebase", "firestore", "firebase realtime"], category: "Database" },
    { canonical: "Cassandra",      aliases: ["cassandra", "apache cassandra"], category: "Database" },
    { canonical: "DynamoDB",       aliases: ["dynamodb", "dynamo db"], category: "Database" },
    { canonical: "Elasticsearch",  aliases: ["elasticsearch", "elastic search"], category: "Database" },
    { canonical: "Oracle DB",      aliases: ["oracle db", "oracle database", "pl/sql", "plsql"], category: "Database" },
    { canonical: "SQL Server",     aliases: ["microsoft sql server", "mssql", "ms sql", "sql server"], category: "Database" },

    // Cloud
    { canonical: "AWS",            aliases: ["aws", "amazon web services", "amazon aws"], category: "Cloud" },
    { canonical: "Azure",          aliases: ["azure", "microsoft azure"], category: "Cloud" },
    { canonical: "Google Cloud",   aliases: ["google cloud", "gcp", "google cloud platform"], category: "Cloud" },
    { canonical: "Oracle Cloud",   aliases: ["oracle cloud", "oci"], category: "Cloud" },

    // DevOps
    { canonical: "Docker",         aliases: ["docker", "docker compose", "dockerfile"], category: "DevOps" },
    { canonical: "Kubernetes",     aliases: ["kubernetes", "k8s"], category: "DevOps" },
    { canonical: "Terraform",      aliases: ["terraform"], category: "DevOps" },
    { canonical: "CI/CD",          aliases: ["ci/cd", "cicd", "continuous integration", "continuous deployment", "jenkins", "github actions", "gitlab ci"], category: "DevOps" },
    { canonical: "Nginx",          aliases: ["nginx"], category: "DevOps" },
    { canonical: "Linux",          aliases: ["linux", "ubuntu", "centos", "debian"], category: "DevOps" },

    // AI / ML
    { canonical: "Machine Learning",aliases: ["machine learning", "ml"], category: "AI/ML" },
    { canonical: "Deep Learning",   aliases: ["deep learning", "neural networks", "neural network"], category: "AI/ML" },
    { canonical: "TensorFlow",      aliases: ["tensorflow", "tensor flow"], category: "AI/ML" },
    { canonical: "PyTorch",         aliases: ["pytorch", "torch"], category: "AI/ML" },
    { canonical: "Keras",           aliases: ["keras"], category: "AI/ML" },
    { canonical: "Scikit-learn",    aliases: ["scikit-learn", "scikit learn", "sklearn"], category: "AI/ML" },
    { canonical: "NLP",             aliases: ["nlp", "natural language processing"], category: "AI/ML" },
    { canonical: "Computer Vision", aliases: ["computer vision", "image processing", "opencv"], category: "AI/ML" },
    { canonical: "Generative AI",   aliases: ["generative ai", "gen ai", "large language model", "langchain", "prompt engineering"], category: "AI/ML" },
    { canonical: "Pandas",          aliases: ["pandas"], category: "AI/ML" },
    { canonical: "NumPy",           aliases: ["numpy", "num py"], category: "AI/ML" },
    { canonical: "Matplotlib",      aliases: ["matplotlib", "seaborn", "plotly"], category: "AI/ML" },
    { canonical: "Hugging Face",    aliases: ["huggingface", "hugging face", "transformers"], category: "AI/ML" },

    // CS Fundamentals
    { canonical: "DSA",             aliases: ["dsa", "data structures and algorithms", "data structures & algorithms"], category: "CS Fundamentals" },
    { canonical: "Data Structures", aliases: ["data structures"], category: "CS Fundamentals" },
    { canonical: "Algorithms",      aliases: ["algorithms"], category: "CS Fundamentals" },
    { canonical: "OOP",             aliases: ["oops", "oop", "object oriented programming", "object-oriented programming", "oops concepts"], category: "CS Fundamentals" },
    { canonical: "System Design",   aliases: ["system design", "distributed systems", "microservices"], category: "CS Fundamentals" },
    { canonical: "DBMS",            aliases: ["dbms", "database management system", "database management"], category: "CS Fundamentals" },
    { canonical: "Operating Systems",aliases: ["operating systems", "os concepts"], category: "CS Fundamentals" },
    { canonical: "Computer Networks",aliases: ["computer networks", "networking", "tcp/ip", "network programming"], category: "CS Fundamentals" },

    // Tools
    { canonical: "Git",             aliases: ["git"], category: "Tools" },
    { canonical: "GitHub",          aliases: ["github"], category: "Tools" },
    { canonical: "GitLab",          aliases: ["gitlab"], category: "Tools" },
    { canonical: "Jira",            aliases: ["jira"], category: "Tools" },
    { canonical: "Figma",           aliases: ["figma"], category: "Tools" },
    { canonical: "Postman",         aliases: ["postman"], category: "Tools" },
    { canonical: "VS Code",         aliases: ["vs code", "vscode", "visual studio code"], category: "Tools" },
    { canonical: "IntelliJ",        aliases: ["intellij", "intellij idea"], category: "Tools" },
    { canonical: "Jupyter",         aliases: ["jupyter", "jupyter notebook", "jupyter lab"], category: "Tools" },

    // Stacks
    { canonical: "MERN",            aliases: ["mern", "mern stack"], category: "Stack" },
    { canonical: "MEAN",            aliases: ["mean", "mean stack"], category: "Stack" },
    { canonical: "LAMP",            aliases: ["lamp", "lamp stack"], category: "Stack" },
    { canonical: "JAMstack",        aliases: ["jamstack", "jam stack"], category: "Stack" },
];

// Build alias lookup map: alias (lowercase) → skill entry
const _aliasMap = new Map();
for (const entry of SKILL_DICTIONARY) {
    for (const alias of entry.aliases) {
        _aliasMap.set(alias.toLowerCase(), entry);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WEIGHTS
// Skills found in higher-weight sections get a higher confidence score.
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_WEIGHTS = {
    technicalSkills: 3,
    projects:        2,
    internships:     2,
    certificates:    1.5,
    objective:       1,
    education:       1,
    extracurricular: 0.5,
    interests:       0.5,
};

// ─────────────────────────────────────────────────────────────────────────────
// DESCRIPTION LINE DETECTION
// These lines have skills but in a context-sentence — lower weight not skipped.
// ─────────────────────────────────────────────────────────────────────────────
const DESCRIPTION_PATTERNS = [
    /^[•●▪◦▸►▶\-\u2013\u2014*]\s/u,
    /\b(developed|implemented|built|designed|used|leveraged|utilized|integrated)\b/i,
    /\b(responsible for|worked on|contributed to)\b/i,
];

function isDescriptionLine(line) {
    return DESCRIPTION_PATTERNS.some(p => p.test(line));
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL SCANNER
// Returns Map<canonical → { entry, score, sources[] }>
// ─────────────────────────────────────────────────────────────────────────────
function scanTextForSkills(text, baseWeight) {
    const found = new Map();

    const lines = text
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 1);

    for (const line of lines) {
        const lineWeight = isDescriptionLine(line) ? baseWeight * 0.6 : baseWeight;
        const lowerLine  = line.toLowerCase();

        for (const [alias, entry] of _aliasMap.entries()) {
            const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            // Short aliases need strict word boundaries to avoid false positives.
            // Longer aliases use lookahead/lookbehind for alphanumeric neighbors.
            const pattern = alias.length <= 3
                ? `(?<![a-z0-9])${escaped}(?![a-z0-9])`
                : `(?<![a-zA-Z0-9.])${escaped}(?![a-zA-Z0-9])`;

            let matches = false;
            try {
                matches = new RegExp(pattern, "i").test(lowerLine);
            } catch (_) {
                // If regex is invalid for some alias, skip
                matches = lowerLine.includes(alias);
            }

            if (matches) {
                const key = entry.canonical;
                if (found.has(key)) {
                    const existing = found.get(key);
                    existing.score += lineWeight;
                    if (!existing.sources.includes(line)) existing.sources.push(line);
                } else {
                    found.set(key, { entry, score: lineWeight, sources: [line] });
                }
            }
        }
    }

    return found;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSUMPTION RULES
// If a parent skill is found, redundant child skills are removed.
// ─────────────────────────────────────────────────────────────────────────────
const SUBSUMPTION_RULES = [
    { parent: "DSA",        children: ["Data Structures", "Algorithms"] },
    { parent: "Spring Boot",children: ["Spring"] },
];

function applySubsumption(skillMap) {
    for (const { parent, children } of SUBSUMPTION_RULES) {
        if (skillMap.has(parent)) {
            for (const child of children) skillMap.delete(child);
        }
    }
    return skillMap;
}

// Minimum cumulative score to include a skill (filters out accidental matches)
const MIN_SCORE_THRESHOLD = 0.5;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
function extractSkillClaims(text) {
    const sections = extractResumeSections(text);

    const masterMap = new Map(); // canonical → { entry, score, sources }

    function mergeIn(sectionMap) {
        for (const [canonical, data] of sectionMap.entries()) {
            if (masterMap.has(canonical)) {
                const existing = masterMap.get(canonical);
                existing.score += data.score;
                for (const s of data.sources) {
                    if (!existing.sources.includes(s)) existing.sources.push(s);
                }
            } else {
                masterMap.set(canonical, { entry: data.entry, score: data.score, sources: [...data.sources] });
            }
        }
    }

    // 1. Scan each named section with its weight
    for (const [sectionName, weight] of Object.entries(SECTION_WEIGHTS)) {
        const sectionText = sections[sectionName] || "";
        if (!sectionText.trim()) continue;
        mergeIn(scanTextForSkills(sectionText, weight));
    }

    // 2. Full-text fallback scan — only for skills NOT already found in a named section.
    //    This prevents double-counting skills that appeared in named sections,
    //    while still catching skills mentioned in unrecognized section headers.
    const alreadyFound = new Set(masterMap.keys());
    const fullScan = scanTextForSkills(text, 1);
    for (const [canonical, data] of fullScan.entries()) {
        if (!alreadyFound.has(canonical)) {
            // Only add new discoveries from the full-text scan
            masterMap.set(canonical, { entry: data.entry, score: data.score, sources: [...data.sources] });
        }
    }

    // 3. Deduplication
    applySubsumption(masterMap);

    // 4. Filter noise, sort by confidence, normalize
    const claims = [...masterMap.values()]
        .filter(d => d.score >= MIN_SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .map(d => ({
            name:       d.entry.canonical,
            category:   d.entry.category,
            confidence: Math.min(1, parseFloat((d.score / 8).toFixed(2))),
            source:     d.sources[0] || "",
            sources:    d.sources.slice(0, 3),
        }));

    return claims;
}

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB PROFILE DETECTOR
// Extracts GitHub username & URL directly from resume text.
// ─────────────────────────────────────────────────────────────────────────────
function extractGitHubInfo(text, buffer = null) {
    if (!text && !buffer) return null;

    const reserved = new Set([
        // GitHub internal / common routes
        "login", "join", "about", "pricing", "features", "topics", "trending",
        "contact", "explore", "marketplace", "enterprise", "settings", "pulls",
        "issues", "site", "security", "customer-stories", "readme", "home",
        "notifications", "new", "search", "orgs", "organizations", "git",
        "dashboard", "repository", "repositories", "account", "profile",

        // Other tech / resume platforms commonly listed beside GitHub
        "leetcode", "linkedin", "hackerrank", "codeforces", "codechef",
        "kaggle", "geeksforgeeks", "gfg", "stackoverflow", "hackerearth",
        "medium", "dev", "portfolio", "website", "email", "phone", "mobile",
        "resume", "cv", "projects", "experience", "skills", "education",
        "null", "undefined", "user", "username", "link", "links"
    ]);

    function isValid(u) {
        if (!u) return false;
        const clean = u.replace(/[\/\)\s,;]+$/, "");
        if (clean.length < 1 || clean.length > 39) return false;
        return !reserved.has(clean.toLowerCase());
    }

    // 1. Text URL pattern
    if (text) {
        const urlPattern = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\b/gi;
        let match;
        while ((match = urlPattern.exec(text)) !== null) {
            if (isValid(match[1])) {
                return {
                    username: match[1],
                    url: `https://github.com/${match[1]}`,
                    source: match[0]
                };
            }
        }

        // 2. Loose URL pattern (spaces from PDF font kerning: github . com / username)
        const loosePattern = /github\s*\.\s*com\s*\/\s*([a-zA-Z0-9_-]{1,39})/gi;
        while ((match = loosePattern.exec(text)) !== null) {
            if (isValid(match[1])) {
                return {
                    username: match[1],
                    url: `https://github.com/${match[1]}`,
                    source: match[0]
                };
            }
        }

        // 3. Label pattern on the same line (GitHub: username, GitHub - username)
        const labelPattern = /(?:github|git\s*hub|gh)[^\S\r\n]*[:\-–|•][^\S\r\n]*@?([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\b/gi;
        while ((match = labelPattern.exec(text)) !== null) {
            if (isValid(match[1])) {
                return {
                    username: match[1],
                    url: `https://github.com/${match[1]}`,
                    source: match[0]
                };
            }
        }
    }

    // 4. Raw PDF Buffer scan (for clickable links embedded in PDF annotations/icons)
    if (buffer && Buffer.isBuffer(buffer)) {
        const str = buffer.toString("binary");

        // Clickable URI annotation: /URI (https://github.com/<username>)
        const uriPattern = /\/URI\s*\((?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]{1,39})/gi;
        let match;
        while ((match = uriPattern.exec(str)) !== null) {
            if (isValid(match[1])) {
                return {
                    username: match[1],
                    url: `https://github.com/${match[1]}`,
                    source: "pdf-annotation"
                };
            }
        }

        // Raw stream occurrences
        const rawPattern = /github\.com\/([a-zA-Z0-9_-]{1,39})/gi;
        while ((match = rawPattern.exec(str)) !== null) {
            if (isValid(match[1])) {
                return {
                    username: match[1],
                    url: `https://github.com/${match[1]}`,
                    source: "pdf-stream"
                };
            }
        }
    }

    return null;
}

module.exports = {
    extractResumeText,
    extractResumeSections,
    extractSkillClaims,
    extractGitHubInfo,
};