let huidigScore = 50;
let huidigOordeel = "Laden...";
let huidigUitleg = "";
let huidigBronnen = [];
let huidigDeepfake = null;
let huidigStrafbareContent = false;
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
  position: fixed;
  top: -200px;
  left: 0;
  right: 0;
  z-index: 9999999;
  background: linear-gradient(135deg, #c0392b, #e74c3c);
  color: white;
  font-family: Georgia, serif;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  transition: top 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;
document.body.appendChild(phishingBanner);

function toonPhishingWaarschuwing(phishing) {
  if (!phishing || !phishing.actief) return;

  const signalenHTML = phishing.signalen
    .map(s => `<span style="
      background:rgba(0,0,0,0.2); border-radius:4px;
      padding:2px 8px; font-size:11px; margin:2px;
      display:inline-block;
    ">${s}</span>`).join("");

  const officieelHTML = phishing.officieelDomein
    ? `<a href="https://${phishing.officieelDomein}" target="_blank" style="
        color:white; font-weight:bold; text-decoration:underline;
      ">Ga naar officiële site: ${phishing.officieelDomein}</a>`
    : "";

  phishingBanner.innerHTML = `
    <div style="
      display:flex; align-items:flex-start; justify-content:space-between;
      padding:14px 20px; max-width:100%;
    ">
      <div style="display:flex; align-items:flex-start; gap:14px; flex:1;">
        <div style="font-size:28px; line-height:1;">⚠️</div>
        <div>
          <div style="font-size:14px; font-weight:bold; margin-bottom:4px;">
            ${phishing.isEmail
              ? "Verdachte e-mail gedetecteerd"
              : "Mogelijk gevaarlijke pagina"} — Phishing waarschuwing
          </div>
          <div style="font-size:11px; opacity:0.9; margin-bottom:4px;">
            Gedetecteerde signalen: ${signalenHTML}
          </div>
          ${officieelHTML}
        </div>
      </div>
      <button id="tc-phishing-sluit" style="
        background:rgba(0,0,0,0.2); border:none; color:white;
        border-radius:6px; padding:4px 10px; cursor:pointer;
        font-size:12px; margin-left:10px; white-space:nowrap;
      ">✕ Sluiten</button>
    </div>
  `;

  setTimeout(() => { phishingBanner.style.top = "0px"; }, 100);
  document.getElementById("tc-phishing-sluit").onclick = () => {
    phishingBanner.style.top = "-200px";
  };
}

// ── Knop ────────────────────────────────────────────────────
const knop = document.createElement("div");
knop.id = "tc-knop";
knop.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.12);
  cursor: grab;
  z-index: 999998;
  box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  user-select: none;
`;
document.body.appendChild(knop);

const opgeslagenX = localStorage.getItem("tc_positie_x");
const opgeslagenY = localStorage.getItem("tc_positie_y");
if (opgeslagenX) knop.style.right = opgeslagenX;
if (opgeslagenY) knop.style.bottom = opgeslagenY;

function updateMiniBarometer(score, strafbareContent) {
  const kleur = getKleur(score);
  const hoek = -90 + (score / 100) * 180;
  knop.style.background = hexNaarRgba(achtergrondKleur, transparantie);

  const driehoekjeHTML = strafbareContent
    ? `<g transform="translate(32, 32)">
        <polygon points="0,-14 16,10 -16,10" fill="#e67e22" stroke="none"/>
        <text x="0" y="7" font-size="10" fill="white"
          text-anchor="middle" font-weight="bold">!</text>
      </g>`
    : "";

  knop.innerHTML = `
    <svg viewBox="0 0 64 64" width="64" height="64">
      <defs>
        <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#e74c3c"/>
          <stop offset="50%" stop-color="#f1c40f"/>
          <stop offset="100%" stop-color="#2ecc71"/>
        </linearGradient>
      </defs>
      <path d="M 10 44 A 22 22 0 0 1 54 44"
        fill="none" stroke="#2a2a3a" stroke-width="6" stroke-linecap="round"/>
      <path d="M 10 44 A 22 22 0 0 1 54 44"
        fill="none" stroke="url(#mg)" stroke-width="6" stroke-linecap="round"/>
      <g transform="translate(32, 44) rotate(${hoek})">
        <line x1="0" y1="0" x2="0" y2="-18"
          stroke="white" stroke-width="2" stroke-linecap="round"/>
        <circle cx="0" cy="0" r="3" fill="${kleur}"/>
      </g>
      <text x="32" y="58" font-size="9" fill="${kleur}"
        text-anchor="middle" font-family="Georgia" font-weight="bold">${score}</text>
      ${driehoekjeHTML}
    </svg>
  `;
}

// ── Popup ────────────────────────────────────────────────────
const popup = document.createElement("div");
popup.id = "tc-popup";
popup.style.cssText = `
  position: fixed;
  bottom: 94px;
  right: 20px;
  width: 275px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 18px;
  padding: 18px;
  z-index: 999999;
  box-shadow: 0 8px 40px rgba(0,0,0,0.45);
  display: none;
