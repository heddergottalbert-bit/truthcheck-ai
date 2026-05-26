const SERVER_URL = "https://truthcheck-ai-production.up.railway.app";
const API_KEY = "fr-2026-xK9mQpL7vNs3";

// ── Vaste headers voor elke server aanvraag ───────────────────
const SERVER_HEADERS = {
  "Content-Type": "application/json"
};

// ── Voeg API sleutel toe aan elke request body ────────────────
function metSleutel(data) {
  return JSON.stringify({ ...data, apiKey: API_KEY });
}

const BETROUWBARE_DOMEINEN = [
  "nos.nl", "nrc.nl", "volkskrant.nl", "trouw.nl", "ad.nl",
  "rtlnieuws.nl", "nu.nl", "telegraaf.nl", "parool.nl",
  "reuters.com", "bbc.com", "apnews.com", "theguardian.com",
  "nytimes.com", "economist.com", "dw.com",
  "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov", "who.int",
  "rivm.nl", "mayoclinic.org", "healthline.com", "webmd.com",
  "medicalnewstoday.com", "nih.gov", "cdc.gov", "thuisarts.nl",
  "umcutrecht.nl", "lumc.nl", "amsterdamumc.nl",
  "nature.com", "sciencedirect.com", "science.org",
  "newscientist.com", "scientificamerican.com", "thelancet.com",
  "bmj.com", "nejm.org", "cell.com", "plos.org",
  "government.nl", "rijksoverheid.nl", "cbs.nl", "pbl.nl",
  "knaw.nl", "nwo.nl", "gezondheidsraad.nl",
  "un.org", "europa.eu", "worldbank.org", "imf.org",
  "oecd.org", "unicef.org", "amnesty.org", "hrw.org",
  "mit.edu", "stanford.edu", "arxiv.org", "ieee.org", "acm.org",
  "ipcc.ch", "knmi.nl", "milieucentraal.nl",
  "dnb.nl", "cpb.nl", "ftm.nl", "fd.nl",
  "snopes.com", "factcheck.org", "politifact.com",
  "nieuwscheckers.nl", "knack.be",
  "state.gov", "usa.gov", "belastingdienst.nl",
  "politie.nl", "rechtspraak.nl", "duo.nl", "svb.nl", "uwv.nl"
];

const LOKALE_NIEUWS_DOMEINEN = [
  "nos.nl", "nu.nl", "ad.nl", "telegraaf.nl", "rtlnieuws.nl",
  "nrc.nl", "volkskrant.nl", "trouw.nl", "parool.nl",
  "omroepwest.nl", "omroepgelderland.nl", "omroepbrabant.nl",
  "omroepzeeland.nl", "rtvnoord.nl", "rtvoost.nl",
  "omroepflevoland.nl", "nhnieuws.nl", "at5.nl",
  "omroepfriesland.nl", "rtvdrenthe.nl", "omroeplimburg.nl",
  "hartvannederland.nl", "metronieuws.nl",
  "reuters.com", "bbc.com", "apnews.com"
];

// ── Officiële veilige domeinen — nooit rood alarm ────────────
const VEILIGE_OFFICIELE_DOMEINEN = [
  "belastingdienst.nl", "digid.nl", "rijksoverheid.nl",
  "uwv.nl", "svb.nl", "duo.nl", "politie.nl", "rechtspraak.nl",
  "ind.nl", "cak.nl", "rdw.nl", "kvk.nl", "rvo.nl",
  "government.nl", "europa.eu", "ing.nl", "abnamro.nl",
  "rabobank.nl", "triodos.nl", "asr.nl", "aegon.nl",
  "google.com", "google.nl", "bing.com", "duckduckgo.com",
  "microsoft.com", "apple.com", "paypal.com"
];

// ── Zoekmaschine domeinen ────────────────────────────────────
const ZOEKMASCHINE_DOMEINEN = [
  "google.com", "google.nl", "bing.com", "duckduckgo.com",
  "yahoo.com", "startpage.com", "ecosia.org", "brave.com"
];

