// Laad vertalingen eerst
// translations.js moet voor content.js geladen worden via manifest.json

let huidigScore = 50;
let huidigOordeel = "Laden...";
let huidigUitleg = "";
let huidigBronnen = [];
let huidigDeepfake = null;
let huidigStrafbareContent = false;
let huidigEmoji = "🤔";
let huidigBronType = "verdieping";
let huidigManipulatie = [];
let huidigAiTekst = 0;
let huidigArtikeltekst = "";
let huidigBronBekend = false;
let huidigOnderwerpVerifieerbaar = false;
let huidigVerificatieBronnen = [];
let huidigRodeVlaggen = [];
let popupOpen = false;
let transparantie = 0.75;
let achtergrondKleur = "#121223";
let tekstKleur = "#eeeeee";
let lettertype = "Georgia, serif";

function slaInstellingenOp() {
  chrome.storage.local.set({
    tc_transparantie: transparantie,
    tc_achtergrond: achtergrondKleur,
    tc_tekst: tekstKleur,
    tc_lettertype: lettertype,
    tc_positie_x: knop.style.right,
    tc_positie_y: knop.style.bottom
  });
}

function laadInstellingen(callback) {
  chrome.storage.local.get(
    ["tc_transparantie", "tc_achtergrond", "tc_tekst", "tc_lettertype", "tc_positie_x", "tc_positie_y"],
    (items) => {
      if (items.tc_transparantie) transparantie = parseFloat(items.tc_transparantie);
      if (items.tc_achtergrond)  achtergrondKleur = items.tc_achtergrond;
      if (items.tc_tekst)        tekstKleur = items.tc_tekst;
      if (items.tc_lettertype)   lettertype = items.tc_lettertype;
      if (callback) callback(items);
    }
  );
}

function hexNaarRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getKleur(score) {
  if (score <= 30) return "#e74c3c";
  if (score <= 70) return "#e67e22";
  return "#2ecc71";
}

// ── Phishing banner — Shadow DOM zodat pagina er niet bij kan ──

const bannerHost = document.createElement("div");
bannerHost.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999999;pointer-events:none;";
document.documentElement.appendChild(bannerHost);
const bannerShadow = bannerHost.attachShadow({ mode: "closed" });

const phishingBanner = document.createElement("div");
phishingBanner.style.cssText = `
  position:fixed;top:-200px;left:0;right:0;z-index:9999999;
  background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;
  font-family:Georgia,serif;box-shadow:0 4px 24px rgba(0,0,0,0.4);
  transition:top 0.5s cubic-bezier(0.175,0.885,0.32,1.275);
  pointer-events:all;
`;
bannerShadow.appendChild(phishingBanner);

function toonPhishingWaarschuwing(phishing) {
  if (!phishing || !phishing.actief) return;
  const signalenHTML = (phishing.signalen || [])
    .map(s => `<span style="background:rgba(0,0,0,0.2);border-radius:4px;padding:2px 8px;font-size:11px;margin:2px;display:inline-block;">${s}</span>`)
    .join("");
  const officieelHTML = phishing.officieelDomein
    ? `<a href="https://${phishing.officieelDomein}" target="_blank" style="color:white;font-weight:bold;text-decoration:underline;">${t.phishingOfficialSite}: ${phishing.officieelDomein}</a>`
    : "";
  phishingBanner.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:14px 20px;max-width:100%;">
      <div style="display:flex;align-items:flex-start;gap:14px;flex:1;">
        <div style="font-size:28px;line-height:1;">⚠️</div>
        <div>
          <div style="font-size:14px;font-weight:bold;margin-bottom:4px;">
            ${phishing.isEmail ? t.phishingSuspiciousEmail : t.phishingDangerousPage} — ${t.phishingWarning}
          </div>
          <div style="font-size:11px;opacity:0.9;margin-bottom:4px;">${t.phishingSignals}: ${signalenHTML}</div>
          ${officieelHTML}
        </div>
      </div>
      <button id="tc-phishing-sluit" style="background:rgba(0,0,0,0.2);border:none;color:white;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;margin-left:10px;white-space:nowrap;">${t.phishingClose}</button>
    </div>`;
  setTimeout(() => { phishingBanner.style.top = "0px"; }, 100);
  const sluitKnop = phishingBanner.querySelector("#tc-phishing-sluit");
  if (sluitKnop) sluitKnop.onclick = () => { phishingBanner.style.top = "-200px"; };
}

// ── Zwevende knop ────────────────────────────────────────────

const knop = document.createElement("div");
knop.id = "tc-knop";
knop.style.cssText = `
  position:fixed;bottom:20px;right:20px;width:64px;height:64px;border-radius:50%;
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,0.12);cursor:grab;z-index:999998;
  box-shadow:0 4px 24px rgba(0,0,0,0.35);user-select:none;
`;
document.body.appendChild(knop);

function toonLaadAnimatie() {
  knop.style.background = hexNaarRgba(achtergrondKleur, transparantie);
  knop.innerHTML = `
    <div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:36px;line-height:1;">🤔</span>
    </div>`;
}

function updateMiniBarometer(score, strafbareContent, emoji) {
  knop.style.background = hexNaarRgba(achtergrondKleur, transparantie);
  const hoofdEmoji = emoji || (score >= 70 ? "😊" : score >= 50 ? "😟" : "😡");
  const strafbareEmoji = strafbareContent
    ? `<span style="font-size:20px;line-height:1;position:absolute;bottom:2px;right:2px;">😈</span>`
    : "";
  knop.innerHTML = `
    <div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;position:relative;">
      <span style="font-size:36px;line-height:1;">${hoofdEmoji}</span>
      ${strafbareEmoji}
    </div>`;
}

// ── Popup ────────────────────────────────────────────────────

const popup = document.createElement("div");
popup.id = "tc-popup";
popup.style.cssText = `
  position:fixed;bottom:94px;right:20px;width:275px;
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border-radius:18px;padding:18px;z-index:999999;
  box-shadow:0 8px 40px rgba(0,0,0,0.45);display:none;
