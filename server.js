const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'TruthCheck AI server running' });
});

// ── Feitencheck ───────────────────────────────────────────────
app.post('/api/factcheck', async (req, res) => {
  try {
    const { text, taal } = req.body;
    if (!text) return res.status(400).json({ error: 'Geen tekst meegegeven' });

    const taalCode = (taal || "en").substring(0, 2).toLowerCase();
    const antwoordTaal = taalCode === "nl" ? "Dutch" : "English";
    const manipulatieTechnieken = taalCode === "nl"
      ? `Gebruik ALLEEN deze zes technieken (in het Nederlands):
   - "Emotionele manipulatie: taal die angst of woede opwekt voordat je de feiten hebt gelezen"
   - "Imitatie: valselijk beweren een autoriteit of betrouwbare organisatie te vertegenwoordigen"
   - "Polarisatie: wij-zij taal die vijandigheid tussen groepen creëert"
   - "Complotdenken: suggereren dat een geheime elite de gebeurtenissen controleert"
   - "Ad hominem: de persoon aanvallen in plaats van het argument"
   - "Valse tegenstelling: slechts twee opties presenteren terwijl er veel meer zijn"`
      : `Use ONLY these six techniques (in English):
   - "Emotional manipulation: language designed to trigger fear or outrage before you've read the facts"
   - "Impersonation: falsely claiming to represent an authority or trusted organization"
   - "Polarization: us vs. them language designed to create hostility between groups"
   - "Conspiratorial ideation: implying a secretive elite group is controlling events"
   - "Ad hominem: attacking the person making an argument instead of the argument itself"
   - "False dichotomy: presenting only two options when many more exist"`;

    // Stap 1: OpenAI extraheert het hoofdthema
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a fact-checker. Always respond in ${antwoordTaal}. Analyze the text and return:
1. The main theme (1 sentence)
2. The key claim (1 sentence)
3. A credibility score 0-100
4. Short explanation (max 2 sentences)
5. Manipulation techniques — ONLY list techniques if score is 35 or below. ${manipulatieTechnieken}
   If score is above 35, always return an empty array for manipulatie.

STRICT SCORING RULES — always apply these:
- Conspiracy theories, hidden agendas, secret elites, deep state claims: score MAX 20
- Unverified sensationalist claims with fear language ("zet je schrap", "stilletjes gepubliceerd", "lockdown 2.0"): score MAX 25
- Claims implying government or institutional cover-up without evidence: score MAX 25
- Emotional manipulation combined with unverified claims: score MAX 30
- Alternative news sites known for misinformation (ninefornews, frontnieuws, etc.): score MAX 35
- Satire sites: score 75
- Known reliable news (NOS, BBC, Reuters, NRC): score MIN 75
- Scientific peer-reviewed sources: score MIN 85

Always respond in JSON: { "theme": "", "claim": "", "score": 0, "explanation": "", "manipulatie": [], "aiTekst": 0 }

6. AI-generated text probability (0-100): estimate the likelihood this text was written by AI. Consider: uniform sentence length, lack of personal voice, generic phrasing, no typos, overly structured. Return as "aiTekst": 0-100.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3
      })
    });

    const openaiData = await openaiRes.json();
    const content = openaiData.choices[0].message.content;
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { theme: 'Unknown', claim: text.slice(0, 100), score: 50, explanation: content };
    }

    const score = analysis.score || 50;
    const claim = analysis.claim || text.slice(0, 200);

    // Stap 2: Tavily — query afhankelijk van score
    // Hoge score (≥ 70): verdiepingsbronnen over het onderwerp
    // Lage score (< 50): weerleggingsbronnen die de claim ontkrachten
    // Midden (50-69): neutrale verificatiebronnen
    let tavilyQuery;
    if (score < 50) {
      tavilyQuery = `fact check debunk misleading "${claim}"`;
    } else if (score < 70) {
      tavilyQuery = `fact check verify "${claim}"`;
    } else {
      tavilyQuery = `${claim}`;
    }

    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: tavilyQuery,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: true
      })
    });

    const tavilyData = await tavilyRes.json();
    const bronnen = tavilyData.results || [];

    // Stap 3: Als Tavily niets teruggeeft, tweede poging met bredere query
    let finalBronnen = bronnen;
    if (finalBronnen.length === 0) {
      const tavilyRetry = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: analysis.theme || text.slice(0, 100),
          search_depth: 'basic',
          max_results: 5,
          include_answer: false
        })
      });
      const retryData = await tavilyRetry.json();
      finalBronnen = retryData.results || [];
    }

    const heeftBronnen = finalBronnen.length > 0;
    const gecorrigeerdeScore = (!heeftBronnen && score > 60) ? 60 : score;
    const bronVermelding = heeftBronnen
      ? ""
      : " Geen onafhankelijke bronnen gevonden — score is indicatief.";

    res.json({
      score: gecorrigeerdeScore,
      theme: analysis.theme,
      claim: analysis.claim,
      explanation: analysis.explanation + bronVermelding,
      manipulatie: analysis.manipulatie || [],
      aiTekst: analysis.aiTekst || 0,
      bronType: gecorrigeerdeScore < 50 ? 'weerlegging' : gecorrigeerdeScore < 70 ? 'verificatie' : 'verdieping',
      sources: finalBronnen,
      heeftBronnen,
      answer: tavilyData.answer || null
    });

  } catch (err) {
    console.error('Factcheck fout:', err);
    res.status(500).json({ error: 'Server fout bij feitencheck' });
  }
});

