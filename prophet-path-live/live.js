import { deleteApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue, get, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const SOURCE_QUESTIONS = window.PROPHET_PATH_QUESTIONS;
const SELECTED_QUESTION_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 13, 16, 17, 19, 23, 24, 25, 26, 35, 36, 38, 39, 40];
const SELECTED_INDEXES = SELECTED_QUESTION_NUMBERS.map((number) => number - 1);
const QUESTIONS = SELECTED_INDEXES.map((index) => SOURCE_QUESTIONS[index]);
const LETTERS = ["A", "B", "C", "D"];
const TEAM_NAMES = ["Blue Team", "Gold Team", "Green Team", "Red Team"];
const SCENES = selectOriginalItems(["ark", "sea", "stars", "grain", "scroll", "lions", "fish", "sling", "fire", "crowns", "city", "bones", "river", "gate", "letters", "journey", "ship", "angel", "records", "plates", "prayer", "court", "warriors", "grove", "wagons", "jail", "temple", "tithing", "spirit", "baseball", "relief", "globe", "books", "welfare", "light", "agriculture", "templeSymbol", "manyTemples", "visits", "heart"]);
const BOARD_SYMBOLS = selectOriginalItems(["ARK", "STARS", "COAT", "SEA", "CROWN", "SLING", "FIRE", "SCROLL", "CITY", "BONES", "LIONS", "FISH", "RIVER", "GATE", "ROAD", "TENT", "SHIP", "PRAYER", "COURT", "ANGEL", "SHIELD", "RECORD", "PLATES", "GROVE", "WAGON", "JAIL", "TEMPLE", "COIN", "SPIRIT", "BALL", "HELP", "GLOBE", "BOOKS", "STORE", "LIGHT", "WHEAT", "TEMPLE", "SPIRES", "VISIT", "HEART"]);
const BOARD_GLYPHS = selectOriginalItems(["⛵", "★", "▤", "≈", "♛", "◒", "♨", "▱", "▥", "✕", "◎", "◁", "〰", "⌂", "↝", "△", "⛵", "✦", "⚖", "✧", "⬟", "▤", "▣", "♣", "▰", "▥", "⌂", "$", "◈", "●", "♥", "◎", "▤", "⌂", "✷", "♧", "⌂", "△", "☉", "♥"]);
const TIMELINE_PROPHETS = QUESTIONS.map((question) => question.prophet);
const BOARD_POINTS = Array.from({ length: QUESTIONS.length }, (_, index) => {
  const row = Math.floor(index / 5);
  const column = index % 5;
  const x = row % 2 === 0 ? 10 + column * 20 : 90 - column * 20;
  const y = 14 + row * 23 + (column % 2 === 0 ? 0 : 4);
  return { x, y };
});
const QUESTION_SECONDS = 20;
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDu1iuT56XTyXH3OkORC9JdzuV8oGpz2jI",
  authDomain: "dad-camp-game.firebaseapp.com",
  databaseURL: "https://dad-camp-game-default-rtdb.firebaseio.com/",
  projectId: "dad-camp-game",
  storageBucket: "dad-camp-game.firebasestorage.app",
  messagingSenderId: "374929583378",
  appId: "1:374929583378:web:1db1a9c3327c0a0c7697cb"
};

const state = {
  app: null,
  db: null,
  gameCode: null,
  teamId: null,
  teamName: null,
  game: null,
  localAnsweredKey: null,
  hostTimer: null,
  autoRevealing: false,
  musicContext: null,
  musicTimer: null,
  musicPlaying: false,
  musicStep: 0,
  musicMaster: null,
  lastSceneQuestionIndex: null,
  boardFocused: false
};

const $ = (selector) => document.querySelector(selector);
const configView = $("#configView");
const lobbyView = $("#lobbyView");
const hostView = $("#hostView");
const teamView = $("#teamView");
const configStatus = $("#configStatus");
const lobbyStatus = $("#lobbyStatus");

$("#configForm").addEventListener("submit", handleConfigSubmit);
$("#useConfigButton").addEventListener("click", handleConfigSubmit);

