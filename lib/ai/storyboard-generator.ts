import { getGeminiModel, getGeminiModelsToTry } from "@/lib/ai/gemini";
import { sanitizeJsonEscapes } from "@/lib/ai/sanitize-json";
import type { StoryEpisode, StoryScene, GenerateStoryRequest } from "@/types/story";

// ==========================================
// ASSET AUTO-RESOLVER (Ensures 100% Real Visuals for Any Generated Scene)
// ==========================================

export function resolveSceneAssets(scene: StoryScene): StoryScene {
  const charName = (scene.character?.name || "").toLowerCase();
  const charGender = scene.character?.voiceGender || "male";

  // Auto-resolve character avatar
  if (!scene.character.avatarUrl || scene.character.avatarUrl.includes("placeholder")) {
    if (charName.includes("jinnah") || charName.includes("quaid")) {
      scene.character.avatarUrl = "/stories/quaid_jinnah.jpg";
    } else if (charName.includes("syed") || charName.includes("aligarh") || charName.includes("sir")) {
      scene.character.avatarUrl = "/stories/sir_syed.jpg";
    } else if (charName.includes("fazlul") || charName.includes("huq") || charName.includes("bengal")) {
      scene.character.avatarUrl = "/stories/fazlul_huq.jpg";
    } else if (charGender === "female" || charName.includes("ayla") || charName.includes("fatima")) {
      scene.character.avatarUrl = "/stories/ayla_teen.jpg";
    } else {
      scene.character.avatarUrl = "/stories/zain_teen.jpg";
    }
  }

  // Auto-resolve scene background image
  if (!scene.backgroundImageUrl || scene.backgroundImageUrl.includes("placeholder")) {
    const setting = (scene.settingDescription || "").toLowerCase();
    if (setting.includes("college") || setting.includes("school") || setting.includes("university") || setting.includes("library") || setting.includes("delhi")) {
      scene.backgroundImageUrl = "/stories/bg_mao_college.jpg";
    } else {
      scene.backgroundImageUrl = "/stories/bg_minto_park_1940.jpg";
    }
  }

  return scene;
}

// ==========================================
// PRE-CURATED HIGH-PRODUCTION EPISODES
// ==========================================

