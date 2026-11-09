# Preparazione Android — stato del rilascio

**Non ancora pronto per l'invio a Google Play.** Questo documento distingue la preparazione del progetto dai passaggi di rilascio ancora necessari.

## Preparato nel progetto

- Versione applicativa 1.0.0 e Android versionCode 1.
- Target SDK Android 36 configurato tramite il plugin Expo build-properties.
- Icona Play 512×512 PNG con canale alfa e primo piano adattivo.
- Registrazione audio e riproduzione audio in background disabilitate.
- Permessi di microfono, archiviazione, posizione, servizi in background e sovrapposizione rimossi dalla configurazione di questa versione.
- Bozza della scheda italiana e dell'informativa privacy, da completare prima dell'uso pubblico.

La posizione è esclusa perché GPS e navigazione non sono ancora presenti. Quando verranno implementati, rivedere insieme permessi, informativa e dichiarazioni Data safety.

## Blocchi prima della prima release

1. Concordare l'identificativo Android definitivo. L'introspezione Expo usa ancora il valore provvisorio `com.placeholder.appid`: non deve essere usato per pubblicare.
2. Inserire nome sviluppatore, identità del titolare e contatto di assistenza/privacy.
3. Revisionare e pubblicare l'informativa su una pagina HTTPS pubblica, poi collegarla anche nell'app.
4. Generare e verificare la build Android firmata fuori dal flusso di pubblicazione Replit; nessun AAB firmato è stato generato qui.
5. Completare i test reali Android su fotocamera, segni facciali, allarmi, permessi, background e modalità aereo. I test della logica non sostituiscono questi controlli.
6. Acquisire screenshot autentici della build nativa e completare materiali, classificazione e dichiarazioni Play Console.
7. Verificare gli SDK e il comportamento di rete della build finale prima di confermare le risposte Data safety.

Replit supporta sviluppo e anteprima Android, ma non offre attualmente la pubblicazione diretta su Google Play. L'ambiente di lavoro corrente non dispone di Java, Gradle o Android SDK. Non sono stati eseguiti caricamenti né azioni su un account Play Console.

## Fonti ufficiali verificate

- Replit, applicazioni mobile: https://docs.replit.com/features/artifact-types/building-mobile-apps
- Google Play, target API richiesto: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
- Google Play, privacy e dichiarazioni: https://support.google.com/googleplay/android-developer/answer/9859455?hl=en
- Google Play, materiali della scheda: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en

I requisiti degli store possono cambiare: ricontrollarli al momento dell'invio.