async function handleConfigSubmit(event) {
  event.preventDefault();
  const raw = $("#firebaseConfig").value.trim();
  try {
    setConfigStatus("Checking Firebase connection...");
    const config = parseFirebaseConfig(raw);
    validateFirebaseConfig(config);
    await connectFirebase(config, true);
    localStorage.setItem("prophetPathFirebaseConfig", JSON.stringify(config));
    $("#firebaseConfig").value = JSON.stringify(config, null, 2);
    setConfigStatus("Connected. Opening the game lobby.", "ready");
    showView(lobbyView);
  } catch (error) {
    setConfigStatus(error.message || "Firebase could not connect.", "error");
  }
}

$("#clearConfigButton").addEventListener("click", () => {
  localStorage.removeItem("prophetPathFirebaseConfig");
  $("#firebaseConfig").value = "";
  setConfigStatus("");
});

$("#createGameButton").addEventListener("click", createGame);
$("#joinGameButton").addEventListener("click", joinGame);
$("#askQuestionButton").addEventListener("click", askQuestion);
$("#revealAnswerButton").addEventListener("click", revealAnswer);
$("#nextQuestionButton").addEventListener("click", nextQuestion);
$("#endGameButton").addEventListener("click", endGame);
$("#musicButton").addEventListener("click", toggleMusic);
$("#timelineTrack").addEventListener("click", handleTimelineClick);
$("#backToBoardButton").addEventListener("click", showBoardView);

startWithEmbeddedConfig();

async function startWithEmbeddedConfig() {
  try {
    $("#firebaseConfig").value = JSON.stringify(FIREBASE_CONFIG, null, 2);
    await connectFirebase(FIREBASE_CONFIG, true);
    localStorage.setItem("prophetPathFirebaseConfig", JSON.stringify(FIREBASE_CONFIG));
    showView(lobbyView);
  } catch (error) {
    showView(configView);
    setConfigStatus(error.message || "Firebase could not connect.", "error");
  }
}

async function connectFirebase(config, shouldTest = false) {
  const existingApp = getApps().find((app) => app.name === "prophetPathLive");
  if (existingApp && hasDifferentFirebaseConfig(existingApp.options, config)) await deleteApp(existingApp);
  state.app = getApps().find((app) => app.name === "prophetPathLive") || initializeApp(config, "prophetPathLive");
  state.db = getDatabase(state.app);
  if (shouldTest) await testDatabaseConnection();
}

function parseFirebaseConfig(raw) {
  if (!raw) throw new Error("Paste the Firebase config first.");
  let text = raw.trim();
  const objectMatch = text.match(/firebaseConfig\s*=\s*({[\s\S]*?});?$/) || text.match(/^({[\s\S]*})$/);
  if (objectMatch) text = objectMatch[1];

  try {
    return JSON.parse(text);
  } catch {
    const jsonish = text
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(jsonish);
    } catch {
      throw new Error("Paste a valid Firebase config object.");
    }
  }
}

function validateFirebaseConfig(config) {
  const requiredKeys = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
  const missing = requiredKeys.filter((key) => !config[key]);
  if (missing.length) throw new Error(`Firebase config is missing: ${missing.join(", ")}.`);
  if (!config.databaseURL.includes("firebaseio.com")) {
    throw new Error("Use the config that includes the Realtime Database URL.");
  }
}

function hasDifferentFirebaseConfig(current, next) {
  return ["apiKey", "authDomain", "databaseURL", "projectId", "appId"].some((key) => current[key] !== next[key]);
}

function selectOriginalItems(items) {
  return SELECTED_INDEXES.map((index) => items[index]);
}

async function testDatabaseConnection() {
  const id = Math.random().toString(36).slice(2);
  const testRef = ref(state.db, `connectionTests/${id}`);
  try {
    await set(testRef, { ok: true, at: Date.now() });
    await remove(testRef);
  } catch (error) {
    throw new Error(`Firebase connected, but the database did not allow writing. Check Realtime Database rules. (${error.message})`);
  }
}

async function createGame() {
  try {
    startMusic();
    setLobbyStatus("Creating game...");
    const code = makeCode();
    const teamCount = Number($("#teamCount").value);
    const order = getSelectedOrder();
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
      completed: {},
      questionStartedAt: 0,
      teams,
      submissions: {}
    });

    state.gameCode = code;
    $("#gameCodeLabel").textContent = code;
    listenToGame(code, "host");
    setLobbyStatus("");
    showView(hostView);
  } catch (error) {
    setLobbyStatus(`Could not create the game. ${error.message}`, "error");
  }
}

