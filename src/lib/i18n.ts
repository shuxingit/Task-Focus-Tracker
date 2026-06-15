import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 1. 导入翻译文件
import en from "@/locales/en/translation.json";
import de from "@/locales/de/translation.json";
import zh from "@/locales/zh/translation.json"; // 新增这一行

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    zh: { translation: zh }, // 2. 把中文加入资源列表
  },
  lng: "zh", // 默认语言改为中文
  fallbackLng: "zh", // 如果找不到语言，默认用中文
  interpolation: { escapeValue: false },
});

export default i18n;