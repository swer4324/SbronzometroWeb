# Stato migrazione web

Aggiornato: 14 giugno 2026

## Milestone 1 - Base testabile

Stato: completata.

Completato:

- scaffold React/TypeScript/Vite;
- IndexedDB versionato per profili, drink, pasti e preferenze future;
- richiesta di persistent storage quando supportata;
- profilo persistente e profilo attivo;
- aggiunta rapida drink/pasto;
- calcolo BAC e Home;
- cronologia ed eliminazione eventi;
- export backup JSON;
- PWA installabile e offline;
- build di produzione;
- primi unit test BAC;
- collaudo browser con persistenza dopo refresh.

Verifiche eseguite:

- `npm test`: 3 test superati;
- `npm run build`: completata, service worker e manifest generati;
- browser: creazione profilo, aggiunta drink, aggiunta pasto e refresh persistente;
- browser console: nessun errore.

## Prossima milestone - Parita dati e input

Stato: completata.

Completato:

- database migrato da v1 a v2 senza cancellare i dati;
- modifica profilo e tasso di smaltimento personalizzato;
- catalogo drink Android portato sul web;
- volume, gradazione, prezzo e data/ora modificabili;
- modifica drink e pasti dalla cronologia;
- custom drink e preferiti persistenti;
- import backup JSON validato prima della sostituzione;
- test round-trip backup, modifica profilo e cascade delete;
- test BAC ampliati.
- esportatore golden eseguito dal calcolatore Kotlin Android;
- confronto automatico Android/web su cinque scenari deterministici fino a 10 cifre decimali.

Verifiche eseguite:

- `npm test`: 25 test superati, inclusi 5 confronti golden Android/web;
- `npm run build`: completata;
- `gradlew testDebugUnitTest`: completata con la JBR inclusa in Android Studio;
- browser: migrazione del profilo esistente, modulo drink completo, modifica cronologia e strumenti backup;
- browser console: nessun errore.

La parita matematica automatica copre BAC corrente, picco, picco previsto, picco storico, livello, tempo sotto limite e reminder idratazione.

## Milestone 3 - Esperienza e report

Stato: completata per onboarding, disclaimer, valuta e report; i18n completa ancora in corso.

Completato:

- disclaimer persistente con consenso obbligatorio;
- PDF legale disponibile nella PWA;
- onboarding in quattro passaggi, persistente e riapribile;
- retrocompatibilita per utenti che avevano gia un profilo;
- valuta EUR/GBP/USD persistente e inclusa nei backup;
- report settimanali con picco, spesa, streak corrente e record;
- preferenza lingua italiano/inglese per disclaimer e onboarding;
- test report e backup preferenze.

Verifiche eseguite:

- `npm test`: 12 test superati;
- `npm run build`: completata;
- browser: report, impostazioni lingua/valuta, tutorial e avvertenza riapribili;
- browser console: nessun errore.

Da completare:

- tradurre l'intera UI in inglese;
- portare spagnolo, francese e tedesco presenti su Android.

## Milestone 4 - Temi e rifinitura visuale

Stato: completata.

Completato:

- otto palette standard: classic, mint, spritz, night, blackout, dawn, margarita e blue lagoon;
- persistenza della palette selezionata e inclusione nel backup;
- regole di sblocco web equivalenti per beer bottle, vodka, day after, closed bar e broken heart;
- sblocchi persistenti e selezione volontaria dei temi segreti;
- atmosfere immersive CSS leggere;
- animazioni disattivate con `prefers-reduced-motion`;
- test automatici delle principali regole di sblocco.

Verifiche eseguite:

- `npm test`: 15 test superati;
- `npm run build`: completata;
- browser: applicazione esistente caricata senza regressioni;

Limite noto:

- gli sfondi segreti web preservano palette e atmosfera, ma non sono ancora copie visuali pixel-perfect dei Canvas Android.

## Milestone 5 - i18n e preparazione distribuzione

Stato: completata.

Completato:

- dizionario i18n centralizzato per evitare testi sparsi nella UI;
- interfaccia completa in italiano, inglese, spagnolo, francese e tedesco;
- selezione persistente di italiano, inglese, spagnolo, francese e tedesco;
- livelli BAC, suggerimenti di sicurezza, pasti, disclaimer e onboarding localizzati;
- catalogo drink e indizi dei temi segreti localizzati;
- locale corretto per date e formattazione;
- `lang` del documento aggiornato per VoiceOver;
- nomi accessibili per pulsanti icona, dialoghi e messaggi di errore;
- focus da tastiera visibile e layout mobile rinforzato sotto 430 px;
- PDF legale incluso nella precache offline;
- header di sicurezza e cache per hosting statico;
- guida Cloudflare Pages e installazione iPhone in `DEPLOYMENT.md`.

Verifiche eseguite:

- `npm test`: 25 test superati;
- `npm run build`: completata, service worker e manifest generati;
- preview di produzione: schermata disclaimer e PDF legale caricati;
- browser console: nessun errore.

Da completare prima del rilascio pubblico:

- collaudare modalita aereo, persistenza e installazione su un iPhone reale;
- ampliare nel tempo il dataset golden con ulteriori casi limite;
- opzionali: effetti Canvas pixel-perfect, fallback sensori e Web Push.