async function joinGame() {
  try {
    setLobbyStatus("Joining game...");
    const code = $("#joinCodeInput").value.trim().toUpperCase();
    const name = $("#teamNameInput").value.trim() || "Team";
    if (!code) {
      setLobbyStatus("Enter the game code from the TV.", "error");
      return;
    }
    const snap = await get(gameRef(code));
    if (!snap.exists()) {
      setLobbyStatus("Game code not found.", "error");
      return;
    }
    const game = snap.val();
    const openTeam = Object.entries(game.teams || {}).find(([, team]) => !team.deviceName || team.deviceName === name);
    if (!openTeam) {
      setLobbyStatus("No open team slots.", "error");
      return;
    }
    state.gameCode = code;
    state.teamId = openTeam[0];
    state.teamName = name;
    await update(ref(state.db, `games/${code}/teams/${state.teamId}`), { deviceName: name, last: "Joined" });
    $("#teamGameCode").textContent = `Game ${code}`;
    $("#teamTitle").textContent = name;
    listenToGame(code, "team");
    setLobbyStatus("");
    showView(teamView);
  } catch (error) {
    setLobbyStatus(`Could not join the game. ${error.message}`, "error");
  }
}

function listenToGame(code, role) {
  onValue(gameRef(code), (snapshot) => {
    const game = snapshot.val();
    if (!game) {
      stopHostTimer();
      showView(lobbyView);
      return;
    }
    state.game = game;
    if (role === "host") renderHost();
    if (role === "team") renderTeam();
  });
}

async function askQuestion() {
  startMusic();
  const startedAt = Date.now();
  await update(gameRef(state.gameCode), {
    phase: "question",
    questionStartedAt: startedAt,
    questionEndsAt: startedAt + QUESTION_SECONDS * 1000,
    submissions: {}
  });
}

async function revealAnswer() {
  const game = state.game;
  if (!game || game.phase === "answer") return;
  state.autoRevealing = true;
  const question = getQuestion(game);
  const updates = { phase: "answer" };
  updates[`completed/${game.current || 0}`] = true;
  Object.entries(game.teams || {}).forEach(([teamId, team]) => {
    const submission = game.submissions?.[teamId];
    const onTime = submission && submission.elapsedMs <= QUESTION_SECONDS * 1000;
    const correct = onTime && submission.answer === question.answer;
    const points = correct ? calculatePoints(submission.elapsedMs) : 0;
    updates[`teams/${teamId}/score`] = (team.score || 0) + points;
    updates[`teams/${teamId}/last`] = correct ? `+${points}` : submission ? (onTime ? "Wrong" : "Too late") : "No answer";
  });
  await update(gameRef(state.gameCode), updates);
  state.autoRevealing = false;
}

async function nextQuestion() {
  const next = Math.min((state.game.current || 0) + 1, state.game.order.length - 1);
  state.boardFocused = false;
  await update(gameRef(state.gameCode), {
    current: next,
    phase: "scene",
    questionStartedAt: 0,
    questionEndsAt: 0,
    submissions: {}
  });
}

async function jumpToTimelineStop(position) {
  if (!state.gameCode || !state.game) return;
  try {
    state.boardFocused = true;
    await update(gameRef(state.gameCode), {
      current: position,
      phase: "scene",
      questionStartedAt: 0,
      questionEndsAt: 0,
      submissions: {}
    });
  } catch (error) {
    $("#hostQuestionText").textContent = `Timeline stop could not open. ${error.message}`;
  }
}