export const SAMPLE_EPISODE_LAHORE_RESOLUTION: StoryEpisode = {
  id: "ep-lahore-resolution-1940",
  title: "The Historic March: Lahore Resolution 1940",
  urduTitle: "تاریخی مارچ: قرار دادِ لاہور ۱۹۴۰ء",
  chapterNumber: 4,
  chapterName: "Movement for Pakistan (1940-1947)",
  subject: "Pakistan Studies",
  targetGrade: "Grade 9 & 10 (Matric & O-Level)",
  sloIds: ["SLO-PAK-04-02", "SLO-PAK-04-03"],
  sloSummary: "Analyze the significance, presentation, and key clauses of the Lahore Resolution (1940) and its impact on the Two-Nation Theory.",
  totalDurationSeconds: 52,
  synopsis: "Step into Minto Park Lahore on March 23, 1940. Experience the historic moment as over 100,000 delegates gathered, Sher-e-Bangla A.K. Fazlul Huq presented the landmark resolution, and Quaid-e-Azam declared the destiny of the Muslim nation.",
  videoUrl: "/videos/pakistan_movement_lecture.webm",
  keyHistoricalDates: [
    { date: "March 22-24, 1940", event: "27th Annual Session of All India Muslim League at Minto Park, Lahore" },
    { date: "March 23, 1940", event: "A.K. Fazlul Huq (Premier of Bengal) moves the historic resolution" },
    { date: "March 24, 1940", event: "Resolution unanimously passed; Hindu press labels it 'Pakistan Resolution'" }
  ],
  examQuestionsCovered: [
    { marks: 3, question: "Who presented the Lahore Resolution on 23rd March 1940?", sloCode: "SLO-PAK-04-02" },
    { marks: 4, question: "Explain the main territorial demand outlined in the Lahore Resolution.", sloCode: "SLO-PAK-04-02" },
    { marks: 7, question: "Why is the Lahore Resolution considered the turning point in the Pakistan Movement?", sloCode: "SLO-PAK-04-03" }
  ],
  scenes: [
    {
      id: "scene-1",
      sceneNumber: 1,
      title: "Arrival at Minto Park",
      durationSeconds: 12,
      settingDescription: "Minto Park, Lahore on a sunny spring morning in March 1940. Massive green and white shamiana tents, colorful flags, and an enthusiastic crowd of over 100,000 Muslims from every corner of India.",
      backgroundTheme: "historical_day",
      backgroundImageUrl: "/stories/bg_minto_park_1940.jpg",
      character: {
        id: "char-zain",
        name: "Zain",
        title: "History Explorer",
        avatarUrl: "/stories/zain_teen.jpg",
        voiceGender: "male",
        voiceTone: "Enthusiastic, curious, youthful",
        visualDescription: "Animated 3D teen Pakistani student in a modern green hoodie.",
        colorScheme: { primary: "#10b981", secondary: "#047857", accent: "#f59e0b" }
      },
      characterAction: "Looking around in absolute awe at the sea of delegates chanting for freedom.",
      dialogueEnglish: "Welcome to Minto Park Lahore on March 23rd, 1940. Over one hundred thousand Muslims and delegates from across the subcontinent have gathered here under one banner of freedom.",
      dialogueUrdu: "آئلہ دیکھو! ہم ٹھیک ۲۳ مارچ ۱۹۴۰ء کو منٹو پارک لاہور میں کھڑے ہیں۔ ایک لاکھ سے زائد لوگ آزادی کے ولولے سے جمع ہیں!",
      historicalContextNote: "The 27th Session of the All India Muslim League was held at Minto Park under the presidency of Quaid-e-Azam.",
      examKeyPoint: "Date & Venue: 22nd to 24th March 1940 at Minto Park, Lahore.",
      soundEffect: "Distant crowd cheers, festive brass band, flapping canvas tents",
      backgroundMusicMood: "inspirational",
      productionPrompts: {
        imagePrompt: "Pixar 3D animated cinematic rendering, wide panoramic establishing shot of Minto Park Lahore in 1940, massive green and white festive tents, 100000 cheerful delegates, bright sunny day, 4k render",
        cameraMovement: "Slow sweeping crane down into the vibrant crowd",
        voicePrompt: { actorName: "Zain (Urdu/English Accent)", emotion: "astonished", speed: 1.05, pitch: 1.1 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "expressive", blinkRate: "normal" }
      }
    },
    {
      id: "scene-2",
      sceneNumber: 2,
      title: "Sher-e-Bangla Takes The Stage",
      durationSeconds: 13,
      settingDescription: "The grand wooden stage decorated with hand-woven carpets. A.K. Fazlul Huq steps forward holding the historic document.",
      backgroundTheme: "monument",
      backgroundImageUrl: "/stories/bg_minto_park_1940.jpg",
      character: {
        id: "char-fazlul-huq",
        name: "Maulvi A.K. Fazlul Huq",
        title: "Premier of Bengal (Sher-e-Bangla)",
        avatarUrl: "/stories/fazlul_huq.jpg",
        voiceGender: "male",
        voiceTone: "Deep, resonant, authoritative",
        visualDescription: "Stately Bengali statesman with silver mustache, traditional dark sherwani.",
        colorScheme: { primary: "#2563eb", secondary: "#1d4ed8", accent: "#fbbf24" }
      },
      characterAction: "Unrolling the historic resolution scroll and speaking boldly into the vintage microphone.",
      dialogueEnglish: "Sher-e-Bangla Maulvi A.K. Fazlul Huq, the Premier of Bengal, steps onto the grand rostrum and officially moves the historic resolution, declaring that no constitutional plan will be workable without sovereign Muslim states.",
      dialogueUrdu: "کوئی بھی آئینی منصوبہ اس ملک میں قابلِ عمل نہیں ہو گا جب تک کہ مسلم اکثریتی علاقوں کو خودمختار ریاستوں کی شکل نہ دی جائے!",
      historicalContextNote: "A.K. Fazlul Huq, the Premier of Bengal, officially moved the Lahore Resolution on March 23, 1940.",
      examKeyPoint: "Who moved it: Maulvi A.K. Fazlul Huq (Chief Minister of Bengal).",
      soundEffect: "Microphone resonance reverb, thunderous applause",
      backgroundMusicMood: "patriotic",
      productionPrompts: {
        imagePrompt: "3D animated character portrait of A.K. Fazlul Huq at microphone on wooden stage, ornate dark sherwani, Pixar character design",
        cameraMovement: "Dramatic medium close-up dolly forward",
        voicePrompt: { actorName: "Fazlul Huq (Authoritative Bengali Statesman)", emotion: "bold", speed: 0.95, pitch: 0.9 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "authoritative", blinkRate: "normal" }
      }
    },
    {
      id: "scene-3",
      sceneNumber: 3,
      title: "Quaid-e-Azam's Presidential Address",
      durationSeconds: 12,
      settingDescription: "Quaid-e-Azam Muhammad Ali Jinnah stands tall at the rostrum, commanding absolute silence from the 100,000 listeners.",
      backgroundTheme: "palace_interior",
      backgroundImageUrl: "/stories/bg_minto_park_1940.jpg",
      character: {
        id: "char-jinnah",
        name: "Quaid-e-Azam Muhammad Ali Jinnah",
        title: "President, All India Muslim League",
        avatarUrl: "/stories/quaid_jinnah.jpg",
        voiceGender: "male",
        voiceTone: "Crystal clear, dignified, articulate",
        visualDescription: "Iconic 3D animated portrait of Quaid-e-Azam with karakul cap, immaculate grey sherwani.",
        colorScheme: { primary: "#059669", secondary: "#065f46", accent: "#ffffff" }
      },
      characterAction: "Delivering his presidential address with calm, unshakeable conviction.",
      dialogueEnglish: "Quaid-e-Azam Muhammad Ali Jinnah presides over the historic session, articulating the Two-Nation Theory with unshakeable conviction, affirming that Hindus and Muslims belong to two distinct civilizations.",
      dialogueUrdu: "ہندو اور مسلمان دو مختلف مذہبی فلسفوں، سماجی رسم و رواج اور ادب سے تعلق رکھتے ہیں۔ وہ دراصل دو جداگانہ تہذیبوں کے علمبردار ہیں!",
      historicalContextNote: "In his presidential address, Quaid-e-Azam firmly grounded the demand for Pakistan in the Two-Nation Theory.",
      examKeyPoint: "Core argument: Muslims are not a minority; they are a distinct nation by every definition.",
      soundEffect: "Pin-drop silence followed by standing ovation",
      backgroundMusicMood: "inspirational",
      productionPrompts: {
        imagePrompt: "3D Disney Pixar animated portrait of Quaid-e-Azam Muhammad Ali Jinnah wearing black Karakul cap and grey sherwani, warm golden lighting",
        cameraMovement: "Slow orbital camera rotate around Quaid-e-Azam",
        voicePrompt: { actorName: "Quaid-e-Azam (Impeccable English Eloquence)", emotion: "dignified", speed: 0.92, pitch: 0.95 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "authoritative", blinkRate: "normal" }
      }
    },
    {
      id: "scene-4",
      sceneNumber: 4,
      title: "Passing the Resolution & Legacy",
      durationSeconds: 15,
      settingDescription: "March 24, 1940. Unanimous voting. The strategic map of North-Western and Eastern zones lights up.",
      backgroundTheme: "historical_night",
      backgroundImageUrl: "/stories/bg_minto_park_1940.jpg",
      character: {
        id: "char-ayla",
        name: "Ayla",
        title: "History & Exam Strategist",
        avatarUrl: "/stories/ayla_teen.jpg",
        voiceGender: "female",
        voiceTone: "Bright, insightful, energetic",
        visualDescription: "Animated 3D teen Pakistani girl in navy jacket with white scarf dupatta.",
        colorScheme: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#38bdf8" }
      },
      characterAction: "Highlighting the historical milestone and its fulfillment in 1947.",
      dialogueEnglish: "On March 24th, 1940, the resolution is unanimously passed by all delegates. The historic milestone set the foundation, and exactly seven years later in August 1947, Pakistan emerged as a sovereign reality.",
      dialogueUrdu: "اور یوں قراردادِ لاہور کی منظوری سے قیامِ پاکستان کی منزل طے ہو گئی۔ صرف سات سال بعد ۱۴ اگست ۱۹۴۷ء کو پاکستان دنیا کے نقشے پر ابھر آیا!",
      historicalContextNote: "The resolution became the definitive milestone and manifesto of the Pakistan Movement.",
      examKeyPoint: "Significance: Transformed the Muslim League into a mass liberation movement.",
      soundEffect: "Magical chime, triumphant orchestral crescendo",
      backgroundMusicMood: "celebratory",
      productionPrompts: {
        imagePrompt: "3D animated magical glowing historical map of Pakistan, Pixar fantasy style, sparkling particles",
        cameraMovement: "Zoom out to reveal map",
        voicePrompt: { actorName: "Ayla (Enthusiastic Teen Educator)", emotion: "joyful", speed: 1.05, pitch: 1.15 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "expressive", blinkRate: "normal" }
      }
    }
  ]
};

