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
  res.json({ status: 'TruthCheck AI server draait' });
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
            content: `Je bent een feitenchecker. Analyseer de tekst en geef terug:
1. Het hoofdthema (1 zin)
2. De belangrijkste claim (1 zin)
3. Een betrouwbaarheidsscore 0-100
4. Korte uitleg (max 2 zinnen)
Antwoord altijd in JSON: { "theme": "", "claim": "", "score": 0, "explanation": "" }`
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
      analysis = { theme: 'Onbekend', claim: text.slice(0, 100), score: 50, explanation: content };
    }

    // Stap 2: Tavily zoekt verificatiebronnen
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: analysis.claim || text.slice(0, 200),
        search_depth: 'advanced',
        max_results: 5,
        include_answer: true
      })
    });

    const tavilyData = await tavilyRes.json();

    res.json({
      score: analysis.score,
      theme: analysis.theme,
      claim: analysis.claim,
      explanation: analysis.explanation,
      sources: tavilyData.results || [],
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
            content: `Je bent een phishing-detector. Analyseer de input en geef terug:
- isPhishing: true/false
- riskScore: 0-100 (100 = zeker phishing)
- reasons: lijst van rode vlaggen
- advice: wat moet de gebruiker doen
Antwoord in JSON: { "isPhishing": false, "riskScore": 0, "reasons": [], "advice": "" }`
          },
          { role: 'user', content: `Analyseer dit op phishing: ${input}` }
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
            content: `Je bent een content moderator. Analyseer de tekst op strafbare of haatzaaiende inhoud.
Geef terug:
- isHarmful: true/false
- category: type inhoud (haatzaaien/bedreiging/discriminatie/opruiing/geen)
- severity: laag/middel/hoog
- explanation: korte uitleg
Antwoord in JSON: { "isHarmful": false, "category": "geen", "severity": "laag", "explanation": "" }`
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
