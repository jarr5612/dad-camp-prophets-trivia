const LETTERS = ["A", "B", "C", "D"];
const TEAM_NAMES = ["Blue Team", "Gold Team", "Green Team", "Red Team"];

const SCENES = [
  "ark", "sea", "stars", "grain", "scroll", "lions", "fish", "sling", "fire", "crowns",
  "city", "bones", "river", "gate", "letters", "journey", "ship", "angel", "records", "plates",
  "prayer", "court", "warriors", "grove", "wagons", "jail", "temple", "tithing", "spirit", "baseball",
  "relief", "globe", "books", "welfare", "light", "agriculture", "templeSymbol", "manyTemples", "visits", "heart"
];

const state = {
  questions: [],
  order: [],
  current: 0,
  phase: "scene",
  mode: "host",
  teams: [],
  teamAnswers: {},
  scoredQuestions: {},
  hostMarks: {}
};

const setupView = document.querySelector("#setupView");
const gameView = document.querySelector("#gameView");
const setupForm = document.querySelector("#setupForm");
const loadStatus = document.querySelector("#loadStatus");
const startButton = document.querySelector("#startButton");
const trail = document.querySelector("#trail");
const stopLabel = document.querySelector("#stopLabel");
const partLabel = document.querySelector("#partLabel");
const phaseLabel = document.querySelector("#phaseLabel");
const questionText = document.querySelector("#questionText");
const choices = document.querySelector("#choices");
const teamPanel = document.querySelector("#teamPanel");
const scoreboard = document.querySelector("#scoreboard");
const askButton = document.querySelector("#askButton");
const revealButton = document.querySelector("#revealButton");
const nextButton = document.querySelector("#nextButton");
const backButton = document.querySelector("#backButton");
const newGameButton = document.querySelector("#newGameButton");

init();

async function init() {
  try {
    state.questions = await loadQuestions();
    if (state.questions.length !== 40) throw new Error("Expected 40 questions.");
    buildTrail();
    loadStatus.textContent = "Trail questions loaded.";
    loadStatus.className = "load-status ready";
    startButton.disabled = false;
  } catch (error) {
    loadStatus.textContent = "Questions did not load. Refresh the page and try again.";
    loadStatus.className = "load-status error";
    startButton.disabled = true;
  }
}

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.questions.length) return;
  const data = new FormData(setupForm);
  const teamCount = Number(data.get("teamCount"));
  state.mode = data.get("mode");
  state.order = state.questions.map((_, index) => index);
  if (data.get("order") === "shuffle") shuffle(state.order);
  state.current = 0;
  state.phase = "scene";
  state.teamAnswers = {};
  state.hostMarks = {};
  state.scoredQuestions = {};
  state.teams = TEAM_NAMES.slice(0, teamCount).map((name, id) => ({ id, name, score: 0 }));
  setupView.classList.add("hidden");
  gameView.classList.remove("hidden");
  buildTrail();
  render();
});

askButton.addEventListener("click", () => {
  state.phase = "question";
  render();
});

revealButton.addEventListener("click", () => {
  state.phase = "answer";
  if (state.mode === "teams") scoreTeamAnswers();
  render();
});

nextButton.addEventListener("click", () => {
  if (state.current < state.order.length - 1) {
    state.current += 1;
    state.phase = "scene";
    render();
  }
});

backButton.addEventListener("click", () => {
  if (state.current > 0) {
    state.current -= 1;
    state.phase = "scene";
    render();
  }
});

newGameButton.addEventListener("click", () => {
  gameView.classList.add("hidden");
  setupView.classList.remove("hidden");
});