`;
document.body.appendChild(popup);

function updatePopup(score, oordeel, uitleg, bronnen, deepfake, strafbareContent) {
  const kleur = getKleur(score);
  const bg = hexNaarRgba(achtergrondKleur, transparantie);

  popup.style.background = bg;
  popup.style.border = `1px solid rgba(255,255,255,0.1)`;
  popup.style.color = tekstKleur;
  popup.style.fontFamily = lettertype;

  const bronnenHTML = bronnen && bronnen.length > 0
    ? bronnen.map(b => `
        <a href="${b}" target="_blank" style="
          display:block; color:#7ab3ef; font-size:11px;
          margin-top:6px; word-break:break-all;
          text-decoration:none; line-height:1.4;
        ">${b}</a>`).join("")
    : `<span style="color:#555; font-size:10px;">Geen onafhankelijke bronnen gevonden</span>`;

  const deepfakeHTML = deepfake && deepfake.deepfake_kans >= 50
    ? `<div style="
        margin-top:12px; padding:10px;
        background:rgba(231, 76, 60, 0.15);
        border:1px solid rgba(231, 76, 60, 0.4);
        border-radius:8px;
      ">
        <div style="font-size:10px; font-weight:bold; color:#e74c3c; margin-bottom:4px;">
          🤖 Mogelijk AI-gegenereerd beeld (${deepfake.deepfake_kans}%)
        </div>
        <div style="font-size:10px; color:${tekstKleur}; opacity:0.8;">
          ${deepfake.uitleg}
        </div>
      </div>`
    : "";

  const strafbareHTML = strafbareContent
    ? `<div style="
        margin-top:12px; padding:10px;
        background:rgba(230, 126, 34, 0.15);
        border:1px solid rgba(230, 126, 34, 0.4);
        border-radius:8px;
      ">
        <div style="font-size:10px; font-weight:bold; color:#e67e22; margin-bottom:4px;">
          ⚠️ Strafbare content gedetecteerd in reacties
        </div>
        <div style="font-size:10px; color:${tekstKleur}; opacity:0.8;">
          In de reacties van dit artikel is haatzaaiende of discriminerende inhoud gevonden.
        </div>
      </div>`
    : "";

  const schoneUitleg = uitleg
    ? uitleg.replace(" Let op: strafbare content gedetecteerd in de reacties.", "")
    : "";

  popup.innerHTML = `
    <div style="font-size:9px; letter-spacing:2px; color:${tekstKleur};
      opacity:0.5; text-transform:uppercase; margin-bottom:10px;
      font-family:${lettertype};">Feitencheck</div>

    <div style="font-size:15px; font-weight:bold;
      color:${kleur}; margin-bottom:6px;
      font-family:${lettertype};">${oordeel}</div>

    <div style="font-size:11px; color:${tekstKleur}; line-height:1.5;
      margin-bottom:14px; font-family:${lettertype};">${schoneUitleg}</div>

    ${strafbareHTML}
    ${deepfakeHTML}

    <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:10px; margin-top:10px;">
      <div style="font-size:9px; letter-spacing:1px; color:${tekstKleur};
        opacity:0.5; text-transform:uppercase; margin-bottom:6px;
        font-family:${lettertype};">Bronnen</div>
      ${bronnenHTML}
    </div>

    <button id="tc-sluit" style="
      width:100%; margin-top:14px; padding:7px;
      background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
      border-radius:8px; color:${tekstKleur}; cursor:pointer;
      font-size:11px; font-family:${lettertype};
    ">Sluiten</button>
  `;

  document.getElementById("tc-sluit").onclick = () => {
    popup.style.display = "none";
    popupOpen = false;
  };
}

