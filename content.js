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

// ── Phishing banner ──────────────────────────────────────────

const phishingBanner = document.createElement("div");
phishingBanner.id = "tc-phishing";
phishingBanner.style.cssText = `
  position:fixed;top:-200px;left:0;right:0;z-index:9999999;
  background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;
  font-family:Georgia,serif;box-shadow:0 4px 24px rgba(0,0,0,0.4);
  transition:top 0.5s cubic-bezier(0.175,0.885,0.32,1.275);
`;
document.body.appendChild(phishingBanner);

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
  const sluitKnop = document.getElementById("tc-phishing-sluit");
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
    <div style="font-size:11px;color:${tekstKleur};opacity:0.7;margin-bottom:6px;font-family:${lettertype};">${t.score}: <span style="color:${kleur};font-weight:bold;">${score}/100</span></div>
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
    <button id="tc-sluit" style="width:100%;margin-top:14px;padding:7px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:${tekstKleur};cursor:pointer;font-size:11px;font-family:${lettertype};">${t.close}</button>`;

  document.getElementById("tc-sluit").onclick = () => { popup.style.display = "none"; popupOpen = false; };

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

    const context = huidigUitleg + " " + huidigBronnen.join(" ");

    chrome.runtime.sendMessage(
      { action: "stel_vraag", vraag, context: context.substring(0, 500), taal: navigator.language || "en" },
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
  popupOpen = !popupOpen;
  popup.style.display = popupOpen ? "block" : "none";
  if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji, huidigBronType);
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

function vindArtikelTekst() {
  const uitsluitWoorden = ["cookies", "privacy", "huisregel", "copyright", "all rights reserved", "terms of service", "newsletter", "subscribe"];

  function isSchoneTekst(tekst) {
    const lower = tekst.toLowerCase();
    return tekst.length > 30 && !uitsluitWoorden.some(w => lower.includes(w));
  }

  // Stap 1: specifieke artikel selectors
  const artikelSelectors = [
    "article p", ".article-body p", ".article__body p",
    ".content p", ".post-content p", ".article-content p",
    "main article p", ".nieuws-artikel p", ".article-text p"
  ];
  for (const sel of artikelSelectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      const tekst = Array.from(els).slice(0, 15).map(p => p.innerText).filter(isSchoneTekst).join(" ").substring(0, 2500);
      if (tekst.length > 100) return tekst;
    }
  }

  // Stap 2: bredere selectors voor community/event/landingspaginas
  const bredeSelectors = [
    "main p", "section p", ".description p", ".details p",
    ".body p", ".text p", ".entry p", ".post p",
    "[class*=\'content\'] p", "[class*=\'description\'] p",
    "[class*=\'detail\'] p", "[class*=\'body\'] p"
  ];
  for (const sel of bredeSelectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      const tekst = Array.from(els).slice(0, 15).map(p => p.innerText).filter(isSchoneTekst).join(" ").substring(0, 2500);
      if (tekst.length > 100) return tekst;
    }
  }

  // Stap 3: alle p tags als fallback
  const alleTekst = Array.from(document.querySelectorAll("p"))
    .filter(p => isSchoneTekst(p.innerText))
    .slice(0, 15).map(p => p.innerText).join(" ").substring(0, 2500);
  if (alleTekst.length > 100) return alleTekst;

  // Stap 4: li elementen meenemen
  const liTekst = Array.from(document.querySelectorAll("li"))
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


function vindVideoContext() {
  // YouTube specifiek
  if (location.hostname.includes("youtube.com")) {
    const titel     = document.querySelector("h1.ytd-video-primary-info-renderer, h1.style-scope.ytd-watch-metadata")?.innerText || "";
    const kanaal    = document.querySelector("#channel-name, #owner #channel-name, ytd-channel-name")?.innerText || "";
    const beschrijving = document.querySelector("#description-inline-expander, #description ytd-text-inline-expander, #snippet")?.innerText || "";
    const tags      = Array.from(document.querySelectorAll("meta[property='og:video:tag']")).map(m => m.content).join(", ");
    const views     = document.querySelector(".view-count, #info .ytd-video-view-count-renderer")?.innerText || "";
    return `Titel: ${titel} | Kanaal: ${kanaal} | Views: ${views} | Tags: ${tags} | Beschrijving: ${beschrijving.substring(0, 400)}`;
  }

  // Vimeo
  if (location.hostname.includes("vimeo.com")) {
    const titel     = document.querySelector(".clip_info-description h1, .player_container h1")?.innerText || document.title;
    const uploader  = document.querySelector(".byline a, .user-handle")?.innerText || "";
    const beschrijving = document.querySelector(".clip_description, .description")?.innerText || "";
    return `Titel: ${titel} | Uploader: ${uploader} | Beschrijving: ${beschrijving.substring(0, 400)}`;
  }

  // TikTok
  if (location.hostname.includes("tiktok.com")) {
    const caption   = document.querySelector("[data-e2e='browse-video-desc'], .video-meta-caption")?.innerText || "";
    const gebruiker = document.querySelector("[data-e2e='browse-username'], .author-uniqueId")?.innerText || "";
    return `Gebruiker: ${gebruiker} | Caption: ${caption}`;
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
        <div style="font-size:13px;font-weight:bold;color:#e67e22;margin-bottom:8px;">Daily limit reached</div>
        <div style="font-size:11px;color:${tekstKleur};opacity:0.7;line-height:1.5;margin-bottom:14px;">You've used your 5 free checks for today.<br>Premium version coming soon.</div>
        <div style="font-size:10px;color:${tekstKleur};opacity:0.4;">Resets at midnight</div>
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
  // Browsers met ingebouwde zoekpagina
  "edge://", "about:blank", "chrome://", "firefox://", "newtab"
];

function isZoekpagina() {
  const domein = location.hostname;
  const pad = location.pathname;
  const zoekParam = new URLSearchParams(location.search);
  const url = location.href;

  // Nieuwe tabbladpagina's en lege pagina's
  if (!domein || url === "about:blank" || url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("moz-extension://")) return true;

  // Alleen uitsluiten als het écht een bekend zoekdomein is
  const isZoekDomein = ZOEKMASCHINE_UITSLUIT.some(d => domein === d || domein.endsWith("." + d));
  if (!isZoekDomein) return false; // Onbekend domein — altijd checken

  const heeftZoekQuery = zoekParam.has("q") || zoekParam.has("query") || zoekParam.has("search");
  const isHomepagina = pad === "/" || pad === "";
  const isZoekPad = /^\/(search|zoek|results|web)/.test(pad);

  return isHomepagina || heeftZoekQuery || isZoekPad;
}

function startCheck() {
  if (location.hostname.includes("mail.google.com")) { initialiseerGmail(); return; }
  if (isZoekpagina()) return; // Zoekpagina — niets doen
  const text = document.querySelector("h1")?.innerText
    || document.querySelector("h2")?.innerText
    || document.title;
  if (!text || text.length < 3) return;

  // ── Dagelijks limiet ──────────────────────────────────────────
  const vandaag = new Date().toISOString().slice(0, 10);
  chrome.storage.local.get(["tc_checks_datum", "tc_checks_aantal"], (items) => {
    let aantal = (items.tc_checks_datum === vandaag) ? (items.tc_checks_aantal || 0) : 0;
    if (aantal >= 100) { toonLimietBerikt(); return; }
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

    chrome.runtime.sendMessage(
      { action: "start_check", text, domein, url: window.location.href, paginaTekst, artikelTekst, reactiesTekst, zoekContext, afbeeldingUrl, videoContext, taal: navigator.language || "en" },
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
    }, 1500);
  }
}, 1000);

// ── Opstarten ─────────────────────────────────────────────────

laadInstellingen((items) => {
  if (items.tc_positie_x) knop.style.right  = items.tc_positie_x;
  if (items.tc_positie_y) knop.style.bottom = items.tc_positie_y;
  toonLaadAnimatie();
  startCheck();
  startReactieCheck(3000);
  startReactieCheck(8000);
  startReactieCheck(12000);
});