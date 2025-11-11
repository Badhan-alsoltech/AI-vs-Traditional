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

const preferenceQs = [
  "I prefer the AI-designed mug over the human-designed mug.",
  "I would feel proud to own an AI-designed mug.",
  "The AI-designed mug seems more innovative and unique.",
  "The human-designed mug feels more reliable and practical.",
  "I think AI-designed products are the future of modern design.",
  "I would choose the human-designed mug because it reflects traditional aesthetics.",
  "AI-designed products make shopping more exciting and futuristic.",
  "I would recommend AI-designed products to others if the quality is good."
];

const wtpQs = [
  "I am willing to pay the same price for the AI-designed mug as for the human-designed mug.",
  "I am willing to pay more for the AI-designed mug if it offers innovative features.",
  "I would only purchase the AI-designed mug if it is competitively priced compared to the human-designed mug.",
  "I am more willing to pay for the AI-designed mug if it comes from a trusted or well-known brand.",
  "I would pay more for the AI-designed mug if it is marketed as eco-friendly or sustainable.",
  "I am more willing to pay for the AI-designed mug if it offers customization options (e.g., design personalization).",
  "My willingness to pay depends on the intended use (e.g., gift, personal use, decoration).",
  "I would pay more for the AI-designed mug if it demonstrates superior quality during use."
];

const comparativeQs = [
  "The AI-designed mug appears more functional and precise in its design.",
  "The human-designed mug appears more creative and emotionally engaging.",
  "The AI design positively influences my purchase decision.",
  "The human-designed mug influences my purchase decision more than AI features.",
  "I believe AI-generated designs will become increasingly accepted by consumers.",
  "I would not buy AI-designed products if they seem too artificial or complex.",
  "Overall, I am open to considering both AI-designed and human-designed products depending on context.",
  "The AI design makes the mug look more innovative than traditional designs."
];

function renderQuestions(containerId, prefix, questions) {
  const container = document.getElementById(containerId);
  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.style.marginBottom = "18px";
    const label = document.createElement("label");
    label.textContent = `${i + 1}. ${q}`;
    const scale = document.createElement("div");
    scale.className = "rating-scale";
    for (let r = 1; r <= 5; r++) {
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="radio" name="${prefix}${i + 1}" value="${r}" required> ${r}`;
      scale.appendChild(lbl);
    }
    div.appendChild(label);
    div.appendChild(scale);
    container.appendChild(div);
  });
}

renderQuestions("awareness", "awareness", awarenessQs);
renderQuestions("preferences", "preference", preferenceQs);
renderQuestions("wtp", "wtp", wtpQs);
renderQuestions("comparative", "comparative", comparativeQs);

const form = document.getElementById("surveyForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = {};
  for (const [k, v] of formData.entries()) data[k] = v;

  try {
    const res = await fetch("/api/submit_survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      form.style.display = "none";
      document.getElementById("thankYou").classList.add("active");
    } else {
      alert("Error saving data: " + result.error);
    }
  } catch (err) {
    alert("Network error: " + err.message);
  }
});

document.getElementById("goHome")?.addEventListener("click", () => {
  window.location.href = "/";
});
document.getElementById("backCompare")?.addEventListener("click", () => {
  window.location.href = "/compare";
});
