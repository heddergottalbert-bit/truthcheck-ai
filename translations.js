// TruthCheck AI — Translations
// To add a language: copy the "en" block, change the key, translate all values.

const TRANSLATIONS = {

  nl: {
    // Popup
    factCheck: "Feitencheck",
    score: "Score",
    close: "Sluiten",
    askQuestion: "Stel een vraag",
    questionPlaceholder: "Wat wil je weten over deze inhoud?",
    noSources: "Geen onafhankelijke bronnen gevonden",
    readMore: "📚 Lees meer",
    verificationSources: "🔍 Verificatiebronnen",
    whyWrong: "❌ Waarom dit onjuist is",

    // Harmful content
    harmfulTitle: "😈 Schadelijke content in reacties",
    harmfulBody: "Haatzaaiende of discriminerende content gevonden in de reacties.",

    // Deepfake
    deepfakeTitle: "🤖 Mogelijk AI-gegenereerde afbeelding",
    deepfakeLabel: (pct) => `🤖 Mogelijk AI-gegenereerde afbeelding (${pct}%)`,

    // Manipulation
    manipulationTitle: "⚠️ Manipulatietechnieken gedetecteerd",

    // Phishing
    phishingSuspiciousEmail: "Verdachte e-mail gedetecteerd",
    phishingDangerousPage: "Mogelijk gevaarlijke pagina",
    phishingWarning: "Phishingwaarschuwing",
    phishingSignals: "Gedetecteerde signalen",
    phishingOfficialSite: "Ga naar officiële site",
    phishingClose: "✕ Sluiten",

    // Settings
    settingsTitle: "Instellingen",
    settingsTransparency: "Transparantie",
    settingsBackground: "Achtergrondkleur",
    settingsTextColor: "Tekstkleur",
    settingsFont: "Lettertype",
    settingsClose: "Sluiten",

    // Colors
    colorDark: "Donker",
    colorBlack: "Zwart",
    colorNight: "Nacht",
    colorGreen: "Groen",
    colorRed: "Rood",
    colorLight: "Licht",
    colorWhite: "Wit",

    // Text colors
    textWhite: "Wit",
    textBlack: "Zwart",
    textGold: "Goud",
    textLightGreen: "Lichtgroen",
    textLightBlue: "Lichtblauw",

    // Loading
    loading: "Laden...",
  },

  en: {
    // Popup
    factCheck: "Fact Check",
    score: "Score",
    close: "Close",
    askQuestion: "Ask a question",
    questionPlaceholder: "What do you want to know about this content?",
    noSources: "No independent sources found",
    readMore: "📚 Read more",
    verificationSources: "🔍 Verification sources",
    whyWrong: "❌ Why this is wrong",

    // Harmful content
    harmfulTitle: "😈 Harmful content in comments",
    harmfulBody: "Hateful or discriminatory content was found in the comments of this article.",

    // Deepfake
    deepfakeTitle: "🤖 Possibly AI-generated image",
    deepfakeLabel: (pct) => `🤖 Possibly AI-generated image (${pct}%)`,

    // Manipulation
    manipulationTitle: "⚠️ Manipulation techniques detected",

    // Phishing
    phishingSuspiciousEmail: "Suspicious email detected",
    phishingDangerousPage: "Potentially dangerous page",
    phishingWarning: "Phishing warning",
    phishingSignals: "Detected signals",
    phishingOfficialSite: "Go to official site",
    phishingClose: "✕ Close",

    // Settings
    settingsTitle: "Settings",
    settingsTransparency: "Transparency",
    settingsBackground: "Background color",
    settingsTextColor: "Text color",
    settingsFont: "Font",
    settingsClose: "Close",

    // Colors
    colorDark: "Dark",
    colorBlack: "Black",
    colorNight: "Night",
    colorGreen: "Green",
    colorRed: "Red",
    colorLight: "Light",
    colorWhite: "White",

    // Text colors
    textWhite: "White",
    textBlack: "Black",
    textGold: "Gold",
    textLightGreen: "Light green",
    textLightBlue: "Light blue",

    // Loading
    loading: "Loading...",
  },

  // ── Taal toevoegen? Kopieer het "en" blok hierboven en vertaal. ──
  // de: { factCheck: "Faktencheck", ... },
  // fr: { factCheck: "Vérification des faits", ... },
  // es: { factCheck: "Verificación de hechos", ... },

};

// Detecteer browsertaal automatisch
function getTaal() {
  const lang = (navigator.language || navigator.userLanguage || "en").substring(0, 2).toLowerCase();
  return TRANSLATIONS[lang] || TRANSLATIONS["en"];
}

const t = getTaal();
