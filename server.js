const express = require("express");
const { google } = require("googleapis");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const REDIRECT_URI =
  "https://haywhy-football-hub.onrender.com/auth/google/callback";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const oauthStates = new Map();

// HOMEPAGE
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>HAYWHY MEDIA Football Live Hub</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #07111f;
          color: white;
        }
        header {
          background: #0c1c30;
          padding: 22px 15px;
          text-align: center;
          border-bottom: 2px solid #00d084;
        }
        header h1 { margin: 0; font-size: 26px; }
        header p { color: #b9c8d9; }
        main { max-width: 850px; margin: auto; padding: 20px; }
        .hero {
          padding: 25px 15px;
          text-align: center;
          background: #11243a;
          border-radius: 15px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 13px 18px;
          margin: 8px 4px;
          background: #00d084;
          color: #04130d;
          border-radius: 8px;
          font-weight: bold;
          text-decoration: none;
        }
        .secondary { background: #243c56; color: white; }
        .card {
          background: #11243a;
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
        }
        .muted { color: #b9c8d9; }
        footer {
          text-align: center;
          padding: 25px;
          color: #b9c8d9;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>HAYWHY MEDIA</h1>
        <p>Football Live Hub</p>
      </header>

      <main>
        <section class="hero">
          <h2>Football, Scores & Live Updates</h2>
          <p>Follow match information and manage your authorized YouTube broadcasts.</p>
          <a class="button" href="#matches">View Matches</a>
          <a class="button secondary" href="/auth/google">Connect YouTube</a>
        </section>

        <section id="matches">
          <h2>Football Matches</h2>
          <p class="muted">Match information is provided by our football data service.</p>
          <div id="match-list">Loading matches...</div>
          <a class="button secondary" href="/api/matches">Open Match Data</a>
        </section>
      </main>

      <footer>
        HAYWHY MEDIA Football Live Hub
      </footer>

      <script>
        async function loadMatches() {
          const list = document.getElementById("match-list");

          try {
            const response = await fetch("/api/matches");
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Unable to load matches.");
            }

            if (!data.matches || data.matches.length === 0) {
              list.textContent = "No matches are available right now.";
              return;
            }

            list.innerHTML = "";

            data.matches.forEach(match => {
              const card = document.createElement("div");
              card.className = "card";

              const competition = document.createElement("p");
              competition.className = "muted";
              competition.textContent = match.competition || "Football";

              const teams = document.createElement("h3");
              teams.textContent =
                (match.homeTeam || "Home team") + " vs " +
                (match.awayTeam || "Away team");

              const status = document.createElement("p");
              status.textContent = "Status: " + (match.status || "Unknown");

              const time = document.createElement("p");
              time.className = "muted";
              time.textContent = match.utcDate
                ? new Date(match.utcDate).toLocaleString()
                : "";

              card.append(competition, teams, status, time);
              list.appendChild(card);
            });
          } catch (error) {
            list.textContent = "Unable to load matches. Please try again later.";
          }
        }

        loadMatches();
      </script>
    </body>
    </html>
  `);
});

// FOOTBALL MATCHES API
app.get("/api/matches", async (req, res) => {
  const token = process.env.FOOTBALL_DATA_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Football data token is not configured."
    });
  }

  try {
    const response = await fetch(
      "https://api.football-data.org/v4/matches",
      {
        headers: { "X-Auth-Token": token },
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Football data provider returned an error.",
        providerStatus: response.status
      });
    }

    const data = await response.json();

    res.json({
      updatedAt: new Date().toISOString(),
      count: data.matches.length,
      matches: data.matches.map(match => ({
        competition: match.competition?.name,
        homeTeam: match.homeTeam?.name,
        awayTeam: match.awayTeam?.name,
        utcDate: match.utcDate,
        status: match.status,
        minute: match.minute,
        homeScore: match.score?.fullTime?.home,
        awayScore: match.score?.fullTime?.away
      }))
    });
  } catch (error) {
    res.status(502).json({
      error: "Unable to retrieve football matches right now."
    });
  }
});

// START YOUTUBE AUTHORIZATION
app.get("/auth/google", (req, res) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  ) {
    return res.status(500).send(
      "YouTube connection is not configured. Check your Render environment variables."
    );
  }

  const state = crypto.randomBytes(32).toString("hex");
  oauthStates.set(state, Date.now());

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/youtube"],
    state
  });

  res.redirect(authorizationUrl);
});

// GOOGLE AUTHORIZATION CALLBACK
app.get("/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(
      "Google authorization was cancelled or denied."
    );
  }

  const createdAt = oauthStates.get(state);

  if (
    typeof state !== "string" ||
    !createdAt ||
    Date.now() - createdAt > 10 * 60 * 1000
  ) {
    return res.status(400).send(
      "Your connection request expired. Please try Connect YouTube again."
    );
  }

  oauthStates.delete(state);

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // This starter version does not persist tokens.
    // Secure token storage must be implemented before production use.

    if (!tokens.access_token) {
      return res.status(500).send(
        "Google did not return an access token. Please try again."
      );
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>YouTube Connected</title>
      </head>
      <body style="font-family:Arial;text-align:center;padding:30px">
        <h1>Google authorization successful!</h1>
        <p>Your YouTube authorization worked. Secure token storage and
        broadcast management still need to be implemented.</p>
        <a href="/">Return to HAYWHY MEDIA Football Hub</a>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(
      "YouTube authorization failed. Check the Google OAuth settings and Render logs."
    );
  }
});

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`HAYWHY MEDIA Football Hub running on port ${PORT}`);
});