`;
document.body.appendChild(popup);

function updatePopup(score, oordeel, uitleg, bronnen, deepfake, strafbareContent, emoji, bronType) {
  const kleur = getKleur(score);
  popup.style.background = hexNaarRgba(achtergrondKleur, transparantie);
  popup.style.border = `1px solid rgba(255,255,255,0.1)`;
  popup.style.color = tekstKleur;
  popup.style.fontFamily = lettertype;

  const bronnenHTML = bronnen && bronnen.length > 0
    ? bronnen.map(b => {
        let domein = b;
        try { domein = new URL(b).hostname.replace("www.", ""); } catch(e) {}
        return `<a href="${b}" target="_blank" style="display:inline-block;color:#7ab3ef;font-size:11px;margin-top:5px;margin-right:6px;text-decoration:none;background:rgba(122,179,239,0.1);border:1px solid rgba(122,179,239,0.3);border-radius:4px;padding:2px 7px;">${domein}</a>`;
      }).join("")
    : `<span style="color:#555;font-size:10px;">${t.noSources}</span>`;

  const bronLabel = bronType === "weerlegging"
    ? t.whyWrong
    : bronType === "verificatie"
    ? t.verificationSources
    : t.readMore;

  const deepfakeHTML = deepfake && deepfake.deepfake_kans >= 50
    ? `<div style="margin-top:12px;padding:10px;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);border-radius:8px;">
        <div style="font-size:10px;font-weight:bold;color:#e74c3c;margin-bottom:4px;">${t.deepfakeLabel(deepfake.deepfake_kans)}</div>
        <div style="font-size:10px;color:${tekstKleur};opacity:0.8;">${deepfake.uitleg}</div>
       </div>`
    : "";

  const strafbareHTML = strafbareContent
    ? `<div style="margin-top:12px;padding:10px;background:rgba(128,0,128,0.15);border:1px solid rgba(128,0,128,0.4);border-radius:8px;">
        <div style="font-size:10px;font-weight:bold;color:#cc66ff;margin-bottom:4px;">${t.harmfulTitle}</div>
        <div style="font-size:10px;color:${tekstKleur};opacity:0.8;">${t.harmfulBody}</div>
       </div>`
    : "";

  const manipulatieHTML = huidigManipulatie && huidigManipulatie.length > 0 && score <= 35
    ? `<div style="margin-top:12px;padding:10px;background:rgba(255,165,0,0.15);border:1px solid rgba(255,165,0,0.4);border-radius:8px;">
        <div style="font-size:10px;font-weight:bold;color:#ffa500;margin-bottom:6px;">${t.manipulationTitle}</div>
        ${huidigManipulatie.map(tech => `<div style="font-size:10px;color:${tekstKleur};opacity:0.8;margin-bottom:3px;">• ${tech}</div>`).join("")}
       </div>`
    : "";

  const hoofdEmoji = emoji || (score >= 70 ? "😊" : score >= 50 ? "😟" : "😡");
  const schoneUitleg = (uitleg || "").replace(" Let op: strafbare content gedetecteerd in de reacties.", "");

  popup.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
      <span style="font-size:32px;line-height:1;">${hoofdEmoji}</span>
      <div>
        <div style="font-size:9px;letter-spacing:2px;color:${tekstKleur};opacity:0.5;text-transform:uppercase;font-family:${lettertype};">${t.factCheck}</div>
        <div style="font-size:15px;font-weight:bold;color:${kleur};font-family:${lettertype};">${oordeel}</div>
      </div>
      <div style="margin-left:auto;background:rgba(255,255,255,0.1);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;font-weight:bold;color:${tekstKleur};" id="tc-vraag-knop" title="${t.askQuestion}">?</div>
    </div>
    <div style="font-size:11px;color:${tekstKleur};opacity:0.7;margin-bottom:8px;font-family:${lettertype};">${t.score}: <span style="color:${kleur};font-weight:bold;">${score}/100</span></div>
    <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:10px;font-family:${lettertype};">
        <span style="font-size:12px;">${huidigBronBekend ? '✅' : '❓'}</span>
        <span style="color:${tekstKleur};opacity:0.8;">Bron bekend: <strong>${huidigBronBekend ? 'Ja — staat op de whitelist' : 'Nee — onbekend kanaal of domein'}</strong></span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:10px;font-family:${lettertype};">
        <span style="font-size:12px;">${huidigOnderwerpVerifieerbaar ? '✅' : '⚠️'}</span>
        <span style="color:${tekstKleur};opacity:0.8;">Verifieerbaar: <strong>${huidigOnderwerpVerifieerbaar ? 'Ja — gevonden bij ' + (huidigVerificatieBronnen.slice(0,2).join(', ') || 'betrouwbare bronnen') : 'Niet bevestigd door onafhankelijke bronnen'}</strong></span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:10px;font-family:${lettertype};">
        <span style="font-size:12px;">${huidigRodeVlaggen.length > 0 ? '🚩' : '✅'}</span>
        <span style="color:${tekstKleur};opacity:0.8;">Rode vlaggen: <strong>${huidigRodeVlaggen.length > 0 ? huidigRodeVlaggen.slice(0,2).join(', ') : 'Geen gedetecteerd'}</strong></span>
      </div>
    </div>
    <div style="font-size:11px;color:${tekstKleur};line-height:1.5;margin-bottom:14px;font-family:${lettertype};">${schoneUitleg}</div>
    <div id="tc-vraag-veld" style="display:none;margin-bottom:12px;">
      <div style="display:flex;gap:6px;">
        <input id="tc-vraag-input" type="text" placeholder="${t.questionPlaceholder}" style="flex:1;padding:7px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:${tekstKleur};font-size:11px;font-family:${lettertype};box-sizing:border-box;"/>
        <button id="tc-vraag-verstuur" style="padding:7px 10px;background:rgba(122,179,239,0.2);border:1px solid rgba(122,179,239,0.4);border-radius:8px;color:#7ab3ef;cursor:pointer;font-size:11px;">→</button>
      </div>
      <div id="tc-vraag-antwoord" style="display:none;margin-top:8px;padding:8px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:11px;color:${tekstKleur};line-height:1.5;"></div>
    </div>
    ${strafbareHTML}
    ${deepfakeHTML}
    ${manipulatieHTML}
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;margin-top:10px;">
      <div style="font-size:9px;letter-spacing:1px;color:${tekstKleur};opacity:0.5;text-transform:uppercase;margin-bottom:6px;font-family:${lettertype};">AI-gegenereerde tekst</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,0.1);overflow:hidden;">
          <div style="height:100%;width:${huidigAiTekst}%;background:linear-gradient(to right,#2ecc71,#f1c40f,#e74c3c);"></div>
        </div>
        <div style="font-size:11px;font-weight:bold;min-width:32px;text-align:right;font-family:${lettertype};color:${huidigAiTekst >= 70 ? '#e74c3c' : huidigAiTekst >= 40 ? '#f1c40f' : '#2ecc71'};">${huidigAiTekst}%</div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;margin-top:10px;">
      <div style="font-size:9px;letter-spacing:1px;color:${tekstKleur};opacity:0.5;text-transform:uppercase;margin-bottom:6px;font-family:${lettertype};">${bronLabel}</div>
      ${bronnenHTML}
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;margin-top:10px;">
      <div style="font-size:9px;letter-spacing:1px;color:${tekstKleur};opacity:0.5;text-transform:uppercase;margin-bottom:8px;font-family:${lettertype};">Delen</div>
      <div style="display:flex;gap:6px;">
        <button id="tc-deel-klembord" style="flex:1;padding:6px 4px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:${tekstKleur};cursor:pointer;font-size:10px;" title="Kopieer naar klembord">Kopieer</button>
        <button id="tc-deel-mail" style="flex:1;padding:6px 4px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:${tekstKleur};cursor:pointer;font-size:10px;" title="Deel via e-mail">Mail</button>
        <button id="tc-deel-whatsapp" style="flex:1;padding:6px 4px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:${tekstKleur};cursor:pointer;font-size:10px;" title="Deel via WhatsApp">WhatsApp</button>
      </div>
      <div id="tc-deel-bevestiging" style="display:none;font-size:10px;color:#2ecc71;text-align:center;margin-top:6px;">✓ Gekopieerd naar klembord</div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;margin-top:10px;">
      <div style="font-size:9px;letter-spacing:1px;color:${tekstKleur};opacity:0.5;text-transform:uppercase;margin-bottom:8px;font-family:${lettertype};">Feedback</div>
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <button id="tc-duim-op" style="flex:1;padding:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:${tekstKleur};cursor:pointer;font-size:16px;" title="Klopt dit oordeel?">👍</button>
        <button id="tc-duim-neer" style="flex:1;padding:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:${tekstKleur};cursor:pointer;font-size:16px;" title="Klopt dit oordeel niet?">👎</button>
      </div>
      <div id="tc-feedback-veld" style="display:none;margin-bottom:8px;">
        <input id="tc-feedback-tekst" type="text" placeholder="Optioneel: wat klopt er niet?" style="width:100%;padding:7px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:${tekstKleur};font-size:11px;font-family:${lettertype};box-sizing:border-box;"/>
        <button id="tc-feedback-verstuur" style="width:100%;margin-top:6px;padding:6px;background:rgba(122,179,239,0.2);border:1px solid rgba(122,179,239,0.4);border-radius:8px;color:#7ab3ef;cursor:pointer;font-size:11px;">Verstuur feedback</button>
      </div>
      <div id="tc-feedback-bevestiging" style="display:none;font-size:11px;color:#2ecc71;text-align:center;margin-bottom:8px;">✓ Bedankt voor je feedback!</div>
    </div>
    ${(window.location.hostname.includes('youtube.com') && !window.location.pathname.startsWith('/shorts/'))
      ? '<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;margin-top:10px;"><button id="tc-transcript-knop" style="width:100%;padding:7px;background:rgba(122,179,239,0.1);border:1px solid rgba(122,179,239,0.3);border-radius:8px;color:#7ab3ef;cursor:pointer;font-size:11px;">Analyseer video-inhoud (2 credits)</button><div id="tc-transcript-resultaat" style="display:none;margin-top:10px;padding:10px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:11px;line-height:1.5;"></div></div>'
      : ''}
    <button id="tc-sluit" style="width:100%;margin-top:14px;padding:7px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:${tekstKleur};cursor:pointer;font-size:11px;font-family:${lettertype};">${t.close}</button>`;

  document.getElementById("tc-sluit").onclick = () => { popup.style.display = "none"; popupOpen = false; };

  const transcriptKnop = document.getElementById("tc-transcript-knop");
  if (transcriptKnop) {
    transcriptKnop.onclick = () => {
      const resultaatDiv = document.getElementById("tc-transcript-resultaat");
      transcriptKnop.disabled = true;
      transcriptKnop.textContent = "Transcript laden...";
      resultaatDiv.style.display = "block";
      resultaatDiv.textContent = "Video-inhoud wordt geanalyseerd...";

      const videoId = new URLSearchParams(window.location.search).get("v") || "";
      chrome.runtime.sendMessage(
        { action: "analyseer_transcript", videoId, taal: navigator.language || "nl" },
        (response) => {
          if (chrome.runtime.lastError || !response || response.error) {
            const fout = (response && response.error) ? response.error : "Transcript niet beschikbaar.";
            resultaatDiv.textContent = fout;
            transcriptKnop.textContent = "Analyseer video-inhoud (2 credits)";
            transcriptKnop.disabled = false;
            return;
          }
          const kleur = response.score >= 70 ? "#2ecc71" : response.score >= 50 ? "#e67e22" : "#e74c3c";
          const signalenHtml = (response.signalen && response.signalen.length > 0)
            ? "<div style='margin-top:6px;opacity:0.6;font-size:10px;'>Signalen: " + response.signalen.join(", ") + "</div>"
            : "";
          resultaatDiv.innerHTML =
            "<div style='font-size:10px;font-weight:bold;color:" + kleur + ";margin-bottom:4px;'>Inhoudsanalyse — Score: " + response.score + "/100</div>" +
            "<div style='margin-bottom:6px;'>" + response.oordeel + "</div>" +
            "<div style='opacity:0.8;'>" + response.uitleg + "</div>" +
            signalenHtml;
          transcriptKnop.style.display = "none";
        }
      );
    };
  }

  function verstuurFeedback(duim) {
    const tekst = document.getElementById("tc-feedback-tekst")?.value || "";
    chrome.runtime.sendMessage({
      action: "stuur_feedback",
      url: window.location.href,
      score: huidigScore,
      oordeel: huidigOordeel,
      duim,
      tekst,
      timestamp: new Date().toISOString()
    });
    document.getElementById("tc-duim-op").style.opacity = duim === "op" ? "1" : "0.3";
    document.getElementById("tc-duim-neer").style.opacity = duim === "neer" ? "1" : "0.3";
    document.getElementById("tc-feedback-bevestiging").style.display = "block";
    document.getElementById("tc-feedback-veld").style.display = "none";
  }

  document.getElementById("tc-duim-op").onclick = () => {
    document.getElementById("tc-feedback-veld").style.display = "none";
    verstuurFeedback("op");
  };
  document.getElementById("tc-duim-neer").onclick = () => {
    document.getElementById("tc-feedback-veld").style.display = "block";
    document.getElementById("tc-feedback-tekst").focus();
  };
  document.getElementById("tc-feedback-verstuur").onclick = () => verstuurFeedback("neer");
  document.getElementById("tc-vraag-knop").onclick = () => {
    const veld = document.getElementById("tc-vraag-veld");
    veld.style.display = veld.style.display === "none" ? "block" : "none";
    if (veld.style.display === "block") document.getElementById("tc-vraag-input").focus();
  };

  function verstuurVraag() {
    const input = document.getElementById("tc-vraag-input");
    const antwoordDiv = document.getElementById("tc-vraag-antwoord");
    const vraag = input.value.trim();
    if (!vraag) return;

    antwoordDiv.style.display = "block";
    antwoordDiv.textContent = "⏳ Even wachten...";

    const context = [huidigArtikeltekst, huidigUitleg, huidigBronnen.join(" ")]
      .filter(Boolean).join(" ").substring(0, 1500);

    chrome.runtime.sendMessage(
      { action: "stel_vraag", vraag, context: context, taal: navigator.language || "en" },
      (response) => {
        if (chrome.runtime.lastError || !response) {
          antwoordDiv.textContent = "Kon geen antwoord ophalen.";
          return;
        }
        antwoordDiv.innerHTML = '<span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;opacity:0.5;display:block;margin-bottom:4px;">💬 Antwoord</span>' + (response.antwoord || 'Geen antwoord gevonden.');

        // Alle bestaande bronnen oplichten bij een antwoord
        const bronLinks = document.querySelectorAll("#tc-popup a[href]");
        bronLinks.forEach(link => {
          link.style.background = "rgba(46,204,113,0.2)";
          link.style.border = "1px solid rgba(46,204,113,0.6)";
          link.style.color = "#2ecc71";
        });
      }
    );
  }

  document.getElementById("tc-vraag-verstuur").onclick = verstuurVraag;
  document.getElementById("tc-vraag-input").onkeydown = (e) => { if (e.key === "Enter") verstuurVraag(); };

  // ── Deel knoppen ──────────────────────────────────────────────
  function maakDeelTekst() {
    const bronnenLijst = huidigBronnen.length > 0
      ? huidigBronnen.map(b => "• " + b).join("\n")
      : "Geen bronnen gevonden";
    return `FactRadar analyse\n\n` +
      `📄 ${window.location.href}\n` +
      `${huidigEmoji} ${huidigOordeel} — Score: ${huidigScore}/100\n\n` +
      `${huidigUitleg}\n\n` +
      `🔗 Bronnen:\n${bronnenLijst}\n\n` +
      `Geanalyseerd met FactRadar`;
  }

  document.getElementById("tc-deel-klembord").onclick = () => {
    navigator.clipboard.writeText(maakDeelTekst()).then(() => {
      const bevestiging = document.getElementById("tc-deel-bevestiging");
      bevestiging.style.display = "block";
      setTimeout(() => { bevestiging.style.display = "none"; }, 2500);
    });
  };

  document.getElementById("tc-deel-mail").onclick = () => {
    const tekst = maakDeelTekst();
    const onderwerp = encodeURIComponent("FactRadar: " + huidigOordeel);
    const body = encodeURIComponent(tekst);
    window.open(`mailto:?subject=${onderwerp}&body=${body}`, "_blank");
  };

  document.getElementById("tc-deel-whatsapp").onclick = () => {
    const tekst = encodeURIComponent(maakDeelTekst());
    window.open(`https://wa.me/?text=${tekst}`, "_blank");
  };
}