export const SAMPLE_EPISODE_ALIGARH_MOVEMENT: StoryEpisode = {
  id: "ep-aligarh-movement-sir-syed",
  title: "The Aligarh Renaissance: Sir Syed Ahmad Khan",
  urduTitle: "علی گڑھ تحریک: سر سید احمد خان",
  chapterNumber: 2,
  chapterName: "Early Struggle & Educational Awakenings (1857-1906)",
  subject: "Pakistan Studies",
  targetGrade: "Grade 9 & 10 (Matric & O-Level)",
  sloIds: ["SLO-PAK-02-01", "SLO-PAK-02-02"],
  sloSummary: "Evaluate Sir Syed Ahmad Khan's educational, political, and social services and the foundation of MAO College.",
  totalDurationSeconds: 140,
  synopsis: "Witness the aftermath of the 1857 War of Independence. Discover how Sir Syed Ahmad Khan fought against despair, established the Scientific Society, founded MAO College Aligarh, and laid the intellectual foundation of modern Muslim education.",
  keyHistoricalDates: [
    { date: "1859 & 1862", event: "Establishment of Muradabad and Ghazipur Schools" },
    { date: "1864", event: "Foundation of the Scientific Society at Ghazipur" },
    { date: "1875 & 1877", event: "Founding of MAO High School, upgraded to MAO College Aligarh" },
    { date: "1886", event: "Establishment of Muhammadan Anglo-Oriental Educational Conference" }
  ],
  examQuestionsCovered: [
    { marks: 4, question: "Why did Sir Syed Ahmad Khan emphasize modern Western education?", sloCode: "SLO-PAK-02-01" },
    { marks: 7, question: "Describe the educational and literary contributions of Sir Syed Ahmad Khan.", sloCode: "SLO-PAK-02-02" }
  ],
  scenes: [
    {
      id: "aligarh-1",
      sceneNumber: 1,
      title: "Despair After 1857",
      durationSeconds: 30,
      settingDescription: "Delhi 1858 in the smoky ruins after the War of Independence. Sir Syed walks through the abandoned streets, heartbroken but resolved.",
      backgroundTheme: "historical_night",
      backgroundImageUrl: "/stories/bg_mao_college.jpg",
      character: {
        id: "char-sir-syed",
        name: "Sir Syed Ahmad Khan",
        title: "Visionary Reformer & Educator",
        avatarUrl: "/stories/sir_syed.jpg",
        voiceGender: "male",
        voiceTone: "Wise, compassionate, visionary",
        visualDescription: "Distinguished 3D Pixar animated scholar with flowing white beard, red fez cap, spectacles.",
        colorScheme: { primary: "#dc2626", secondary: "#991b1b", accent: "#fbbf24" }
      },
      characterAction: "Writing by candlelight in his study, clutching his pen like a sword of enlightenment.",
      dialogueEnglish: "Ignorance is our greatest enemy. If the Muslims do not acquire modern science and English education, we will be left behind in poverty forever!",
      dialogueUrdu: "جہالت ہمارا سب سے بڑا دشمن ہے۔ اگر مسلمانوں نے جدید سائنس اور عصری تعلیم حاصل نہ کی تو وہ ہمیشہ کے لیے پسماندگی کی دلدل میں پھنس جائیں گے!",
      historicalContextNote: "After 1857, British authorities blamed Muslims, while Muslims resisted learning English.",
      examKeyPoint: "Causes of Aligarh Movement: Overcome British mistrust and bridge the educational gap.",
      soundEffect: "Quill scratching on parchment, crackling fire",
      backgroundMusicMood: "thoughtful",
      productionPrompts: {
        imagePrompt: "Pixar 3D animated scene, vintage study room with leather books, Sir Syed Ahmad Khan in red Fez cap writing by candlelight",
        cameraMovement: "Slow push-in on Sir Syed's eyes",
        voicePrompt: { actorName: "Sir Syed (Wise Urdu Scholar)", emotion: "thoughtful", speed: 0.9, pitch: 0.88 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "subtle", blinkRate: "normal" }
      }
    },
    {
      id: "aligarh-2",
      sceneNumber: 2,
      title: "Founding the Scientific Society (1864)",
      durationSeconds: 32,
      settingDescription: "Ghazipur printing press. Cast-iron presses translating Western scientific treatises into Urdu.",
      backgroundTheme: "classroom",
      backgroundImageUrl: "/stories/bg_mao_college.jpg",
      character: {
        id: "char-zain",
        name: "Zain (Student Time-Traveler)",
        title: "Curious High School Explorer",
        avatarUrl: "/stories/zain_teen.jpg",
        voiceGender: "male",
        voiceTone: "Excited, eager",
        visualDescription: "Animated 3D Pixar teen in modern green hoodie.",
        colorScheme: { primary: "#10b981", secondary: "#047857", accent: "#f59e0b" }
      },
      characterAction: "Holding up a freshly printed Urdu translation of scientific books.",
      dialogueEnglish: "Look! In 1864, Sir Syed founded the Scientific Society to translate cutting-edge scientific books from English into Urdu so everyone could learn!",
      dialogueUrdu: "دیکھو! ۱۸۶۴ء میں سر سید نے سائنٹیفک سوسائٹی قائم کی تاکہ انگریزی کتب کے تراجم اردو میں کر کے علم عام کیا جا سکے!",
      historicalContextNote: "The Scientific Society translated works of mechanics, agriculture, history, and physics.",
      examKeyPoint: "Scientific Society founded at Ghazipur (1864), later moved to Aligarh.",
      soundEffect: "Rhythmic mechanical printing press thuds",
      backgroundMusicMood: "inspirational",
      checkpoint: {
        id: "chk-aligarh-1",
        sloId: "SLO-PAK-02-01",
        sloText: "State the primary objective of the Scientific Society founded by Sir Syed Ahmad Khan.",
        sceneIndex: 2,
        question: "What was the primary purpose of the Scientific Society established in 1864?",
        options: [
          "To train soldiers for civil defense",
          "To translate standard Western scientific and historical works into Urdu",
          "To collect political donations from the British Crown",
          "To establish medical dispensaries across Northern India"
        ],
        correctIndex: 1,
        explanation: "The Scientific Society (1864) was formed to translate valuable scientific works into Urdu.",
        boardExamMarks: 3,
        boardExamTip: "Board Exam Keyword: 'Scientific translation into Urdu' + 'Ghazipur 1864'."
      },
      productionPrompts: {
        imagePrompt: "3D animated printing press workshop in Ghazipur 1864, cast iron machines rolling out Urdu pages",
        cameraMovement: "Tracking shot following printed paper",
        voicePrompt: { actorName: "Zain (Urdu/English Accent)", emotion: "excited", speed: 1.05, pitch: 1.1 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "expressive", blinkRate: "normal" }
      }
    },
    {
      id: "aligarh-3",
      sceneNumber: 3,
      title: "MAO College: The Cradle of Leadership",
      durationSeconds: 38,
      settingDescription: "The grand red-brick Gothic-Mughal arches of MAO College Aligarh (1877). Students in pristine black sherwanis debating on lush manicured lawns.",
      backgroundTheme: "monument",
      backgroundImageUrl: "/stories/bg_mao_college.jpg",
      character: {
        id: "char-sir-syed",
        name: "Sir Syed Ahmad Khan",
        title: "Visionary Reformer & Educator",
        avatarUrl: "/stories/sir_syed.jpg",
        voiceGender: "male",
        voiceTone: "Proud, visionary, inspiring",
        visualDescription: "Sir Syed standing at the foundation stone of MAO College.",
        colorScheme: { primary: "#dc2626", secondary: "#991b1b", accent: "#fbbf24" }
      },
      characterAction: "Pointing proudly to the college building as students walk by with books.",
      dialogueEnglish: "From this college will issue forth men who will preach the gospel of free inquiry, large-hearted toleration, and pure morality across all of India!",
      dialogueUrdu: "اس کالج سے ایسے روشن خیال نوجوان نکلیں گے جو پورے ہندوستان میں آزاد تحقیق، رواداری اور اعلیٰ اخلاق کا پرچم بلند کریں گے!",
      historicalContextNote: "MAO College was founded in 1877 and became Aligarh Muslim University in 1920.",
      examKeyPoint: "MAO College produced future leaders of the Pakistan Movement including Liaquat Ali Khan.",
      soundEffect: "College bell tolling, student chatter",
      backgroundMusicMood: "patriotic",
      productionPrompts: {
        imagePrompt: "Stunning 3D Pixar animated wide shot of MAO College Aligarh, red brick arches, students walking",
        cameraMovement: "Low angle tilt up from manicured lawn",
        voicePrompt: { actorName: "Sir Syed (Wise Urdu Scholar)", emotion: "inspiring", speed: 0.95, pitch: 0.88 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "authoritative", blinkRate: "normal" }
      }
    }
  ]
};

