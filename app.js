const STORAGE_KEY = "xenta-sales-trainer-progress-v1";

if (!window.SALES_TRAINER_DATA) {
  throw new Error("训练数据未加载，无法启动页面。");
}

const data = window.SALES_TRAINER_DATA;
const questionMap = new Map(data.questions.map((item) => [item.id, item]));

const state = {
  mode: "adaptive",
  currentQuestion: null,
  currentAnswered: false,
  progress: loadProgress(),
  session: { total: 0, correct: 0, wrong: 0 },
  retryQueue: [],
  view: "train",
};

const elements = {
  heroSummaryProjects: document.getElementById("heroSummaryProjects"),
  heroSummaryAssays: document.getElementById("heroSummaryAssays"),
  heroSummaryCompetitors: document.getElementById("heroSummaryCompetitors"),
  modeButtons: document.getElementById("modeButtons"),
  currentModeLabel: document.getElementById("currentModeLabel"),
  kindFilter: document.getElementById("kindFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  tagFilter: document.getElementById("tagFilter"),
  nextQuestionBtn: document.getElementById("nextQuestionBtn"),
  resetSessionBtn: document.getElementById("resetSessionBtn"),
  quickStats: document.getElementById("quickStats"),
  retryQueue: document.getElementById("retryQueue"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  questionCategory: document.getElementById("questionCategory"),
  questionKind: document.getElementById("questionKind"),
  questionTags: document.getElementById("questionTags"),
  questionPrompt: document.getElementById("questionPrompt"),
  questionSource: document.getElementById("questionSource"),
  answerArea: document.getElementById("answerArea"),
  submitAnswerBtn: document.getElementById("submitAnswerBtn"),
  revealAnswerBtn: document.getElementById("revealAnswerBtn"),
  feedbackBox: document.getElementById("feedbackBox"),
  librarySearch: document.getElementById("librarySearch"),
  librarySection: document.getElementById("librarySection"),
  knowledgeCards: document.getElementById("knowledgeCards"),
  summaryCards: document.getElementById("summaryCards"),
  categoryStats: document.getElementById("categoryStats"),
  weakQuestions: document.getElementById("weakQuestions"),
  exportProgressBtn: document.getElementById("exportProgressBtn"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
  views: {
    train: document.getElementById("trainView"),
    knowledge: document.getElementById("knowledgeView"),
    stats: document.getElementById("statsView"),
  },
};

init();

function init() {
  renderHeroSummary();
  buildModeButtons();
  buildFilters();
  buildLibrarySections();
  bindEvents();
  renderQuickStats();
  renderRetryQueue();
  renderKnowledge();
  renderStats();
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { questions: {}, history: [], updatedAt: null };
  } catch (error) {
    return { questions: {}, history: [], updatedAt: null };
  }
}

function saveProgress() {
  state.progress.updatedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  } catch (error) {
    // Browser storage may be unavailable on some file:// origins.
  }
}

function getStat(questionId) {
  if (!state.progress.questions[questionId]) {
    state.progress.questions[questionId] = {
      seen: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      box: 0,
      lastSeenAt: 0,
      lastResult: null,
      lastAnswer: "",
    };
  }
  return state.progress.questions[questionId];
}

function renderHeroSummary() {
  elements.heroSummaryProjects.textContent = `已转产 ${data.summary.transferredCount} / 即将转产 ${data.summary.soonCount}`;
  elements.heroSummaryAssays.textContent = `指标 ${data.summary.assayCount} / CE ${data.summary.ceCount}`;
  elements.heroSummaryCompetitors.textContent = `竞品 ${data.summary.competitorCount} 组`;
}

function buildModeButtons() {
  elements.modeButtons.innerHTML = "";
  data.ui.modes.forEach((mode) => {
    const button = document.createElement("button");
    button.className = `mode-btn${state.mode === mode.key ? " is-active" : ""}`;
    button.textContent = mode.label;
    button.addEventListener("click", () => setMode(mode.key));
    elements.modeButtons.appendChild(button);
  });
  const modeMeta = data.ui.modes.find((item) => item.key === state.mode);
  elements.currentModeLabel.textContent = modeMeta ? modeMeta.label : state.mode;
}

function setMode(mode) {
  state.mode = mode;
  buildModeButtons();
  renderQuickStats();
}

function buildFilters() {
  elements.categoryFilter.innerHTML = '<option value="all">全部模块</option>';
  data.ui.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categoryFilter.appendChild(option);
  });

  elements.tagFilter.innerHTML = '<option value="all">全部标签</option>';
  data.ui.tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    elements.tagFilter.appendChild(option);
  });
}

