const namesInput = document.getElementById("namesInput");
const generateBtn = document.getElementById("generateBtn");
const resetBtn = document.getElementById("resetBtn");
const exampleBtn = document.getElementById("exampleBtn");
const bracketWrap = document.getElementById("bracketWrap");
const message = document.getElementById("message");
const participantsCount = document.getElementById("participantsCount");
const roundsCount = document.getElementById("roundsCount");
const statusText = document.getElementById("statusText");

let tournament = null;

const exampleNames = [
  "Alex", "Lina", "Mehdi", "Sarah",
  "Noah", "Emma", "Lucas", "Inès",
  "Tom", "Maya", "Hugo", "Zoé"
];

function normalizeNames(raw) {
  return raw
    .split(/\n+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function nextPowerOfTwo(n) {
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

function buildInitialRounds(names) {
  const bracketSize = nextPowerOfTwo(names.length);
  const rounds = [];
  const firstRound = [];
  const padded = names.slice();

  while (padded.length < bracketSize) padded.push(null);

  for (let i = 0; i < bracketSize; i += 2) {
    firstRound.push({
      id: `r0m${i / 2}`,
      p1: padded[i],
      p2: padded[i + 1],
      winner: null,
      completed: false,
      bye: false,
    });
  }
  rounds.push(firstRound);

  let currentMatches = firstRound.length;
  while (currentMatches > 1) {
    currentMatches = Math.ceil(currentMatches / 2);
    const nextRound = Array.from({ length: currentMatches }, (_, index) => ({
      id: `r${rounds.length}m${index}`,
      p1: null,
      p2: null,
      winner: null,
      completed: false,
      bye: false,
    }));
    rounds.push(nextRound);
  }

  return rounds;
}

function roundLabel(index, totalRounds) {
  if (index === totalRounds - 1) return "Finale";
  if (index === totalRounds - 2) return "Demi-finale";
  if (index === totalRounds - 3) return "Quart de finale";
  return `Tour ${index + 1}`;
}

function syncNextRound(roundIndex) {
  const round = tournament.rounds[roundIndex];
  const nextRound = tournament.rounds[roundIndex + 1];
  if (!nextRound) return;

  for (let i = 0; i < nextRound.length; i++) {
    const sourceA = round[i * 2];
    const sourceB = round[i * 2 + 1];
    nextRound[i].p1 = sourceA && sourceA.winner ? sourceA.winner : null;
    nextRound[i].p2 = sourceB && sourceB.winner ? sourceB.winner : null;

    if (nextRound[i].p1 && !nextRound[i].p2) {
      nextRound[i].winner = nextRound[i].p1;
      nextRound[i].completed = true;
    } else if (!nextRound[i].p1 && nextRound[i].p2) {
      nextRound[i].winner = nextRound[i].p2;
      nextRound[i].completed = true;
    } else if (nextRound[i].p1 && nextRound[i].p2 && nextRound[i].completed && !nextRound[i].winner) {
      nextRound[i].completed = false;
    }
  }

  if (nextRound.every((match) => match.completed && match.winner)) {
    syncNextRound(roundIndex + 1);
  }
}

function autoResolveByes() {
  let changed = true;
  while (changed) {
    changed = false;

    for (let r = 0; r < tournament.rounds.length; r++) {
      const round = tournament.rounds[r];
      for (const match of round) {
        if (!match.completed) {
          const hasP1 = !!match.p1;
          const hasP2 = !!match.p2;
          if (hasP1 && !hasP2) {
            match.winner = match.p1;
            match.completed = true;
            changed = true;
          } else if (!hasP1 && hasP2) {
            match.winner = match.p2;
            match.completed = true;
            changed = true;
          }
        }
      }
      if (changed) syncNextRound(r);
    }
  }
}

function render() {
  if (!tournament) {
    bracketWrap.innerHTML = `
      <div class="empty-state">
        <h3>Le tableau apparaîtra ici</h3>
        <p>Génère le tournoi pour voir les matchs du premier tour, puis clique sur chaque gagnant.</p>
      </div>
    `;
    participantsCount.textContent = "0";
    roundsCount.textContent = "0";
    statusText.textContent = "En attente";
    return;
  }

  const roundsHtml = tournament.rounds
    .map((round, rIndex) => {
      const title = roundLabel(rIndex, tournament.rounds.length);
      const completeCount = round.filter((m) => m.completed).length;

      const matchesHtml = round
        .map((match, mIndex) => {
          const p1 = match.p1;
          const p2 = match.p2;
          const winner = match.winner;

          const p1Class = [
            "player",
            winner && winner === p1 ? "winner" : "",
            winner && p2 && winner === p2 ? "loser" : "",
            p1 && !p2 ? "bye" : "",
          ].filter(Boolean).join(" ");

          const p2Class = [
            "player",
            winner && winner === p2 ? "winner" : "",
            winner && p1 && winner === p1 ? "loser" : "",
            p2 && !p1 ? "bye" : "",
          ].filter(Boolean).join(" ");

          const locked = rIndex > 0 && (!p1 || !p2) && !match.completed;
          const canClick = !!p1 && !!p2 && !match.completed;

          return `
            <article class="match ${match.completed ? "winner-ready" : ""} ${locked ? "locked" : ""}">
              <div class="match-header">
                <span>Match ${mIndex + 1}</span>
                <span class="vs">${match.completed ? "TERMINÉ" : (p1 && p2 ? "VS" : "ATTENTE")}</span>
              </div>
              <div class="match-players">
                <button class="${p1Class}" ${canClick ? `data-round="${rIndex}" data-match="${mIndex}" data-player="1"` : "disabled"}>${p1 ?? "—"}</button>
                <button class="${p2Class}" ${canClick ? `data-round="${rIndex}" data-match="${mIndex}" data-player="2"` : "disabled"}>${p2 ?? "—"}</button>
              </div>
              <div class="connector">${match.completed && winner ? `Gagnant : ${winner}` : (p1 && !p2 ? "Passage automatique" : "")}</div>
            </article>
          `;
        })
        .join("");

      return `
        <section class="round">
          <div class="round-title">
            <h3>${title}</h3>
            <span>${completeCount}/${round.length} matchs</span>
          </div>
          <div class="matches">${matchesHtml}</div>
        </section>
      `;
    })
    .join("");

  const champion = getChampion();
  bracketWrap.innerHTML = `
    <div class="bracket">
      <div class="rounds">${roundsHtml}</div>
      ${champion ? `
        <div class="final-champion">
          <h3>Champion</h3>
          <p>${champion}</p>
        </div>
      ` : ""}
    </div>
  `;

  participantsCount.textContent = String(tournament.participants.length);
  roundsCount.textContent = String(tournament.rounds.length);
  statusText.textContent = champion ? "Terminé" : "En cours";
}

function getChampion() {
  if (!tournament) return null;
  const lastRound = tournament.rounds[tournament.rounds.length - 1];
  if (!lastRound || !lastRound[0] || !lastRound[0].completed) return null;
  return lastRound[0].winner;
}

function updateProgressText() {
  const champion = getChampion();
  if (champion) {
    message.textContent = `Le champion est ${champion}. Tu peux réinitialiser ou relancer un nouveau tournoi.`;
    return;
  }

  if (!tournament) {
    message.textContent = "Entre au moins 2 noms pour commencer.";
    return;
  }

  const pending = tournament.rounds
    .reduce((sum, round) => sum + round.filter((match) => !match.completed).length, 0);

  message.textContent = pending === 0
    ? "Le tournoi est prêt."
    : "Clique sur un nom pour déclarer le gagnant du match.";
}

function startTournament() {
  const names = normalizeNames(namesInput.value);

  if (names.length < 2) {
    tournament = null;
    render();
    message.textContent = "Il faut au moins 2 noms.";
    return;
  }

  tournament = {
    participants: names,
    rounds: buildInitialRounds(names),
  };

  autoResolveByes();
  render();
  updateProgressText();
}

function setWinner(roundIndex, matchIndex, playerIndex) {
  const match = tournament?.rounds?.[roundIndex]?.[matchIndex];
  if (!match || match.completed) return;

  const chosen = playerIndex === 1 ? match.p1 : match.p2;
  if (!chosen) return;

  match.winner = chosen;
  match.completed = true;

  syncNextRound(roundIndex);
  autoResolveByes();
  render();
  updateProgressText();
}

bracketWrap.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-round]");
  if (!button || button.disabled) return;

  const roundIndex = Number(button.dataset.round);
  const matchIndex = Number(button.dataset.match);
  const playerIndex = Number(button.dataset.player);

  setWinner(roundIndex, matchIndex, playerIndex);
});

generateBtn.addEventListener("click", startTournament);

resetBtn.addEventListener("click", () => {
  tournament = null;
  namesInput.value = "";
  render();
  updateProgressText();
});

exampleBtn.addEventListener("click", () => {
  namesInput.value = exampleNames.join("\n");
  message.textContent = "Exemple chargé. Clique sur « Créer le tournoi ».";
});

namesInput.addEventListener("input", () => {
  if (!tournament) updateProgressText();
});

render();
updateProgressText();
