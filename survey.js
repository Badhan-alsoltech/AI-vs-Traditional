/**************************************
 * QUESTION ARRAYS
 **************************************/
const awarenessQs = [
  "The AI-designed mug appears to be visually creative and modern.",
  "The human-designed mug appears to be more authentic and handcrafted.",
  "I believe AI can produce product designs that are equally appealing as human designs.",
  "I trust that the human-designed mug has higher craftsmanship quality.",
  "I feel comfortable purchasing a product designed entirely by AI.",
  "I find AI-generated designs innovative and interesting.",
  "The human-designed mug looks more emotionally appealing to me.",
  "I believe AI design lacks emotional touch compared to human creativity."
];

const pragueWtpQs = [
  "Are you willing to pay the same price for the AI-designed mug as for the human-designed mug?",
  "Are you willing to pay more for the AI-designed mug if it offers innovative features?",
  "Would you only purchase the AI-designed mug if it is competitively priced compared to the human-designed mug?",
  "Would you pay more for the AI-designed mug if it demonstrates superior quality during use?"
];

const newyorkWtpQs = [
  "Are you willing to pay the same price for the AI-designed mug as for the human-designed mug?",
  "Are you willing to pay more for the AI-designed mug if it offers innovative features?",
  "Would you only purchase the AI-designed mug if it is competitively priced compared to the human-designed mug?",
  "Would you pay more for the AI-designed mug if it demonstrates superior quality during use?"
];

/**************************************
 * RENDER FUNCTIONS
 **************************************/
function renderScaleQuestions(containerId, prefix, list) {
  const container = document.getElementById(containerId);

  list.forEach((q, i) => {
    const number = i + 1;
    const div = document.createElement("div");
    div.style.marginBottom = "14px";

    const label = document.createElement("label");
    label.textContent = `${number}. ${q}`;
    div.appendChild(label);

    const scale = document.createElement("div");
    scale.className = "rating-scale";

    for (let v = 1; v <= 5; v++) {
      const opt = document.createElement("label");
      opt.innerHTML = `<input type="radio" name="${prefix}${number}" value="${v}" required> ${v}`;
      scale.appendChild(opt);
    }

    div.appendChild(scale);
    container.appendChild(div);
  });
}

// render dynamic questions
renderScaleQuestions("awarenessContainer", "awareness", awarenessQs);
renderScaleQuestions("pragueWtpContainer", "prague_wtp", pragueWtpQs);
renderScaleQuestions("newyorkWtpContainer", "newyork_wtp", newyorkWtpQs);

/**************************************
 * FORM SUBMIT LOGIC
 **************************************/
const form = document.getElementById("surveyForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  // Country "Other" logic
  const selectedCountry = formData.get("country");
  if (selectedCountry === "Other") {
    const otherText = formData.get("countryOther");
    if (otherText && otherText.trim() !== "") {
      formData.set("country", otherText.trim());
    }
  }
  formData.delete("countryOther");

  // Convert FormData → JSON
  const data = {};
  for (const [key, value] of formData.entries()) {
    if (key.match(/price$/)) {
      data[key] = parseFloat(value);
    } else if (key.match(/(awareness|prague_wtp|newyork_wtp)\d+/)) {
      data[key] = parseInt(value, 10);
    } else if (key === "age") {
      data[key] = parseInt(value, 10);
    } else {
      data[key] = value;
    }
  }

  // POST request
  try {
    const res = await fetch("/api/submit_survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      document.getElementById("surveyForm").style.display = "none";
      document.getElementById("thankYou").classList.add("active");
    } else {
      const error = await res.json();
      alert("Error: " + error.error);
    }
  } catch (err) {
    alert("Network error: " + err.message);
  }
});

/**************************************
 * NAVIGATION BUTTONS
 **************************************/
document.getElementById("goHome")?.addEventListener("click", () => {
  window.location.href = "/";
});
document.getElementById("backCompare")?.addEventListener("click", () => {
  window.location.href = "/compare";
});