function buildLibrarySections() {
  elements.librarySection.innerHTML = "";
  data.ui.knowledgeSections.forEach((section) => {
    const option = document.createElement("option");
    option.value = section.key;
    option.textContent = section.label;
    elements.librarySection.appendChild(option);
  });
}

function bindEvents() {
  elements.nextQuestionBtn.addEventListener("click", nextQuestion);
  elements.resetSessionBtn.addEventListener("click", () => {
    state.session = { total: 0, correct: 0, wrong: 0 };
    renderQuickStats();
  });
  elements.submitAnswerBtn.addEventListener("click", submitCurrentAnswer);
  elements.revealAnswerBtn.addEventListener("click", revealAnswer);
  elements.librarySearch.addEventListener("input", renderKnowledge);
  elements.librarySection.addEventListener("change", renderKnowledge);
  elements.exportProgressBtn.addEventListener("click", exportProgress);
  elements.resetProgressBtn.addEventListener("click", resetAllProgress);
  elements.kindFilter.addEventListener("change", renderQuickStats);
  elements.categoryFilter.addEventListener("change", renderQuickStats);
  elements.tagFilter.addEventListener("change", renderQuickStats);

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setView(tab.dataset.view));
  });
}

function setView(view) {
  state.view = view;
  elements.tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === view);
  });
  Object.entries(elements.views).forEach(([key, node]) => {
    node.classList.toggle("is-active", key === view);
  });
  if (view === "knowledge") {
    renderKnowledge();
  }
  if (view === "stats") {
    renderStats();
  }
}

function buildPool() {
  const kind = elements.kindFilter.value;
  const category = elements.categoryFilter.value;
  const tag = elements.tagFilter.value;

  return data.questions.filter((question) => {
    if (kind !== "all" && question.kind !== kind) {
      return false;
    }
    if (category !== "all" && question.category !== category) {
      return false;
    }
    if (tag !== "all" && !question.tags.includes(tag)) {
      return false;
    }
    if (state.mode === "mistakes" && getStat(question.id).wrong === 0) {
      return false;
    }
    if (state.mode === "sales" && !question.tags.includes("销售")) {
      return false;
    }
    return true;
  });
}

function nextQuestion() {
  const pool = buildPool();
  if (!pool.length) {
    renderQuestionEmpty("当前筛选条件下没有可出的题。请放宽条件再试。");
    return;
  }

  const retryQuestion = pullRetryQuestion(pool);
  state.currentQuestion = retryQuestion || pickQuestion(pool);
  state.currentAnswered = false;
  renderQuestion();
}

function pullRetryQuestion(pool) {
  if (!state.retryQueue.length || state.mode === "exam") {
    return null;
  }
  const nextRetryId = state.retryQueue.find((id) => pool.some((question) => question.id === id));
  if (!nextRetryId) {
    return null;
  }
  if (state.mode === "mistakes" || state.mode === "sales" || Math.random() < 0.45) {
    state.retryQueue = state.retryQueue.filter((id) => id !== nextRetryId);
    renderRetryQueue();
    return questionMap.get(nextRetryId) || null;
  }
  return null;
}

function pickQuestion(pool) {
  if (state.mode === "exam") {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const weighted = pool.map((question) => {
    const stat = getStat(question.id);
    const unseen = stat.seen === 0 ? 6 : 1;
    const weak = 1 + Math.max(0, 5 - stat.box);
    const wrong = 1 + stat.wrong * 1.4;
    const recent = Date.now() - stat.lastSeenAt < 120000 ? 0.28 : 1;
    return { question, weight: unseen * weak * wrong * recent };
  });

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.question;
    }
  }
  return weighted[weighted.length - 1].question;
}

function renderQuestionEmpty(message) {
  state.currentQuestion = null;
  state.currentAnswered = false;
  elements.questionCategory.textContent = "等待开始";
  elements.questionKind.textContent = "";
  elements.questionTags.innerHTML = "";
  elements.questionPrompt.textContent = message;
  elements.questionSource.textContent = "";
  elements.answerArea.innerHTML = "";
  elements.feedbackBox.className = "feedback hidden";
  elements.feedbackBox.innerHTML = "";
}