// ── Instellingen menu ─────────────────────────────────────────

const menu = document.createElement("div");
menu.id = "tc-menu";
menu.style.cssText = `
  position:fixed;width:240px;background:rgba(18,18,35,0.97);
  border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px;
  z-index:9999999;font-family:Georgia,serif;color:#eee;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);display:none;
`;
menu.innerHTML = `
  <div style="font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;margin-bottom:14px;">${t.settingsTitle}</div>
  <div style="font-size:11px;color:#aaa;margin-bottom:5px;">${t.settingsTransparency}</div>
  <input id="tc-trans" type="range" min="0.1" max="1" step="0.05" value="${transparantie}" style="width:100%;accent-color:#7ab3ef;margin-bottom:14px;"/>
  <div style="font-size:11px;color:#aaa;margin-bottom:5px;">${t.settingsBackground}</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    ${[["#121223",t.colorDark],["#1a1a1a",t.colorBlack],["#0d2137",t.colorNight],["#1e3a1e",t.colorGreen],["#2d1b1b",t.colorRed],["#f0f0fa",t.colorLight],["#ffffff",t.colorWhite]]
      .map(([k,n]) => `<button data-kleur="${k}" style="padding:4px 8px;border-radius:6px;cursor:pointer;font-size:10px;border:1px solid rgba(255,255,255,0.2);background:${k};color:${["#f0f0fa","#ffffff"].includes(k)?"#333":"#eee"};">${n}</button>`).join("")}
  </div>
  <div style="font-size:11px;color:#aaa;margin-bottom:5px;">${t.settingsTextColor}</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    ${[["#eeeeee",t.textWhite],["#000000",t.textBlack],["#ffd700",t.textGold],["#90ee90",t.textLightGreen],["#add8e6",t.textLightBlue]]
      .map(([k,n]) => `<button data-tekst="${k}" style="padding:4px 8px;border-radius:6px;cursor:pointer;font-size:10px;border:1px solid rgba(255,255,255,0.2);background:#2a2a3a;color:${k};">${n}</button>`).join("")}
  </div>
  <div style="font-size:11px;color:#aaa;margin-bottom:5px;">${t.settingsFont}</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    ${[["Georgia, serif","Georgia"],["Arial, sans-serif","Arial"],["'Courier New', monospace","Courier"],["Verdana, sans-serif","Verdana"],["'Times New Roman', serif","Times"]]
      .map(([f,n]) => `<button data-font="${f}" style="padding:4px 8px;border-radius:6px;cursor:pointer;font-size:10px;border:1px solid rgba(255,255,255,0.2);background:#2a2a3a;color:#eee;font-family:${f};">${n}</button>`).join("")}
  </div>
  <button id="tc-menu-sluit" style="width:100%;padding:7px;background:rgba(255,255,255,0.06);border:1px solid #333;border-radius:8px;color:#888;cursor:pointer;font-size:11px;">${t.settingsClose}</button>`;
document.body.appendChild(menu);

document.getElementById("tc-trans").oninput = (e) => {
  transparantie = parseFloat(e.target.value);
  updateMiniBarometer(huidigScore, huidigStrafbareContent, huidigEmoji);
  if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji, huidigBronType);
  slaInstellingenOp();
};
menu.querySelectorAll("[data-kleur]").forEach(btn => {
  btn.onclick = () => {
    achtergrondKleur = btn.dataset.kleur;
    updateMiniBarometer(huidigScore, huidigStrafbareContent, huidigEmoji);
    if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji, huidigBronType);
    slaInstellingenOp();
  };
});
menu.querySelectorAll("[data-tekst]").forEach(btn => {
  btn.onclick = () => {
    tekstKleur = btn.dataset.tekst;
    if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji, huidigBronType);
    slaInstellingenOp();
  };
});
menu.querySelectorAll("[data-font]").forEach(btn => {
  btn.onclick = () => {
    lettertype = btn.dataset.font;
    if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji, huidigBronType);
    slaInstellingenOp();
  };
});
document.getElementById("tc-menu-sluit").onclick = () => { menu.style.display = "none"; };
document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && e.target !== knop) menu.style.display = "none";
});

// ── Versleepbaar ─────────────────────────────────────────────

let sleepX = 0, sleepY = 0, sleepActief = false, heeftGesleept = false;

knop.addEventListener("mousedown", (e) => {
  if (e.button === 2) return;
  sleepActief = true; heeftGesleept = false;
  sleepX = e.clientX; sleepY = e.clientY;
  knop.style.cursor = "grabbing"; e.preventDefault();
});
document.addEventListener("mousemove", (e) => {
  if (!sleepActief) return;
  const dx = e.clientX - sleepX; const dy = e.clientY - sleepY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) heeftGesleept = true;
  sleepX = e.clientX; sleepY = e.clientY;
  const hr = parseInt(knop.style.right)  || 20;
  const hb = parseInt(knop.style.bottom) || 20;
  knop.style.right  = Math.max(0, hr - dx) + "px";
  knop.style.bottom = Math.max(0, hb - dy) + "px";
  popup.style.right  = knop.style.right;
  popup.style.bottom = (parseInt(knop.style.bottom) + 74) + "px";
});
document.addEventListener("mouseup", () => {
  if (sleepActief) { sleepActief = false; knop.style.cursor = "grab"; slaInstellingenOp(); }
});

knop.addEventListener("click", (e) => {
  if (heeftGesleept) return;
  if (isZoekpagina()) return; // Geen actie op uitgesloten pagina's
  popupOpen = !popupOpen;
  popup.style.display = popupOpen ? "block" : "none";
  if (popupOpen) {
    updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji, huidigBronType);
    // ── Bronnen ophalen als die er nog niet zijn (Tavily on-demand) ──
    if (huidigBronnen.length === 0 && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        { action: "haal_bronnen", text: huidigOordeel, artikelTekst: huidigArtikeltekst, domein: window.location.hostname.replace("www.", "") },
        (response) => {
          if (chrome.runtime.lastError || !response || !response.bronnen) return;
          huidigBronnen = response.bronnen;
          if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji, huidigBronType);
        }
      );
    }
  }
});
knop.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  menu.style.display = menu.style.display === "block" ? "none" : "block";
  const r = knop.getBoundingClientRect();
  menu.style.right  = (window.innerWidth - r.right) + "px";
  menu.style.bottom = (window.innerHeight - r.top + 8) + "px";
  menu.style.top = "auto";
});

// ── Hulpfuncties pagina ───────────────────────────────────────

function vindHoofdAfbeelding() {
  const og = document.querySelector('meta[property="og:image"]');
  if (og) return og.getAttribute("content");
  const imgs = Array.from(document.querySelectorAll("img"))
    .filter(img => img.naturalWidth > 200 && img.naturalHeight > 200)
    .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
  return imgs[0]?.src || null;
}

function detecteerTaal(tekst) {
  if (!tekst || tekst.length < 30) return navigator.language?.substring(0, 2) || "en";
  const sample = tekst.toLowerCase().substring(0, 300);
  const nlWoorden = ["de", "het", "een", "van", "en", "is", "dat", "dit", "zijn", "met", "voor", "niet", "ook", "aan", "heeft", "worden", "door", "maar", "om", "op"];
  const enWoorden = ["the", "and", "for", "that", "this", "with", "are", "have", "from", "they", "not", "but", "also", "been", "which", "their", "will", "can", "was", "has"];
  const nlScore = nlWoorden.filter(w => new RegExp("\\b" + w + "\\b").test(sample)).length;
  const enScore = enWoorden.filter(w => new RegExp("\\b" + w + "\\b").test(sample)).length;
  return nlScore >= enScore ? "nl" : "en";
}

function vindArtikelTekst() {
  // ── Token-stripping: reclame en ruis actief verwijderen ──────
  const ruis = document.querySelectorAll(
    "nav, header, footer, aside, .nav, .header, .footer, .sidebar, " +
    ".advertisement, .ad, .ads, .reclame, .cookie-banner, .cookie-notice, " +
    "[class*='sponsor'], [class*='promo'], [class*='banner'], [class*='advert'], " +
    "[id*='sponsor'], [id*='promo'], [id*='banner'], [id*='advert'], " +
    "script, style, noscript, iframe"
  );
  ruis.forEach(el => el.setAttribute("data-tc-skip", "true"));

  const uitsluitWoorden = ["cookies", "privacy", "huisregel", "copyright", "all rights reserved", "terms of service", "newsletter", "subscribe", "advertentie", "gesponsord", "sponsored"];

  function isSchoneTekst(tekst) {
    const lower = tekst.toLowerCase();
    // Sla elementen over die gemarkeerd zijn als ruis
    return tekst.length > 30 && !uitsluitWoorden.some(w => lower.includes(w));
  }

  function filterRuis(els) {
    return Array.from(els).filter(el => !el.closest("[data-tc-skip='true']"));
  }

  // Stap 1: specifieke artikel selectors
  const artikelSelectors = [
    "article p", ".article-body p", ".article__body p",
    ".content p", ".post-content p", ".article-content p",
    "main article p", ".nieuws-artikel p", ".article-text p"
  ];
  for (const sel of artikelSelectors) {
    const els = filterRuis(document.querySelectorAll(sel));
    if (els.length > 0) {
      const tekst = els.slice(0, 15).map(p => p.innerText).filter(isSchoneTekst).join(" ").substring(0, 2500);
      if (tekst.length > 100) return tekst;
    }
  }

  // Stap 2: bredere selectors
  const bredeSelectors = [
    "main p", "section p", ".description p", ".details p",
    ".body p", ".text p", ".entry p", ".post p"
  ];
  for (const sel of bredeSelectors) {
    const els = filterRuis(document.querySelectorAll(sel));
    if (els.length > 0) {
      const tekst = els.slice(0, 15).map(p => p.innerText).filter(isSchoneTekst).join(" ").substring(0, 2500);
      if (tekst.length > 100) return tekst;
    }
  }

  // Stap 3: alle p tags — ook gefilterd
  const alleTekst = filterRuis(document.querySelectorAll("p"))
    .filter(p => isSchoneTekst(p.innerText))
    .slice(0, 15).map(p => p.innerText).join(" ").substring(0, 2500);
  if (alleTekst.length > 100) return alleTekst;

  // Stap 4: li elementen — ook gefilterd
  const liTekst = filterRuis(document.querySelectorAll("li"))
    .filter(li => isSchoneTekst(li.innerText))
    .slice(0, 15).map(li => li.innerText).join(" ").substring(0, 2500);
  if (liTekst.length > 100) return liTekst;

  // Stap 5: body.innerText als laatste redmiddel
  return (document.body.innerText || "").replace(/\s+/g, " ").substring(0, 2500);
}

function vindZoekContext() {
  const selectors = [
    "article p", ".article-body p", ".article__body p",
    ".content p", ".post-content p", "main article p"
  ];
  for (const sel of selectors) {
    const tekst = document.querySelector(sel)?.innerText;
    if (tekst && tekst.length > 50) return tekst.substring(0, 300);
  }
  return Array.from(document.querySelectorAll("p"))
    .find(p =>
      p.innerText.length > 50 &&
      !p.innerText.toLowerCase().includes("cookies") &&
      !p.innerText.toLowerCase().includes("privacy")
    )?.innerText?.substring(0, 300) || "";
}


function isYouTubeReclame() {
  return !!(
    document.querySelector(".ad-showing") ||
    document.querySelector(".ytp-ad-player-overlay") ||
    document.querySelector(".ytp-ad-skip-button") ||
    document.querySelector("[class*='ad-interrupting']")
  );
}

function vindVideoContext() {
  if (location.hostname.includes("youtube.com")) {
    if (isYouTubeReclame()) return null;
    const titel        = document.querySelector("h1.ytd-video-primary-info-renderer, h1.style-scope.ytd-watch-metadata")?.innerText || "";
    // Kanaalnaam ophalen via kanaallink — YouTube laadt DOM asynchroon
    function haalKanaalNaam() {
      const link = [...document.querySelectorAll('a[href*="/@"]')]
        .map(el => el.textContent.trim().split('\n')[0].trim())
        .find(t => t.length > 1 && !t.includes('@') && !/^\d/.test(t));
      return link
        || document.querySelector("#channel-name, #owner #channel-name, ytd-channel-name")?.innerText?.split('\n')[0]?.trim()
        || "";
    }
    const kanaal = haalKanaalNaam();
    // Volledige beschrijving ophalen — uitgeklapt + ingeklapt + fallback
    function haalBeschrijving() {
      // Uitlezen — #expand is al geklikt bij opstarten (1500ms vertraging)
      const selectors = [
        "#description-inline-expander",
        "#description ytd-text-inline-expander",
        "ytd-watch-metadata #description",
        "#description-inline-expander yt-attributed-string",
        "#description ytd-text-inline-expander yt-attributed-string",
        "#snippet",
        "meta[name='description']"
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const tekst = sel.startsWith("meta") ? el.getAttribute("content") : el.innerText;
        if (tekst && tekst.length > 30) return tekst;
      }
      return "";
    }
    const volledigeBeschrijving = haalBeschrijving();

    // Ruis uit beschrijving filteren — alleen echte SEO-vulling eruit
    function filterBeschrijving(tekst) {
      if (!tekst) return "";
      const regels = tekst.split("\n");
      let slaOver = false;
      const schoon = regels.filter(regel => {
        const r = regel.trim().toLowerCase();
        if (!r || r.length < 2) return false;
        // Sectie headers die pure SEO-vulling inluiden — alles erna overslaan
        if (r === "related searches:" || r === "related searches") { slaOver = true; return false; }
        if (slaOver) return false;
        // Call-to-action regels — kort en generiek
        if ((r.startsWith("subscribe") || r.startsWith("like and") || r.startsWith("comment your")) && r.length < 40) return false;
        return true;
      });
      return schoon.join(" ").replace(/\s+/g, " ").trim();
    }
    const beschrijving = filterBeschrijving(volledigeBeschrijving);
    const tags         = Array.from(document.querySelectorAll("meta[property='og:video:tag']")).map(m => m.content).join(", ");
    const views        = document.querySelector(".view-count, #info .ytd-video-view-count-renderer")?.innerText || "";
    const abonnees     = document.querySelector("#owner-sub-count, #subscriber-count")?.innerText || "";
    const aiTag        = document.querySelector("ytd-badge-supported-renderer .badge-style-type-simple")?.innerText || "";
    const isAiContent  = beschrijving.toLowerCase().includes("ai generated") ||
                         beschrijving.toLowerCase().includes("ai-generated") ||
                         beschrijving.toLowerCase().includes("gemaakt met ai") ||
                         aiTag.toLowerCase().includes("ai") ||
                         tags.toLowerCase().includes("ai generated");
    // Shorts detectie — andere DOM structuur
    const isShort = location.pathname.startsWith('/shorts/');
    const shortsTitel = document.querySelector('ytd-reel-video-renderer[is-active] .title, .ytd-shorts .title')?.innerText
      || document.querySelector('h2.ytd-reel-video-renderer')?.innerText
      || document.querySelector('.ytd-shorts h2')?.innerText
      || document.querySelector('meta[name="title"]')?.content
      || document.title.split(' - YouTube')[0] || '';
    const shortsKanaal = document.querySelector('ytd-reel-video-renderer[is-active] #channel-name, .ytd-shorts #channel-name')?.innerText
      || document.querySelector('ytd-channel-name')?.innerText || '';
    const shortsCaption = document.querySelector('ytd-reel-video-renderer[is-active] #description, .ytd-shorts #description')?.innerText
      || document.querySelector('meta[property="og:description"]')?.content || '';
    // Duur uitlezen — betrouwbaarder dan pathname check
    const duurTekst = document.querySelector(".ytp-time-duration")?.innerText || "";
    const duurSeconden = duurTekst.split(":").reverse().reduce((acc, v, i) => acc + parseInt(v || 0) * Math.pow(60, i), 0);

    // Shorts zijn max 60 seconden — op duur, niet op pathname
    if (isShort || duurSeconden > 0 && duurSeconden <= 60) {
      return `Titel: ${shortsTitel || titel} | Kanaal: ${shortsKanaal || kanaal} | Abonnees: ${abonnees} | Tags: entertainment shorts | IsShort: ja | Beschrijving: ${shortsCaption.substring(0, 200)}`;
    }

    // Duur meesturen als signaal
    const duurLabel = duurSeconden === 0 ? "onbekend"
      : duurSeconden <= 900  ? "kort (onder 15 min)"
      : duurSeconden <= 3600 ? "middellang (15-60 min)"
      : "lang (boven 60 min)";

    return `Titel: ${titel} | Kanaal: ${kanaal} | Abonnees: ${abonnees} | Views: ${views} | Tags: ${tags} | Duur: ${duurLabel} | Beschrijving: ${beschrijving.substring(0, 1500)}`;
  }

  // Vimeo
  if (location.hostname.includes("vimeo.com")) {
    const titel     = document.querySelector(".clip_info-description h1, .player_container h1")?.innerText || document.title;
    const uploader  = document.querySelector(".byline a, .user-handle")?.innerText || "";
    const beschrijving = document.querySelector(".clip_description, .description")?.innerText || "";
    return `Titel: ${titel} | Uploader: ${uploader} | Beschrijving: ${beschrijving.substring(0, 400)}`;
  }

  // TikTok — breed net gooien via meerdere selectors + meta tags
  if (location.hostname.includes("tiktok.com")) {
    // Caption — meerdere selectors want TikTok wijzigt DOM regelmatig
    const caption = document.querySelector("[data-e2e='browse-video-desc']")?.innerText
      || document.querySelector("[data-e2e='video-desc']")?.innerText
      || document.querySelector(".video-meta-caption")?.innerText
      || document.querySelector("h1")?.innerText
      || document.querySelector('meta[property="og:description"]')?.content
      || document.title || "";

    // Gebruiker
    const gebruiker = document.querySelector("[data-e2e='browse-username']")?.innerText
      || document.querySelector("[data-e2e='video-author-uniqueid']")?.innerText
      || document.querySelector(".author-uniqueId")?.innerText
      || document.querySelector('meta[name="author"]')?.content || "";

    // Volgers en likes — fallback op 0
    const volgers = document.querySelector("[data-e2e='followers-count']")?.innerText
      || document.querySelector("[data-e2e='user-post-item-count']")?.innerText || "";

    const likes = document.querySelector("[data-e2e='like-count']")?.innerText
      || document.querySelector("[data-e2e='undefined-count']")?.innerText || "";

    // Hashtags uit caption halen
    const hashtagMatches = caption.match(/#\w+/g) || [];
    const tags = hashtagMatches.join(" ");

    return `Titel: ${caption} | Kanaal: ${gebruiker} | Abonnees: ${volgers} | Views: ${likes} likes | Tags: ${tags} | Beschrijving: ${caption}`;
  }

  // Generiek — fallback voor andere videoplatforms
  const ogTitle   = document.querySelector('meta[property="og:title"]')?.content || "";
  const ogDesc    = document.querySelector('meta[property="og:description"]')?.content || "";
  const auteur    = document.querySelector('[rel="author"], .author, .creator')?.innerText || "";
  return `Titel: ${ogTitle} | Auteur: ${auteur} | Beschrijving: ${ogDesc.substring(0, 400)}`;
}

function vindReacties() {
  const nujijSelectors = [
    ".nujij__comment-body", ".nujij__comment-body p",
    "[class*='nujij__comment-body']", "[class*='nujij__comment'] p"
  ];
  for (const sel of nujijSelectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0)
      return Array.from(els).map(el => el.innerText).join(" ").substring(0, 2000).toLowerCase();
  }
  const genericSelectors = [
    ".comment-body", ".comment-content", ".comment-text",
    ".reaction-body", ".reactie-tekst",
    "[class*='comment'] p", "[class*='reaction'] p"
  ];
  for (const sel of genericSelectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0)
      return Array.from(els).map(el => el.innerText).join(" ").substring(0, 2000).toLowerCase();
  }
  return "";
}

// ── Reactiecheck ──────────────────────────────────────────────

function startReactieCheck(vertraging) {
  setTimeout(() => {
    if (location.hostname.includes("mail.google.com")) return;
    if (huidigStrafbareContent) return;
    const reactiesTekst = vindReacties();
    if (!reactiesTekst || reactiesTekst.length < 20) return;
    if (!chrome.runtime || !chrome.runtime.sendMessage) return;

    chrome.runtime.sendMessage(
      { action: "start_check", alleenReactieCheck: true, reactiesTekst },
      (response) => {
        if (chrome.runtime.lastError) return;
        if (!response || !response.alleenReactieCheck) return;
        if (response.strafbareContent && !huidigStrafbareContent) {
          huidigStrafbareContent = true;
          updateMiniBarometer(huidigScore, true, huidigEmoji);
          if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, true, huidigEmoji, huidigBronType);
        }
      }
    );
  }, vertraging);
}

// ── Gmail detectie ────────────────────────────────────────────

let geopendeMail = null;
let gmailObserver = null;

function leesGmailMail() {
  const onderwerp     = document.querySelector(".hP")?.innerText || "";
  const afzenderElement = document.querySelector(".gD");
  const afzenderEmail = afzenderElement?.getAttribute("email") || "";
  const afzenderNaam  = afzenderElement?.getAttribute("name") || afzenderElement?.innerText || "";
  const mailContainer = document.querySelector(".a3s") || document.querySelector(".ii.gt");
  const mailTekst     = mailContainer?.innerText || "";
  const isSpam        = location.href.includes("spam") || !!document.querySelector(".aKS");
  if (!onderwerp && !mailTekst) return null;
  const domeinMatch = afzenderEmail.match(/@([a-zA-Z0-9.-]+)/);
  return {
    onderwerp, afzenderEmail, afzenderNaam,
    afzenderDomein: domeinMatch ? domeinMatch[1].toLowerCase() : "",
    mailTekst, isSpam
  };
}

function startGmailCheck() {
  const mailData = leesGmailMail();
  if (!mailData || mailData.onderwerp === geopendeMail) return;
  geopendeMail = mailData.onderwerp;
  phishingBanner.style.top = "-200px";
  updateMiniBarometer(50, false, "🤔");
  if (!chrome.runtime || !chrome.runtime.sendMessage) return;

  chrome.runtime.sendMessage({
    action: "start_check",
    text: mailData.onderwerp || "Email analyse",
    domein: mailData.afzenderDomein,
    paginaTekst: mailData.mailTekst.substring(0, 1000),
    artikelTekst: "", reactiesTekst: "", zoekContext: "",
    isEmail: true, isSpam: mailData.isSpam,
    afzenderNaam: mailData.afzenderNaam,
    afzenderDomein: mailData.afzenderDomein,
    afzenderEmail: mailData.afzenderEmail
  }, (response) => {
    if (chrome.runtime.lastError || !response || response.status !== "success") return;
    huidigScore   = response.score;
    huidigOordeel = response.oordeel;
    huidigUitleg  = response.uitleg;
    huidigBronnen = response.bronnen || [];
    huidigDeepfake = null;
    huidigStrafbareContent = false;
    huidigEmoji = response.emoji || "😊";
    updateMiniBarometer(huidigScore, false, huidigEmoji);
    if (response.phishing?.actief) toonPhishingWaarschuwing(response.phishing);
    if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, null, false, huidigEmoji, huidigBronType);
  });
}

function initialiseerGmail() {
  if (!location.hostname.includes("mail.google.com")) return;
  if (gmailObserver) gmailObserver.disconnect();
  gmailObserver = new MutationObserver(() => {
    if (document.querySelector(".h7")) setTimeout(startGmailCheck, 1000);
  });
  gmailObserver.observe(document.body, { childList: true, subtree: true });
}

// ── Hoofdcheck ────────────────────────────────────────────────

function toonLimietBerikt() {
  knop.style.background = hexNaarRgba("#2d1b1b", transparantie);
  knop.innerHTML = `<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;"><span style="font-size:28px;">🔒</span></div>`;
  if (popupOpen) {
    popup.style.background = hexNaarRgba(achtergrondKleur, transparantie);
    popup.style.border = `1px solid rgba(255,255,255,0.1)`;
    popup.style.color = tekstKleur;
    popup.innerHTML = `
      <div style="text-align:center;padding:20px 10px;">
        <div style="font-size:36px;margin-bottom:12px;">🔒</div>
        <div style="font-size:13px;font-weight:bold;color:#e67e22;margin-bottom:8px;">Limiet bereikt</div>
        <div style="font-size:11px;color:${tekstKleur};opacity:0.7;line-height:1.5;margin-bottom:14px;">Je hebt je 50 gratis checks gebruikt.<br>Premium versie komt binnenkort.</div>
        <div style="font-size:10px;color:${tekstKleur};opacity:0.4;">Wordt binnenkort vervangen door een eenmalig creditsysteem</div>
        <button id="tc-sluit" style="width:100%;margin-top:14px;padding:7px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:${tekstKleur};cursor:pointer;font-size:11px;">Close</button>
      </div>`;
    document.getElementById("tc-sluit").onclick = () => { popup.style.display = "none"; popupOpen = false; };
  }
}