// ── Satire domeinen ──────────────────────────────────────────
const SATIRE_DOMEINEN = [
  "speld.nl", "dedebunker.nl", "hetkannietzijn.nl",
  "theonion.com", "nieuws.nl", "ditisnieuws.nl"
];

// ── Wetenschappelijke domeinen ────────────────────────────────
const WETENSCHAP_DOMEINEN = [
  "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov", "nature.com",
  "sciencedirect.com", "science.org", "thelancet.com",
  "bmj.com", "nejm.org", "cell.com", "plos.org",
  "newscientist.com", "scientificamerican.com", "arxiv.org",
  "ieee.org", "acm.org", "who.int", "rivm.nl",
  "knaw.nl", "nwo.nl", "gezondheidsraad.nl", "ipcc.ch"
];

// ── Nieuws domeinen ───────────────────────────────────────────
const NIEUWS_DOMEINEN = [
  "nos.nl", "nu.nl", "ad.nl", "telegraaf.nl", "rtlnieuws.nl",
  "nrc.nl", "volkskrant.nl", "trouw.nl", "parool.nl",
  "omroepwest.nl", "omroepgelderland.nl", "omroepbrabant.nl",
  "omroepzeeland.nl", "rtvnoord.nl", "rtvoost.nl",
  "omroepflevoland.nl", "nhnieuws.nl", "at5.nl",
  "omroepfriesland.nl", "rtvdrenthe.nl", "omroeplimburg.nl",
  "hartvannederland.nl", "metronieuws.nl",
  "reuters.com", "bbc.com", "apnews.com", "theguardian.com",
  "nytimes.com", "economist.com", "dw.com", "bbc.co.uk",
  "ftm.nl", "fd.nl", "nieuwscheckers.nl"
];

// ── Lifestyle domeinen ────────────────────────────────────────
const LIFESTYLE_DOMEINEN = [
  "menshealth.nl", "healthline.com", "voedingscentrum.nl",
  "gezondheidsnet.nl", "thuisarts.nl", "womanshealthmag.com",
  "women-s-health.nl", "prevention.com", "medicalnewstoday.com",
  "runnersworld.com", "runnersworld.nl", "bodyenfit.nl",
  "sportrusten.nl", "fitnessmagazine.nl", "bicycling.com",
  "triathlete.com", "cyclingnews.com",
  "vogue.com", "vogue.nl", "glamour.com", "glamour.nl",
  "cosmopolitan.com", "cosmopolitan.nl", "elle.com", "elle.nl",
  "libelle.nl", "margriet.nl", "flair.nl", "nina.be",
  "harpersbazaar.com", "instyle.com",
  "lifestylemagazine.nl", "gezondheidskrant.nl",
  "msn.com"
];

const OFFICIELE_DOMEINEN = {
  "green card": "dvprogram.state.gov",
  "diversity visa": "dvprogram.state.gov",
  "belastingdienst": "belastingdienst.nl",
  "digid": "digid.nl",
  "burger service nummer": "rijksoverheid.nl",
  "paspoort aanvragen": "rijksoverheid.nl",
  "ww uitkering": "uwv.nl",
  "aow uitkering": "svb.nl",
  "studiefinanciering": "duo.nl",
  "politie aangifte": "politie.nl",
  "verblijfsvergunning": "ind.nl",
  "ing bank inloggen": "ing.nl",
  "abn amro inloggen": "abnamro.nl",
  "rabobank inloggen": "rabobank.nl",
  "paypal inloggen": "paypal.com",
  "apple id": "apple.com",
  "microsoft account": "microsoft.com",
  "amazon bestelling": "amazon.com",
  "dhl pakket": "dhl.com",
  "postnl pakket": "postnl.nl"
};

const WEBSITE_PHISHING_WOORDEN = [
  "onmiddellijk", "verloopt", "verlopen",
  "geselecteerd", "gewonnen",
  "verificatie vereist", "account geblokkeerd",
  "bevestig uw", "update uw", "inloggen vereist",
  "laatste kans", "alleen vandaag", "u bent gekozen",
  "limited time", "act now", "you have been selected",
  "congratulations", "winner", "suspended", "verify now"
];