// ── Instellingen menu ────────────────────────────────────────
const menu = document.createElement("div");
menu.id = "tc-menu";
menu.style.cssText = `
  position: fixed;
  width: 240px;
  background: rgba(18, 18, 35, 0.97);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 16px;
  z-index: 9999999;
  font-family: Georgia, serif;
  color: #eee;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  display: none;
`;

menu.innerHTML = `
  <div style="font-size:9px; letter-spacing:2px; color:#555;
    text-transform:uppercase; margin-bottom:14px;">Instellingen</div>

  <div style="font-size:11px; color:#aaa; margin-bottom:5px;">Transparantie</div>
  <input id="tc-trans" type="range" min="0.1" max="1" step="0.05"
    value="${transparantie}"
    style="width:100%; accent-color:#7ab3ef; margin-bottom:14px;"/>

  <div style="font-size:11px; color:#aaa; margin-bottom:5px;">Achtergrondkleur</div>
  <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
    ${[
      ["#121223","Donker"],["#1a1a1a","Zwart"],["#0d2137","Nacht"],
      ["#1e3a1e","Groen"],["#2d1b1b","Rood"],["#f0f0fa","Licht"],["#ffffff","Wit"]
    ].map(([kleur, naam]) => `
      <button data-kleur="${kleur}" style="
        padding:4px 8px; border-radius:6px; cursor:pointer;
        font-size:10px; border:1px solid rgba(255,255,255,0.2);
        background:${kleur};
        color:${["#f0f0fa","#ffffff"].includes(kleur) ? "#333" : "#eee"};
      ">${naam}</button>
    `).join("")}
  </div>

  <div style="font-size:11px; color:#aaa; margin-bottom:5px;">Tekstkleur</div>
  <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
    ${[
      ["#eeeeee","Wit"],["#000000","Zwart"],["#ffd700","Goud"],
      ["#90ee90","Lichtgroen"],["#add8e6","Lichtblauw"]
    ].map(([kleur, naam]) => `
      <button data-tekst="${kleur}" style="
        padding:4px 8px; border-radius:6px; cursor:pointer;
        font-size:10px; border:1px solid rgba(255,255,255,0.2);
        background:#2a2a3a; color:${kleur};
      ">${naam}</button>
    `).join("")}
  </div>

  <div style="font-size:11px; color:#aaa; margin-bottom:5px;">Lettertype</div>
  <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
    ${[
      ["Georgia, serif","Georgia"],["Arial, sans-serif","Arial"],
      ["'Courier New', monospace","Courier"],["Verdana, sans-serif","Verdana"],
      ["'Times New Roman', serif","Times"]
    ].map(([font, naam]) => `
      <button data-font="${font}" style="
        padding:4px 8px; border-radius:6px; cursor:pointer;
        font-size:10px; border:1px solid rgba(255,255,255,0.2);
        background:#2a2a3a; color:#eee; font-family:${font};
      ">${naam}</button>
    `).join("")}
  </div>

  <button id="tc-menu-sluit" style="
    width:100%; padding:7px;
    background:rgba(255,255,255,0.06); border:1px solid #333;
    border-radius:8px; color:#888; cursor:pointer; font-size:11px;
  ">Sluiten</button>
`;
document.body.appendChild(menu);

document.getElementById("tc-trans").oninput = (e) => {
  transparantie = parseFloat(e.target.value);
  updateMiniBarometer(huidigScore, huidigStrafbareContent);
  if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent);
  slaInstellingenOp();
};

