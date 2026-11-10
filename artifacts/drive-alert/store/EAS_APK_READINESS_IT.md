# APK Android di prova — preparazione

## Stato

**Profilo APK predisposto; compilazione EAS non avviata; nessun APK prodotto.**
Il rilevamento della sonnolenza resta non verificato su telefono reale.
Nessun caricamento su GitHub e nessuna pubblicazione sul Play Store sono stati
eseguiti durante questa preparazione.

## Configurazione predisposta

- La cartella dell'app Expo è `artifacts/drive-alert`.
- `eas.json` contiene il profilo `preview`: distribuzione interna, formato APK,
  credenziali di firma gestite dal servizio esterno e pnpm 10.26.1.
- Il profilo produce un'app di test autonoma, non un development client:
  non dipende da Metro per caricare il codice.
- È stato aggiunto anche il profilo `development`, con `developmentClient: true`,
  e installato `expo-dev-client` nella versione SDK 58. Questo secondo profilo
  richiede un server di sviluppo raggiungibile per caricare il codice.
- Entrambi i profili Android specificano l'immagine cloud `latest`.
- Non sono presenti profili di invio allo store.
- Nome e identificativo Android restano DRIVE ALERT by Denisa e
  `com.denisa.drivealert`.
- Non sono stati inventati un proprietario Expo, un ID progetto o credenziali.

## Problemi trovati e corretti

1. Expo Doctor rifiutava `newArchEnabled` nella configurazione SDK 58:
   rimossa l'opzione non ammessa, senza cambiare la versione di Expo/React Native.
2. Mancava `expo-asset`, richiesto da `expo-audio`: installata la versione
   compatibile tramite Expo e aggiunto il relativo plugin.

Per ispezione dei moduli nativi, limiti della compatibilità e percorso dal
telefono consultare `DEVELOPMENT_BUILD_ANDROID_IT.md`. Dopo l'aggiunta del
development client sono stati riconfermati Expo Doctor (20/20), allineamento
dipendenze, TypeScript e test logica (13/13). Il bundle Android sotto elencato
era stato verificato nella precedente preparazione del profilo preview,
non costituisce verifica della nuova development build.

## Controlli dopo le correzioni

- Expo Doctor: **20 controlli su 20 superati**.
- Allineamento dipendenze Expo: superato.
- TypeScript: superato.
- Test della logica: **13 superati, 0 falliti**.
- Esportazione del bundle Android/Hermes e risorse: superata.

L'installazione segnala ancora peer dependency di `@react-native/metro-config`
per componenti React Native/worklets; non è un errore di Expo Doctor e non ha
impedito l'esportazione verificata. La compilazione nativa esterna dovrà
confermare se richiede ulteriori interventi.

**Esportare il bundle non compila Java/Kotlin/C++ e non crea APK o AAB.**
I controlli non dimostrano che fotocamera, face detector, bip, voce o vibrazione
funzionino sul dispositivo.

## Cosa manca per ottenere il file APK

1. **Collegamento al progetto Expo personale.** L'app non contiene ancora
   l'associazione verificata al progetto EAS dell'utente. Servono proprietario
   e ID progetto reali, non valori di esempio.
2. **Codice disponibile al servizio esterno.** Il trasferimento al repository
   GitHub indicato dall'utente non è stato completato. Non è stato possibile
   verificarne accessibilità, contenuto o visibilità privata.
3. **Configurazione del monorepo.** Il servizio deve selezionare la cartella
   dell'app e avere anche lockfile, configurazione pnpm e pacchetti workspace
   necessari. Copiare soltanto la cartella dell'app non basta.
4. **Firma Android.** Il servizio esterno deve predisporre le credenziali di
   firma per il test. Non inserire password, token o keystore nel codice o in chat.
5. **Compilazione nativa esterna.** Occorre avviarla e controllare i log dei
   moduli nativi e la disponibilità dell'ambiente compatibile con SDK 58.
   Questa sessione Replit non può avviare EAS Build.
6. **Download e prova del risultato.** Solo dopo una compilazione riuscita
   esisterà un link reale per scaricare l'APK e installarlo sul telefono.

La distribuzione interna non equivale a pubblicazione sul Play Store.
Il link di un APK interno va condiviso solo con i collaudatori previsti.

## Prove obbligatorie dopo l'installazione

Da veicolo fermo: autorizzazione/rifiuto fotocamera, immagine frontale reale,
assenza del volto, occhi chiusi/semichiusi e apertura della bocca, bip e arresto
allarme, pausa/background, avvio a freddo offline. Verificare separatamente
disponibilità delle voci offline e funzioni GPS/mappe che richiedono rete.
Documentare modello, versione Android, build, risultati e difetti.

## Riferimenti

- https://docs.expo.dev/build-reference/eas-json/
- https://docs.replit.com/features/artifact-types/building-mobile-apps
