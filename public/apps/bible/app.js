import { QUESTIONS } from "./questions.js";

const STORAGE_KEY = "bible-testing-progress-v1";
const DEFAULT_INTERVALS = [
  0,
  6 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
];

const MODE_LABELS = {
  adaptive: "Adaptive Exam",
  crossref: "Cross-Reference Focus",
  motif: "Motif Drill",
  explain: "Explain-Why Mode",
  book: "Book Exam",
  alphabet: "Greek + Hebrew Alphabet Drill",
};

const MODE_DESCRIPTIONS = {
  adaptive:
    "Adaptive Exam blends question types and adjusts toward your weak spots.",
  crossref:
    "Cross-Reference Focus prioritizes OT/NT links and explicit textual echoes.",
  motif:
    "Motif Drill emphasizes theme-tracing: where else in Scripture do we see this pattern?",
  explain:
    "Explain-Why Mode requires both the right answer and a short theological/scriptural reason.",
  book:
    "Book Exam builds a single-book test with rising difficulty as the session progresses.",
  alphabet:
    "Alphabet Drill trains Greek and Hebrew letters with pronunciation/transliteration recall (NT scope = Greek, OT scope = Hebrew).",
};

const DIFFICULTY_NOTES = {
  1: "Easy now prioritizes direct recall multiple-choice with fewer complex motif links.",
  2: "Level 2 stays mostly straightforward with some light cross-reference challenge.",
  3: "Level 3 mixes direct recall and interpretive cross-reference questions.",
  4: "Level 4 leans heavily into cross-reference and motif synthesis.",
  5: "Level 5 emphasizes advanced motif tracing and multi-answer canonical links.",
};

const TESTAMENT_LABELS = {
  OT: "Old Testament",
  NT: "New Testament",
  Both: "Whole Bible",
};

const SCRIPTURE_TRANSLATION_LABELS = {
  web: "English WEB",
  kjv: "English KJV",
  sse: "Spanish Reina Valera 1865",
  giovanni: "Italian Giovanni Diodati",
  ls1910: "French Louis Segond 1910",
};

const SCRIPTURE_TTS_LANG = {
  web: "en-US",
  kjv: "en-US",
  sse: "es-ES",
  giovanni: "it-IT",
  ls1910: "fr-FR",
};

const AMBIENT_TRACKS = {
  chant: {
    label: "Gregorian Chant",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/dd/KevinMacLeod_-_Gregorian_Chant.ogg",
  },
  bach: {
    label: "Bach Prelude",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/16/Bach_C_Major_Prelude_Equal.ogg",
  },
};

const COUNTERPOINT_SYNTH = {
  label: "Counterpoint Synth (WTC-inspired)",
  bpm: 84,
  stepBeats: 0.5,
  leadMidi: [
    76, 74, 72, 71, 72, 74, 76, 79, 77, 76, 74, 72, 71, 69, 71, 72,
    74, 72, 71, 69, 67, 69, 71, 72, 74, 76, 77, 76, 74, 72, 71, 72,
  ],
  bassMidi: [
    48, 50, 52, 53, 55, 53, 52, 50, 48, 47, 45, 43, 45, 47, 48, 50,
    52, 53, 55, 57, 55, 53, 52, 50, 48, 47, 45, 43, 45, 47, 48, 50,
  ],
};

const THEME_CHAINS = [
  {
    id: "covenant-blood",
    themes: ["Cross-Reference", "Motif", "Torah", "Gospels"],
    testament: "Both",
    prompt: "Which verse most strongly completes the covenant-blood theme?",
    options: ["Exodus 24:8", "Jeremiah 31:31", "Luke 22:20"],
    answer: "Luke 22:20",
    explanation: "Jesus directly applies covenant-blood language to the new covenant cup.",
  },
  {
    id: "passover-christ",
    themes: ["Cross-Reference", "Torah", "Epistles"],
    testament: "Both",
    prompt: "Which verse best identifies Christ through the Passover motif?",
    options: ["Exodus 12:13", "John 1:29", "1 Corinthians 5:7"],
    answer: "1 Corinthians 5:7",
    explanation: "Paul explicitly says, 'Christ, our Passover lamb, has been sacrificed.'",
  },
  {
    id: "wilderness-testing",
    themes: ["Motif", "Torah", "Gospels", "Epistles"],
    testament: "Both",
    prompt: "Which text most directly extends Israel's wilderness testing pattern into church warning?",
    options: ["Deuteronomy 8:2", "Matthew 4:1", "1 Corinthians 10:6"],
    answer: "1 Corinthians 10:6",
    explanation: "Paul applies wilderness failures to Christian instruction and warning.",
  },
  {
    id: "suffering-servant",
    themes: ["Motif", "Prophets", "Acts", "Epistles"],
    testament: "Both",
    prompt: "Which verse most explicitly interprets Isaiah 53 as fulfilled in Jesus?",
    options: ["Isaiah 53:5", "Acts 8:35", "Romans 12:1"],
    answer: "Acts 8:35",
    explanation: "Philip begins with Isaiah's text and preaches Jesus to the Ethiopian.",
  },
  {
    id: "temple-people",
    themes: ["Motif", "Torah", "Epistles"],
    testament: "Both",
    prompt: "Which verse most clearly recasts God's people as His temple?",
    options: ["1 Kings 8:10", "1 Corinthians 3:16", "Nehemiah 2:17"],
    answer: "1 Corinthians 3:16",
    explanation: "Paul applies temple indwelling language directly to the church.",
  },
  {
    id: "shepherd-theme",
    themes: ["Cross-Reference", "Prophets", "Gospels"],
    testament: "Both",
    prompt: "Which verse most clearly presents Jesus as the promised shepherd?",
    options: ["Ezekiel 34:23", "John 10:11", "Psalm 23:1"],
    answer: "John 10:11",
    explanation: "Jesus claims the good shepherd role in personal, messianic terms.",
  },
  {
    id: "faith-line",
    themes: ["Cross-Reference", "Motif", "Prophets", "Epistles"],
    testament: "Both",
    prompt: "Which verse continues Habakkuk's 'live by faith' line with direct quotation?",
    options: ["Habakkuk 2:4", "Galatians 3:11", "Acts 4:12"],
    answer: "Galatians 3:11",
    explanation: "Paul explicitly cites the line in Galatians to argue justification by faith.",
  },
  {
    id: "new-creation",
    themes: ["Motif", "Epistles", "Revelation"],
    testament: "Both",
    prompt: "Which verse best extends the new-creation motif at personal salvation level?",
    options: ["Genesis 1:1", "2 Corinthians 5:17", "Revelation 21:1"],
    answer: "2 Corinthians 5:17",
    explanation: "Paul identifies the believer in Christ as new creation in the present.",
  },
  {
    id: "abraham-faith",
    themes: ["Motif", "Torah", "Epistles"],
    testament: "Both",
    prompt: "Which verse most directly links Abraham's faith to New Testament justification?",
    options: ["Genesis 15:6", "Romans 4:3", "James 1:22"],
    answer: "Romans 4:3",
    explanation: "Romans 4 uses Genesis 15:6 to articulate justification by faith.",
  },
  {
    id: "son-of-man",
    themes: ["Cross-Reference", "Prophets", "Gospels"],
    testament: "Both",
    prompt: "Which verse most directly applies Daniel's Son of Man vision to Jesus?",
    options: ["Daniel 7:13", "Mark 14:62", "Luke 2:11"],
    answer: "Mark 14:62",
    explanation: "Jesus invokes Daniel's cloud-coming Son of Man language at trial.",
  },
  {
    id: "spirit-outpouring",
    themes: ["Cross-Reference", "Prophets", "Acts"],
    testament: "Both",
    prompt: "Which verse most directly states Joel's Spirit prophecy is being fulfilled?",
    options: ["Joel 2:28", "Acts 2:16", "John 7:38"],
    answer: "Acts 2:16",
    explanation: "Peter says Pentecost is what Joel spoke about.",
  },
  {
    id: "exile-return",
    themes: ["Motif", "History", "Epistles", "Gospels"],
    testament: "Both",
    prompt: "Which verse most clearly reframes exile-return as restored belonging in Christ?",
    options: ["2 Chronicles 36:23", "Ephesians 2:13", "Acts 27:8"],
    answer: "Ephesians 2:13",
    explanation: "Paul describes the far-off being brought near through Christ.",
  },
];

const EXPLANATION_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "have",
  "were",
  "been",
  "into",
  "your",
  "their",
  "about",
  "because",
  "which",
  "what",
  "when",
  "where",
  "also",
  "after",
  "before",
  "most",
  "very",
  "does",
  "did",
  "through",
  "under",
  "over",
  "them",
  "then",
  "than",
]);

const BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

const BOOK_NUMBER_MAP = Object.fromEntries(BOOKS.map((book, index) => [book, index + 1]));

