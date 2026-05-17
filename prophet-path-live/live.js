import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue, get, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const QUESTIONS = window.PROPHET_PATH_QUESTIONS;
const LETTERS = ["A", "B", "C", "D"];
const TEAM_NAMES = ["Blue Team", "Gold Team", "Green Team", "Red Team"];
const SCENES = ["ark", "sea", "stars", "grain", "scroll", "lions", "fish", "sling", "fire", "crowns", "city", "bones", "river", "gate", "letters", "journey", "ship", "angel", "records", "plates", "prayer", "court", "warriors", "grove", "wagons", "jail", "temple", "tithing", "spirit", "baseball", "relief", "globe", "books", "welfare", "light", "agriculture", "templeSymbol", "manyTemples", "visits", "heart"];
const QUESTION_SECONDS = 20;

const state = {
  app: null,
  db: null,
  gameCode: null,
  teamId: null,
  teamName: null,
  game: null,
  localAnsweredKey: null
};

const $ = (selector) => document.querySelector(selector);
const configView = $("#configView");
const lobbyView = $("#lobbyView");
const hostView = $("#hostView");
const teamView = $("#teamView");

$("#configForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const raw = $("#firebaseConfig").value.trim();
  try {
    const config = JSON.parse(raw);
    localStorage.setItem("prophetPathFirebaseConfig", JSON.stringify(config));
    connectFirebase(config);
  } catch {
    alert("Paste a valid Firebase config object.");
  }
});

$("#clearConfigButton").addEventListener("click", () => {
  localStorage.removeItem("prophetPathFirebaseConfig");
  $("#firebaseConfig").value = "";
});

$("#createGameButton").addEventListener("click", createGame);
$("#joinGameButton").addEventListener("click", joinGame);
$("#askQuestionButton").addEventListener("click", askQuestion);
$("#revealAnswerButton").addEventListener("click", revealAnswer);
$("#nextQuestionButton").addEventListener("click", nextQuestion);
$("#endGameButton").addEventListener("click", endGame);

const savedConfig = localStorage.getItem("prophetPathFirebaseConfig");
if (savedConfig) {
  $("#firebaseConfig").value = savedConfig;
  try {
    connectFirebase(JSON.parse(savedConfig));
  } catch {
    localStorage.removeItem("prophetPathFirebaseConfig");
  }
}

function connectFirebase(config) {
  state.app = initializeApp(config);
  state.db = getDatabase(state.app);
  showView(lobbyView);
}

async function createGame() {
  const code = makeCode();
  const teamCount = Number($("#teamCount").value);
  const order = QUESTIONS.map((_, index) => index);
  if ($("#questionOrder").value === "shuffle") shuffle(order);
  const teams = {};
  TEAM_NAMES.slice(0, teamCount).forEach((name, index) => {
    teams[`team${index + 1}`] = { name, score: 0, last: "Waiting" };
  });

  await set(gameRef(code), {
    createdAt: serverTimestamp(),
    phase: "scene",
    current: 0,
    order,
    questionStartedAt: 0,
    teams,
    submissions: {}
  });

  state.gameCode = code;
  $("#gameCodeLabel").textContent = code;
  listenToGame(code, "host");
  showView(hostView);
}

async function joinGame() {
  const code = $("#joinCodeInput").value.trim().toUpperCase();
  const name = $("#teamNameInput").value.trim() || "Team";
  if (!code) return;
  const snap = await get(gameRef(code));
  if (!snap.exists()) {
    alert("Game code not found.");
    return;
  }
  const game = snap.val();
  const openTeam = Object.entries(game.teams || {}).find(([, team]) => !team.deviceName || team.deviceName === name);
  if (!openTeam) {
    alert("No open team slots.");
    return;
  }
  state.gameCode = code;
  state.teamId = openTeam[0];
  state.teamName = name;
  await update(ref(state.db, `games/${code}/teams/${state.teamId}`), { deviceName: name, last: "Joined" });
  $("#teamGameCode").textContent = `Game ${code}`;
  $("#teamTitle").textContent = name;
  listenToGame(code, "team");
  showView(teamView);
}

