const SERVER_URL = "https://truthcheck-ai-production.up.railway.app";

// ── Domeincategorieën ────────────────────────────────────────

const VEILIGE_OFFICIELE_DOMEINEN = [
  "belastingdienst.nl", "digid.nl", "rijksoverheid.nl",
  "uwv.nl", "svb.nl", "duo.nl", "politie.nl", "rechtspraak.nl",
  "ind.nl", "cak.nl", "rdw.nl", "kvk.nl", "rvo.nl",
  "government.nl", "europa.eu", "ing.nl", "abnamro.nl",
  "rabobank.nl", "triodos.nl", "asr.nl", "aegon.nl",
  "google.com", "google.nl", "bing.com", "duckduckgo.com",
  "microsoft.com", "apple.com", "paypal.com"
];

const ZOEKMASCHINE_DOMEINEN = [
  "google.com", "google.nl", "bing.com", "duckduckgo.com",
  "yahoo.com", "startpage.com", "ecosia.org", "brave.com"
];

const SATIRE_DOMEINEN = [
  "speld.nl", "dedebunker.nl", "hetkannietzijn.nl",
  "theonion.com", "nieuws.nl", "ditisnieuws.nl"
];

const WETENSCHAP_DOMEINEN = [
  "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov", "nature.com",
  "sciencedirect.com", "science.org", "thelancet.com",
  "bmj.com", "nejm.org", "cell.com", "plos.org",
  "newscientist.com", "scientificamerican.com", "arxiv.org",
  "ieee.org", "acm.org", "who.int", "rivm.nl",
  "knaw.nl", "nwo.nl", "gezondheidsraad.nl", "ipcc.ch"
];

const NIEUWS_DOMEINEN = [
  "nos.nl", "nu.nl", "ad.nl", "telegraaf.nl", "rtlnieuws.nl",
  "nrc.nl", "volkskrant.nl", "trouw.nl", "parool.nl",
  "omroepwest.nl", "omroepgelderland.nl", "omroepbrabant.nl",
  "omroepzeeland.nl", "rtvnoord.nl", "rtvoost.nl",
  "omroepflevoland.nl", "nhnieuws.nl", "at5.nl",
  "omroepfriesland.nl", "rtvdrenthe.nl", "omroeplimburg.nl",
  "hartvannederland.nl", "metronieuws.nl",
  "reuters.com", "bbc.com", "bbc.co.uk", "apnews.com",
  "theguardian.com", "nytimes.com", "economist.com", "dw.com",
  "ftm.nl", "fd.nl", "nieuwscheckers.nl"
];

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

function domeinCheck(tekst, sleutel) {
  const patroon = new RegExp("\\b" + sleutel.replace(/\s+/g, "\\s+") + "\\b", "i");
  return patroon.test(tekst);
}

function isVeiligOfficieelDomein(domein) { return VEILIGE_OFFICIELE_DOMEINEN.some(d => domein.includes(d)); }
function isZoekmaschine(domein) { return ZOEKMASCHINE_DOMEINEN.some(d => domein.includes(d)); }
function isSatire(domein) { return SATIRE_DOMEINEN.some(d => domein.includes(d)); }
function isWetenschap(domein) { return WETENSCHAP_DOMEINEN.some(d => domein.includes(d)); }
function isNieuws(domein) { return NIEUWS_DOMEINEN.some(d => domein.includes(d)); }
function isLifestyle(domein) { return LIFESTYLE_DOMEINEN.some(d => domein.includes(d)); }
function isYouTube(domein) { return domein.includes("youtube.com") || domein.includes("youtu.be"); }

const YOUTUBE_CLICKBAIT_WOORDEN = [
  "shocking", "you won't believe", "they don't want you to know",
  "exposed", "banned", "censored", "truth about", "wake up",
  "dit willen ze niet", "verboden", "gecensureerd", "de waarheid over",
  "wat niemand je vertelt", "opgepakt", "geheim", "illuminati",
  "schokkend", "ze verbergen", "bewijs dat", "dit is het bewijs",
  "deepfake", "deep fake", "nep video", "fake video",
  "ai generated", "ai gegenereerd", "niet echt", "neppe",
  "ai downfall", "ai video", "miniverse", "ai moments",
  "artificial intelligence generated", "made with ai", "gemaakt met ai"
];

