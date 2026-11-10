# Preparazione alla sincronizzazione GitHub

## Ambito

Preparazione locale soltanto: nessun push, nessuna pubblicazione, nessuna
compilazione e nessuna modifica alle funzionalità o alla grafica.
Il repository di destinazione è quello indicato dall'utente,
`drive-alert-by-denisa`. Non è stato aggiunto un remote e non è stato
verificato o modificato il contenuto del repository remoto.

## Contenuto da sincronizzare

La radice del repository deve essere la radice del workspace, non soltanto
la cartella mobile. Sono già versionati:

- `artifacts/drive-alert/`: sorgenti Expo, configurazione Android, profili EAS,
  test, immagini e suono locale necessari all'app.
- `lib/`: pacchetti condivisi, manifest e sorgenti, compresi
  `@workspace/api-client-react`, gli altri pacchetti e le specifiche API.
- `scripts/`: script del workspace, incluso quello richiamato dopo i merge.
- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`.
- `tsconfig.json`, `tsconfig.base.json` e configurazioni dei pacchetti.
- `.npmrc`: configurazione pnpm esistente, controllata senza mostrare valori;
  nessuna riga riconducibile a credenziali trovata. Non inserirvi mai token,
  password o autenticazione: usare le impostazioni segrete dell'ambiente.
- File di configurazione Replit e degli altri pacchetti workspace esistenti.
  Non sono stati rimossi progetti o parti del monorepo.

## Esclusioni

Le regole Git escludono a ogni livello file `.env` e varianti, `.envrc`,
configurazione npm locale, `credentials.json`, chiavi/certificati e credenziali
di firma, dipendenze installate, cache, output di compilazione, APK/AAB/IPA,
log e report di test. Sono state aggiunte esclusioni corrispondenti anche
in `.replitignore`, che non sostituisce `.gitignore` per GitHub.

I file in `lib/*/src/generated` restano inclusi: sono codice sorgente importato
dai pacchetti, non cache o output Android eliminabili. Anche icone e WAV
dell'app sono risorse necessarie e devono restare nel repository.
`expo-env.d.ts` e i progetti nativi Android/iOS generati sono già esclusi
dalle regole dell'app; la configurazione Expo resta versionata.

Le regole di esclusione non rimuovono file già tracciati né cancellano
eventuali segreti dalla cronologia. I controlli di preparazione si riferiscono
all'albero corrente, non certificano l'assenza di segreti in ogni commit
storico. Nessuna cronologia è stata riscritta.

## Prima dell'invio effettivo

1. Confermare accesso al repository di destinazione e visibilità privata.
2. Confrontare la sua cronologia e il suo contenuto con questo workspace.
3. Collegare il remote corretto senza cambiare i remoti interni già presenti.
4. Esaminare la selezione dei file prima del commit/push. Non usare aggiunte
   forzate per file ignorati e non usare push forzato per superare conflitti.
5. Sincronizzare soltanto dopo esplicita autorizzazione dell'utente.

La preparazione alla sincronizzazione non equivale ad APK pronto, a
compilazione nativa riuscita o a rilevamento verificato su telefono reale.

## Esito dei controlli locali

- File principali del workspace e dell'app: presenti e già tracciati.
- Manifest dei 7 pacchetti sotto `artifacts/` e `lib/`: inclusi; dipendenze
  `workspace:` dichiarate nei pacchetti controllati risolte nel workspace.
- Casi di esclusione verificati: 20 su 20.
- File già tracciati che ricadono nelle esclusioni: nessuno.
- Controllo mirato di 156 file testuali candidati alla sincronizzazione:
  nessuna corrispondenza ai formati cercati di chiavi private, token GitHub,
  chiavi AWS/Google, password in URI database e autenticazione npm.
  Non è una garanzia di assenza di ogni possibile segreto o password.
- File funzionali dell'app modificati durante questa preparazione: nessuno.
- Nessuna build o sincronizzazione remota eseguita.