const BOOK_ALIAS_MAP = (() => {
  const map = new Map();

  const normalize = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const addAlias = (alias, canonical) => {
    map.set(normalize(alias), canonical);
  };

  BOOKS.forEach((book) => {
    addAlias(book, book);
    addAlias(book.replace(/\s+/g, ""), book);
  });

  const manualAliases = {
    gen: "Genesis",
    exod: "Exodus",
    lev: "Leviticus",
    num: "Numbers",
    deut: "Deuteronomy",
    josh: "Joshua",
    judg: "Judges",
    psalm: "Psalms",
    ps: "Psalms",
    prov: "Proverbs",
    eccl: "Ecclesiastes",
    song: "Song of Solomon",
    sos: "Song of Solomon",
    isa: "Isaiah",
    jer: "Jeremiah",
    lam: "Lamentations",
    ezek: "Ezekiel",
    dan: "Daniel",
    hos: "Hosea",
    obad: "Obadiah",
    hab: "Habakkuk",
    zech: "Zechariah",
    mal: "Malachi",
    matt: "Matthew",
    rom: "Romans",
    rev: "Revelation",
    "1 cor": "1 Corinthians",
    "2 cor": "2 Corinthians",
    "1 thess": "1 Thessalonians",
    "2 thess": "2 Thessalonians",
    "1 tim": "1 Timothy",
    "2 tim": "2 Timothy",
    phlm: "Philemon",
    "1 pet": "1 Peter",
    "2 pet": "2 Peter",
  };

  Object.entries(manualAliases).forEach(([alias, canonical]) => addAlias(alias, canonical));
  return map;
})();

const GREEK_ALPHABET = [
  { script: "Α α", name: "alpha", pronunciation: "AHL-fah", transliteration: "a" },
  { script: "Β β", name: "beta", pronunciation: "BAY-tah", transliteration: "b" },
  { script: "Γ γ", name: "gamma", pronunciation: "GAHM-mah", transliteration: "g" },
  { script: "Δ δ", name: "delta", pronunciation: "DEL-tah", transliteration: "d" },
  { script: "Ε ε", name: "epsilon", pronunciation: "EP-si-lon", transliteration: "e" },
  { script: "Ζ ζ", name: "zeta", pronunciation: "DZAY-tah", transliteration: "z" },
  { script: "Η η", name: "eta", pronunciation: "AY-tah", transliteration: "e" },
  { script: "Θ θ", name: "theta", pronunciation: "THAY-tah", transliteration: "th" },
  { script: "Ι ι", name: "iota", pronunciation: "ee-OH-tah", transliteration: "i" },
  { script: "Κ κ", name: "kappa", pronunciation: "KAP-pah", transliteration: "k" },
  { script: "Λ λ", name: "lambda", pronunciation: "LAM-dah", transliteration: "l" },
  { script: "Μ μ", name: "mu", pronunciation: "myoo", transliteration: "m" },
  { script: "Ν ν", name: "nu", pronunciation: "noo", transliteration: "n" },
  { script: "Ξ ξ", name: "xi", pronunciation: "ksee", transliteration: "x" },
  { script: "Ο ο", name: "omicron", pronunciation: "OH-mi-kron", transliteration: "o" },
  { script: "Π π", name: "pi", pronunciation: "pee", transliteration: "p" },
  { script: "Ρ ρ", name: "rho", pronunciation: "roh", transliteration: "r" },
  { script: "Σ σ/ς", name: "sigma", pronunciation: "SIG-mah", transliteration: "s" },
  { script: "Τ τ", name: "tau", pronunciation: "tow", transliteration: "t" },
  { script: "Υ υ", name: "upsilon", pronunciation: "OOP-si-lon", transliteration: "u / y" },
  { script: "Φ φ", name: "phi", pronunciation: "fee", transliteration: "ph / f" },
  { script: "Χ χ", name: "chi", pronunciation: "khee", transliteration: "ch / kh" },
  { script: "Ψ ψ", name: "psi", pronunciation: "psee", transliteration: "ps" },
  { script: "Ω ω", name: "omega", pronunciation: "oh-MAY-gah", transliteration: "o" },
];

const HEBREW_ALPHABET = [
  { script: "א", name: "aleph", pronunciation: "AH-lef", transliteration: "silent / glottal" },
  { script: "ב", name: "bet", pronunciation: "bet", transliteration: "b / v" },
  { script: "ג", name: "gimel", pronunciation: "GHEE-mel", transliteration: "g" },
  { script: "ד", name: "dalet", pronunciation: "DAH-let", transliteration: "d" },
  { script: "ה", name: "he", pronunciation: "hay", transliteration: "h" },
  { script: "ו", name: "vav", pronunciation: "vahv", transliteration: "v / w" },
  { script: "ז", name: "zayin", pronunciation: "ZAH-yin", transliteration: "z" },
  { script: "ח", name: "het", pronunciation: "khet", transliteration: "ch / kh" },
  { script: "ט", name: "tet", pronunciation: "tet", transliteration: "t" },
  { script: "י", name: "yod", pronunciation: "yohd", transliteration: "y / i" },
  { script: "כ / ך", name: "kaf", pronunciation: "kahf", transliteration: "k / kh" },
  { script: "ל", name: "lamed", pronunciation: "lah-MED", transliteration: "l" },
  { script: "מ / ם", name: "mem", pronunciation: "mem", transliteration: "m" },
  { script: "נ / ן", name: "nun", pronunciation: "noon", transliteration: "n" },
  { script: "ס", name: "samekh", pronunciation: "SAH-mekh", transliteration: "s" },
  { script: "ע", name: "ayin", pronunciation: "AH-yin", transliteration: "silent / voiced pharyngeal" },
  { script: "פ / ף", name: "pe", pronunciation: "pay", transliteration: "p / f" },
  { script: "צ / ץ", name: "tsadi", pronunciation: "tsah-DEE", transliteration: "ts" },
  { script: "ק", name: "qof", pronunciation: "kohf", transliteration: "q / k" },
  { script: "ר", name: "resh", pronunciation: "resh", transliteration: "r" },
  { script: "ש", name: "shin", pronunciation: "sheen", transliteration: "sh / s" },
  { script: "ת", name: "tav", pronunciation: "tahv", transliteration: "t" },
];

function buildAlphabetChoices(items, answerIndex, toLabel, count = 4) {
  const wanted = Math.min(count, items.length);
  const picked = [answerIndex];
  let step = 1;
  while (picked.length < wanted) {
    const candidate = (answerIndex + step * 3) % items.length;
    if (!picked.includes(candidate)) picked.push(candidate);
    step += 1;
  }
  return shuffle(picked.map((index) => toLabel(items[index])));
}

function buildAlphabetQuestionsForFamily(items, family) {
  const familyTag = family.toLowerCase();
  const questions = [];

  items.forEach((item, index) => {
    const nameLabel = `${item.name} (${item.pronunciation})`;

    const nameChoices = buildAlphabetChoices(items, index, (entry) => `${entry.name} (${entry.pronunciation})`);
    questions.push({
      id: `alphabet-${familyTag}-name-${index + 1}`,
      testament: "Both",
      category: "Alphabet",
      difficulty: 1,
      type: "mcq",
      tags: ["alphabet", familyTag, "pronunciation"],
      prompt: `${family}: What is the name/pronunciation of the letter ${item.script}?`,
      choices: nameChoices,
      answer: nameLabel,
      reference: `${family} Alphabet`,
      explanation: `${item.script} is ${item.name}. Pronunciation: ${item.pronunciation}. Transliteration: ${item.transliteration}.`,
    });

    const scriptChoices = buildAlphabetChoices(items, index, (entry) => entry.script);
    questions.push({
      id: `alphabet-${familyTag}-script-${index + 1}`,
      testament: "Both",
      category: "Alphabet",
      difficulty: 2,
      type: "mcq",
      tags: ["alphabet", familyTag, "pronunciation"],
      prompt: `${family}: Which letter is ${item.name} (${item.pronunciation})?`,
      choices: scriptChoices,
      answer: item.script,
      reference: `${family} Alphabet`,
      explanation: `${item.name} is written ${item.script}. Transliteration: ${item.transliteration}.`,
    });
  });

  return questions;
}

function buildAlphabetQuestions() {
  return [
    ...buildAlphabetQuestionsForFamily(GREEK_ALPHABET, "Greek"),
    ...buildAlphabetQuestionsForFamily(HEBREW_ALPHABET, "Hebrew"),
  ];
}

const ALPHABET_QUESTIONS = buildAlphabetQuestions();

const byId = (id) => document.getElementById(id);

