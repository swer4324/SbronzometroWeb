import type { BacLevel, StomachState } from "./models";

export type Language = "it" | "en" | "es" | "fr" | "de";

export const languageNames: Record<Language, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch"
};

const translations = {
  it: {
    offline: "offline, sul tuo dispositivo", loading: "Sbronzometro sta preparando il bancone...", changeTheme: "Cambia tema",
    activeProfile: "Profilo attivo", years: "anni", estimatedPeak: "Picco stimato", underLimit: "Sotto 0,5", now: "Ora",
    addDrink: "Aggiungi drink", addMeal: "Aggiungi pasto", diary: "Diario", latestEvents: "Ultimi eventi", seeAll: "Vedi tutti",
    localPrivate: "Locale e privato", profiles: "Profili", new: "Nuovo", activate: "Attiva", edit: "Modifica", delete: "Elimina",
    onDevice: "Tutto sul dispositivo", history: "Cronologia", report: "Resoconto", weekly: "Settimana per settimana",
    reports: "Report", cleanWeek: "Ancora tutto pulito questa settimana.", drinks: "drink", maxPeak: "Picco massimo",
    totalSpent: "Spesa totale", currentStreak: "Streak corrente", weeklyRecord: "Record settimana",
    dataFirstAid: "Primo soccorso ai dati", settings: "Impostazioni", colorStyle: "Stile colori",
    colorStyleHelp: "Scegli la personalità del bancone. Chiaro e scuro restano indipendenti.", secretThemes: "Temi segreti",
    unlocked: "Sbloccato", unlockedCount: "{count} / {total} sbloccati. Gli sblocchi restano salvati sul dispositivo.",
    languageCurrency: "Lingua e valuta", language: "Lingua", currency: "Valuta", localBackup: "Backup locale",
    backupHelp: "Il profilo e la cronologia vivono in questo browser. Scarica periodicamente un backup, soprattutto prima di cancellare dati Safari.",
    downloadBackup: "Scarica backup JSON", importBackup: "Importa backup JSON", customDrinks: "Drink personalizzati",
    customHelp: "I drink salvati dal modulo completo compariranno in cima al selettore.", noCustom: "Nessun drink personalizzato.",
    importantReminder: "Promemoria importante", safetyReminder: "Questa app fornisce una stima teorica. Non usarla mai per decidere se guidare.",
    reviewIntro: "Rivedi introduzione", reviewWarning: "Rivedi avvertenza", home: "Home", log: "Storico", more: "Altro",
    editProfile: "Modifica profilo", newProfile: "Nuovo profilo", name: "Nome", weight: "Peso (kg)", height: "Altezza (cm)",
    age: "Età", biologicalSex: "Sesso biologico", male: "Maschio", female: "Femmina", customRate: "Tasso smaltimento personalizzato (opzionale)",
    saveProfile: "Salva profilo", editDrink: "Modifica drink", alcohol: "Gradazione (%)", volume: "Volume (ml)", price: "Prezzo",
    dateTime: "Data e ora", saveCustom: "Salva anche come drink personalizzato", saveChanges: "Salva modifiche",
    editMeal: "Modifica pasto", emptyEvents: "Nessun evento. Il diario è ancora immacolato.", close: "Chiudi", favorite: "Preferito",
    firstProfileEyebrow: "Si parte da qui", firstProfileTitle: "Il tuo profilo resta qui. La serata pure.",
    firstProfileHelp: "Crea il profilo una volta: peso, altezza ed età vengono conservati nel browser e usati per ogni stima.",
    createFirstProfile: "Crea il primo profilo", importConfirm: "Importare il backup sostituirà i dati presenti in questo browser. Continuare?",
    deleteEntryConfirm: "Eliminare questa voce?", readError: "Errore durante la lettura dei dati locali.", importError: "Import backup fallito.",
    day: "giorno", days: "giorni", androidBanner: "Scarica l'applicazione Android da Play Store", download: "Scarica"
  },
  en: {
    offline: "offline, on your device", loading: "Sbronzometro is setting up the bar...", changeTheme: "Change theme",
    activeProfile: "Active profile", years: "years", estimatedPeak: "Estimated peak", underLimit: "Below 0.5", now: "Now",
    addDrink: "Add drink", addMeal: "Add meal", diary: "Diary", latestEvents: "Latest events", seeAll: "See all",
    localPrivate: "Local and private", profiles: "Profiles", new: "New", activate: "Activate", edit: "Edit", delete: "Delete",
    onDevice: "All on this device", history: "History", report: "Report", weekly: "Week by week", reports: "Reports",
    cleanWeek: "Nothing logged this week yet.", drinks: "drinks", maxPeak: "Highest peak", totalSpent: "Total spent",
    currentStreak: "Current streak", weeklyRecord: "Weekly record", dataFirstAid: "Data first aid", settings: "Settings",
    colorStyle: "Color style", colorStyleHelp: "Choose the bar's personality. Light and dark mode remain independent.",
    secretThemes: "Secret themes", unlocked: "Unlocked", unlockedCount: "{count} / {total} unlocked. Unlocks stay on this device.",
    languageCurrency: "Language and currency", language: "Language", currency: "Currency", localBackup: "Local backup",
    backupHelp: "Your profile and history live in this browser. Download a backup regularly, especially before clearing Safari data.",
    downloadBackup: "Download JSON backup", importBackup: "Import JSON backup", customDrinks: "Custom drinks",
    customHelp: "Drinks saved from the full form appear at the top of the selector.", noCustom: "No custom drinks.",
    importantReminder: "Important reminder", safetyReminder: "This app provides a theoretical estimate. Never use it to decide whether to drive.",
    reviewIntro: "Review introduction", reviewWarning: "Review warning", home: "Home", log: "History", more: "More",
    editProfile: "Edit profile", newProfile: "New profile", name: "Name", weight: "Weight (kg)", height: "Height (cm)", age: "Age",
    biologicalSex: "Biological sex", male: "Male", female: "Female", customRate: "Custom elimination rate (optional)", saveProfile: "Save profile",
    editDrink: "Edit drink", alcohol: "Alcohol (%)", volume: "Volume (ml)", price: "Price", dateTime: "Date and time",
    saveCustom: "Also save as custom drink", saveChanges: "Save changes", editMeal: "Edit meal", emptyEvents: "No events yet. The diary is spotless.",
    close: "Close", favorite: "Favorite", firstProfileEyebrow: "Start here", firstProfileTitle: "Your profile stays here. Your night does too.",
    firstProfileHelp: "Create your profile once: weight, height and age stay in this browser and power every estimate.",
    createFirstProfile: "Create first profile", importConfirm: "Importing the backup will replace data in this browser. Continue?",
    deleteEntryConfirm: "Delete this entry?", readError: "Could not read local data.", importError: "Backup import failed.", day: "day", days: "days", androidBanner: "Download the Android app from Play Store", download: "Download"
  }
} as const;

