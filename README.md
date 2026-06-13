# Sbronzometro Web

PWA offline-first installabile su Android e iPhone.

## Avvio locale

```powershell
npm install
npm run dev
```

Aprire l'indirizzo mostrato da Vite, normalmente `http://localhost:5173`.

## Verifiche

```powershell
npm test
npm run build
```

Per rigenerare il dataset golden dal calcolatore Android:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
..\SbronzometroCodexEnhanced\gradlew.bat testDebugUnitTest --tests com.swer4324.sbronzometro.BacGoldenExportTest
Copy-Item ..\SbronzometroCodexEnhanced\app\build\outputs\bac-golden.json src\domain\bac-golden.json -Force
npm test
```

## Funzionalita disponibili

- creazione e persistenza locale del profilo;
- modifica profilo e tasso di smaltimento personalizzato;
- profili multipli e selezione profilo attivo;
- cancellazione profilo con relativi drink e pasti;
- catalogo drink completo con preferiti;
- inserimento e modifica drink con gradazione, volume, prezzo e data/ora;
- drink personalizzati salvabili;
- inserimento e modifica pasti con data/ora;
- port TypeScript del calcolatore BAC Android;
- dataset golden generato da Android e confronto automatico Kotlin/TypeScript;
- Home con BAC, picco stimato e tempo sotto il limite;
- cronologia con eliminazione eventi;
- tema chiaro/scuro persistente;
- export e import backup JSON;
- manifest e service worker PWA per uso offline;
- disclaimer con accettazione termini e PDF legale;
- onboarding persistente e riapribile;
- report settimanali con picco, spesa e streak;
- UI completa in italiano, inglese, spagnolo, francese e tedesco;
- valuta EUR/GBP/USD persistente;
- otto palette standard derivate dall'app Android;
- cinque temi segreti con regole di sblocco persistenti;
- atmosfere CSS leggere e supporto `prefers-reduced-motion`.
- guida pubblicazione e installazione iPhone in `DEPLOYMENT.md`.

## Limiti della milestone

- il dataset golden copre cinque scenari rappresentativi e potra essere ampliato con ulteriori casi limite;
- il collaudo finale offline e installazione va eseguito su un iPhone reale;
- gli effetti immersivi web sono equivalenti leggeri, non copie pixel-perfect dei Canvas Android;
- notifiche e widget non fanno parte di questa milestone.
