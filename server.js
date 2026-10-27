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
