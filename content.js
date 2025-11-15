function _textToNumber(t) {
    if (!t) return NaN;
    const cleaned = t.replace(/[^0-9.+-]/g, "");
    return cleaned === "" ? NaN : Number(cleaned);
  }
  
  function parsePlayerElement(el) {
    const text = el.innerText || "";
    let name = "";
    const nameEl =
      el.querySelector(".playerName") ||
      el.querySelector(".player-name") ||
      el.querySelector(".PlayerName") ||
      el.querySelector("[data-player-name]") ||
      el.querySelector("a[href*='/player/']");
    if (nameEl) name = nameEl.innerText.trim();
  
    const projEl =
      el.querySelector(".playerGameCell__projected") ||
      el.querySelector(".projected-points") ||
      Array.from(el.querySelectorAll("*")).find(n => /\bProj\b|\bProjected\b/i.test(n.innerText));
    let projectedPoints = NaN;
    if (projEl) projectedPoints = _textToNumber(projEl.innerText);
    else {
      const m = text.match(/Proj(?:ected)?:?\s*([0-9]+(?:\.[0-9]+)?)/i);
      if (m) projectedPoints = Number(m[1]);
    }
  
    let recentPoints = NaN;
    const weeklyMatches = text.matchAll(/(?:Week\s*\d+:)?\s*([0-9]+(?:\.[0-9]+)?)/g);
    const nums = [];
    for (const mm of weeklyMatches) {
      const v = Number(mm[1]);
      if (!Number.isNaN(v)) nums.push(v);
    }
    if (nums.length >= 1) recentPoints = nums[0];
  
    let adp = NaN;
    const adpMatch = text.match(/ADP[:\s]*([0-9]+(?:\.[0-9]+)?)/i);
    if (adpMatch) adp = Number(adpMatch[1]);
  
    let position = "";
    const posMatch = text.match(/\b(QB|RB|WR|TE|K|DEF|DST)\b/);
    if (posMatch) position = posMatch[1];
  
    const playerIdAttr = el.getAttribute && (el.getAttribute("data-playerid") || el.getAttribute("data-player-id") || el.getAttribute("data-playersid"));
    const playerId = playerIdAttr || null;
  
    return {
      playerId,
      name: name || (text.split("\n")[0] || "").trim(),
      position,
      team: "",
      projectedPoints: Number.isFinite(projectedPoints) ? projectedPoints : null,
      recentPoints: Number.isFinite(recentPoints) ? recentPoints : null,
      adp: Number.isFinite(adp) ? adp : null,
      rawText: text
    };
  }
  
  function extractPlayers() {
    const candidates = new Set();
    const selectors = [
      ".playerRow", ".player-row", ".Table__TR", ".Table__TR--player",
      "[data-playerid]", ".PlayerCard", ".playerSlot", ".playerListItem"
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(n => candidates.add(n));
    });
  
    document.querySelectorAll("div, li, tr").forEach(n => {
      if (n.innerText && (/\bProj\b/i.test(n.innerText) || /\b(QB|RB|WR|TE|K|DST)\b/.test(n.innerText))) {
        candidates.add(n);
      }
    });
  
    const players = [];
    candidates.forEach(node => {
      if (node.innerText && node.innerText.trim().length > 10) {
        const parsed = parsePlayerElement(node);
        players.push(parsed);
      }
    });
  
    const dedup = {};
    players.forEach(p => {
      const key = (p.name || p.playerId || p.rawText.slice(0, 30)).toLowerCase();
      if (!dedup[key]) dedup[key] = p;
      else if ((!dedup[key].projectedPoints && p.projectedPoints) || (p.projectedPoints && (p.projectedPoints > dedup[key].projectedPoints))) {
        dedup[key] = p;
      }
    });
  
    return Object.values(dedup).slice(0, 400);
  }
  
  function scorePlayer(p) {
    const proj = p.projectedPoints ?? 0;
    const recent = p.recentPoints ?? proj * 0.6;
    const adp = p.adp;
  
    let base = proj * 2.0;
    let recentBoost = recent * 1.5;
    let adpFactor = 0;
    if (adp && adp > 0) adpFactor = (100 - Math.min(100, adp)) * 0.3;
  
    let raw = base + recentBoost + adpFactor;
    const pos = (p.position || "").toUpperCase();
    if (pos === "QB") raw *= 0.95;
    if (pos === "TE") raw *= 0.9;
  
    const normalized = Math.round((raw / 40) * 100) / 1;
    return Math.max(0, Math.min(200, Math.round(normalized * 10) / 10));
  }
  
  (() => {
    window.__fantasyTradeEvaluator = { extractPlayers, scorePlayer };
})();
  