export const SAMPLE_EPISODE_14_POINTS: StoryEpisode = {
  id: "ep-14-points-jinnah-1929",
  title: "Constitutional Shield: Quaid-e-Azam's 14 Points 1929",
  urduTitle: "آئینی ڈھال: قائد اعظم کے ۱۴ نکات ۱۹۲۹ء",
  chapterNumber: 3,
  chapterName: "Political Awakening & Constitutional Safeguards (1906-1939)",
  subject: "Pakistan Studies",
  targetGrade: "Grade 9 & 10 (Matric & O-Level)",
  sloIds: ["SLO-PAK-03-03"],
  sloSummary: "Analyze Quaid-e-Azam Muhammad Ali Jinnah's 14 Points as the constitutional safeguard for Muslims in response to the Nehru Report.",
  totalDurationSeconds: 135,
  synopsis: "In March 1929 at the Delhi Muslim League session, Quaid-e-Azam delivered his legendary 14 Points, firmly establishing the irreducible minimum constitutional demands of Indian Muslims.",
  keyHistoricalDates: [
    { date: "August 1928", event: "Publication of the Nehru Report ignoring Muslim rights" },
    { date: "March 1929", event: "Quaid-e-Azam presents 14 Points at Delhi Session" }
  ],
  examQuestionsCovered: [
    { marks: 4, question: "Why did Quaid-e-Azam formulate his 14 Points in 1929?", sloCode: "SLO-PAK-03-03" },
    { marks: 7, question: "Explain five key constitutional clauses from Jinnah's 14 Points.", sloCode: "SLO-PAK-03-03" }
  ],
  scenes: [
    {
      id: "points-1",
      sceneNumber: 1,
      title: "The Challenge of the Nehru Report",
      durationSeconds: 32,
      settingDescription: "Delhi, March 1929. Quaid-e-Azam reviewing the Hindu-dominated Nehru Report in his study with intense focus.",
      backgroundTheme: "historical_day",
      backgroundImageUrl: "/stories/bg_minto_park_1940.jpg",
      character: {
        id: "char-jinnah",
        name: "Quaid-e-Azam Muhammad Ali Jinnah",
        title: "President of All India Muslim League",
        avatarUrl: "/stories/quaid_jinnah.jpg",
        voiceGender: "male",
        voiceTone: "Articulate, sharp, resolute",
        visualDescription: "Immculate 3D Pixar Quaid-e-Azam with karakul cap and grey sherwani.",
        colorScheme: { primary: "#059669", secondary: "#065f46", accent: "#ffffff" }
      },
      characterAction: "Setting down the Nehru Report calmly and picking up his fountain pen.",
      dialogueEnglish: "The Nehru Report seeks to establish Hindu majority rule over all minorities. This is our parting of the ways!",
      dialogueUrdu: "نہرو رپورٹ دراصل ہندو اکثریت کو مسلمانوں پر مسلط کرنے کی کوشش ہے۔ یہ ہمارے اور کانگریس کے راستوں کی مستقل جدائی ہے!",
      historicalContextNote: "Motilal Nehru's 1928 Report rejected separate electorates and Muslim majority in Punjab and Bengal.",
      examKeyPoint: "Nehru Report 1928 triggered the formulation of Jinnah's 14 Points 1929.",
      soundEffect: "Gavel strike, ticking clock, pen scribbling on parchment",
      backgroundMusicMood: "tense",
      productionPrompts: {
        imagePrompt: "3D Pixar animated rendering of Quaid-e-Azam Jinnah at a polished mahogany desk in Delhi 1929",
        cameraMovement: "Slow dolly forward on Jinnah",
        voicePrompt: { actorName: "Quaid-e-Azam", emotion: "firm", speed: 0.95, pitch: 0.95 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "authoritative", blinkRate: "normal" }
      }
    },
    {
      id: "points-2",
      sceneNumber: 2,
      title: "The 14 Points Proclamation",
      durationSeconds: 38,
      settingDescription: "Delhi Assembly Hall. Delegates listening in rapt attention as Jinnah outlines the 14 Points.",
      backgroundTheme: "monument",
      backgroundImageUrl: "/stories/bg_minto_park_1940.jpg",
      character: {
        id: "char-jinnah",
        name: "Quaid-e-Azam Muhammad Ali Jinnah",
        title: "President of All India Muslim League",
        avatarUrl: "/stories/quaid_jinnah.jpg",
        voiceGender: "male",
        voiceTone: "Authoritative, dignified",
        visualDescription: "Quaid-e-Azam standing at the podium holding the 14 Points document.",
        colorScheme: { primary: "#059669", secondary: "#065f46", accent: "#ffffff" }
      },
      characterAction: "Enumerating the core constitutional safeguards.",
      dialogueEnglish: "We demand a federal constitution with residuary powers to the provinces, separate electorates, and one-third representation at the center!",
      dialogueUrdu: "ہمارا مطالبہ ہے کہ آئین وفاقی نوعیت کا ہو، صوبوں کو مکمل خود مختاری حاصل ہو اور مرکز میں مسلمانوں کو ایک تہائی نمائندگی دی جائے!",
      historicalContextNote: "Key points: Provincial autonomy, 1/3 central representation, separation of Sindh from Bombay, reforms in NWFP & Balochistan.",
      examKeyPoint: "Core clauses: Federal structure, separate electorates, 1/3 seats at center, Sindh separation.",
      soundEffect: "Enthusiastic applause across the assembly hall",
      backgroundMusicMood: "inspirational",
      checkpoint: {
        id: "chk-14-1",
        sloId: "SLO-PAK-03-03",
        sloText: "Identify key constitutional demands in Quaid-e-Azam's 14 Points.",
        sceneIndex: 2,
        question: "What percentage of representation did Jinnah demand for Muslims in the Central Legislature in his 14 Points?",
        options: ["One-half (50%)", "One-third (33.3%)", "One-fourth (25%)", "Proportional to population only"],
        correctIndex: 1,
        explanation: "Point #3 of Jinnah's 14 Points explicitly demanded that Muslim representation in the Central Legislature shall not be less than one-third.",
        boardExamMarks: 3,
        boardExamTip: "Essential Board Keyword: 'One-third Muslim representation at the Center'."
      },
      productionPrompts: {
        imagePrompt: "3D Disney Pixar animated scene of Jinnah addressing Delhi Assembly with glowing parchment of 14 points",
        cameraMovement: "Medium shot tracking Jinnah's gestures",
        voicePrompt: { actorName: "Quaid-e-Azam", emotion: "dignified", speed: 0.95, pitch: 0.95 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "authoritative", blinkRate: "normal" }
      }
    },
    {
      id: "points-3",
      sceneNumber: 3,
      title: "The Legacy of the 14 Points",
      durationSeconds: 30,
      settingDescription: "Modern interactive classroom. Zain and Ayla summarizing the impact on future constitutions.",
      backgroundTheme: "classroom",
      backgroundImageUrl: "/stories/bg_mao_college.jpg",
      character: {
        id: "char-ayla",
        name: "Ayla (Student Time-Traveler)",
        title: "History & Board Exam Strategist",
        avatarUrl: "/stories/ayla_teen.jpg",
        voiceGender: "female",
        voiceTone: "Bright, articulate",
        visualDescription: "3D Pixar animated Pakistani teenage girl in navy blazer.",
        colorScheme: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#38bdf8" }
      },
      characterAction: "Highlighting board exam summary flashcard on digital screen.",
      dialogueEnglish: "Jinnah's 14 Points became the united constitutional charter for all Muslims and later shaped the Government of India Act 1935!",
      dialogueUrdu: "قائد اعظم کے ۱۴ نکات نے تمام مسلمانوں کو ایک متفقہ آئینی منشور فراہم کیا جس نے آگے چل کر ۱۹۳۵ء کے ایکٹ کو بھی متاثر کیا!",
      historicalContextNote: "The 14 Points united fragmented Muslim factions under Jinnah's leadership.",
      examKeyPoint: "Outcome: Provided a unified constitutional charter for Indian Muslims.",
      soundEffect: "Sparkling digital chime, applause",
      backgroundMusicMood: "patriotic",
      productionPrompts: {
        imagePrompt: "3D Pixar animated student Ayla holding a glowing digital board exam recap screen",
        cameraMovement: "Slow zoom out to reveal classroom",
        voicePrompt: { actorName: "Ayla", emotion: "enthusiastic", speed: 1.05, pitch: 1.15 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "expressive", blinkRate: "normal" }
      }
    }
  ]
};

