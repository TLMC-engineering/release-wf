// api/timetable.js (CommonJS)
module.exports = async (req, res) => {
try {
const BASE = "https://release-antwerp.clubplanner.be/api/planner/getcalendarItems";
const TOKEN = "HETEILAND@ANTWERP";

  let { id, date, days = "7" } = req.query || {};

if (!id) {
  res.statusCode = 400;
  return res.json({ error: "Missing id" });
}

// Parse dd/MM/yyyy of fallback naar vandaag
const base = date ? parseDdMmYyyy(date) : new Date();
if (!base) {
  res.statusCode = 400;
  return res.json({ error: "Invalid date format, use dd/MM/yyyy" });
}

// Normaliseer naar maandag en probeer 0, -7, -14, -21 dagen (sommige weken worden geweigerd)
let monday = startOfWeek(base);

for (let attempt = 0; attempt < 4; attempt++) {
  const tryDate = formatDdMmYyyy(monday);
  const url =
    BASE +
    "?token=" + encodeURIComponent(TOKEN) +
    "&id=" + encodeURIComponent(String(id)) +
    "&date=" + encodeURIComponent(tryDate) +
    "&days=" + encodeURIComponent(String(days));

  const upstream = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ReleaseTimetableProxy/1.0" },
  });

  if (upstream.ok) {
    const text = await upstream.text();
    res.statusCode = 200;
    res.setHeader("content-type", upstream.headers.get("content-type") || "application/json");
    return res.end(text);
  }

  if (upstream.status === 400) {
    // probeer vorige week
    monday = addDays(monday, -7);
    continue;
  }

  const text = await upstream.text();
  res.statusCode = upstream.status;
  res.setHeader("content-type", "application/json");
  return res.end(text);
}

res.statusCode = 400;
return res.json({ error: "Upstream refused the requested date range after 4 attempts." });

  } catch (e) {
console.error(e);
res.statusCode = 500;
return res.json({ error: "Proxy error" });
}
};
// Helpers (CommonJS-friendly)
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d) {
const x = new Date(d);
const day = x.getDay(); // 0=zo, 1=ma
const diff = (day === 0 ? -6 : 1 - day);
x.setDate(x.getDate() + diff);
x.setHours(0,0,0,0);
return x;
}
function parseDdMmYyyy(s) {
const m = /^(\d{2})/(\d{2})/(\d{4})$/.exec(String(s));
if (!m) return null;
const d = new Date(+m[3], +m[2]-1, +m[1], 12, 0, 0, 0);
return isNaN(d) ? null : d;
}
function formatDdMmYyyy(d) {
const dd = String(d.getDate()).padStart(2, "0");
const mm = String(d.getMonth() + 1).padStart(2, "0");
const yyyy = d.getFullYear();
return ${dd}/${mm}/${yyyy};
}