const YOUTUBE_BETROUWBARE_KANALEN = [
  "nos", "bbc", "reuters", "nos journaal", "nieuwsuur",
  "tegenlicht", "vpro", "npo", "rtl nieuws", "at5",
  "ted", "ted-ed", "vsauce", "veritasium", "kurzgesagt",
  "national geographic", "nasa", "who", "unicef"
];

function bepaalEmoji(score, type) {
  if (type === "satire")     return "😄";
  if (type === "deepfake")   return "🤖";
  if (type === "phishing")   return "😡";
  if (type === "laden")      return "🤔";
  if (type === "wetenschap") return "🎓";
  if (type === "nieuws")     return "😊";
  if (type === "lifestyle")  return "🌿";
  if (type === "youtube")    return "📺";
  if (score >= 70) return "😊";
  if (score >= 50) return "😟";
  return "😡";
}

function naamMatchtDomein(afzenderNaam, afzenderDomein) {
  if (!afzenderNaam || !afzenderDomein) return true;
  const uitzonderingen = ["noreply", "no-reply", "notifications", "mail.", "mailing.", "newsletter"];
  if (uitzonderingen.some(u => afzenderDomein.includes(u))) return true;
  const naamWoorden = afzenderNaam.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2);
  const domeinDelen = afzenderDomein.split(".");
  const hoofdDomein = domeinDelen.length >= 2 ? domeinDelen[domeinDelen.length - 2] : afzenderDomein;
  const domeinTekst = afzenderDomein.replace(/\./g, " ");
  return naamWoorden.some(w => domeinTekst.includes(w) || hoofdDomein.includes(w) || w.includes(hoofdDomein));
}

function berekenPhishingWebsite(request) {
  const paginaTekst  = (request.paginaTekst || "").toLowerCase();
  const paginaTitel  = (request.text || "").toLowerCase();
  const paginaDomein = request.domein || "";

  if (isSatire(paginaDomein))    return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isSatire: true };
  if (isWetenschap(paginaDomein)) return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isWetenschap: true };
  if (isNieuws(paginaDomein))    return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isNieuws: true };
  if (isLifestyle(paginaDomein)) return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isLifestyle: true };
  if (isYouTube(paginaDomein))   return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isYouTube: true };
  if (isVeiligOfficieelDomein(paginaDomein)) return { actief: false, score: 0, signalen: [], officieelDomein: null, isEmail: false, isOfficieel: true };

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

  const domeinZonderTLD = paginaDomein.replace(/\.(com|nl|net|org|io)$/, "");
  const heeftUTM = (request.url || "").includes("utm_");
  const langeMeaninglessDomein = domeinZonderTLD.length > 15 && !/^(www|mail|shop|blog|news|app)/.test(domeinZonderTLD);
  if (heeftUTM && langeMeaninglessDomein) {
    phishingScore += 35;
    phishingSignalen.push("Misleidende advertentielink");
  }

  if (isZoekmaschine(paginaDomein)) {
    const heeftVerdacht = phishingScore >= 30;
    return { actief: heeftVerdacht, score: Math.min(phishingScore, 100), signalen: [...new Set(phishingSignalen)].slice(0, 4), officieelDomein, isEmail: false, isZoekmaschine: true, niveau: heeftVerdacht ? "waarschuwing" : "veilig" };
  }

  return { actief: phishingScore >= 30, score: Math.min(phishingScore, 100), signalen: [...new Set(phishingSignalen)].slice(0, 4), officieelDomein, isEmail: false, niveau: "gevaar" };
}

function berekenPhishingEmail(request) {
  const mailTekst      = (request.paginaTekst || "").toLowerCase();
  const afzenderNaam   = request.afzenderNaam  || "";
  const afzenderDomein = (request.afzenderDomein || "").toLowerCase();
  const afzenderEmail  = (request.afzenderEmail || "").toLowerCase();

  let phishingScore = 0;
  const phishingSignalen = [];

  if (afzenderEmail.includes("noreply") || afzenderEmail.includes("no-reply")) phishingScore += 5;
  if (!naamMatchtDomein(afzenderNaam, afzenderDomein)) { phishingScore += 35; phishingSignalen.push("Naam past niet bij domein"); }
  if (request.isSpam) { phishingScore += 30; phishingSignalen.push("In spammap gevonden"); }

  EMAIL_PHISHING_WOORDEN.forEach(woord => {
    if (mailTekst.includes(woord.toLowerCase())) { phishingScore += 25; phishingSignalen.push(woord); }
  });

  return { actief: phishingScore >= 60, score: Math.min(phishingScore, 100), signalen: [...new Set(phishingSignalen)].slice(0, 4), officieelDomein: null, isEmail: true, afzenderDomein };
}