const ZOEKMASCHINE_UITSLUIT = [
  "google.com", "google.nl", "google.be", "google.de", "google.fr",
  "bing.com", "duckduckgo.com", "yahoo.com", "startpage.com",
  "ecosia.org", "brave.com", "qwant.com", "search.yahoo.com",
  "yandex.com", "baidu.com",
  "edge://", "about:blank", "chrome://", "firefox://", "newtab"
];

// ── Altijd uitsluiten — geen enkel pad ───────────────────────
const ALTIJD_UITSLUIT = [
  // Social media — facebook en tiktok bewust niet uitgesloten (video/content check)
  "instagram.com", "twitter.com", "x.com",
  "linkedin.com", "pinterest.com", "snapchat.com", "threads.net",
  "reddit.com", "tumblr.com", "mastodon.social",

  // Video & streaming — youtube.com bewust niet uitgesloten (YouTube integratie)
  "netflix.com", "videoland.com",
  "disneyplus.com", "hbomax.com", "primevideo.com", "twitch.tv",
  "vimeo.com", "dailymotion.com", "peacocktv.com", "paramountplus.com",

  // Muziek
  "spotify.com", "deezer.com", "soundcloud.com", "tidal.com",
  "music.apple.com", "music.youtube.com",

  // Restaurants & reviews
  "tripadvisor.com", "tripadvisor.nl", "yelp.com", "iens.nl",
  "thefork.com", "opentable.com", "thuisafgehaald.nl",

  // Eten & bezorging
  "thuisbezorgd.nl", "ubereats.com", "deliveroo.nl", "dominos.nl",
  "mcdonalds.nl", "burgerking.nl", "kfc.com",

  // Reizen & accommodatie
  "booking.com", "airbnb.com", "airbnb.nl", "hotels.com",
  "skyscanner.nl", "skyscanner.com", "vliegtickets.nl", "kayak.com",
  "expedia.com", "trivago.nl", "hostelworld.com",

  // Routeplanners & kaarten
  "maps.google.com", "waze.com", "tomtom.com", "flitsmeister.nl",
  "route.nl", "anwb.nl",

  // Bioscopen & tickets
  "pathe.nl", "kinepolis.nl", "ticketmaster.nl", "ticketmaster.com",
  "eventbrite.nl", "eventbrite.com", "ticketswap.nl", "ticketswap.com",
  "uitagenda.nl", "podiuminfo.nl",

  // Productiviteit & tools
  "calendar.google.com", "outlook.live.com", "notion.so",
  "trello.com", "asana.com", "slack.com", "discord.com",
  "zoom.us", "teams.microsoft.com", "meet.google.com",

  // Bank & betalen
  "ing.nl", "abnamro.nl", "rabobank.nl", "paypal.com",
  "ideal.nl", "bunq.com", "revolut.com", "wise.com",

  // Developer & code
  "github.com", "gitlab.com", "stackoverflow.com", "npmjs.com",
  "pypi.org", "hub.docker.com", "codepen.io", "jsfiddle.net",
  "railway.app", "railway.com", "vercel.com", "netlify.com", "heroku.com",

  // Overig
  "whatsapp.com", "web.whatsapp.com", "telegram.org", "signal.org",
  "wetransfer.com", "dropbox.com", "drive.google.com", "docs.google.com",

  // Overheidsportalen & DigiD omgeving
  "mijn.overheid.nl", "digid.nl", "mijnoverheid.nl",
  "magister.net", "somtoday.nl",

  // HR & salarisportalen
  "afas.nl", "nmbrs.nl", "loket.nl",

  // Zorgportalen
  "mijncentraal.nl", "mijninterpolis.nl", "mijnvgz.nl",
  "mijncz.nl", "mijnzilveren.nl",

  // Ziekenhuis patiëntenportalen
  "mijnumcutrecht.nl", "myamsterdamumc.nl", "mijnlumc.nl",
  "mijnradboud.nl", "mijnisala.nl", "mijnspaarne.nl",

  // Werkgeversportalen
  "mijnwerknemers.nl", "mijnpersoneel.nl"
];