function listenToGame(code, role) {
  onValue(gameRef(code), (snapshot) => {
    const game = snapshot.val();
    if (!game) {
      showView(lobbyView);
      return;
    }
    state.game = game;
    if (role === "host") renderHost();
    if (role === "team") renderTeam();
  });
}

async function askQuestion() {
  await update(gameRef(state.gameCode), {
    phase: "question",
    questionStartedAt: Date.now(),
    submissions: {}
  });
}

async function revealAnswer() {
  const game = state.game;
  const question = getQuestion(game);
  const updates = { phase: "answer" };
  Object.entries(game.teams || {}).forEach(([teamId, team]) => {
    const submission = game.submissions?.[teamId];
    const correct = submission?.answer === question.answer;
    const points = correct ? calculatePoints(submission.elapsedMs) : 0;
    updates[`teams/${teamId}/score`] = (team.score || 0) + points;
    updates[`teams/${teamId}/last`] = correct ? `+${points}` : submission ? "Wrong" : "No answer";
  });
  await update(gameRef(state.gameCode), updates);
}

async function nextQuestion() {
  const next = Math.min((state.game.current || 0) + 1, state.game.order.length - 1);
  await update(gameRef(state.gameCode), {
    current: next,
    phase: "scene",
    questionStartedAt: 0,
    submissions: {}
  });
}

async function endGame() {
  if (confirm("End this live game?")) {
    await remove(gameRef(state.gameCode));
    showView(lobbyView);
  }
}

async function submitAnswer(answer) {
  const game = state.game;
  if (!game || game.phase !== "question" || !state.teamId) return;
  const key = `${game.current}-${state.teamId}`;
  if (state.localAnsweredKey === key) return;
  const elapsedMs = Math.max(0, Date.now() - (game.questionStartedAt || Date.now()));
  state.localAnsweredKey = key;
  await set(ref(state.db, `games/${state.gameCode}/submissions/${state.teamId}`), {
    answer,
    elapsedMs,
    submittedAt: Date.now()
  });
  await update(ref(state.db, `games/${state.gameCode}/teams/${state.teamId}`), { last: "Answered" });
}

function renderHost() {
  const game = state.game;
  const question = getQuestion(game);
  const qIndex = game.order[game.current];
  $("#hostRoundLabel").textContent = `Question ${(game.current || 0) + 1} of ${game.order.length}`;
  $("#hostPartLabel").textContent = question.part;
  $("#hostPhaseLabel").textContent = game.phase === "scene" ? "Scene" : game.phase === "question" ? "Answering" : "Answer revealed";
  $("#hostQuestionText").textContent = game.phase === "scene" ? "Teams look at the visual clue. Press Ask Question when ready." : question.question;
  $("#sceneArt").innerHTML = drawScene(SCENES[qIndex], qIndex);
  $("#timerLabel").textContent = game.phase === "question" ? String(Math.max(0, QUESTION_SECONDS - Math.floor((Date.now() - game.questionStartedAt) / 1000))) : `${QUESTION_SECONDS}`;
  $("#askQuestionButton").disabled = game.phase !== "scene";
  $("#revealAnswerButton").disabled = game.phase !== "question";
  $("#nextQuestionButton").disabled = game.current >= game.order.length - 1;
  renderHostAnswers(question, game.phase);
  renderHostTeams(game);
}

function renderHostAnswers(question, phase) {
  $("#hostAnswers").classList.toggle("hidden", phase === "scene");
  $("#hostAnswers").innerHTML = question.choices.map((choice, index) => `
    <div class="answer ${phase === "answer" && index === question.answer ? "correct" : ""}">
      <b>${LETTERS[index]}</b><span>${choice}</span>
    </div>
  `).join("");
}

function renderHostTeams(game) {
  $("#hostTeams").innerHTML = Object.entries(game.teams || {}).map(([teamId, team]) => {
    const submission = game.submissions?.[teamId];
    return `<div class="team-row"><span>${team.deviceName || team.name}</span><strong>${team.score || 0}</strong><small>${submission ? "Answer in " + (submission.elapsedMs / 1000).toFixed(1) + "s" : team.last || "Waiting"}</small></div>`;
  }).join("");
}

