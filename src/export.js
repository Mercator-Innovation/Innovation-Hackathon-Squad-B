// Downloads for the Risk overview: each section, or the whole page, as a PDF or an Excel file.
// PDF uses the browser's print window (choose "Save as PDF").
// Excel files are built here, with no add-ons: one sheet per section, plus "About this download".
// Uses scored(), shownHomes(), filterDescription() and sortDescription() from app.js, so it loads after it.
// Downloads leave out tenants' names and phone numbers: they aren't needed to plan the work.
window.EXPORT = (() => {
  const SECTIONS = {
    glance: { id: "sec-glance", title: () => C.glanceTitle, sheets: () => [glanceSheet(), trendSheet()] },
    areas: { id: "sec-areas", title: () => C.heatTitle, sheets: () => [areasSheet()] },
    homes: { id: "sec-homes", title: () => C.listTitle, sheets: () => [homesSheet()] },
    page: { id: "tab-overview", title: () => C.navDashboard, sheets: () => [glanceSheet(), trendSheet(), areasSheet(), homesSheet()] }
  };

  const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // ---- What goes in each sheet. The first row is the column headings. ----
  // The cards are read from the page, so they always match what you see
  function glanceSheet() {
    const rows = [["What", "How many", "Change", "Note"]];
    document.querySelectorAll("#glance-cards [data-glance]").forEach(card => {
      const text = cls => (card.querySelector(cls) || {}).textContent || "";
      rows.push([text(".g-label"), Number(text(".g-count")), text(".g-trend"), text(".g-note")]);
    });
    return { name: C.glanceTitle, rows };
  }

  function trendSheet() {
    const list = scored();
    const t = window.TREND;
    const rows = [["Week", C.seriesHighKey, C.seriesMediumKey, C.cardNoContact]];
    t.weeks.forEach((week, i) => rows.push([week, t.High[i], t.Medium[i], t.NoContact[i]]));
    rows.push([C.thisWeek, list.filter(h => h.risk.band === "High").length, list.filter(h => h.risk.band === "Medium").length,
      list.filter(h => h.monthsSinceLastContact > 12).length]);
    return { name: C.downloadTrendSheet, rows };
  }

  function areasSheet() {
    const list = scored();
    const rows = [[C.colArea, "Homes", "High risk", "Medium risk", "Low risk", C.areaAverage]];
    [...new Set(list.map(h => h.area))].sort().forEach(area => {
      const inArea = list.filter(h => h.area === area);
      const count = band => inArea.filter(h => h.risk.band === band).length;
      const avg = inArea.reduce((s, h) => s + h.risk.points, 0) / inArea.length;
      rows.push([area, inArea.length, count("High"), count("Medium"), count("Low"), Math.round(avg * 10) / 10]);
    });
    return { name: C.heatTitle, rows };
  }

  // The homes exactly as the list shows them: same filters, same order
  function homesSheet() {
    const rows = [["Reference", "Address", C.colArea, "Risk level", "Risk score", C.filterReason, C.colStatus, "Reported a problem", "Months since last contact"]];
    const reported = new Set(allReports().map(r => r.homeId));
    shownHomes().forEach(h => rows.push([
      h.id, h.address, h.area, h.risk.band, h.risk.points,
      h.risk.reasons.map(r => r.reason).join("; "), h.status,
      reported.has(h.id) ? "Yes" : "No", h.monthsSinceLastContact
    ]));
    return { name: C.listTitle, rows };
  }

  function aboutSheet(section) {
    return { name: C.downloadAbout, rows: [
      [C.downloadAbout, ""],
      ["Section", SECTIONS[section].title()],
      [C.downloadedOn, today()],
      [`${C.listTitle}: ${C.downloadFilters.toLowerCase()}`, filterDescription()],
      [`${C.listTitle}: order`, sortDescription()],
      ["Note", C.downloadMadeUp],
      ["Note", C.downloadPrivacy]
    ] };
  }

  // ---- PDF: print just one section (or the whole page) ----
  function printPdf(section) {
    if (location.hash && location.hash !== "#overview") { location.hash = "#overview"; showTab(); }
    document.getElementById("homes-print-note").textContent =
      `${C.downloadFilters}: ${filterDescription()}. ${sortDescription()}. ${C.downloadedOn} ${today()}.`;
    document.body.dataset.print = section;
    const done = () => { delete document.body.dataset.print; window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
  }

  // ---- Excel: a real .xlsx file ----
  function downloadExcel(section) {
    const sheets = [...SECTIONS[section].sheets(), aboutSheet(section)];
    const blob = xlsx(sheets);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `healthier-homes-${slug(SECTIONS[section].title())}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // An .xlsx file is a zip of a few XML files. This writes the smallest set Excel needs.
  function xlsx(sheets) {
    const xmlEscape = v => String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const colName = i => (i >= 26 ? colName(Math.floor(i / 26) - 1) : "") + String.fromCharCode(65 + (i % 26));
    // Sheet names: up to 31 characters, none of : \ / ? * [ ], and no repeats
    const used = new Set();
    const sheetName = (name, i) => {
      let n = name.replace(/[:\\/?*[\]]/g, "").slice(0, 31) || `Sheet ${i + 1}`;
      while (used.has(n.toLowerCase())) n = `${n.slice(0, 28)} ${i + 1}`;
      used.add(n.toLowerCase());
      return n;
    };

    const sheetXml = rows => {
      const widths = [];
      rows.forEach(r => r.forEach((v, c) => { widths[c] = Math.min(60, Math.max(widths[c] || 8, String(v).length + 2)); }));
      const cols = widths.map((w, c) => `<col min="${c + 1}" max="${c + 1}" width="${w}" customWidth="1"/>`).join("");
      const data = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => {
        const ref = `${colName(ci)}${ri + 1}`;
        const style = ri === 0 ? 1 : 2;
        if (v === "" || v === null || v === undefined) return "";
        if (typeof v === "number" && isFinite(v)) return `<c r="${ref}" s="${style}"><v>${v}</v></c>`;
        return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(v)}</t></is></c>`;
      }).join("")}</row>`).join("");
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${data}</sheetData></worksheet>`;
    };

    const names = sheets.map((s, i) => sheetName(s.name, i));
    const files = [
      ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${names.map((n, i) => `<sheet name="${xmlEscape(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`],
      ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      // Style 1: bold headings. Style 2: wrapped text, top aligned.
      ["xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
      ...sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s.rows)])
    ];
    return new Blob([zip(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  // A zip file with no compression ("stored"), which every spreadsheet app can open
  const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  function crc32(bytes) {
    let c = 0xffffffff;
    for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function zip(files) {
    const enc = new TextEncoder();
    const now = new Date();
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [], central = [];
    let offset = 0;
    files.forEach(([path, text]) => {
      const name = enc.encode(path), data = enc.encode(text), crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(10, time, true);
      local.setUint16(12, date, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, name.length, true);
      parts.push(new Uint8Array(local.buffer), name, data);

      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint16(12, time, true);
      entry.setUint16(14, date, true);
      entry.setUint32(16, crc, true);
      entry.setUint32(20, data.length, true);
      entry.setUint32(24, data.length, true);
      entry.setUint16(28, name.length, true);
      entry.setUint32(42, offset, true);
      central.push(new Uint8Array(entry.buffer), name);
      offset += 30 + name.length + data.length;
    });
    const centralSize = central.reduce((s, p) => s + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)]);
  }

  // ---- The download buttons ----
  function buttons(section, label) {
    return `<span class="export-label">${label}</span>
      <button type="button" class="small" data-export="${section}" data-format="pdf">${C.downloadPdf}<span class="visually-hidden">: ${escapeHtml(SECTIONS[section].title())}</span></button>
      <button type="button" class="small" data-export="${section}" data-format="excel">${C.downloadExcel}<span class="visually-hidden">: ${escapeHtml(SECTIONS[section].title())}</span></button>`;
  }

  function addButtons() {
    const page = document.getElementById("page-export");
    page.innerHTML = `<div class="export">${buttons("page", C.downloadPage)}</div><p class="hint">${C.downloadHint} ${C.downloadPrivacy}</p>`;
    ["glance", "areas", "homes"].forEach(section => {
      const sec = document.getElementById(SECTIONS[section].id);
      const tools = document.createElement("div");
      tools.className = "export";
      tools.innerHTML = buttons(section, C.downloadLabel);
      // After the heading (and after the Grid / Map switch in Risk by area)
      const anchor = sec.querySelector(".area-head") || sec.querySelector("h2");
      anchor.insertAdjacentElement("afterend", tools);
    });
  }

  addButtons();
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-export]");
    if (!b) return;
    if (b.dataset.format === "pdf") printPdf(b.dataset.export);
    else downloadExcel(b.dataset.export);
  });

  return { xlsx, sheets: section => [...SECTIONS[section].sheets(), aboutSheet(section)] };
})();