menu.querySelectorAll("[data-kleur]").forEach(btn => {
  btn.onclick = () => {
    achtergrondKleur = btn.dataset.kleur;
    updateMiniBarometer(huidigScore, huidigStrafbareContent);
    if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent);
    slaInstellingenOp();
  };
});

menu.querySelectorAll("[data-tekst]").forEach(btn => {
  btn.onclick = () => {
    tekstKleur = btn.dataset.tekst;
    if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent);
    slaInstellingenOp();
  };
});

menu.querySelectorAll("[data-font]").forEach(btn => {
  btn.onclick = () => {
    lettertype = btn.dataset.font;
    if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent);
    slaInstellingenOp();
  };
});

document.getElementById("tc-menu-sluit").onclick = () => {
  menu.style.display = "none";
};

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && e.target !== knop) {
    menu.style.display = "none";
  }
});

// ── Versleepbaar ─────────────────────────────────────────────
let sleepX = 0, sleepY = 0, sleepActief = false, heeftGesleept = false;

knop.addEventListener("mousedown", (e) => {
  if (e.button === 2) return;
  sleepActief = true;
  heeftGesleept = false;
  sleepX = e.clientX;
  sleepY = e.clientY;
  knop.style.cursor = "grabbing";
  e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
  if (!sleepActief) return;
  const dx = e.clientX - sleepX;
  const dy = e.clientY - sleepY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) heeftGesleept = true;
  sleepX = e.clientX;
  sleepY = e.clientY;
  const huidigRight = parseInt(knop.style.right) || 20;
  const huidigBottom = parseInt(knop.style.bottom) || 20;
  knop.style.right = Math.max(0, huidigRight - dx) + "px";
  knop.style.bottom = Math.max(0, huidigBottom - dy) + "px";
  popup.style.right = knop.style.right;
  popup.style.bottom = (parseInt(knop.style.bottom) + 74) + "px";
});

document.addEventListener("mouseup", () => {
  if (sleepActief) {
    sleepActief = false;
    knop.style.cursor = "grab";
    slaInstellingenOp();
  }
});

knop.addEventListener("click", (e) => {
  if (heeftGesleept) return;
  popupOpen = !popupOpen;
  popup.style.display = popupOpen ? "block" : "none";
  if (popupOpen) updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent);
});

knop.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  menu.style.display = menu.style.display === "block" ? "none" : "block";
  const knopRect = knop.getBoundingClientRect();
  menu.style.right = (window.innerWidth - knopRect.right) + "px";
  menu.style.bottom = (window.innerHeight - knopRect.top + 8) + "px";
  menu.style.top = "auto";
});

// ── Hoofdafbeelding ophalen ──────────────────────────────────
function vindHoofdAfbeelding() {
  const ogAfbeelding = document.querySelector('meta[property="og:image"]');
  if (ogAfbeelding) return ogAfbeelding.getAttribute("content");

  const afbeeldingen = Array.from(document.querySelectorAll("img"))
    .filter(img => img.naturalWidth > 200 && img.naturalHeight > 200)
    .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));

  return afbeeldingen[0]?.src || null;
}

// ── Meer artikeltekst ophalen (voor thema-extractie) ─────────
function vindArtikelTekst() {
  const artikelSelectors = [
    "article p",
    ".article-body p",
    ".article__body p",
    ".content p",
    ".post-content p",
    ".article-content p",
    "main article p",
    ".nieuws-artikel p",
    ".article-text p"
  ];

  for (const selector of artikelSelectors) {
    const alineas = document.querySelectorAll(selector);
    if (alineas.length > 0) {
      return Array.from(alineas)
        .slice(0, 5) // Eerste 5 alinea's
        .map(p => p.innerText)
        .filter(t => t.length > 30)
        .join(" ")
        .substring(0, 800);
    }
  }

  // Fallback — alle alinea's
  const alleAlineas = Array.from(document.querySelectorAll("p"))
    .filter(p =>
      p.innerText.length > 30 &&
      !p.innerText.toLowerCase().includes("cookies") &&
      !p.innerText.toLowerCase().includes("privacy") &&
      !p.innerText.toLowerCase().includes("huisregel") &&
      !p.innerText.toLowerCase().includes("moderatie")
    )
    .slice(0, 5);

  return alleAlineas
    .map(p => p.innerText)
    .join(" ")
    .substring(0, 800);
}

