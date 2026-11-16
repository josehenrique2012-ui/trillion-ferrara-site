(function () {
  "use strict";

  function setupNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector("#menu-principal");
    if (!toggle || !nav) return;

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
      nav.classList.remove("is-open");
    }

    function open() {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Fechar menu");
      nav.classList.add("is-open");
    }

    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") close();
      else open();
    });

    Array.prototype.forEach.call(nav.querySelectorAll("a"), function (link) {
      link.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  function setupReveal() {
    var nodes = document.querySelectorAll(
      ".section, .section__head, .card, .process__step, .faq details, .cta-band, .footer__inner, .legal"
    );
    if (!nodes.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Array.prototype.forEach.call(nodes, function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var vh = window.innerHeight || document.documentElement.clientHeight;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px 0px 0px" }
    );

    Array.prototype.forEach.call(nodes, function (el, i) {
      var rect = el.getBoundingClientRect();
      var inView = rect.top < vh && rect.bottom > 0;
      if (inView) {
        el.classList.add("is-visible");
        return;
      }
      el.classList.add("reveal");
      if (
        el.classList.contains("card") ||
        el.classList.contains("process__step") ||
        el.tagName === "DETAILS"
      ) {
        el.style.transitionDelay = ((i % 4) * 70) + "ms";
      }
      io.observe(el);
    });

    // Fallback visível: se o observer não disparar, o conteúdo aparece em seguida.
    setTimeout(function () {
      Array.prototype.forEach.call(nodes, function (el) {
        el.classList.add("is-visible");
      });
    }, 800);
  }

  function init() {
    setupNav();
    setupReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
