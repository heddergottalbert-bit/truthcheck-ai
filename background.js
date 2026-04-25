const TAVILY_API_KEY = "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";
const OPENAI_API_KEY = "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";

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
  const patroon = new RegExp(
    "\\b" + sleutel.replace(/\s+/g, "\\s+") + "\\b", "i"
  );
  return patroon.test(tekst);
}

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

  let phishingScore = 0;
  const phishingSignalen = [];

  WEBSITE_PHISHING_WOORDEN.forEach(woord => {
    if (paginaTekst.includes(woord.toLowerCase())) {
      phishingScore += 15;
      phishingSignalen.push(woord);
    }
  });

  if (request.text === request.text.toUpperCase() &&
      request.text.length > 5) {
    phishingScore += 20;
    phishingSignalen.push("Titel in hoofdletters");
  }

  let officieelDomein = null;
  Object.entries(OFFICIELE_DOMEINEN).forEach(([sleutel, domein]) => {
    if (domeinCheck(paginaTitel, sleutel) ||
        domeinCheck(paginaTekst, sleutel)) {
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

  return {
    actief: phishingScore >= 30,
    score: Math.min(phishingScore, 100),
    signalen: [...new Set(phishingSignalen)].slice(0, 4),
    officieelDomein,
    isEmail: false
  };
}

function berekenPhishingEmail(request) {
  const mailTekst = (request.paginaTekst || "").toLowerCase();
  const afzenderNaam = (request.afzenderNaam || "");
  const afzenderDomein = (request.afzenderDomein || "").toLowerCase();
  const afzenderEmail = (request.afzenderEmail || "").toLowerCase();

  let phishingScore = 0;
  const phishingSignalen = [];

  if (afzenderEmail.includes("noreply") ||
      afzenderEmail.includes("no-reply")) {
    return { actief: false, score: 0, signalen: [], isEmail: true };
  }

  if (!naamMatchtDomein(afzenderNaam, afzenderDomein)) {
    phishingScore += 60;
    phishingSignalen.push(`"${afzenderNaam}" stuurt niet via eigen domein`);
  }

  if (request.text === request.text.toUpperCase() &&
      request.text.length > 5) {
    phishingScore += 25;
    phishingSignalen.push("Onderwerp in hoofdletters");
  }

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_check") {

    const phishing = request.isEmail
      ? berekenPhishingEmail(request)
      : berekenPhishingWebsite(request);

    if (phishing.actief) {
      sendResponse({
        status: "success",
        score: Math.max(5, 25 - phishing.score),
        oordeel: request.isEmail ? "Verdachte e-mail" : "Verdachte site",
        uitleg: request.isEmail
          ? "De afzender klopt niet met het e-mailadres. Reageer niet en klik op geen enkele link."
          : "Deze pagina bevat kenmerken van phishing of misleiding. Wees voorzichtig.",
        bronnen: [],
        phishing: phishing
      });
      return true;
    }

    // Bouw een specifiekere zoekterm
    const zoekTerm = request.text +
      (request.zoekContext ? " " + request.zoekContext : "");

    fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: zoekTerm,
        search_depth: "basic",
        max_results: 5,
        include_domains: BETROUWBARE_DOMEINEN
      })
    })
    .then(res => res.json())
    .then(tavilyData => {
      const paginaDomein = request.domein || "";

      let gefilterd = (tavilyData.results || []).filter(r =>
        !r.url.toLowerCase().includes(paginaDomein)
      );

      const fetchFeitencheck = (resultaten) => {
        const bronnen = resultaten.map(r => r.url);
        const context = resultaten.map(r => r.content).join("\n\n");
        const betrouwbaar = resultaten.length > 0;

        return fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + OPENAI_API_KEY
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: betrouwbaar
                  ? `Je bent een feitencheck AI. Voer deze twee stappen uit:
STAP 1: Controleer of de bronnen over hetzelfde onderwerp gaan als de claim.
Als meer dan de helft van de bronnen NIET relevant zijn aan de claim, geef dan score 50 en oordeel "Onvoldoende relevante bronnen" en zet bronRelevant op false.
STAP 2: Als de bronnen wel relevant zijn, bepaal dan of de claim waar is.
Geef ALLEEN een JSON object terug, geen extra tekst.
Formaat: {"score": 75, "oordeel": "Grotendeels waar", "uitleg": "Korte uitleg in 1 zin.", "bronRelevant": true}
Score 0 = volledig onwaar, 50 = neutraal/onbekend, 100 = volledig waar. Geen hallusinaties.`
                  : `Je bent een feitencheck AI. Geef ALLEEN een JSON object terug:
{"score": 50, "oordeel": "Onbekend", "uitleg": "Er zijn geen betrouwbare bronnen gevonden.", "bronRelevant": false}`
              },
              {
                role: "user",
                content: "Claim: " + request.text + "\n\nBronnen:\n" + context
              }
            ]
          })
        })
        .then(res => res.json())
        .then(aiData => {
          const result = JSON.parse(aiData.choices[0].message.content);

          if (!result.bronRelevant) {
            result.score = Math.min(result.score, 50);
            result.oordeel = "Onvoldoende relevante bronnen";
          }

          sendResponse({
            status: "success",
            score: result.score,
            oordeel: result.oordeel,
            uitleg: result.uitleg,
            bronnen: bronnen,
            bronRelevant: result.bronRelevant,
            phishing: { actief: false }
          });
        });
      };

      if (gefilterd.length === 0) {
        return fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: zoekTerm,
            search_depth: "basic",
            max_results: 5,
            exclude_domains: [
              "facebook.com", "instagram.com", "twitter.com",
              "x.com", "tiktok.com", "youtube.com",
              "wikipedia.org", "msn.com", "yahoo.com",
              "pinterest.com", "reddit.com", "quora.com",
              paginaDomein
            ].filter(Boolean)
          })
        })
        .then(res => res.json())
        .then(data => fetchFeitencheck(data.results || []));
      }

      return fetchFeitencheck(gefilterd);
    })
    .catch(err => sendResponse({ status: "error", message: err.message }));

    return true;
  }
});