type TranslationKey = keyof typeof translations.it;
const secondaryTranslations: Record<Exclude<Language, "it" | "en">, Record<TranslationKey, string>> = {
  es: {
    offline: "sin conexión, en tu dispositivo", loading: "Sbronzometro está preparando la barra...", changeTheme: "Cambiar tema",
    activeProfile: "Perfil activo", years: "años", estimatedPeak: "Pico estimado", underLimit: "Por debajo de 0,5", now: "Ahora",
    addDrink: "Añadir bebida", addMeal: "Añadir comida", diary: "Diario", latestEvents: "Últimos eventos", seeAll: "Ver todo",
    localPrivate: "Local y privado", profiles: "Perfiles", new: "Nuevo", activate: "Activar", edit: "Editar", delete: "Eliminar",
    onDevice: "Todo en este dispositivo", history: "Historial", report: "Informe", weekly: "Semana a semana", reports: "Informes",
    cleanWeek: "Todavía no hay nada registrado esta semana.", drinks: "bebidas", maxPeak: "Pico máximo", totalSpent: "Gasto total",
    currentStreak: "Racha actual", weeklyRecord: "Récord semanal", dataFirstAid: "Primeros auxilios para datos", settings: "Ajustes",
    colorStyle: "Estilo de color", colorStyleHelp: "Elige la personalidad de la barra. Los modos claro y oscuro son independientes.",
    secretThemes: "Temas secretos", unlocked: "Desbloqueado", unlockedCount: "{count} / {total} desbloqueados. Se guardan en este dispositivo.",
    languageCurrency: "Idioma y moneda", language: "Idioma", currency: "Moneda", localBackup: "Copia de seguridad local",
    backupHelp: "Tu perfil y tu historial viven en este navegador. Descarga una copia periódicamente, especialmente antes de borrar datos de Safari.",
    downloadBackup: "Descargar copia JSON", importBackup: "Importar copia JSON", customDrinks: "Bebidas personalizadas",
    customHelp: "Las bebidas guardadas desde el formulario completo aparecerán arriba.", noCustom: "No hay bebidas personalizadas.",
    importantReminder: "Recordatorio importante", safetyReminder: "Esta app ofrece una estimación teórica. Nunca la uses para decidir si conducir.",
    reviewIntro: "Revisar introducción", reviewWarning: "Revisar aviso", home: "Inicio", log: "Historial", more: "Más",
    editProfile: "Editar perfil", newProfile: "Nuevo perfil", name: "Nombre", weight: "Peso (kg)", height: "Altura (cm)", age: "Edad",
    biologicalSex: "Sexo biológico", male: "Masculino", female: "Femenino", customRate: "Tasa de eliminación personalizada (opcional)", saveProfile: "Guardar perfil",
    editDrink: "Editar bebida", alcohol: "Alcohol (%)", volume: "Volumen (ml)", price: "Precio", dateTime: "Fecha y hora",
    saveCustom: "Guardar también como bebida personalizada", saveChanges: "Guardar cambios", editMeal: "Editar comida",
    emptyEvents: "No hay eventos. El diario está impecable.", close: "Cerrar", favorite: "Favorito", firstProfileEyebrow: "Empieza aquí",
    firstProfileTitle: "Tu perfil se queda aquí. Tu noche también.", firstProfileHelp: "Crea tu perfil una vez: peso, altura y edad permanecen en este navegador para cada estimación.",
    createFirstProfile: "Crear primer perfil", importConfirm: "La importación sustituirá los datos de este navegador. ¿Continuar?",
    deleteEntryConfirm: "¿Eliminar esta entrada?", readError: "No se pudieron leer los datos locales.", importError: "Falló la importación.", day: "día", days: "días", androidBanner: "Descarga la aplicación Android desde Play Store", download: "Descargar"
  },
  fr: {
    offline: "hors ligne, sur votre appareil", loading: "Sbronzometro prépare le bar...", changeTheme: "Changer de thème",
    activeProfile: "Profil actif", years: "ans", estimatedPeak: "Pic estimé", underLimit: "Sous 0,5", now: "Maintenant",
    addDrink: "Ajouter une boisson", addMeal: "Ajouter un repas", diary: "Journal", latestEvents: "Derniers événements", seeAll: "Tout voir",
    localPrivate: "Local et privé", profiles: "Profils", new: "Nouveau", activate: "Activer", edit: "Modifier", delete: "Supprimer",
    onDevice: "Tout sur cet appareil", history: "Historique", report: "Bilan", weekly: "Semaine par semaine", reports: "Rapports",
    cleanWeek: "Rien d'enregistré cette semaine.", drinks: "boissons", maxPeak: "Pic maximal", totalSpent: "Dépense totale",
    currentStreak: "Série actuelle", weeklyRecord: "Record hebdomadaire", dataFirstAid: "Premiers secours des données", settings: "Réglages",
    colorStyle: "Style de couleurs", colorStyleHelp: "Choisissez la personnalité du bar. Les modes clair et sombre restent indépendants.",
    secretThemes: "Thèmes secrets", unlocked: "Débloqué", unlockedCount: "{count} / {total} débloqués. Ils restent enregistrés sur cet appareil.",
    languageCurrency: "Langue et devise", language: "Langue", currency: "Devise", localBackup: "Sauvegarde locale",
    backupHelp: "Votre profil et votre historique vivent dans ce navigateur. Téléchargez régulièrement une sauvegarde, surtout avant d'effacer Safari.",
    downloadBackup: "Télécharger la sauvegarde JSON", importBackup: "Importer une sauvegarde JSON", customDrinks: "Boissons personnalisées",
    customHelp: "Les boissons enregistrées via le formulaire complet apparaîtront en haut.", noCustom: "Aucune boisson personnalisée.",
    importantReminder: "Rappel important", safetyReminder: "Cette app fournit une estimation théorique. Ne l'utilisez jamais pour décider de conduire.",
    reviewIntro: "Revoir l'introduction", reviewWarning: "Revoir l'avertissement", home: "Accueil", log: "Historique", more: "Plus",
    editProfile: "Modifier le profil", newProfile: "Nouveau profil", name: "Nom", weight: "Poids (kg)", height: "Taille (cm)", age: "Âge",
    biologicalSex: "Sexe biologique", male: "Homme", female: "Femme", customRate: "Taux d'élimination personnalisé (facultatif)", saveProfile: "Enregistrer le profil",
    editDrink: "Modifier la boisson", alcohol: "Alcool (%)", volume: "Volume (ml)", price: "Prix", dateTime: "Date et heure",
    saveCustom: "Enregistrer aussi comme boisson personnalisée", saveChanges: "Enregistrer", editMeal: "Modifier le repas",
    emptyEvents: "Aucun événement. Le journal est impeccable.", close: "Fermer", favorite: "Favori", firstProfileEyebrow: "Commencez ici",
    firstProfileTitle: "Votre profil reste ici. Votre soirée aussi.", firstProfileHelp: "Créez votre profil une fois : poids, taille et âge restent dans ce navigateur pour chaque estimation.",
    createFirstProfile: "Créer le premier profil", importConfirm: "L'importation remplacera les données de ce navigateur. Continuer ?",
    deleteEntryConfirm: "Supprimer cette entrée ?", readError: "Impossible de lire les données locales.", importError: "Échec de l'importation.", day: "jour", days: "jours", androidBanner: "Téléchargez l'application Android sur le Play Store", download: "Télécharger"
  },
  de: {
    offline: "offline, auf deinem Gerät", loading: "Sbronzometro bereitet die Bar vor...", changeTheme: "Theme wechseln",
    activeProfile: "Aktives Profil", years: "Jahre", estimatedPeak: "Geschätzter Höchstwert", underLimit: "Unter 0,5", now: "Jetzt",
    addDrink: "Getränk hinzufügen", addMeal: "Mahlzeit hinzufügen", diary: "Tagebuch", latestEvents: "Letzte Ereignisse", seeAll: "Alle anzeigen",
    localPrivate: "Lokal und privat", profiles: "Profile", new: "Neu", activate: "Aktivieren", edit: "Bearbeiten", delete: "Löschen",
    onDevice: "Alles auf diesem Gerät", history: "Verlauf", report: "Bericht", weekly: "Woche für Woche", reports: "Berichte",
    cleanWeek: "Diese Woche wurde noch nichts erfasst.", drinks: "Getränke", maxPeak: "Höchster Wert", totalSpent: "Gesamtausgaben",
    currentStreak: "Aktuelle Serie", weeklyRecord: "Wochenrekord", dataFirstAid: "Erste Hilfe für Daten", settings: "Einstellungen",
    colorStyle: "Farbstil", colorStyleHelp: "Wähle die Persönlichkeit der Bar. Hell- und Dunkelmodus bleiben unabhängig.",
    secretThemes: "Geheime Themes", unlocked: "Freigeschaltet", unlockedCount: "{count} / {total} freigeschaltet. Sie bleiben auf diesem Gerät gespeichert.",
    languageCurrency: "Sprache und Währung", language: "Sprache", currency: "Währung", localBackup: "Lokales Backup",
    backupHelp: "Dein Profil und Verlauf befinden sich in diesem Browser. Lade regelmäßig ein Backup herunter, besonders vor dem Löschen von Safari-Daten.",
    downloadBackup: "JSON-Backup herunterladen", importBackup: "JSON-Backup importieren", customDrinks: "Eigene Getränke",
    customHelp: "Im vollständigen Formular gespeicherte Getränke erscheinen oben.", noCustom: "Keine eigenen Getränke.",
    importantReminder: "Wichtiger Hinweis", safetyReminder: "Diese App liefert eine theoretische Schätzung. Nutze sie niemals, um über das Fahren zu entscheiden.",
    reviewIntro: "Einführung erneut ansehen", reviewWarning: "Warnung erneut ansehen", home: "Start", log: "Verlauf", more: "Mehr",
    editProfile: "Profil bearbeiten", newProfile: "Neues Profil", name: "Name", weight: "Gewicht (kg)", height: "Größe (cm)", age: "Alter",
    biologicalSex: "Biologisches Geschlecht", male: "Männlich", female: "Weiblich", customRate: "Eigene Abbaurate (optional)", saveProfile: "Profil speichern",
    editDrink: "Getränk bearbeiten", alcohol: "Alkohol (%)", volume: "Volumen (ml)", price: "Preis", dateTime: "Datum und Uhrzeit",
    saveCustom: "Auch als eigenes Getränk speichern", saveChanges: "Änderungen speichern", editMeal: "Mahlzeit bearbeiten",
    emptyEvents: "Keine Ereignisse. Das Tagebuch ist noch makellos.", close: "Schließen", favorite: "Favorit", firstProfileEyebrow: "Hier starten",
    firstProfileTitle: "Dein Profil bleibt hier. Dein Abend auch.", firstProfileHelp: "Erstelle dein Profil einmal: Gewicht, Größe und Alter bleiben für jede Schätzung in diesem Browser.",
    createFirstProfile: "Erstes Profil erstellen", importConfirm: "Der Import ersetzt die Daten in diesem Browser. Fortfahren?",
    deleteEntryConfirm: "Diesen Eintrag löschen?", readError: "Lokale Daten konnten nicht gelesen werden.", importError: "Backup-Import fehlgeschlagen.", day: "Tag", days: "Tage", androidBanner: "Lade die Android-App im Play Store herunter", download: "Download"
  }
};

