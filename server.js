const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HAYWHY MEDIA Football Hub</title>
<style>
body {
margin: 0;
background: #07111f;
color: white;
font-family: Arial, sans-serif;
text-align: center;
}
header {
padding: 30px 15px;
background: #101e33;
border-bottom: 3px solid #00e676;
}
h1 { color: #00e676; }
main { padding: 25px 15px; }
.card {
max-width: 500px;
margin: 20px auto;
padding: 22px;
background: #12243b;
border-radius: 14px;
}
a, button {
display: inline-block;
margin: 8px;
padding: 12px 18px;
border: none;
border-radius: 7px;
background: #00e676;
color: #07111f;
font-weight: bold;
text-decoration: none;
}
footer {
padding: 20px;
color: #b8c5d8;
}
</style>
</head>
<body>
<header>
<h1>HAYWHY MEDIA</h1>
<p>YOUR FOOTBALL HUB</p>
</header>

  <main>
    <div class="card">
      <h2>⚽ Welcome, Football Fans!</h2>
      <p>Follow football news, fixtures, results and match updates.</p>
      <p id="status">Football hub is online when this page loads.</p>
    </div>

    <div class="card">
      <h2>📺 Watch Football</h2>
      <p>Find authorised football broadcasts and official viewing information.</p>
      <a href="https://www.youtube.com/" target="_blank" rel="noopener">
        Open YouTube
      </a>
    </div>

    <div class="card">
      <h2>🔴 YouTube Channel</h2>
      <p>Visit YouTube to manage your channel and live streams.</p>
      <a href="https://studio.youtube.com/" target="_blank" rel="noopener">
        YouTube Studio
      </a>
    </div>
  </main>

  <footer>
    <p>HAYWHY MEDIA Football Hub</p>
    <p>Football updates • Fixtures • Results</p>
  </footer>
</body>
</html>

`);
});

app.get("/api/status", (req, res) => {
res.json({
project: "HAYWHY MEDIA Football Hub",
status: "online",
features: ["Football hub", "YouTube links", "Football updates"]
});
});

app.listen(PORT, "0.0.0.0", () => {
console.log("Football Hub running on port ${PORT}");
});
