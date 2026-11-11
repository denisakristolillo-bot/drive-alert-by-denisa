# Development build Android — DRIVE ALERT by Denisa

## Stato e limiti

Configurazione locale predisposta, non APK compilato. Nessun invio al Play
Store. Grafica e algoritmo di rilevamento non modificati. La disponibilità
reale della fotocamera, l'analisi del volto e gli allarmi restano da verificare
su un telefono fisico, da veicolo fermo.

Il browser non include i moduli nativi e il messaggio di indisponibilità è
corretto. Expo Go non contiene questi moduli personalizzati.

### Nuova verifica delle dipendenze — 11 novembre 2026

Il controllo Expo ora raccomanda patch più recenti nello stesso SDK 58,
tra cui expo-dev-client ~58.0.19, expo-audio ~58.0.12,
expo-speech ~58.0.4 ed Expo ~58.0.24. Il tentativo di allineamento con
`expo install --fix` è stato bloccato da `minimumReleaseAge`: almeno una
versione richiesta è stata pubblicata da meno di 24 ore. Non sono state
aggiunte eccezioni né disabilitate protezioni. Manifest e lockfile sono
rimasti invariati. TypeScript è passato nella nuova verifica.

I precedenti esiti positivi sotto riportati sono storici: non rappresentano
un controllo aggiornato delle nuove versioni consigliate. Occorre ripetere
l'allineamento quando le versioni rispettano il tempo minimo di pubblicazione,
poi verificare Expo Doctor e compilazione nativa. Non è provata
un'incompatibilità hardware delle versioni installate, ma non va dichiarata
conclusa la preparazione delle dipendenze senza risolvere questo avviso.

## Verifica dei moduli installati

| Modulo | Versione rilevata | Risultato dell'ispezione |
| --- | --- | --- |
| Expo / React Native | SDK 58 / 0.88.1 | Base attuale del progetto, non modificata |
| react-native-vision-camera | 5.0.11 | Richiede Nitro Modules e Nitro Image, entrambi presenti |
| react-native-vision-camera-face-detector | 2.0.6 | Richiede VisionCamera >=5, Nitro >=0.35, RN >=0.74 e React >=18: versioni presenti coerenti |
| react-native-nitro-modules | 0.37.2 | Include codice nativo/C++, da compilare |
| react-native-nitro-image | 0.15.2 | Richiede nuova architettura, prevista dall'attuale RN; da confermare in build |
| expo-dev-client | ~58.0.18 | Aggiunto nella versione selezionata da Expo per SDK 58 |
| expo-audio / expo-speech / expo-haptics | Versioni SDK 58 | Bip locale, sintesi vocale, feedback tattile; prova hardware ancora necessaria |
| expo-location / AsyncStorage | Versioni dichiarate nel package | GPS e persistenza; prova permessi e dispositivo ancora necessaria |

Il detector usa Google ML Kit `com.google.mlkit:face-detection:16.1.7`
nel Gradle del modulo installato (modello incluso, non variante Play Services
da scaricare al primo uso). Questo rende possibile l'analisi locale, ma non
dimostra il funzionamento offline dell'app: serve una prova a freddo senza rete.
La voce italiana offline dipende anche dal motore e dalle voci installate.

L'implementazione usa fotocamera frontale, classificazione occhi e contorni/
punti del volto. Gli sbadigli sono dedotti dall'apertura della bocca nel tempo,
non certificati da un classificatore medico. I valori degli occhi sono stime,
non una misura clinica della sonnolenza.

La configurazione Babel contiene `react-native-worklets/plugin`. La versione
5 di VisionCamera installata non espone un app.plugin.js: non aggiungere per
tentativi un plugin di una vecchia versione. Il permesso CAMERA è già presente.
Autolinking/prebuild e compilazione Java/Kotlin/C++ restano da verificare
nel servizio cloud. Le peer dependency generiche non garantiscono che ogni
combinazione SDK/NDK/Gradle compili: il detector dichiara anche AGP 9.2.1 e
CameraX 1.7.0-alpha01, possibili punti da controllare nei log nativi.