async function loadQuestions() {
  if (Array.isArray(window.PROPHET_PATH_QUESTIONS)) {
    return window.PROPHET_PATH_QUESTIONS;
  }

  const response = await fetch("../app.js?v=music4");
  if (!response.ok) throw new Error("Question file could not be fetched.");
  const source = await response.text();
  const match = source.match(/const QUESTIONS = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error("Question data could not be loaded.");
  return Function(`"use strict"; return ${match[1]};`)();
}

function buildTrail() {
  trail.innerHTML = state.questions.map((question, index) => {
    return `<section class="stop">${drawScene(SCENES[index], index)}</section>`;
  }).join("");
}

function render() {
  const question = getQuestion();
  const questionId = getQuestionId();
  trail.style.transform = `translateX(-${state.current * 100}%)`;
  stopLabel.textContent = `Stop ${state.current + 1} of ${state.order.length}`;
  partLabel.textContent = question.part;
  phaseLabel.textContent = state.phase === "scene" ? "Explore the scene" : state.phase === "question" ? "Answer time" : "Answer revealed";
  questionText.textContent = state.phase === "scene" ? "Look closely at this camp stop. When everyone is ready, ask the question." : question.question;
  askButton.disabled = state.phase !== "scene";
  revealButton.disabled = state.phase === "scene" || state.phase === "answer";
  backButton.disabled = state.current === 0;
  nextButton.disabled = state.current === state.order.length - 1;
  renderScoreboard();
  renderChoices(question);
  renderTeamPanel(question, questionId);
}

function renderChoices(question) {
  choices.classList.toggle("hidden", state.phase === "scene");
  choices.innerHTML = question.choices.map((choice, index) => {
    const isCorrect = state.phase === "answer" && index === question.answer;
    return `<div class="answer ${isCorrect ? "correct" : ""}"><b>${LETTERS[index]}</b><span>${choice}</span></div>`;
  }).join("");
}

function renderTeamPanel(question, questionId) {
  teamPanel.classList.toggle("hidden", state.phase === "scene");
  if (state.phase === "scene") {
    teamPanel.innerHTML = "";
    return;
  }

  if (state.mode === "teams") {
    const answers = state.teamAnswers[questionId] || {};
    teamPanel.innerHTML = state.teams.map((team) => {
      const selected = answers[team.id];
      return `
        <div class="team-box">
          <h3>${team.name}</h3>
          <div class="answer-buttons">
            ${LETTERS.map((letter, index) => {
              const classes = ["answer-button"];
              if (selected === index) classes.push("selected");
              if (state.phase === "answer" && selected === index && index === question.answer) classes.push("correct-pick");
              if (state.phase === "answer" && selected === index && index !== question.answer) classes.push("wrong-pick");
              return `<button class="${classes.join(" ")}" data-team="${team.id}" data-answer="${index}" ${state.phase === "answer" ? "disabled" : ""}>${letter}</button>`;
            }).join("")}
          </div>
        </div>`;
    }).join("");

    teamPanel.querySelectorAll("[data-team]").forEach((button) => {
      button.addEventListener("click", () => {
        state.teamAnswers[questionId] ||= {};
        state.teamAnswers[questionId][button.dataset.team] = Number(button.dataset.answer);
        renderTeamPanel(question, questionId);
      });
    });
    return;
  }

  teamPanel.innerHTML = state.teams.map((team) => {
    const mark = state.hostMarks[questionId]?.[team.id];
    return `
      <div class="team-box">
        <h3>${team.name}</h3>
        <div class="mark-buttons">
          <button class="mark-button correct" data-mark-team="${team.id}" data-mark="correct" ${mark ? "disabled" : ""}>Correct</button>
          <button class="mark-button wrong" data-mark-team="${team.id}" data-mark="wrong" ${mark ? "disabled" : ""}>Wrong</button>
        </div>
      </div>`;
  }).join("");

  teamPanel.querySelectorAll("[data-mark-team]").forEach((button) => {
    button.addEventListener("click", () => {
      state.hostMarks[questionId] ||= {};
      if (state.hostMarks[questionId][button.dataset.markTeam]) return;
      if (button.dataset.mark === "correct") {
        state.teams.find((team) => team.id === Number(button.dataset.markTeam)).score += 1;
      }
      state.hostMarks[questionId][button.dataset.markTeam] = button.dataset.mark;
      render();
    });
  });
}

function renderScoreboard() {
  scoreboard.innerHTML = state.teams.map((team) => `
    <div class="score-card">
      <span>${team.name}</span>
      <strong>${team.score}</strong>
      <div class="score-tools">
        <button class="score-button" data-score="${team.id}" data-delta="1">+1</button>
        <button class="score-button minus" data-score="${team.id}" data-delta="-1">-1</button>
      </div>
    </div>
  `).join("");

  scoreboard.querySelectorAll("[data-score]").forEach((button) => {
    button.addEventListener("click", () => {
      state.teams.find((team) => team.id === Number(button.dataset.score)).score += Number(button.dataset.delta);
      renderScoreboard();
    });
  });
}

function scoreTeamAnswers() {
  const questionId = getQuestionId();
  if (state.scoredQuestions[questionId]) return;
  const question = getQuestion();
  const answers = state.teamAnswers[questionId] || {};
  state.teams.forEach((team) => {
    if (answers[team.id] === question.answer) team.score += 1;
  });
  state.scoredQuestions[questionId] = true;
}

function getQuestion() {
  return state.questions[state.order[state.current]];
}

function getQuestionId() {
  return state.order[state.current];
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function drawScene(type, index) {
  const sky = index < 23 ? "#8fd3ee" : "#9bd4f0";
  const hill = index < 23 ? "#78a95f" : "#6ba675";
  const feature = drawFeature(type);
  return `
    <svg class="scene-svg" viewBox="0 0 1600 900" role="img" aria-label="Visual clue scene">
      <rect width="1600" height="900" fill="${sky}"/>
      <circle cx="1320" cy="115" r="54" fill="#ffd36a"/>
      <path d="M0 370 C280 260 510 360 760 260 C1000 165 1240 310 1600 210 L1600 900 L0 900 Z" fill="#4f7d66"/>
      <path d="M0 520 C270 440 470 540 730 455 C1020 360 1250 520 1600 420 L1600 900 L0 900 Z" fill="${hill}"/>
      <path d="M-80 900 C320 730 520 700 830 760 C1120 815 1320 680 1680 590" fill="none" stroke="#c48c50" stroke-width="92" stroke-linecap="round"/>
      <path d="M-80 900 C320 730 520 700 830 760 C1120 815 1320 680 1680 590" fill="none" stroke="#e0b56e" stroke-width="58" stroke-linecap="round"/>
      ${drawCampExtras(index)}
      ${feature}
    </svg>`;
}

function drawCampExtras(index) {
  const tentX = 1180 + (index % 3) * 80;
  return `
    <g opacity="0.95">
      <path d="M${tentX} 670 L${tentX + 92} 520 L${tentX + 184} 670 Z" fill="#f8efe0" stroke="#9b6a35" stroke-width="8"/>
      <path d="M${tentX + 92} 520 L${tentX + 92} 670" stroke="#9b6a35" stroke-width="7"/>
      <rect x="${tentX - 18}" y="676" width="220" height="14" rx="7" fill="#674322"/>
    </g>
    <g transform="translate(96 610)">
      <rect x="0" y="55" width="150" height="38" rx="18" fill="#7a4b26"/>
      <circle cx="42" cy="46" r="16" fill="#ffca5e"/>
      <circle cx="82" cy="38" r="20" fill="#ffb33f"/>
      <circle cx="116" cy="48" r="15" fill="#ffd36a"/>
    </g>`;
}

function drawFeature(type) {
  const map = {
    ark: `<g transform="translate(470 360)"><path d="M0 230 C210 275 420 275 640 230 L570 350 L70 350 Z" fill="#8b5a2d"/><path d="M130 120 H475 L540 230 H70 Z" fill="#a86d38"/><rect x="260" y="42" width="135" height="82" fill="#7d5028"/><path d="M235 42 H420 L390 0 H265 Z" fill="#5b3b20"/><g fill="#263a22"><circle cx="130" cy="205" r="18"/><circle cx="190" cy="205" r="18"/><circle cx="250" cy="205" r="18"/></g></g>`,
    sea: `<g><path d="M0 610 C230 540 385 640 580 570 L560 900 H0 Z" fill="#2d83b7"/><path d="M1600 590 C1350 515 1190 640 1000 565 L1030 900 H1600 Z" fill="#2d83b7"/><path d="M765 330 C735 430 732 525 760 648" stroke="#5b3b20" stroke-width="16" stroke-linecap="round"/><circle cx="760" cy="300" r="32" fill="#6f4a28"/></g>`,
    stars: `<g>${Array.from({length: 20}, (_, i) => `<circle cx="${250 + (i * 57) % 1040}" cy="${90 + (i * 83) % 250}" r="${4 + i % 5}" fill="#fff7bf"/>`).join("")}<circle cx="800" cy="505" r="46" fill="#6f4a28"/><path d="M800 550 L735 710 H865 Z" fill="#ded6c4"/></g>`,
    grain: `<g transform="translate(565 365)"><rect x="120" y="210" width="360" height="120" rx="18" fill="#9f6c34"/><path d="M140 210 C190 70 380 70 460 210" fill="#c98b45"/><g stroke="#f4c85f" stroke-width="10">${[0,1,2,3,4,5].map(i => `<path d="M${80 + i * 80} 310 C${90 + i * 80} 235 ${95 + i * 80} 175 ${120 + i * 80} 95"/>`).join("")}</g></g>`,
    scroll: `<g transform="translate(575 330)"><rect x="80" y="80" width="420" height="260" rx="18" fill="#f4dfb8"/><circle cx="80" cy="210" r="70" fill="#e8c98d"/><circle cx="500" cy="210" r="70" fill="#e8c98d"/><g stroke="#80592d" stroke-width="12"><path d="M175 150 H410"/><path d="M175 210 H410"/><path d="M175 270 H360"/></g></g>`,
    lions: `<g transform="translate(550 430)"><circle cx="120" cy="120" r="82" fill="#9b6a2c"/><circle cx="120" cy="120" r="52" fill="#d6a24c"/><circle cx="400" cy="120" r="82" fill="#9b6a2c"/><circle cx="400" cy="120" r="52" fill="#d6a24c"/><rect x="235" y="0" width="50" height="265" rx="25" fill="#6f6f6f"/></g>`,
    fish: `<g transform="translate(445 400)"><path d="M160 145 C275 15 535 25 700 145 C535 265 275 275 160 145 Z" fill="#3c8ca8"/><path d="M160 145 L20 55 L62 145 L20 235 Z" fill="#2b7188"/><circle cx="610" cy="115" r="18" fill="#10283f"/></g>`,
    sling: `<g transform="translate(610 310)"><circle cx="170" cy="65" r="36" fill="#6f4a28"/><path d="M170 104 L130 280 L225 280 Z" fill="#d9c6a5"/><path d="M110 145 C250 185 355 120 440 70" fill="none" stroke="#5b3b20" stroke-width="10"/><circle cx="475" cy="55" r="24" fill="#747474"/></g>`,
    fire: `<g transform="translate(620 300)"><path d="M-130 360 L120 50 L370 360 Z" fill="#6d6d6d"/><path d="M130 265 C85 205 145 140 120 80 C225 150 250 230 205 300 C265 260 300 205 292 150 C382 245 342 360 208 385 C95 405 40 345 130 265 Z" fill="#f06a2d"/></g>`,
    crowns: `<g transform="translate(530 370)"><path d="M70 220 L110 90 L190 190 L280 70 L370 190 L450 90 L490 220 Z" fill="#f4b83f"/><rect x="70" y="220" width="420" height="95" rx="14" fill="#d99b2f"/><path d="M180 410 C200 275 360 275 380 410" fill="none" stroke="#6f4a28" stroke-width="18"/></g>`,
    city: `<g transform="translate(410 345)"><rect x="0" y="210" width="760" height="170" fill="#c8b08b"/><rect x="60" y="95" width="120" height="285" fill="#b49b77"/><rect x="260" y="40" width="135" height="340" fill="#b49b77"/><rect x="505" y="120" width="120" height="260" fill="#b49b77"/><path d="M130 295 H670" stroke="#80592d" stroke-width="16"/></g>`,
    bones: `<g transform="translate(500 470)" stroke="#f5efe2" stroke-width="22" stroke-linecap="round"><path d="M40 160 H360"/><path d="M180 50 V270"/><path d="M520 120 H820"/><path d="M670 20 V230"/><circle cx="180" cy="30" r="32" fill="#f5efe2" stroke="none"/><circle cx="670" cy="10" r="32" fill="#f5efe2" stroke="none"/></g>`,
    river: `<g><path d="M0 630 C360 520 540 740 850 610 C1090 505 1240 590 1600 520 L1600 900 L0 900 Z" fill="#3b94c4"/><g transform="translate(720 425)"><circle cx="0" cy="0" r="32" fill="#6f4a28"/><path d="M0 38 L-46 180 H46 Z" fill="#ded6c4"/><circle cx="150" cy="35" r="32" fill="#6f4a28"/><path d="M150 73 L110 205 H190 Z" fill="#e8d8bd"/></g></g>`,
    gate: `<g transform="translate(530 320)"><rect x="40" y="130" width="500" height="330" fill="#c6b188"/><path d="M40 130 C145 35 425 35 540 130" fill="#b29c77"/><path d="M240 460 V235 C240 160 340 160 340 235 V460" fill="#6b4a2c"/></g>`,
    letters: `<g transform="translate(420 320)"><path d="M0 280 C220 110 460 430 760 180" fill="none" stroke="#eadab8" stroke-width="70" stroke-linecap="round"/><g fill="#f4dfb8" stroke="#80592d" stroke-width="8"><rect x="130" y="20" width="165" height="110" rx="8"/><rect x="430" y="260" width="165" height="110" rx="8"/><rect x="690" y="40" width="165" height="110" rx="8"/></g></g>`,
    journey: `<g transform="translate(420 420)"><path d="M0 185 C220 40 470 330 760 90" fill="none" stroke="#e0b56e" stroke-width="46" stroke-linecap="round"/><path d="M150 260 L250 90 L350 260 Z" fill="#f8efe0" stroke="#9b6a35" stroke-width="8"/><path d="M520 235 L620 65 L720 235 Z" fill="#f8efe0" stroke="#9b6a35" stroke-width="8"/></g>`,
    ship: `<g transform="translate(430 345)"><path d="M60 330 C250 390 520 390 760 330 L690 430 H130 Z" fill="#8b5a2d"/><path d="M395 30 V330" stroke="#5b3b20" stroke-width="18"/><path d="M410 55 C545 95 565 190 410 255 Z" fill="#f8efe0"/><path d="M380 80 C245 125 245 215 380 280 Z" fill="#eadab8"/></g>`,
    angel: `<g transform="translate(610 300)"><circle cx="180" cy="110" r="52" fill="#ffe9a3"/><path d="M180 165 L95 380 H265 Z" fill="#fff6d2"/><path d="M95 205 C5 150 0 270 90 285" fill="#fff6d2"/><path d="M265 205 C355 150 360 270 270 285" fill="#fff6d2"/><path d="M180 35 L180 0" stroke="#fff2ad" stroke-width="16"/></g>`,
    records: `<g transform="translate(500 340)"><rect x="120" y="250" width="560" height="90" rx="18" fill="#8b5a2d"/><g fill="#f4dfb8" stroke="#80592d" stroke-width="9"><rect x="170" y="60" width="300" height="220" rx="14"/><rect x="250" y="20" width="300" height="220" rx="14"/><rect x="330" y="80" width="300" height="220" rx="14"/></g></g>`,
    plates: `<g transform="translate(575 365)"><path d="M90 330 C210 210 450 210 580 330 Z" fill="#6f7d54"/><g fill="#d6a647" stroke="#8a6424" stroke-width="9"><rect x="185" y="70" width="280" height="70" rx="12"/><rect x="205" y="130" width="280" height="70" rx="12"/><rect x="225" y="190" width="280" height="70" rx="12"/></g></g>`,
    prayer: `<g transform="translate(640 315)"><g fill="#2e694e"><rect x="-180" y="160" width="48" height="270"/><path d="M-205 180 L-155 40 L-105 180 Z"/><rect x="520" y="150" width="48" height="280"/><path d="M495 170 L545 30 L595 170 Z"/></g><circle cx="180" cy="150" r="42" fill="#6f4a28"/><path d="M180 195 C115 260 110 350 210 405" fill="none" stroke="#ded6c4" stroke-width="48" stroke-linecap="round"/></g>`,
    court: `<g transform="translate(445 320)"><rect x="0" y="185" width="720" height="250" fill="#c6b188"/><path d="M0 185 L360 45 L720 185 Z" fill="#b29c77"/><circle cx="360" cy="210" r="38" fill="#6f4a28"/><path d="M360 248 L295 405 H425 Z" fill="#ded6c4"/></g>`,
    warriors: `<g transform="translate(400 360)">${Array.from({length: 10}, (_, i) => `<g transform="translate(${i * 85} ${i % 2 * 35})"><circle cx="0" cy="50" r="24" fill="#6f4a28"/><path d="M0 80 L-35 190 H35 Z" fill="#d8c7a8"/><path d="M42 75 V185" stroke="#5b3b20" stroke-width="9"/></g>`).join("")}</g>`,
    grove: `<g transform="translate(440 280)"><g fill="#2e694e">${[0,1,2,3,4].map(i => `<rect x="${i * 160}" y="210" width="50" height="330"/><path d="M${i * 160 - 55} 240 L${i * 160 + 25} 20 L${i * 160 + 105} 240 Z"/>`).join("")}</g><g fill="#d6a647" stroke="#8a6424" stroke-width="8"><rect x="350" y="330" width="230" height="58" rx="10"/><rect x="365" y="380" width="230" height="58" rx="10"/></g></g>`,
    wagons: `<g transform="translate(390 415)"><g fill="#d9c6a5" stroke="#6f4a28" stroke-width="10"><path d="M80 160 C115 35 325 35 360 160 Z"/><rect x="60" y="160" width="320" height="85"/><circle cx="120" cy="260" r="40"/><circle cx="320" cy="260" r="40"/><path d="M520 160 C555 35 765 35 800 160 Z"/><rect x="500" y="160" width="320" height="85"/><circle cx="560" cy="260" r="40"/><circle cx="760" cy="260" r="40"/></g></g>`,
    jail: `<g transform="translate(555 305)"><rect x="120" y="80" width="420" height="420" fill="#9b9b9b"/><g stroke="#343434" stroke-width="20">${[0,1,2,3,4].map(i => `<path d="M${180 + i * 70} 105 V480"/>`).join("")}</g><circle cx="330" cy="275" r="45" fill="#6f4a28"/></g>`,
    temple: `<g transform="translate(490 285)"><rect x="150" y="250" width="520" height="240" fill="#e9e2d0"/><path d="M150 250 L410 95 L670 250 Z" fill="#d6cfbd"/><rect x="360" y="40" width="100" height="160" fill="#e9e2d0"/><path d="M410 0 L455 40 H365 Z" fill="#d6cfbd"/></g>`,
    tithing: `<g transform="translate(560 360)"><rect x="70" y="170" width="510" height="250" rx="18" fill="#8b5a2d"/><g fill="#d6a647">${[0,1,2,3,4].map(i => `<circle cx="${145 + i * 80}" cy="${125 + (i % 2) * 55}" r="42"/>`).join("")}</g></g>`,
    spirit: `<g transform="translate(520 280)"><circle cx="360" cy="250" r="190" fill="#fff4be" opacity="0.55"/><path d="M190 400 C230 230 490 230 530 400" fill="none" stroke="#fff6d2" stroke-width="42" stroke-linecap="round"/><circle cx="360" cy="205" r="42" fill="#fff6d2"/></g>`,
    baseball: `<g transform="translate(540 325)"><circle cx="210" cy="190" r="120" fill="#f8f4ea" stroke="#b94635" stroke-width="10"/><path d="M125 105 C175 150 175 230 125 275" fill="none" stroke="#b94635" stroke-width="8"/><path d="M295 105 C245 150 245 230 295 275" fill="none" stroke="#b94635" stroke-width="8"/><circle cx="560" cy="190" r="135" fill="#4b9ac1"/><path d="M425 190 H695 M560 55 C510 145 510 235 560 325 M560 55 C610 145 610 235 560 325" stroke="#e9f3ec" stroke-width="8" fill="none"/></g>`,
    relief: `<g transform="translate(470 360)"><g fill="#b77b3c" stroke="#7a4b26" stroke-width="8"><rect x="80" y="160" width="170" height="150"/><rect x="300" y="90" width="170" height="220"/><rect x="520" y="150" width="170" height="160"/></g><path d="M40 360 H730" stroke="#7a4b26" stroke-width="16"/></g>`,
    globe: `<g transform="translate(595 270)"><circle cx="250" cy="250" r="210" fill="#4b9ac1"/><path d="M70 250 H430 M250 40 C175 170 175 330 250 460 M250 40 C325 170 325 330 250 460" stroke="#e9f3ec" stroke-width="12" fill="none"/><path d="M135 175 C210 130 285 165 365 115" stroke="#2e694e" stroke-width="38" fill="none"/></g>`,
    books: `<g transform="translate(520 330)"><rect x="80" y="250" width="650" height="90" rx="12" fill="#7a4b26"/><g>${[0,1,2,3,4].map(i => `<rect x="${120 + i * 110}" y="${60 + i % 2 * 45}" width="82" height="220" rx="8" fill="${["#b64a3d","#3377b5","#3f9365","#d6a647","#80592d"][i]}"/>`).join("")}</g></g>`,
    welfare: `<g transform="translate(465 350)"><g fill="#f1d199" stroke="#8b5a2d" stroke-width="8">${[0,1,2,3].map(i => `<rect x="${i * 180}" y="${i % 2 * 70}" width="150" height="125" rx="12"/>`).join("")}</g><path d="M-30 285 H740" stroke="#8b5a2d" stroke-width="14"/></g>`,
    light: `<g transform="translate(600 260)"><circle cx="260" cy="245" r="190" fill="#fff4be" opacity="0.65"/><path d="M260 20 V470 M45 245 H475 M110 95 L410 395 M410 95 L110 395" stroke="#fff0a0" stroke-width="20"/></g>`,
    agriculture: `<g transform="translate(420 430)"><path d="M0 220 C180 90 420 360 780 120" fill="none" stroke="#c48c50" stroke-width="65"/><g stroke="#f4c85f" stroke-width="12">${[0,1,2,3,4,5,6].map(i => `<path d="M${80 + i * 90} 260 C${100 + i * 90} 195 ${110 + i * 90} 120 ${140 + i * 90} 50"/>`).join("")}</g></g>`,
    templeSymbol: `<g transform="translate(560 300)"><rect x="90" y="240" width="500" height="220" fill="#e9e2d0"/><path d="M90 240 L340 90 L590 240 Z" fill="#d6cfbd"/><rect x="300" y="40" width="80" height="145" fill="#e9e2d0"/><circle cx="340" cy="255" r="72" fill="#fff4be"/></g>`,
    manyTemples: `<g transform="translate(290 350)">${[0,1,2,3].map(i => `<g transform="translate(${i * 250} ${i % 2 * 45})"><rect x="60" y="150" width="170" height="120" fill="#e9e2d0"/><path d="M60 150 L145 85 L230 150 Z" fill="#d6cfbd"/><rect x="130" y="35" width="30" height="82" fill="#e9e2d0"/></g>`).join("")}</g>`,
    visits: `<g transform="translate(470 330)"><rect x="80" y="160" width="260" height="230" fill="#d6b98c"/><path d="M80 160 L210 65 L340 160 Z" fill="#b98752"/><rect x="450" y="200" width="240" height="190" fill="#d6b98c"/><path d="M450 200 L570 105 L690 200 Z" fill="#b98752"/><circle cx="390" cy="270" r="38" fill="#6f4a28"/><path d="M390 310 L335 430 H445 Z" fill="#ded6c4"/></g>`,
    heart: `<g transform="translate(570 290)"><path d="M300 430 C130 285 70 195 130 110 C185 35 265 80 300 145 C335 80 415 35 470 110 C530 195 470 285 300 430 Z" fill="#c94b55"/><path d="M560 120 C625 220 625 330 560 430" fill="none" stroke="#e9e2d0" stroke-width="34" stroke-linecap="round"/><circle cx="560" cy="88" r="38" fill="#e9e2d0"/></g>`
  };
  return map[type] || map.scroll;
}
