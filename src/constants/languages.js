export const ALL_LANGUAGES = [
  { code: "af", name: "Afrikaans" },
  { code: "ar", name: "Arabic", rtl: true },
  { code: "zh", name: "Chinese" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fa", name: "Persian", rtl: true },
  { code: "hi", name: "Hindi" },
  { code: "id", name: "Indonesian" },
  { code: "kk", name: "Kazakh" },
  { code: "ms", name: "Malay" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "sw", name: "Swahili" },
  { code: "th", name: "Thai" },
  { code: "uz", name: "Uzbek" },
  { code: "vi", name: "Vietnamese" },
];

export const RTL_LANG_CODES = ["ar", "fa"];

export const getLangObj = (code) => {
  if (code === "auto") return { code: "auto", name: "Auto Detect" };
  return ALL_LANGUAGES.find((l) => l.code === code) || { code, name: code };
};