export function translate(language: Language, key: TranslationKey, values: Record<string, string | number> = {}): string {
  const source = language === "it" || language === "en" ? translations[language][key] : secondaryTranslations[language][key];
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), source);
}

export function localeFor(language: Language): string {
  return { it: "it-IT", en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE" }[language];
}

const mealTranslations: Record<Language, Record<StomachState, string>> = {
  it: { EMPTY: "Stomaco vuoto", LIGHT_MEAL: "Pasto leggero", MEDIUM_MEAL: "Pasto medio", FULL_MEAL: "Pasto completo" },
  en: { EMPTY: "Empty stomach", LIGHT_MEAL: "Light meal", MEDIUM_MEAL: "Medium meal", FULL_MEAL: "Full meal" },
  es: { EMPTY: "Estómago vacío", LIGHT_MEAL: "Comida ligera", MEDIUM_MEAL: "Comida media", FULL_MEAL: "Comida completa" },
  fr: { EMPTY: "Estomac vide", LIGHT_MEAL: "Repas léger", MEDIUM_MEAL: "Repas moyen", FULL_MEAL: "Repas complet" },
  de: { EMPTY: "Nüchterner Magen", LIGHT_MEAL: "Leichte Mahlzeit", MEDIUM_MEAL: "Mittlere Mahlzeit", FULL_MEAL: "Volle Mahlzeit" }
};

const levelTranslations: Record<Language, Record<BacLevel, [string, string]>> = {
  it: { SOBER_SAFE: ["Sobrio", "Sei perfettamente sobrio."], LIGHT: ["Leggero", "Sotto il limite legale, ma presta attenzione."], TIPSY: ["Allegro", "Sotto il limite legale, ma presta attenzione."], OVER_LIMIT: ["Oltre il limite", "LIMITE SUPERATO. Non guidare."], PENAL_RISK: ["Rischio penale", "RISCHIO PENALE. Non guidare."], SEVERE_EBRIETY: ["Ebbrezza grave", "EBBREZZA GRAVE. Resta con qualcuno."], CRITICAL_DANGER: ["Pericolo critico", "PERICOLO CRITICO. Chiama i soccorsi."] },
  en: { SOBER_SAFE: ["Sober", "You are completely sober."], LIGHT: ["Light", "Below the legal limit, but stay careful."], TIPSY: ["Tipsy", "Below the legal limit, but stay careful."], OVER_LIMIT: ["Over the limit", "LIMIT EXCEEDED. Do not drive."], PENAL_RISK: ["Criminal risk", "CRIMINAL RISK. Do not drive."], SEVERE_EBRIETY: ["Severe intoxication", "SEVERE INTOXICATION. Stay with someone."], CRITICAL_DANGER: ["Critical danger", "CRITICAL DANGER. Call emergency services."] },
  es: { SOBER_SAFE: ["Sobrio", "Estás completamente sobrio."], LIGHT: ["Leve", "Por debajo del límite legal, pero ten cuidado."], TIPSY: ["Alegre", "Por debajo del límite legal, pero ten cuidado."], OVER_LIMIT: ["Sobre el límite", "LÍMITE SUPERADO. No conduzcas."], PENAL_RISK: ["Riesgo penal", "RIESGO PENAL. No conduzcas."], SEVERE_EBRIETY: ["Intoxicación grave", "INTOXICACIÓN GRAVE. Quédate con alguien."], CRITICAL_DANGER: ["Peligro crítico", "PELIGRO CRÍTICO. Llama a emergencias."] },
  fr: { SOBER_SAFE: ["Sobre", "Vous êtes parfaitement sobre."], LIGHT: ["Léger", "Sous la limite légale, mais restez prudent."], TIPSY: ["Éméché", "Sous la limite légale, mais restez prudent."], OVER_LIMIT: ["Au-dessus de la limite", "LIMITE DÉPASSÉE. Ne conduisez pas."], PENAL_RISK: ["Risque pénal", "RISQUE PÉNAL. Ne conduisez pas."], SEVERE_EBRIETY: ["Ivresse grave", "IVRESSE GRAVE. Restez avec quelqu'un."], CRITICAL_DANGER: ["Danger critique", "DANGER CRITIQUE. Appelez les secours."] },
  de: { SOBER_SAFE: ["Nüchtern", "Du bist vollständig nüchtern."], LIGHT: ["Leicht", "Unter dem gesetzlichen Grenzwert, aber bleib vorsichtig."], TIPSY: ["Angetrunken", "Unter dem gesetzlichen Grenzwert, aber bleib vorsichtig."], OVER_LIMIT: ["Über dem Grenzwert", "GRENZWERT ÜBERSCHRITTEN. Nicht fahren."], PENAL_RISK: ["Strafrechtliches Risiko", "STRAFRECHTLICHES RISIKO. Nicht fahren."], SEVERE_EBRIETY: ["Schwere Trunkenheit", "SCHWERE TRUNKENHEIT. Bleib bei jemandem."], CRITICAL_DANGER: ["Kritische Gefahr", "KRITISCHE GEFAHR. Ruf den Notdienst."] }
};

export const mealLabel = (language: Language, state: StomachState) => mealTranslations[language][state];
export const bacLevelLabel = (language: Language, level: BacLevel) => levelTranslations[language][level][0];
export const bacSuggestion = (language: Language, level: BacLevel) => levelTranslations[language][level][1];

export const disclaimerTranslations: Record<Language, [string, string, string, string, string, string, string]> = {
  it: ["Prima della serata", "Parliamoci chiaro.", "Sbronzometro mostra stime teoriche. Metabolismo, farmaci, stanchezza e condizioni personali possono cambiare completamente il risultato.", "I risultati non hanno valore legale. Se bevi, non guidare, anche se il valore mostrato sembra basso.", "Leggi i documenti legali (PDF)", "Accetto i Termini e le Condizioni", "Ho capito, continua"],
  en: ["Before the fun", "Real talk.", "Sbronzometro shows theoretical estimates. Medication, tiredness and personal factors can completely change the result.", "Results have no legal value. If you drink, do not drive, even when the displayed value looks low.", "Read Terms and Conditions (PDF)", "I accept the Terms and Conditions", "I understand, continue"],
  es: ["Antes de la noche", "Hablemos claro.", "Sbronzometro muestra estimaciones teóricas. El metabolismo, los medicamentos, el cansancio y otros factores personales pueden cambiar totalmente el resultado.", "Los resultados no tienen valor legal. Si bebes, no conduzcas, aunque el valor mostrado parezca bajo.", "Leer términos y condiciones (PDF)", "Acepto los términos y condiciones", "Entendido, continuar"],
  fr: ["Avant la soirée", "Soyons clairs.", "Sbronzometro affiche des estimations théoriques. Le métabolisme, les médicaments, la fatigue et les facteurs personnels peuvent totalement modifier le résultat.", "Les résultats n'ont aucune valeur légale. Si vous buvez, ne conduisez pas, même si la valeur affichée semble faible.", "Lire les conditions générales (PDF)", "J'accepte les conditions générales", "J'ai compris, continuer"],
  de: ["Vor dem Abend", "Reden wir Klartext.", "Sbronzometro zeigt theoretische Schätzungen. Stoffwechsel, Medikamente, Müdigkeit und persönliche Faktoren können das Ergebnis vollständig verändern.", "Die Ergebnisse haben keine rechtliche Gültigkeit. Wenn du trinkst, fahre nicht, auch wenn der angezeigte Wert niedrig erscheint.", "Bedingungen lesen (PDF)", "Ich akzeptiere die Bedingungen", "Verstanden, weiter"]
};

export const onboardingTranslations: Record<Language, { steps: [string, string, string][]; next: string; ready: string; skip: string }> = {
  it: { steps: [["Benvenuto su Sbronzometro", "Il compagno offline per tenere il filo della serata senza raccontarti favole.", "🍻"], ["1. Crea il profilo", "Peso, altezza, età e sesso biologico servono al calcolo. Li inserisci una volta e restano sul dispositivo.", "♙"], ["2. Segna drink e pasti", "Ogni drink cambia la stima. Anche il cibo conta perché rallenta l'assorbimento.", "＋"], ["3. Leggi l'indicatore", "Il valore è una stima e il punto rosso indica il picco previsto. Se bevi, non guidare.", "◔"]], next: "Avanti", ready: "Andiamo!", skip: "Salta introduzione" },
  en: { steps: [["Welcome to Sbronzometro", "Your offline companion for keeping track of the night without pretending estimates are certainty.", "🍻"], ["1. Create your profile", "Weight, height, age and biological sex power the estimate. Enter them once and they stay on device.", "♙"], ["2. Track drinks and meals", "Every drink changes the estimate. Food matters because it slows absorption.", "＋"], ["3. Read the gauge", "The value is only an estimate and the red point is the projected peak. If you drink, do not drive.", "◔"]], next: "Next", ready: "Ready", skip: "Skip tour" },
  es: { steps: [["Bienvenido a Sbronzometro", "Tu compañero sin conexión para seguir la noche sin confundir estimaciones con certezas.", "🍻"], ["1. Crea tu perfil", "El peso, la altura, la edad y el sexo biológico alimentan la estimación. Se guardan en el dispositivo.", "♙"], ["2. Registra bebidas y comidas", "Cada bebida cambia la estimación. La comida también importa porque ralentiza la absorción.", "＋"], ["3. Lee el indicador", "El valor es solo una estimación y el punto rojo indica el pico previsto. Si bebes, no conduzcas.", "◔"]], next: "Siguiente", ready: "Empezar", skip: "Saltar introducción" },
  fr: { steps: [["Bienvenue sur Sbronzometro", "Votre compagnon hors ligne pour suivre la soirée sans confondre estimation et certitude.", "🍻"], ["1. Créez votre profil", "Poids, taille, âge et sexe biologique alimentent l'estimation. Ils restent sur l'appareil.", "♙"], ["2. Notez boissons et repas", "Chaque boisson modifie l'estimation. La nourriture compte aussi car elle ralentit l'absorption.", "＋"], ["3. Lisez l'indicateur", "La valeur n'est qu'une estimation et le point rouge indique le pic prévu. Si vous buvez, ne conduisez pas.", "◔"]], next: "Suivant", ready: "Commencer", skip: "Passer l'introduction" },
  de: { steps: [["Willkommen bei Sbronzometro", "Dein Offline-Begleiter für den Abend, ohne Schätzungen als Gewissheit auszugeben.", "🍻"], ["1. Erstelle dein Profil", "Gewicht, Größe, Alter und biologisches Geschlecht fließen in die Schätzung ein und bleiben auf dem Gerät.", "♙"], ["2. Erfasse Getränke und Mahlzeiten", "Jedes Getränk verändert die Schätzung. Essen zählt ebenfalls, weil es die Aufnahme verlangsamt.", "＋"], ["3. Lies die Anzeige", "Der Wert ist nur eine Schätzung, der rote Punkt zeigt den erwarteten Höchstwert. Wenn du trinkst, fahre nicht.", "◔"]], next: "Weiter", ready: "Los geht's", skip: "Einführung überspringen" }
};

const drinkNames: Record<Exclude<Language, "it">, Record<string, string>> = {
  en: { "beer-small": "Small beer", "beer-medium": "Medium beer", "beer-bottle": "Bottled/canned beer", "beer-large": "Large beer", "beer-strong": "Strong beer", "wine-red": "Glass of red wine", "wine-white": "Glass of white wine", prosecco: "Prosecco / sparkling wine", spritz: "Spritz", "gin-tonic": "Gin and tonic", "vodka-lemon": "Vodka lemon", "rum-cola": "Rum and cola", mojito: "Mojito", negroni: "Negroni", americano: "Americano", margarita: "Margarita", "long-island": "Long Island", shot: "Shot", whisky: "Whisky", amaro: "Amaro", limoncello: "Limoncello" },
  es: { "beer-small": "Cerveza pequeña", "beer-medium": "Cerveza mediana", "beer-bottle": "Cerveza en botella/lata", "beer-large": "Cerveza grande", "beer-strong": "Cerveza fuerte", "wine-red": "Copa de vino tinto", "wine-white": "Copa de vino blanco", prosecco: "Prosecco / espumoso", spritz: "Spritz", "gin-tonic": "Gin tonic", "vodka-lemon": "Vodka limón", "rum-cola": "Ron con cola", mojito: "Mojito", negroni: "Negroni", americano: "Americano", margarita: "Margarita", "long-island": "Long Island", shot: "Chupito", whisky: "Whisky", amaro: "Amaro", limoncello: "Limoncello" },
  fr: { "beer-small": "Petite bière", "beer-medium": "Bière moyenne", "beer-bottle": "Bière en bouteille/canette", "beer-large": "Grande bière", "beer-strong": "Bière forte", "wine-red": "Verre de vin rouge", "wine-white": "Verre de vin blanc", prosecco: "Prosecco / vin pétillant", spritz: "Spritz", "gin-tonic": "Gin tonic", "vodka-lemon": "Vodka citron", "rum-cola": "Rhum coca", mojito: "Mojito", negroni: "Negroni", americano: "Americano", margarita: "Margarita", "long-island": "Long Island", shot: "Shot", whisky: "Whisky", amaro: "Amaro", limoncello: "Limoncello" },
  de: { "beer-small": "Kleines Bier", "beer-medium": "Mittleres Bier", "beer-bottle": "Flaschen-/Dosenbier", "beer-large": "Großes Bier", "beer-strong": "Starkbier", "wine-red": "Glas Rotwein", "wine-white": "Glas Weißwein", prosecco: "Prosecco / Schaumwein", spritz: "Spritz", "gin-tonic": "Gin Tonic", "vodka-lemon": "Wodka Lemon", "rum-cola": "Rum Cola", mojito: "Mojito", negroni: "Negroni", americano: "Americano", margarita: "Margarita", "long-island": "Long Island", shot: "Shot", whisky: "Whisky", amaro: "Amaro", limoncello: "Limoncello" }
};

const secretThemeText: Record<Exclude<Language, "it">, Record<string, [string, string]>> = {
  en: { beer_bottle: ["Beer bottle", "A decidedly malty day."], vodka: ["Universe in a bottle", "A marathon in the last 24 hours."], tomorrow_aftermath: ["The day after...", "A session crossing midnight."], closed_bar: ["Closed bar", "Stop by when everyone is asleep."], broken_heart: ["Broken heart", "A week that leaves its mark."] },
  es: { beer_bottle: ["Botella de cerveza", "Un día decididamente maltoso."], vodka: ["Universo en una botella", "Un maratón en las últimas 24 horas."], tomorrow_aftermath: ["El día después...", "Una sesión que cruza la medianoche."], closed_bar: ["Bar cerrado", "Pasa cuando todos duermen."], broken_heart: ["Corazón roto", "Una semana que deja huella."] },
  fr: { beer_bottle: ["Bouteille de bière", "Une journée résolument maltée."], vodka: ["Univers en bouteille", "Un marathon durant les dernières 24 heures."], tomorrow_aftermath: ["Le lendemain...", "Une session qui traverse minuit."], closed_bar: ["Bar fermé", "Passez quand tout le monde dort."], broken_heart: ["Cœur brisé", "Une semaine qui laisse des traces."] },
  de: { beer_bottle: ["Bierflasche", "Ein ausgesprochen malziger Tag."], vodka: ["Universum in der Flasche", "Ein Marathon in den letzten 24 Stunden."], tomorrow_aftermath: ["Der Tag danach...", "Eine Runde über Mitternacht hinaus."], closed_bar: ["Bar geschlossen", "Komm vorbei, wenn alle schlafen."], broken_heart: ["Gebrochenes Herz", "Eine Woche, die Spuren hinterlässt."] }
};

export const drinkTemplateName = (language: Language, id: string, italianName: string) => language === "it" ? italianName : drinkNames[language][id] ?? italianName;
export const secretThemeTranslation = (language: Language, id: string, italianName: string, italianHint: string): [string, string] => language === "it" ? [italianName, italianHint] : secretThemeText[language][id] ?? [italianName, italianHint];