export const SAMPLE_EPISODE_WAR_OF_INDEPENDENCE: StoryEpisode = {
  id: "ep-war-of-independence-1857",
  title: "The Crucible of 1857: The War of Independence",
  urduTitle: "۱۸۵۷ء کی آزمائش: جنگِ آزادی",
  chapterNumber: 1,
  chapterName: "Subcontinent Before Pakistan (1857-1906)",
  subject: "Pakistan Studies",
  targetGrade: "Grade 9 & 10 (Matric & O-Level)",
  sloIds: ["SLO-PAK-01-04"],
  sloSummary: "Analyze the political, religious, economic, and military causes and outcomes of the 1857 War of Independence.",
  totalDurationSeconds: 145,
  synopsis: "Travel back to May 1857. Uncover the deep-seated causes of the great uprising against the British East India Company, the defense of Delhi, and the aftermath that changed South Asian history forever.",
  keyHistoricalDates: [
    { date: "May 10, 1857", event: "Uprising begins at Meerut Cantonment" },
    { date: "September 1857", event: "Fall of Delhi and capture of Bahadur Shah Zafar" },
    { date: "November 1858", event: "Queen Victoria's Proclamation; British Crown takes direct control" }
  ],
  examQuestionsCovered: [
    { marks: 4, question: "Explain the religious and military causes of the 1857 War.", sloCode: "SLO-PAK-01-04" },
    { marks: 7, question: "Why did the War of Independence in 1857 fail? Give three reasons.", sloCode: "SLO-PAK-01-04" }
  ],
  scenes: [
    {
      id: "war-1",
      sceneNumber: 1,
      title: "The Spark at Meerut",
      durationSeconds: 34,
      settingDescription: "Meerut cantonment, May 1857. Sepoys gathered in outrage over greased cartridges and unjust annexations.",
      backgroundTheme: "historical_day",
      backgroundImageUrl: "/stories/bg_minto_park_1940.jpg",
      character: {
        id: "char-zain",
        name: "Zain (Student Time-Traveler)",
        title: "Curious High School Explorer",
        avatarUrl: "/stories/zain_teen.jpg",
        voiceGender: "male",
        voiceTone: "Urgent, dramatic",
        visualDescription: "3D Pixar animated Pakistani teen in green hoodie.",
        colorScheme: { primary: "#10b981", secondary: "#047857", accent: "#f59e0b" }
      },
      characterAction: "Witnessing the historic march of sepoys towards the Red Fort in Delhi.",
      dialogueEnglish: "The injustice of the East India Company, the Doctrine of Lapse, and greased cartridges caused the resentment to boil over into full revolution!",
      dialogueUrdu: "ایسٹ انڈیا کمپنی کی ظالمانہ پالیسیوں، ڈاکٹرائن آف لیپس اور مذہبی مداخلت نے صدیوں کے غصے کو انقلاب میں تبدیل کر دیا!",
      historicalContextNote: "Lord Dalhousie's Doctrine of Lapse annexed states like Oudh, Jhansi, and Nagpur.",
      examKeyPoint: "Causes: Doctrine of Lapse, economic exploitation, greased cartridges, cultural insensitivity.",
      soundEffect: "Galloping horses, marching drums, distant cannon fire",
      backgroundMusicMood: "tense",
      productionPrompts: {
        imagePrompt: "3D animated scene of sepoys in traditional uniform marching towards Delhi, cinematic lighting",
        cameraMovement: "Panoramic tracking shot",
        voicePrompt: { actorName: "Zain", emotion: "urgent", speed: 1.05, pitch: 1.1 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "expressive", blinkRate: "normal" }
      }
    },
    {
      id: "war-2",
      sceneNumber: 2,
      title: "Why The Uprising Failed",
      durationSeconds: 38,
      settingDescription: "Historical battlefield map showing lack of central coordination among Indian leaders.",
      backgroundTheme: "historical_night",
      backgroundImageUrl: "/stories/bg_mao_college.jpg",
      character: {
        id: "char-ayla",
        name: "Ayla (Student Time-Traveler)",
        title: "History & Board Exam Strategist",
        avatarUrl: "/stories/ayla_teen.jpg",
        voiceGender: "female",
        voiceTone: "Insightful, analytical",
        visualDescription: "3D Pixar animated Pakistani teen in navy blazer.",
        colorScheme: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#38bdf8" }
      },
      characterAction: "Analyzing the military imbalances on the tactical map.",
      dialogueEnglish: "Despite immense bravery, the movement lacked unified leadership, modern weaponry, and central communication, leading to its defeat.",
      dialogueUrdu: "بے پناہ بہادری کے باوجود، کسی متفقہ قیادت، جدید اسلحہ اور باہمی رابطے کے فقدان کی وجہ سے یہ جدوجہد ناکام ہو گئی!",
      historicalContextNote: "Lack of unity between different regions allowed the British to concentrate forces.",
      examKeyPoint: "Reasons for failure: Lack of central command, superior British technology, regional divisions.",
      soundEffect: "Fading battle sounds, solemn cello cadence",
      backgroundMusicMood: "thoughtful",
      checkpoint: {
        id: "chk-war-1",
        sloId: "SLO-PAK-01-04",
        sloText: "Evaluate reasons for the failure of the 1857 War of Independence.",
        sceneIndex: 2,
        question: "Which of the following was a primary reason for the failure of the 1857 War of Independence?",
        options: [
          "Lack of unified central leadership and coordination among rebel forces",
          "Complete lack of public support across India",
          "Immediate intervention by European allied armies",
          "Surrender of all weapons without fighting"
        ],
        correctIndex: 0,
        explanation: "The absence of a common leader, divergent regional goals, and modern British communication lines caused the rebellion to be isolated and defeated piecemeal.",
        boardExamMarks: 4,
        boardExamTip: "Always mention: 'Lack of unified leadership' + 'Superior British discipline & telegraph communication'."
      },
      productionPrompts: {
        imagePrompt: "3D animated strategic map of 1857 Subcontinent with illuminated troop movements",
        cameraMovement: "Dolly in on northern territories",
        voicePrompt: { actorName: "Ayla", emotion: "analytical", speed: 1.0, pitch: 1.1 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "expressive", blinkRate: "normal" }
      }
    },
    {
      id: "war-3",
      sceneNumber: 3,
      title: "The Dawn of Modern Muslim Awakening",
      durationSeconds: 34,
      settingDescription: "Delhi 1858. Sir Syed Ahmad Khan emerging with his pen to write 'Causes of the Indian Revolt'.",
      backgroundTheme: "monument",
      backgroundImageUrl: "/stories/bg_mao_college.jpg",
      character: {
        id: "char-sir-syed",
        name: "Sir Syed Ahmad Khan",
        title: "Visionary Reformer & Educator",
        avatarUrl: "/stories/sir_syed.jpg",
        voiceGender: "male",
        voiceTone: "Wise, resolute",
        visualDescription: "3D Pixar animated Sir Syed Ahmad Khan with red Fez cap and spectacles.",
        colorScheme: { primary: "#dc2626", secondary: "#991b1b", accent: "#fbbf24" }
      },
      characterAction: "Presenting his historic treatise 'Asbab-e-Baghawat-e-Hind' to clear Muslim names.",
      dialogueEnglish: "From the ashes of 1857, we must rise through education, modern science, and political wisdom to secure our future!",
      dialogueUrdu: "۱۸۵۷ء کی راکھ سے اب ہمیں جدید تعلیم، سائنسی علوم اور فہم و فراست کے ذریعے اپنی نئی منزل کا تعین کرنا ہو گا!",
      historicalContextNote: "Sir Syed's pamphlet 'Asbab-e-Baghawat-e-Hind' frankly listed British policy errors.",
      examKeyPoint: "Immediate outcome: End of Mughal rule, Company rule replaced by British Crown, Sir Syed's emergence.",
      soundEffect: "Inspirational orchestral crescendo",
      backgroundMusicMood: "inspirational",
      productionPrompts: {
        imagePrompt: "3D Pixar animated Sir Syed standing in front of MAO College holding his historic book",
        cameraMovement: "Crane up into clear blue sky",
        voicePrompt: { actorName: "Sir Syed", emotion: "visionary", speed: 0.95, pitch: 0.88 },
        lipsyncParams: { engine: "hedra-character-1", headMovement: "authoritative", blinkRate: "normal" }
      }
    }
  ]
};