// ── Phishing detectie ─────────────────────────────────────────
app.post('/api/phishing', async (req, res) => {
  try {
    const { url, text } = req.body;
    if (!url && !text) return res.status(400).json({ error: 'Geen URL of tekst meegegeven' });

    const input = url || text;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a phishing detector. Always respond in English. Analyze the input and return:
- isPhishing: true/false
- riskScore: 0-100 (100 = definitely phishing)
- reasons: list of red flags
- advice: what should the user do
Respond in JSON: { "isPhishing": false, "riskScore": 0, "reasons": [], "advice": "" }`
          },
          { role: 'user', content: `Analyze this for phishing: ${input}` }
        ],
        temperature: 0.2
      })
    });

    const data = await openaiRes.json();
    const content = data.choices[0].message.content;
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { isPhishing: false, riskScore: 0, reasons: [], advice: content };
    }

    res.json(result);

  } catch (err) {
    console.error('Phishing fout:', err);
    res.status(500).json({ error: 'Server fout bij phishing check' });
  }
});

// ── Strafbare content detectie ────────────────────────────────
app.post('/api/harmful', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Geen tekst meegegeven' });

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a content moderator. Always respond in English. Analyze the text for harmful or hate speech content.
Return:
- isHarmful: true/false
- category: type of content (hate speech/threat/discrimination/incitement/none)
- severity: low/medium/high
- explanation: short explanation
Respond in JSON: { "isHarmful": false, "category": "none", "severity": "low", "explanation": "" }`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.2
      })
    });

    const data = await openaiRes.json();
    const content = data.choices[0].message.content;
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { isHarmful: false, category: 'geen', severity: 'laag', explanation: content };
    }

    res.json(result);

  } catch (err) {
    console.error('Harmful content fout:', err);
    res.status(500).json({ error: 'Server fout bij content check' });
  }
});


