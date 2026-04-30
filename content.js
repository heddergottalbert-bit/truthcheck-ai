let huidigScore = 50;
let huidigOordeel = "Laden...";
let huidigUitleg = "";
let huidigBronnen = [];
let huidigDeepfake = null;
let huidigStrafbareContent = false;
let huidigEmoji = "🤔";
let popupOpen = false;
let transparantie = 0.75;
let achtergrondKleur = "#121223";
let tekstKleur = "#eeeeee";
let lettertype = "Georgia, serif";

function slaInstellingenOp() {
  localStorage.setItem("tc_transparantie", transparantie);
  localStorage.setItem("tc_achtergrond", achtergrondKleur);
  localStorage.setItem("tc_tekst", tekstKleur);
  localStorage.setItem("tc_lettertype", lettertype);
  localStorage.setItem("tc_positie_x", knop.style.right);
  localStorage.setItem("tc_positie_y", knop.style.bottom);
}

function laadInstellingen() {
  const t = localStorage.getItem("tc_transparantie");
  const a = localStorage.getItem("tc_achtergrond");
  const tk = localStorage.getItem("tc_tekst");
  const l = localStorage.getItem("tc_lettertype");
  if (t) transparantie = parseFloat(t);
  if (a) achtergrondKleur = a;
  if (tk) tekstKleur = tk;
  if (l) lettertype = l;
}

function hexNaarRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getKleur(score) {
  if (score < 30) return "#e74c3c";
  if (score < 50) return "#e67e22";
  if (score < 70) return "#f1c40f";
  return "#2ecc71";
}

laadInstellingen();

// ── Phishing banner ─────────────────────────────────────────
const phishingBanner = document.createElement("div");
phishingBanner.id = "tc-phishing";
phishingBanner.style.cssText = `
  position: fixed; top: -200px; left: 0; right: 0; z-index: 9999999;
  background: linear-gradient(135deg, #c0392b, #e74c3c); color: white;
  font-family: Georgia, serif; box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  transition: top 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;
document.body.appendChild(phishingBanner);

function toonPhishingWaarschuwing(phishing) {
  if (!phishing || !phishing.actief) return;
  const signalenHTML = (phishing.signalen || [])
    .map(s => `<span style="background:rgba(0,0,0,0.2);border-radius:4px;padding:2px 8px;font-size:11px;margin:2px;display:inline-block;">${s}</span>`).join("");
  const officieelHTML = phishing.officieelDomein
    ? `<a href="https://${phishing.officieelDomein}" target="_blank" style="color:white;font-weight:bold;text-decoration:underline;">Ga naar officiële site: ${phishing.officieelDomein}</a>`
    : "";
  phishingBanner.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:14px 20px;max-width:100%;">
      <div style="display:flex;align-items:flex-start;gap:14px;flex:1;">
        <div style="font-size:28px;line-height:1;">⚠️</div>
        <div>
          <div style="font-size:14px;font-weight:bold;margin-bottom:4px;">
            ${phishing.isEmail ? "Verdachte e-mail gedetecteerd" : "Mogelijk gevaarlijke pagina"} — Phishing waarschuwing
          </div>
          <div style="font-size:11px;opacity:0.9;margin-bottom:4px;">Gedetecteerde signalen: ${signalenHTML}</div>
          ${officieelHTML}
        </div>
      </div>
      <button id="tc-phishing-sluit" style="background:rgba(0,0,0,0.2);border:none;color:white;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;margin-left:10px;white-space:nowrap;">✕ Sluiten</button>
    </div>`;
  setTimeout(() => { phishingBanner.style.top = "0px"; }, 100);
  document.getElementById("tc-phishing-sluit").onclick = () => { phishingBanner.style.top = "-200px"; };
}

// ── Knop ────────────────────────────────────────────────────
const knop = document.createElement("div");
knop.id = "tc-knop";
knop.style.cssText = `
  position:fixed;bottom:20px;right:20px;width:64px;height:64px;border-radius:50%;
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,0.12);cursor:grab;z-index:999998;
  box-shadow:0 4px 24px rgba(0,0,0,0.35);user-select:none;
`;
document.body.appendChild(knop);