export const ALL_SAMPLE_EPISODES: StoryEpisode[] = [
  SAMPLE_EPISODE_LAHORE_RESOLUTION,
  SAMPLE_EPISODE_ALIGARH_MOVEMENT,
  SAMPLE_EPISODE_14_POINTS,
  SAMPLE_EPISODE_WAR_OF_INDEPENDENCE
];

// ==========================================
// GEMINI AI DYNAMIC SCREENPLAY GENERATOR
// ==========================================

export async function generateStoryEpisodeFromAI(
  request: GenerateStoryRequest
): Promise<StoryEpisode> {
  const models = getGeminiModelsToTry();
  const sceneCount = request.sceneCount || 4;

  const prompt = `You are a world-class educational screenwriter and animation director specializing in Pakistan Studies (History & Geography for FBISE / Sindh Board / Punjab Board / AKUEB / Cambridge O-Level 2059).

Transform the following Pakistan Studies topic / Student Learning Outcome (SLO) into a thrilling, serialized 3D Pixar-style animated cartoon story episode:

TARGET TOPIC / SLO:
${request.topicOrSlo}

CHAPTER / SUBJECT:
${request.chapterName || "Pakistan Studies Curriculum"}
Target Grade: ${request.grade || "Grade 9 & 10 (Matric & O-Level)"}
Desired Scenes: ${sceneCount}

CREATIVE GUIDELINES:
1. Story Concept: Feature engaging recurring characters (e.g., student time-travelers Zain & Ayla, or historically accurate animated versions of Quaid-e-Azam, Sir Syed, Iqbal, Fatima Jinnah, etc.).
2. High-Octane Dialogues: Write dialogue in BOTH English AND authentic Urdu Nastaliq script for every scene.
3. SLO Alignment: Every scene must teach a specific concept from the board exam syllabus, avoiding generic fluff.
4. Visual Diffusion Prompts: Write ready-to-render image prompts in "Pixar 3D animated feature film style, 4k cinematic render" with specific wardrobe, lighting, and camera movement directives.
5. Interactive SLO Checkpoints: Include at least 2 interactive mid-scene multiple-choice questions with board exam marks (3-mark / 4-mark / 7-mark) and marking tips.

RETURN ONLY VALID JSON (no markdown fences, no extra text) matching this EXACT schema:
{
  "id": "ep-generated-id",
  "title": "Engaging Episode Title in English",
  "urduTitle": "اردو عنوان",
  "chapterNumber": 1,
  "chapterName": "Chapter Name",
  "subject": "Pakistan Studies",
  "targetGrade": "Grade 9 & 10",
  "sloIds": ["SLO-PAK-XX-01"],
  "sloSummary": "1-2 sentence summary of what SLO is covered",
  "totalDurationSeconds": 140,
  "synopsis": "Engaging summary of the animated episode",
  "keyHistoricalDates": [
    { "date": "Historical Date", "event": "Significant Event" }
  ],
  "examQuestionsCovered": [
    { "marks": 4, "question": "Actual Board Exam Question", "sloCode": "SLO-PAK-XX-01" }
  ],
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "title": "Scene Title",
      "durationSeconds": 30,
      "settingDescription": "Detailed visual setting",
      "backgroundTheme": "historical_day",
      "backgroundImageUrl": "/stories/bg_minto_park_1940.jpg",
      "character": {
        "id": "char-id",
        "name": "Character Name",
        "title": "Role/Title",
        "avatarUrl": "/stories/quaid_jinnah.jpg",
        "voiceGender": "male",
        "voiceTone": "Tone description",
        "visualDescription": "3D Pixar appearance description",
        "colorScheme": {
          "primary": "#10b981",
          "secondary": "#047857",
          "accent": "#f59e0b"
        }
      },
      "characterAction": "What the character is physically doing",
      "dialogueEnglish": "Dialogue line in English",
      "dialogueUrdu": "اردو مکالمہ",
      "historicalContextNote": "Contextual history note",
      "examKeyPoint": "High yield exam key point",
      "soundEffect": "Sound design description",
      "backgroundMusicMood": "inspirational",
      "checkpoint": {
        "id": "chk-1",
        "sloId": "SLO-PAK-XX-01",
        "sloText": "SLO text",
        "sceneIndex": 1,
        "question": "Multiple choice question testing this scene",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Why this answer is correct",
        "boardExamMarks": 3,
        "boardExamTip": "Tip for scoring full marks in board exams"
      },
      "productionPrompts": {
        "imagePrompt": "Detailed Midjourney/Flux image prompt for this scene in 3D Pixar animation style",
        "negativePrompt": "blurry, low quality, deformed, photographic",
        "cameraMovement": "Camera motion directive",
        "voicePrompt": {
          "actorName": "Voice Profile Name",
          "emotion": "confident",
          "speed": 1.0,
          "pitch": 1.0
        },
        "lipsyncParams": {
          "engine": "hedra-character-1",
          "headMovement": "expressive",
          "blinkRate": "normal"
        }
      }
    }
  ]
}`;

  let lastError: unknown;

  for (const modelName of models) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
        },
      });

      let responseText = result.response.text().trim();
      if (responseText.startsWith("```json")) {
        responseText = responseText.replace(/^```json\s*/, "").replace(/```\s*$/, "");
      } else if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```\s*/, "").replace(/```\s*$/, "");
      }
      const sanitized = sanitizeJsonEscapes(responseText);
      const parsed = JSON.parse(sanitized) as StoryEpisode;

      if (parsed && parsed.scenes && parsed.scenes.length > 0) {
        if (!parsed.id) {
          parsed.id = `ep-${Date.now()}`;
        }
        // Run auto-resolver on each scene
        parsed.scenes = parsed.scenes.map((s) => resolveSceneAssets(s));
        return parsed;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Gemini generation failed on model ${modelName}, trying fallback model...`, err);
    }
  }

  console.error("All Gemini models failed for story generator, falling back to sample episode", lastError);
  return SAMPLE_EPISODE_LAHORE_RESOLUTION;
}