// ── Alleen homepagina uitsluiten — productpagina's wel checken ──
const UITSLUIT_DOMEINEN = [
  "bol.com", "amazon.nl", "amazon.com", "zalando.nl", "coolblue.nl",
  "mediamarkt.nl", "wehkamp.nl", "fonQ.nl", "alternate.nl",
  "ikea.com", "ikea.nl", "hm.com", "zara.com"
];

// ── URL patronen die we altijd overslaan ─────────────────────
const UITSLUIT_PATRONEN = [
  /\/(cart|checkout|basket|winkelwagen|betalen|payment)/i,
  /\/(login|signin|register|account|mijn-account)/i,
  /\/(search|zoeken)\?/i
];

function isUitgesloten() {
  const domein = location.hostname.replace("www.", "");
  const url    = location.href;
  const pad    = location.pathname;

  // Lege pagina's en browser-intern
  if (!domein || url === "about:blank" || url.startsWith("chrome://") ||
      url.startsWith("edge://") || url.startsWith("moz-extension://")) return true;

  // Portalen met mijn. prefix — altijd uitsluiten
  if (domein.startsWith("mijn.") || domein.startsWith("my.") || domein.startsWith("portal.")) return true;

  // YouTube — videopaginas en Shorts checken, homepage en zoeken uitsluiten
  if ((domein === "youtube.com" || domein.endsWith(".youtube.com")) && !pad.startsWith("/watch") && !pad.startsWith("/shorts")) return true;

  // Zoekpagina's
  const isZoekDomein = ZOEKMASCHINE_UITSLUIT.some(d => domein === d || domein.endsWith("." + d));
  if (isZoekDomein) {
    const zoekParam = new URLSearchParams(location.search);
    const heeftZoekQuery = zoekParam.has("q") || zoekParam.has("query") || zoekParam.has("search");
    const isHomepagina   = pad === "/" || pad === "";
    const isZoekPad      = /^\/(search|zoek|results|web)/.test(pad);
    if (isHomepagina || heeftZoekQuery || isZoekPad) return true;
  }

  // Altijd uitsluiten — op elk pad
  if (ALTIJD_UITSLUIT.some(d => domein === d || domein.endsWith("." + d))) return true;

  // Alleen homepagina uitsluiten — artikelen/producten wel checken
  const isGedeeltelijkUitgesloten = UITSLUIT_DOMEINEN.some(d => domein === d || domein.endsWith("." + d));
  if (isGedeeltelijkUitgesloten && (pad === "/" || pad === "" || pad.length < 4)) return true;

  // Uitgesloten URL patronen
  if (UITSLUIT_PATRONEN.some(p => p.test(pad))) return true;

  return false;
}

