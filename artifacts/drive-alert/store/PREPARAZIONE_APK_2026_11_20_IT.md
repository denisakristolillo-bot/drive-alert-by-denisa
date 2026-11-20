# Preparazione Android di prova — 20 novembre 2026

## Esito e limiti

Preparazione locale verificata, NON nuovo APK funzionante certificato.
Il progetto originale resta invariato fino all'approvazione delle modifiche.
Nessuna build nativa, sincronizzazione GitHub, modifica delle credenziali,
pubblicazione, prebuild o avvio di simulatore è stato eseguito in questo intervento.
Non sono stati rigenerati bundle Android/iOS: il controllo Babel trasforma solo
una sonda TSX in memoria, senza compilare l'app.

## Identità e configurazione conservate

- Nome: DRIVE ALERT by Denisa.
- Package Android: `com.denisa.drivealert`.
- Expo: owner `denisakristolillos-team`, slug `deni`,
  project ID `09e8908b-367f-46dd-a762-3d5f99b09200`.
- Configurazione unica dell'app: `artifacts/drive-alert`.
- Versione visibile invariata: `1.0.0`. `android.versionCode` portato da 1 a 2:
  distingue il candidato corretto dagli APK precedenti, senza cambiare package.
- `preview`: APK interno autonomo, `developmentClient: false`, firma remota.
- `development`: conservato separatamente; richiede il server di sviluppo.
- Nessun profilo submit nell'app; nessun automatismo aggiunto.
- Rimossi dalla radice `app.json` ed `eas.json`, ricomparsi dopo le precedenti
  verifiche. Il preflight iniziale falliva proprio per questi duplicati.
- pnpm 10.26.1 conservato. Lockfile aggiornato con le dipendenze.

## FaceDetector / NullPointerException

Le correzioni salvate sono state conservate, non sostituite con un detector finto:

1. `NativeFacePreview` usa la Camera reale e attende `onConfigured` prima di
   creare e collegare l'output ML Kit.
2. `createFaceDetectorSession` crea un solo output per sessione, riutilizzato
   ai rerender; mantiene callback aggiornate e interrompe la consegna dopo stop.
3. Le opzioni passate al bridge sono esplicite. Classificazione occhi,
   landmark e contorni per la bocca restano abilitati.
4. Gli errori di creazione conservano causa e messaggio nativi, senza retry
   silenziosi; un output nullo viene rifiutato.
5. La diagnostica `DA-FACE-02` e il fallback di errore sono presenti.

Nel sorgente Android della dipendenza installata 2.1.0 non compaiono il vecchio
listener `FaceDetectorOrientation` né l'accesso a `NitroModules.applicationContext`;
sono presenti ML Kit e analisi YUV. Il relativo Gradle include la guardia per
l'estensione Kotlin di AGP e ML Kit bundled `16.1.7`.
Il wrapper hook della libreria ricrea invece le opzioni a ogni render:
l'app lo evita già tramite la sessione stabile.

Questi sono riscontri sul codice e test di regressione, NON una riproduzione o
risoluzione dimostrata del crash Java. Senza stack trace completo con riga Kotlin
e prova della nuova build sul dispositivo non è identificabile con certezza
l'oggetto nullo che ha causato il crash precedente.
Un test che simula una NullPointerException verifica la propagazione dell'errore,
non l'esecuzione del detector su Android.
L'APK vecchio non acquisisce nuove librerie native da una semplice modifica JS.

## Compatibilità

Stack selezionato mantenuto:

| Componente | Versione |
| --- | --- |
| Expo | 58.0.26 |
| React / React Native | 19.3.0 / 0.88.1 |
| Worklets / Reanimated | 0.13.0 / 4.7.1 |
| Vision Camera | 5.2.3, pin esatto |
| Vision Camera Face Detector | 2.1.0, pin esatto |
| Nitro Modules / Nitro Image | 0.37.2 / 0.15.2 |
| expo-dev-client | 58.0.21 |

I vincoli peer dichiarati delle librerie camera/detector sono soddisfatti;
React Native e Worklets corrispondono ai requisiti dell'SDK installato.
Allineati i 17 pacchetti consigliati dal controllo Expo, senza cambiare SDK
major, rimuovere funzionalità o aggirare la protezione di 1440 minuti.
Il vecchio blocco temporale di expo-dev-client non si è ripresentato.
I controlli non validano la compatibilità binaria Java/Kotlin/C++ o il risultato
di Gradle. L'immagine cloud `latest` resta una scelta mobile, non un ambiente
nativo riprodotto localmente.

## Verifiche di questo intervento