// ── Slimme zoekcontext (eerste alinea) ───────────────────────
function vindZoekContext() {
  const artikelSelectors = [
    "article p", ".article-body p", ".article__body p",
    ".content p", ".post-content p", ".article-content p",
    "main article p", ".nieuws-artikel p", ".article-text p"
  ];

  for (const selector of artikelSelectors) {
    const alinea = document.querySelector(selector)?.innerText;
    if (alinea && alinea.length > 50) return alinea.substring(0, 300);
  }

  const alleAlineas = Array.from(document.querySelectorAll("p"));
  const goedAlinea = alleAlineas.find(p =>
    p.innerText.length > 50 &&
    !p.innerText.toLowerCase().includes("huisregel") &&
    !p.innerText.toLowerCase().includes("moderatie") &&
    !p.innerText.toLowerCase().includes("respectvol") &&
    !p.innerText.toLowerCase().includes("reageer op") &&
    !p.innerText.toLowerCase().includes("cookies") &&
    !p.innerText.toLowerCase().includes("privacy")
  );

  return goedAlinea?.innerText?.substring(0, 300) || "";
}

// ── Reacties ophalen — alleen echte reactiesecties ───────────
function vindReacties() {
  const nujijSelectors = [
    ".nujij__comment-body",
    ".nujij__comment-body p",
    "[class*='nujij__comment-body']",
    "[class*='nujij__comment'] p"
  ];

  for (const selector of nujijSelectors) {
    const els = document.querySelectorAll(selector);
    if (els.length > 0) {
      return Array.from(els)
        .map(el => el.innerText)
        .join(" ")
        .substring(0, 2000)
        .toLowerCase();
    }
  }

  const genericSelectors = [
    ".comment-body", ".comment-content", ".comment-text",
    ".reaction-body", ".reactie-tekst",
    "[class*='comment'] p", "[class*='reaction'] p"
  ];

  for (const selector of genericSelectors) {
    const elementen = document.querySelectorAll(selector);
    if (elementen.length > 0) {
      return Array.from(elementen)
        .map(el => el.innerText)
        .join(" ")
        .substring(0, 2000)
        .toLowerCase();
    }
  }

  return "";
}

// ── Vertraagde reactiecheck ──────────────────────────────────
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
        text: document.querySelector("h1")?.innerText || document.title,
        domein: window.location.hostname.replace("www.", "").replace("nl.", ""),
        paginaTekst: "",
        artikelTekst: "",
        reactiesTekst,
        zoekContext: "",
        afbeeldingUrl: null
      },
      (response) => {
        if (chrome.runtime.lastError) return;
        if (!response || response.status !== "success") return;

        if (response.strafbareContent && !huidigStrafbareContent) {
          huidigStrafbareContent = true;
          updateMiniBarometer(huidigScore, true);
          if (popupOpen) {
            updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, true);
          }
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
  const afzenderNaam = afzenderElement?.getAttribute("name") ||
                       afzenderElement?.innerText || "";
  const mailContainer = document.querySelector(".a3s") ||
                        document.querySelector(".ii.gt");
  const mailTekst = mailContainer?.innerText || "";
  const isSpam = location.href.includes("spam") ||
                 !!document.querySelector(".aKS");

  if (!onderwerp && !mailTekst) return null;

  const domeinMatch = afzenderEmail.match(/@([a-zA-Z0-9.-]+)/);
  const afzenderDomein = domeinMatch ? domeinMatch[1].toLowerCase() : "";

  return { onderwerp, afzenderEmail, afzenderNaam, afzenderDomein, mailTekst, isSpam };
}

