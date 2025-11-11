/* compare.js
   ----------------------------------------------
   Handles navigation, scroll reveals, and tilt effects
   ----------------------------------------------
*/

// Navigation
document.getElementById("backHome")?.addEventListener("click", () => {
  window.location.href = "/";
});

document.getElementById("toSurvey")?.addEventListener("click", () => {
  window.location.href = "/survey";
});

// Scroll reveal
const reveals = Array.from(document.querySelectorAll(".reveal"));
const observerOptions = { threshold: 0.12 };

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const anim = el.dataset.anim || "fade-up";
      const delay = parseInt(el.dataset.delay || "0", 10);

      if (anim === "fade-up") {
        el.style.animation = `fade-up 0.9s ease ${delay}ms both`;
      } else if (anim === "slide-right") {
        el.style.animation = `slide-right 0.9s ease ${delay}ms both`;
      } else if (anim === "slide-left") {
        el.style.animation = `slide-left 0.9s ease ${delay}ms both`;
      }

      el.classList.add("in");
      revealObserver.unobserve(el);
    }
  });
}, observerOptions);

reveals.forEach((r) => revealObserver.observe(r));

// Tilt animation for compare cards
function attachTilt(el) {
  const maxTilt = 6;
  const damp = 0.1;
  let rx = 0, ry = 0, tx = 0, ty = 0, raf = null;

  const rect = () => el.getBoundingClientRect();

  function update() {
    rx += (tx - rx) * damp;
    ry += (ty - ry) * damp;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    if (Math.abs(tx - rx) > 0.05 || Math.abs(ty - ry) > 0.05) {
      raf = requestAnimationFrame(update);
    } else {
      raf = null;
    }
  }

  function onMove(e) {
    const r = rect();
    const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left;
    const cy = (e.clientY ?? e.touches?.[0]?.clientY) - r.top;
    const px = (cx / r.width) * 2 - 1;
    const py = (cy / r.height) * 2 - 1;
    tx = -py * maxTilt;
    ty = px * maxTilt;
    if (!raf) raf = requestAnimationFrame(update);
  }

  function onLeave() {
    tx = 0; ty = 0;
    if (!raf) raf = requestAnimationFrame(update);
  }

  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  el.addEventListener("touchmove", onMove, { passive: true });
  el.addEventListener("touchend", onLeave);
}

document.querySelectorAll(".tilt").forEach((el) => attachTilt(el));
