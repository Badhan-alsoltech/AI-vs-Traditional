// --------------------- NAVIGATION TOGGLE ---------------------
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.style.display = navLinks.style.display === "block" ? "none" : "block";
  });
}

// --------------------- SCROLL REVEAL ANIMATIONS ---------------------
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.25 }
);

document
  .querySelectorAll(".product-card, .feature, .split, .thumb-grid img")
  .forEach((el) => observer.observe(el));

// --------------------- TILT EFFECT ---------------------
function attachTilt(el) {
  const maxTilt = 5;
  const damp = 0.08;
  let rx = 0,
    ry = 0,
    tx = 0,
    ty = 0,
    raf;

  const rect = () => el.getBoundingClientRect();

  const onMove = (e) => {
    const r = rect();
    const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left;
    const cy = (e.clientY ?? e.touches?.[0]?.clientY) - r.top;
    const px = (cx / r.width) * 2 - 1;
    const py = (cy / r.height) * 2 - 1;
    tx = -py * maxTilt;
    ty = px * maxTilt;
    if (!raf) raf = requestAnimationFrame(update);
  };

  const onLeave = () => {
    tx = 0;
    ty = 0;
    if (!raf) raf = requestAnimationFrame(update);
  };

  function update() {
    rx += (tx - rx) * damp;
    ry += (ty - ry) * damp;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    if (Math.abs(tx - rx) > 0.1 || Math.abs(ty - ry) > 0.1) {
      raf = requestAnimationFrame(update);
    } else {
      raf = null;
    }
  }

  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  el.addEventListener("touchmove", onMove, { passive: true });
  el.addEventListener("touchend", onLeave);
}

document.querySelectorAll(".tilt").forEach(attachTilt);

// --------------------- IMAGE SPLIT SLIDER ---------------------
(function () {
  const wrap = document.getElementById("split");
  const overlay = document.getElementById("splitOverlay");
  const handle = document.getElementById("splitHandle");

  if (!wrap || !overlay || !handle) return;

  const setPct = (pct) => {
    const clamped = Math.max(0, Math.min(100, pct));
    overlay.style.width = clamped + "%";
    handle.style.left = `calc(${clamped}% - 10px)`;
  };

  let dragging = false;

  const rectPct = (clientX) => {
    const r = wrap.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * 100;
  };

  const onMove = (e) => {
    if (!dragging) return;
    const x = e.touches?.[0]?.clientX ?? e.clientX;
    setPct(rectPct(x));
  };

  handle.addEventListener("mousedown", () => (dragging = true));
  window.addEventListener("mouseup", () => (dragging = false));
  window.addEventListener("mousemove", onMove, { passive: true });

  handle.addEventListener("touchstart", () => (dragging = true), { passive: true });
  window.addEventListener("touchend", () => (dragging = false), { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });

  handle.addEventListener("keydown", (e) => {
    const w = parseFloat(getComputedStyle(overlay).width);
    const r = wrap.getBoundingClientRect();
    const pct = (w / r.width) * 100;
    if (e.key === "ArrowLeft") setPct(pct - 2);
    if (e.key === "ArrowRight") setPct(pct + 2);
  });

  setPct(50);
})();
