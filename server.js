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

// Temporary OAuth state storage.
// For a production app, use secure, persistent session storage.
const oauthStates = new Map();

// Home page
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>HAYWHY MEDIA Football Live Hub</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #101820;
          color: white;
          text-align: center;
          padding: 35px 15px;
        }
        .box {
          max-width: 500px;
          margin: auto;
          padding: 25px;
          background: #1d2935;
          border-radius: 15px;
        }
        a, button {
          display: inline-block;
          padding: 13px 20px;
          margin: 10px;
          border: none;
          border-radius: 8px;
          background: #00c853;
          color: #08130b;
          text-decoration: none;
          font-weight: bold;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>HAYWHY MEDIA</h1>
        <h2>Football Live Hub</h2>
        <p>Football scores, fixtures and YouTube livestream management.</p>
        <a href="/api/matches">View Match Data</a>
        <br>
        <a href="/auth/google">Connect YouTube</a>
      </div>
    </body>
    </html>
  `);
});

// Football matches API
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
        headers: {
          "X-Auth-Token": token
        },
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

// Start Google OAuth
app.get("/auth/google", (req, res) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  ) {
    return res.status(500).send(
      "YouTube connection is not configured yet. Add Google OAuth credentials in Render."
    );
  }

  const state = crypto.randomBytes(32).toString("hex");

  oauthStates.set(state, Date.now());

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/youtube"
    ],
    state
  });

  res.redirect(authorizationUrl);
});

// Google OAuth callback
app.get("/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(
      "Google authorization was not completed."
    );
  }

  const createdAt = oauthStates.get(state);

  if (
    typeof state !== "string" ||
    !createdAt ||
    Date.now() - createdAt > 10 * 60 * 1000
  ) {
    return res.status(400).send(
      "Your connection request expired. Please try again."
    );
  }

  oauthStates.delete(state);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Do not display or log access tokens or refresh tokens.
    // Persistent, encrypted token storage must be added before
    // using this connection for ongoing production operations.

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>YouTube Connection</title>
      </head>
      <body style="font-family:Arial;text-align:center;padding:30px">
        <h1>YouTube authorization successful!</h1>
        <p>Google approved the connection. Your website still needs secure
        token storage before it can manage broadcasts after this request.</p>
        <a href="/">Return to Football Live Hub</a>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(
      "YouTube authorization failed. Check the Google OAuth configuration and try again."
    );
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Football Live Hub running on port ${PORT}`);
});
