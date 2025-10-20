// JavaScript Document
export default async function handler(req, res) {
try {
const BASE = "https://release-antwerp.clubplanner.be/api/planner/getcalendarItems";
const TOKEN = "HETEILAND@ANTWERP";
	
	let { id, date, days = "7" } = req.query;
	if (!id) return res.status(400).json({ error: "Missing id" });

	// Parse dd/MM/yyyy of fallback naar vandaag
	const base = date ? parseDdMmYyyy(date) : new Date();
	if (!base) return res.status(400).json({ error: "Invalid date format, use dd/MM/yyyy" });

	// Normaliseer naar maandag en probeer tot 3 weken terug bij 400
	let monday = startOfWeek(base);
	for (let attempt = 0; attempt < 4; attempt++) {
	  const tryDate = formatDdMmYyyy(monday);
	  const url = `${BASE}?token=${encodeURIComponent(TOKEN)}&id=${encodeURIComponent(id)}&date=${encodeURIComponent(tryDate)}&days=${encodeURIComponent(days)}`;

	  const upstream = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "ReleaseTimetableProxy/1.0" } });
	  if (upstream.ok) {
		const contentType = upstream.headers.get("content-type") || "application/json";
		const text = await upstream.text();
		return res.status(200).setHeader("content-type", contentType).send(text);
	  }
	  if (upstream.status === 400) { monday = addDays(monday, -7); continue; }

	  const text = await upstream.text();
	  return res.status(upstream.status).type("application/json").send(text);
	}
	return res.status(400).json({ error: "Upstream refused the requested date range after 4 attempts." });
} catch (e) {
console.error(e);
return res.status(500).json({ error: "Proxy error" });
}
}
// helpers
function addDays(d, n) { const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function startOfWeek(d){ const x=new Date(d); const day=x.getDay(); const diff=(day===0?-6:1-day); x.setDate(x.getDate()+diff); x.setHours(0,0,0,0); return x; }
function parseDdMmYyyy(s){ const m=/^(\d{2})/(\d{2})/(\d{4})$/.exec(String(s)); if(!m) return null; const d=new Date(+m[3], +m[2]-1, +m[1], 12,0,0,0); return isNaN(d)?null:d; }
function formatDdMmYyyy(d){ const dd=String(d.getDate()).padStart(2,"0"); const mm=String(d.getMonth()+1).padStart(2,"0"); const yyyy=d.getFullYear(); return ${dd}/${mm}/${yyyy}; }
C) Inhoud van vercel.json (copy-paste)
{
"framework": null
}