function startGmailCheck() {
  const mailData = leesGmailMail();
  if (!mailData) return;
  if (mailData.onderwerp === geopendeMail) return;
  geopendeMail = mailData.onderwerp;

  phishingBanner.style.top = "-200px";
  updateMiniBarometer(50, false);

  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage(
      {
        action: "start_check",
        text: mailData.onderwerp || "Email analyse",
        domein: mailData.afzenderDomein,
        paginaTekst: mailData.mailTekst.substring(0, 1000),
        artikelTekst: "",
        reactiesTekst: "",
        zoekContext: "",
        isEmail: true,
        isSpam: mailData.isSpam,
        afzenderNaam: mailData.afzenderNaam,
        afzenderDomein: mailData.afzenderDomein,
        afzenderEmail: mailData.afzenderEmail
      },
      (response) => {
        if (chrome.runtime.lastError) return;
        if (response && response.status === "success") {
          huidigScore = response.score;
          huidigOordeel = response.oordeel;
          huidigUitleg = response.uitleg;
          huidigBronnen = response.bronnen || [];
          huidigDeepfake = null;
          huidigStrafbareContent = false;

          updateMiniBarometer(huidigScore, false);

          if (response.phishing && response.phishing.actief) {
            toonPhishingWaarschuwing(response.phishing);
          }
          if (popupOpen) {
            updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, null, false);
          }
        }
      }
    );
  }
}

function initialiseerGmail() {
  if (!location.hostname.includes("mail.google.com")) return;
  if (gmailObserver) gmailObserver.disconnect();

  gmailObserver = new MutationObserver(() => {
    const mailOpen = document.querySelector(".h7");
    if (mailOpen) setTimeout(startGmailCheck, 1000);
  });

  gmailObserver.observe(document.body, { childList: true, subtree: true });
}

// ── Hoofdcheck ───────────────────────────────────────────────
function startCheck() {
  if (location.hostname.includes("mail.google.com")) {
    initialiseerGmail();
    return;
  }

  const text = document.querySelector("h1")?.innerText
    || document.querySelector("h2")?.innerText
    || document.title;

  if (!text || text.length < 3) return;

  const domein = window.location.hostname
    .replace("www.", "")
    .replace("nl.", "");

  const volledigeTekst = document.body.innerText || "";
  const paginaTekst = volledigeTekst.substring(0, 1000).toLowerCase();
  const artikelTekst = vindArtikelTekst(); // Eerste 5 alinea's
  const reactiesTekst = vindReacties();
  const zoekContext = vindZoekContext();
  const afbeeldingUrl = vindHoofdAfbeelding();

  updateMiniBarometer(50, false);

  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage(
      {
        action: "start_check",
        text,
        domein,
        paginaTekst,
        artikelTekst,
        reactiesTekst,
        zoekContext,
        afbeeldingUrl
      },
      (response) => {
        if (chrome.runtime.lastError) return;
        if (response && response.status === "success") {
          huidigScore = response.score;
          huidigOordeel = response.oordeel;
          huidigUitleg = response.uitleg;
          huidigBronnen = response.bronnen || [];
          huidigDeepfake = response.deepfake || null;
          huidigStrafbareContent = (response.strafbareContent === true) && (reactiesTekst.length > 0);

          updateMiniBarometer(huidigScore, huidigStrafbareContent);

          if (response.phishing && response.phishing.actief) {
            toonPhishingWaarschuwing(response.phishing);
          }
          if (popupOpen) {
            updatePopup(huidigScore, huidigOordeel, huidigUitleg, huidigBronnen, huidigDeepfake, huidigStrafbareContent);
          }
        }
      }
    );
  }
}

startCheck();

// Vertraagde reactiechecks
startReactieCheck(2000);
startReactieCheck(5000);

// ── URL verandering detecteren ───────────────────────────────
let laasteUrl = location.href;
setInterval(() => {
  if (location.href !== laasteUrl) {
    laasteUrl = location.href;
    phishingBanner.style.top = "-200px";
    geopendeMail = null;
    huidigStrafbareContent = false;
    updateMiniBarometer(50, false);
    setTimeout(() => {
      startCheck();
      startReactieCheck(2000);
      startReactieCheck(5000);
    }, 1500);
  }
}, 1000);