function renderQuestion() {
  const question = state.currentQuestion;
  if (!question) {
    renderQuestionEmpty("点击左侧“开始 / 下一题”，进入训练。");
    return;
  }

  const stat = getStat(question.id);
  elements.questionCategory.textContent = question.category;
  elements.questionKind.textContent = kindLabel(question.kind);
  elements.questionTags.innerHTML = "";

  question.tags.slice(0, 4).forEach((tag) => {
    const span = document.createElement("span");
    span.className = "mini-badge";
    span.textContent = tag;
    elements.questionTags.appendChild(span);
  });
  const mastery = document.createElement("span");
  mastery.className = "mini-badge";
  mastery.textContent = `熟练箱 ${stat.box}`;
  elements.questionTags.appendChild(mastery);

  elements.questionPrompt.innerHTML = question.prompt.replace(/`([^`]+)`/g, '<span class="code">$1</span>');
  elements.questionSource.textContent = `来源：${question.source}`;
  elements.feedbackBox.className = "feedback hidden";
  elements.feedbackBox.innerHTML = "";

  if (question.kind === "choice") {
    renderChoiceArea(question);
  } else {
    renderTextArea(question);
  }
}

function renderChoiceArea(question) {
  const grid = document.createElement("div");
  grid.className = "choice-grid";
  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "choice-btn";
    button.innerHTML = escapeHtml(choice);
    button.addEventListener("click", () => submitChoice(index));
    grid.appendChild(button);
  });
  elements.answerArea.innerHTML = "";
  elements.answerArea.appendChild(grid);
}

function renderTextArea(question) {
  const field = document.createElement("label");
  field.className = "field";
  const label = document.createElement("span");
  label.textContent = "你的回答";
  const input = question.kind === "keyword" ? document.createElement("textarea") : document.createElement("input");
  input.id = "answerInput";
  input.placeholder = question.inputPlaceholder || "请输入答案";
  if (question.kind === "keyword") {
    input.rows = 6;
  }
  field.appendChild(label);
  field.appendChild(input);
  elements.answerArea.innerHTML = "";
  elements.answerArea.appendChild(field);
}

function submitCurrentAnswer() {
  if (!state.currentQuestion || state.currentAnswered) {
    return;
  }
  if (state.currentQuestion.kind === "choice") {
    return;
  }

  const input = document.getElementById("answerInput");
  const value = input ? input.value.trim() : "";
  if (!value) {
    showFeedback(false, state.currentQuestion.answerLabel, state.currentQuestion.explanation, "还没有输入答案。");
    return;
  }

  const result = evaluate(state.currentQuestion, value);
  finalizeAnswer(value, result);
}

function submitChoice(index) {
  if (!state.currentQuestion || state.currentAnswered) {
    return;
  }

  const question = state.currentQuestion;
  const correct = index === question.correctIndex;
  finalizeAnswer(question.choices[index], {
    correct,
    answerLabel: question.answerLabel,
    explanation: question.explanation,
    details: correct ? "选择正确。" : `正确选项：${question.choices[question.correctIndex]}`,
    choiceIndex: index,
  });
}

function revealAnswer() {
  if (!state.currentQuestion || state.currentAnswered) {
    return;
  }
  finalizeAnswer("", {
    correct: false,
    answerLabel: state.currentQuestion.answerLabel,
    explanation: state.currentQuestion.explanation,
    details: "本题已按答错处理，并加入待复训。",
  });
}

function evaluate(question, rawAnswer) {
  if (question.kind === "text") {
    const value = normalizeText(rawAnswer);
    const accepted = question.accepted.map(normalizeText);
    const correct = accepted.some((item) => item === value);
    return {
      correct,
      answerLabel: question.answerLabel,
      explanation: question.explanation,
      details: correct ? "答案匹配成功。" : "文本答案未完全匹配标准答案。",
    };
  }

  if (question.kind === "keyword") {
    const value = normalizeText(rawAnswer);
    const hits = question.keywordGroups.map((group) =>
      group.some((keyword) => value.includes(normalizeText(keyword)))
    );
    const hitCount = hits.filter(Boolean).length;
    return {
      correct: hitCount >= question.minGroups,
      answerLabel: question.answerLabel,
      explanation: question.explanation,
      details: `命中关键词组 ${hitCount} / ${question.keywordGroups.length}，判定阈值 ${question.minGroups}。`,
    };
  }

  return {
    correct: false,
    answerLabel: question.answerLabel,
    explanation: question.explanation,
    details: "未知题型。",
  };
}

function finalizeAnswer(rawAnswer, result) {
  const question = state.currentQuestion;
  const stat = getStat(question.id);

  state.currentAnswered = true;
  stat.seen += 1;
  stat.lastSeenAt = Date.now();
  stat.lastResult = result.correct;
  stat.lastAnswer = rawAnswer;

  if (result.correct) {
    stat.correct += 1;
    stat.streak += 1;
    stat.box = Math.min(5, stat.box + 1);
    state.session.correct += 1;
  } else {
    stat.wrong += 1;
    stat.streak = 0;
    stat.box = Math.max(0, stat.box - 2);
    state.session.wrong += 1;
    if (!state.retryQueue.includes(question.id)) {
      state.retryQueue.push(question.id);
    }
  }
  state.session.total += 1;

  state.progress.history.push({
    questionId: question.id,
    correct: result.correct,
    at: Date.now(),
  });
  if (state.progress.history.length > 300) {
    state.progress.history = state.progress.history.slice(-300);
  }

  saveProgress();
  renderQuickStats();
  renderRetryQueue();
  renderStats();
  markChoiceButtons(question, result);
  showFeedback(result.correct, result.answerLabel, result.explanation, result.details, true);
}

function markChoiceButtons(question, result) {
  if (question.kind !== "choice") {
    return;
  }
  const buttons = Array.from(elements.answerArea.querySelectorAll(".choice-btn"));
  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === question.correctIndex) {
      button.classList.add("correct");
    }
    if (typeof result.choiceIndex === "number" && index === result.choiceIndex && index !== question.correctIndex) {
      button.classList.add("wrong");
    }
  });
}

function showFeedback(correct, answerLabel, explanation, details, withNextButton = false) {
  elements.feedbackBox.className = `feedback ${correct ? "good" : "bad"}`;
  elements.feedbackBox.innerHTML = `
    <p class="feedback-title">${correct ? "回答正确" : "需要再练"}</p>
    <p><strong>标准答案：</strong>${escapeHtml(answerLabel)}</p>
    <p><strong>纠正说明：</strong>${escapeHtml(explanation)}</p>
    <p><strong>判定详情：</strong>${escapeHtml(details || "无")}</p>
  `;
  if (withNextButton) {
    const row = document.createElement("div");
    row.className = "question-actions";
    const button = document.createElement("button");
    button.className = "primary";
    button.textContent = "下一题";
    button.addEventListener("click", nextQuestion);
    row.appendChild(button);
    elements.feedbackBox.appendChild(row);
  }
}

function renderQuickStats() {
  const answered = Object.values(state.progress.questions).filter((item) => item.seen > 0);
  const correct = answered.reduce((sum, item) => sum + item.correct, 0);
  const wrong = answered.reduce((sum, item) => sum + item.wrong, 0);
  const attempts = correct + wrong;
  const accuracy = attempts ? `${Math.round((correct / attempts) * 100)}%` : "-";
  const weakCount = answered.filter((item) => item.wrong > item.correct || item.box <= 1).length;

  const cards = [
    { label: "本次答题", value: state.session.total || 0 },
    { label: "本次正确", value: state.session.correct || 0 },
    { label: "累计正确率", value: accuracy },
    { label: "待复训题", value: state.retryQueue.length || 0 },
    { label: "已做题数", value: answered.length || 0 },
    { label: "薄弱题数", value: weakCount || 0 },
  ];

  elements.quickStats.innerHTML = cards
    .map(
      (item) => `
        <div class="stat-card">
          <span class="label">${item.label}</span>
          <span class="value">${item.value}</span>
        </div>
      `
    )
    .join("");
}

function renderRetryQueue() {
  if (!state.retryQueue.length) {
    elements.retryQueue.className = "queue-list empty";
    elements.retryQueue.textContent = "当前没有待复训题。";
    return;
  }

  elements.retryQueue.className = "queue-list";
  elements.retryQueue.innerHTML = state.retryQueue
    .slice(0, 10)
    .map((id) => {
      const question = questionMap.get(id);
      return question
        ? `<div class="queue-item"><strong>${escapeHtml(question.category)}</strong><br>${escapeHtml(stripPrompt(question.prompt))}</div>`
        : "";
    })
    .join("");
}

function renderKnowledge() {
  const section = elements.librarySection.value || "assays";
  const query = normalizeText(elements.librarySearch.value);
  let cards = [];

  if (section === "assays") {
    cards = data.sections.assays.map((item) => ({
      title: `${item.code} · ${item.name}`,
      body: [
        `英文：${item.en}`,
        `分组：${item.group}`,
        `状态：${item.status}`,
        `机理：${item.mechanism}`,
        `用途：${item.use}`,
      ],
      tags: [item.status, item.group, item.ce ? "CE" : "非CE"],
    }));
  } else if (section === "projects") {
    cards = data.sections.mainProjects.map((item) => ({
      title: `${item.code} · ${item.name}`,
      body: [`状态：${item.status}`],
      tags: [item.status],
    }));
  } else if (section === "competitors") {
    cards = data.sections.competitors.map((item) => ({
      title: item.name,
      facts: [
        ["分段", item.segment],
        ["关联代理商", item.localDistributor],
        ["厂家 / 国家", item.maker],
        ["证据等级", item.evidenceLevel],
        ["定位", item.style],
        ["方法学 / 形态", item.form],
        ["温控口径", item.temp],
        ["全血 / 样本口径", item.wholeBlood],
        ["样本类型", item.sampleType],
        ["检测时间", item.tat],
        ["样本量", item.sampleVolume],
        ["校准 / 质控", item.calibration],
        ["液路 / 结构", item.fluidics],
        ["通道", item.channels],
        ["通道独立性", item.independence],
        ["体积 / 重量", item.sizeWeight],
        ["CV / 线性口径", item.quality],
        ["国际竞争力", item.competitiveness],
        ["典型医院 / 场景", item.hospitalScenes],
        ["公开特点", item.public],
        ["更适合的客户 / 场景", item.fit],
        ["可攻点 / 互补位", item.attack],
        ["销售切入", item.pitch],
        ["现场必须问", item.fieldQuestions],
        ["不要这样说", item.doNotSay],
        ["一句话记忆", item.memory],
        ["资料口径", item.sourceNote],
      ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== ""),
      tags: [item.segment, "竞品"],
    }));
  } else if (section === "features") {
    cards = data.sections.xlabFeatures.map((item) => ({
      title: item.title,
      body: [item.body],
      tags: ["平台卖点"],
    }));
  } else if (section === "sales") {
    cards = [
      ...data.sections.playbook.map((item) => ({
        title: item.title,
        body: [item.body],
        tags: ["话术"],
      })),
      ...data.sections.openingQuestions.map((item, index) => ({
        title: `追问 ${index + 1}`,
        body: [item],
        tags: ["提问"],
      })),
      ...data.sections.memoryOrder.map((item, index) => ({
        title: `Day ${index + 1}`,
        body: [item],
        tags: ["学习路径"],
      })),
    ];
  } else if (section === "rules") {
    cards = [
      ...data.sections.redLines.map((item, index) => ({
        title: `红线 ${index + 1}`,
        body: [item],
        tags: ["红线"],
      })),
      ...data.sections.contract.map((item) => ({
        title: item.title,
        body: [item.body],
        tags: ["合同"],
      })),
      ...data.sections.pricingAnchors.map((item) => ({
        title: item.label,
        body: [`价格：${item.value}`, `说明：${item.note}`],
        tags: ["价格"],
      })),
    ];
  }

  const filtered = cards.filter((card) => {
    if (!query) {
      return true;
    }
    const bodyText = (card.body || []).join(" ");
    const factText = (card.facts || []).map(([label, value]) => `${label} ${value}`).join(" ");
    return normalizeText(`${card.title} ${bodyText} ${factText} ${card.tags.join(" ")}`).includes(query);
  });

  elements.knowledgeCards.innerHTML = filtered.length
    ? filtered
        .map(
          (card) => `
            <article class="knowledge-card">
              <div class="knowledge-meta">
                ${card.tags.map((tag) => `<span class="mini-badge">${escapeHtml(tag)}</span>`).join("")}
              </div>
              <h3>${escapeHtml(card.title)}</h3>
              ${
                (card.facts || []).length
                  ? `<div class="fact-list">${card.facts
                      .map(
                        ([label, value]) => `
                          <div class="fact-row">
                            <span class="fact-term">${escapeHtml(label)}</span>
                            <span class="fact-value">${escapeHtml(value)}</span>
                          </div>
                        `
                      )
                      .join("")}</div>`
                  : ""
              }
              ${(card.body || []).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
            </article>
          `
        )
        .join("")
    : '<div class="empty">没有匹配到结果，请换个关键词或分区。</div>';
}

function renderStats() {
  const stats = Object.values(state.progress.questions);
  const answered = stats.filter((item) => item.seen > 0);
  const correct = answered.reduce((sum, item) => sum + item.correct, 0);
  const wrong = answered.reduce((sum, item) => sum + item.wrong, 0);
  const attempts = correct + wrong;
  const accuracy = attempts ? `${Math.round((correct / attempts) * 100)}%` : "-";
  const avgBox = answered.length
    ? (answered.reduce((sum, item) => sum + item.box, 0) / answered.length).toFixed(1)
    : "0.0";
  const strong = answered.filter((item) => item.box >= 4).length;

  elements.summaryCards.innerHTML = [
    { label: "累计作答次数", value: attempts || 0 },
    { label: "累计正确率", value: accuracy },
    { label: "平均熟练箱", value: avgBox },
    { label: "高熟练题数", value: strong || 0 },
  ]
    .map(
      (item) => `
        <div class="summary-card">
          <span class="label">${item.label}</span>
          <span class="value">${item.value}</span>
        </div>
      `
    )
    .join("");

  elements.categoryStats.innerHTML = data.ui.categories
    .map((category) => {
      const questions = data.questions.filter((item) => item.category === category);
      const values = questions.map((item) => getStat(item.id));
      const seen = values.filter((item) => item.seen > 0).length;
      const c = values.reduce((sum, item) => sum + item.correct, 0);
      const w = values.reduce((sum, item) => sum + item.wrong, 0);
      const total = c + w;
      const categoryAccuracy = total ? Math.round((c / total) * 100) : 0;
      const progress = questions.length ? Math.round((seen / questions.length) * 100) : 0;
      return `
        <div class="category-row">
          <div class="category-head">
            <strong>${escapeHtml(category)}</strong>
            <span>${seen}/${questions.length} 题已做 · 正确率 ${categoryAccuracy}%</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${progress}%"></div></div>
        </div>
      `;
    })
    .join("");

  const weak = data.questions
    .map((question) => {
      const stat = getStat(question.id);
      return {
        question,
        stat,
        score: stat.wrong * 4 + Math.max(0, 4 - stat.box) - stat.correct,
      };
    })
    .filter((item) => item.stat.seen > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 12);

  if (!weak.length) {
    elements.weakQuestions.className = "weak-list empty";
    elements.weakQuestions.textContent = "还没有薄弱题数据。";
    return;
  }

  elements.weakQuestions.className = "weak-list";
  elements.weakQuestions.innerHTML = weak
    .map(
      (item) => `
        <div class="weak-item">
          <strong>${escapeHtml(item.question.category)}</strong><br>
          ${escapeHtml(stripPrompt(item.question.prompt))}<br>
          <span class="muted">做过 ${item.stat.seen} 次 · 对 ${item.stat.correct} · 错 ${item.stat.wrong} · 熟练箱 ${item.stat.box}</span>
        </div>
      `
    )
    .join("");
}

function exportProgress() {
  const blob = new Blob([JSON.stringify(state.progress, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sales-trainer-progress.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function resetAllProgress() {
  if (!window.confirm("这会清空全部本地训练记录，是否继续？")) {
    return;
  }
  state.progress = { questions: {}, history: [], updatedAt: null };
  state.retryQueue = [];
  state.session = { total: 0, correct: 0, wrong: 0 };
  saveProgress();
  renderQuickStats();
  renderRetryQueue();
  renderStats();
  renderQuestionEmpty("训练记录已清空。点击“开始 / 下一题”重新开始。");
}

function kindLabel(kind) {
  if (kind === "choice") return "选择题";
  if (kind === "text") return "文本题";
  if (kind === "keyword") return "模拟问答";
  return kind;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function stripPrompt(prompt) {
  return prompt.replace(/`/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
