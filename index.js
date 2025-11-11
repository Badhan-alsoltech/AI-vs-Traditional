/* index.js
   -------------------------------------------------
   Handles:
   - Navigation button actions
   - Scroll reveal animations (fade, scale, slide)
   - Card tilt hover effects
   - Side-by-side image reveal animations
   - Replaces blue/purple glow with clean fade visuals
   -------------------------------------------------
*/

// ---------- Navigation ----------
const navigateTo = (path) => {
  window.location.href = path;
};

// Buttons for page navigation
document.getElementById("homeBtn")?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);
document.getElementById("compareBtn")?.addEventListener("click", () =>
  navigateTo("/compare")
);
document.getElementById("startCompare")?.addEventListener("click", () =>
  navigateTo("/compare")
);
document.getElementById("ctaCompare")?.addEventListener("click", () =>
  navigateTo("/compare")
);
document.getElementById("ctaCompare2")?.addEventListener("click", () =>
  navigateTo("/compare")
);

document.getElementById("galleryBtn")?.addEventListener("click", () =>
  navigateTo("/gallery")
);
document.getElementById("ctaGallery")?.addEventListener("click", () =>
  navigateTo("/gallery")
);
document.getElementById("ctaGallery2")?.addEventListener("click", () =>
  navigateTo("/gallery")
);
document.getElementById("ctaPreview")?.addEventListener("click", () =>
  navigateTo("/gallery")
);

document.getElementById("adminBtn")?.addEventListener("click", () =>
  navigateTo("/admin")
);

// ---------- Smooth Scroll Reveal Animations ----------
const reveals = Array.from(document.querySelectorAll(".reveal"));
const observerOptions = { threshold: 0.12 };

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const anim = el.dataset.anim || "";
      const delay = parseInt(el.dataset.delay || "0", 10);

      // Animation variants
      const animations = {
        "fade-up": `fade-up 0.9s ease ${delay}ms both`,
        "slide-right": `slide-right 0.9s ease ${delay}ms both`,
        "slide-left": `slide-left 0.9s ease ${delay}ms both`,
        "scale-in": `scale-in 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms both`,
      };

      el.style.animation = animations[anim] || `fade-in 0.9s ease ${delay}ms both`;
      el.classList.add("in");
      revealObserver.unobserve(el);
    }
  });
}, observerOptions);

reveals.forEach((r) => revealObserver.observe(r));

// ---------- Card Tilt Effect ----------
function attachTilt(el) {
  const maxTilt = 6;
  const damp = 0.1;
  let rx = 0,
    ry = 0,
    tx = 0,
    ty = 0,
    raf = null;

  const getRect = () => el.getBoundingClientRect();

  function update() {
    rx += (tx - rx) * damp;
    ry += (ty - ry) * damp;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    if (Math.abs(tx - rx) > 0.05 || Math.abs(ty - ry) > 0.05) {
      raf = requestAnimationFrame(update);
    } else {
      raf = null;
    }
  }

  function onMove(e) {
    const rect = getRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    const px = (x / rect.width) * 2 - 1;
    const py = (y / rect.height) * 2 - 1;
    tx = -py * maxTilt;
    ty = px * maxTilt;
    if (!raf) raf = requestAnimationFrame(update);
  }

  function onLeave() {
    tx = 0;
    ty = 0;
    if (!raf) raf = requestAnimationFrame(update);
  }

  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  el.addEventListener("touchmove", onMove, { passive: true });
  el.addEventListener("touchend", onLeave);
}

document.querySelectorAll("[data-tilt]").forEach((el) => attachTilt(el));

// ---------- Smooth Side-by-Side Reveal ----------
(function setupSideReveal() {
  const leftImg = document.getElementById("leftCompare");
  const rightImg = document.getElementById("rightCompare");
  if (!leftImg || !rightImg) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === leftImg) leftImg.classList.add("left-in");
          if (entry.target === rightImg) rightImg.classList.add("right-in");
        }
      });
    },
    { threshold: 0.25 }
  );

  observer.observe(leftImg);
  observer.observe(rightImg);
})();

// ---------- Auto-fade for Visible Elements ----------
window.addEventListener("load", () => {
  setTimeout(() => {
    document.querySelectorAll(".reveal").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) el.classList.add("in");
    });
  }, 200);
});

// ---------- Optional Background Animation ----------
const hero = document.querySelector(".hero") || document.querySelector(".header-section");
if (hero) {
  hero.style.background = "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)";
  hero.style.transition = "background 0.8s ease-in-out";
}
