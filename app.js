const QUESTIONS = [
  {
    part: "Ancient Prophets",
    prophet: "NOAH",
    question: "Which prophet built a giant wooden ark to save his family and two of every animal from a worldwide flood?",
    choices: ["Moses", "Abraham", "Noah", "Jonah"],
    answer: 2
  },
  {
    part: "Ancient Prophets",
    prophet: "MOSES",
    question: "This prophet raised his staff and parted the Red Sea, allowing thousands of Israelites to escape from Pharaoh's army. Who was he?",
    choices: ["Elijah", "Joshua", "Aaron", "Moses"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "ABRAHAM",
    question: "God promised this prophet that his descendants would be as numerous as the stars in the sky, making him the \"Father of Many Nations.\" Who was he?",
    choices: ["Isaac", "Jacob", "Abraham", "Lot"],
    answer: 2
  },
  {
    part: "Ancient Prophets",
    prophet: "JOSEPH (Old Testament)",
    question: "After being sold into slavery by his own brothers, this prophet interpreted Pharaoh's dreams and saved Egypt from seven years of famine. Who was he?",
    choices: ["Joseph", "Benjamin", "Reuben", "Daniel"],
    answer: 0
  },
  {
    part: "Ancient Prophets",
    prophet: "ISAIAH",
    question: "This Old Testament prophet wrote more prophecies about Jesus Christ's birth and life than any other prophet in the entire Bible. Who was he?",
    choices: ["Jeremiah", "Ezekiel", "Micah", "Isaiah"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "DANIEL",
    question: "This prophet refused to stop praying to God even when it was against the law, and was thrown into a den of hungry lions-but God kept him safe! Who was he?",
    choices: ["Elijah", "Jonah", "Ezekiel", "Daniel"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "JONAH",
    question: "This prophet disobeyed God and was swallowed by a great fish, surviving inside it for three days before being spit onto dry land. Who was he?",
    choices: ["Noah", "Elijah", "Jonah", "Moses"],
    answer: 2
  },
  {
    part: "Ancient Prophets",
    prophet: "DAVID",
    question: "As a young shepherd boy, this future prophet and king defeated the giant warrior Goliath using only a sling and a small stone. Who was he?",
    choices: ["Solomon", "Saul", "David", "Gideon"],
    answer: 2
  },
  {
    part: "Ancient Prophets",
    prophet: "ELIJAH",
    question: "This prophet challenged 450 false priests to a contest on Mount Carmel and called down fire from heaven to prove that God is the true God. Who was he?",
    choices: ["Elisha", "Isaiah", "Samuel", "Elijah"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "SAMUEL",
    question: "This prophet is famous for anointing both Saul AND David to become kings of Israel. Who was he?",
    choices: ["Nathan", "Gad", "Eli", "Samuel"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "JEREMIAH",
    question: "Even though the people didn't want to hear his warnings, this prophet bravely told Jerusalem that their city would be destroyed if they didn't repent. Who was he?",
    choices: ["Amos", "Jeremiah", "Hosea", "Ezekiel"],
    answer: 1
  },
  {
    part: "Ancient Prophets",
    prophet: "EZEKIEL",
    question: "In an amazing vision, this prophet saw an entire valley of dry bones come back to life as a symbol of Israel being restored. Who was he?",
    choices: ["Isaiah", "Daniel", "Jeremiah", "Ezekiel"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "JOHN THE BAPTIST",
    question: "This prophet spent his life preparing people for Jesus Christ and had the incredible honor of baptizing Jesus in the Jordan River. Who was he?",
    choices: ["Peter", "James", "Paul", "John the Baptist"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "PETER",
    question: "After Jesus Christ ascended to heaven, this apostle led the early Christian church and performed many miracles, including healing a lame man at the temple gate. Who was he?",
    choices: ["James", "John", "Peter", "Paul"],
    answer: 2
  },
  {
    part: "Ancient Prophets",
    prophet: "PAUL",
    question: "This New Testament prophet went on three long missionary journeys and wrote so many letters that they became a large part of the New Testament. Who was he?",
    choices: ["Luke", "Mark", "Barnabas", "Paul"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "LEHI",
    question: "This Book of Mormon prophet was commanded by God to take his family and leave Jerusalem before it was destroyed, leading them on a long journey through the wilderness. Who was he?",
    choices: ["Mormon", "Alma", "Lehi", "Nephi"],
    answer: 2
  },
  {
    part: "Ancient Prophets",
    prophet: "NEPHI",
    question: "This Book of Mormon prophet built a ship by hand-following God's instructions-and sailed his entire family across the ocean to the promised land. Who was he?",
    choices: ["Sam", "Jacob", "Lehi", "Nephi"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "ALMA THE YOUNGER",
    question: "This Book of Mormon prophet was trying to destroy the Church until a powerful angel appeared to him, and he went on to become one of the greatest missionaries in Book of Mormon history. Who was he?",
    choices: ["Amulek", "Corianton", "Shiblon", "Alma the Younger"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "MORMON",
    question: "This Book of Mormon prophet spent many years carefully gathering, organizing, and writing down the records of his people-creating the book named after him. Who was he?",
    choices: ["Moroni", "Helaman", "Mormon", "Omni"],
    answer: 2
  },
  {
    part: "Ancient Prophets",
    prophet: "MORONI",
    question: "This Book of Mormon prophet buried golden plates in a hill called Cumorah so they would be safe until a future prophet could find and translate them. Who was he?",
    choices: ["Mormon", "Helaman", "Moroni", "Omni"],
    answer: 2
  },
  {
    part: "Ancient Prophets",
    prophet: "ENOS",
    question: "This Book of Mormon prophet prayed to God all day and all night long in the forest until he received a powerful forgiveness of his sins. Who was he?",
    choices: ["Omni", "Jarom", "Jacob", "Enos"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "ABINADI",
    question: "This Book of Mormon prophet bravely stood before wicked King Noah and his priests and testified of Jesus Christ, even knowing it might cost him his life. Who was he?",
    choices: ["Gideon", "Alma", "Zeezrom", "Abinadi"],
    answer: 3
  },
  {
    part: "Ancient Prophets",
    prophet: "HELAMAN",
    question: "This Book of Mormon prophet led an army of 2,000 young warriors-called the \"Stripling Warriors\"-who were protected by their great faith, and not one of them was killed. Who was he?",
    choices: ["Captain Moroni", "Teancum", "Pahoran", "Helaman"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "JOSEPH SMITH",
    question: "This prophet was visited by Heavenly Father and Jesus Christ in a grove of trees, and later translated the Book of Mormon from golden plates. Who was he?",
    choices: ["Brigham Young", "Oliver Cowdery", "John Taylor", "Joseph Smith"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "BRIGHAM YOUNG",
    question: "This prophet organized and led over 70,000 Latter-day Saints on a massive pioneer migration across the plains to the Salt Lake Valley. Who was he?",
    choices: ["John Taylor", "Heber C. Kimball", "Brigham Young", "Wilford Woodruff"],
    answer: 2
  },
  {
    part: "Modern Prophets",
    prophet: "JOHN TAYLOR",
    question: "This prophet was shot multiple times during the same attack that took Joseph Smith's life, but miraculously survived, later becoming the 3rd President of the Church. Who was he?",
    choices: ["Parley P. Pratt", "Wilford Woodruff", "Lorenzo Snow", "John Taylor"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "WILFORD WOODRUFF",
    question: "This prophet is known for performing baptisms for the dead on behalf of thousands of America's Founding Fathers-including George Washington-in the St. George Utah Temple. Who was he?",
    choices: ["Joseph F. Smith", "Heber J. Grant", "Lorenzo Snow", "Wilford Woodruff"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "LORENZO SNOW",
    question: "When this prophet arrived to speak in the struggling town of St. George, Utah, he received a revelation re-emphasizing tithing, which helped save the Church from serious financial trouble. Who was he?",
    choices: ["Joseph F. Smith", "Wilford Woodruff", "Lorenzo Snow", "George Albert Smith"],
    answer: 2
  },
  {
    part: "Modern Prophets",
    prophet: "JOSEPH F. SMITH",
    question: "Just one week before he died, this prophet received a powerful vision of the spirit world showing where the righteous go after death-now recorded as Doctrine & Covenants Section 138. Who was he?",
    choices: ["Heber J. Grant", "George Albert Smith", "David O. McKay", "Joseph F. Smith"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "HEBER J. GRANT",
    question: "Before becoming prophet, this man was one of the best baseball pitchers in all of Utah-and he later led the Church through both World War I and World War II. Who was he?",
    choices: ["David O. McKay", "George Albert Smith", "Heber J. Grant", "Joseph Fielding Smith"],
    answer: 2
  },
  {
    part: "Modern Prophets",
    prophet: "GEORGE ALBERT SMITH",
    question: "This prophet was famous for his great kindness and organized a major effort to ship food, clothing, and supplies to people in Europe who were suffering after World War II. Who was he?",
    choices: ["David O. McKay", "George Albert Smith", "Harold B. Lee", "Spencer W. Kimball"],
    answer: 1
  },
  {
    part: "Modern Prophets",
    prophet: "DAVID O. McKAY",
    question: "This prophet was the first LDS prophet to travel around the entire world visiting Church members in different countries. Who was he?",
    choices: ["Harold B. Lee", "Joseph Fielding Smith", "Spencer W. Kimball", "David O. McKay"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "JOSEPH FIELDING SMITH",
    question: "This prophet wrote more books about Church history and doctrine than almost anyone else, authoring over 25 books during his lifetime! Who was he?",
    choices: ["Harold B. Lee", "Gordon B. Hinckley", "Ezra Taft Benson", "Joseph Fielding Smith"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "HAROLD B. LEE",
    question: "This prophet is called the \"Father of the Welfare Program\" because he created the Church's system to help poor and struggling members during the Great Depression. Who was he?",
    choices: ["Spencer W. Kimball", "Harold B. Lee", "Ezra Taft Benson", "David O. McKay"],
    answer: 1
  },
  {
    part: "Modern Prophets",
    prophet: "SPENCER W. KIMBALL",
    question: "This prophet received a revelation in 1978 that extended the priesthood to all worthy male members, regardless of their race or background. Who was he?",
    choices: ["Harold B. Lee", "Ezra Taft Benson", "Howard W. Hunter", "Spencer W. Kimball"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "EZRA TAFT BENSON",
    question: "Before becoming prophet, this man served as the United States Secretary of Agriculture under President Eisenhower-one of the most important government jobs in America. Who was he?",
    choices: ["Gordon B. Hinckley", "Howard W. Hunter", "Thomas S. Monson", "Ezra Taft Benson"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "HOWARD W. HUNTER",
    question: "This prophet invited all members of the Church to attend the temple as often as possible and make it a \"great symbol of their membership.\" Who was he?",
    choices: ["Gordon B. Hinckley", "Thomas S. Monson", "Howard W. Hunter", "Russell M. Nelson"],
    answer: 2
  },
  {
    part: "Modern Prophets",
    prophet: "GORDON B. HINCKLEY",
    question: "This prophet built more temples than any other prophet in Church history, with over 75 temples dedicated during his time as President. Who was he?",
    choices: ["Thomas S. Monson", "Howard W. Hunter", "Spencer W. Kimball", "Gordon B. Hinckley"],
    answer: 3
  },
  {
    part: "Modern Prophets",
    prophet: "THOMAS S. MONSON",
    question: "This prophet was known his entire life for visiting widows and people in need, and he also dedicated the first LDS temple ever built behind the \"Iron Curtain\" in Freiberg, Germany. Who was he?",
    choices: ["Gordon B. Hinckley", "Russell M. Nelson", "Thomas S. Monson", "Howard W. Hunter"],
    answer: 2
  },
  {
    part: "Modern Prophets",
    prophet: "RUSSELL M. NELSON",
    question: "Before becoming prophet, this man was a world-famous heart surgeon who helped develop some of the earliest heart surgery techniques-and he is also the oldest person ever to serve as President of the Church. Who was he?",
    choices: ["Thomas S. Monson", "Gordon B. Hinckley", "Dieter F. Uchtdorf", "Russell M. Nelson"],
    answer: 3
  }
];

const LETTERS = ["A", "B", "C", "D"];
const TEAM_NAMES = ["Blue Team", "Gold Team", "Green Team", "Red Team"];

const state = {
  mode: "host",
  order: [],
  current: 0,
  choicesVisible: false,
  revealed: false,
  teams: [],
  teamAnswers: {},
  hostMarks: {},
  revealedQuestions: {},
  scoredQuestions: {}
};

const setupView = document.querySelector("#setupView");
const gameView = document.querySelector("#gameView");
const setupForm = document.querySelector("#setupForm");
const roundLabel = document.querySelector("#roundLabel");
const partLabel = document.querySelector("#partLabel");
const questionText = document.querySelector("#questionText");
const choices = document.querySelector("#choices");
const scoreboard = document.querySelector("#scoreboard");
const hostPanel = document.querySelector("#hostPanel");
const teamEntryPanel = document.querySelector("#teamEntryPanel");
const revealButton = document.querySelector("#revealButton");
const nextButton = document.querySelector("#nextButton");
const prevButton = document.querySelector("#prevButton");
const resetButton = document.querySelector("#resetButton");

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(setupForm);
  const teamCount = Number(formData.get("teamCount"));
  state.mode = formData.get("mode");
  const orderMode = formData.get("order");
  state.order = QUESTIONS.map((_, index) => index);
  if (orderMode === "shuffle") shuffle(state.order);
  state.current = 0;
  state.choicesVisible = false;
  state.revealed = false;
  state.teamAnswers = {};
  state.hostMarks = {};
  state.revealedQuestions = {};
  state.scoredQuestions = {};
  state.teams = TEAM_NAMES.slice(0, teamCount).map((name, index) => ({ id: index, name, score: 0 }));
  setupView.classList.add("hidden");
  gameView.classList.remove("hidden");
  render();
});

revealButton.addEventListener("click", () => {
  if (!state.choicesVisible) {
    state.choicesVisible = true;
    render();
    return;
  }
  state.revealed = true;
  state.revealedQuestions[getQuestionId()] = true;
  if (state.mode === "teams") scoreTeamEntries();
  render();
});

nextButton.addEventListener("click", () => {
  if (state.current < state.order.length - 1) {
    state.current += 1;
    state.choicesVisible = Boolean(state.revealedQuestions[getQuestionId()]);
    state.revealed = Boolean(state.revealedQuestions[getQuestionId()]);
    render();
  }
});

prevButton.addEventListener("click", () => {
  if (state.current > 0) {
    state.current -= 1;
    state.choicesVisible = Boolean(state.revealedQuestions[getQuestionId()]);
    state.revealed = Boolean(state.revealedQuestions[getQuestionId()]);
    render();
  }
});

resetButton.addEventListener("click", () => {
  gameView.classList.add("hidden");
  setupView.classList.remove("hidden");
});

function render() {
  const question = getCurrentQuestion();
  roundLabel.textContent = `Question ${state.current + 1} of ${state.order.length}`;
  partLabel.textContent = question.part;
  questionText.textContent = question.question;
  revealButton.textContent = state.revealed ? "Answer Revealed" : state.choicesVisible ? "Reveal Answer" : "Show Choices";
  revealButton.disabled = state.revealed;
  prevButton.disabled = state.current === 0;
  nextButton.disabled = state.current === state.order.length - 1;
  renderChoices(question);
  renderScoreboard();
  renderModePanel(question);
}

function renderChoices(question) {
  choices.innerHTML = "";
  choices.classList.toggle("hidden", !state.choicesVisible);
  question.choices.forEach((choice, index) => {
    const node = document.createElement("div");
    node.className = "choice";
    if (state.revealed && index === question.answer) node.classList.add("correct");
    node.innerHTML = `<span class="letter">${LETTERS[index]}</span><span>${choice}</span>`;
    choices.append(node);
  });
}

function renderScoreboard() {
  scoreboard.innerHTML = "";
  state.teams.forEach((team) => {
    const card = document.createElement("article");
    card.className = "score-card";
    card.innerHTML = `
      <h3>${team.name}</h3>
      <strong>${team.score}</strong>
      <div class="score-tools">
        <button class="score-button" type="button" data-score="${team.id}" data-delta="1">+1</button>
        <button class="score-button minus" type="button" data-score="${team.id}" data-delta="-1">-1</button>
      </div>
    `;
    scoreboard.append(card);
  });

  scoreboard.querySelectorAll("[data-score]").forEach((button) => {
    button.addEventListener("click", () => {
      const team = state.teams.find((item) => item.id === Number(button.dataset.score));
      team.score += Number(button.dataset.delta);
      renderScoreboard();
    });
  });
}

function renderModePanel(question) {
  if (!state.choicesVisible) {
    hostPanel.classList.add("hidden");
    teamEntryPanel.classList.add("hidden");
    return;
  }
  if (state.mode === "host") {
    teamEntryPanel.classList.add("hidden");
    hostPanel.classList.remove("hidden");
    renderHostPanel();
  } else {
    hostPanel.classList.add("hidden");
    teamEntryPanel.classList.remove("hidden");
    renderTeamEntryPanel(question);
  }
}

function renderHostPanel() {
  const questionId = getQuestionId();
  hostPanel.innerHTML = `<div class="host-grid"></div>`;
  const grid = hostPanel.querySelector(".host-grid");
  state.teams.forEach((team) => {
    const mark = state.hostMarks[questionId]?.[team.id];
    const box = document.createElement("div");
    box.className = "host-box";
    box.innerHTML = `
      <h3>${team.name}</h3>
      <div class="host-actions">
        <button class="mark-correct" type="button" data-host="${team.id}" data-mark="correct" ${mark ? "disabled" : ""}>Correct</button>
        <button class="mark-wrong" type="button" data-host="${team.id}" data-mark="wrong" ${mark ? "disabled" : ""}>Wrong</button>
      </div>
    `;
    grid.append(box);
  });
  hostPanel.querySelectorAll("[data-host]").forEach((button) => {
    button.addEventListener("click", () => {
      const questionId = getQuestionId();
      if (!state.hostMarks[questionId]) state.hostMarks[questionId] = {};
      if (state.hostMarks[questionId][button.dataset.host]) return;
      const team = state.teams.find((item) => item.id === Number(button.dataset.host));
      if (button.dataset.mark === "correct") team.score += 1;
      state.hostMarks[questionId][button.dataset.host] = button.dataset.mark;
      renderScoreboard();
      renderHostPanel();
    });
  });
}

function renderTeamEntryPanel(question) {
  const questionId = getQuestionId();
  teamEntryPanel.innerHTML = `<div class="team-entry-grid"></div>`;
  const grid = teamEntryPanel.querySelector(".team-entry-grid");
  state.teams.forEach((team) => {
    const selected = state.teamAnswers[questionId]?.[team.id];
    const box = document.createElement("div");
    box.className = "team-box";
    box.innerHTML = `
      <h3>${team.name}</h3>
      <div class="answer-buttons">
        ${LETTERS.map((letter, index) => {
          const classes = ["answer-button"];
          if (selected === index) classes.push("selected");
          if (state.revealed && selected === index && index === question.answer) classes.push("correct-pick");
          if (state.revealed && selected === index && index !== question.answer) classes.push("wrong-pick");
          return `<button class="${classes.join(" ")}" type="button" data-team="${team.id}" data-answer="${index}" ${state.revealed ? "disabled" : ""}>${letter}</button>`;
        }).join("")}
      </div>
    `;
    grid.append(box);
  });

  teamEntryPanel.querySelectorAll("[data-team]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.teamAnswers[questionId]) state.teamAnswers[questionId] = {};
      state.teamAnswers[questionId][button.dataset.team] = Number(button.dataset.answer);
      renderTeamEntryPanel(question);
    });
  });
}

function scoreTeamEntries() {
  const questionId = getQuestionId();
  if (state.scoredQuestions[questionId]) return;
  const question = getCurrentQuestion();
  const answers = state.teamAnswers[questionId] || {};
  state.teams.forEach((team) => {
    if (answers[team.id] === question.answer) team.score += 1;
  });
  state.scoredQuestions[questionId] = true;
}

function getCurrentQuestion() {
  return QUESTIONS[state.order[state.current]];
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
