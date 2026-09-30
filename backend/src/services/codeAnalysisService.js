function uniqueEvidence(evidence) {
    return [...new Set(evidence)];
}


// =========================================================
// OOP ANALYSIS (Java)
// =========================================================
function analyzeJavaCode(content) {
    const evidence = [];

    if (/\bclass\s+\w+/.test(content))                             evidence.push("class");
    if (/\binterface\s+\w+/.test(content))                         evidence.push("interface");
    if (/\bextends\s+\w+/.test(content))                           evidence.push("inheritance");
    if (/\bimplements\s+[\w\s,<>]+/.test(content))                 evidence.push("interface implementation");
    if (/\b(public|private|protected)\s+(static\s+)?(final\s+)?[\w<>\[\]]+\s+\w+\s*(=|;)/.test(content))
                                                                    evidence.push("encapsulation");
    if (/\babstract\s+class\s+\w+/.test(content) || /\babstract\s+[\w<>\[\]]+\s+\w+\s*\(/.test(content))
                                                                    evidence.push("abstraction");
    if (/\bthis\.\w+/.test(content))                               evidence.push("this keyword");
    if (/\bsuper\s*\(/.test(content) || /\bsuper\.\w+/.test(content)) evidence.push("super keyword");
    if (/@Override\b/.test(content))                               evidence.push("method overriding");

    return uniqueEvidence(evidence);
}


// =========================================================
// DSA ANALYSIS
// =========================================================
function analyzeDSA(content) {
    const evidence = [];

    if (/\bArrayList\s*</.test(content) || /\bArrayList\b/.test(content) ||
        /\b\w+\[\]\s+\w+/.test(content) || /\bnew\s+\w+\s*\[\s*\w+\s*\]/.test(content))
        evidence.push("array");

    if (/\bLinkedList\b/.test(content) || /\bListNode\b/.test(content) ||
        (/\bNode\s+\w+/.test(content) && /\.\s*next\b/.test(content)))
        evidence.push("linked list");

    if (/\bStack\s*</.test(content) || /\bStack\b/.test(content) || /\bDeque\s*</.test(content))
        evidence.push("stack");

    if (/\bQueue\s*</.test(content) || /\bPriorityQueue\b/.test(content))
        evidence.push("queue");

    if (/\bTreeNode\b/.test(content) || /\bBinaryTree\b/.test(content) || /\bTree\s*</.test(content))
        evidence.push("tree");

    if (/\bGraph\b/.test(content) || /\badjacency\s+(list|matrix)\b/i.test(content) ||
        /\badjList\b/i.test(content))
        evidence.push("graph");

    if (/\bbinary\s+search\b/i.test(content) || /\bBinarySearch\b/.test(content))
        evidence.push("binary search");

    if (/\bmerge\s+sort\b/i.test(content) || /\bMergeSort\b/.test(content) || /\bmergeSort\b/.test(content))
        evidence.push("merge sort");

    if (/\bquick\s+sort\b/i.test(content) || /\bQuickSort\b/.test(content) || /\bquickSort\b/.test(content))
        evidence.push("quick sort");

    if (/\bHashMap\b/.test(content) || /\bHashSet\b/.test(content) || /\bhash\s+table\b/i.test(content))
        evidence.push("hash table");

    return uniqueEvidence(evidence);
}


// =========================================================
// ALGORITHM ANALYSIS
// =========================================================
function analyzeAlgorithms(content) {
    const evidence = [];

    if (/\bbinary\s+search\b/i.test(content) || /\bBinarySearch\b/.test(content))
        evidence.push("binary search");

    if (/\bmerge\s+sort\b/i.test(content) || /\bMergeSort\b/.test(content) || /\bmergeSort\b/.test(content))
        evidence.push("merge sort");

    if (/\bquick\s+sort\b/i.test(content) || /\bQuickSort\b/.test(content) || /\bquickSort\b/.test(content))
        evidence.push("quick sort");

    // Detect actual recursion (method calling itself), not the word
    const methodPattern = /\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = methodPattern.exec(content)) !== null) {
        const name = match[1], body = match[2];
        if (name && body && new RegExp(`\\b${name}\\s*\\(`).test(body)) {
            evidence.push("recursion"); break;
        }
    }

    const hasDPArray = /\b(?:int|long|double|boolean)\s*\[\s*\]\s*(?:dp|memo|table)\b/i.test(content) ||
                       /\b(?:int|long|double|boolean)\s*\[\s*\]\s*\[\s*\]\s*(?:dp|memo|table)\b/i.test(content);
    const hasMemo    = /\bmemoization\b/i.test(content) || /\b(?:memo|dp)\s*\[\s*[^\]]+\s*\]\s*=/i.test(content);
    if (hasDPArray || hasMemo || /\btabulation\b/i.test(content)) evidence.push("dynamic programming");

    if (/\bbacktracking\b/i.test(content) ||
        (/add\s*\(/i.test(content) && /remove\s*\(/i.test(content) && /\breturn\b/.test(content)))
        evidence.push("backtracking");

    if (/\bgreedy\s+(algorithm|approach|method)\b/i.test(content)) evidence.push("greedy");

    const hasPointerCmp = /\b(left|l)\s*[<>]=?\s*(right|r)\b/i.test(content);
    const hasPointerMov = /\b(left|l|right|r)\s*(\+\+|--|[+-]=\s*1)/i.test(content);
    if (hasPointerCmp && hasPointerMov) evidence.push("two pointers");

    return uniqueEvidence(evidence);
}


// =========================================================
// REST API ANALYSIS
// Detects HTTP route definitions and HTTP client calls.
// Works across Node/Express, Python (Flask/FastAPI/Django),
// Java (Spring), and generic fetch/axios/requests usage.
// =========================================================
function analyzeRestApi(content) {
    const evidence = [];

    // Express-style route handlers: app.get/post/put/delete/patch
    if (/\bapp\.(get|post|put|delete|patch)\s*\(/.test(content) ||
        /\brouter\.(get|post|put|delete|patch)\s*\(/.test(content))
        evidence.push("Express route handler");

    // Spring / Java annotations
    if (/@(GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping|RestController|Controller)\b/.test(content))
        evidence.push("Spring REST controller");

    // Flask / FastAPI Python decorators
    if (/@app\.(route|get|post|put|delete)\s*\(/.test(content) ||
        /@router\.(get|post|put|delete)\s*\(/.test(content))
        evidence.push("Python route decorator");

    // fetch / axios HTTP calls
    if (/\bfetch\s*\(/.test(content))
        evidence.push("fetch API call");
    if (/\baxios\.(get|post|put|delete|patch)\s*\(/.test(content) || /\baxios\s*\(/.test(content))
        evidence.push("axios HTTP client");

    // Python requests library
    if (/\brequests\.(get|post|put|delete|patch)\s*\(/.test(content))
        evidence.push("requests HTTP client");

    // HTTP status codes / response objects (common in API handlers)
    if (/res\.(json|status|send)\s*\(/.test(content) || /response\.(json|status_code)\b/.test(content))
        evidence.push("HTTP response handling");

    // OpenAPI / Swagger annotations
    if (/@ApiOperation|@ApiResponse|@swagger/.test(content))
        evidence.push("OpenAPI/Swagger annotation");

    return uniqueEvidence(evidence);
}


// =========================================================
// GENERATIVE AI ANALYSIS
// Detects usage of LLM / GenAI SDKs and APIs.
// =========================================================
function analyzeGenerativeAi(content) {
    const evidence = [];

    // OpenAI SDK
    if (/\bopenai\b/i.test(content) || /OpenAI\s*\(/.test(content) ||
        /client\.chat\.completions/.test(content) || /ChatCompletion/.test(content))
        evidence.push("OpenAI SDK");

    // LangChain
    if (/\blangchain\b/i.test(content) || /from\s+langchain/.test(content) ||
        /LLMChain|ChatOpenAI|PromptTemplate|ConversationChain/.test(content))
        evidence.push("LangChain");

    // Google Generative AI (Gemini)
    if (/google\.generativeai|genai\.configure|generativeai/i.test(content) ||
        /GoogleGenerativeAI|GeminiPro/.test(content))
        evidence.push("Google Gemini API");

    // Hugging Face Transformers / Inference API
    if (/from\s+transformers\s+import/.test(content) || /pipeline\s*\(/.test(content) ||
        /AutoModelFor\w+/.test(content) || /InferenceClient/.test(content))
        evidence.push("Hugging Face Transformers");

    // Anthropic Claude
    if (/\banthropic\b/i.test(content) || /Anthropic\s*\(/.test(content) ||
        /claude-\w+/.test(content))
        evidence.push("Anthropic Claude");

    // Generic LLM patterns
    if (/\bllm\s*=/.test(content) || /prompt_template|system_prompt|chat_history/.test(content) ||
        /embeddings\s*=|vector_store|RAG\b/.test(content))
        evidence.push("LLM pipeline");

    // Azure OpenAI
    if (/AzureOpenAI|azure\.openai/.test(content))
        evidence.push("Azure OpenAI");

    return uniqueEvidence(evidence);
}


// =========================================================
// MATPLOTLIB ANALYSIS
// =========================================================
function analyzeMatplotlib(content) {
    const evidence = [];

    if (/import\s+matplotlib/.test(content) || /from\s+matplotlib\s+import/.test(content))
        evidence.push("matplotlib import");

    if (/\bplt\.(plot|scatter|bar|hist|pie|show|savefig|figure|subplot|xlabel|ylabel|title)\s*\(/.test(content))
        evidence.push("pyplot plot call");

    if (/\bfig\s*,\s*ax\s*=\s*plt\.subplots/.test(content) || /\bax\.plot\s*\(/.test(content))
        evidence.push("subplot/axes API");

    if (/import\s+seaborn|from\s+seaborn\s+import/.test(content) || /\bsns\.(scatterplot|heatmap|barplot|pairplot)\s*\(/.test(content))
        evidence.push("seaborn plot");

    if (/import\s+plotly|from\s+plotly\s+import/.test(content) || /\bpx\.(scatter|bar|line)\s*\(/.test(content))
        evidence.push("plotly chart");

    return uniqueEvidence(evidence);
}


// =========================================================
// GOOGLE CLOUD ANALYSIS
// =========================================================
function analyzeGoogleCloud(content) {
    const evidence = [];

    if (/from\s+google\.cloud\s+import/.test(content) || /google-cloud/.test(content) ||
        /require\s*\(\s*['"]@google-cloud/.test(content))
        evidence.push("Google Cloud SDK import");

    if (/\bBigQuery\b|\bbigquery\b/.test(content))    evidence.push("BigQuery");
    if (/\bFirestore\b|\bfirestore\b/.test(content))  evidence.push("Firestore");
    if (/\bGCS\b|\bstorage\.Bucket\b/.test(content))  evidence.push("Cloud Storage");
    if (/\bPubSub\b|\bpub_sub\b/i.test(content))      evidence.push("Pub/Sub");
    if (/\bVertexAI\b|\bvertex_ai\b/i.test(content))  evidence.push("Vertex AI");
    if (/\bCloud Run\b|cloudrun/i.test(content))       evidence.push("Cloud Run");

    // Credentials / service account
    if (/service_account|GOOGLE_APPLICATION_CREDENTIALS|google\.auth/.test(content))
        evidence.push("GCP authentication");

    return uniqueEvidence(evidence);
}


// =========================================================
// DBMS / DATABASE ANALYSIS
// Looks for SQL queries, ORM models, DB connections.
// =========================================================
function analyzeDbms(content) {
    const evidence = [];

    // Raw SQL keywords in strings or queries
    if (/\bSELECT\s+.+\s+FROM\b/i.test(content))   evidence.push("SELECT query");
    if (/\bINSERT\s+INTO\b/i.test(content))          evidence.push("INSERT query");
    if (/\bUPDATE\s+\w+\s+SET\b/i.test(content))     evidence.push("UPDATE query");
    if (/\bDELETE\s+FROM\b/i.test(content))          evidence.push("DELETE query");
    if (/\bCREATE\s+TABLE\b/i.test(content))         evidence.push("DDL / CREATE TABLE");
    if (/\bJOIN\s+\w+\s+ON\b/i.test(content))        evidence.push("JOIN");

    // ORM (Sequelize, SQLAlchemy, Hibernate, Prisma, TypeORM)
    if (/\bSequelize\b|DataTypes\.\w+/.test(content))           evidence.push("Sequelize ORM");
    if (/\bBase\s*=\s*declarative_base|Column\s*\(|session\s*=/.test(content))
                                                                 evidence.push("SQLAlchemy ORM");
    if (/@Entity|@Column|@Table|@Id\b/.test(content))           evidence.push("JPA/Hibernate entity");
    if (/prisma\.(find|create|update|delete)\w*\s*\(/.test(content))
                                                                 evidence.push("Prisma ORM");
    if (/\bgetRepository|EntityManager/.test(content))           evidence.push("TypeORM");
    if (/mongoose\.(model|Schema|connect)/.test(content) ||
        /new\s+Schema\s*\({/.test(content))                      evidence.push("Mongoose (MongoDB ORM)");

    // DB connections
    if (/mysql\.createConnection|mysql2/.test(content) ||
        /psycopg2\.connect|pg\.Pool|new Pool\s*\(/.test(content) ||
        /sqlite3\.connect|mongoose\.connect|MongoClient/.test(content))
        evidence.push("database connection");

    return uniqueEvidence(evidence);
}


// =========================================================
// OPERATING SYSTEMS ANALYSIS
// Looks for OS-level API usage: processes, threads, I/O.
// =========================================================
function analyzeOperatingSystems(content) {
    const evidence = [];

    // Python os / subprocess / threading / multiprocessing
    if (/import\s+os\b|from\s+os\s+import/.test(content))             evidence.push("Python os module");
    if (/import\s+subprocess|subprocess\.(run|call|Popen)/.test(content)) evidence.push("subprocess/process management");
    if (/import\s+threading|threading\.Thread\s*\(/.test(content))   evidence.push("threading");
    if (/import\s+multiprocessing|Process\s*\(target=/.test(content)) evidence.push("multiprocessing");
    if (/import\s+signal|signal\.signal\s*\(/.test(content))          evidence.push("signal handling");

    // File I/O (low-level)
    if (/os\.open\s*\(|os\.read\s*\(|os\.write\s*\(/.test(content))  evidence.push("low-level file I/O");
    if (/os\.(getpid|fork|kill|wait|exec)\s*\(/.test(content))        evidence.push("process control");
    if (/mmap\.|ctypes\.|struct\.pack/.test(content))                  evidence.push("memory management");

    // Java threads
    if (/\bThread\s+\w+\s*=\s*new\s+Thread/.test(content) ||
        /implements\s+Runnable/.test(content) ||
        /synchronized\b/.test(content) ||
        /\bExecutorService\b/.test(content))
        evidence.push("Java threading");

    // C/C++ OS APIs
    if (/\bfork\s*\(\s*\)|waitpid\s*\(|exec\w*\s*\(/.test(content))  evidence.push("POSIX process API");
    if (/pthread_create|pthread_join/.test(content))                   evidence.push("POSIX threads");
    if (/\bsemaphore\b|\bSemaphore\b|sem_wait|sem_post/.test(content)) evidence.push("semaphore / sync");
    if (/\bmutex\b|\bMutex\b|lock_guard|unique_lock/.test(content))   evidence.push("mutex / lock");

    return uniqueEvidence(evidence);
}


// =========================================================
// COMPUTER NETWORKS ANALYSIS
// Looks for socket programming and network protocol usage.
// =========================================================
function analyzeComputerNetworks(content) {
    const evidence = [];

    // Python socket / networking
    if (/import\s+socket\b|from\s+socket\s+import/.test(content))     evidence.push("Python socket module");
    if (/socket\.AF_INET|socket\.SOCK_STREAM|SOCK_DGRAM/.test(content)) evidence.push("TCP/UDP socket");
    if (/\.bind\s*\(|\.listen\s*\(|\.accept\s*\(/.test(content))      evidence.push("server socket (bind/listen/accept)");
    if (/\.connect\s*\(\s*\(/.test(content) || /\.sendall\s*\(/.test(content)) evidence.push("client socket (connect/send)");

    // HTTP libraries / servers
    if (/http\.server|HTTPServer|BaseHTTPRequestHandler/.test(content)) evidence.push("Python HTTP server");
    if (/urllib\.request|urllib\.parse/.test(content))                  evidence.push("urllib HTTP client");
    if (/httpx\.|aiohttp\.|websocket/.test(content))                   evidence.push("async HTTP / WebSocket");

    // Java networking
    if (/\bServerSocket\s*\(|new\s+Socket\s*\(/.test(content))        evidence.push("Java socket");
    if (/\bInetAddress\b|DatagramSocket/.test(content))                evidence.push("Java network API");
    if (/\bHttpURLConnection|HttpClient\.newHttpClient/.test(content))  evidence.push("Java HTTP client");

    // C networking
    if (/\bsockaddr_in\b|htons\s*\(|inet_addr\s*\(/.test(content))   evidence.push("C POSIX socket");
    if (/\bsend\s*\(|recv\s*\(/.test(content))                        evidence.push("C send/recv");

    // Protocol constants / headers
    if (/TCP_NODELAY|SO_REUSEADDR|SO_KEEPALIVE/.test(content))        evidence.push("socket options");
    if (/\bDNS\b|\bnslookup\b|getaddrinfo/.test(content))             evidence.push("DNS resolution");

    return uniqueEvidence(evidence);
}


// =========================================================
// GIT / GITHUB ANALYSIS
// Git is auto-verifiable: if the candidate has any commits
// on GitHub they have definitively used Git and GitHub.
// This function checks for additional code-level evidence.
// =========================================================
function analyzeGitGithub(content, skill) {
    const evidence = [];

    if (skill === "Git") {
        // Git CLI in scripts / Makefiles
        if (/\bgit\s+(clone|init|commit|push|pull|merge|rebase|checkout|branch)\b/.test(content))
            evidence.push("git CLI command");
        // Simple Git library (JS)
        if (/simple-git|nodegit|isomorphic-git/.test(content))
            evidence.push("Git library");
        // Git config / hooks
        if (/\.gitignore|\.gitattributes|\.git\/hooks/.test(content))
            evidence.push("Git config file");
    }

    if (skill === "GitHub") {
        // GitHub Actions workflow syntax
        if (/on:\s*\[?(push|pull_request|workflow_dispatch)/.test(content) ||
            /uses:\s+actions\//.test(content))
            evidence.push("GitHub Actions workflow");
        // GitHub REST / GraphQL API calls
        if (/api\.github\.com|octokit|@octokit\/rest/.test(content) ||
            /github\.rest\.\w+/.test(content))
            evidence.push("GitHub API call");
        // GitHub Pages / Dependabot config
        if (/dependabot\.yml|CODEOWNERS|PULL_REQUEST_TEMPLATE/.test(content))
            evidence.push("GitHub repo config");
    }

    return uniqueEvidence(evidence);
}


// =========================================================
// FRAMEWORK / LIBRARY ANALYZERS
// These prevent false VERIFIED from extension-only matching.
// e.g. any .java file should NOT prove Spring Boot.
// =========================================================

function analyzeReact(content) {
    const evidence = [];
    if (/import\s+React\b|from\s+['"]react['"]/.test(content))       evidence.push("React import");
    if (/\buseState\s*\(|\buseEffect\s*\(|\buseRef\s*\(/.test(content)) evidence.push("React hooks");
    if (/\bReactDOM\.render\s*\(|createRoot\s*\(/.test(content))    evidence.push("ReactDOM render");
    if (/<[A-Z][\w.]*[\s/>]/.test(content))                          evidence.push("JSX component");
    if (/export\s+default\s+function\s+[A-Z]/.test(content) &&
        /<\/?(\w+)/.test(content))                                    evidence.push("React component export");
    if (/\bcontext\b.*createContext|useContext/.test(content))        evidence.push("React Context");
    if (/\buseReducer\s*\(|\buseCallback\s*\(|\buseMemo\s*\(/.test(content)) evidence.push("advanced hooks");
    return uniqueEvidence(evidence);
}

function analyzeVue(content) {
    const evidence = [];
    if (/<template[\s>]/.test(content))                              evidence.push("Vue template");
    if (/import\s+\{.*createApp|from\s+['"]vue['"]/.test(content))   evidence.push("Vue import");
    if (/export\s+default\s*\{\s*(?:name|data|methods|components)/.test(content))
                                                                      evidence.push("Vue Options API");
    if (/\bdefineComponent\s*\(|\bsetup\s*\(/.test(content))         evidence.push("Vue Composition API");
    if (/<script\s+setup/.test(content))                             evidence.push("Vue script setup");
    if (/\bv-model|v-for|v-if|v-bind|v-on/.test(content))            evidence.push("Vue directives");
    return uniqueEvidence(evidence);
}

function analyzeAngular(content) {
    const evidence = [];
    if (/@Component\s*\(|@NgModule\s*\(|@Injectable\s*\(/.test(content)) evidence.push("Angular decorator");
    if (/@Input\s*\(|@Output\s*\(/.test(content))                    evidence.push("Angular I/O binding");
    if (/from\s+['"]@angular\//.test(content))                       evidence.push("Angular package import");
    if (/\bRouterModule\b|\bActivatedRoute\b/.test(content))         evidence.push("Angular Router");
    if (/\bHttpClient\b|\bHttpClientModule\b/.test(content))         evidence.push("Angular HttpClient");
    if (/\bFormBuilder\b|\bFormGroup\b|\bFormControl\b/.test(content)) evidence.push("Angular Forms");
    return uniqueEvidence(evidence);
}

function analyzeNextJs(content) {
    const evidence = [];
    if (/from\s+['"]next\//.test(content) || /require\s*\(['"]next\//.test(content))
                                                                      evidence.push("Next.js import");
    if (/\bgetServerSideProps\b|\bgetStaticProps\b|\bgetStaticPaths\b/.test(content))
                                                                      evidence.push("Next.js data fetching");
    if (/from\s+['"]next\/router['"]|from\s+['"]next\/navigation['"]/.test(content))
                                                                      evidence.push("Next.js router");
    if (/from\s+['"]next\/link['"]|from\s+['"]next\/image['"]/.test(content))
                                                                      evidence.push("Next.js built-ins");
    if (/\.\s*config\b.*nextConfig|next\.config/.test(content))      evidence.push("next.config file");
    if (/\buse\s+client['"]|\buse\s+server['"]/.test(content))       evidence.push("Next.js App Router directive");
    return uniqueEvidence(evidence);
}

function analyzeNodeJs(content) {
    const evidence = [];
    if (/\brequire\s*\(['"][\w@]/.test(content))                     evidence.push("CommonJS require()");
    if (/\bmodule\.exports\s*=/.test(content))                       evidence.push("module.exports");
    if (/\bprocess\.env\./.test(content) || /\bprocess\.argv\b/.test(content))
                                                                      evidence.push("Node.js process object");
    if (/\b__dirname\b|\b__filename\b/.test(content))                evidence.push("Node.js path globals");
    if (/require\s*\(['"]fs['"]\)|require\s*\(['"]path['"]\)|require\s*\(['"]http['"]\)/.test(content))
                                                                      evidence.push("Node.js built-in module");
    if (/from\s+['"]node:/.test(content))                            evidence.push("Node.js ESM import");
    return uniqueEvidence(evidence);
}

function analyzeExpress(content) {
    const evidence = [];
    if (/require\s*\(['"]express['"]\)|from\s+['"]express['"]/.test(content))
                                                                      evidence.push("Express import");
    if (/\bapp\.get\s*\(|\bapp\.post\s*\(|\bapp\.put\s*\(|\bapp\.delete\s*\(|\bapp\.patch\s*\(/.test(content))
                                                                      evidence.push("Express route");
    if (/\bexpress\.Router\s*\(|\brouter\.(get|post|put|delete|patch)\s*\(/.test(content))
                                                                      evidence.push("Express Router");
    if (/\bapp\.use\s*\(/.test(content))                             evidence.push("Express middleware");
    if (/\bexpress\s*\(\s*\)/.test(content))                         evidence.push("Express app init");
    if (/\bres\.(json|send|status|redirect)\s*\(/.test(content))     evidence.push("Express response");
    return uniqueEvidence(evidence);
}

function analyzeSpringBoot(content) {
    const evidence = [];
    if (/@SpringBootApplication\b/.test(content))                    evidence.push("@SpringBootApplication");
    if (/@RestController\b|@Controller\b/.test(content))            evidence.push("Spring controller");
    if (/@GetMapping|@PostMapping|@PutMapping|@DeleteMapping|@RequestMapping/.test(content))
                                                                      evidence.push("Spring request mapping");
    if (/@Autowired\b|@Service\b|@Repository\b|@Component\b/.test(content))
                                                                      evidence.push("Spring dependency injection");
    if (/import\s+org\.springframework\./.test(content))            evidence.push("Spring package import");
    if (/@Entity\b|@Table\b|@Id\b/.test(content))                   evidence.push("Spring JPA entity");
    if (/@Value\s*\(|@ConfigurationProperties/.test(content))       evidence.push("Spring configuration");
    return uniqueEvidence(evidence);
}

function analyzeDjango(content) {
    const evidence = [];
    if (/from\s+django\b|import\s+django\b/.test(content))          evidence.push("Django import");
    if (/from\s+django\.db\s+import\s+models|models\.Model/.test(content))
                                                                      evidence.push("Django model");
    if (/from\s+django\.urls|urlpatterns\s*=/.test(content))         evidence.push("Django URL config");
    if (/from\s+django\.http|HttpResponse|JsonResponse/.test(content)) evidence.push("Django HTTP response");
    if (/from\s+django\.views|class\s+\w+View\s*\(/.test(content))  evidence.push("Django view");
    if (/from\s+django\.contrib\.auth|login_required/.test(content)) evidence.push("Django auth");
    if (/from\s+rest_framework/.test(content))                       evidence.push("Django REST Framework");
    return uniqueEvidence(evidence);
}

function analyzeFlask(content) {
    const evidence = [];
    if (/from\s+flask\s+import|import\s+flask/.test(content))       evidence.push("Flask import");
    if (/@app\.route\s*\(|@blueprint\.route\s*\(/.test(content))    evidence.push("Flask route decorator");
    if (/Flask\s*\(\s*__name__\s*\)/.test(content))                  evidence.push("Flask app init");
    if (/\bjsonify\s*\(|\brender_template\s*\(/.test(content))       evidence.push("Flask response");
    if (/\brequest\.json|\brequest\.args|\brequest\.form/.test(content))
                                                                      evidence.push("Flask request handling");
    if (/from\s+flask_sqlalchemy|from\s+flask_login/.test(content))  evidence.push("Flask extension");
    return uniqueEvidence(evidence);
}

function analyzeFastApi(content) {
    const evidence = [];
    if (/from\s+fastapi\s+import|import\s+fastapi/.test(content))    evidence.push("FastAPI import");
    if (/FastAPI\s*\(\s*\)|APIRouter\s*\(/.test(content))            evidence.push("FastAPI app init");
    if (/@app\.(get|post|put|delete|patch)\s*\(|@router\.(get|post|put|delete)\s*\(/.test(content))
                                                                      evidence.push("FastAPI route decorator");
    if (/\bBaseModel\b|from\s+pydantic/.test(content))               evidence.push("FastAPI Pydantic model");
    if (/\bDepends\s*\(|\bHTTPException\b/.test(content))            evidence.push("FastAPI dependency injection");
    return uniqueEvidence(evidence);
}

function analyzeMongoDB(content) {
    const evidence = [];
    if (/require\s*\(['"]mongoose['"]\)|from\s+['"]mongoose['"]/.test(content))
                                                                      evidence.push("Mongoose import");
    if (/mongoose\.connect\s*\(|mongoose\.model\s*\(/.test(content)) evidence.push("Mongoose connect/model");
    if (/new\s+Schema\s*\(\s*\{/.test(content))                      evidence.push("Mongoose Schema");
    if (/MongoClient\s*\(|from\s+pymongo|require\s*\(['"]mongodb['"]\)/.test(content))
                                                                      evidence.push("MongoDB driver");
    if (/\.collection\s*\(|db\.find\s*\(|findOne\s*\(|insertOne\s*\(|updateOne\s*\(/.test(content))
                                                                      evidence.push("MongoDB query");
    if (/\$match\b|\$group\b|\$project\b|\$lookup\b/.test(content))  evidence.push("MongoDB aggregation");
    return uniqueEvidence(evidence);
}

function analyzeRedis(content) {
    const evidence = [];
    if (/require\s*\(['"]redis['"]\)|from\s+['"]redis['"]|import\s+redis/.test(content))
                                                                      evidence.push("Redis client import");
    if (/redis\.createClient\s*\(|aioredis\.|Redis\s*\(/.test(content))
                                                                      evidence.push("Redis client init");
    if (/client\.(get|set|del|hget|hset|lpush|rpop|expire)\s*\(|await\s+redis\.(get|set)/.test(content))
                                                                      evidence.push("Redis command");
    if (/\.setEx\s*\(|redis\.expire\s*\(/.test(content))              evidence.push("Redis TTL / cache");
    return uniqueEvidence(evidence);
}

function analyzeFirebase(content) {
    const evidence = [];
    if (/from\s+['"]firebase\/|from\s+['"]firebase-admin|require\s*\(['"]firebase/.test(content))
                                                                      evidence.push("Firebase import");
    if (/initializeApp\s*\(|getFirestore\s*\(|getAuth\s*\(/.test(content))
                                                                      evidence.push("Firebase init");
    if (/\.collection\s*\(|getDocs\s*\(|addDoc\s*\(|setDoc\s*\(|updateDoc\s*\(/.test(content))
                                                                      evidence.push("Firestore query");
    if (/onAuthStateChanged|signInWith|createUserWith/.test(content)) evidence.push("Firebase Auth");
    return uniqueEvidence(evidence);
}

function analyzeMachineLearning(content) {
    const evidence = [];
    if (/from\s+sklearn\.|import\s+sklearn/.test(content))           evidence.push("scikit-learn import");
    if (/\.fit\s*\(|\bmodel\.predict\s*\(|\bX_train\b|\by_train\b/.test(content))
                                                                      evidence.push("ML train/predict");
    if (/train_test_split|cross_val_score|GridSearchCV/.test(content)) evidence.push("ML evaluation");
    if (/from\s+sklearn\.linear_model|from\s+sklearn\.tree|from\s+sklearn\.ensemble/.test(content))
                                                                      evidence.push("ML model import");
    if (/from\s+sklearn\.preprocessing|StandardScaler|LabelEncoder/.test(content))
                                                                      evidence.push("feature preprocessing");
    if (/confusion_matrix|classification_report|accuracy_score/.test(content))
                                                                      evidence.push("ML metrics");
    return uniqueEvidence(evidence);
}

function analyzeDeepLearning(content) {
    const evidence = [];
    if (/import\s+tensorflow|from\s+tensorflow|import\s+torch|from\s+torch/.test(content))
                                                                      evidence.push("DL framework import");
    if (/\bSequential\s*\(|\bModel\s*\(|\bmodule\b.*nn\./.test(content)) evidence.push("neural network model");
    if (/\bDense\s*\(|\bConv2D\s*\(|\bLSTM\s*\(|\bGRU\s*\(|nn\.Linear|nn\.Conv2d/.test(content))
                                                                      evidence.push("neural layer");
    if (/\.compile\s*\(|optimizer=|loss=|metrics=/.test(content))     evidence.push("model compile");
    if (/\.backward\s*\(|optimizer\.step\s*\(|optimizer\.zero_grad/.test(content))
                                                                      evidence.push("PyTorch training loop");
    if (/DataLoader\s*\(|TensorDataset|torch\.utils\.data/.test(content))
                                                                      evidence.push("DataLoader");
    if (/epochs?\s*=|batch_size\s*=|learning_rate\s*=/.test(content)) evidence.push("training hyperparameters");
    return uniqueEvidence(evidence);
}

function analyzeTensorFlow(content) {
    const evidence = [];
    if (/import\\s+tensorflow|from\\s+tensorflow|import\\s+tf\\./.test(content) ||
        /import\\s+tensorflow\\s+as\\s+tf/.test(content))               evidence.push("TensorFlow import");
    if (/tf\\.keras|keras\\.layers|keras\\.models/.test(content))       evidence.push("Keras/TF high-level API");
    if (/tf\\.(constant|Variable|Tensor|GradientTape|function)/.test(content)) evidence.push("TensorFlow tensor ops");
    if (/tf\\.data\\.Dataset|from_tensor_slices|tf\\.io\\./.test(content)) evidence.push("tf.data pipeline");
    // Only match model API if tf is clearly in scope
    if (/tf\\.keras\\.Model|tf\\.keras\\.Sequential/.test(content))    evidence.push("Keras model API");
    return uniqueEvidence(evidence);
}


function analyzePyTorch(content) {
    const evidence = [];
    if (/import\s+torch\b|from\s+torch/.test(content))               evidence.push("PyTorch import");
    if (/import\s+torchvision|from\s+torchvision/.test(content))     evidence.push("torchvision");
    if (/nn\.Module|nn\.Linear|nn\.Conv2d|nn\.LSTM/.test(content))   evidence.push("nn.Module");
    if (/torch\.tensor|torch\.zeros|torch\.ones|torch\.randn/.test(content))
                                                                      evidence.push("tensor creation");
    if (/\.backward\s*\(|optimizer\.step\s*\(/.test(content))         evidence.push("autograd/backprop");
    if (/torch\.load\s*\(|torch\.save\s*\(/.test(content))           evidence.push("model save/load");
    return uniqueEvidence(evidence);
}

function analyzeKeras(content) {
    const evidence = [];
    if (/from\s+tensorflow\.keras|import\s+keras/.test(content) ||
        /from\s+keras\b/.test(content))                              evidence.push("Keras import");
    if (/layers\.(Dense|Conv2D|LSTM|GRU|Dropout|Flatten|BatchNorm)/.test(content))
                                                                      evidence.push("Keras layers");
    if (/models\.(Sequential|Model)\s*\(|Sequential\s*\(/.test(content))
                                                                      evidence.push("Keras Sequential model");
    if (/\.compile\s*\(.*optimizer|loss=.*categorical_crossentropy/.test(content))
                                                                      evidence.push("Keras compile");
    if (/EarlyStopping|ModelCheckpoint|ReduceLROnPlateau/.test(content))
                                                                      evidence.push("Keras callbacks");
    return uniqueEvidence(evidence);
}

function analyzeScikitLearn(content) {
    const evidence = [];
    if (/from\s+sklearn\.|from\s+sklearn\s+import|import\s+sklearn/.test(content))
                                                                      evidence.push("scikit-learn import");
    if (/LinearRegression|LogisticRegression|DecisionTreeClassifier|RandomForestClassifier|SVC\b/.test(content))
                                                                      evidence.push("sklearn model");
    if (/train_test_split|KFold|cross_val_score/.test(content))      evidence.push("data splitting");
    if (/StandardScaler|MinMaxScaler|LabelEncoder|OneHotEncoder/.test(content))
                                                                      evidence.push("data preprocessing");
    if (/accuracy_score|classification_report|confusion_matrix|mean_squared_error/.test(content))
                                                                      evidence.push("metrics");
    return uniqueEvidence(evidence);
}

function analyzePandas(content) {
    const evidence = [];
    if (/import\s+pandas|from\s+pandas|import\s+pandas\s+as\s+pd/.test(content))
                                                                      evidence.push("Pandas import");
    if (/pd\.read_csv|pd\.read_excel|pd\.read_json|pd\.DataFrame/.test(content))
                                                                      evidence.push("Pandas DataFrame");
    if (/\.groupby\s*\(|\.merge\s*\(|\.concat\s*\(|pd\.concat/.test(content))
                                                                      evidence.push("Pandas groupby/merge");
    if (/\.dropna\s*\(|\.fillna\s*\(|\.isnull\s*\(/.test(content))   evidence.push("Pandas data cleaning");
    if (/\.apply\s*\(|\.map\s*\(|\.transform\s*\(/.test(content))    evidence.push("Pandas apply/transform");
    return uniqueEvidence(evidence);
}

function analyzeNumPy(content) {
    const evidence = [];
    if (/import\s+numpy|from\s+numpy|import\s+numpy\s+as\s+np/.test(content))
                                                                      evidence.push("NumPy import");
    if (/np\.array\s*\(|np\.zeros\s*\(|np\.ones\s*\(|np\.random\b/.test(content))
                                                                      evidence.push("NumPy array ops");
    if (/np\.(dot|matmul|linalg|reshape|transpose|concatenate|stack)/.test(content))
                                                                      evidence.push("NumPy math ops");
    if (/np\.mean\s*\(|np\.std\s*\(|np\.sum\s*\(|np\.max\s*\(/.test(content))
                                                                      evidence.push("NumPy statistics");
    return uniqueEvidence(evidence);
}

function analyzeDocker(content) {
    const evidence = [];
    // Dockerfile patterns
    if (/^FROM\s+\w+/m.test(content))                                evidence.push("FROM instruction");
    if (/^RUN\s+/m.test(content))                                    evidence.push("RUN instruction");
    if (/^COPY\s+|^ADD\s+/m.test(content))                          evidence.push("COPY/ADD");
    if (/^CMD\s+|^ENTRYPOINT\s+/m.test(content))                    evidence.push("CMD/ENTRYPOINT");
    if (/^EXPOSE\s+\d+/m.test(content))                             evidence.push("EXPOSE port");
    // docker-compose
    if (/^services:/m.test(content) && /image:\s+\w+/.test(content)) evidence.push("docker-compose services");
    if (/docker-compose|DockerHub|docker build|docker run/.test(content))
                                                                      evidence.push("Docker CLI usage");
    return uniqueEvidence(evidence);
}

function analyzeTailwind(content) {
    const evidence = [];
    if (/class(?:Name)?=["|'].*(?:flex|grid|bg-|text-|p-|m-|w-|h-|border|rounded|shadow)/.test(content))
                                                                      evidence.push("Tailwind utility classes");
    if (/@tailwind\s+(base|components|utilities)/.test(content))    evidence.push("Tailwind directives");
    if (/tailwind\.config/.test(content) || /require\(['"]tailwindcss['"]\)/.test(content))
                                                                      evidence.push("Tailwind config");
    return uniqueEvidence(evidence);
}

function analyzeAWS(content) {
    const evidence = [];
    if (/require\s*\(['"]aws-sdk['"]\)|from\s+['"]aws-sdk|from\s+['"]@aws-sdk/.test(content) ||
        /import\s+boto3|from\s+boto3/.test(content))                 evidence.push("AWS SDK import");
    if (/new\s+AWS\.(S3|EC2|DynamoDB|Lambda|SQS|SNS)/.test(content) ||
        /boto3\.client\s*\(['"]s3|boto3\.resource/.test(content))    evidence.push("AWS service client");
    if (/AWS_ACCESS_KEY|AWS_SECRET_ACCESS_KEY|AWS_REGION/.test(content))
                                                                      evidence.push("AWS credentials");
    if (/AWSTemplateFormatVersion|aws_region|aws_s3_bucket|resource\s+\"aws_/.test(content))
                                                                      evidence.push("AWS IaC config");
    return uniqueEvidence(evidence);
}

function analyzeNestJS(content) {
    const evidence = [];
    if (/@Module\s*\(|@Controller\s*\(|@Injectable\s*\(/.test(content))
                                                                      evidence.push("NestJS decorator");
    if (/@Get\s*\(|@Post\s*\(|@Put\s*\(|@Delete\s*\(/.test(content)) evidence.push("NestJS route decorator");
    if (/from\s+['"]@nestjs\//.test(content))                        evidence.push("NestJS package import");
    if (/NestFactory\.create\s*\(/.test(content))                    evidence.push("NestJS app bootstrap");
    return uniqueEvidence(evidence);
}

function analyzeGraphQL(content) {
    const evidence = [];
    if (/gql`|gql\s*`/.test(content) || /from\s+['"]graphql/.test(content)) evidence.push("GraphQL import/gql tag");
    if (/type\s+Query\s*\{|type\s+Mutation\s*\{|type\s+Subscription\s*\{/.test(content))
                                                                      evidence.push("GraphQL schema type");
    if (/const\s+typeDefs\s*=|const\s+resolvers\s*=/.test(content)) evidence.push("GraphQL typeDefs/resolvers");
    if (/ApolloServer|ApolloClient|useQuery\s*\(|useMutation\s*\(/.test(content))
                                                                      evidence.push("Apollo GraphQL");
    return uniqueEvidence(evidence);
}


// =========================================================
// DISPATCHER
// Maps canonical skill name â†’ correct analysis function.
// =========================================================
function analyzeCodeForSkill(skill, content) {
    switch (skill.toLowerCase()) {
        // CS Fundamentals
        case "oop": case "oops": case "java":       return analyzeJavaCode(content);
        case "dsa": case "data structures":         return analyzeDSA(content);
        case "algorithms":                          return analyzeAlgorithms(content);
        // Backend
        case "rest api":                            return analyzeRestApi(content);
        case "express.js": case "express":          return analyzeExpress(content);
        case "node.js": case "node":                return analyzeNodeJs(content);
        case "spring boot":                         return analyzeSpringBoot(content);
        case "django":                              return analyzeDjango(content);
        case "flask":                               return analyzeFlask(content);
        case "fastapi":                             return analyzeFastApi(content);
        case "nestjs":                              return analyzeNestJS(content);
        case "graphql":                             return analyzeGraphQL(content);
        // Frontend
        case "react":                               return analyzeReact(content);
        case "vue.js": case "vue":                  return analyzeVue(content);
        case "angular":                             return analyzeAngular(content);
        case "next.js": case "nextjs":              return analyzeNextJs(content);
        case "tailwind css": case "tailwind":       return analyzeTailwind(content);
        // Databases
        case "mongodb":                             return analyzeMongoDB(content);
        case "redis":                               return analyzeRedis(content);
        case "firebase":                            return analyzeFirebase(content);
        case "dbms":                                return analyzeDbms(content);
        // DevOps / Cloud
        case "docker":                              return analyzeDocker(content);
        case "aws":                                 return analyzeAWS(content);
        case "google cloud":                        return analyzeGoogleCloud(content);
        // AI/ML
        case "machine learning":                    return analyzeMachineLearning(content);
        case "deep learning":                       return analyzeDeepLearning(content);
        case "tensorflow":                          return analyzeTensorFlow(content);
        case "pytorch":                             return analyzePyTorch(content);
        case "keras":                               return analyzeKeras(content);
        case "scikit-learn":                        return analyzeScikitLearn(content);
        case "pandas":                              return analyzePandas(content);
        case "numpy":                               return analyzeNumPy(content);
        case "matplotlib":                          return analyzeMatplotlib(content);
        case "generative ai":                       return analyzeGenerativeAi(content);
        // OS / Networks
        case "operating systems":                   return analyzeOperatingSystems(content);
        case "computer networks":                   return analyzeComputerNetworks(content);
        // Tools
        case "git": case "github":                  return analyzeGitGithub(content, skill);
        default:                                    return [];
    }
}

// Skills that require code-pattern analysis (not just file extension presence).
// Expanding this set means a skill ONLY shows VERIFIED if real patterns are found.
const CODE_ANALYSIS_SKILLS = new Set([
    // CS Fundamentals
    "OOP", "OOPs", "DSA", "Data Structures", "Algorithms",
    // Networking/OS/GenAI/Tools
    "REST API", "Generative AI", "Matplotlib",
    "Google Cloud", "DBMS", "Operating Systems", "Computer Networks",
    "Git", "GitHub",
    // Frontend frameworks (file ext alone is not enough)
    "React", "Vue.js", "Angular", "Next.js", "Tailwind CSS",
    // Backend frameworks
    "Node.js", "Express.js", "Spring Boot", "Django", "Flask", "FastAPI", "NestJS", "GraphQL",
    // Databases
    "MongoDB", "Redis", "Firebase",
    // DevOps / Cloud
    "Docker", "AWS",
    // AI / ML
    "Machine Learning", "Deep Learning",
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy",
]);



// Skills that are auto-verified by GitHub activity itself:
// If the candidate has â‰¥1 commit on GitHub, they've used Git/GitHub.
const AUTO_VERIFIED_SKILLS = new Set(["Git", "GitHub"]);

// Skills verified by looking for config files in the repo tree (not code)
const TREE_VERIFIED_SKILLS = {
    "VS Code": [".vscode/", ".vscode/settings.json", ".vscode/launch.json", ".vscode/extensions.json"],
};

module.exports = {
    analyzeJavaCode,
    analyzeDSA,
    analyzeAlgorithms,
    analyzeRestApi,
    analyzeGenerativeAi,
    analyzeMatplotlib,
    analyzeGoogleCloud,
    analyzeDbms,
    analyzeOperatingSystems,
    analyzeComputerNetworks,
    analyzeGitGithub,
    analyzeCodeForSkill,
    CODE_ANALYSIS_SKILLS,
    AUTO_VERIFIED_SKILLS,
    TREE_VERIFIED_SKILLS,
};