| Verifica | Esito e ambito |
| --- | --- |
| Expo install --check | Superato: dipendenze allineate |
| Expo Doctor | 20/20, nessun problema segnalato |
| TypeScript dell'app | Superato |
| Test `logic/*.test.mjs` | 37 superati, 0 falliti |
| verify:apk | Superato dopo rimozione duplicati; include identità, profilo preview, risoluzione moduli e sonda Babel Android |
| Configurazione Expo effettiva | Package conservato, versionCode 2, progetto Deni e plugin presenti |
| Autolinking Android | Camera, detector, Nitro Modules e Nitro Image tutti individuati |
| Installazione pulita | Copia temporanea dei sorgenti tracciati, pnpm frozen/offline/ignore-scripts: superata |
| git diff --check | Superato |
| Build, prebuild, export completo e installazione sul telefono | Non eseguiti |

L'installazione pulita prova disponibilità dei pacchetti e coerenza del lockfile;
non esegue script di installazione o generazione nativa.
L'ambiente verificato usa Node 24.22.3 e pnpm 10.26.1; Java, javac, Gradle e ADB
non sono disponibili. Non è stato verificato il runtime effettivo del builder
cloud né un dispositivo Android. Expo Go/browser non supportano questo detector.

## Stato esterno rilevato SOLO in lettura

GitHub `android-apk-test` risulta ancora a
`01363c26e18c79223b21088857b85907db9ce9b6`: è precedente alle correzioni
salvate nei commit locali `74fb396` e `6c28445` e a questa preparazione.
Non sono stati eseguiti fetch, pull, push o altre sincronizzazioni.

La lettura Expo ha restituito:

- Build `c71c66dd-9d2f-43c2-8400-cfe2d0495363`: già IN_PROGRESS al controllo,
  creata il 20 novembre alle 15:57 UTC, profilo preview e sorgente `01363c2`.
- Build `47aa0e34-26c8-46d7-a31a-c5a67727f6f5` e
  `c750503f-7e6e-4ab7-8832-f74e72264107`: FINISHED, con artefatti APK,
  stesso sorgente vecchio e versionCode 1.

Nessuna è stata avviata, cancellata o modificata da questo intervento.
Gli APK esistenti NON rappresentano il candidato aggiornato.
Le build riuscite dimostrano una compilazione precedente, non l'assenza del
crash sul dispositivo né la disponibilità futura della stessa firma.
Gli strumenti Expo disponibili non espongono una lettura delle credenziali di
firma o delle impostazioni dei trigger storici; nessuna credenziale è stata
letta o modificata. Non si deve assumere che occorra creare un nuovo keystore.

## Esattamente cosa manca

### Per produrre un APK installabile con queste correzioni

1. Approvare eventualmente l'applicazione dei file preparati al progetto
   originale; fino ad allora rimangono separati. Questo NON autorizza una build.
2. Rendere disponibile al servizio di compilazione una revisione che includa
   tutte le correzioni e il lockfile aggiornato. L'integrazione Expo Build
   disponibile richiede un repository GitHub collegato e un riferimento Git.
   Il ramo attuale non contiene ancora tali modifiche. Il workspace completo
   deve essere disponibile, con directory base `artifacts/drive-alert`.
3. Prima di un futuro push, risolvere o accettare esplicitamente il rischio
   di automazioni esterne/trigger storici non verificabili con gli strumenti
   attuali. Nessun nuovo controllo manuale della sezione “Build triggers”
   viene richiesto qui. La precedente conversazione ha già documentato questo
   limite: non è una causa del crash né una dipendenza del codice.
4. Dopo autorizzazione distinta, eseguire una compilazione Android `preview`
   dalla revisione corretta, senza invio agli store. Questa dovrà verificare
   Gradle, Java/Kotlin/C++, ML Kit, codegen, ABI e toolchain cloud: nessuno dei
   controlli locali può sostituirla.
5. Conservare la firma Android usata dall'app già installata e verificare
   package e versionCode risultanti. Con lo stesso package ma chiave diversa
   Android rifiuta l'aggiornamento; non cambiare keystore o disinstallare
   l'app alla cieca, perché si potrebbero perdere le preferenze locali.
6. Solo dopo esito positivo esisterà un nuovo APK firmato da scaricare e
   installare. Gli APK vecchi non sono una consegna di questa versione.

### Per dichiarare funzionante il rilevamento

Installare l'APK corretto e provare a veicolo fermo: avvio a freddo, consenso e
rifiuto camera, preview frontale e callback reali, assenza/ritorno del volto,
occhi e sbadiglio, ripetuti avvii/arresti, cambio schermata, background/ritorno,
voce/bip/vibrazione e avvio offline. Verificare GPS separatamente.
Registrare modello, Android, versionCode, esito ed eventuale stack trace completo.
Non usare prove durante la guida; il prototipo non garantisce prevenzione
di incidenti o diagnosi della sonnolenza.