const dom = {
  alphabetShortcut: byId("alphabet-shortcut"),
  setupScreen: byId("setup-screen"),
  quizScreen: byId("quiz-screen"),
  resultsScreen: byId("results-screen"),
  setupForm: byId("setup-form"),
  modeSelect: byId("mode"),
  bookScopeSelect: byId("book-scope"),
  testamentSelect: byId("testament"),
  lengthSelect: byId("length"),
  secondsSelect: byId("seconds"),
  difficultySelect: byId("difficulty"),
  difficultyNote: byId("difficulty-note"),
  modeDescription: byId("mode-description"),
  sessionLabel: byId("session-label"),
  questionNumber: byId("question-number"),
  timer: byId("timer"),
  progressFill: byId("progress-fill"),
  progressTrack: document.querySelector(".progress-track"),
  progressText: byId("progress-text"),
  liveScore: byId("live-score"),
  questionTags: byId("question-tags"),
  questionPrompt: byId("question-prompt"),
  answerArea: byId("answer-area"),
  statusMessage: byId("status-message"),
  submitBtn: byId("submit-btn"),
  skipBtn: byId("skip-btn"),
  feedbackBox: byId("feedback-box"),
  feedbackResult: byId("feedback-result"),
  feedbackAnswer: byId("feedback-answer"),
  feedbackWhy: byId("feedback-why"),
  feedbackReference: byId("feedback-reference"),
  feedbackExplanation: byId("feedback-explanation"),
  themeChain: byId("theme-chain"),
  themeChainPrompt: byId("theme-chain-prompt"),
  themeChainOptions: byId("theme-chain-options"),
  themeChainResult: byId("theme-chain-result"),
  finalScore: byId("final-score"),
  accuracy: byId("accuracy"),
  streak: byId("streak"),
  highScore: byId("high-score"),
  missedList: byId("missed-list"),
  retakeMissedBtn: byId("retake-missed-btn"),
  newSessionBtn: byId("new-session-btn"),
  scriptureForm: byId("scripture-form"),
  scriptureQuery: byId("scripture-query"),
  scriptureTranslation: byId("scripture-translation"),
  scriptureReadBtn: byId("scripture-read-btn"),
  scriptureStopBtn: byId("scripture-stop-btn"),
  scriptureSpeed: byId("scripture-speed"),
  scriptureSpeedValue: byId("scripture-speed-value"),
  scriptureStatus: byId("scripture-status"),
  scriptureViewer: byId("scripture-viewer"),
  musicTrack: byId("music-track"),
  musicVolume: byId("music-volume"),
  musicToggle: byId("music-toggle"),
  musicStatus: byId("music-status"),
  ambientAudio: byId("ambient-audio"),
};

const defaultProgress = () => ({
  version: 1,
  updatedAt: null,
  questions: {},
  highScores: {
    adaptive: 0,
    crossref: 0,
    motif: 0,
    explain: 0,
    book: 0,
    alphabet: 0,
  },
});

const state = {
  progress: loadProgress(),
  settings: null,
  currentQuestion: null,
  allCandidates: [],
  pool: [],
  missedPool: null,
  answers: [],
  shownQuestions: 0,
  score: 0,
  weightedPossible: 0,
  longestStreak: 0,
  streak: 0,
  dynamicTarget: 2,
  secondsLeft: 0,
  startedAt: 0,
  timerId: null,
  draft: null,
  awaitingNext: false,
  currentChain: null,
  chainAnswered: false,
  lastChainId: null,
  scriptureResult: null,
  readingScripture: false,
  synth: {
    context: null,
    master: null,
    timer: null,
    stepIndex: 0,
    playing: false,
  },
};

const QUESTION_BOOK_MAP = Object.fromEntries(
  QUESTIONS.map((question) => [question.id, inferPrimaryBook(question.reference)])
);

const QUESTION_INDEX = new Map(
  [...QUESTIONS, ...ALPHABET_QUESTIONS].map((question) => [question.id, question])
);

function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultProgress();
    return {
      ...defaultProgress(),
      ...parsed,
      questions: parsed.questions && typeof parsed.questions === "object" ? parsed.questions : {},
      highScores: {
        ...defaultProgress().highScores,
        ...(parsed.highScores || {}),
      },
    };
  } catch (error) {
    console.error("Failed to load progress", error);
    return defaultProgress();
  }
}

