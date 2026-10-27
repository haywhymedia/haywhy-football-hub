const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HAYWHY MEDIA Football Hub</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#07111f;color:#f5f7fa;font-family:Arial,sans-serif}
header{background:#10243b;padding:24px 15px;text-align:center;border-bottom:3px solid #00df82}
header h1{color:#00df82;margin:0;font-size:29px}
header p{color:#d5e1ed}
nav{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:14px}
nav a,.btn{background:#00df82;color:#07111f;padding:11px 14px;border-radius:8px;text-decoration:none;font-weight:bold}
main{max-width:900px;margin:auto;padding:14px}
.card{background:#11233a;padding:20px;margin:15px 0;border-radius:13px}
h2{color:#00df82}
.muted{color:#b8c8d8;line-height:1.6}
.leagues{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px}
.league{background:#1b3450;padding:14px;border-radius:9px;text-align:center}
.btn{display:inline-block;margin:7px 5px 0 0}
.secondary{background:#243b55;color:white}
footer{text-align:center;padding:25px;color:#a9bbce}
</style>
</head>
<body>
<header>
<h1>HAYWHY MEDIA</h1>
<p>YOUR HOME FOR FOOTBALL</p>
</header>
<nav>
<a href="#scores">Live Scores</a>
<a href="#leagues">Leagues</a>
<a href="#watch">Watch Football</a>
</nav>
<main>
<section class="card">
<h2>Welcome, Football Fans! ⚽</h2>
<p class="muted">Follow Nigerian football, European competitions, match schedules, results and official viewing options — all in one place.</p>
</section><section class="card" id="scores">
<h2>🔴 Live Scores & Fixtures</h2>
<p class="muted" id="scoreStatus">Live match data has not been connected yet. Open a trusted football scores service to check today's matches.</p>
<a class="btn" href="https://www.livescore.com/" target="_blank" rel="noopener">Check Live Scores</a>
<a class="btn secondary" href="https://www.sofascore.com/football" target="_blank" rel="noopener">More Scores & Fixtures</a>
</section><section class="card" id="leagues">
<h2>🌍 Explore Football Leagues</h2>
<div class="leagues">
<div class="league">🇳🇬 Nigerian Football</div>
<div class="league">🏴 Premier League</div>
<div class="league">🇪🇸 La Liga</div>
<div class="league">🇩🇪 Bundesliga</div>
<div class="league">🇮🇹 Serie A</div>
<div class="league">🏆 Champions League</div>
</div>
<p class="muted">Choose a league on a scores website to see its fixtures, results and standings.</p>
</section><section class="card" id="watch">
<h2>📺 Official Free Football Viewing</h2>
<p class="muted">These services offer selected matches, highlights or replays. Availability depends on the competition and your location.</p>
<a class="btn" href="https://www.plus.fifa.com/" target="_blank" rel="noopener">FIFA+</a>
<a class="btn" href="https://npfl.com.ng/" target="_blank" rel="noopener">NPFL Official Site</a>
<a class="btn" href="https://www.youtube.com/" target="_blank" rel="noopener">YouTube</a>
<p class="muted">Only use official broadcasts. Watching a match for free does not give permission to rebroadcast it on your own channel.</p>
</section><section class="card">
<h2>🔴 HAYWHY MEDIA on YouTube</h2>
<p class="muted">Manage your channel and prepare authorised livestreams through YouTube Studio.</p>
<a class="btn" href="https://studio.youtube.com/" target="_blank" rel="noopener">Open YouTube Studio</a>
</section>
</main>
<footer>
<p>HAYWHY MEDIA Football Hub</p>
<p>Football • Fixtures • Results • Official Viewing</p>
</footer>
</body>
</html>`);
});app.get("/api/status", (req, res) => {
res.json({
project: "HAYWHY MEDIA Football Hub",
status: "online",
liveScoreFeedConnected: false,
videoBroadcastConnected: false
});
});

app.listen(PORT, "0.0.0.0", () => {
console.log("HAYWHY MEDIA Football Hub is running on port " + PORT);
});
