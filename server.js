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
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Geen tekst meegegeven' });

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
            content: `You are a fact-checker. Always respond in English, regardless of the input language. Analyze the text and return:
1. The main theme (1 sentence)
2. The key claim (1 sentence)
3. A credibility score 0-100
4. Short explanation (max 2 sentences)
5. Manipulation techniques — list of detected techniques (empty if none):
   Possible techniques: Emotional language, False urgency, Black-and-white thinking, False authority, Repetition as proof, Conspiracy thinking, Dehumanization, Cherry-picking
Always respond in JSON: { "theme": "", "claim": "", "score": 0, "explanation": "", "manipulatie": [] }`
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

    res.json({
      score,
      theme: analysis.theme,
      claim: analysis.claim,
      explanation: analysis.explanation,
      manipulatie: analysis.manipulatie || [],
      bronType: score < 50 ? 'weerlegging' : score < 70 ? 'verificatie' : 'verdieping',
      sources: finalBronnen,
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

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TruthCheck AI server draait op poort ${PORT}`);
});