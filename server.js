const express = require("express");
const { google } = require("googleapis");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const REDIRECT_URI =
  "https://haywhy-football-hub.onrender.com/auth/google/callback";

if (
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error("Required environment variables are missing.");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Temporary OAuth state storage.
const oauthStates = new Map();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// HOMEPAGE
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="HAYWHY MEDIA Football Live Hub for football fixtures, match information, and authorized YouTube broadcast management.">
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
          border: 0;
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

      <footer>HAYWHY MEDIA Football Live Hub</footer>

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

            list.replaceChildren();

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

              const score = document.createElement("p");
              if (match.homeScore !== null && match.awayScore !== null) {
                score.textContent =
                  "Score: " + match.homeScore + " - " + match.awayScore;
              }

              const time = document.createElement("p");
              time.className = "muted";
              time.textContent = match.utcDate
                ? new Date(match.utcDate).toLocaleString()
                : "";

              card.append(competition, teams, status, score, time);
              list.appendChild(card);
            });
          } catch (error) {
            list.textContent =
              "Unable to load matches. Please try again later.";
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
    const matches = Array.isArray(data.matches) ? data.matches : [];

    res.json({
      updatedAt: new Date().toISOString(),
      count: matches.length,
      matches: matches.map(match => ({
        competition: match.competition?.name || "Football",
        homeTeam: match.homeTeam?.name || "Home team",
        awayTeam: match.awayTeam?.name || "Away team",
        utcDate: match.utcDate || null,
        status: match.status || "UNKNOWN",
        minute: match.minute ?? null,
        homeScore: match.score?.fullTime?.home ?? null,
        awayScore: match.score?.fullTime?.away ?? null
      }))
    });
  } catch (error) {
    console.error("Football data request failed:", error.message);
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
      "YouTube connection is not configured. Check Render environment variables."
    );
  }

  // Remove expired OAuth states.
  for (const [key, createdAt] of oauthStates.entries()) {
    if (Date.now() - createdAt > 10 * 60 * 1000) {
      oauthStates.delete(key);
    }
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

  const createdAt =
    typeof state === "string" ? oauthStates.get(state) : undefined;

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

  if (typeof code !== "string" || !code) {
    return res.status(400).send("Missing Google authorization code.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return res.status(500).send(
        "Google did not return an access token. Please try again."
      );
    }

    // Look up the existing refresh token so it is not accidentally lost.
    const { data: existing, error: readError } = await supabase
      .from("youtube_tokens")
      .select("refresh_token")
      .eq("user_id", "primary-channel")
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    const refreshToken =
      tokens.refresh_token || existing?.refresh_token || null;

    if (!refreshToken) {
      return res.status(500).send(
        "Google did not provide a refresh token. Try reconnecting YouTube."
      );
    }

    const { error: saveError } = await supabase
      .from("youtube_tokens")
      .upsert(
        {
          user_id: "primary-channel",
          access_token: tokens.access_token,
          refresh_token: refreshToken,
          expiry_date: tokens.expiry_date || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      throw saveError;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>YouTube Connected</title>
      </head>
      <body style="font-family:Arial;text-align:center;padding:30px">
        <h1>YouTube Connected Successfully!</h1>
        <p>Your authorization tokens were saved on the server.</p>
        <p>Broadcast creation and video streaming still need to be implemented.</p>
        <a href="/">Return to HAYWHY MEDIA Football Hub</a>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("YouTube token storage failed:", error.message);
    res.status(500).send(
      "YouTube authorization could not be saved. Check Render logs for details."
    );
  }
});
// PROTECTED YOUTUBE CONNECTION TEST
app.get("/api/youtube/test", async (req, res) => {
  const suppliedKey = req.get("x-admin-key");

  if (
    !process.env.ADMIN_API_KEY ||
    !suppliedKey ||
    suppliedKey !== process.env.ADMIN_API_KEY
  ) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized."
    });
  }

  try {
    const { data, error } = await supabase
      .from("youtube_tokens")
      .select("refresh_token, expiry_date")
      .eq("user_id", "primary-channel")
      .maybeSingle();

    if (error) throw error;

    if (!data?.refresh_token) {
      return res.status(409).json({
        success: false,
        connected: false,
        message: "No saved YouTube refresh token. Connect YouTube again."
      });
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    auth.setCredentials({
      refresh_token: data.refresh_token,
      expiry_date: data.expiry_date
    });

    const youtube = google.youtube({
      version: "v3",
      auth
    });

    const response = await youtube.channels.list({
      part: ["id", "snippet"],
      mine: true
    });

    const channel = response.data.items?.[0];

    if (!channel) {
      return res.status(404).json({
        success: false,
        connected: false,
        message: "No YouTube channel was returned."
      });
    }

    return res.json({
      success: true,
      connected: true,
      channelTitle: channel.snippet?.title || "YouTube channel",
      message: "YouTube connection test successful."
    });
  } catch (error) {
    console.error("YouTube connection test failed:", error.message);

    return res.status(502).json({
      success: false,
      connected: false,
      message: "YouTube connection test failed. Check Render logs."
    });
  }
});

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`HAYWHY MEDIA Football Hub running on port ${PORT}`);
});

