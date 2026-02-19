// --------- THEME TOGGLE (dark/light) ----------
(function () {
  const htmlRoot = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");

  if (!themeToggle || !themeIcon || !themeText) return;

  const saved = localStorage.getItem("theme");
  const prefersLight =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  const initTheme = saved ? saved : prefersLight ? "light" : "dark";

  function applyTheme(t) {
    if (t === "light") {
      htmlRoot.classList.add("light");
      themeIcon.className = "fa fa-sun";
      themeText.textContent = "Light";
    } else {
      htmlRoot.classList.remove("light");
      themeIcon.className = "fa fa-moon";
      themeText.textContent = "Dark";
    }
    localStorage.setItem("theme", t);
  }

  applyTheme(initTheme);

  themeToggle.addEventListener("click", () => {
    const current = htmlRoot.classList.contains("light") ? "light" : "dark";
    applyTheme(current === "light" ? "dark" : "light");
  });
})();

// --------- FOOTER YEAR ----------
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// --------- Particles init ----------
document.addEventListener("DOMContentLoaded", function () {
  if (window.particlesJS) {
    particlesJS("particles-js", {
      particles: {
        number: { value: 30, density: { enable: true, value_area: 700 } },
        color: { value: "#00e6ff" },
        shape: { type: "circle" },
        opacity: { value: 0.08 },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 120,
          color: "#00e6ff",
          opacity: 0.04,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1.2,
          direction: "none",
          out_mode: "bounce",
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: true, mode: "grab" },
          onclick: { enable: true, mode: "push" },
        },
        modes: {
          grab: { distance: 160, line_linked: { opacity: 0.15 } },
          push: { particles_nb: 3 },
        },
      },
      retina_detect: true,
    });
  }
});

// --------- CONTACT FORM ----------
(function () {
  const contactForm = document.getElementById("contact-form");
  const successPopup = document.getElementById("success-popup");
  const closePopupBtn = document.getElementById("close-popup");
  const sendBtn = document.getElementById("send-btn");
  const loader = document.getElementById("btn-loader");
  const btnText = sendBtn ? sendBtn.querySelector(".btn-text") : null;

  if (!contactForm) return;

  contactForm.addEventListener("submit", async function (ev) {
    ev.preventDefault();

    // reset errors
    const nameErr = document.getElementById("name-error");
    const emailErr = document.getElementById("email-error");
    const msgErr = document.getElementById("message-error");
    nameErr.textContent = "";
    emailErr.textContent = "";
    msgErr.textContent = "";

    const name = (document.getElementById("name") || {}).value || "";
    const email = (document.getElementById("email") || {}).value || "";
    const message = (document.getElementById("message") || {}).value || "";

    let valid = true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (name.trim() === "") {
      nameErr.textContent = "Name is required.";
      valid = false;
    }
    if (!email.match(emailPattern)) {
      emailErr.textContent = "Enter a valid email.";
      valid = false;
    }
    if (message.trim() === "") {
      msgErr.textContent = "Message cannot be empty.";
      valid = false;
    }
    if (!valid) return;

    if (btnText) btnText.style.display = "none";
    if (loader) loader.style.display = "inline-block";
    if (sendBtn) sendBtn.disabled = true;

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" },
      });

      if (btnText) btnText.style.display = "inline";
      if (loader) loader.style.display = "none";
      if (sendBtn) sendBtn.disabled = false;

      if (response.ok) {
        contactForm.reset();
        successPopup.classList.add("show");
        successPopup.setAttribute("aria-hidden", "false");
        if (closePopupBtn) closePopupBtn.focus();
      } else {
        let errText = "Something went wrong. Please try again.";
        try {
          const data = await response.json();
          if (data?.errors?.[0]?.message) {
            errText = data.errors[0].message;
          }
        } catch {}
        alert(errText);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (btnText) btnText.style.display = "inline";
      if (loader) loader.style.display = "none";
      if (sendBtn) sendBtn.disabled = false;
      alert("Network error. Please check your connection.");
    }
  });

  if (closePopupBtn) {
    closePopupBtn.addEventListener("click", function () {
      successPopup.classList.remove("show");
      successPopup.setAttribute("aria-hidden", "true");
    });
  }
})();

// -------- CERTIFICATE SLIDER --------
const track = document.getElementById("cert-track");
const leftBtn = document.getElementById("cert-left");
const rightBtn = document.getElementById("cert-right");

if (track && leftBtn && rightBtn) {
  let position = 0;
  const slideWidth = 346;
  let autoSlide;

  function moveRight() {
    position -= slideWidth;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (Math.abs(position) >= maxScroll) position = 0;
    track.style.transform = `translateX(${position}px)`;
  }

  function moveLeft() {
    position += slideWidth;
    if (position > 0) position = -(track.scrollWidth - track.clientWidth);
    track.style.transform = `translateX(${position}px)`;
  }

  function startAuto() {
    autoSlide = setInterval(moveRight, 2000);
  }
  function stopAuto() {
    clearInterval(autoSlide);
  }
  function restartAuto() {
    stopAuto();
    startAuto();
  }

  rightBtn.addEventListener("click", () => {
    moveRight();
    restartAuto();
  });
  leftBtn.addEventListener("click", () => {
    moveLeft();
    restartAuto();
  });

  startAuto();

  track.addEventListener("mouseenter", stopAuto);
  track.addEventListener("mouseleave", startAuto);

  document.querySelectorAll(".cert-slide").forEach((slide) => {
    slide.addEventListener("click", (event) => {
      event.stopPropagation();
      const link = slide.getAttribute("data-link");
      const imgSrc = slide.querySelector("img")?.src;

      if (link) window.open(link, "_blank");
      else if (imgSrc) openImagePreview(imgSrc);
    });
  });
}

// Click logic
document.querySelectorAll(".cert-slide").forEach((slide) => {
  slide.addEventListener("click", (event) => {
    event.stopPropagation();
    const link = slide.getAttribute("data-link");
    const imgSrc = slide.querySelector("img").src;

    if (link && link.trim() !== "") {
      window.open(link, "_blank");
    } else {
      openImagePreview(imgSrc);
    }
  });
});

// Image Preview Popup
function openImagePreview(src) {
  const preview = document.createElement("div");
  preview.style.position = "fixed";
  preview.style.top = "0";
  preview.style.left = "0";
  preview.style.width = "100%";
  preview.style.height = "100%";
  preview.style.background = "rgba(0,0,0,0.85)";
  preview.style.display = "flex";
  preview.style.justifyContent = "center";
  preview.style.alignItems = "center";
  preview.style.cursor = "zoom-out";
  preview.style.zIndex = "9999";

  preview.innerHTML = `<img src="${src}" style="max-width:90%; max-height:90%; border-radius:10px;">`;

  preview.onclick = () => preview.remove();
  document.body.appendChild(preview);
}