function renderTeam() {
  const game = state.game;
  const question = getQuestion(game);
  const team = game.teams?.[state.teamId] || {};
  const submission = game.submissions?.[state.teamId];
  $("#teamScore").textContent = team.score || 0;
  $("#teamPrompt").textContent = game.phase === "scene" ? "Look at the TV. The host will start the question." : game.phase === "question" ? question.question : "Answer revealed on the TV.";
  $("#teamStatus").textContent = submission ? `Submitted in ${(submission.elapsedMs / 1000).toFixed(1)} seconds.` : game.phase === "question" ? "Choose carefully. Faster correct answers score more points." : team.last || "";
  $("#teamAnswerButtons").classList.toggle("hidden", game.phase === "scene");
  $("#teamAnswerButtons").innerHTML = question.choices.map((choice, index) => {
    const selected = submission?.answer === index;
    const correct = game.phase === "answer" && index === question.answer;
    const wrong = game.phase === "answer" && selected && index !== question.answer;
    return `<button class="answer-button ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" ${game.phase !== "question" || submission ? "disabled" : ""} data-answer="${index}"><b>${LETTERS[index]}</b>${choice}</button>`;
  }).join("");
  $("#teamAnswerButtons").querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => submitAnswer(Number(button.dataset.answer)));
  });
}

function getQuestion(game) {
  return QUESTIONS[game.order[game.current || 0]];
}

function calculatePoints(elapsedMs) {
  const ratio = Math.max(0, 1 - elapsedMs / (QUESTION_SECONDS * 1000));
  return Math.max(100, Math.round(500 + ratio * 500));
}

function gameRef(code) {
  return ref(state.db, `games/${code}`);
}

function makeCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function showView(view) {
  [configView, lobbyView, hostView, teamView].forEach((item) => item.classList.add("hidden"));
  view.classList.remove("hidden");
}

function drawScene(type, index) {
  const feature = {
    ark: `<path d="M460 300 C650 360 900 360 1130 300 L1060 410 H530 Z" fill="#7a4b26"/><path d="M610 195 H930 L985 300 H555 Z" fill="#8b5a2d"/><rect x="735" y="115" width="120" height="86" fill="#6a4224"/>`,
    sea: `<path d="M0 560 C240 480 420 590 620 510 L590 900 H0 Z" fill="#397b94"/><path d="M1600 540 C1340 465 1190 600 980 505 L1030 900 H1600 Z" fill="#397b94"/><path d="M790 260 C760 365 758 455 790 575" stroke="#5b3b20" stroke-width="16" stroke-linecap="round"/>`,
    stars: Array.from({length: 22}, (_, i) => `<circle cx="${220 + (i * 59) % 1120}" cy="${90 + (i * 79) % 250}" r="${4 + i % 5}" fill="#fff2b8"/>`).join("") + `<circle cx="800" cy="505" r="42" fill="#6f4a28"/><path d="M800 550 L735 710 H865 Z" fill="#d6c6aa"/>`
  }[type] || `<rect x="690" y="290" width="220" height="180" rx="12" fill="#b99a68"/><path d="M650 290 L800 170 L950 290 Z" fill="#8d6a43"/>`;

  return `<svg viewBox="0 0 1600 900" aria-label="Visual clue scene"><defs><linearGradient id="skyLive${index}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8fb9c8"/><stop offset="1" stop-color="#d7c9a7"/></linearGradient></defs><rect width="1600" height="900" fill="url(#skyLive${index})"/><circle cx="1305" cy="132" r="58" fill="#d9b55c"/><path d="M0 330 C250 220 520 340 760 235 C1010 125 1240 290 1600 190 L1600 900 L0 900 Z" fill="#496f61"/><path d="M0 495 C270 415 470 515 730 430 C1020 335 1250 495 1600 395 L1600 900 L0 900 Z" fill="#6f8f59"/><path d="M-80 900 C320 730 520 700 830 760 C1120 815 1320 680 1680 590" fill="none" stroke="#d0a060" stroke-width="58" stroke-linecap="round"/>${feature}</svg>`;
}
