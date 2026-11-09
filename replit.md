# DRIVE ALERT by Denisa

Prototipo mobile in italiano che rileva segnali di sonnolenza con elaborazione facciale sul dispositivo e avvisi vocali, sonori e aptici.

## Run & verify

- `pnpm --filter @workspace/drive-alert run dev` — avvia Metro/Expo.
- `pnpm --filter @workspace/drive-alert run typecheck` — verifica TypeScript.
- `node --experimental-strip-types --test artifacts/drive-alert/logic/drowsinessRules.test.mjs` — test delle soglie.

## Struttura

- `artifacts/drive-alert/app/(tabs)` — schermate Guida, Rilevamento e Impostazioni.
- `artifacts/drive-alert/logic/drowsinessRules.ts` — soglie e stato temporale degli indicatori.
- `artifacts/drive-alert/hooks/useLocale.ts` — cataloghi offline (italiano, inglese, spagnolo, francese, tedesco, portoghese, arabo, cinese semplificato, giapponese, hindi); fallback italiano.
- `artifacts/drive-alert/context/AppSettingsContext.tsx` — preferenze locali.
- `artifacts/drive-alert/constants/colors.ts` — palette blu notte/oro.

## Compatibilità e sicurezza

- Il riconoscimento usa Vision Camera e il face detector ML Kit: richiede una build nativa personalizzata iOS/Android e non funziona in Expo Go né nel browser.
- Video e fotogrammi sono elaborati sul dispositivo e non vengono salvati o caricati dall'app.
- Le soglie sono prototipali: non sono validate come sistema di sicurezza. L'app non sostituisce sonno, pause o attenzione alla strada.
- La lingua vocale italiana dipende dalle voci installate; l'app preferisce una voce che il dispositivo identifica come femminile quando disponibile.
- Mappa, GPS, velocità, aree di sosta e routing non sono ancora implementati in questo prototipo.