const ZOEKMASCHINE_DOMEINEN = [
  "google.com", "google.nl", "google.be", "google.de", "google.fr",
  "bing.com", "duckduckgo.com", "yahoo.com", "startpage.com",
  "ecosia.org", "brave.com", "qwant.com"
];

function isZoekpagina() { return isUitgesloten(); }

function isActieveZoekopdracht() {
  const domein = location.hostname.replace("www.", "");
  const zoekParam = new URLSearchParams(location.search);
  return ZOEKMASCHINE_DOMEINEN.some(d => domein === d || domein.endsWith("." + d))
    && (zoekParam.has("q") || zoekParam.has("query") || zoekParam.has("search"));
}

function startCheck() {
  if (location.hostname.includes("mail.google.com")) { initialiseerGmail(); return; }

  // Zoekpagina met actieve query — alleen phishing check, geen factcheck
  if (isActieveZoekopdracht()) {
    knop.style.display = "block";
    chrome.runtime.sendMessage(
      { action: "start_check", text: document.title, domein: location.hostname, paginaTekst: (document.body.innerText || "").substring(0, 1000).toLowerCase(), artikelTekst: "", reactiesTekst: "", zoekContext: "", afbeeldingUrl: null, videoContext: "", taal: "nl", alleenPhishing: true },
      (response) => {
        if (chrome.runtime.lastError || !response || response.status !== "success") return;
        huidigScore   = response.score;
        huidigOordeel = response.oordeel;
        huidigUitleg  = response.uitleg;
        huidigBronnen = [];
        huidigEmoji   = response.emoji || "🤔";
        updateMiniBarometer(huidigScore, false, huidigEmoji);
        if (response.phishing?.actief) toonPhishingWaarschuwing(response.phishing);
      }
    );
    return;
  }

  if (isZoekpagina()) {
    knop.style.display = "none"; // Verberg knop op uitgesloten pagina's
    return;
  }
  knop.style.display = "block"; // Zorg dat knop zichtbaar is op andere pagina's
  const text = document.querySelector("h1")?.innerText
    || document.querySelector("h2")?.innerText
    || document.title;
  if (!text || text.length < 3) return;

  // ── Dagelijks limiet ──────────────────────────────────────────
  const vandaag = new Date().toISOString().slice(0, 10);
  chrome.storage.local.get(["tc_checks_datum", "tc_checks_aantal"], (items) => {
    let aantal = (items.tc_checks_datum === vandaag) ? (items.tc_checks_aantal || 0) : 0;
    if (aantal >= 500) { toonLimietBerikt(); return; }
    chrome.storage.local.set({ tc_checks_datum: vandaag, tc_checks_aantal: aantal + 1 });

    const domein        = window.location.hostname.replace("www.", "").replace("nl.", "");
    const paginaTekst   = (document.body.innerText || "").substring(0, 1000).toLowerCase();
    const artikelTekst  = vindArtikelTekst();
    const reactiesTekst = vindReacties();
    const zoekContext   = vindZoekContext();
    const afbeeldingUrl = vindHoofdAfbeelding();

    toonLaadAnimatie();
    if (!chrome.runtime || !chrome.runtime.sendMessage) return;

    const isVideoPagina = location.hostname.includes("youtube.com") || location.hostname.includes("vimeo.com") || location.hostname.includes("tiktok.com");
    const videoContext = isVideoPagina ? vindVideoContext() : "";

    // YouTube reclame — knop verbergen
    if (location.hostname.includes("youtube.com") && videoContext === null) {
      knop.style.display = "none";
      return;
    }
    knop.style.display = "block";

    chrome.runtime.sendMessage(
      { action: "start_check", text, domein, url: window.location.href, paginaTekst, artikelTekst, reactiesTekst, zoekContext, afbeeldingUrl, videoContext, taal: detecteerTaal(artikelTekst || paginaTekst) },
      (response) => {
        if (chrome.runtime.lastError || !response || response.status !== "success") return;
        huidigScore    = response.score;
        huidigOordeel  = response.oordeel;
        huidigUitleg   = response.uitleg;
        huidigBronnen  = response.bronnen || [];
        huidigDeepfake = response.deepfake || null;
        huidigBronType = response.bronType || (response.score < 50 ? "weerlegging" : response.score < 70 ? "verificatie" : "verdieping");
        huidigManipulatie = response.manipulatie || [];
        huidigAiTekst    = response.aiTekst || 0;
        huidigArtikeltekst = artikelTekst || "";
        huidigBronBekend = response.bronBekend || false;
        huidigOnderwerpVerifieerbaar = response.onderwerpVerifieerbaar || false;
        huidigVerificatieBronnen = response.verificatieBronnen || [];
        huidigRodeVlaggen = response.rodeVlaggen || [];
        huidigEmoji    = response.emoji || (huidigScore >= 70 ? "😊" : huidigScore >= 50 ? "😟" : "😡");
        if (!huidigStrafbareContent) {
          huidigStrafbareContent = (response.strafbareContent === true) && (reactiesTekst.length > 0);
        }
        updateMiniBarometer(huidigScore, huidigStrafbareContent, huidigEmoji);
        if (response.phishing?.actief) toonPhishingWaarschuwing(response.phishing);
        if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji, huidigBronType);
      }
    );
  }); // einde chrome.storage.local.get
}

