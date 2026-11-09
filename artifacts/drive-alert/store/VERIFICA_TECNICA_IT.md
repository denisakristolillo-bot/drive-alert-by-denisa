# DRIVE ALERT by Denisa — verifica tecnica

Data: 9 novembre 2026.

## Esito

**Verifica software parziale superata. Verifica su dispositivo non eseguita.**
Questo documento non è una certificazione di sicurezza, una validazione clinica
del rilevamento o un'approvazione per Google Play.

La verifica riguarda il codice presente nel progetto durante i controlli.
Non copre le modifiche GPS e sosta sicura in attesa di integrazione.

## Controlli eseguiti

| Controllo | Risultato | Limite |
| --- | --- | --- |
| TypeScript (`pnpm --filter @workspace/drive-alert run typecheck`) | Superato | Non compila i moduli Android/iOS |
| Test (`node --experimental-strip-types --test artifacts/drive-alert/logic/*.test.mjs`) | 9 superati, 0 falliti | Usano campioni numerici e voci di esempio, non fotogrammi reali né altoparlanti |
| Allineamento dipendenze (`CI=1 pnpm --filter @workspace/drive-alert exec expo install --check`) | Superato | Non dimostra compatibilità completa durante l'esecuzione nativa |
| Bundle Android (`CI=1 pnpm exec expo export --platform android --output-dir /tmp/drive-alert-android-verification`, dalla cartella dell'app) | Superato | Produce JavaScript/Hermes e risorse, non APK/AAB firmati |
| Anteprima browser `/monitor`, 402×874 | Schermata visibile, con avviso di rilevamento non disponibile | Nessuna prova della fotocamera nativa |

I test coprono lampeggio breve rispetto a chiusura prolungata, durata dello
sbadiglio, postura calibrata, azzeramento dei segnali quando manca il volto e
selezione della lingua vocale con ripiego sull'italiano.
Il bip WAV è incluso tra le risorse esportate: la riproduzione resta da provare.

Sono presenti VisionCamera 5.0.11, face detector 2.0.6 e Nitro Modules 0.37.2.
Le versioni soddisfano i requisiti dichiarati dalle rispettive dipendenze:
questo non sostituisce compilazione e avvio nativi.

## Controlli ancora da eseguire

### Prova interattiva dell'anteprima browser

Eseguita con viewport 402×874, senza modificare il codice:

- Home → pulsante di apertura monitor: navigazione riuscita.
- Monitor: avviso esplicito di rilevamento non disponibile nel browser/Expo Go;
  nessuna indicazione di monitoraggio attivo simulato.
- Impostazioni: sensibilità cambiata da bilanciata ad alta, voce e vibrazione
  disabilitate; dopo ricaricamento i tre valori risultano conservati.
- Navigazione Home → Monitor → Impostazioni senza crash osservati.
- Ripristinate le impostazioni iniziali: sensibilità bilanciata, voce e
  vibrazione abilitate.
- Nessun errore nella console del browser durante la prova.

Durante il caricamento iniziale e alcune transizioni è stato osservato contenuto
temporaneamente vuoto prima della comparsa delle schermate. Non è stato osservato
un blocco permanente. Questa prova verifica l'interfaccia e la persistenza delle
preferenze, non il funzionamento fisico della voce, della vibrazione o della camera.

### Prove su dispositivo ancora mancanti

Eseguire esclusivamente a veicolo fermo e in un luogo sicuro. Non provocare
sonnolenza e non guidare per provare gli allarmi.

Per ogni prova registrare modello, sistema operativo, versione della build,
esito osservato e difetti. Non segnare una prova come superata senza evidenza.

- [ ] Compilare e installare una build Android nativa; registrare eventuali errori dei moduli.
- [ ] Verificare concessione, rifiuto e revoca del permesso fotocamera.
- [ ] Verificare fotocamera anteriore, assenza del volto e ritorno del volto senza indicatori di falsa sicurezza.
- [ ] Provare occhi aperti, lampeggi brevi, chiusura prolungata, apertura della bocca e postura calibrata.
- [ ] Valutare limiti con occhiali, scarsa illuminazione, volto parzialmente coperto e più volti.
- [ ] Ascoltare voce e bip e verificare la vibrazione effettiva.
- [ ] Verificare arresto dell'allarme, pausa, cambio schermata, blocco del telefono e passaggio in background.
- [ ] Provare dopo avvio a freddo in modalità aereo, controllando anche la disponibilità delle voci offline.
- [ ] Ripetere i controlli pertinenti su iPhone con una build nativa.
- [ ] Verificare separatamente GPS, permessi posizione e navigazione dopo l'integrazione del relativo lavoro.

Expo Go e il browser non possono validare il modulo di rilevamento utilizzato.
Non è disponibile un dispositivo collegato tramite ADB nell'ambiente di verifica.
Nessun APK/AAB è stato prodotto o installato durante questa verifica.

## Blocco rilascio

Restano necessari test nativi, revisione e pubblicazione della privacy,
materiali autentici della scheda e un AAB Android firmato.
Non dichiarare l'app affidabile per prevenire incidenti o pronta per il Play Store
in base ai soli controlli elencati come superati.
