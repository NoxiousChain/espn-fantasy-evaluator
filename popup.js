document.addEventListener("DOMContentLoaded", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Analyze active roster
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: analyzeActiveRoster
    },
    (results) => {
      const data = results && results[0] ? results[0].result : null;
      const container = document.getElementById("positions");
      container.innerHTML = "";

      if (!data) {
        container.textContent = "Could not analyze this page.";
        return;
      }

      for (const [pos, players] of Object.entries(data)) {
        const div = document.createElement("div");
        div.className = "position";

        const label = document.createElement("label");
        label.textContent = pos + ":";
        div.appendChild(label);

        const valueDisplay = document.createElement("div");
        valueDisplay.className = "trade-value";

        if (players.length === 0) {
          div.innerHTML += " None found";
        } else if (players.length === 1) {
          div.innerHTML += " " + players[0];
          fetchTradeValue(tab.id, players[0], valueDisplay);
        } else {
          const select = document.createElement("select");
          const defaultOption = document.createElement("option");
          defaultOption.textContent = "Select player";
          defaultOption.disabled = true;
          defaultOption.selected = true;
          select.appendChild(defaultOption);

          players.forEach(p => {
            const option = document.createElement("option");
            option.textContent = p;
            select.appendChild(option);
          });

          select.addEventListener("change", () => {
            const selectedPlayer = select.value;
            fetchTradeValue(tab.id, selectedPlayer, valueDisplay);
          });

          div.appendChild(select);
        }

        div.appendChild(valueDisplay);
        container.appendChild(div);
      }
    }
  );
});

// This function runs on the ESPN page to get roster positions and names
function analyzeActiveRoster() {
  const targetPositions = ["QB", "RB", "WR", "TE", "FLEX", "D/ST", "K"];
  const positionAliases = {
    "QB": ["QB"],
    "RB": ["RB"],
    "WR": ["WR"],
    "TE": ["TE"],
    "FLEX": [], // We'll populate this manually
    "D/ST": ["D/ST", "DST", "DEFENSE", "DEF"],
    "K": ["K"]
  };

  const results = {};
  targetPositions.forEach(p => results[p] = []);

  const rows = Array.from(document.querySelectorAll("tr"));
  rows.forEach(row => {
    const text = row.textContent.toUpperCase();
    const nameEl = row.querySelector("a, span");
    const name = nameEl ? nameEl.textContent.trim() : "Unknown Player";

    let matched = false;
    for (const pos of targetPositions) {
      const aliases = positionAliases[pos];
      if (aliases.some(alias => text.includes(alias))) {
        if (!results[pos].includes(name)) {
          results[pos].push(name);
        }
        matched = true;
        break;
      }
    }

    // Fallback for D/ST if not matched
    if (!matched && /^[A-Z]{2,}S$/.test(name.toUpperCase()) || /49ERS|COWBOYS|EAGLES|CHIEFS|BILLS|BEARS|JETS|GIANTS/.test(name.toUpperCase())) {
      if (!results["D/ST"].includes(name)) {
        results["D/ST"].push(name);
      }
    }
  });

  // ✅ Populate FLEX with RB, WR, TE
  results["FLEX"] = [
    ...results["RB"],
    ...results["WR"],
    ...results["TE"]
  ];

  return results;
}

// Fetch a numeric "trade value" from the page (heuristic)
function fetchTradeValue(tabId, playerName, displayEl) {
  displayEl.textContent = "Loading trade value...";

  chrome.scripting.executeScript(
    {
      target: { tabId },
      func: getPlayerTradeValue,
      args: [playerName]
    },
    (res) => {
      const val = res && res[0] ? res[0].result : null;
      displayEl.textContent = val !== null ? `Trade Value: ${val}` : "Value not found";
    }
  );
}

// Runs on ESPN page; returns a numeric trade value for the given player
function getPlayerTradeValue(playerName) {
  const normalize = str => str.replace(/\s+/g, ' ').replace(/[^a-zA-Z ]/g, '').toUpperCase().trim();

  const tables = Array.from(document.querySelectorAll("table"));
  let rosterTable = null;

  for (const table of tables) {
    if (table.querySelector("thead") && table.querySelector("tbody")) {
      rosterTable = table;
      break;
    }
  }
  if (!rosterTable) return null;

  const rows = Array.from(rosterTable.querySelectorAll("tr")).slice(1); // skip header
  for (const row of rows) {
    const nameCell = row.querySelector("a, span");
    if (!nameCell) continue;

    const name = nameCell.textContent.trim();
    console.log(`Checking row: ${name} vs ${playerName}`);
    if (normalize(name) !== normalize(playerName)) continue;

    const cells = row.querySelectorAll("td");
    if (cells.length < 3) return 0;

    let proj = parseFloat(cells[2].textContent.trim()) || 0;
    let recent = parseFloat(cells[cells.length - 1].textContent.trim()) || 0;

    return Math.round(proj * 2 + recent * 1.5);
  }

  return null;
}