// ── Scroll detectie ───────────────────────────────────────────

let reactieCheckGedaan = false;
window.addEventListener("scroll", () => {
  if (reactieCheckGedaan || huidigStrafbareContent) return;
  setTimeout(() => {
    const reactiesTekst = vindReacties();
    if (!reactiesTekst || reactiesTekst.length < 20) return;
    reactieCheckGedaan = true;
    if (!chrome.runtime || !chrome.runtime.sendMessage) return;
    chrome.runtime.sendMessage(
      { action: "start_check", alleenReactieCheck: true, reactiesTekst },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.alleenReactieCheck) return;
        if (response.strafbareContent && !huidigStrafbareContent) {
          huidigStrafbareContent = true;
          updateMiniBarometer(huidigScore, true, huidigEmoji);
          if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, true, huidigEmoji, huidigBronType);
        }
      }
    );
  }, 500);
});

// ── YouTube reclame check — knop terugbrengen na reclame ────────
if (location.hostname.includes('youtube.com') && !location.pathname.startsWith('/shorts')) {
  setInterval(() => {
    if (!isYouTubeReclame() && knop.style.display === 'none') {
      knop.style.display = 'block';
      toonLaadAnimatie();
      setTimeout(() => { startCheck(); }, 1000);
    }
  }, 20000);
}

