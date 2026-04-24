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
  "belasting": "belastingdienst.nl",
  "digid": "digid.nl",
  "bsn": "rijksoverheid.nl",
  "paspoort": "rijksoverheid.nl",
  "uitkering": "uwv.nl",
  "aow": "svb.nl",
  "studiefinanciering": "duo.nl",
  "politie": "politie.nl",
  "ind": "ind.nl",
  "visum": "ind.nl",
  "verblijfsvergunning": "ind.nl",
  "ing bank": "ing.nl",
  "abn amro": "abnamro.nl",
  "rabobank": "rabobank.nl",
  "paypal": "paypal.com",
  "apple": "apple.com",
  "microsoft": "microsoft.com",
  "amazon": "amazon.com",
  "dhl": "dhl.com",
  "postnl": "postnl.nl"
};

const PHISHING_WOORDEN = [
  "gratis", "urgent", "onmiddellijk", "verloopt", "verlopen",
  "deadline", "geselecteerd", "gewonnen", "prijs", "claim",
  "verificatie vereist", "account geblokkeerd", "klik hier",
  "bevestig uw", "update uw", "inloggen vereist",
  "limited time", "act now", "you have been selected",
  "congratulations", "winner", "suspended", "verify now",
  "eindigt op", "laatste kans", "alleen vandaag",
  "controleer nu", "u bent gekozen", "uw account"
];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_check") {

    fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: request.text,
        search_depth: "basic",
        max_results: 5,
        include_domains: BETROUWBARE_DOMEINEN
      })
    })
    .then(res => res.json())
    .then(tavilyData => {
      const paginaDomein = request.domein || "";
      const paginaTekst = (request.paginaTekst || "").toLowerCase();
      const paginaTitel = (request.text || "").toLowerCase();

      // ── Phishing analyse ──────────────────────────────────
      let phishingScore = 0;
      const phishingSignalen = [];

      PHISHING_WOORDEN.forEach(woord => {
        if (paginaTekst.includes(woord.toLowerCase())) {
          phishingScore += 15;
          phishingSignalen.push(woord);
        }
      });

      let officieelDomein = null;
      Object.entries(OFFICIELE_DOMEINEN).forEach(([sleutel, domein]) => {
        if (paginaTitel.includes(sleutel.toLowerCase()) ||
            paginaTekst.includes(sleutel.toLowerCase())) {
          if (!paginaDomein.includes(domein)) {
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

      const phishingActief = phishingScore >= 30;
      const phishingWaarschuwing = phishingActief ? {
        actief: true,
        score: Math.min(phishingScore, 100),
        signalen: [...new Set(phishingSignalen)].slice(0, 3),
        officieelDomein: officieelDomein
      } : { actief: false };

      // ── Feitencheck ───────────────────────────────────────
      let gefilterd = (tavilyData.results || []).filter(r =>
        !r.url.toLowerCase().includes(paginaDomein)
      );

      const fetchFeitencheck = (resultaten) => {
        const bronnen = resultaten.map(r => r.url);
        const context = resultaten.map(r => r.content).join("\n\n");
        const betrouwbaar = resultaten.length > 0;

        // Als phishing actief: stuur direct lage score terug
        if (phishingActief) {
          sendResponse({
            status: "success",
            score: Math.min(25, 100 - phishingScore),
            oordeel: "Verdachte site",
            uitleg: "Deze pagina bevat kenmerken van phishing of misleiding. Wees voorzichtig.",
            bronnen: bronnen,
            phishing: phishingWaarschuwing
          });
          return;
        }

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
                  ? "Je bent een feitencheck AI. Geef ALLEEN een JSON object terug, geen extra tekst. Formaat: {\"score\": 75, \"oordeel\": \"Grotendeels waar\", \"uitleg\": \"Korte uitleg in 1 zin.\"}. Score 0 = volledig onwaar, 50 = neutraal/onbekend, 100 = volledig waar. Geen hallusinaties."
                  : "Je bent een feitencheck AI. Geef ALLEEN een JSON object terug: {\"score\": 50, \"oordeel\": \"Onbekend\", \"uitleg\": \"Er zijn geen betrouwbare bronnen gevonden voor deze claim.\"}."
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
          sendResponse({
            status: "success",
            score: result.score,
            oordeel: result.oordeel,
            uitleg: result.uitleg,
            bronnen: bronnen,
            phishing: phishingWaarschuwing
          });
        });
      };

      if (gefilterd.length === 0) {
        return fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: request.text,
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