async function endGame() {
  if (confirm("End this live game?")) {
    stopMusic();
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
  updateHostTimer();
  syncHostTimerLoop();
  $("#hostRoundLabel").textContent = `Question ${(game.current || 0) + 1} of ${game.order.length}`;
  $("#hostPartLabel").textContent = question.part;
  $("#hostPhaseLabel").textContent = game.phase === "scene" ? "Scene" : game.phase === "question" ? "Answering" : "Answer revealed";
  $("#hostQuestionText").textContent = getHostQuestionText(game, question);
  $("#sceneArt").innerHTML = drawScene(SCENES[qIndex], qIndex);
  renderStopFocus(question, qIndex, game.current || 0, game.phase);
  animateSceneIfNeeded(qIndex);
  $("#askQuestionButton").disabled = game.phase !== "scene";
  $("#revealAnswerButton").disabled = game.phase !== "question";
  $("#nextQuestionButton").disabled = game.current >= game.order.length - 1;
  renderHostAnswers(question, game.phase);
  renderHostTeams(game);
  renderTimeline(game);
}

function renderStopFocus(question, questionIndex, position, phase) {
  const shouldShowFocus = state.boardFocused || phase !== "scene";
  const answerText = question.choices[question.answer];
  $("#stopFocus").classList.toggle("hidden", !shouldShowFocus);
  $("#timelineTrack").classList.toggle("dimmed", shouldShowFocus);
  $("#focusArt").innerHTML = drawScene(SCENES[questionIndex], questionIndex);
  $("#focusStopLabel").textContent = `Stop ${position + 1} of ${state.game.order.length}`;
  $("#focusProphetName").textContent = phase === "answer" ? `Answer: ${answerText}` : "";
  $("#focusQuestionText").textContent = phase === "scene" ? "" : question.question;
}

function showBoardView() {
  state.boardFocused = false;
  $("#stopFocus").classList.add("hidden");
  $("#timelineTrack").classList.remove("dimmed");
}

function renderHostAnswers(question, phase) {
  $("#hostAnswers").classList.toggle("hidden", phase === "scene");
  $("#hostAnswers").innerHTML = question.choices.map((choice, index) => `
    <div class="answer ${phase === "answer" && index === question.answer ? "correct" : ""}">
      <b>${LETTERS[index]}</b><span>${choice}</span>
    </div>
  `).join("");
}

function getHostQuestionText(game, question) {
  if (game.phase === "answer") return `Prophet: ${question.choices[question.answer]}`;
  if (game.phase === "scene") return `Stop ${(game.current || 0) + 1}`;
  return question.question;
}

function renderHostTeams(game) {
  $("#hostTeams").innerHTML = Object.entries(game.teams || {}).map(([teamId, team]) => {
    const submission = game.submissions?.[teamId];
    return `<div class="team-row"><span>${team.deviceName || team.name}</span><strong>${team.score || 0}</strong><small>${submission ? "Answer in " + (submission.elapsedMs / 1000).toFixed(1) + "s" : team.last || "Waiting"}</small></div>`;
  }).join("");
}

function renderTimeline(game) {
  const current = game.current || 0;
  const pathPoints = game.order.map((_, position) => {
    const point = BOARD_POINTS[position] || BOARD_POINTS[BOARD_POINTS.length - 1];
    return `${point.x},${point.y}`;
  }).join(" ");
  const boardPath = `<svg class="board-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${pathPoints}" />
  </svg>`;
  const boardStops = game.order.map((questionIndex, position) => {
    const question = QUESTIONS[questionIndex];
    const point = BOARD_POINTS[position] || BOARD_POINTS[BOARD_POINTS.length - 1];
    const completed = game.completed?.[position];
    const status = `${completed ? "locked" : ""} ${position === current ? "active" : ""}`;
    const glyph = BOARD_GLYPHS[questionIndex] || "◆";
    const lockedMark = completed ? `<i class="lock-mark" aria-hidden="true">✓</i>` : "";
    return `<button class="timeline-stop ${status}" type="button" data-position="${position}" style="--x: ${point.x}%; --y: ${point.y}%;" aria-label="Open stop ${position + 1}">
      <b class="symbol-icon" aria-hidden="true">${glyph}</b>
      <span>${position + 1}</span>
      ${lockedMark}
    </button>`;
  }).join("");
  $("#timelineTrack").innerHTML = boardPath + boardStops;
}

function drawBoardIcon(symbol) {
  const icons = {
    ARK: `<path d="M12 30 H52 L46 42 H18 Z"/><path d="M22 20 H42 L48 30 H16 Z"/><path d="M30 13 H40 V21 H30 Z"/>`,
    STARS: `<path d="M32 9 L36 24 L51 28 L38 36 L42 51 L32 42 L20 51 L25 36 L13 28 L28 24 Z"/>`,
    COAT: `<path d="M22 13 L32 19 L42 13 L52 23 L45 31 V52 H19 V31 L12 23 Z"/><path d="M27 21 V52 M37 21 V52"/>`,
    SEA: `<path d="M8 24 C18 16 25 32 35 24 C45 16 52 32 60 24"/><path d="M8 40 C18 32 25 48 35 40 C45 32 52 48 60 40"/>`,
    CROWN: `<path d="M12 45 H52 L48 22 L38 35 L32 18 L26 35 L16 22 Z"/>`,
    SLING: `<path d="M22 12 C18 28 26 38 32 48 C38 38 46 28 42 12"/><circle cx="32" cy="49" r="4"/>`,
    FIRE: `<path d="M34 8 C47 21 38 31 49 42 C42 54 25 57 17 44 C10 31 25 24 23 12 C29 18 30 24 34 8 Z"/>`,
    SCROLL: `<path d="M18 13 H47 C39 17 39 48 47 52 H18 C25 47 25 18 18 13 Z"/><path d="M25 24 H42 M25 34 H41 M25 43 H38"/>`,
    CITY: `<path d="M12 52 V30 H20 V21 H30 V30 H38 V18 H50 V52 Z"/><path d="M16 52 H56"/>`,
    BONES: `<path d="M15 22 L49 46"/><circle cx="12" cy="20" r="5"/><circle cx="20" cy="15" r="5"/><circle cx="45" cy="49" r="5"/><circle cx="53" cy="44" r="5"/>`,
    LIONS: `<circle cx="32" cy="31" r="16"/><circle cx="32" cy="31" r="9"/><path d="M23 25 L17 18 M41 25 L47 18 M25 38 H39"/>`,
    FISH: `<path d="M12 32 C24 18 42 18 54 32 C42 46 24 46 12 32 Z"/><path d="M54 32 L62 24 V40 Z"/><circle cx="25" cy="29" r="2"/>`,
    RIVER: `<path d="M24 8 C10 22 44 26 26 40 C18 46 18 53 26 58"/><path d="M39 8 C25 22 58 26 41 40 C33 47 35 53 43 58"/>`,
    GATE: `<path d="M16 54 V24 C16 15 48 15 48 24 V54"/><path d="M24 54 V31 C24 25 40 25 40 31 V54"/>`,
    ROAD: `<path d="M24 56 L31 10 H39 L48 56 Z"/><path d="M36 16 V24 M37 32 V40 M39 48 V54"/>`,
    TENT: `<path d="M10 52 L32 14 L54 52 Z"/><path d="M32 14 V52 M25 52 L32 36 L39 52"/>`,
    SHIP: `<path d="M16 40 C28 48 42 48 54 40 L48 52 H22 Z"/><path d="M32 12 V40 M32 16 L48 34 H32 Z"/>`,
    PRAYER: `<path d="M25 13 C30 21 30 37 23 51"/><path d="M39 13 C34 21 34 37 41 51"/><path d="M25 33 H39"/>`,
    COURT: `<path d="M16 52 H48 M20 48 H44 M32 14 L50 24 H14 Z"/><path d="M20 24 V48 M32 24 V48 M44 24 V48"/>`,
    ANGEL: `<circle cx="32" cy="17" r="6"/><path d="M22 30 C8 25 8 43 25 40"/><path d="M42 30 C56 25 56 43 39 40"/><path d="M32 24 V52"/>`,
    SHIELD: `<path d="M32 10 L51 18 V32 C51 44 42 52 32 56 C22 52 13 44 13 32 V18 Z"/>`,
    RECORD: `<path d="M18 12 H46 V54 H18 Z"/><path d="M25 23 H40 M25 32 H40 M25 41 H36"/>`,
    PLATES: `<rect x="15" y="18" width="34" height="28" rx="3"/><path d="M21 24 H55 V52 H21 Z"/>`,
    GROVE: `<path d="M20 52 V30 M44 52 V28"/><circle cx="20" cy="23" r="12"/><circle cx="44" cy="21" r="13"/>`,
    WAGON: `<path d="M14 38 H50 L44 25 H20 Z"/><circle cx="22" cy="45" r="6"/><circle cx="44" cy="45" r="6"/>`,
    JAIL: `<rect x="15" y="14" width="34" height="40"/><path d="M23 14 V54 M32 14 V54 M41 14 V54"/>`,
    TEMPLE: `<path d="M12 52 H52 M18 48 V30 H46 V48 M25 48 V24 H39 V48 M32 11 V24"/><path d="M28 18 H36"/>`,
    COIN: `<circle cx="32" cy="32" r="20"/><path d="M32 18 V46 M24 26 C24 20 40 20 40 27 C40 34 24 30 24 38 C24 45 40 45 40 38"/>`,
    SPIRIT: `<path d="M32 8 C47 25 45 43 32 56 C19 43 17 25 32 8 Z"/><circle cx="32" cy="34" r="8"/>`,
    BALL: `<circle cx="32" cy="32" r="21"/><path d="M16 25 C28 31 36 31 48 25 M16 39 C28 33 36 33 48 39"/>`,
    HELP: `<path d="M32 52 C12 39 13 18 29 25 C31 26 32 29 32 29 C32 29 33 26 35 25 C51 18 52 39 32 52 Z"/>`,
    GLOBE: `<circle cx="32" cy="32" r="21"/><path d="M11 32 H53 M32 11 C22 22 22 42 32 53 M32 11 C42 22 42 42 32 53"/>`,
    BOOKS: `<path d="M14 15 H28 V52 H14 Z M30 12 H44 V52 H30 Z M46 18 H56 V52 H46 Z"/>`,
    STORE: `<path d="M14 52 V24 H50 V52"/><path d="M10 24 L17 12 H47 L54 24 Z"/><path d="M23 52 V36 H41 V52"/>`,
    LIGHT: `<circle cx="32" cy="25" r="12"/><path d="M26 40 H38 M28 47 H36 M32 4 V10 M14 25 H8 M56 25 H50"/>`,
    WHEAT: `<path d="M32 12 V56"/><path d="M32 20 C20 17 20 28 32 27 M32 30 C44 27 44 38 32 37 M32 40 C20 37 20 48 32 47"/>`,
    SPIRES: `<path d="M14 54 V34 H26 V54 M26 54 V22 H38 V54 M38 54 V30 H50 V54"/><path d="M20 20 V34 M32 8 V22 M44 16 V30"/>`,
    VISIT: `<path d="M16 50 C18 37 27 31 32 31 C37 31 46 37 48 50"/><circle cx="32" cy="20" r="9"/><path d="M44 18 H56 M50 12 V24"/>`,
    HEART: `<path d="M32 52 C12 39 13 18 29 25 C31 26 32 29 32 29 C32 29 33 26 35 25 C51 18 52 39 32 52 Z"/>`
  };
  return `<svg viewBox="0 0 64 64" focusable="false">${icons[symbol] || icons.LIGHT}</svg>`;
}

function handleTimelineClick(event) {
  const stop = event.target.closest("[data-position]");
  if (!stop) return;
  jumpToTimelineStop(Number(stop.dataset.position));
}

function animateSceneIfNeeded(questionIndex) {
  if (state.lastSceneQuestionIndex === questionIndex) return;
  state.lastSceneQuestionIndex = questionIndex;
  const scene = $("#sceneArt");
  scene.classList.remove("zoom-in");
  void scene.offsetWidth;
  scene.classList.add("zoom-in");
}

function syncHostTimerLoop() {
  if (state.game.phase === "question" && !state.hostTimer) {
    state.hostTimer = setInterval(updateHostTimer, 250);
  }
  if (state.game.phase !== "question") stopHostTimer();
}

function stopHostTimer() {
  if (!state.hostTimer) return;
  clearInterval(state.hostTimer);
  state.hostTimer = null;
}

function updateHostTimer() {
  const game = state.game;
  if (!game) return;
  const remaining = getRemainingSeconds(game);
  $("#timerLabel").textContent = String(remaining);
  $("#timerPill").textContent = game.phase === "question" ? `${remaining} seconds` : `${QUESTION_SECONDS} seconds`;
  $("#timerCard").classList.toggle("warning", game.phase === "question" && remaining <= 5);
  if (game.phase === "question" && remaining <= 0 && !state.autoRevealing) revealAnswer();
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

function getRemainingSeconds(game) {
  if (game.phase !== "question") return QUESTION_SECONDS;
  const endsAt = game.questionEndsAt || ((game.questionStartedAt || Date.now()) + QUESTION_SECONDS * 1000);
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function getSelectedOrder() {
  if ($("#questionOrder").value !== "timeline") return QUESTIONS.map((_, index) => index);
  const order = TIMELINE_PROPHETS
    .map((prophet) => QUESTIONS.findIndex((question) => question.prophet === prophet))
    .filter((index) => index >= 0);
  const remaining = QUESTIONS.map((_, index) => index).filter((index) => !order.includes(index));
  return order.concat(remaining);
}

function toggleMusic() {
  if (state.musicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
}

function startMusic() {
  if (state.musicPlaying) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  state.musicContext = state.musicContext || new AudioContext();
  state.musicMaster = state.musicMaster || createMusicMaster();
  state.musicContext.resume();
  state.musicPlaying = true;
  $("#musicButton").textContent = "Music Off";
  state.musicStep = 0;
  playMusicStep();
  state.musicTimer = setInterval(playMusicStep, 300);
}

function stopMusic() {
  if (state.musicTimer) clearInterval(state.musicTimer);
  state.musicTimer = null;
  state.musicPlaying = false;
  $("#musicButton").textContent = "Music On";
}

function playMusicStep() {
  const context = state.musicContext;
  if (!context) return;
  const step = state.musicStep % 16;
  const bar = Math.floor(state.musicStep / 16) % 4;
  const bassRoots = [130.81, 174.61, 146.83, 196.00];
  const chordProgression = [
    [261.63, 329.63, 392.00],
    [293.66, 349.23, 440.00],
    [246.94, 293.66, 392.00],
    [293.66, 392.00, 493.88]
  ];
  const melody = [523.25, 587.33, 659.25, 587.33, 523.25, 440.00, 493.88, 523.25];
  const now = context.currentTime;

  if (step % 4 === 0) playTone(bassRoots[bar], now, 0.34, "triangle", 0.16);
  if (step % 8 === 0) playChord(chordProgression[bar], now + 0.02, 0.72);
  if ([3, 7, 11, 15].includes(step)) playTone(melody[(state.musicStep / 2) % melody.length | 0], now, 0.12, "sine", 0.055);
  if (step % 4 === 0) playSoftKick(now);
  if (step % 4 === 2) playTick(now, 0.045);
  if (step % 2 === 1) playTick(now, 0.018);
  state.musicStep += 1;
}

function playTone(frequency, start, duration, type, volume) {
  const context = state.musicContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(state.musicMaster);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function playChord(notes, start, duration) {
  notes.forEach((frequency, index) => playTone(frequency, start + index * 0.015, duration, "sine", 0.038));
}

function playSoftKick(start) {
  const context = state.musicContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(120, start);
  oscillator.frequency.exponentialRampToValueAtTime(55, start + 0.12);
  gain.gain.setValueAtTime(0.11, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
  oscillator.connect(gain).connect(state.musicMaster);
  oscillator.start(start);
  oscillator.stop(start + 0.15);
}

function playTick(start, volume) {
  const context = state.musicContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(1280, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.028);
  oscillator.connect(gain).connect(state.musicMaster);
  oscillator.start(start);
  oscillator.stop(start + 0.032);
}

function createMusicMaster() {
  const context = state.musicContext;
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  gain.gain.value = 0.42;
  filter.connect(gain).connect(context.destination);
  return filter;
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

function setConfigStatus(message, tone = "") {
  configStatus.textContent = message;
  configStatus.classList.toggle("ready", tone === "ready");
  configStatus.classList.toggle("error", tone === "error");
}

function setLobbyStatus(message, tone = "") {
  lobbyStatus.textContent = message;
  lobbyStatus.classList.toggle("ready", tone === "ready");
  lobbyStatus.classList.toggle("error", tone === "error");
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