// ── URL verandering detecteren ────────────────────────────────

let laasteUrl = location.href;
setInterval(() => {
  if (location.href !== laasteUrl) {
    laasteUrl = location.href;
    phishingBanner.style.top = "-200px";
    geopendeMail = null;
    huidigStrafbareContent = false;
    reactieCheckGedaan = false;
    updateMiniBarometer(50, false, "🤔");
    setTimeout(() => {
      startCheck();
      startReactieCheck(3000);
      startReactieCheck(8000);
      startReactieCheck(12000);
    }, 3000);
  }
}, 1000);

// ── Opstarten ─────────────────────────────────────────────────

laadInstellingen((items) => {
  if (items.tc_positie_x) knop.style.right  = items.tc_positie_x;
  if (items.tc_positie_y) knop.style.bottom = items.tc_positie_y;
  toonLaadAnimatie();
  // YouTube: klik #expand vroeg zodat beschrijving uitklapt voor startCheck
  if (location.hostname.includes("youtube.com")) {
    setTimeout(() => { document.querySelector("#expand")?.click(); }, 1500);
  }
  // YouTube laadt kanaaldata asynchroon — extra wachttijd voor correcte kanaalnaam
  const vertraging = location.hostname.includes("youtube.com") ? 2500 : 0;
  setTimeout(() => {
    startCheck();
    startReactieCheck(3000);
    startReactieCheck(8000);
    startReactieCheck(12000);
  }, vertraging);
});