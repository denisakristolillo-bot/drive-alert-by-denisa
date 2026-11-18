# Verifica APK di prova — Deni — 18 novembre 2026

## Esito

Blocco Babel verificato come risolto nel bundle JavaScript Android. Configurazione
locale allineata al progetto esistente Deni. Nessuna build EAS/Gradle, nessun APK,
nessuna modifica alle credenziali, nessun nuovo progetto e nessuna pubblicazione.
Questa verifica sostituisce le precedenti indicazioni sul collegamento Expo
assente e sugli esiti dei controlli dipendenze.

## Configurazione

- Unica directory Expo/EAS: `artifacts/drive-alert`.
- Owner: `denisakristolillos-team`; slug: `deni`.
- Project ID: `09e8908b-367f-46dd-a762-3d5f99b09200`.
- Nome visibile e package Android invariati: DRIVE ALERT by Denisa,
  `com.denisa.drivealert`. Schema URL `drive-alert` conservato.
- Rimossi i due file Expo/EAS concorrenti dalla radice del workspace: puntavano
  a un altro ID e a profili non corrispondenti a quelli dell'app.
- Profili dell'app conservati: `preview` APK interno autonomo;
  `development` APK con development client. Firma remota invariata.
- Nessun profilo submit o automatismo di pubblicazione aggiunto.

## Correzione Babel

La build del 12 novembre sul precedente progetto Expo falliva nel task
`:app:createBundleReleaseJsAndAssets`: `Cannot find module 'babel-preset-expo'`.
L'uscita Node 7 e i successivi errori Metro erano conseguenze di questo problema.

La dipendenza diretta `babel-preset-expo` 58.0.24 e il lockfile erano già stati
corretti prima di questo intervento: non sono state duplicate o cambiate versioni
inutilmente. Il preset e il plugin worklets vengono ora risolti esplicitamente
dal file Babel dell'app tramite `require.resolve`.

## Verifiche eseguite

| Controllo | Risultato |
| --- | --- |
| `pnpm --filter @workspace/drive-alert run verify:apk` | Superato: identità Deni, assenza duplicati, profilo APK, risoluzione moduli nativi/JS e trasformazione Babel TSX Android |
| `pnpm --filter @workspace/drive-alert run typecheck` | Superato |
| `node --experimental-strip-types --test artifacts/drive-alert/logic/*.test.mjs` | 13 test superati, 0 falliti |
| `pnpm install --offline --frozen-lockfile --ignore-scripts` dalla radice | Superato: manifest/lockfile coerenti; nessuno script installazione eseguito |
| `pnpm exec expo config --type public --json` dalla directory app | Identità Deni risolta correttamente, package e plugin conservati |
| `CI=1 pnpm exec expo export --platform android --output-dir /tmp/drive-alert-deni-android-check` dalla directory app | Superato: 2041 moduli, bundle Hermes e 47 risorse; non è una build APK |
| `CI=1 pnpm exec expo install --check` dalla directory app | Non superato: 17 pacchetti Expo da aggiornare |
| `CI=1 pnpm dlx expo-doctor` dalla directory app | 19/20 controlli superati; unico controllo negativo: allineamento versioni Expo |
| `git diff --check` | Superato |

## Dipendenze: limite ancora aperto

Il tentativo `expo install --fix` si è fermato con
`ERR_PNPM_NO_MATURE_MATCHING_VERSION` su `expo-dev-client@~58.0.21`.
La versione 58.0.21 è stata pubblicata il 17 novembre alle 12:03:11 UTC:
non aveva ancora superato la soglia di 1440 minuti al momento del controllo.
Non sono state aggiunte eccezioni, ridotte le protezioni o escluse dipendenze
dalla validazione. Manifest e lockfile delle dipendenze sono rimasti invariati.

Versioni trovate → consigliate dal controllo corrente:

- expo 58.0.23 → ~58.0.26
- expo-asset 58.0.20 → ~58.0.21
- expo-audio 58.0.11 → ~58.0.12
- expo-dev-client 58.0.18 → ~58.0.21
- expo-speech 58.0.3 → ~58.0.4
- expo-blur 58.0.5 → ~58.0.6
- expo-constants 58.0.15 → ~58.0.16
- expo-font 58.0.11 → ~58.0.12
- expo-haptics 58.0.7 → ~58.0.8
- expo-linear-gradient 58.0.3 → ~58.0.4
- expo-linking 58.0.16 → ~58.0.17
- expo-location 58.0.20 → ~58.0.22
- expo-router 58.0.30 → ~58.0.32
- expo-splash-screen 58.0.13 → ~58.0.14
- expo-status-bar 58.0.4 → ~58.0.5
- expo-symbols 58.0.4 → ~58.0.5
- expo-web-browser 58.0.7 → ~58.1.0

Prima di considerare chiusa la preparazione, ripetere l'allineamento dopo che
i pacchetti hanno maturato il tempo minimo e rieseguire questi controlli.
Il pacchetto sopra citato supera le 24 ore il 18 novembre alle 13:03:11
Europe/Rome; altri pacchetti o nuove raccomandazioni potrebbero richiedere
ulteriori verifiche. Non equivale a un avvio programmato.

## Passi successivi, solo dopo autorizzazione

1. Applicare le modifiche approvate al progetto originale.
2. Chiudere l'allineamento dipendenze senza aggirare le protezioni.
3. Dopo aver mostrato gli esiti, chiedere autorizzazione per una build Android
   `preview` sul progetto Deni, senza auto-submit.
4. Verificare Java/Kotlin/C++, autolinking e firma sul servizio EAS: non sono
   dimostrati da questo bundle JavaScript. L'accesso alle credenziali di firma
   del team non è stato verificato o modificato.
5. Provare fotocamera, detector, voce, suoni, vibrazione, GPS, permessi e offline
   su telefono reale da veicolo fermo. Non dichiarare validato un sistema di
   sicurezza né il rilevamento prima delle prove.
