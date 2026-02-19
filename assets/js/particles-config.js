// Initialize particles.js
document.addEventListener('DOMContentLoaded', function () {
  if (window.particlesJS) {
    particlesJS('particles-js', {
      "particles": {
        "number": {
          "value": 55,
          "density": { "enable": true, "value_area": 800 }
        },
        "color": { "value": "#00aaff" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.12 },
        "size": { "value": 3, "random": true },
        "line_linked": { "enable": true, "distance": 140, "color": "#00aaff", "opacity": 0.06, "width": 1 },
        "move": { "enable": true, "speed": 1.5, "direction": "none", "out_mode": "bounce" }
      },
      "interactivity": {
        "detect_on": "canvas",
        "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" } },
        "modes": { "grab": { "distance": 180, "line_linked": { "opacity": 0.18 } }, "push": { "particles_nb": 4 } }
      },
      "retina_detect": true
    });
  }
});