const EMAIL_PHISHING_WOORDEN = [
  "geef uw wachtwoord", "vul uw pincode in",
  "bankgegevens bevestigen", "creditcard gegevens",
  "uw rekening wordt geblokkeerd",
  "verify your bank", "enter your password",
  "confirm your credit card", "your account will be closed",
  "send money", "wire transfer", "western union",
  "million dollars", "inheritance", "next of kin",
  "dear sir/madam", "i am a widow", "suffering from",
  "few months to live", "transfer the amount",
  "god bless", "bless you"
];

// ── Emoji bepalen op basis van score en type ─────────────────
function bepaalEmoji(score, type) {
  if (type === "satire") return "😄";
  if (type === "deepfake") return "🤖";
  if (type === "phishing") return "😡";
  if (type === "laden") return "😐";
  if (type === "wetenschap") return "🎓";
  if (score >= 70) return "😊";
  if (score >= 40) return "😐";
  return "😦";
}

function domeinCheck(tekst, sleutel) {
  const patroon = new RegExp(
    "\\b" + sleutel.replace(/\s+/g, "\\s+") + "\\b", "i"
  );
  return patroon.test(tekst);
}

function isVeiligOfficieelDomein(domein) {
  return VEILIGE_OFFICIELE_DOMEINEN.some(d => domein.includes(d));
}

function isZoekmaschine(domein) {
  return ZOEKMASCHINE_DOMEINEN.some(d => domein.includes(d));
}

function isSatire(domein) {
  return SATIRE_DOMEINEN.some(d => domein.includes(d));
}

function isWetenschap(domein) {
  return WETENSCHAP_DOMEINEN.some(d => domein.includes(d));
}

function isNieuws(domein) {
  return NIEUWS_DOMEINEN.some(d => domein.includes(d));
}

function isLifestyle(domein) { return LIFESTYLE_DOMEINEN.some(d => domein.includes(d)); }

function naamMatchtDomein(afzenderNaam, afzenderDomein) {
  if (!afzenderNaam || !afzenderDomein) return true;
  if (afzenderDomein.startsWith("noreply") ||
      afzenderDomein.includes("no-reply") ||
      afzenderDomein.includes("notifications") ||
      afzenderDomein.includes("mail.") ||
      afzenderDomein.includes("mailing.") ||
      afzenderDomein.includes("newsletter")) {
    return true;
  }
  const naamWoorden = afzenderNaam
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);
  const domeinDelen = afzenderDomein.split(".");
  const hoofdDomein = domeinDelen.length >= 2
    ? domeinDelen[domeinDelen.length - 2]
    : afzenderDomein;
  const domeinTekst = afzenderDomein.replace(/\./g, " ");
  for (const woord of naamWoorden) {
    if (domeinTekst.includes(woord) ||
        hoofdDomein.includes(woord) ||
        woord.includes(hoofdDomein)) {
      return true;
    }
  }
  return false;
}