// ── Vraag beantwoorden ────────────────────────────────────────
app.post('/api/vraag', async (req, res) => {
  try {
    const { vraag, context, taal } = req.body;
    if (!vraag) return res.status(400).json({ error: 'Geen vraag meegegeven' });

    const taalCode = (taal || "en").substring(0, 2).toLowerCase();
    const antwoordTaal = taalCode === "nl" ? "Dutch" : "English";

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that answers questions about web page content. Always respond in ${antwoordTaal}. 
Answer the user's question directly and concisely based on the context provided. 
If the context doesn't contain enough information, search your knowledge to give a useful answer.
Keep your answer to 2-3 sentences maximum.`
          },
          {
            role: 'user',
            content: `Question: ${vraag}\n\nPage context: ${context || 'No context available'}`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await openaiRes.json();
    const antwoord = data.choices[0].message.content;

    // Tavily voor relevante bronnen bij de vraag
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: vraag,
        search_depth: 'basic',
        max_results: 3,
        include_answer: false
      })
    });

    const tavilyData = await tavilyRes.json();

    res.json({
      antwoord,
      bronnen: (tavilyData.results || []).map(r => r.url)
    });

  } catch (err) {
    console.error('Vraag fout:', err);
    res.status(500).json({ error: 'Server fout bij beantwoorden vraag' });
  }
});



// ── Deepfake detectie ─────────────────────────────────────────
app.post('/api/deepfake', async (req, res) => {
  try {
    const { afbeeldingUrl, titel, domein, videoContext } = req.body;

    // Stap 1: Titel/metadata check voor YouTube en video
    const titelLower = (titel || "").toLowerCase();
    const DEEPFAKE_WOORDEN = [
      "deepfake", "deep fake", "ai generated", "ai gegenereerd",
      "nep video", "fake video", "made with ai", "gemaakt met ai",
      "ai downfall", "ai animals", "ai cat", "ai dog", "ai short",
      "sora", "runway ml", "pika labs", "kling ai", "hailuo",
      "luma dream machine", "stable video", "veo 2", "movie gen"
    ];
    const BETROUWBARE_KANALEN = [
      "nos", "bbc", "reuters", "nieuwsuur", "vpro", "npo",
      "rtl nieuws", "ted", "vsauce", "veritasium", "kurzgesagt",
      "national geographic", "nasa", "who", "unicef"
    ];

    const aantalDeepfakeWoorden = DEEPFAKE_WOORDEN.filter(w => titelLower.includes(w)).length;
    const isBetrouwbaarKanaal = BETROUWBARE_KANALEN.some(k => titelLower.includes(k));

    // Context ook checken op deepfake woorden
    const contextLower = (videoContext || "").toLowerCase();
    const aantalContextWoorden = DEEPFAKE_WOORDEN.filter(w => contextLower.includes(w)).length;
    const isBetrouwbaarContext = BETROUWBARE_KANALEN.some(k => contextLower.includes(k));

    // Snelle score op basis van titel + context als geen afbeelding
    if (!afbeeldingUrl) {
      if (aantalDeepfakeWoorden >= 1 && aantalContextWoorden === 0 && isBetrouwbaarContext) {
        return res.json({ deepfake_kans: 20, uitleg: "Titel bevat 'deepfake' maar context wijst op een betrouwbaar kanaal of informatief artikel." });
      }
      if (aantalDeepfakeWoorden >= 1 && aantalContextWoorden >= 1) {
        return res.json({ deepfake_kans: 90, uitleg: "Zowel titel als beschrijving bevatten AI-video signalen." });
      }
      if (aantalDeepfakeWoorden >= 1) {
        return res.json({ deepfake_kans: 60, uitleg: "Titel bevat deepfake signalen — controleer de beschrijving en het kanaal." });
      }
      if (isBetrouwbaarKanaal || isBetrouwbaarContext) {
        return res.json({ deepfake_kans: 5, uitleg: "Betrouwbaar kanaal — lage kans op deepfake." });
      }
      return res.json({ deepfake_kans: 15, uitleg: "Geen directe deepfake signalen gevonden." });
    }

    // Stap 2: OpenAI Vision analyseert de afbeelding
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a deepfake and AI-generated image detector. Analyze the image and return ONLY valid JSON:
{ "deepfake_kans": 0-100, "uitleg": "short explanation in Dutch, max 1 sentence" }
Score 0 = definitely real, 100 = definitely AI generated or deepfake.
Look for: unnatural skin, weird lighting, blurry edges around faces, inconsistent shadows, too-perfect symmetry, strange backgrounds, AI art style.`
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: afbeeldingUrl, detail: "low" } },
              { type: "text", text: `Analyze this image for deepfake or AI generation. Page title: "${titel || ""}". Additional context: ${videoContext || "none"}` }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.2
      })
    });

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    let resultaat;
    try {
      const schoon = content.replace(/```json|```/g, "").trim();
      resultaat = JSON.parse(schoon);
    } catch {
      // Fallback op titelscore als Vision parse mislukt
      resultaat = {
        deepfake_kans: aantalDeepfakeWoorden >= 1 ? 85 : isBetrouwbaarKanaal ? 5 : 15,
        uitleg: "Visuele analyse niet beschikbaar."
      };
    }

    // Combineer vision score met titelscore
    if (aantalDeepfakeWoorden >= 1) {
      resultaat.deepfake_kans = Math.max(resultaat.deepfake_kans, 80);
    }

    res.json(resultaat);

  } catch (err) {
    console.error("Deepfake fout:", err);
    res.json({ deepfake_kans: 0, uitleg: "Deepfake analyse niet beschikbaar." });
  }
});

// ── Feedback opslaan ──────────────────────────────────────────
const fs = require('fs');
const path = require('path');

app.post('/api/feedback', async (req, res) => {
  try {
    const { url, score, oordeel, duim, tekst, timestamp } = req.body;
    
    const feedback = {
      timestamp: timestamp || new Date().toISOString(),
      url: url || 'onbekend',
      score: score || 0,
      oordeel: oordeel || '',
      duim: duim || 'geen',
      tekst: tekst || ''
    };

    // Log naar console (zichtbaar in Railway logs)
    console.log('FEEDBACK:', JSON.stringify(feedback));

    res.json({ status: 'ok' });

  } catch (err) {
    console.error('Feedback fout:', err);
    res.status(500).json({ error: 'Server fout bij feedback opslaan' });
  }
});

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TruthCheck AI server draait op poort ${PORT}`);
});