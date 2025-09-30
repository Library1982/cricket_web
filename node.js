// server.js (Node.js + Express + ws)
const express = require('express');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const app = express();
const wss = new WebSocket.Server({ noServer: true });

// Serve static frontend files
app.use(express.static('public'));  // assume your HTML + CSS + JS in public/

// Proxy live score
app.get('/api/live-score', async (req, res) => {
  // call real cricket API
  const apiKey = 'YOUR_CRICKET_API_KEY';
  const apiUrl = `https://cricketdata.org/api/v1/currentMatches?apikey=${apiKey}`;
  try {
    const resp = await fetch(apiUrl);
    const json = await resp.json();
    // parse the json to pick one match or suitable format
    let result = {};
    if (json && json.matches && json.matches.length > 0) {
      let m = json.matches[0];
      result = {
        match: `${m.teamA} vs ${m.teamB}`,
        score: `${m.score || ''}`
      };
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.json({});
  }
});

// Proxy news
app.get('/api/news', async (req, res) => {
  const newsApiKey = 'YOUR_NEWS_API_KEY';
  // example: using NewsAPI to fetch sports news
  const newsUrl = `https://newsapi.org/v2/top-headlines?category=sports&apiKey=${newsApiKey}`;
  try {
    const resp = await fetch(newsUrl);
    const j = await resp.json();
    const articles = (j.articles || []).slice(0, 5).map(a => ({
      title: a.title,
      link: a.url
    }));
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

// Chat WebSocket handling
wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    // broadcast to all connected
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });
});

// upgrade HTTP server to handle WebSocket
const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
});
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