function berekenPhishingWebsite(request) {
  const paginaTekst = (request.paginaTekst || "").toLowerCase();
  const paginaTitel = (request.text || "").toLowerCase();
  const paginaDomein = request.domein || "";

  if (isSatire(paginaDomein)) {
    return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isSatire: true };
  }
  if (isWetenschap(paginaDomein)) {
    return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isWetenschap: true };
  }
  if (isNieuws(paginaDomein)) {
    return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isNieuws: true };
  }
  if (isLifestyle(paginaDomein)) {
    return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isLifestyle: true };
  }
  if (isVeiligOfficieelDomein(paginaDomein)) {
    return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isOfficieel: true };
  }

  let phishingScore = 0;
  const phishingSignalen = [];

  WEBSITE_PHISHING_WOORDEN.forEach(woord => {
    if (paginaTekst.includes(woord.toLowerCase())) {
      phishingScore += 15;
      phishingSignalen.push(woord);
    }
  });

  if (request.text === request.text.toUpperCase() && request.text.length > 5) {
    phishingScore += 20;
    phishingSignalen.push("Titel in hoofdletters");
  }

  let officieelDomein = null;
  Object.entries(OFFICIELE_DOMEINEN).forEach(([sleutel, domein]) => {
    if (domeinCheck(paginaTitel, sleutel) || domeinCheck(paginaTekst, sleutel)) {
      if (!paginaDomein.includes(domein.replace("www.", ""))) {
        officieelDomein = domein;
        phishingScore += 40;
        phishingSignalen.push(`Officiële site is ${domein}`);
      }
    }
  });

  const verdachtPatroon = /\d{3,}|(-service|-login|-secure|-verify|-update|-check|-controle)/i;
  if (verdachtPatroon.test(paginaDomein)) {
    phishingScore += 25;
    phishingSignalen.push("Verdacht domeinnaam patroon");
  }

  if (isZoekmaschine(paginaDomein)) {
    const heeftVerdachteSignalen = phishingScore >= 30;
    return {
      actief: heeftVerdachteSignalen,
      score: Math.min(phishingScore, 100),
      signalen: [...new Set(phishingSignalen)].slice(0, 4),
      officieelDomein,
      isEmail: false,
      isZoekmaschine: true,
      niveau: heeftVerdachteSignalen ? "waarschuwing" : "veilig"
    };
  }

  return {
    actief: phishingScore >= 30,
    score: Math.min(phishingScore, 100),
    signalen: [...new Set(phishingSignalen)].slice(0, 4),
    officieelDomein,
    isEmail: false,
    niveau: "gevaar"
  };
}

function berekenPhishingEmail(request) {
  const mailTekst = (request.paginaTekst || "").toLowerCase();
  const afzenderNaam = (request.afzenderNaam || "");
  const afzenderDomein = (request.afzenderDomein || "").toLowerCase();
  const afzenderEmail = (request.afzenderEmail || "").toLowerCase();
  let phishingScore = 0;
  const phishingSignalen = [];

  if (afzenderEmail.includes("noreply") || afzenderEmail.includes("no-reply")) {
    return { actief: false, score: 0, signalen: [], isEmail: true };
  }

  // ── Gratis emailprovider + zakelijke claim ───────────────────
  const GRATIS_PROVIDERS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com"];
  const ZAKELIJKE_WOORDEN = ["manager", "director", "ceo", "developer", "team", "company", "services", "marketing", "sales", "support"];
  const gebruiktGratisProvider = GRATIS_PROVIDERS.some(p => afzenderDomein === p);
  const claimetZakelijk = ZAKELIJKE_WOORDEN.some(w => mailTekst.includes(w) || afzenderNaam.toLowerCase().includes(w));
  if (gebruiktGratisProvider && claimetZakelijk) {
    phishingScore += 40;
    phishingSignalen.push("Zakelijke claim via gratis emailadres");
  }

  // ── Massamail kenmerk (bijv. "11." aan het begin) ────────────
  if (/^\d{1,3}\.\s/.test(mailTekst.trim())) {
    phishingScore += 25;
    phishingSignalen.push("Massamail kenmerk gedetecteerd");
  }

  // ── Functietitel geclaimd maar geen bedrijfsnaam ─────────────
  const BEDRIJF_PATRONEN = [
    /\bat\s+[A-Z][a-zA-Z]+\b/,
    /\bfrom\s+[A-Z][a-zA-Z]+\b/,
    /\bworks?\s+(at|for)\b/,
    /\bour\s+company\b/i,
    /\bour\s+website\b/i
  ];
  const heeftBedrijfsnaam = BEDRIJF_PATRONEN.some(p => p.test(request.paginaTekst || ""));
  const claimetFunctie = /\bi\s+am\s+\w+,?\s+(a\s+)?(marketing|sales|business|app|software|web)/i.test(request.paginaTekst || "");
  if (claimetFunctie && !heeftBedrijfsnaam) {
    phishingScore += 30;
    phishingSignalen.push("Functietitel zonder bedrijfsnaam");
  }

  // ── Vraagt om gegevens te delen ──────────────────────────────
  const DETAILS_WOORDEN = [
    "share your", "contact details", "send us your",
    "please share", "app requirements", "further discussion",
    "your requirements", "get in touch"
  ];
  const gevondenDetails = DETAILS_WOORDEN.filter(w => mailTekst.includes(w));
  if (gevondenDetails.length > 0) {
    phishingScore += 20;
    phishingSignalen.push("Vraagt om persoonlijke gegevens");
  }

  // ── Naam matcht niet met domein ──────────────────────────────
  if (!naamMatchtDomein(afzenderNaam, afzenderDomein)) {
    phishingScore += 60;
    phishingSignalen.push(`"${afzenderNaam}" stuurt niet via eigen domein`);
  }

  // ── Onderwerp in hoofdletters ────────────────────────────────
  if (request.text === request.text.toUpperCase() && request.text.length > 5) {
    phishingScore += 25;
    phishingSignalen.push("Onderwerp in hoofdletters");
  }

  // ── Financiële spam woorden ──────────────────────────────────
  const FINANCIELE_WOORDEN = [
    "loan", "funding", "investment", "financing", "withdrawal",
    "cryptocurrency", "wallet", "portfolio", "trading", "investors",
    "capital", "debt financing", "angel investors", "business loan"
  ];
  const gevondenFinancieel = FINANCIELE_WOORDEN.filter(w => mailTekst.includes(w));
  if (gevondenFinancieel.length >= 2) {
    phishingScore += 40;
    phishingSignalen.push("Financiële spam gedetecteerd");
  }

  // ── Bestaande phishing woorden ───────────────────────────────
  EMAIL_PHISHING_WOORDEN.forEach(woord => {
    if (mailTekst.includes(woord.toLowerCase())) {
      phishingScore += 25;
      phishingSignalen.push(woord);
    }
  });

  return {
    actief: phishingScore >= 60,
    score: Math.min(phishingScore, 100),
    signalen: [...new Set(phishingSignalen)].slice(0, 4),
    officieelDomein: null,
    isEmail: true,
    afzenderDomein: afzenderDomein
  };
}

