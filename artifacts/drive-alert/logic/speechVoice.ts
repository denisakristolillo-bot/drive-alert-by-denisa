import type { Voice } from 'expo-speech';
import type { LocaleCode } from '@/hooks/useLocale';

const LANGUAGE_TAGS: Record<LocaleCode, string> = {
  it: 'it-IT',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
  ar: 'ar-SA',
  zh: 'zh-CN',
  ja: 'ja-JP',
  hi: 'hi-IN',
  nl: 'nl-NL',
  ru: 'ru-RU',
  ko: 'ko-KR',
  tr: 'tr-TR',
  pl: 'pl-PL',
};

export interface AlertVoice {
  language: string;
  voice?: string;
}

export function selectAlertVoice(
  voices: Voice[],
  locale: LocaleCode,
): AlertVoice {
  const activeVoice = voices.find(
    (voice) => getLanguageCode(voice.language) === locale,
  );
  if (activeVoice) {
    return { language: activeVoice.language, voice: activeVoice.identifier };
  }

  const italianVoice = voices.find(
    (voice) => getLanguageCode(voice.language) === 'it',
  );
  if (italianVoice) {
    return {
      language: italianVoice.language,
      voice: italianVoice.identifier,
    };
  }

  return { language: LANGUAGE_TAGS.it };
}

export function getPreferredSpeechLanguage(locale: LocaleCode): string {
  return LANGUAGE_TAGS[locale];
}

function getLanguageCode(language: string): string {
  return language.toLowerCase().split(/[-_]/, 1)[0];
}