try {
  const opgeslagenX = localStorage.getItem("tc_positie_x");
  const opgeslagenY = localStorage.getItem("tc_positie_y");
  if (opgeslagenX) knop.style.right = opgeslagenX;
  if (opgeslagenY) knop.style.bottom = opgeslagenY;
} catch(e) {}

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
  const strafbareEmoji = strafbareContent ? `<span style="font-size:20px;line-height:1;position:absolute;bottom:2px;right:2px;">😈</span>` : "";
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

function updatePopup(score, oordeel, uitleg, bronnen, deepfake, strafbareContent, emoji) {
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
    : `<span style="color:#555;font-size:10px;">Geen onafhankelijke bronnen gevonden</span>`;

  const deepfakeHTML = deepfake && deepfake.deepfake_kans >= 50
    ? `<div style="margin-top:12px;padding:10px;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);border-radius:8px;">
        <div style="font-size:10px;font-weight:bold;color:#e74c3c;margin-bottom:4px;">🤖 Mogelijk AI-gegenereerd beeld (${deepfake.deepfake_kans}%)</div>
        <div style="font-size:10px;color:${tekstKleur};opacity:0.8;">${deepfake.uitleg}</div>
       </div>` : "";

  const strafbareHTML = strafbareContent
    ? `<div style="margin-top:12px;padding:10px;background:rgba(128,0,128,0.15);border:1px solid rgba(128,0,128,0.4);border-radius:8px;">
        <div style="font-size:10px;font-weight:bold;color:#cc66ff;margin-bottom:4px;">😈 Strafbare content gedetecteerd in reacties</div>
        <div style="font-size:10px;color:${tekstKleur};opacity:0.8;">In de reacties van dit artikel is haatzaaiende of discriminerende inhoud gevonden.</div>
       </div>` : "";

  const hoofdEmoji = emoji || (score >= 70 ? "😊" : score >= 50 ? "😟" : "😡");
  const schoneUitleg = (uitleg || "").replace(" Let op: strafbare content gedetecteerd in de reacties.", "");

  popup.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
      <span style="font-size:32px;line-height:1;">${hoofdEmoji}</span>
      <div>
        <div style="font-size:9px;letter-spacing:2px;color:${tekstKleur};opacity:0.5;text-transform:uppercase;font-family:${lettertype};">Feitencheck</div>
        <div style="font-size:15px;font-weight:bold;color:${kleur};font-family:${lettertype};">${oordeel}</div>
      </div>
      <div style="margin-left:auto;background:rgba(255,255,255,0.1);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;font-weight:bold;color:${tekstKleur};" id="tc-vraag-knop" title="Stel een vraag">?</div>
    </div>
    <div style="font-size:11px;color:${tekstKleur};opacity:0.7;margin-bottom:6px;font-family:${lettertype};">Score: <span style="color:${kleur};font-weight:bold;">${score}/100</span></div>
    <div style="font-size:11px;color:${tekstKleur};line-height:1.5;margin-bottom:14px;font-family:${lettertype};">${schoneUitleg}</div>
    <div id="tc-vraag-veld" style="display:none;margin-bottom:12px;">
      <input id="tc-vraag-input" type="text" placeholder="Wat wilt u met deze content?" style="width:100%;padding:7px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:${tekstKleur};font-size:11px;font-family:${lettertype};box-sizing:border-box;"/>
    </div>
    ${strafbareHTML}
    ${deepfakeHTML}
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;margin-top:10px;">
      <div style="font-size:9px;letter-spacing:1px;color:${tekstKleur};opacity:0.5;text-transform:uppercase;margin-bottom:6px;font-family:${lettertype};">Bronnen</div>
      ${bronnenHTML}
    </div>
    <button id="tc-sluit" style="width:100%;margin-top:14px;padding:7px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:${tekstKleur};cursor:pointer;font-size:11px;font-family:${lettertype};">Sluiten</button>`;

  document.getElementById("tc-sluit").onclick = () => { popup.style.display = "none"; popupOpen = false; };
  document.getElementById("tc-vraag-knop").onclick = () => {
    const veld = document.getElementById("tc-vraag-veld");
    veld.style.display = veld.style.display === "none" ? "block" : "none";
    if (veld.style.display === "block") document.getElementById("tc-vraag-input").focus();
  };
}

// ── Instellingen menu ────────────────────────────────────────
const menu = document.createElement("div");
menu.id = "tc-menu";
menu.style.cssText = `
  position:fixed;width:240px;background:rgba(18,18,35,0.97);
  border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px;
  z-index:9999999;font-family:Georgia,serif;color:#eee;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);display:none;
`;
menu.innerHTML = `
  <div style="font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;margin-bottom:14px;">Instellingen</div>
  <div style="font-size:11px;color:#aaa;margin-bottom:5px;">Transparantie</div>
  <input id="tc-trans" type="range" min="0.1" max="1" step="0.05" value="${transparantie}" style="width:100%;accent-color:#7ab3ef;margin-bottom:14px;"/>
  <div style="font-size:11px;color:#aaa;margin-bottom:5px;">Achtergrondkleur</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    ${[["#121223","Donker"],["#1a1a1a","Zwart"],["#0d2137","Nacht"],["#1e3a1e","Groen"],["#2d1b1b","Rood"],["#f0f0fa","Licht"],["#ffffff","Wit"]]
      .map(([k,n]) => `<button data-kleur="${k}" style="padding:4px 8px;border-radius:6px;cursor:pointer;font-size:10px;border:1px solid rgba(255,255,255,0.2);background:${k};color:${["#f0f0fa","#ffffff"].includes(k)?"#333":"#eee"};">${n}</button>`).join("")}
  </div>
  <div style="font-size:11px;color:#aaa;margin-bottom:5px;">Tekstkleur</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    ${[["#eeeeee","Wit"],["#000000","Zwart"],["#ffd700","Goud"],["#90ee90","Lichtgroen"],["#add8e6","Lichtblauw"]]
      .map(([k,n]) => `<button data-tekst="${k}" style="padding:4px 8px;border-radius:6px;cursor:pointer;font-size:10px;border:1px solid rgba(255,255,255,0.2);background:#2a2a3a;color:${k};">${n}</button>`).join("")}
  </div>
  <div style="font-size:11px;color:#aaa;margin-bottom:5px;">Lettertype</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    ${[["Georgia, serif","Georgia"],["Arial, sans-serif","Arial"],["'Courier New', monospace","Courier"],["Verdana, sans-serif","Verdana"],["'Times New Roman', serif","Times"]]
      .map(([f,n]) => `<button data-font="${f}" style="padding:4px 8px;border-radius:6px;cursor:pointer;font-size:10px;border:1px solid rgba(255,255,255,0.2);background:#2a2a3a;color:#eee;font-family:${f};">${n}</button>`).join("")}
  </div>
  <button id="tc-menu-sluit" style="width:100%;padding:7px;background:rgba(255,255,255,0.06);border:1px solid #333;border-radius:8px;color:#888;cursor:pointer;font-size:11px;">Sluiten</button>`;
document.body.appendChild(menu);

document.getElementById("tc-trans").oninput = (e) => {
  transparantie = parseFloat(e.target.value);
  updateMiniBarometer(huidigScore, huidigStrafbareContent, huidigEmoji);
  if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji);
  slaInstellingenOp();
};
menu.querySelectorAll("[data-kleur]").forEach(btn => {
  btn.onclick = () => { achtergrondKleur = btn.dataset.kleur; updateMiniBarometer(huidigScore, huidigStrafbareContent, huidigEmoji); if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji); slaInstellingenOp(); };
});
menu.querySelectorAll("[data-tekst]").forEach(btn => {
  btn.onclick = () => { tekstKleur = btn.dataset.tekst; if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji); slaInstellingenOp(); };
});
menu.querySelectorAll("[data-font]").forEach(btn => {
  btn.onclick = () => { lettertype = btn.dataset.font; if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji); slaInstellingenOp(); };
});
document.getElementById("tc-menu-sluit").onclick = () => { menu.style.display = "none"; };
document.addEventListener("click", (e) => { if (!menu.contains(e.target) && e.target !== knop) menu.style.display = "none"; });

// ── Versleepbaar ─────────────────────────────────────────────
let sleepX = 0, sleepY = 0, sleepActief = false, heeftGesleept = false;
knop.addEventListener("mousedown", (e) => {
  if (e.button === 2) return;
  sleepActief = true; heeftGesleept = false; sleepX = e.clientX; sleepY = e.clientY;
  knop.style.cursor = "grabbing"; e.preventDefault();
});
document.addEventListener("mousemove", (e) => {
  if (!sleepActief) return;
  const dx = e.clientX - sleepX; const dy = e.clientY - sleepY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) heeftGesleept = true;
  sleepX = e.clientX; sleepY = e.clientY;
  const hr = parseInt(knop.style.right) || 20; const hb = parseInt(knop.style.bottom) || 20;
  knop.style.right = Math.max(0, hr - dx) + "px"; knop.style.bottom = Math.max(0, hb - dy) + "px";
  popup.style.right = knop.style.right; popup.style.bottom = (parseInt(knop.style.bottom) + 74) + "px";
});
document.addEventListener("mouseup", () => { if (sleepActief) { sleepActief = false; knop.style.cursor = "grab"; slaInstellingenOp(); } });
knop.addEventListener("click", (e) => {
  if (heeftGesleept) return;
  popupOpen = !popupOpen; popup.style.display = popupOpen ? "block" : "none";
  if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji);
});
knop.addEventListener("contextmenu", (e) => {
  e.preventDefault(); menu.style.display = menu.style.display === "block" ? "none" : "block";
  const r = knop.getBoundingClientRect();
  menu.style.right = (window.innerWidth - r.right) + "px"; menu.style.bottom = (window.innerHeight - r.top + 8) + "px"; menu.style.top = "auto";
});

// ── Hulpfuncties ─────────────────────────────────────────────
function vindHoofdAfbeelding() {
  const og = document.querySelector('meta[property="og:image"]');
  if (og) return og.getAttribute("content");
  const imgs = Array.from(document.querySelectorAll("img"))
    .filter(img => img.naturalWidth > 200 && img.naturalHeight > 200)
    .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
  return imgs[0]?.src || null;
}

function vindArtikelTekst() {
  const selectors = ["article p",".article-body p",".article__body p",".content p",".post-content p",".article-content p","main article p",".nieuws-artikel p",".article-text p"];
  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      return Array.from(els).slice(0, 5).map(p => p.innerText).filter(t => t.length > 30).join(" ").substring(0, 800);
    }
  }
  return Array.from(document.querySelectorAll("p"))
    .filter(p => p.innerText.length > 30 && !p.innerText.toLowerCase().includes("cookies") && !p.innerText.toLowerCase().includes("privacy") && !p.innerText.toLowerCase().includes("huisregel"))
    .slice(0, 5).map(p => p.innerText).join(" ").substring(0, 800);
}

function vindZoekContext() {
  const selectors = ["article p",".article-body p",".article__body p",".content p",".post-content p","main article p"];
  for (const sel of selectors) {
    const t = document.querySelector(sel)?.innerText;
    if (t && t.length > 50) return t.substring(0, 300);
  }
  return Array.from(document.querySelectorAll("p"))
    .find(p => p.innerText.length > 50 && !p.innerText.toLowerCase().includes("cookies") && !p.innerText.toLowerCase().includes("privacy"))
    ?.innerText?.substring(0, 300) || "";
}

function vindReacties() {
  const nujijSelectors = [".nujij__comment-body",".nujij__comment-body p","[class*='nujij__comment-body']","[class*='nujij__comment'] p"];
  for (const sel of nujijSelectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) return Array.from(els).map(el => el.innerText).join(" ").substring(0, 2000).toLowerCase();
  }
  const genericSelectors = [".comment-body",".comment-content",".comment-text",".reaction-body",".reactie-tekst","[class*='comment'] p","[class*='reaction'] p"];
  for (const sel of genericSelectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) return Array.from(els).map(el => el.innerText).join(" ").substring(0, 2000).toLowerCase();
  }
  return ""; // NOOIT paginatekst als fallback
}

// ── Vertraagde reactiecheck — VOLLEDIG ONTKOPPELD van feitencheck ──
function startReactieCheck(vertraging) {
  setTimeout(() => {
    if (location.hostname.includes("mail.google.com")) return;
    if (huidigStrafbareContent) return;
    const reactiesTekst = vindReacties();
    if (!reactiesTekst || reactiesTekst.length < 20) return;
    if (!chrome.runtime || !chrome.runtime.sendMessage) return;

    chrome.runtime.sendMessage(
      {
        action: "start_check",
        alleenReactieCheck: true, // Signaal: alleen reacties checken, feitencheck NIET aanraken
        reactiesTekst
      },
      (response) => {
        if (chrome.runtime.lastError) return;
        if (!response || !response.alleenReactieCheck) return;
        if (response.strafbareContent && !huidigStrafbareContent) {
          huidigStrafbareContent = true;
          updateMiniBarometer(huidigScore, true, huidigEmoji);
          if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, true, huidigEmoji);
        }
      }
    );
  }, vertraging);
}

// ── Gmail detectie ───────────────────────────────────────────
let geopendeMail = null;
let gmailObserver = null;

function leesGmailMail() {
  const onderwerp = document.querySelector(".hP")?.innerText || "";
  const afzenderElement = document.querySelector(".gD");
  const afzenderEmail = afzenderElement?.getAttribute("email") || "";
  const afzenderNaam = afzenderElement?.getAttribute("name") || afzenderElement?.innerText || "";
  const mailContainer = document.querySelector(".a3s") || document.querySelector(".ii.gt");
  const mailTekst = mailContainer?.innerText || "";
  const isSpam = location.href.includes("spam") || !!document.querySelector(".aKS");
  if (!onderwerp && !mailTekst) return null;
  const domeinMatch = afzenderEmail.match(/@([a-zA-Z0-9.-]+)/);
  return { onderwerp, afzenderEmail, afzenderNaam, afzenderDomein: domeinMatch ? domeinMatch[1].toLowerCase() : "", mailTekst, isSpam };
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
    afzenderNaam: mailData.afzenderNaam, afzenderDomein: mailData.afzenderDomein, afzenderEmail: mailData.afzenderEmail
  }, (response) => {
    if (chrome.runtime.lastError || !response || response.status !== "success") return;
    huidigScore = response.score; huidigOordeel = response.oordeel;
    huidigUitleg = response.uitleg; huidigBronnen = response.bronnen || [];
    huidigDeepfake = null; huidigStrafbareContent = false;
    updateMiniBarometer(huidigScore, false, huidigEmoji);
    if (response.phishing?.actief) toonPhishingWaarschuwing(response.phishing);
    if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, null, false, huidigEmoji);
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

// ── Hoofdcheck ───────────────────────────────────────────────
function startCheck() {
  if (location.hostname.includes("mail.google.com")) { initialiseerGmail(); return; }
  const text = document.querySelector("h1")?.innerText || document.querySelector("h2")?.innerText || document.title;
  if (!text || text.length < 3) return;
  const domein = window.location.hostname.replace("www.", "").replace("nl.", "");
  const paginaTekst = (document.body.innerText || "").substring(0, 1000).toLowerCase();
  const artikelTekst = vindArtikelTekst();
  const reactiesTekst = vindReacties();
  const zoekContext = vindZoekContext();
  const afbeeldingUrl = vindHoofdAfbeelding();
  toonLaadAnimatie();
  if (!chrome.runtime || !chrome.runtime.sendMessage) return;
  chrome.runtime.sendMessage(
    { action: "start_check", text, domein, paginaTekst, artikelTekst, reactiesTekst, zoekContext, afbeeldingUrl },
    (response) => {
      if (chrome.runtime.lastError || !response || response.status !== "success") return;
      huidigScore = response.score; huidigOordeel = response.oordeel;
      huidigUitleg = response.uitleg; huidigBronnen = response.bronnen || [];
      huidigDeepfake = response.deepfake || null;
      huidigEmoji = response.emoji || (huidigScore >= 70 ? "😊" : huidigScore >= 50 ? "😟" : "😡");
      if (!huidigStrafbareContent) {
        huidigStrafbareContent = (response.strafbareContent === true) && (reactiesTekst.length > 0);
      }
      updateMiniBarometer(huidigScore, huidigStrafbareContent, huidigEmoji);
      if (response.phishing?.actief) toonPhishingWaarschuwing(response.phishing);
      if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent, huidigEmoji);
    }
  );
}
   

startCheck();
startReactieCheck(3000);
startReactieCheck(8000);
startReactieCheck(12000);
// ── Scroll detectie voor reacties ────────────────────────────
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
          if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, true, huidigEmoji);
        }
      }
    );
  }, 500);
});
  // ── URL verandering detecteren ───────────────────────────────
let laasteUrl = location.href;
setInterval(() => {
  if (location.href !== laasteUrl) {
    laasteUrl = location.href;
    phishingBanner.style.top = "-200px";
    geopendeMail = null;
    huidigStrafbareContent = false;
    reactieCheckGedaan = false;
    updateMiniBarometer(50, false, "🤔");
    setTimeout(() => { startCheck(); startReactieCheck(3000); startReactieCheck(8000); startReactieCheck(12000); }, 1500);
  }
}, 1000);