function saveProgress() {
  state.progress.updatedAt = new Date().toISOString();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueById(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

function normalizeAnswer(value) {
  if (value == null) return "";
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9:\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBookToken(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveBookName(rawBook) {
  const normalized = normalizeBookToken(rawBook);
  return BOOK_ALIAS_MAP.get(normalized) || null;
}

function inferPrimaryBook(reference) {
  if (!reference) return null;
  const first = String(reference).split(";")[0].trim();
  const match = first.match(/^([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+\d/);
  if (!match) return null;
  return resolveBookName(match[1]);
}

function parseScriptureQuery(query) {
  const trimmed = String(query || "").trim();
  const match = trimmed.match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/);
  if (!match) {
    return {
      error:
        "Use format like John 3:16 or John 3:16-18 (book, chapter, and optional verse range).",
    };
  }

  const canonicalBook = resolveBookName(match[1]);
  if (!canonicalBook) {
    return {
      error: `Book not recognized: ${match[1]}`,
    };
  }

  const chapter = Number(match[2]);
  const verseStart = match[3] ? Number(match[3]) : null;
  const verseEndRaw = match[4] ? Number(match[4]) : verseStart;

  if (!Number.isFinite(chapter) || chapter < 1) {
    return { error: "Chapter must be a positive number." };
  }

  if (verseStart != null && (!Number.isFinite(verseStart) || verseStart < 1)) {
    return { error: "Verse start must be a positive number." };
  }

  let verseEnd = verseEndRaw;
  if (verseStart != null && (verseEnd == null || !Number.isFinite(verseEnd) || verseEnd < 1)) {
    verseEnd = verseStart;
  }

  if (verseStart != null && verseEnd < verseStart) {
    verseEnd = verseStart;
  }

  return {
    original: trimmed,
    canonicalBook,
    bookNumber: BOOK_NUMBER_MAP[canonicalBook],
    chapter,
    verseStart,
    verseEnd,
  };
}

function isThemeHeavyQuestion(question) {
  const tags = question.tags || [];
  return (
    question.category === "Cross-Reference" ||
    question.category === "Motif" ||
    tags.includes("cross-reference") ||
    tags.includes("motif") ||
    tags.includes("theme")
  );
}

function getEasyComplexityPenalty(question, baselineDifficulty) {
  if (baselineDifficulty > 2) return 0;

  let penalty = 0;
  if (question.type === "multi") penalty -= baselineDifficulty === 1 ? 1.1 : 0.7;
  if (question.type === "text") penalty -= baselineDifficulty === 1 ? 0.45 : 0.15;
  if ((question.difficulty || 2) >= 4) penalty -= baselineDifficulty === 1 ? 1.0 : 0.35;
  if (isThemeHeavyQuestion(question)) penalty -= baselineDifficulty === 1 ? 0.5 : 0.2;
  return penalty;
}

function questionProfile(questionId) {
  const entry = state.progress.questions[questionId] || {};
  return {
    attempts: entry.attempts || 0,
    correct: entry.correct || 0,
    strength: Number.isFinite(entry.strength) ? entry.strength : 0,
    dueAt: entry.dueAt || null,
    streak: entry.streak || 0,
    lastSeen: entry.lastSeen || null,
  };
}

function updateQuestionProgress(questionId, isCorrect) {
  const now = Date.now();
  const current = questionProfile(questionId);
  const nextStrength = isCorrect
    ? Math.min(DEFAULT_INTERVALS.length - 1, current.strength + 1)
    : Math.max(0, current.strength - 1);

  state.progress.questions[questionId] = {
    attempts: current.attempts + 1,
    correct: current.correct + (isCorrect ? 1 : 0),
    strength: nextStrength,
    streak: isCorrect ? current.streak + 1 : 0,
    lastResult: isCorrect ? "correct" : "incorrect",
    lastSeen: new Date(now).toISOString(),
    dueAt: new Date(now + DEFAULT_INTERVALS[nextStrength]).toISOString(),
  };
}

function modeBoost(question, mode) {
  const tags = question.tags || [];
  const isCross = question.category === "Cross-Reference" || tags.includes("cross-reference");
  const isMotif = question.category === "Motif" || tags.includes("motif") || tags.includes("theme");

  if (mode === "crossref") {
    if (isCross) return 1.3;
    if (isMotif) return 0.8;
    return 0;
  }

  if (mode === "motif") {
    if (isMotif) return 1.35;
    if (isCross) return 0.7;
    return -0.05;
  }

  if (mode === "explain") {
    return isCross || isMotif ? 0.3 : 0.15;
  }

  return isCross || isMotif ? 0.25 : 0;
}

function filterQuestions(settings) {
  if (settings.mode === "alphabet") {
    const scriptScope = settings.testament === "OT" ? "hebrew" : settings.testament === "NT" ? "greek" : "all";
    if (scriptScope === "all") {
      return [...ALPHABET_QUESTIONS];
    }
    return ALPHABET_QUESTIONS.filter((question) => (question.tags || []).includes(scriptScope));
  }

  const testamentFiltered = QUESTIONS.filter((question) => {
    if (settings.testament === "all") return true;
    if (question.testament === "Both") return true;
    return question.testament === settings.testament;
  });

  let ordered;

  if (settings.mode === "book") {
    const scoped = testamentFiltered.filter((question) => {
      if (settings.bookScope === "all") return true;
      return QUESTION_BOOK_MAP[question.id] === settings.bookScope;
    });

    ordered = [...scoped].sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2));
  } else if (settings.mode === "adaptive" || settings.mode === "explain") {
    ordered = [...testamentFiltered];
  } else {
    const motifSet = testamentFiltered.filter((question) => {
      const tags = question.tags || [];
      return question.category === "Motif" || tags.includes("motif") || tags.includes("theme");
    });

    const crossSet = testamentFiltered.filter((question) => {
      const tags = question.tags || [];
      return question.category === "Cross-Reference" || tags.includes("cross-reference");
    });

    const basePool = settings.mode === "motif" ? [...motifSet, ...crossSet] : [...crossSet, ...motifSet];
    const fallback = testamentFiltered.filter(
      (question) => !basePool.some((baseItem) => baseItem.id === question.id)
    );
    ordered = uniqueById([...basePool, ...fallback]);
  }

  if (settings.difficulty <= 2) {
    const preferred = ordered.filter((question) => {
      if (settings.difficulty === 1) {
        if (settings.mode === "adaptive" || settings.mode === "book" || settings.mode === "explain") {
          return question.type === "mcq" && (question.difficulty || 2) <= 2 && !isThemeHeavyQuestion(question);
        }
        return question.type === "mcq" && (question.difficulty || 2) <= 3;
      }
      return question.type !== "multi" && (question.difficulty || 2) <= 3;
    });

    const preferredIds = new Set(preferred.map((question) => question.id));
    const rest = ordered.filter((question) => !preferredIds.has(question.id));
    ordered = [...preferred, ...rest];
  }

  return ordered;
}

function pickWeightedQuestion(candidates, targetDifficulty, mode, baselineDifficulty) {
  const now = Date.now();
  const weighted = candidates.map((question) => {
    const profile = questionProfile(question.id);
    const attempts = profile.attempts;
    const rate = attempts > 0 ? profile.correct / attempts : 0.45;
    const weakness = attempts === 0 ? 0.75 : Math.max(0.1, 1.15 - rate);

    const dueBoost = !profile.dueAt || new Date(profile.dueAt).getTime() <= now ? 0.65 : 0;
    const diffDistance = Math.abs((question.difficulty || 2) - targetDifficulty);
    const diffBoost = Math.max(0.1, 1.2 - diffDistance * 0.22);
    const recencyPenalty =
      profile.lastSeen && now - new Date(profile.lastSeen).getTime() < 15 * 60 * 1000 ? -0.2 : 0;
    const boost = modeBoost(question, mode);
    const easyPenalty = getEasyComplexityPenalty(question, baselineDifficulty);

    const weight = Math.max(
      0.08,
      weakness + dueBoost + diffBoost + boost + recencyPenalty + easyPenalty + Math.random() * 0.2
    );

    return {
      question,
      weight,
    };
  });

  const total = weighted.reduce((sum, row) => sum + row.weight, 0);
  let roll = Math.random() * total;

  for (const row of weighted) {
    roll -= row.weight;
    if (roll <= 0) return row.question;
  }

  return weighted[weighted.length - 1].question;
}

function getTargetDifficulty() {
  if (!state.settings) return 2;
  if (state.settings.mode !== "book") return state.dynamicTarget;

  const segment = Math.max(1, Math.floor(state.settings.length / 4));
  const ladder = state.settings.difficulty + Math.floor(state.answers.length / segment);
  return Math.min(5, ladder);
}

function ensurePool() {
  if (state.pool.length > 0) return;
  const source = state.missedPool ? [...state.missedPool] : [...state.allCandidates];
  if (source.length === 0) return;
  state.pool = shuffle(source);
}

function nextQuestion() {
  if (state.answers.length >= state.settings.length) return null;

  ensurePool();
  if (state.pool.length === 0) return null;

  const targetDifficulty = getTargetDifficulty();
  const question = pickWeightedQuestion(
    state.pool,
    targetDifficulty,
    state.settings.mode,
    state.settings.difficulty
  );

  const idx = state.pool.findIndex((item) => item.id === question.id);
  if (idx >= 0) state.pool.splice(idx, 1);

  return question;
}

function showScreen(target) {
  dom.setupScreen.classList.toggle("hidden", target !== "setup");
  dom.quizScreen.classList.toggle("hidden", target !== "quiz");
  dom.resultsScreen.classList.toggle("hidden", target !== "results");
}

function setupDraftForQuestion(question) {
  const draft = { explain: "" };

  if (question.type === "mcq") {
    draft.selected = null;
  } else if (question.type === "text") {
    draft.text = "";
  } else if (question.type === "multi") {
    draft.selected = new Set();
  }

  return draft;
}

function buildSessionLabel() {
  const modeLabel = MODE_LABELS[state.settings.mode] || "Session";
  const testamentLabel =
    state.settings.testament === "all"
      ? "Whole Bible"
      : TESTAMENT_LABELS[state.settings.testament] || state.settings.testament;

  if (state.settings.mode === "book" && state.settings.bookScope && state.settings.bookScope !== "all") {
    return `${modeLabel} - ${state.settings.bookScope}`;
  }

  return `${modeLabel} - ${testamentLabel}`;
}

function renderQuestion(question) {
  state.currentQuestion = question;
  state.draft = setupDraftForQuestion(question);
  state.awaitingNext = false;
  state.currentChain = null;
  state.chainAnswered = false;

  dom.sessionLabel.textContent = buildSessionLabel();
  dom.questionNumber.textContent = `Question ${state.answers.length + 1} of ${state.settings.length}`;

  const percent = Math.round((state.answers.length / state.settings.length) * 100);
  dom.progressFill.style.width = `${percent}%`;
  dom.progressTrack.setAttribute("aria-valuenow", String(percent));
  dom.progressText.textContent = `${state.answers.length} / ${state.settings.length}`;
  dom.liveScore.textContent = `Score: ${state.score}`;

  dom.questionTags.innerHTML = "";
  const tagValues = [
    question.category,
    `${question.difficulty}/5`,
    question.testament === "Both" ? "OT+NT" : question.testament,
    question.type === "multi" ? "Choose all" : question.type === "text" ? "Type" : "Multiple choice",
  ];

  tagValues.forEach((text) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = text;
    dom.questionTags.appendChild(span);
  });

  dom.questionPrompt.textContent = question.prompt;
  dom.answerArea.innerHTML = "";
  dom.statusMessage.textContent = "";

  if (question.type === "mcq") {
    renderMcq(question);
  } else if (question.type === "text") {
    renderText();
  } else if (question.type === "multi") {
    renderMulti(question);
  }

  if (state.settings.mode === "explain") {
    renderExplainField(question);
  }

  dom.submitBtn.textContent = "Submit Answer";
  dom.skipBtn.disabled = false;
  dom.feedbackBox.classList.add("hidden");
  dom.feedbackWhy.textContent = "";
  dom.themeChain.classList.add("hidden");
  dom.themeChainOptions.innerHTML = "";
  dom.themeChainResult.textContent = "";

  state.secondsLeft = state.settings.seconds;
  dom.timer.textContent = `${state.secondsLeft}s`;
  startTimer();
}

function renderMcq(question) {
  const block = document.createElement("div");
  block.className = "answer-block option-list";

  const options = shuffle(question.choices || []);
  for (const choice of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.textContent = choice;
    button.addEventListener("click", () => {
      state.draft.selected = choice;
      block.querySelectorAll("button").forEach((node) => node.classList.remove("selected"));
      button.classList.add("selected");
      dom.statusMessage.textContent = "";
    });
    block.appendChild(button);
  }

  dom.answerArea.appendChild(block);
}

function renderText() {
  const block = document.createElement("div");
  block.className = "answer-block";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type your answer...";
  input.autocomplete = "off";
  input.addEventListener("input", (event) => {
    state.draft.text = event.target.value;
    dom.statusMessage.textContent = "";
  });

  block.appendChild(input);
  dom.answerArea.appendChild(block);
  setTimeout(() => input.focus(), 0);
}

function renderMulti(question) {
  const block = document.createElement("div");
  block.className = "answer-block option-list";

  const options = shuffle(question.choices || []);
  for (const choice of options) {
    const row = document.createElement("label");
    row.className = "checkbox-row";

    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = choice;
    box.addEventListener("change", () => {
      if (box.checked) {
        state.draft.selected.add(choice);
      } else {
        state.draft.selected.delete(choice);
      }
      dom.statusMessage.textContent = "";
    });

    const span = document.createElement("span");
    span.textContent = choice;

    row.appendChild(box);
    row.appendChild(span);
    block.appendChild(row);
  }

  dom.answerArea.appendChild(block);
}

function deriveRubricKeywords(question) {
  const source = [];
  if (question.answer) source.push(question.answer);
  if (Array.isArray(question.answers)) source.push(...question.answers);
  if (question.category) source.push(question.category);
  if (Array.isArray(question.tags)) source.push(...question.tags);
  if (question.reference) source.push(question.reference);
  if (question.explanation) source.push(question.explanation);

  const tokens = [];
  source.forEach((item) => {
    normalizeAnswer(item)
      .split(" ")
      .forEach((token) => {
        if (token.length < 3) return;
        if (EXPLANATION_STOPWORDS.has(token)) return;
        tokens.push(token);
      });
  });

  return [...new Set(tokens)].slice(0, 10);
}

function renderExplainField(question) {
  const wrapper = document.createElement("div");
  wrapper.className = "explain-block";

  const label = document.createElement("label");
  label.textContent = "Why is this answer right?";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Write 1-3 sentences and mention scriptural logic or key references.";
  textarea.addEventListener("input", (event) => {
    state.draft.explain = event.target.value;
    dom.statusMessage.textContent = "";
  });

  const hint = document.createElement("p");
  hint.className = "explain-hint";
  const keywordHint = deriveRubricKeywords(question).slice(0, 4).join(", ");
  hint.textContent = keywordHint ? `Hint terms: ${keywordHint}` : "Use reference-based reasoning.";

  label.appendChild(textarea);
  wrapper.appendChild(label);
  wrapper.appendChild(hint);
  dom.answerArea.appendChild(wrapper);
}

function startTimer() {
  stopTimer();
  state.timerId = window.setInterval(() => {
    state.secondsLeft -= 1;
    dom.timer.textContent = `${Math.max(0, state.secondsLeft)}s`;

    if (state.secondsLeft <= 0) {
      stopTimer();
      evaluateAnswer({ forcedTimeout: true });
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function gradeAnswer(question, draft) {
  if (question.type === "mcq") {
    const response = draft.selected;
    if (!response) {
      return {
        valid: false,
        message: "Pick an option before submitting.",
      };
    }

    const correct = response === question.answer;
    return {
      valid: true,
      response,
      ratio: correct ? 1 : 0,
      correct,
      correctAnswerText: question.answer,
    };
  }

  if (question.type === "text") {
    const response = (draft.text || "").trim();
    if (!response) {
      return {
        valid: false,
        message: "Type your answer before submitting.",
      };
    }

    const normalized = normalizeAnswer(response);
    const accepted = (question.answers || []).map(normalizeAnswer);
    const correct = accepted.includes(normalized);

    return {
      valid: true,
      response,
      ratio: correct ? 1 : 0,
      correct,
      correctAnswerText: (question.answers || []).join(" / "),
    };
  }

  if (question.type === "multi") {
    const selected = Array.from(draft.selected || []);
    if (!selected.length) {
      return {
        valid: false,
        message: "Select at least one option.",
      };
    }

    const answerSet = new Set(question.answers || []);
    const selectedSet = new Set(selected);

    let correctHits = 0;
    let wrongHits = 0;

    for (const item of selectedSet) {
      if (answerSet.has(item)) {
        correctHits += 1;
      } else {
        wrongHits += 1;
      }
    }

    let missing = 0;
    for (const item of answerSet) {
      if (!selectedSet.has(item)) missing += 1;
    }

    const rawRatio = (correctHits - wrongHits * 0.5) / Math.max(1, answerSet.size);
    const ratio = Math.max(0, Math.min(1, rawRatio));
    const correct = missing === 0 && wrongHits === 0;

    return {
      valid: true,
      response: selected.join("; "),
      ratio,
      correct,
      correctAnswerText: (question.answers || []).join("; "),
    };
  }

  return {
    valid: false,
    message: "Unsupported question type.",
  };
}

function assessExplanation(question, explainText) {
  const text = String(explainText || "").trim();
  const wordCount = normalizeAnswer(text)
    .split(" ")
    .filter(Boolean).length;

  if (!text || wordCount < 6) {
    return {
      valid: false,
      message: "Explain-Why mode requires a short reason (at least 6 words).",
    };
  }

  const keywords = deriveRubricKeywords(question);
  const normalized = normalizeAnswer(text);
  const hits = keywords.filter((term) => normalized.includes(term));

  const logicalConnectors = ["because", "therefore", "since", "shows", "fulfills", "echoes", "theme", "motif"];
  const hasConnector = logicalConnectors.some((token) => normalized.includes(token));

  const base = hits.length / Math.max(2, Math.min(5, keywords.length));
  const ratio = Math.max(0, Math.min(1, base + (hasConnector ? 0.15 : 0)));

  return {
    valid: true,
    ratio,
    hits,
    keywords,
    text,
  };
}

function buildFeedbackMessage(ratio, correct, forcedTimeout) {
  if (forcedTimeout) return "Time expired.";
  if (correct) return "Correct.";
  if (ratio > 0) return "Partially correct.";
  return "Incorrect.";
}

function pickThemeChain(question) {
  const tags = question.tags || [];
  const category = question.category;

  let pool = THEME_CHAINS.filter((chain) => chain.themes.includes(category));

  if (!pool.length && tags.length) {
    pool = THEME_CHAINS.filter((chain) =>
      tags.some((tag) => chain.themes.some((theme) => normalizeAnswer(theme) === normalizeAnswer(tag)))
    );
  }

  if (!pool.length) {
    pool = THEME_CHAINS.filter(
      (chain) => chain.testament === "Both" || chain.testament === question.testament
    );
  }

  if (!pool.length) {
    pool = [...THEME_CHAINS];
  }

  const withoutRepeat = pool.filter((chain) => chain.id !== state.lastChainId);
  const working = withoutRepeat.length ? withoutRepeat : pool;
  const picked = working[Math.floor(Math.random() * working.length)];

  state.lastChainId = picked.id;
  return picked;
}

function renderThemeChain(question) {
  const chain = pickThemeChain(question);
  state.currentChain = chain;
  state.chainAnswered = false;

  dom.themeChainPrompt.textContent = chain.prompt;
  dom.themeChainOptions.innerHTML = "";
  dom.themeChainResult.textContent = "";

  chain.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-chain-option";
    button.textContent = option;
    button.addEventListener("click", () => handleThemeChainChoice(option, button));
    dom.themeChainOptions.appendChild(button);
  });

  dom.themeChain.classList.remove("hidden");
}

function handleThemeChainChoice(choice, button) {
  if (state.chainAnswered || !state.currentChain) return;
  state.chainAnswered = true;

  const chain = state.currentChain;
  const isCorrect = choice === chain.answer;

  const buttons = dom.themeChainOptions.querySelectorAll("button");
  buttons.forEach((node) => {
    if (node.textContent === chain.answer) node.classList.add("correct");
    if (node === button && !isCorrect) node.classList.add("incorrect");
    node.disabled = true;
  });

  if (isCorrect) {
    const bonus = 25 + (state.currentQuestion?.difficulty || 2) * 6;
    state.score += bonus;
    dom.liveScore.textContent = `Score: ${state.score}`;
    dom.themeChainResult.textContent = `Strong link. Bonus +${bonus}. ${chain.explanation}`;
  } else {
    dom.themeChainResult.textContent = `Best link: ${chain.answer}. ${chain.explanation}`;
  }
}

function evaluateAnswer({ forcedTimeout = false, forcedSkip = false } = {}) {
  if (state.awaitingNext) {
    advanceQuestion();
    return;
  }

  const question = state.currentQuestion;
  if (!question) return;

  stopTimer();

  let result;
  if (forcedTimeout || forcedSkip) {
    result = {
      valid: true,
      response: forcedSkip ? "Skipped" : "No answer (time)",
      ratio: 0,
      correct: false,
      correctAnswerText:
        question.type === "mcq"
          ? question.answer
          : question.type === "text"
          ? (question.answers || []).join(" / ")
          : (question.answers || []).join("; "),
    };
  } else {
    result = gradeAnswer(question, state.draft);
  }

  if (!result.valid) {
    dom.statusMessage.textContent = result.message;
    startTimer();
    return;
  }

  if (state.settings.mode === "explain" && !forcedTimeout && !forcedSkip) {
    const explainAssessment = assessExplanation(question, state.draft.explain);
    if (!explainAssessment.valid) {
      dom.statusMessage.textContent = explainAssessment.message;
      startTimer();
      return;
    }

    result.baseRatio = result.ratio;
    result.explainRatio = explainAssessment.ratio;
    result.explainHits = explainAssessment.hits;
    result.explainKeywords = explainAssessment.keywords;
    result.explainText = explainAssessment.text;

    result.ratio = Math.max(0, Math.min(1, result.baseRatio * 0.7 + explainAssessment.ratio * 0.3));
    result.correct = result.baseRatio >= 0.99 && explainAssessment.ratio >= 0.45;
    result.response = `${result.response} | Why: ${explainAssessment.text}`;
  }

  const basePoints = 80 + (question.difficulty || 2) * 30;
  const speedFactor = 0.55 + (state.secondsLeft / state.settings.seconds) * 0.45;
  const earned = Math.round(basePoints * speedFactor * result.ratio);

  state.score += earned;
  state.weightedPossible += basePoints;

  if (result.correct) {
    state.streak += 1;
    state.longestStreak = Math.max(state.longestStreak, state.streak);
  } else {
    state.streak = 0;
  }

  if (state.settings.mode !== "book") {
    state.dynamicTarget = Math.min(
      5,
      Math.max(1, state.dynamicTarget + (result.ratio >= 0.99 ? 0.35 : result.ratio >= 0.6 ? 0.1 : -0.28))
    );
  }

  const elapsed = state.settings.seconds - state.secondsLeft;

  const reviewItem = {
    questionId: question.id,
    prompt: question.prompt,
    category: question.category,
    testament: question.testament,
    response: result.response,
    ratio: result.ratio,
    correct: result.correct,
    earned,
    possible: basePoints,
    elapsed,
    correctAnswer: result.correctAnswerText,
    reference: question.reference,
    explanation: question.explanation,
    explainRatio: result.explainRatio || null,
    explainText: result.explainText || null,
  };

  state.answers.push(reviewItem);
  updateQuestionProgress(question.id, result.correct);

  const feedbackText = buildFeedbackMessage(result.ratio, result.correct, forcedTimeout);
  dom.feedbackResult.textContent = feedbackText;
  dom.feedbackResult.className = "feedback-result " + (result.correct ? "good" : "bad");
  dom.feedbackAnswer.textContent = `Your answer: ${result.response}`;

  if (state.settings.mode === "explain" && result.explainRatio != null) {
    const explainPercent = Math.round(result.explainRatio * 100);
    const hitPreview = (result.explainHits || []).slice(0, 4).join(", ") || "none";
    dom.feedbackWhy.textContent = `Why score: ${explainPercent}% (matched terms: ${hitPreview})`;
  } else {
    dom.feedbackWhy.textContent = "";
  }

  dom.feedbackReference.textContent = `Reference: ${question.reference}`;
  dom.feedbackExplanation.textContent = `Why: ${question.explanation} | Correct: ${result.correctAnswerText}`;
  dom.feedbackBox.classList.remove("hidden");

  if (state.settings.mode !== "alphabet") {
    renderThemeChain(question);
  } else {
    dom.themeChain.classList.add("hidden");
  }

  dom.liveScore.textContent = `Score: ${state.score}`;

  state.awaitingNext = true;
  dom.submitBtn.textContent = "Next Question";
  dom.skipBtn.disabled = true;

  saveProgress();
}

function advanceQuestion() {
  const question = nextQuestion();
  if (!question) {
    finishSession();
    return;
  }

  state.shownQuestions += 1;
  renderQuestion(question);
}

function finishSession() {
  stopTimer();

  const fullCorrect = state.answers.filter((item) => item.correct).length;
  const accuracy = state.answers.length === 0 ? 0 : Math.round((fullCorrect / state.answers.length) * 100);

  const mode = state.settings.mode;
  const previousHigh = state.progress.highScores[mode] || 0;
  if (state.score > previousHigh) {
    state.progress.highScores[mode] = state.score;
    saveProgress();
  }

  dom.finalScore.textContent = String(state.score);
  dom.accuracy.textContent = `${accuracy}%`;
  dom.streak.textContent = String(state.longestStreak);
  dom.highScore.textContent = String(state.progress.highScores[mode] || 0);

  const misses = state.answers.filter((item) => !item.correct);
  dom.missedList.innerHTML = "";

  if (misses.length === 0) {
    const clean = document.createElement("p");
    clean.textContent = "No misses in this session.";
    dom.missedList.appendChild(clean);
    dom.retakeMissedBtn.disabled = true;
  } else {
    dom.retakeMissedBtn.disabled = false;
    for (const miss of misses) {
      const block = document.createElement("article");
      block.className = "missed-item";
      block.innerHTML = `
        <p><strong>${miss.prompt}</strong></p>
        <p><strong>Your answer:</strong> ${miss.response}</p>
        ${miss.explainText ? `<p><strong>Your why:</strong> ${miss.explainText}</p>` : ""}
        <p><strong>Correct:</strong> ${miss.correctAnswer}</p>
        <p><strong>Reference:</strong> ${miss.reference}</p>
        <p>${miss.explanation}</p>
      `;
      dom.missedList.appendChild(block);
    }
  }

  showScreen("results");
}

function startSession({ customQuestions = null } = {}) {
  state.settings = {
    mode: dom.modeSelect.value,
    testament: dom.testamentSelect.value,
    bookScope: dom.bookScopeSelect.value,
    length: Number(dom.lengthSelect.value),
    seconds: Number(dom.secondsSelect.value),
    difficulty: Number(dom.difficultySelect.value),
  };

  state.answers = [];
  state.shownQuestions = 0;
  state.score = 0;
  state.weightedPossible = 0;
  state.streak = 0;
  state.longestStreak = 0;
  state.dynamicTarget = state.settings.difficulty;
  state.startedAt = Date.now();
  state.awaitingNext = false;
  state.currentQuestion = null;
  state.currentChain = null;
  state.chainAnswered = false;
  state.missedPool = customQuestions ? [...customQuestions] : null;

  state.allCandidates = filterQuestions(state.settings);
  state.pool = shuffle(customQuestions ? [...customQuestions] : [...state.allCandidates]);

  if (state.pool.length < state.settings.length) {
    state.settings.length = state.pool.length;
  }

  if (state.settings.length <= 0) {
    dom.modeDescription.textContent =
      "No questions match that setup. Try another book, lower difficulty, or broader testament scope.";
    return;
  }

  showScreen("quiz");
  advanceQuestion();
}

function runRetakeMissed() {
  const misses = state.answers
    .filter((item) => !item.correct)
    .map((item) => QUESTION_INDEX.get(item.questionId))
    .filter(Boolean);

  if (!misses.length) return;

  dom.lengthSelect.value = String(Math.min(40, Math.max(5, misses.length)));
  startSession({ customQuestions: uniqueById(misses) });
}

function resetToSetup() {
  stopTimer();
  showScreen("setup");
}

function unwrapChapterPayload(payload) {
  if (payload?.verses) return payload;

  if (Array.isArray(payload)) {
    return payload.find((entry) => entry?.verses) || payload[0] || null;
  }

  if (payload && typeof payload === "object") {
    for (const value of Object.values(payload)) {
      if (value?.verses) return value;
    }
  }

  return null;
}

function normalizeVerseRows(verses, fallbackChapter) {
  if (!Array.isArray(verses)) return [];

  return verses
    .map((verse) => ({
      chapter: Number(verse.chapter || fallbackChapter),
      verse: Number(verse.verse || verse.verse_nr || verse.number || 0),
      text: String(verse.text || verse.content || "").trim(),
    }))
    .filter((verse) => verse.verse > 0 && verse.text);
}

function formatReferenceLabel(parsed) {
  if (parsed.verseStart == null) return `${parsed.canonicalBook} ${parsed.chapter}`;
  if (parsed.verseStart === parsed.verseEnd) {
    return `${parsed.canonicalBook} ${parsed.chapter}:${parsed.verseStart}`;
  }
  return `${parsed.canonicalBook} ${parsed.chapter}:${parsed.verseStart}-${parsed.verseEnd}`;
}

async function fetchGetBibleRange(parsed, translationCode) {
  const url = `https://api.getbible.net/v2/${encodeURIComponent(translationCode)}/${parsed.bookNumber}/${parsed.chapter}.json`;
  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to fetch scripture from getBible.");
  }

  const chapterPayload = unwrapChapterPayload(payload);
  if (!chapterPayload?.verses) {
    throw new Error("Unexpected scripture response shape.");
  }

  let verses = normalizeVerseRows(chapterPayload.verses, parsed.chapter);
  if (parsed.verseStart != null) {
    verses = verses.filter((verse) => verse.verse >= parsed.verseStart && verse.verse <= parsed.verseEnd);
  }

  return {
    reference: formatReferenceLabel(parsed),
    verses,
    translationName:
      chapterPayload.translation || SCRIPTURE_TRANSLATION_LABELS[translationCode] || translationCode.toUpperCase(),
  };
}

async function fetchBibleApiRange(parsed, translationCode) {
  const response = await fetch(
    `https://bible-api.com/${encodeURIComponent(parsed.original)}?translation=${encodeURIComponent(translationCode)}`
  );
  const payload = await response.json();

  if (!response.ok || payload.error) {
    throw new Error(payload.error || "Unable to fetch scripture from fallback API.");
  }

  const verses = normalizeVerseRows(payload.verses || [], parsed.chapter);
  return {
    reference: payload.reference || formatReferenceLabel(parsed),
    verses,
    translationName:
      payload.translation_name || SCRIPTURE_TRANSLATION_LABELS[translationCode] || translationCode.toUpperCase(),
  };
}

function renderScriptureResult(result) {
  dom.scriptureViewer.innerHTML = "";
  state.scriptureResult = result;
  dom.scriptureReadBtn.disabled = false;
  dom.scriptureStopBtn.disabled = true;

  const title = document.createElement("h3");
  title.className = "scripture-reference";
  title.textContent = result.reference;
  dom.scriptureViewer.appendChild(title);

  if (!result.verses.length) {
    const empty = document.createElement("p");
    empty.className = "placeholder";
    empty.textContent = "No verses returned for that range.";
    dom.scriptureViewer.appendChild(empty);
  } else {
    result.verses.forEach((verse) => {
      const line = document.createElement("p");
      line.className = "scripture-verse";

      const number = document.createElement("span");
      number.className = "verse-num";
      number.textContent = `${verse.chapter}:${verse.verse}`;

      line.appendChild(number);
      line.appendChild(document.createTextNode(verse.text));
      dom.scriptureViewer.appendChild(line);
    });
  }

  dom.scriptureStatus.textContent = `${result.reference} (${result.translationName})`;
}

function supportsSpeechSynthesis() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function getVoices() {
  if (!supportsSpeechSynthesis()) return [];
  return window.speechSynthesis.getVoices() || [];
}

function pickVoiceForLang(lang) {
  const voices = getVoices();
  if (!voices.length) return null;

  const exact = voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;

  const base = lang.split("-")[0].toLowerCase();
  const family = voices.find((voice) => voice.lang.toLowerCase().startsWith(base));
  if (family) return family;

  return voices[0] || null;
}

function chunkText(text, maxSize = 210) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(clean.length, start + maxSize);
    if (end < clean.length) {
      const lastPunct = clean.lastIndexOf(".", end);
      const lastComma = clean.lastIndexOf(",", end);
      const lastSpace = clean.lastIndexOf(" ", end);
      const splitAt = Math.max(lastPunct, lastComma, lastSpace);
      if (splitAt > start + 40) {
        end = splitAt + 1;
      }
    }
    chunks.push(clean.slice(start, end).trim());
    start = end;
  }

  return chunks.filter(Boolean);
}

function getScriptureReadRate() {
  const parsed = Number(dom.scriptureSpeed.value);
  if (!Number.isFinite(parsed)) return 0.75;
  return Math.min(2, Math.max(0.1, parsed));
}

function updateScriptureSpeedLabel() {
  const rate = getScriptureReadRate();
  dom.scriptureSpeedValue.textContent = `${rate.toFixed(2)}x`;
}

function getSlowReadPauseMs(rate) {
  if (rate >= 1.2) return 0;
  if (rate >= 1.0) return 90;
  if (rate >= 0.85) return 220;
  if (rate >= 0.7) return 420;
  if (rate >= 0.55) return 700;
  if (rate >= 0.4) return 1100;
  if (rate >= 0.3) return 1550;
  if (rate >= 0.2) return 2050;
  return 2600;
}

function getScriptureChunkSize(rate) {
  if (rate >= 1.2) return 240;
  if (rate >= 1.0) return 190;
  if (rate >= 0.85) return 150;
  if (rate >= 0.7) return 115;
  if (rate >= 0.55) return 82;
  if (rate >= 0.4) return 58;
  if (rate >= 0.3) return 42;
  if (rate >= 0.2) return 30;
  return 22;
}

function updateReadingStatusLine() {
  if (!state.readingScripture || !state.scriptureResult) return;
  const translationCode = state.scriptureResult.translationCode || dom.scriptureTranslation.value || "web";
  const langLabel = SCRIPTURE_TRANSLATION_LABELS[translationCode] || translationCode.toUpperCase();
  const rate = getScriptureReadRate();
  dom.scriptureStatus.textContent = `Reading ${state.scriptureResult.reference} (${langLabel}) at ${rate.toFixed(2)}x...`;
}

function stopScriptureRead({ silent = false } = {}) {
  if (!supportsSpeechSynthesis()) return;
  window.speechSynthesis.cancel();
  state.readingScripture = false;
  dom.scriptureReadBtn.disabled = !state.scriptureResult;
  dom.scriptureStopBtn.disabled = true;
  if (!silent) {
    dom.scriptureStatus.textContent = "Read aloud stopped.";
  }
}

function buildScriptureSpeakText(result) {
  const header = `${result.reference}.`;
  const body = (result.verses || [])
    .map((verse) => `${verse.chapter}:${verse.verse}. ${verse.text}`)
    .join(" ");
  return `${header} ${body}`.trim();
}

function readScriptureAloud() {
  if (!state.scriptureResult) {
    dom.scriptureStatus.textContent = "Search a scripture passage first.";
    return;
  }

  if (!supportsSpeechSynthesis()) {
    dom.scriptureStatus.textContent = "Read aloud is not supported in this browser.";
    return;
  }

  const translationCode = state.scriptureResult.translationCode || dom.scriptureTranslation.value || "web";
  const lang = SCRIPTURE_TTS_LANG[translationCode] || "en-US";
  const fullText = buildScriptureSpeakText(state.scriptureResult);
  const initialRate = getScriptureReadRate();
  const chunks = chunkText(fullText, getScriptureChunkSize(initialRate));

  if (!chunks.length) {
    dom.scriptureStatus.textContent = "No scripture text available to read.";
    return;
  }

  stopScriptureRead({ silent: true });
  state.readingScripture = true;
  dom.scriptureReadBtn.disabled = true;
  dom.scriptureStopBtn.disabled = false;

  let queueIndex = 0;
  const voice = pickVoiceForLang(lang);

  const speakNext = () => {
    if (!state.readingScripture) return;
    if (queueIndex >= chunks.length) {
      state.readingScripture = false;
      dom.scriptureReadBtn.disabled = false;
      dom.scriptureStopBtn.disabled = true;
      dom.scriptureStatus.textContent = `Read aloud complete (${state.scriptureResult.reference}).`;
      return;
    }

    const liveRate = getScriptureReadRate();
    const pauseMs = getSlowReadPauseMs(liveRate);
    const chunk = chunks[queueIndex];
    const punctuationPause = /[.!?]["')\]]*$/.test(chunk)
      ? Math.round(Math.max(120, pauseMs * 0.45))
      : /[,;:]["')\]]*$/.test(chunk)
      ? Math.round(Math.max(70, pauseMs * 0.2))
      : 0;

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = lang;
    if (voice) utterance.voice = voice;
    utterance.rate = Math.max(0.45, liveRate);
    utterance.pitch = 1;
    utterance.onend = () => {
      queueIndex += 1;
      const totalPause = pauseMs + punctuationPause;
      if (totalPause > 0) {
        window.setTimeout(speakNext, totalPause);
      } else {
        speakNext();
      }
    };
    utterance.onerror = (event) => {
      state.readingScripture = false;
      dom.scriptureReadBtn.disabled = false;
      dom.scriptureStopBtn.disabled = true;
      dom.scriptureStatus.textContent = `Read aloud error: ${event.error || "speech unavailable"}`;
    };

    window.speechSynthesis.speak(utterance);
    updateReadingStatusLine();
  };

  updateReadingStatusLine();
  speakNext();
}

async function lookupScripture(event) {
  if (event) event.preventDefault();
  if (state.readingScripture) {
    stopScriptureRead({ silent: true });
  }

  const query = (dom.scriptureQuery.value || "").trim();
  const translation = dom.scriptureTranslation.value || "web";

  if (!query) {
    dom.scriptureStatus.textContent = "Enter a verse or range first.";
    return;
  }

  const parsed = parseScriptureQuery(query);
  if (parsed.error) {
    dom.scriptureStatus.textContent = parsed.error;
    return;
  }

  dom.scriptureStatus.textContent = "Loading scripture...";

  try {
    const result = await fetchGetBibleRange(parsed, translation);
    result.translationCode = translation;
    renderScriptureResult(result);
  } catch (primaryError) {
    if (translation === "web" || translation === "kjv") {
      try {
        const fallback = await fetchBibleApiRange(parsed, translation);
        fallback.translationCode = translation;
        renderScriptureResult(fallback);
        return;
      } catch (fallbackError) {
        dom.scriptureStatus.textContent = `Lookup error: ${fallbackError.message}`;
      }
    } else {
      dom.scriptureStatus.textContent = `Lookup error: ${primaryError.message}`;
    }

    dom.scriptureViewer.innerHTML = "";
    state.scriptureResult = null;
    dom.scriptureReadBtn.disabled = true;
    dom.scriptureStopBtn.disabled = true;
    const placeholder = document.createElement("p");
    placeholder.className = "placeholder";
    placeholder.textContent = "Unable to load scripture right now. Check internet connection and reference format.";
    dom.scriptureViewer.appendChild(placeholder);
  }
}

function initializeModeDescription() {
  const mode = dom.modeSelect.value;
  dom.modeDescription.textContent = MODE_DESCRIPTIONS[mode] || "";
}

function initializeDifficultyNote() {
  const level = Number(dom.difficultySelect.value);
  dom.difficultyNote.textContent = DIFFICULTY_NOTES[level] || "";
}

function populateBookScopeOptions() {
  const books = [...new Set(Object.values(QUESTION_BOOK_MAP).filter(Boolean))].sort(
    (a, b) => (BOOK_NUMBER_MAP[a] || 999) - (BOOK_NUMBER_MAP[b] || 999)
  );

  dom.bookScopeSelect.innerHTML = "";

  const anyOption = document.createElement("option");
  anyOption.value = "all";
  anyOption.textContent = "Any Book";
  dom.bookScopeSelect.appendChild(anyOption);

  books.forEach((book) => {
    const option = document.createElement("option");
    option.value = book;
    option.textContent = book;
    dom.bookScopeSelect.appendChild(option);
  });
}

function syncModeControls() {
  const mode = dom.modeSelect.value;
  const isBookMode = mode === "book";
  dom.bookScopeSelect.disabled = !isBookMode;
  dom.testamentSelect.disabled = false;

  if (!isBookMode) {
    dom.bookScopeSelect.value = "all";
  }

  initializeModeDescription();
}

function activateAlphabetMode() {
  dom.modeSelect.value = "alphabet";
  syncModeControls();
  initializeDifficultyNote();
  dom.setupScreen.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateMusicStatus(message) {
  dom.musicStatus.textContent = message;
}

function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function ensureSynthContext() {
  if (state.synth.context) return state.synth.context;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  const context = new AudioCtx();
  const master = context.createGain();
  master.gain.value = Number(dom.musicVolume.value || 0.25) * 0.6;
  master.connect(context.destination);

  state.synth.context = context;
  state.synth.master = master;
  return context;
}

function playSynthVoice({ context, master, frequency, startTime, duration, gainAmount, detuneCents = 0 }) {
  const osc = context.createOscillator();
  const flavor = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, startTime);
  osc.detune.setValueAtTime(detuneCents, startTime);

  flavor.type = "square";
  flavor.frequency.setValueAtTime(frequency, startTime);
  flavor.detune.setValueAtTime(detuneCents + 2, startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2600, startTime);
  filter.Q.setValueAtTime(0.9, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainAmount, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(filter);
  flavor.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(startTime);
  flavor.start(startTime);
  osc.stop(startTime + duration + 0.02);
  flavor.stop(startTime + duration + 0.02);
}

function scheduleCounterpointStep() {
  if (!state.synth.playing || !state.synth.context || !state.synth.master) return;

  const context = state.synth.context;
  const index = state.synth.stepIndex % COUNTERPOINT_SYNTH.leadMidi.length;
  const leadMidi = COUNTERPOINT_SYNTH.leadMidi[index];
  const bassMidi = COUNTERPOINT_SYNTH.bassMidi[index];
  const stepSeconds = (60 / COUNTERPOINT_SYNTH.bpm) * COUNTERPOINT_SYNTH.stepBeats;
  const startTime = context.currentTime + 0.012;
  const duration = stepSeconds * 0.9;

  playSynthVoice({
    context,
    master: state.synth.master,
    frequency: midiToHz(leadMidi),
    startTime,
    duration,
    gainAmount: 0.085,
    detuneCents: -1.5,
  });

  playSynthVoice({
    context,
    master: state.synth.master,
    frequency: midiToHz(bassMidi),
    startTime,
    duration: duration * 0.98,
    gainAmount: 0.11,
    detuneCents: 1.5,
  });

  state.synth.stepIndex += 1;
}

async function startCounterpointSynth() {
  const context = ensureSynthContext();
  if (!context || !state.synth.master) {
    updateMusicStatus("Web Audio not supported for synth on this browser.");
    return false;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  state.synth.master.gain.cancelScheduledValues(context.currentTime);
  state.synth.master.gain.setValueAtTime(Number(dom.musicVolume.value || 0.25) * 0.6, context.currentTime);

  if (state.synth.playing) return true;

  const stepSeconds = (60 / COUNTERPOINT_SYNTH.bpm) * COUNTERPOINT_SYNTH.stepBeats;
  state.synth.playing = true;
  scheduleCounterpointStep();
  state.synth.timer = window.setInterval(scheduleCounterpointStep, stepSeconds * 1000);
  return true;
}

function stopCounterpointSynth({ resetStep = false } = {}) {
  if (state.synth.timer) {
    window.clearInterval(state.synth.timer);
    state.synth.timer = null;
  }
  state.synth.playing = false;
  if (resetStep) {
    state.synth.stepIndex = 0;
  }
}

function stopAmbient() {
  stopCounterpointSynth({ resetStep: true });
  dom.ambientAudio.pause();
  dom.ambientAudio.currentTime = 0;
  dom.musicToggle.textContent = "Play";
}

function setAmbientTrack(trackId) {
  if (trackId === "none") {
    stopAmbient();
    dom.ambientAudio.removeAttribute("src");
    updateMusicStatus("Ambience off");
    return;
  }

  if (trackId === "counterpoint") {
    const wasPlaying = state.synth.playing || !dom.ambientAudio.paused;
    dom.ambientAudio.pause();
    dom.ambientAudio.currentTime = 0;
    dom.ambientAudio.removeAttribute("src");
    if (wasPlaying) {
      startCounterpointSynth()
        .then((ok) => {
          if (!ok) return;
          dom.musicToggle.textContent = "Pause";
          updateMusicStatus(`Playing: ${COUNTERPOINT_SYNTH.label}`);
        })
        .catch((error) => {
          dom.musicToggle.textContent = "Play";
          updateMusicStatus(`Unable to start synth: ${error.message}`);
        });
    } else {
      stopCounterpointSynth({ resetStep: false });
      updateMusicStatus(`Selected: ${COUNTERPOINT_SYNTH.label}`);
    }
    return;
  }

  const track = AMBIENT_TRACKS[trackId];
  if (!track) {
    updateMusicStatus("Track unavailable");
    return;
  }

  const wasPlaying = state.synth.playing || !dom.ambientAudio.paused;
  stopCounterpointSynth({ resetStep: false });
  dom.ambientAudio.src = track.url;
  dom.ambientAudio.crossOrigin = "anonymous";
  dom.ambientAudio.load();

  if (wasPlaying) {
    dom.ambientAudio
      .play()
      .then(() => {
        dom.musicToggle.textContent = "Pause";
        updateMusicStatus(`Playing: ${track.label}`);
      })
      .catch((error) => {
        dom.musicToggle.textContent = "Play";
        updateMusicStatus(`Unable to autoplay: ${error.message}`);
      });
  } else {
    updateMusicStatus(`Selected: ${track.label}`);
  }
}

async function toggleAmbientPlayback() {
  const trackId = dom.musicTrack.value;
  if (trackId === "none") {
    updateMusicStatus("Choose chant, Bach, or Counterpoint first.");
    return;
  }

  if (trackId === "counterpoint") {
    if (!state.synth.playing) {
      dom.ambientAudio.pause();
      dom.ambientAudio.currentTime = 0;
      const ok = await startCounterpointSynth();
      if (!ok) return;
      dom.musicToggle.textContent = "Pause";
      updateMusicStatus(`Playing: ${COUNTERPOINT_SYNTH.label}`);
    } else {
      stopCounterpointSynth({ resetStep: false });
      dom.musicToggle.textContent = "Play";
      updateMusicStatus("Paused");
    }
    return;
  }

  const track = AMBIENT_TRACKS[trackId];
  const wasPlaying = state.synth.playing || !dom.ambientAudio.paused;
  stopCounterpointSynth({ resetStep: false });

  if (dom.ambientAudio.paused || wasPlaying) {
    if (!dom.ambientAudio.src) {
      dom.ambientAudio.src = track.url;
      dom.ambientAudio.crossOrigin = "anonymous";
      dom.ambientAudio.load();
    }

    try {
      await dom.ambientAudio.play();
      dom.musicToggle.textContent = "Pause";
      updateMusicStatus(`Playing: ${track.label}`);
    } catch (error) {
      updateMusicStatus(`Playback blocked: click again. (${error.message})`);
    }
  } else {
    dom.ambientAudio.pause();
    dom.musicToggle.textContent = "Play";
    updateMusicStatus("Paused");
  }
}

function bindEvents() {
  if (dom.alphabetShortcut) {
    dom.alphabetShortcut.addEventListener("click", activateAlphabetMode);
  }

  dom.setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startSession();
  });

  dom.modeSelect.addEventListener("change", syncModeControls);
  dom.bookScopeSelect.addEventListener("change", initializeModeDescription);
  dom.difficultySelect.addEventListener("change", initializeDifficultyNote);
  dom.scriptureForm.addEventListener("submit", lookupScripture);
  dom.scriptureReadBtn.addEventListener("click", readScriptureAloud);
  dom.scriptureStopBtn.addEventListener("click", () => stopScriptureRead());
  dom.scriptureSpeed.addEventListener("input", () => {
    updateScriptureSpeedLabel();
    updateReadingStatusLine();
  });

  dom.submitBtn.addEventListener("click", () => {
    evaluateAnswer();
  });

  dom.skipBtn.addEventListener("click", () => {
    evaluateAnswer({ forcedSkip: true });
  });

  dom.retakeMissedBtn.addEventListener("click", () => {
    runRetakeMissed();
  });

  dom.newSessionBtn.addEventListener("click", () => {
    resetToSetup();
  });

  dom.musicTrack.addEventListener("change", () => {
    setAmbientTrack(dom.musicTrack.value);
  });

  dom.musicToggle.addEventListener("click", () => {
    toggleAmbientPlayback();
  });

  dom.musicVolume.addEventListener("input", () => {
    dom.ambientAudio.volume = Number(dom.musicVolume.value);
    if (state.synth.master && state.synth.context) {
      state.synth.master.gain.setValueAtTime(
        Number(dom.musicVolume.value || 0.25) * 0.6,
        state.synth.context.currentTime
      );
    }
  });

  if (supportsSpeechSynthesis()) {
    const voicesPrime = () => {
      getVoices();
    };
    window.speechSynthesis.addEventListener("voiceschanged", voicesPrime);
    voicesPrime();
  }

  document.addEventListener("keydown", (event) => {
    if (dom.quizScreen.classList.contains("hidden")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      evaluateAnswer();
    }
  });
}

function init() {
  dom.ambientAudio.volume = Number(dom.musicVolume.value || 0.25);
  dom.scriptureReadBtn.disabled = true;
  dom.scriptureStopBtn.disabled = true;
  updateScriptureSpeedLabel();
  populateBookScopeOptions();
  initializeDifficultyNote();
  syncModeControls();
  bindEvents();
  showScreen("setup");
  lookupScripture();
}

init();
