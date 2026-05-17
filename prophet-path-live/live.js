import { deleteApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue, get, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const QUESTIONS = window.PROPHET_PATH_QUESTIONS;
const LETTERS = ["A", "B", "C", "D"];
const TEAM_NAMES = ["Blue Team", "Gold Team", "Green Team", "Red Team"];
const SCENES = ["ark", "sea", "stars", "grain", "scroll", "lions", "fish", "sling", "fire", "crowns", "city", "bones", "river", "gate", "letters", "journey", "ship", "angel", "records", "plates", "prayer", "court", "warriors", "grove", "wagons", "jail", "temple", "tithing", "spirit", "baseball", "relief", "globe", "books", "welfare", "light", "agriculture", "templeSymbol", "manyTemples", "visits", "heart"];
const BOARD_SYMBOLS = ["ARK", "STARS", "COAT", "SEA", "CROWN", "SLING", "FIRE", "SCROLL", "CITY", "BONES", "LIONS", "FISH", "RIVER", "GATE", "ROAD", "TENT", "SHIP", "PRAYER", "COURT", "ANGEL", "SHIELD", "RECORD", "PLATES", "GROVE", "WAGON", "JAIL", "TEMPLE", "COIN", "SPIRIT", "BALL", "HELP", "GLOBE", "BOOKS", "STORE", "LIGHT", "WHEAT", "TEMPLE", "SPIRES", "VISIT", "HEART"];
const TIMELINE_PROPHETS = ["NOAH", "ABRAHAM", "JOSEPH (Old Testament)", "MOSES", "SAMUEL", "DAVID", "ELIJAH", "ISAIAH", "JEREMIAH", "EZEKIEL", "DANIEL", "JONAH", "JOHN THE BAPTIST", "PETER", "PAUL", "LEHI", "NEPHI", "ENOS", "ABINADI", "ALMA THE YOUNGER", "HELAMAN", "MORMON", "MORONI", "JOSEPH SMITH", "BRIGHAM YOUNG", "JOHN TAYLOR", "WILFORD WOODRUFF", "LORENZO SNOW", "JOSEPH F. SMITH", "HEBER J. GRANT", "GEORGE ALBERT SMITH", "DAVID O. McKAY", "JOSEPH FIELDING SMITH", "HAROLD B. LEE", "SPENCER W. KIMBALL", "EZRA TAFT BENSON", "HOWARD W. HUNTER", "GORDON B. HINCKLEY", "THOMAS S. MONSON", "RUSSELL M. NELSON"];
const BOARD_POINTS = Array.from({ length: 40 }, (_, index) => {
  const row = Math.floor(index / 8);
  const column = index % 8;
  const x = row % 2 === 0 ? 7 + column * 12.2 : 92 - column * 12.2;
  const y = 12 + row * 18.4 + (column % 2 === 0 ? 0 : 3.8);
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
  $("#hostQuestionText").textContent = game.phase === "scene" ? `Stop ${(game.current || 0) + 1}: visual clue ready. Press Ask Question when teams are ready.` : question.question;
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
  $("#focusProphetName").textContent = phase === "answer" ? `Answer: ${answerText}` : `Symbol: ${BOARD_SYMBOLS[questionIndex] || "CLUE"}`;
  $("#focusQuestionText").textContent = phase === "scene" ? "Look at the symbol and visual clue. Press Ask Question when teams are ready." : question.question;
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
    const answerText = question.choices[question.answer];
    const label = completed ? answerText : (BOARD_SYMBOLS[questionIndex] || "CLUE");
    return `<button class="timeline-stop ${status}" type="button" data-position="${position}" style="--x: ${point.x}%; --y: ${point.y}%;" aria-label="Open stop ${position + 1}">
      <span>${position + 1}</span>
      <strong>${label}</strong>
    </button>`;
  }).join("");
  $("#timelineTrack").innerHTML = boardPath + boardStops;
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