function extraheerThemaViaServer(titel, artikelTekst) {
  return fetch(SERVER_URL + "/api/factcheck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: titel + "\n\n" + artikelTekst })
  })
  .then(res => res.json())
  .then(data => ({ hoofdthema: data.theme || titel.substring(0, 50), subthema: data.claim || "" }))
  .catch(() => ({ hoofdthema: titel.substring(0, 50), subthema: "" }));
}

function haalBronnenOp(request) {
  return fetch(SERVER_URL + "/api/factcheck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: request.text, artikelTekst: request.artikelTekst || "", domein: request.domein || "", includeSources: true })
  })
  .then(res => res.json())
  .then(data => (data.sources || []).map(r => r.url))
  .catch(() => []);
}

function checkAlleenReacties(reactiesTekst, sendResponse) {
  fetch(SERVER_URL + "/api/harmful", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: reactiesTekst })
  })
  .then(res => res.json())
  .then(data => { sendResponse({ status: "success", alleenReactieCheck: true, strafbareContent: data.isHarmful || false }); })
  .catch(() => { sendResponse({ status: "success", alleenReactieCheck: true, strafbareContent: false }); });
}


// ── Timeout helper ────────────────────────────────────────────
function fetchMetTimeout(url, opties, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opties, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ── Feedback opslaan ─────────────────────────────────────────
  if (request.action === "stuur_feedback") {
    fetch("https://truthcheck-ai-production.up.railway.app/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: request.url,
        score: request.score,
        oordeel: request.oordeel,
        duim: request.duim,
        tekst: request.tekst,
        timestamp: request.timestamp
      })
    }).catch(() => {});
    return false;
  }

  // ── Bronnen ophalen bij popup open (Tavily on-demand) ──────────
  if (request.action === "haal_bronnen") {
    haalBronnenOp(request).then(bronnen => {
      sendResponse({ bronnen });
    });
    return true;
  }

  // ── Vraag aan AI stellen ──────────────────────────────────────
  if (request.action === "stel_vraag") {
    fetch("https://truthcheck-ai-production.up.railway.app/api/vraag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vraag: request.vraag,
        context: request.context || "",
        taal: request.taal || "en"
      })
    })
    .then(r => r.json())
    .then(data => {
      sendResponse({
        status: "success",
        antwoord: data.antwoord || "Geen antwoord gevonden.",
        bronnen: data.bronnen || []
      });
    })
    .catch(() => sendResponse({ status: "error", antwoord: "Kon geen antwoord ophalen." }));
    return true;
  }

  if (request.action !== "start_check") return false;

  if (request.alleenReactieCheck) {
    if (request.reactiesTekst && request.reactiesTekst.length > 10) {
      checkAlleenReacties(request.reactiesTekst, sendResponse);
    } else {
      sendResponse({ status: "success", alleenReactieCheck: true, strafbareContent: false });
    }
    return true;
  }

  const phishing = request.isEmail ? berekenPhishingEmail(request) : berekenPhishingWebsite(request);

  // ── Taal bepalen ─────────────────────────────────────────────
  const taal = (request.taal || "en").substring(0, 2).toLowerCase();
  const isNL = taal === "nl";

  const T = {
    satireOordeel:    isNL ? "Satirische content"        : "Satirical content",
    satireUitleg:     isNL ? "Dit is een satirische website. De inhoud is bedoeld als humor en niet als feitelijke berichtgeving."
                           : "This is a satirical website. The content is intended as humor, not factual reporting.",
    wetOordeel:       isNL ? "Wetenschappelijke bron"    : "Scientific source",
    wetUitleg:        isNL ? "Dit is een wetenschappelijke of academische website met peer-reviewed content."
                           : "This is a scientific or academic website with peer-reviewed content.",
    nieuwsOordeel:    isNL ? "Betrouwbare nieuwsbron"    : "Reliable news source",
    nieuwsUitleg:     isNL ? "Dit is een bekende en betrouwbare nieuwssite. Controleer altijd meerdere bronnen voor een volledig beeld."
                           : "This is a well-known and reliable news site. Always check multiple sources for a complete picture.",
    lifestyleOordeel: isNL ? "Lifestyle content"         : "Lifestyle content",
    lifestyleUitleg:  isNL ? "Dit is een lifestyle website over gezondheid, sport, mode of beauty. Controleer medische of voedingsadviezen altijd bij een professional."
                           : "This is a lifestyle website about health, sport, fashion or beauty. Always verify medical or dietary advice with a professional."
  };

  if (phishing.isSatire) {
    sendResponse({ status: "success", score: 75, oordeel: T.satireOordeel, uitleg: T.satireUitleg, bronnen: [], phishing: { actief: false }, strafbareContent: false, manipulatie: [], emoji: "😄", type: "satire" });
    return true;
  }

  if (phishing.isWetenschap) {
    sendResponse({ status: "success", score: 90, oordeel: T.wetOordeel, uitleg: T.wetUitleg, bronnen: [], phishing: { actief: false }, strafbareContent: false, manipulatie: [], emoji: "🎓", type: "wetenschap" });
    return true;
  }

  if (phishing.isNieuws) {
    sendResponse({ status: "success", score: 85, oordeel: T.nieuwsOordeel, uitleg: T.nieuwsUitleg, bronnen: [], phishing: { actief: false }, strafbareContent: false, manipulatie: [], emoji: "😊", type: "nieuws" });
    return true;
  }

  if (phishing.isLifestyle) {
    sendResponse({ status: "success", score: 70, oordeel: T.lifestyleOordeel, uitleg: T.lifestyleUitleg, bronnen: [], phishing: { actief: false }, strafbareContent: false, manipulatie: [], emoji: "🌿", type: "lifestyle" });
    return true;
  }

  if (phishing.isYouTube) {
    const titel = (request.text || "").toLowerCase();
    const paginaTekst = (request.paginaTekst || "").toLowerCase();
    const combineerd = titel + " " + paginaTekst;
    const isBetrouwbaarKanaal = YOUTUBE_BETROUWBARE_KANALEN.some(k => combineerd.includes(k));
    const isDeepfakeVideo = ["deepfake","deep fake","nep video","fake video","ai generated","ai gegenereerd","ai downfall","ai video","made with ai","gemaakt met ai","miniverse ai","sora","sora 2","runway ml","runway gen","gen-2","gen-3","pika labs","pika video","kling ai","hailuo","minimax video","luma dream machine","dream machine","invideo ai","stable video","stability ai video","adobe firefly video","veo","veo 2","google veo","meta movie gen","movie gen","funny ai video","ai animals","ai cat","ai dog","ai short","ai film","ai generated video","ai footage"].some(w => combineerd.includes(w));
    const aantalClickbait = YOUTUBE_CLICKBAIT_WOORDEN.filter(w => combineerd.includes(w.toLowerCase())).length;

    let score, oordeel, uitleg;
    if (isDeepfakeVideo) { score = 20; oordeel = "Deepfake video gedetecteerd"; uitleg = "De titel geeft aan dat dit een deepfake of AI-gegenereerde video is. Het getoonde beeld is niet echt — wees voorzichtig met delen."; }
    else if (isBetrouwbaarKanaal) { score = 85; oordeel = "Betrouwbaar YouTube kanaal"; uitleg = "Dit lijkt een gevestigd en betrouwbaar kanaal. Controleer altijd de videobeschrijving en bronnen in de comments."; }
    else if (aantalClickbait >= 2) { score = 30; oordeel = "Mogelijke desinformatie video"; uitleg = "De titel bevat meerdere clickbait of desinformatie signalen. Controleer de claims via onafhankelijke bronnen voordat je deelt."; }
    else if (aantalClickbait === 1) { score = 55; oordeel = "Twijfelachtige YouTube video"; uitleg = "De titel bevat een mogelijk misleidend woord. Controleer het kanaal en de bronnen."; }
    else { score = 70; oordeel = "YouTube video"; uitleg = "Geen directe desinformatie signalen gevonden. Controleer altijd het kanaal en de bronnen bij gevoelige onderwerpen."; }

    sendResponse({ status: "success", score, oordeel, uitleg, bronnen: [], phishing: { actief: false }, strafbareContent: false, manipulatie: [], emoji: "📺", type: "youtube" });
    return true;
  }

  if (phishing.actief) {
    const isWaarschuwing = phishing.isZoekmaschine;
    sendResponse({
      status: "success",
      score: isWaarschuwing ? 45 : Math.max(5, 25 - phishing.score),
      oordeel: request.isEmail ? "Verdachte e-mail" : isWaarschuwing ? "Let op bij klikken" : "Verdachte site",
      uitleg: request.isEmail ? "De afzender klopt niet met het e-mailadres. Reageer niet en klik op geen enkele link." : isWaarschuwing ? "Controleer altijd de URL voordat je klikt. Phishing sites kunnen tussen zoekresultaten staan." : "Deze pagina bevat kenmerken van phishing of misleiding. Wees voorzichtig.",
      bronnen: [], phishing, strafbareContent: false, manipulatie: [], emoji: "😡", type: "phishing"
    });
    return true;
  }

  if (request.isEmail) {
    sendResponse({ status: "success", score: 75, oordeel: "Geen gevaar gedetecteerd", uitleg: "Geen phishing signalen gevonden in deze e-mail.", bronnen: [], phishing: { actief: false }, strafbareContent: false, manipulatie: [], emoji: "😊", type: "normaal" });
    return true;
  }

  const isVideoPagina = request.afbeeldingUrl || 
    request.domein?.includes("youtube") || 
    request.domein?.includes("vimeo") || 
    request.domein?.includes("tiktok");

  // ── Alle calls parallel starten ─────────────────────────────
  const factcheckPromise = fetchMetTimeout(SERVER_URL + "/api/factcheck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: request.text, artikelTekst: request.artikelTekst || "", domein: request.domein || "", taal: request.taal || "en" })
  }, 9000)
  .then(res => res.json())
  .catch(() => ({ score: 50, theme: "Onbekend", explanation: "Analyse duurde te lang.", manipulatie: [], aiTekst: 0, sources: [] }));

  const deepfakePromise = isVideoPagina
    ? fetchMetTimeout(SERVER_URL + "/api/deepfake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          afbeeldingUrl: request.afbeeldingUrl || null,
          titel: request.text || "",
          domein: request.domein || "",
          videoContext: request.videoContext || ""
        })
      }, 7000)
      .then(res => res.json())
      .then(data => ({ deepfake_kans: data.deepfake_kans || 0, uitleg: data.uitleg || "" }))
      .catch(() => ({ deepfake_kans: 0, uitleg: "" }))
    : Promise.resolve({ deepfake_kans: 0, uitleg: "" });

  const strafbareContentPromise = request.reactiesTekst && request.reactiesTekst.length > 10
    ? fetchMetTimeout(SERVER_URL + "/api/harmful", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: request.reactiesTekst })
      }, 6000)
      .then(res => res.json())
      .then(data => ({ strafbaar: data.isHarmful || false, reden: data.explanation || "" }))
      .catch(() => ({ strafbaar: false, reden: "" }))
    : Promise.resolve({ strafbaar: false, reden: "" });

  Promise.all([factcheckPromise, deepfakePromise, strafbareContentPromise])
  .then(([data, deepfakeResultaat, strafbaarResultaat]) => {
    const bronnen      = (data.sources || []).map(r => r.url);
    const score        = data.score || 50;
    const oordeel      = data.theme || "Onbekend";
    const uitleg       = data.explanation || "Geen uitleg beschikbaar.";
    const manipulatie  = data.manipulatie || [];
    const aiTekst      = data.aiTekst || 0;
    const strafbareContent = strafbaarResultaat.strafbaar || false;
    const isDeepfake   = deepfakeResultaat && deepfakeResultaat.deepfake_kans >= 50;
    const type         = isDeepfake ? "deepfake" : "normaal";
    const emoji        = bepaalEmoji(score, type);
    const uitlegMetWaarschuwing = strafbareContent ? uitleg + " Let op: strafbare content gedetecteerd in de reacties." : uitleg;

    sendResponse({
      status: "success",
      score, oordeel,
      uitleg: uitlegMetWaarschuwing,
      bronnen, strafbareContent,
      phishing: { actief: false },
      deepfake: deepfakeResultaat,
      manipulatie,
      aiTekst,
      emoji, type
    });
  })
  .catch(err => sendResponse({ status: "error", message: err.message }));

  return true;
});