function extraheerThemaViaServer(titel, artikelTekst) {
  return fetch(SERVER_URL + "/api/factcheck", {
    method: "POST",
    headers: SERVER_HEADERS,
    body: metSleutel({ text: titel + "\n\n" + artikelTekst })
  })
  .then(res => res.json())
  .then(data => ({
    hoofdthema: data.theme || titel.substring(0, 50),
    subthema: data.claim || ""
  }))
  .catch(() => ({ hoofdthema: titel.substring(0, 50), subthema: "" }));
}

// ── Herbruikbare factcheck-call met bronnen ───────────────────
function haalBronnenOp(request) {
  return fetch(SERVER_URL + "/api/factcheck", {
    method: "POST",
    headers: SERVER_HEADERS,
    body: metSleutel({
      text: request.text,
      artikelTekst: request.artikelTekst || "",
      domein: request.domein || ""
    })
  })
  .then(res => res.json())
  .then(data => (data.sources || []).map(r => r.url))
  .catch(() => []);
}

function checkAlleenReacties(reactiesTekst, sendResponse) {
  fetch(SERVER_URL + "/api/harmful", {
    method: "POST",
    headers: SERVER_HEADERS,
    body: metSleutel({ text: reactiesTekst })
  })
  .then(res => res.json())
  .then(data => {
    sendResponse({
      status: "success",
      alleenReactieCheck: true,
      strafbareContent: data.isHarmful || false,
      strafbaarArtikel: data.artikel || "",
      strafbaarCitaat: data.citaat || "",
      strafbaarUitleg: data.explanation || ""
    });
  })
  .catch(() => {
    sendResponse({
      status: "success",
      alleenReactieCheck: true,
      strafbareContent: false,
      strafbaarArtikel: "",
      strafbaarCitaat: "",
      strafbaarUitleg: ""
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_check") {

    if (request.alleenReactieCheck) {
      if (request.reactiesTekst && request.reactiesTekst.length > 10) {
        checkAlleenReacties(request.reactiesTekst, sendResponse);
      } else {
        sendResponse({ status: "success", alleenReactieCheck: true, strafbareContent: false });
      }
      return true;
    }

    // ── Politieke namen detectie voor TikTok/social media ───────
    const POLITIEKE_NAMEN = ["trump", "biden", "putin", "rutte", "wilders", "zelensky","xi jinping", "erdogan", "modi", "macron", "johnson", "scholz"];
    const captionTekst = (request.videoContext || request.paginaTekst || "").toLowerCase();
    const heeftPolitiekeNaam = POLITIEKE_NAMEN.some(n => captionTekst.includes(n));
    const isTikTok = request.domein && request.domein.includes("tiktok.com");

    // ── Video check — YouTube én TikTok met politieke content ────
    if (request.domein && (request.domein.includes("youtube.com") || request.domein.includes("youtu.be") || (isTikTok && heeftPolitiekeNaam)) && request.videoContext) {
      fetch(SERVER_URL + "/api/youtube", {
        method: "POST",
        headers: SERVER_HEADERS,
        body: metSleutel({
          titel: request.text || "",
          kanaal: request.videoContext.match(/Kanaal:\s*([^|]+)/)?.[1]?.trim() || "",
          abonnees: request.videoContext.match(/Abonnees:\s*([^|]+)/)?.[1]?.trim() || "",
          beschrijving: request.videoContext.match(/Beschrijving:\s*(.+)/s)?.[1]?.trim() || "",
          views: request.videoContext.match(/Views:\s*([^|]+)/)?.[1]?.trim() || "",
          aiContent: request.videoContext.match(/AI-content:\s*([^|]+)/)?.[1]?.trim() || "onbekend",
          tags: request.videoContext.match(/Tags:\s*([^|]+)/)?.[1]?.trim() || "",
          videoUrl: request.url || "",
          taal: request.taal || "nl"
        })
      })
      .then(res => res.json())
      .then(data => {
        const score = data.score || 50;
        const bronnen = (data.sources || []).map(r => r.url);
        const contentType = data.contentType || "normaal";
        const emoji = "👨‍🔧";
        const signalen = data.signals && data.signals.length > 0
          ? " Signalen: " + data.signals.join(", ") + "."
          : "";
        const metadataMelding = " ℹ️ Analyse gebaseerd op metadata, niet op video-inhoud.";
        sendResponse({
          status: "success",
          score: score,
          oordeel: data.theme || "YouTube video",
          uitleg: (data.explanation || "") + signalen + metadataMelding,
          bronnen: bronnen,
          bronType: score < 50 ? "weerlegging" : "verdieping",
          phishing: { actief: false },
          strafbareContent: false,
          emoji: emoji,
          type: "youtube",
          bronBekend: data.bronBekend || false,
          onderwerpVerifieerbaar: data.onderwerpVerifieerbaar || false,
          verificatieBronnen: data.verificatieBronnen || [],
          rodeVlaggen: data.rodeVlaggen || []
        });
      })
      .catch(() => sendResponse({ status: "error", message: "YouTube analyse mislukt" }));
      return true;
    }

    const phishing = request.isEmail
      ? berekenPhishingEmail(request)
      : berekenPhishingWebsite(request);

    if (phishing.isSatire) {
      sendResponse({
        status: "success", score: 50, oordeel: "Satirische content",
        uitleg: "Dit is een satirische website. De inhoud is bedoeld als humor en niet als feitelijke berichtgeving.",
        bronnen: [], phishing: { actief: false }, strafbareContent: false, emoji: "😄", type: "satire", claim: ""
      });
      return true;
    }

    if (phishing.isWetenschap) {
      sendResponse({
        status: "success", score: 50, oordeel: "Wetenschappelijke bron",
        uitleg: "Dit is een wetenschappelijke of academische website. Verificatiescore gebaseerd op beschikbare bronnen.",
        bronnen: [], phishing: { actief: false }, strafbareContent: false, emoji: "🎓", type: "wetenschap", claim: ""
      });
      return true;
    }

    if (phishing.isNieuws) {
      sendResponse({
        status: "success", score: 50, oordeel: "Nieuwsbron",
        uitleg: "Dit is een nieuwssite. Verificatiescore gebaseerd op onafhankelijke bronnen over deze specifieke claim.",
        bronnen: [], phishing: { actief: false }, strafbareContent: false, emoji: "😐", type: "nieuws", claim: ""
      });
      return true;
    }

    if (phishing.isLifestyle) {
      sendResponse({
        status: "success", score: 50, oordeel: "Lifestyle content",
        uitleg: "Dit is een lifestyle website. Controleer medische of voedingsadviezen altijd bij een professional.",
        bronnen: [], phishing: { actief: false }, strafbareContent: false, emoji: "🌿", type: "lifestyle", claim: ""
      });
      return true;
    }

    if (phishing.actief) {
      const isWaarschuwing = phishing.isZoekmaschine;
      sendResponse({
        status: "success",
        score: isWaarschuwing ? 45 : Math.max(5, 25 - phishing.score),
        oordeel: request.isEmail
          ? "Verdachte e-mail"
          : isWaarschuwing ? "Let op bij klikken" : "Verdachte site",
        uitleg: request.isEmail
          ? "De afzender klopt niet met het e-mailadres. Reageer niet en klik op geen enkele link."
          : isWaarschuwing
            ? "Controleer altijd de URL voordat je klikt. Phishing sites kunnen tussen zoekresultaten staan."
            : "Deze pagina bevat kenmerken van phishing of misleiding. Wees voorzichtig.",
        bronnen: [],
        phishing: phishing,
        strafbareContent: false,
        emoji: "😡",
        type: "phishing"
      });
      return true;
    }

    if (request.isEmail) {
      sendResponse({
        status: "success",
        score: 75,
        oordeel: "Geen gevaar gedetecteerd",
        uitleg: "Geen phishing signalen gevonden in deze e-mail.",
        bronnen: [],
        phishing: { actief: false },
        strafbareContent: false,
        emoji: "😊",
        type: "normaal"
      });
      return true;
    }

    const paginaDomein = request.domein || "";

    // ── Analyse bij laden — alleen OpenAI, snel ──────────────────
    const analysePromise = fetch(SERVER_URL + "/api/analyse", {
      method: "POST",
      headers: SERVER_HEADERS,
      body: metSleutel({
        text: request.text,
        artikelTekst: request.artikelTekst || ""
      })
    })
    .then(res => res.json())
    .catch(() => ({ score: 50, theme: "Onbekend", explanation: "Geen uitleg beschikbaar.", sources: [], aiTekst: 0, category: "normaal", claim: "" }));

    const strafbareContentPromise = request.reactiesTekst && request.reactiesTekst.length > 10
      ? fetch(SERVER_URL + "/api/harmful", {
          method: "POST",
          headers: SERVER_HEADERS,
          body: metSleutel({ text: request.reactiesTekst })
        })
        .then(res => res.json())
        .then(data => ({ strafbaar: data.isHarmful || false, artikel: data.artikel || "", citaat: data.citaat || "", uitleg: data.explanation || "" }))
        .catch(() => ({ strafbaar: false, artikel: "", citaat: "", uitleg: "" }))
      : Promise.resolve({ strafbaar: false });

    const visionPromise = request.afbeeldingUrl
      ? fetch(SERVER_URL + "/api/vision", {
          method: "POST",
          headers: SERVER_HEADERS,
          body: metSleutel({ afbeeldingUrl: request.afbeeldingUrl })
        })
        .then(res => res.json())
        .catch(() => ({ aiAfbeelding: 0, uitleg: "" }))
      : Promise.resolve({ aiAfbeelding: 0, uitleg: "" });

    Promise.all([analysePromise, strafbareContentPromise, visionPromise])
    .then(([data, strafbaarResultaat, visionResultaat]) => {
      const score = 50;
      const oordeel = data.theme || "Onbekend";
      const uitleg = data.explanation || "Geen uitleg beschikbaar.";
      const strafbareContent = strafbaarResultaat.strafbaar || false;
      const strafbaarArtikel = strafbaarResultaat.artikel || "";
      const strafbaarCitaat = strafbaarResultaat.citaat || "";
      const strafbaarUitleg = strafbaarResultaat.uitleg || "";
      const aiTekst = data.aiTekst || 0;
      const aiAfbeelding = visionResultaat.aiAfbeelding || 0;
      const aiScore = Math.max(aiTekst, aiAfbeelding);

      const category = data.category || "normaal";
      const emoji = "😐";

      const uitlegMetWaarschuwing = strafbareContent
        ? uitleg + " Let op: strafbare content gedetecteerd in de reacties."
        : uitleg;

      sendResponse({
        status: "success",
        score: score,
        oordeel: oordeel,
        uitleg: uitlegMetWaarschuwing,
        bronnen: [],
        bronRelevant: false,
        strafbareContent: strafbareContent,
        strafbaarArtikel: strafbaarArtikel,
        strafbaarCitaat: strafbaarCitaat,
        strafbaarUitleg: strafbaarUitleg,
        phishing: { actief: false },
        emoji: emoji,
        type: category,
        bronType: "verificatie",
        aiTekst: aiScore,
        claim: data.claim || "",
        bronBekend: false,
        onderwerpVerifieerbaar: false,
        verificatieBronnen: [],
        rodeVlaggen: []
      });
    })
    .catch(err => sendResponse({ status: "error", message: err.message }));

    return true;
  }

  if (request.action === "stuur_feedback") {
    fetch(SERVER_URL + "/api/feedback", {
      method: "POST",
      headers: SERVER_HEADERS,
      body: metSleutel({
        url: request.url || "",
        score: request.score || 0,
        oordeel: request.oordeel || "",
        duim: request.duim || "",
        tekst: request.tekst || "",
        timestamp: request.timestamp || new Date().toISOString()
      })
    })
    .then(res => res.json())
    .then(() => sendResponse({ status: "ok" }))
    .catch(() => sendResponse({ status: "ok" })); // Stille fout — feedback is niet kritiek
    return true;
  }

  if (request.action === "analyseer_transcript") {
    const videoId = (request.videoId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20);
    if (!videoId) {
      sendResponse({ error: "Geen geldig video ID." });
      return true;
    }
    fetch(SERVER_URL + "/api/transcript", {
      method: "POST",
      headers: SERVER_HEADERS,
      body: metSleutel({ videoId, taal: request.taal || "nl" })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        sendResponse({ error: data.error });
      } else {
        sendResponse({
          score: data.score,
          oordeel: data.oordeel,
          uitleg: data.uitleg,
          signalen: data.signalen || []
        });
      }
    })
    .catch(() => sendResponse({ error: "Transcript analyse mislukt." }));
    return true;
  }

  // ── Bronnen ophalen bij popup — Tavily verificatiescore ──────
  if (request.action === "haal_bronnen") {
    fetch(SERVER_URL + "/api/factcheck", {
      method: "POST",
      headers: SERVER_HEADERS,
      body: metSleutel({
        text: request.text || "",
        claim: request.claim || "",
        artikelTekst: request.artikelTekst || "",
        domein: request.domein || ""
      })
    })
    .then(res => res.json())
    .then(data => {
      const bronnen = (data.sources || []).map(r => r.url);
      const score = data.score || 50;
      const emoji = bepaalEmoji(score, "normaal");
      sendResponse({
        bronnen: bronnen,
        score: score,
        emoji: emoji,
        uitleg: data.explanation || "",
        bronBekend: data.bronBekend || false,
        onderwerpVerifieerbaar: data.onderwerpVerifieerbaar || false,
        verificatieBronnen: data.verificatieBronnen || [],
        rodeVlaggen: data.rodeVlaggen || []
      });
    })
    .catch(() => sendResponse({ bronnen: [], score: 50 }));
    return true;
  }

  // ── Vraagtekenfunctie ─────────────────────────────────────────
  if (request.action === "stel_vraag") {
    const { vraag, context, taal } = request;
    if (!vraag) { sendResponse({ antwoord: "Geen vraag ontvangen." }); return true; }

    fetch(SERVER_URL + "/api/vraag", {
      method: "POST",
      headers: SERVER_HEADERS,
      body: metSleutel({ vraag, context: context || "", taal: taal || "nl" })
    })
    .then(res => res.json())
    .then(data => sendResponse({ antwoord: data.antwoord || "Geen antwoord gevonden." }))
    .catch(() => sendResponse({ antwoord: "Kon geen antwoord ophalen." }));
    return true;
  }
});