## Due profili diversi

- `development`: development client, distribuzione interna, Android APK.
  Richiede un server di sviluppo accessibile per caricare il codice JavaScript.
  Non è la scelta per una prima prova offline senza aver caricato il codice.
- `preview`: APK autonomo con bundle incluso, distribuzione interna,
  adatto alle successive prove a freddo/offline.

Entrambi specificano un'immagine cloud `latest`, come richiesto dalla
documentazione per le build dal repository. La disponibilità e l'idoneità
effettiva dell'immagine per SDK 58 devono essere confermate dal servizio.
Non sono presenti profili submit o automatismi di pubblicazione.

## Cosa manca prima della compilazione

1. Associare l'app al progetto Expo personale reale: slug coerente con
   `drive-alert` e project ID reale; non usare UUID di esempio.
2. Verificare che GitHub contenga l'ultima versione del codice, inclusi questi
   cambiamenti. L'utente riferisce di vedere cartelle/file: non è una verifica
   della sincronizzazione, né delle credenziali o della visibilità privata.
3. Conservare l'intero workspace necessario: lockfile, pnpm-workspace.yaml e
   pacchetti lib usati dall'app. La directory dell'app è
   `artifacts/drive-alert`, non la radice del repository.
4. Predisporre firma Android e prima configurazione cloud con un operatore
   autorizzato. Non condividere password, token o keystore in chat/GitHub.
5. Confermare una prima compilazione Android riuscita. La guida ufficiale
   Expo per "Build from GitHub" la elenca come prerequisito: non promettere
   che un progetto vuoto creato nel browser basti ad avviare la prima build.

Questa sessione non può avviare EAS Build. Non esiste ancora un URL APK.
Non viene proposta una sequenza di comandi EAS.

## Dal telefono, dopo la prima configurazione

1. Aprire expo.dev con il proprio account e il progetto associato.
2. Nelle impostazioni GitHub del progetto collegare il repository privato
   mediante l'app ufficiale Expo GitHub, limitando l'accesso ai repository
   necessari. Indicare `artifacts/drive-alert` come base directory.
3. Dopo che i prerequisiti ufficiali sono soddisfatti, aprire Builds e
   "Build from GitHub"; scegliere il commit aggiornato, Android e il profilo
   `development`. Non attivare invio automatico agli store.
4. Attendere esito e log. Solo una build riuscita fornisce l'APK reale.
5. Dal telefono aprire la pagina della build e scaricare/installare l'APK.
   Consentire installazioni da quella fonte fidata solo quando necessario;
   non disattivare Play Protect e revocare il permesso dopo l'installazione.
6. Avviare il development client e collegarlo al server di sviluppo accessibile
   del progetto. L'apertura della pagina web non equivale a questo collegamento;
   indirizzo, sessione e raggiungibilità vanno verificati sul telefono.
7. Da fermi: provare permesso accordato/rifiutato, assenza volto, occhi chiusi/
   semichiusi, apertura bocca, movimenti testa, bip/voce/vibrazione, pausa e
   background. Non usare queste prove durante la guida.
8. Per verificare l'avvio senza Internet usare poi il profilo `preview`, con
   bundle incluso, e ripetere le prove in modalità aereo. Le mappe e la ricerca
   online delle soste devono essere valutate separatamente.

## Fonti ufficiali consultate

- https://docs.expo.dev/develop/development-builds/introduction/
- https://docs.expo.dev/build/building-from-github/
- https://docs.expo.dev/build-reference/eas-json/

Le schermate e i requisiti del servizio possono cambiare. Un esito positivo
di Expo Doctor o del bundle JavaScript non equivale a compilazione nativa.

## Controlli locali della predisposizione precedente

- Allineamento dipendenze Expo: superato.
- Expo Doctor: 20 controlli su 20 superati.
- TypeScript: superato.
- Test delle regole locali: 13 su 13 superati.
- Rimane l'avviso pnpm su `@react-native/metro-config` come peer dependency.
  Non è stato nascosto o interpretato come errore del detector.
- Nessuna compilazione Android nativa eseguita.
