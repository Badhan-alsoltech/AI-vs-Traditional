// screens/admin.js
// Admin Dashboard — charts, table, modal (with full questions & answers)

// === Question Texts ===
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
  preferences: [
    "I prefer the AI-designed mug over the human-designed mug.",
    "I would feel proud to own an AI-designed mug.",
    "The AI-designed mug seems more innovative and unique.",
    "The human-designed mug feels more reliable and practical.",
    "I think AI-designed products are the future of modern design.",
    "I would choose the human-designed mug because it reflects traditional aesthetics.",
    "AI-designed products make shopping more exciting and futuristic.",
    "I would recommend AI-designed products to others if the quality is good."
  ],
  wtp: [
    "I am willing to pay the same price for the AI-designed mug as for the human-designed mug.",
    "I am willing to pay more for the AI-designed mug if it offers innovative features.",
    "I would only purchase the AI-designed mug if it is competitively priced compared to the human-designed mug.",
    "I am more willing to pay for the AI-designed mug if it comes from a trusted or well-known brand.",
    "I would pay more for the AI-designed mug if it is marketed as eco-friendly or sustainable.",
    "I am more willing to pay for the AI-designed mug if it offers customization options (e.g., design personalization).",
    "My willingness to pay depends on the intended use (e.g., gift, personal use, decoration).",
    "I would pay more for the AI-designed mug if it demonstrates superior quality during use."
  ],
  comparative: [
    "The AI-designed mug appears more functional and precise in its design.",
    "The human-designed mug appears more creative and emotionally engaging.",
    "The AI design positively influences my purchase decision.",
    "The human-designed mug influences my purchase decision more than AI features.",
    "I believe AI-generated designs will become increasingly accepted by consumers.",
    "I would not buy AI-designed products if they seem too artificial or complex.",
    "Overall, I am open to considering both AI-designed and human-designed products depending on context.",
    "The AI design makes the mug look more innovative than traditional designs."
  ]
};

let aggregatedData = null;
let submissions = [];

// === Load all data for admin dashboard ===
async function loadData() {
  try {
    const res = await fetch("/api/admin/data");
    if (!res.ok) throw new Error("Failed to fetch admin data");
    const json = await res.json();
    aggregatedData = json.aggregates;
    submissions = json.submissions || [];
    updateMetrics();
    renderChart();
    renderTable();
  } catch (err) {
    console.error(err);
    alert("Error loading admin data: " + err.message);
  }
}

// === Metrics summary cards ===
function updateMetrics() {
  document.getElementById("totalSubmissions").textContent = submissions.length;
  document.getElementById("uniqueEmails").textContent = "—";
  document.getElementById("questionsAnswered").textContent = "All";
}