// CREATE A YOUTUBE LIVE BROADCAST
app.post("/api/youtube/broadcast", async (req, res) => {
  const suppliedKey = req.get("x-admin-key");

  if (
    !process.env.ADMIN_API_KEY ||
    !suppliedKey ||
    suppliedKey !== process.env.ADMIN_API_KEY
  ) {
    return res.status(401).json({
      error: "Unauthorized."
    });
  }

  const title =
    typeof req.body.title === "string"
      ? req.body.title.trim()
      : "";

  const description =
    typeof req.body.description === "string"
      ? req.body.description.trim()
      : "HAYWHY MEDIA Football Live Hub.";

  const scheduledStartTime =
    typeof req.body.scheduledStartTime === "string"
      ? req.body.scheduledStartTime
      : "";

  if (!title || title.length > 100) {
    return res.status(400).json({
      error: "Title must contain 1–100 characters."
    });
  }

  const startDate = new Date(scheduledStartTime);

  if (
    !scheduledStartTime ||
    Number.isNaN(startDate.getTime()) ||
    startDate.getTime() <= Date.now()
  ) {
    return res.status(400).json({
      error: "Provide a valid future scheduledStartTime."
    });
  }

  try {
    const { data: savedTokens, error: tokenError } =
      await supabase
        .from("youtube_tokens")
        .select("access_token, refresh_token, expiry_date")
        .eq("user_id", "primary-channel")
        .maybeSingle();

    if (tokenError) throw tokenError;

    if (!savedTokens?.refresh_token) {
      return res.status(409).json({
        error: "Connect YouTube before creating a broadcast."
      });
    }

    const youtubeAuth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    youtubeAuth.setCredentials({
      access_token: savedTokens.access_token,
      refresh_token: savedTokens.refresh_token,
      expiry_date: savedTokens.expiry_date
    });

    const youtube = google.youtube({
      version: "v3",
      auth: youtubeAuth
    });

    // Create the YouTube broadcast.
    const broadcastResponse =
      await youtube.liveBroadcasts.insert({
        part: ["snippet", "status", "contentDetails"],
        requestBody: {
          snippet: {
            title,
            description,
            scheduledStartTime: startDate.toISOString()
          },
          status: {
            privacyStatus: "private",
            selfDeclaredMadeForKids: false
          },
          contentDetails: {
            enableAutoStart: false,
            enableAutoStop: false,
            enableDvr: true,
            recordFromStart: true
          }
        }
      });

    const broadcast = broadcastResponse.data;

    // Create the video stream for the broadcast.
    const streamResponse = await youtube.liveStreams.insert({
      part: ["snippet", "cdn", "contentDetails"],
      requestBody: {
        snippet: {
          title: `${title} - HAYWHY MEDIA Stream`
        },
        cdn: {
          frameRate: "30fps",
          ingestionType: "rtmp",
          resolution: "720p"
        },
        contentDetails: {
          isReusable: false
        }
      }
    });

    const stream = streamResponse.data;

    // Connect the broadcast to the stream.
    await youtube.liveBroadcasts.bind({
      part: ["id", "contentDetails", "snippet", "status"],
      id: broadcast.id,
      streamId: stream.id
    });

    // Never return the stream key to the browser.
    res.status(201).json({
      success: true,
      message:
        "Private YouTube broadcast created. A video source is still required.",
      broadcastId: broadcast.id,
      streamId: stream.id,
      title: broadcast.snippet?.title,
      scheduledStartTime:
        broadcast.snippet?.scheduledStartTime,
      privacyStatus: "private",
      youtubeStudioUrl: "https://studio.youtube.com/"
    });
  } catch (error) {
    console.error(
      "YouTube broadcast creation failed:",
      error.message
    );

    res.status(502).json({
      error:
        "Could not create the broadcast. Check Render logs and YouTube API permissions."
    });
  }
});
