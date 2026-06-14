# Distribuzione della WebApp

Per lavorare in locale:

```powershell
npm install
npm run dev
```

Per generare la build di produzione:

```powershell
npm test
npm run build
```

Per preparare GitHub Pages nel formato corretto:

```powershell
npm run pages
```

Questo comando:

- genera `dist/`;
- copia la build pronta dentro `docs/` del repository;
- lascia `node_modules/` fuori dal versionamento, come deve essere.

## GitHub Pages

1. Esegui `npm run pages`.
2. Verifica che nel repository esista `docs/index.html`.
3. Fai commit e push di `docs/` insieme ai sorgenti.
4. In GitHub Pages imposta:
   - `Deploy from branch`
   - branch `main`
   - folder `/docs`

Da non pubblicare:

- `SbronzometroWeb/index.html` come file statico aperto direttamente;
- `node_modules/`;
- `dist/` se usi GitHub Pages con `/docs`.

Il file `_headers` resta utile per hosting statici che lo supportano, ma GitHub Pages non applica quei custom headers.

## Installazione su iPhone

1. Apri l'indirizzo HTTPS della WebApp in Safari.
2. Tocca **Condividi**.
3. Tocca **Aggiungi alla schermata Home**, poi **Aggiungi**.
4. Avvia Sbronzometro dalla nuova icona e crea il profilo.

I dati restano nell'IndexedDB di Safari sul singolo dispositivo. Prima di cancellare dati Safari o cambiare iPhone, scarica il backup JSON da **Altro > Backup locale**.

## Checklist prima di condividere

- Verificare creazione profilo, drink, pasto e refresh su Safari iPhone.
- Chiudere e riaprire la PWA dalla schermata Home verificando la persistenza.
- Attivare modalità aereo e verificare Home, cronologia e PDF legale.
- Esportare un backup, eliminare un dato di prova e reimportarlo.
- Verificare tema chiaro/scuro, lingua e layout con testo ingrandito.