// === Chart ===
let groupedChart = null;
function renderChart() {
  const ctx = document.getElementById("groupedChart").getContext("2d");

  const labels = Array.from({ length: 8 }, (_, i) => `Q${i + 1}`);

  const datasets = [
    { label: "Awareness", data: aggregatedData.awareness, backgroundColor: "#60a5fa" },
    { label: "Preferences", data: aggregatedData.preferences, backgroundColor: "#34d399" },
    { label: "WTP", data: aggregatedData.wtp, backgroundColor: "#f59e0b" },
    { label: "Comparative", data: aggregatedData.comparative, backgroundColor: "#ef4444" }
  ];

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => `Question ${items[0].dataIndex + 1}`,
            label: (item) => {
              const section = item.dataset.label.toLowerCase();
              const qIndex = item.dataIndex;
              const questionText = QUESTIONS[section]?.[qIndex] || "";
              return `${item.dataset.label}: ${item.formattedValue} — ${questionText}`;
            }
          }
        },
        legend: { position: "top" }
      },
      scales: {
        y: { suggestedMin: 0, suggestedMax: 5, title: { display: true, text: "Mean (1–5)" } },
        x: { title: { display: true, text: "Question number (1–8)" } }
      }
    }
  });

  // also populate the side list of mean values
  const list = document.getElementById("aggregatesList");
  list.innerHTML = "";
  for (const [key, arr] of Object.entries(aggregatedData)) {
    arr.forEach((val, idx) => {
      const li = document.createElement("li");
      li.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)} Q${idx + 1}: ${val}`;
      list.appendChild(li);
    });
  }
}

// === Table rendering ===
function renderTable() {
  const tbody = document.querySelector("#submissionsTable tbody");
  const emptyNote = document.getElementById("tableEmpty");
  tbody.innerHTML = "";

  if (!submissions.length) {
    emptyNote.style.display = "block";
    return;
  } else {
    emptyNote.style.display = "none";
  }

  submissions.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.age ?? ""}</td>
      <td>${row.gender ?? ""}</td>
      <td>${row.education ?? ""}</td>
      <td>${row.occupation ?? ""}</td>
      <td>${row.income ?? ""}</td>
      <td>${row.created_at ?? ""}</td>
      <td style="display:flex;gap:8px;">
        <button class="view-btn" data-id="${row.id}">View</button>
        <button class="delete-btn" disabled>Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // attach view listeners
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await showModal(id);
    });
  });
}

// === Modal View (improved layout) ===
async function showModal(id) {
  try {
    const res = await fetch(`/api/admin/response/${id}`);
    if (!res.ok) throw new Error("Failed to load response");
    const data = await res.json();

    const container = document.getElementById("modalContent");
    container.innerHTML = "";

    const created = document.createElement("div");
    created.innerHTML = `<strong>Submitted:</strong> ${data.created_at}`;
    created.style.marginBottom = "12px";
    container.appendChild(created);

    // Demographics
    const demographicsTitle = document.createElement("h4");
    demographicsTitle.textContent = "Section 1: Demographics";
    container.appendChild(demographicsTitle);

    const demoKeys = [
      ["Age", "age"],
      ["Gender", "gender"],
      ["Education", "education"],
      ["Occupation", "occupation"],
      ["Income", "income"],
      ["Country", "country"],
      ["Familiarity with AI", "ai_knowledge"]
    ];
    demoKeys.forEach(([label, key]) => {
      const row = document.createElement("div");
      row.className = "modal-field";
      row.style.width = "100%";
      row.innerHTML = `<strong>${label}:</strong><br>${data[key] ?? ""}`;
      container.appendChild(row);
    });

    // helper to add Q sections
    function addQuestionSection(title, sectionKey, prefix) {
      const titleEl = document.createElement("h4");
      titleEl.textContent = title;
      titleEl.style.marginTop = "16px";
      container.appendChild(titleEl);

      QUESTIONS[sectionKey].forEach((q, i) => {
        const row = document.createElement("div");
        row.className = "modal-field";
        row.style.width = "100%";
        const val = data[`${prefix}${i + 1}`];
        const displayVal =
          val === null || val === undefined || val === ""
            ? "—"
            : `${val} (${["Strongly Disagree","Disagree","Neutral","Agree","Strongly Agree"][val-1] || ""})`;
        row.innerHTML = `<strong>Q${i + 1}.</strong> ${q}<br><em>Response:</em> ${displayVal}`;
        container.appendChild(row);
      });
    }

    addQuestionSection("Section 2: Awareness & Perceptions", "awareness", "awareness");
    addQuestionSection("Section 3: Preferences & Attitudes", "preferences", "preference");
    addQuestionSection("Section 4: Willingness to Pay", "wtp", "wtp");

    // price info
    const priceTitle = document.createElement("h4");
    priceTitle.textContent = "Maximum Willingness to Pay";
    priceTitle.style.marginTop = "16px";
    container.appendChild(priceTitle);

    const priceRow1 = document.createElement("div");
    priceRow1.className = "modal-field";
    priceRow1.style.width = "100%";
    priceRow1.innerHTML = `<strong>AI-designed mug:</strong> ${data.ai_mug_price ?? "—"}`;
    container.appendChild(priceRow1);

    const priceRow2 = document.createElement("div");
    priceRow2.className = "modal-field";
    priceRow2.style.width = "100%";
    priceRow2.innerHTML = `<strong>Human-designed mug:</strong> ${data.human_mug_price ?? "—"}`;
    container.appendChild(priceRow2);

    addQuestionSection("Section 5: Comparative Analysis (AI vs Human Design)", "comparative", "comparative");

    // show modal
    const backdrop = document.getElementById("modalBackdrop");
    backdrop.style.display = "flex";
    document.getElementById("modalTitle").textContent = `Submission #${id} Details`;
  } catch (err) {
    console.error(err);
    alert("Error loading submission details");
  }
}

// === Modal Close Handlers ===
document.getElementById("closeModal")?.addEventListener("click", () => {
  document.getElementById("modalBackdrop").style.display = "none";
});
document.getElementById("modalBackdrop")?.addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop") {
    document.getElementById("modalBackdrop").style.display = "none";
  }
});

// === CSV Export ===
document.getElementById("exportCsv")?.addEventListener("click", () => {
  window.location.href = "/api/admin/export";
});

// === Init ===
loadData();
