(function () {
  "use strict";

  var C = window.SITE_CONFIG;
  if (!C) {
    console.error("SITE_CONFIG não encontrado. Verifique o arquivo config.js.");
    return;
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function hexToRgb(hex) {
    if (!hex) return null;
    var h = String(hex).replace("#", "").trim();
    if (h.length === 3) {
      h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    }
    if (h.length !== 6) return null;
    var n = parseInt(h, 16);
    if (isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function displayName(nome) {
    return String(nome || "").replace(/\[EXEMPLO\]\s*/gi, "").trim() || String(nome || "");
  }

  function initials(name) {
    var clean = displayName(name);
    var words = clean.split(/\s+/).filter(function (w) {
      return !/^(&|e|da|de|do|das|dos)$/i.test(w);
    });
    return words
      .slice(0, 2)
      .map(function (w) { return w.charAt(0); })
      .join("")
      .toUpperCase();
  }

  function isPlaceholder(value) {
    return !value || /\[PREENCHER\]|PLACEHOLDER|^EXEMPLO\b|substitua/i.test(String(value).trim());
  }

  function waLink() {
    var raw = isPlaceholder(C.whatsapp) ? "" : C.whatsapp;
    var tel = isPlaceholder(C.telefone) ? "" : C.telefone;
    var num = digits(raw || tel);
    var msg = encodeURIComponent(C.ctaMensagem || "Olá! Vim pelo site e gostaria de mais informações.");
    return num ? "https://wa.me/" + num + "?text=" + msg : "#contato";
  }

  function instagramUrl() {
    var raw = String(C.instagram || "").trim();
    if (!raw || isPlaceholder(raw)) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return "https://www.instagram.com/" + raw.replace(/^@/, "") + "/";
  }

  function instagramLabel() {
    var raw = String(C.instagram || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) {
      try {
        var part = new URL(raw).pathname.replace(/\//g, "");
        return part ? "@" + part : "Instagram";
      } catch (e) {
        return "Instagram";
      }
    }
    return raw.charAt(0) === "@" ? raw : "@" + raw;
  }

  function telHref() {
    if (isPlaceholder(C.telefone)) return "";
    var d = digits(C.telefone);
    if (!d) return "";
    if (d.indexOf("55") === 0 && d.length >= 12) return "tel:+" + d;
    return "tel:+55" + d;
  }

  function mapsSrc() {
    if (!isPlaceholder(C.mapsEmbed)) return C.mapsEmbed;
    var q = isPlaceholder(C.endereco) ? (C.cidade || "") : (C.endereco || [C.nome, C.cidade].filter(Boolean).join(", "));
    return q ? "https://maps.google.com/maps?q=" + encodeURIComponent(q) + "&output=embed" : "";
  }

  function absUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path) || path.indexOf("data:") === 0) return path;
    var base = (C.seo && C.seo.url) || C.siteUrl || "";
    if (!base) return path;
    try {
      return new URL(path, base.slice(-1) === "/" ? base : base + "/").href;
    } catch (e) {
      return path;
    }
  }

  function setMeta(selector, attr, value) {
    var el = $(selector);
    if (!el || value == null || value === "") return;
    el.setAttribute(attr, value);
  }

  function luminance(rgb) {
    return 0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
  }

  function lighten(rgb, amount) {
    return {
      r: Math.round(rgb.r + (255 - rgb.r) * amount),
      g: Math.round(rgb.g + (255 - rgb.g) * amount),
      b: Math.round(rgb.b + (255 - rgb.b) * amount)
    };
  }

  function rgbCss(rgb) {
    return "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
  }

  function applyTheme() {
    var root = document.documentElement;
    var cores = C.cores || {};
    if (cores.primaria) {
      root.style.setProperty("--cor-primaria", cores.primaria);
      var rgb = hexToRgb(cores.primaria);
      if (rgb) {
        root.style.setProperty("--cor-primaria-rgb", rgb.r + ", " + rgb.g + ", " + rgb.b);
        root.style.setProperty("--cor-acao", luminance(rgb) < 0.28 ? rgbCss(lighten(rgb, 0.58)) : cores.primaria);
      }
      setMeta('meta[name="theme-color"]', "content", "#07080D");
    }
    if (cores.secundaria) {
      root.style.setProperty("--cor-secundaria", cores.secundaria);
      var rgb2 = hexToRgb(cores.secundaria);
      if (rgb2) root.style.setProperty("--cor-secundaria-rgb", rgb2.r + ", " + rgb2.g + ", " + rgb2.b);
    }
  }

  function applySeo() {
    var seo = C.seo || {};
    var titulo = seo.titulo || (C.nome ? C.nome + (C.cidade ? " | " + C.cidade : "") : "Site de demonstração");
    var desc = seo.descricao || C.subheadline || "";
    var url = seo.url || C.siteUrl || "";
    var image = absUrl((C.imagens && C.imagens.og) || (C.imagens && C.imagens.hero) || "");

    document.title = titulo;
    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[name="robots"]', "content", seo.indexar ? "index, follow" : "noindex, nofollow");
    setMeta('meta[property="og:title"]', "content", titulo);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:image"]', "content", image);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:site_name"]', "content", displayName(C.nome) || titulo);
    setMeta('meta[name="twitter:title"]', "content", titulo);
    setMeta('meta[name="twitter:description"]', "content", desc);
    setMeta('meta[name="twitter:image"]', "content", image);

    var oldLd = document.getElementById("ld-localbusiness");
    if (oldLd) oldLd.remove();
    var ld = {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: displayName(C.nome),
      description: desc,
      telephone: telHref().replace("tel:", "") || undefined,
      email: (!isPlaceholder(C.email) && C.email) || undefined,
      url: url || undefined,
      image: image || undefined,
      areaServed: "Brasil",
    };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "ld-localbusiness";
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  }

  function applyFavicon() {
    if (C.imagens && C.imagens.logo) return;
    var letter = initials(C.nome).charAt(0) || "S";
    var color = (C.cores && C.cores.primaria) || "#0F3D3E";
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" rx="8" fill="' + escapeHtml(color) + '"/>' +
      '<text x="16" y="22" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="16" font-weight="700">' +
      escapeHtml(letter) +
      "</text></svg>";
    var link = document.querySelector("link[rel='icon']") || document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = "data:image/svg+xml," + encodeURIComponent(svg);
    if (!link.parentNode) document.head.appendChild(link);
  }

  var ICONS = {
    pao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 14c0-5 3.5-8 8-8s8 3 8 8v3H4v-3z"/><path d="M8 12v2M12 11v3M16 12v2"/></svg>',
    bolo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v4M8 21h8l1-8H7l1 8zM7 13a5 5 0 0 1 10 0"/><path d="M12 3c.8 0 1.5.7 1.5 1.5S12.8 6 12 7c-.8-.7-1.5-1.5-1.5-2.5S11.2 3 12 3z"/></svg>',
    cafe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 9h10v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z"/><path d="M15 10h2a3 3 0 0 1 0 6h-2M8 3v2M12 3v2"/></svg>',
    encomenda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8l8-4 8 4v10l-8 4-8-4V8z"/><path d="M12 12l8-4M12 12v10M12 12L4 8"/></svg>',
    agilidade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"/></svg>',
    qualidade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 7.2 17.9l.9-5.4L4.2 8.7l5.4-.8z"/></svg>',
    atendimento: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
    personalizado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.4-7-10a7 7 0 0 1 14 0c0 5.6-7 10-7 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
    local: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.4-7-10a7 7 0 0 1 14 0c0 5.6-7 10-7 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
    preco: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v20M17 7.5C17 5.6 14.8 4 12 4S7 5.6 7 7.5 9.2 11 12 11s5 1.6 5 3.5S14.8 18 12 18s-5-1.6-5-3.5"/></svg>',
    experiencia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>',
    confianca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6z"/><path d="M8.5 12.5l2.3 2.3 4.7-5"/></svg>',
    padrao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>',
    trafego: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5m0 14 4-6 4 3 8-10"/><circle cx="20" cy="6" r="1.4"/></svg>',
    sites: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9h17M8 15h8"/></svg>',
    design: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 16 16.5 3.5a2 2 0 0 1 3 3L7 19H4v-3z"/><path d="M13 6.5 17.5 11"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 5h9a2 2 0 0 1 2 2v13H8a2 2 0 0 1-2-2V5z"/><path d="M10 5V4a1 1 0 0 1 1-1h7a2 2 0 0 1 2 2v12"/><path d="M9 11h5M9 15h7"/></svg>',
    seo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5M9 11h4M11 9v4"/></svg>',
    ia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="7" width="8" height="10" rx="2"/><path d="M12 4v3M9 12h6M10 17v3M14 17v3M8 10H5M19 10h-3"/></svg>',
    automacao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 5V3m0 18v-2M5 12H3m18 0h-2M7 7l-1.5-1.5M18.5 18.5 17 17M7 17l-1.5 1.5M18.5 5.5 17 7"/></svg>',
  };

  function iconSvg(name) {
    var key = String(name || "padrao").toLowerCase();
    return ICONS[key] || ICONS.padrao;
  }

  function iconWhatsApp() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11 11 0 0 0 2.1 16.7L1 23l6.4-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.8.7.7-3.7-.2-.3A9 9 0 1 1 12 21zm5-6.7c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.1 8.1 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.3-.4.2-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.6 11.4 11.4 0 0 0 4.4 3.9 15 15 0 0 0 1.5.5 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>';
  }

  function iconPhone() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6.5 3.5h3l1.2 3.2-1.8 1.2a12 12 0 0 0 6.2 6.2l1.2-1.8 3.2 1.2v3A1.5 1.5 0 0 1 18 18 15 15 0 0 1 6 6a1.5 1.5 0 0 1 0.5-2.5z"/></svg>';
  }

  function iconInstagram() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none"/></svg>';
  }

  function iconPin() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.4-7-10a7 7 0 0 1 14 0c0 5.6-7 10-7 10z"/><circle cx="12" cy="11" r="2.2"/></svg>';
  }

  function iconClock() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>';
  }


  function iconEmail() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m5 8 7 5 7-5"/></svg>';
  }

  function fillText(attr, value) {
    $$('[data-bind="' + attr + '"]').forEach(function (el) {
      el.textContent = value == null ? "" : String(value);
    });
  }

  function applyLinks() {
    var href = waLink();
    var hasWa = href.indexOf("wa.me") !== -1;
    $$('[data-bind="whatsapp-link"]').forEach(function (el) {
      el.setAttribute("href", href);
      if (!hasWa && el.classList.contains("whatsapp-float")) el.hidden = true;
    });
  }

  function applyImages() {
    var imgs = C.imagens || {};
    var hero = $('[data-bind="hero-imagem"]');
    if (hero) {
      hero.src = imgs.hero || "";
      hero.alt = "Foto de capa de " + displayName(C.nome);
      if (!imgs.hero) hero.style.display = "none";
    }
    var sobre = $('[data-bind="sobre-imagem"]');
    if (sobre) {
      sobre.src = imgs.sobre || "";
      sobre.alt = displayName(C.nome) + " — sobre o negócio";
      if (!imgs.sobre) {
        var media = sobre.closest(".split__media");
        if (media) media.style.display = "none";
      }
    }
    var logo = $('[data-bind="logo"]');
    var mark = $('[data-bind="iniciais"]');
    if (logo && imgs.logo) {
      logo.src = imgs.logo;
      logo.alt = "Logo de " + displayName(C.nome);
      logo.hidden = false;
      if (mark) mark.hidden = true;
    } else {
      if (logo) {
        logo.removeAttribute("src");
        logo.hidden = true;
      }
      if (mark) {
        mark.hidden = false;
        mark.textContent = initials(C.nome) || "•";
      }
    }
  }

  function renderServicos() {
    var mount = $('[data-bind="servicos"]');
    if (!mount) return;
    var items = C.servicos || [];
    if (!items.length) {
      var section = document.getElementById("servicos");
      if (section) section.hidden = true;
      return;
    }
    mount.innerHTML = items
      .map(function (item) {
        return (
          '<article class="card">' +
          '<div class="card__icon" aria-hidden="true">' + iconSvg(item.icone) + "</div>" +
          "<h3>" + escapeHtml(item.titulo) + "</h3>" +
          "<p>" + escapeHtml(item.descricao) + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderDiferenciais() {
    var mount = $('[data-bind="diferenciais"]');
    if (!mount) return;
    var items = C.diferenciais || [];
    if (!items.length) {
      var section = document.getElementById("diferenciais");
      if (section) section.hidden = true;
      return;
    }
    mount.innerHTML = items
      .map(function (item) {
        return (
          '<article class="feature">' +
          '<div class="feature__icon" aria-hidden="true">' + iconSvg(item.icone) + "</div>" +
          "<h3>" + escapeHtml(item.titulo) + "</h3>" +
          "<p>" + escapeHtml(item.descricao) + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderDepoimentos() {
    var mount = $('[data-bind="depoimentos"]');
    var processMount = $('[data-bind="processo"]');
    var section = document.getElementById("depoimentos");
    var processItems = C.processo || [];
    var items = C.depoimentos || [];
    var titulos = C.textosSecoes || {};

    if (processItems.length) {
      if (mount) mount.hidden = true;
      if (processMount) {
        processMount.hidden = false;
        processMount.innerHTML = processItems
          .map(function (item, i) {
            var num = String(i + 1).padStart(2, "0");
            return (
              '<article class="process__step">' +
              '<div class="process__num" aria-hidden="true">' + num + "</div>" +
              "<h3>" + escapeHtml(item.titulo) + "</h3>" +
              "<p>" + escapeHtml(item.descricao) + "</p>" +
              "</article>"
            );
          })
          .join("");
      }
      fillText("depoimentos-titulo", titulos.depoimentosTitulo || "Como trabalhamos");
      fillText("depoimentos-eyebrow", titulos.depoimentosEyebrow || "O método");
      fillText("depoimentos-nav", titulos.depoimentosNav || "Método");
      return;
    }

    if (processMount) processMount.hidden = true;
    if (!mount) return;
    if (!items.length) {
      if (section) section.hidden = true;
      return;
    }
    if (titulos.depoimentosTitulo) fillText("depoimentos-titulo", titulos.depoimentosTitulo);
    if (titulos.depoimentosEyebrow) fillText("depoimentos-eyebrow", titulos.depoimentosEyebrow);
    if (titulos.depoimentosNav) fillText("depoimentos-nav", titulos.depoimentosNav);
    mount.innerHTML = items
      .map(function (item) {
        return (
          "<figure class=\"quote\">" +
          "<blockquote><p>" + escapeHtml(item.texto) + "</p></blockquote>" +
          "<footer><strong>" + escapeHtml(item.nome) + "</strong>" +
          (item.cargo ? "<span>" + escapeHtml(item.cargo) + "</span>" : "") +
          "</footer></figure>"
        );
      })
      .join("");
  }

  function renderGaleria() {
    var mount = $('[data-bind="galeria"]');
    if (!mount) return;
    var raw = (C.imagens && C.imagens.galeria) || [];
    var items = raw.map(function (item) {
      if (typeof item === "string") return { src: item, alt: "Foto de " + displayName(C.nome) };
      return { src: item.src, alt: item.alt || "Foto de " + displayName(C.nome) };
    }).filter(function (item) { return item.src; });

    if (!items.length) {
      var section = document.getElementById("galeria");
      if (section) section.hidden = true;
      var nav = document.querySelector('a[href="#galeria"]');
      if (nav) {
        var li = nav.closest("li");
        if (li) li.hidden = true;
        else nav.hidden = true;
      }
      return;
    }

    mount.innerHTML = items
      .map(function (item, i) {
        return (
          '<button type="button" data-full="' + escapeHtml(item.src) + '" aria-label="' + escapeHtml(item.alt) + '">' +
          '<img src="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.alt) + '" loading="' + (i < 2 ? "eager" : "lazy") + '">' +
          "</button>"
        );
      })
      .join("");
  }

  function renderMapa() {
    var mount = $('[data-bind="mapa"]');
    if (!mount) return;
    var src = mapsSrc();
    if (!src) return;
    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = "Mapa de localização de " + displayName(C.nome);
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    mount.innerHTML = "";
    mount.appendChild(iframe);
  }

  function renderContato() {
    var mount = $('[data-bind="contato"]');
    if (!mount) return;
    var parts = [];

    function contactBlock(tag, href, icon, label, value) {
      var open = href
        ? "<" + tag + ' class="contact__item" href="' + escapeHtml(href) + '"' + (tag === "a" && href.indexOf("http") === 0 ? ' target="_blank" rel="noopener noreferrer"' : "") + ">"
        : '<div class="contact__item">';
      var close = href ? "</" + tag + ">" : "</div>";
      return (
        open +
        '<span class="contact__icon" aria-hidden="true">' + icon + "</span>" +
        '<div><span class="contact__label">' + label + "</span><strong>" + escapeHtml(value) + "</strong></div>" +
        close
      );
    }

    if (C.whatsapp || C.telefone) {
      var wa = waLink();
      var waHref = wa.indexOf("wa.me") !== -1 ? wa : "";
      parts.push(contactBlock(waHref ? "a" : "div", waHref, iconWhatsApp(), "WhatsApp", C.telefone || C.whatsapp || ""));
    }
    if (C.telefone) {
      var tel = telHref();
      parts.push(contactBlock(tel ? "a" : "div", tel, iconPhone(), "Telefone", C.telefone));
    }
    if (C.email && !isPlaceholder(C.email)) {
      parts.push(contactBlock("a", "mailto:" + C.email, iconEmail(), "E-mail", C.email));
    }
    if (C.instagram) {
      var ig = instagramUrl();
      parts.push(contactBlock(ig ? "a" : "div", ig, iconInstagram(), "Instagram", instagramLabel()));
    }
    if (C.endereco && !isPlaceholder(C.endereco)) {
      parts.push(
        '<div class="contact__item">' +
        '<span class="contact__icon" aria-hidden="true">' + iconPin() + "</span>" +
        "<div><span class=\"contact__label\">Endereço</span><strong>" + escapeHtml(C.endereco) + "</strong></div></div>"
      );
    }
    if (C.horarios && C.horarios.length) {
      var hours = C.horarios
        .map(function (h) {
          return "<li><span>" + escapeHtml(h.dias) + "</span><strong>" + escapeHtml(h.horario) + "</strong></li>";
        })
        .join("");
      parts.push(
        '<div class="contact__item">' +
        '<span class="contact__icon" aria-hidden="true">' + iconClock() + "</span>" +
        "<div><span class=\"contact__label\">Horário</span><ul class=\"horarios\">" + hours + "</ul></div></div>"
      );
    }
    mount.innerHTML = parts.join("");
  }

  function setupNav() {
    var toggle = $(".nav-toggle");
    var nav = $("#menu-principal");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
    }

    function open() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Fechar menu");
    }

    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) close();
      else open();
    });

    nav.addEventListener("click", function (ev) {
      var a = ev.target.closest("a");
      if (a) close();
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") close();
    });
  }

  function setupLightbox() {
    var box = $(".lightbox");
    if (!box) return;
    var img = $("img", box);
    var closeBtn = $(".lightbox__close", box);

    function close() {
      box.hidden = true;
      if (img) img.removeAttribute("src");
    }

    function open(src, alt) {
      if (!img) return;
      img.src = src;
      img.alt = alt || "";
      box.hidden = false;
      if (closeBtn) closeBtn.focus();
    }

    document.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".gallery button");
      if (!btn) return;
      ev.preventDefault();
      open(btn.getAttribute("data-full"), $("img", btn) ? $("img", btn).alt : "");
    });

    box.addEventListener("click", function (ev) {
      if (ev.target === box || ev.target === closeBtn) close();
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !box.hidden) close();
    });
  }

  function init() {
    applyTheme();
    applySeo();
    applyFavicon();
    applyLinks();
    applyImages();

    fillText("nome", C.nome);
    fillText("iniciais", initials(C.nome) || "•");
    fillText("headline", C.headline || displayName(C.nome));
    fillText("subheadline", C.subheadline || "");
    fillText("cta-texto", C.ctaTexto || "Falar no WhatsApp");
    fillText("sobre-titulo", C.sobreTitulo || "Nossa história");
    fillText("sobre", C.sobre || "");
    fillText("endereco", (C.endereco && !isPlaceholder(C.endereco)) ? C.endereco : "");
    fillText("atendimento", C.atendimento || "Atendimento remoto em todo o Brasil");
    fillText("ano", String(new Date().getFullYear()));
    fillText("agencia", (C.agencia && C.agencia.nome) || "Trillion Ferrara");
    fillText("agencia-cidade", (C.agencia && C.agencia.cidade) || "Maringá-PR");

    var chip = [C.segmento, C.cidade].filter(Boolean).join(" · ");
    fillText("segmento-cidade", chip);

    renderServicos();
    renderDiferenciais();
    renderDepoimentos();
    renderGaleria();
    renderMapa();
    renderContato();
    setupNav();
    setupLightbox();
    setupReveal();
  }

  function setupReveal() {
    var nodes = document.querySelectorAll(".section, .section__head, .card, .feature, .quote, .process__step, .split__media, .split__body, .gallery, .map, .contact__item, .footer__inner");
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Array.prototype.forEach.call(nodes, function (el) { el.classList.add("is-visible"); });
      return;
    }
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 0px 0px" });
    Array.prototype.forEach.call(nodes, function (el, i) {
      var rect = el.getBoundingClientRect();
      var inView = rect.top < vh && rect.bottom > 0;
      if (inView) {
        el.classList.add("is-visible");
        return;
      }
      el.classList.add("reveal");
      if (el.classList.contains("card") || el.classList.contains("feature") || el.classList.contains("quote") || el.classList.contains("process__step") || el.classList.contains("contact__item")) {
        el.style.transitionDelay = ((i % 4) * 70) + "ms";
      }
      io.observe(el);
    });
    setTimeout(function () {
      Array.prototype.forEach.call(nodes, function (el) {
        el.classList.add("is-visible");
      });
    }, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
