export const ALL_LANGUAGES = [
  { code: "auto", name: "Auto Detect", flag: "🌐" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", rtl: true },
  { code: "bn", name: "Bengali", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", flag: "🇵🇰", rtl: true },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "fa", name: "Persian", flag: "🇮🇷", rtl: true },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
];

export const RTL_LANG_CODES = ["ar", "ur", "fa"];

export const getLangObj = (code) =>
  ALL_LANGUAGES.find((l) => l.code === code) || { code, name: code, flag: "🌐" };
