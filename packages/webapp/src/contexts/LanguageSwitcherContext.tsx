import React, { useState, useEffect } from "react";
import { i18n } from "@lingui/core";
import { messages as catalogEn } from "../locales/en/messages.js";
import { messages as catalogRu } from "../locales/ru/messages.js";
import { I18nProvider } from "@lingui/react";

export type LanguageSwitcherContext = {
  availableLanguages: string[];
  selectedLanguage: string;
  setActiveLanguage(newLanguage: string): void | Promise<void>;
};

type LanguageSwitcherProvider = {
  children: React.ReactNode | React.ReactNode[];
};

const LanguageSwitcherContext = React.createContext<LanguageSwitcherContext | undefined>(
  undefined
);

const getLocales = (): string[] => {
  // @ts-ignore
  const { languages, language, userLanguage } = window.navigator;

  if (Array.isArray(languages)) {
    // Dedupe array of languages
    return [...new Set(languages.map(l => l.split("-")[0]))];
  }

  if (language) {
    return [language.split("-")[0]];
  }

  if (userLanguage) {
    return [userLanguage.split("-")[0]];
  }
  // If locale not detected use english
  return ["en"];
};

const LanguageSwitcherProvider = ({ children }: LanguageSwitcherProvider) => {
  const [availableLocales, setAvailableLocales] = useState<string[]>([]);
  const [selectedLocale, setSelectedLocale] = useState<string>("");

  useEffect(() => {
    const userLocales = getLocales();
    // Add new wlanguages here
    setAvailableLocales(["en", "ru"]);

    const matchingLocales = [...new Set(userLocales)].filter(x =>
      new Set(availableLocales).has(x)
    );
    const defaultLocale = matchingLocales[0] || "en";
    //@ts-ignore
    i18n.load(defaultLocale, catalogEn);
    i18n.activate(defaultLocale);
    setSelectedLocale(defaultLocale);
  }, []);

  const setLanguage = async (newLanguage: string) => {
    if (!availableLocales.includes(newLanguage)) {
      console.log("This locale is not available");
      return;
    }

    const newCatalog = await import(`../locales/${newLanguage}/messages.js`);
    i18n.load(newLanguage, newCatalog.messages);
    i18n.activate(newLanguage);
    setSelectedLocale(newLanguage);
  };

  return (
    <LanguageSwitcherContext.Provider
      value={{
        availableLanguages: availableLocales,
        selectedLanguage: selectedLocale,
        setActiveLanguage: setLanguage
      }}
    >
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    </LanguageSwitcherContext.Provider>
  );
};

function useLanguageSwitcher() {
  const context = React.useContext(LanguageSwitcherContext);
  if (context === undefined) {
    throw new Error("useLanguageSwitcher must be used within a LanguageSwitcherProvider");
  }
  return context;
}

export { LanguageSwitcherProvider, useLanguageSwitcher };
