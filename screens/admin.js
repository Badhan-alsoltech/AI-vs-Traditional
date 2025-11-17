// =========================
// Admin Dashboard — Updated
// =========================

// === Updated Question Sets ===
const QUESTIONS = {
  awareness: [
    "The AI-designed mug appears to be visually creative and modern.",
    "The human-designed mug appears to be more authentic and handcrafted.",
    "I believe AI can produce product designs that are equally appealing as human designs.",
    "I trust that the human-designed mug has higher craftsmanship quality.",
    "I feel comfortable purchasing a product designed entirely by AI.",
    "I find AI-generated designs innovative and interesting.",
    "The human-designed mug looks more emotionally appealing to me.",
    "I believe AI design lacks emotional touch compared to human creativity."
  ],

  prague_wtp: [
    "Are you willing to pay the same price for the AI-designed mug as for the human-designed mug?",
    "Are you willing to pay more for the AI-designed mug if it offers innovative features?",
    "Would you only purchase the AI-designed mug if it is competitively priced compared to the human-designed mug?",
    "Would you pay more for the AI-designed mug if it demonstrates superior quality during use?"
  ],

  newyork_wtp: [
    "Are you willing to pay the same price for the AI-designed mug as for the human-designed mug?",
    "Are you willing to pay more for the AI-designed mug if it offers innovative features?",
    "Would you only purchase the AI-designed mug if it is competitively priced compared to the human-designed mug?",
    "Would you pay more for the AI-designed mug if it demonstrates superior quality during use?"
  ]
};

let aggregatedData = null;
let submissions = [];

// =========================
// LOAD DASHBOARD DATA
// =========================
async function loadData() {
  try {
    const res = await fetch("/api/admin/data");
    const json = await res.json();

    aggregatedData = json.aggregates;
    submissions = json.submissions;

    updateMetrics();
    renderChart();
    renderTable();
  } catch (err) {
    alert("Failed to load admin data");
  }
}

// =========================
// METRIC CARDS UPDATE
// =========================
function updateMetrics() {
  document.getElementById("totalSubmissions").textContent = submissions.length;
  document.getElementById("uniqueEmails").textContent = "—";
  document.getElementById("questionsAnswered").textContent = "All";
}

// =========================
// CHART RENDERING
// =========================
let groupedChart = null;

function renderChart() {
  const ctx = document.getElementById("groupedChart").getContext("2d");

  const labels = [
    ...Array.from({ length: 8 }, (_, i) => `A${i + 1}`),
    ...Array.from({ length: 4 }, (_, i) => `P${i + 1}`),
    ...Array.from({ length: 4 }, (_, i) => `NY${i + 1}`)
  ];

  const datasets = [
    { label: "Awareness", data: aggregatedData.awareness, backgroundColor: "#3b82f6" },
    { label: "Prague WTP", data: aggregatedData.prague_wtp, backgroundColor: "#f59e0b" },
    { label: "New York WTP", data: aggregatedData.newyork_wtp, backgroundColor: "#10b981" }
  ];

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 0, max: 5 } }
    }
  });

  const list = document.getElementById("aggregatesList");
  list.innerHTML = "";

  aggregatedData.awareness.forEach((v, i) =>
    appendList(list, `Awareness Q${i + 1}: ${v}`)
  );
  aggregatedData.prague_wtp.forEach((v, i) =>
    appendList(list, `Prague Q${i + 1}: ${v}`)
  );
  aggregatedData.newyork_wtp.forEach((v, i) =>
    appendList(list, `New York Q${i + 1}: ${v}`)
  );
}

function appendList(list, text) {
  const li = document.createElement("li");
  li.textContent = text;
  list.appendChild(li);
}

// =========================
// TABLE RENDERING
// =========================
function renderTable() {
  const tbody = document.querySelector("#submissionsTable tbody");
  const empty = document.getElementById("tableEmpty");

  tbody.innerHTML = "";
  if (!submissions.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  submissions.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.age || ""}</td>
      <td>${row.gender || ""}</td>
      <td>${row.education || ""}</td>
      <td>${row.occupation || ""}</td>
      <td>${row.income || ""}</td>
      <td>${row.created_at || ""}</td>
      <td><button class="view-btn" data-id="${row.id}">View</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".view-btn").forEach((b) =>
    b.addEventListener("click", () => showModal(b.dataset.id))
  );
}

// =========================
// MODAL VIEW
// =========================
async function showModal(id) {
  const res = await fetch(`/api/admin/response/${id}`);
  const data = await res.json();

  const container = document.getElementById("modalContent");
  container.innerHTML = "";

  appendSection(container, "Section 1: Demographics");
  addField(container, "Age", data.age);
  addField(container, "Gender", data.gender);
  addField(container, "Education", data.education);
  addField(container, "Occupation", data.occupation);
  addField(container, "Income", data.income);
  addField(container, "Country", data.country);
  addField(container, "AI Familiarity", data.ai_knowledge);

  appendSection(container, "Section 2: Awareness");
  QUESTIONS.awareness.forEach((q, i) =>
    addQuestion(container, i + 1, q, data[`awareness${i + 1}`])
  );

  appendSection(container, "Section 3A: Prague – WTP");
  QUESTIONS.prague_wtp.forEach((q, i) =>
    addQuestion(container, i + 1, q, data[`prague_wtp${i + 1}`])
  );
  addField(container, "Prague – AI Price", data.prague_ai_price);
  addField(container, "Prague – Human Price", data.prague_human_price);

  appendSection(container, "Section 3B: New York – WTP");
  QUESTIONS.newyork_wtp.forEach((q, i) =>
    addQuestion(container, i + 1, q, data[`newyork_wtp${i + 1}`])
  );
  addField(container, "New York – AI Price", data.newyork_ai_price);
  addField(container, "New York – Human Price", data.newyork_human_price);

  document.getElementById("modalTitle").textContent = "Submission Details";
  document.getElementById("modalBackdrop").style.display = "flex";
}

function appendSection(c, title) {
  c.innerHTML += `<h3 style="margin-top:20px;">${title}</h3>`;
}

function addField(c, label, value) {
  c.innerHTML += `<p><strong>${label}:</strong> ${value ?? "—"}</p>`;
}

function addQuestion(c, num, text, val) {
  const labels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
  const meaning = val ? labels[val - 1] : "—";
  c.innerHTML += `<p><strong>Q${num}.</strong> ${text}<br>Response: ${val ?? "—"} (${meaning})</p>`;
}

// =========================
// EXPORT CSV
// =========================
document.getElementById("exportCsv").onclick = () => {
  window.location.href = "/api/admin/export";
};

// CLOSE MODAL
document.getElementById("closeModal").onclick = () => {
  document.getElementById("modalBackdrop").style.display = "none";
};

document.getElementById("modalBackdrop").onclick = (e) => {
  if (e.target.id === "modalBackdrop") {
    document.getElementById("modalBackdrop").style.display = "none";
  }
};

// INIT
loadData();
