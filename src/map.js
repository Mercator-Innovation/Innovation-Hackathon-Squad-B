// A simplified but realistic map of Inverclyde: the Firth of Clyde, the far shore, main roads,
// town names and risk hotspots. Shapes are traced roughly from real geography; it is not to scale.
// Any page can draw it: MAP.layers(xy, pxPerKm, options) returns SVG for a map whose
// projection xy({lat, lng}) -> [x, y] the page already uses.
window.MAP = (function () {
  let mapCount = 0; // each map on the page gets its own gradient ids
  let uid = 0;
  // The south shore of the Clyde, east to west, then down the west coast. [lat, lng]
  const COAST = [
    [55.9420, -4.55], [55.9420, -4.600], [55.9418, -4.660], [55.9415, -4.690], [55.9440, -4.715],
    [55.9500, -4.735], [55.9560, -4.760], [55.9600, -4.785], [55.9628, -4.805], [55.9655, -4.822],
    [55.9625, -4.836], [55.9560, -4.856], [55.9480, -4.877], [55.9350, -4.884], [55.9200, -4.882],
    [55.9060, -4.886], [55.8900, -4.901], [55.8750, -4.907], [55.8400, -4.910]
  ];
  // The far shore: Cardross, Helensburgh and the Rosneath peninsula.
  const NORTH_SHORE = [
    [55.9620, -4.55], [55.9625, -4.600], [55.9660, -4.640], [55.9720, -4.680], [55.9850, -4.720],
    [55.9900, -4.760], [55.9850, -4.800], [55.9780, -4.830], [55.9850, -4.860], [56.0500, -4.860], [56.0500, -4.55]
  ];
  const ROADS = [
    { name: "A8", line: [[55.9330, -4.600], [55.9350, -4.660], [55.9360, -4.690], [55.9440, -4.725], [55.9480, -4.760], [55.9540, -4.785], [55.9580, -4.815]] },
    { name: "A770", line: [[55.9580, -4.815], [55.9530, -4.845], [55.9450, -4.868], [55.9300, -4.875], [55.9100, -4.872]] },
    { name: "A78", line: [[55.9450, -4.765], [55.9350, -4.795], [55.9250, -4.825], [55.9100, -4.860], [55.8950, -4.880], [55.8760, -4.890], [55.8450, -4.897]] },
    { name: "A761", line: [[55.9320, -4.690], [55.9150, -4.660], [55.8940, -4.627], [55.8800, -4.600]] }
  ];
  const at = ([lat, lng]) => ({ lat, lng });
  const pts = (line, xy) => line.map(p => xy(at(p)).join(",")).join(" ");

  // Glows where higher-risk homes are. Overlapping glows add up, so clusters look hotter.
  function hotspots(xy, pxPerKm) {
    const r = Math.max(18, Math.min(70, pxPerKm * 0.6));
    return scored().filter(h => h.risk.band !== "Low" && window.LOCATIONS.homes[h.id]).map(h => {
      const [x, y] = xy(window.LOCATIONS.homes[h.id]);
      const size = r * (0.7 + Math.min(h.risk.points, 12) / 12);
      return `<circle class="hot ${h.risk.band}" cx="${x}" cy="${y}" r="${Math.round(size)}" fill="url(#hot-${uid}-${h.risk.band})"/>`;
    }).join("");
  }

  function layers(xy, pxPerKm, { hot = true, towns = true } = {}) {
    uid = ++mapCount;
    const homes = window.DATA.homes.filter(h => window.LOCATIONS.homes[h.id]);
    const byTown = {};
    homes.forEach(h => (byTown[h.area] = byTown[h.area] || []).push(xy(window.LOCATIONS.homes[h.id])));
    const townLabels = towns ? Object.entries(byTown).map(([name, p]) => {
      const x = p.reduce((s, q) => s + q[0], 0) / p.length, y = Math.min(...p.map(q => q[1])) - 12;
      return `<text class="town" x="${Math.round(x)}" y="${Math.round(y)}">${escapeHtml(name)}</text>`;
    }).join("") : "";
    const land = [...COAST, [55.70, -4.910], [55.70, -4.40], [55.9420, -4.40]];
    return `
      <defs>
        <radialGradient id="hot-${uid}-High"><stop offset="0" stop-color="#c0392b" stop-opacity="0.7"/><stop offset="1" stop-color="#c0392b" stop-opacity="0"/></radialGradient>
        <radialGradient id="hot-${uid}-Medium"><stop offset="0" stop-color="#e67e22" stop-opacity="0.5"/><stop offset="1" stop-color="#e67e22" stop-opacity="0"/></radialGradient>
      </defs>
      <rect class="water" x="-5000" y="-5000" width="10000" height="10000"/>
      <polygon class="land" points="${pts(land, xy)}"/>
      <polygon class="land far" points="${pts(NORTH_SHORE, xy)}"/>
      <polyline class="coast" points="${pts(COAST.slice(1), xy)}"/>
      ${ROADS.map(r => `<polyline class="road-casing" points="${pts(r.line, xy)}"/><polyline class="road" points="${pts(r.line, xy)}"/>`).join("")}
      ${ROADS.map(r => { const [x, y] = xy(at(r.line[Math.floor(r.line.length / 2)])); return `<text class="road-name" x="${x}" y="${y - 6}">${r.name}</text>`; }).join("")}
      ${hot ? hotspots(xy, pxPerKm) : ""}
      ${homes.map(h => { const [x, y] = xy(window.LOCATIONS.homes[h.id]); return `<circle class="home-dot" cx="${x}" cy="${y}" r="2.6"/>`; }).join("")}
      ${townLabels}
      <text class="water-name" x="0" y="0" transform="translate(${xy(at([55.958, -4.70])).join(",")})">Firth of Clyde</text>`;
  }

  return { layers };
})();
