// AI literacy: vier niveaus, modules hangen onder een niveau.
// Nieuwe module? Voeg hem hier toe met het juiste `level`. De leerlijn groeit vanzelf mee.

export type Level = { name: string; description: string };

export const LEVELS: Level[] = [
  { name: "Jezelf", description: "Je stem, goede vragen stellen, je eigen MD-files." },
  { name: "Koppelen", description: "Je mail, agenda en Plaud aan AI hangen." },
  { name: "Toepassen", description: "Vaste werkstromen die tijd teruggeven." },
  { name: "Bouwen", description: "Zelf kleine tools en automatiseringen maken." },
];

export type Prompt = {
  title: string;
  /** Vaste tekst, of… */
  text?: string;
  /** …het deel onder de eerste `---` uit een bestand in src/content/files. */
  fromFile?: string;
};

export type Module = {
  slug: string;
  level: number; // index in LEVELS
  title: string;
  short: string;
  intro: string[];
  steps: string[]; // **vet** mag
  prompts: Prompt[];
  files: { name: string; label: string }[];
  note?: string;
};

export const MODULES: Module[] = [
  {
    slug: "stem-md",
    level: 0,
    title: "Je eigen stem in een MD-file",
    short: "Laat je interviewen en bewaar je stemprofiel voor LinkedIn en mail.",
    intro: [
      "Je laat je door AI interviewen over hoe je schrijft. De uitkomst is een stemprofiel: een MD-bestand dat je steeds opnieuw meegeeft. Zo klinken posts en mails als jij, en niet als een AI die jou nadoet.",
      "Het stemprofiel bepaalt hoe het klinkt. De ILS-referentie zorgt dat de inhoud klopt. Samen geladen krijg je teksten die als jou klinken en trouw blijven aan de methode.",
    ],
    steps: [
      "**Zet drie voorbeelden klaar.** Voor LinkedIn: drie posts die je goed vindt (van jezelf of van anderen). Voor mail: drie eigen mails waar je tevreden over bent, zonder namen en gevoelige gegevens.",
      "**Open een nieuw gesprek** in Claude, Gemini of ChatGPT en plak de interviewprompt hieronder. Reken op ongeveer 20 minuten.",
      "**Beantwoord de 14 vragen.** Geef liever een echte zin dan een omschrijving. Inspreken mag ook.",
      "**Bewaar het eindbestand** als stem-linkedin.md of stem-mail.md.",
      "**Zet het vast.** In Claude maak je een Project, in Gemini een Gem, in ChatGPT een eigen GPT. Plak je stemprofiel in de instructies en voeg de ILS-referentie toe als kennisbestand. Daarna vraag je gewoon: schrijf een post over…",
    ],
    prompts: [
      { title: "Interview: LinkedIn-stem", fromFile: "interview-linkedin-stem.md" },
      { title: "Interview: e-mailstijl", fromFile: "interview-emailstijl.md" },
    ],
    files: [
      { name: "interview-linkedin-stem.md", label: "Interview LinkedIn-stem" },
      { name: "interview-emailstijl.md", label: "Interview e-mailstijl" },
      { name: "impeccable-leadership-referentie.md", label: "Impeccable Leadership-referentie" },
    ],
    note: "Liever geen vast Project? Upload je stemprofiel en de ILS-referentie aan het begin van een nieuw gesprek. Dat werkt in elke AI-tool.",
  },
  {
    slug: "koppelen",
    level: 1,
    title: "Gmail, agenda en Plaud koppelen",
    short: "Connectoren aanzetten en ze samen laten werken in één vraag.",
    intro: [
      "Een AI die je mail, agenda en gespreksnotities kan lezen, hoeft niet meer alles van jou te horen. Je vraagt: wat staat er morgen, en wat spraken we eerder af? Het antwoord komt uit je eigen bronnen.",
      "Werk hiervoor altijd met je @fpnp.nl-account. Koppel alleen wat je echt gebruikt.",
    ],
    steps: [
      "**Open in Claude de instellingen** en ga naar Connectors (in andere tools heet dit vaak ‘apps’ of ‘extensies’).",
      "**Koppel Gmail en Google Agenda** met je @fpnp.nl-account. Je geeft leesrechten; versturen gebeurt pas als jij dat vraagt en bevestigt.",
      "**Koppel Plaud** als je gesprekken opneemt. Dan kan AI je transcripten en samenvattingen meelezen.",
      "**Test met één vraag** die meerdere bronnen combineert, zoals de prompt hieronder.",
      "**Maak er een gewoonte van.** Bijvoorbeeld elke ochtend dezelfde vraag, of een vaste voorbereiding vóór een klantgesprek.",
    ],
    prompts: [
      {
        title: "Voorbereiding op morgen",
        text: "Kijk in mijn agenda naar de afspraken van morgen. Zoek per afspraak in mijn mail en in mijn Plaud-opnames wat ik eerder met deze mensen besprak of afsprak.\n\nGeef per afspraak:\n- wie het is en waar het over gaat\n- wat we de vorige keer afspraken\n- wat er nog openstaat, van mij of van hen\n- één vraag die ik kan stellen\n\nKort en zakelijk. Verzin niets: staat iets niet in mijn bronnen, zeg dat dan.",
      },
      {
        title: "Na een training of gesprek",
        text: "Lees mijn Plaud-opname van [gesprek/training van vandaag]. Maak een korte follow-upmail aan [naam] met de drie belangrijkste inzichten en de afspraken die we maakten. Schrijf in mijn stem (zie mijn stemprofiel). Laat de mail als concept staan, verstuur niets.",
      },
    ],
    files: [],
    note: "Twijfel je of iets gevoelig is, zoals klantinformatie of persoonlijke situaties van deelnemers? Vraag dan eerst Spar of David hoe je het het beste aanpakt.",
  },
  {
    slug: "linkedin-acquisitie",
    level: 2,
    title: "Van LinkedIn-export naar acquisitie",
    short: "Download je connecties en maak er een gericht acquisitiedocument van.",
    intro: [
      "Ongeveer 90 procent van ons werk komt uit het bestaande netwerk. Je LinkedIn-connecties zijn dus een goudmijn, maar ongeordend. Met een export en één goede prompt heb je in een half uur een lijst van mensen om weer eens te spreken, met een reden en een eerste zin.",
    ],
    steps: [
      "**Vraag je gegevens op bij LinkedIn.** Ga naar Instellingen en privacy → Gegevensprivacy → Een kopie van je gegevens downloaden. Kies alleen ‘Connecties’. Je krijgt een mail als het bestand klaarstaat, meestal binnen een half uur.",
      "**Download het zip-bestand** en haal er Connections.csv uit.",
      "**Upload het CSV-bestand** in een nieuw gesprek, samen met je stemprofiel als je dat hebt.",
      "**Plak de prompt hieronder** en vul in waar we nu op zoeken (bijvoorbeeld HR- en L&D-rollen, of een sector).",
      "**Loop de lijst zelf na.** AI kent je relatie niet. Schrap wie niet past en voeg toe wie ontbreekt.",
    ],
    prompts: [
      {
        title: "Acquisitiedocument uit je connecties",
        text: "Hierbij mijn LinkedIn-connecties (CSV). Ik werk als trainer en coach bij FP&P: leiderschap, teamontwikkeling, onderhandelen en organisatieverandering.\n\nStap 1. Filter op mensen die waarschijnlijk beslissen over of invloed hebben op leiderschaps- of teamontwikkeling: [bijvoorbeeld HR, L&D, directie, MT]. Let op functietitel en bedrijf.\n\nStap 2. Kies de 25 meest kansrijke. Geef per persoon in een tabel: naam, functie, bedrijf, waarom deze persoon kansrijk is (één zin), en een openingszin voor een persoonlijk bericht in mijn stem.\n\nStap 3. Groepeer de rest kort per sector, zodat ik later verder kan.\n\nVerzin geen informatie die niet in het bestand staat. Gebruik alleen wat er staat en zeg waar je twijfelt.",
      },
    ],
    files: [],
    note: "Je connectiegegevens zijn persoonsgegevens. Gebruik ze alleen voor je eigen acquisitie, en verwijder het bestand als je klaar bent.",
  },
];

export function modulesForLevel(level: number) {
  return MODULES.filter((m) => m.level === level);
}
