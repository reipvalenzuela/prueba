(() => {
  "use strict";

  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector("#nav-links");
  const courseViewport = document.querySelector("#course-viewport");
  const courseTrack = document.querySelector("#course-track");
  const courseCards = [...document.querySelectorAll(".course-card")];
  const filterButtons = [...document.querySelectorAll(".filter-chip")];
  const backToTop = document.querySelector("#back-to-top");
  const signupForm = document.querySelector("#signup-form");
  const submitButton = document.querySelector("#submit-button");
  const formStatus = document.querySelector("#form-status");
  let currentFilter = "Todos";
  let isSubmitting = false;

  function closeMenu() {
    if (!menuToggle || !navLinks) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
    navLinks.classList.remove("open");
  }

  function toggleMenu() {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Abrir menú" : "Cerrar menú");
    navLinks.classList.toggle("open", !isOpen);
  }

  menuToggle?.addEventListener("click", toggleMenu);
  navLinks?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu();
      menuToggle?.focus();
    }
  });
  document.addEventListener("click", event => {
    if (navLinks?.classList.contains("open") &&
        !navLinks.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMenu();
    updateCarouselButtons();
  });

  function visibleCards() {
    return courseCards.filter(card => !card.hidden);
  }

  function getCardStep() {
    const first = visibleCards()[0];
    if (!first) return 0;
    const second = visibleCards()[1];
    if (!second) return first.getBoundingClientRect().width;
    return second.offsetLeft - first.offsetLeft;
  }

  function updateCarouselButtons() {
    const cards = visibleCards();
    const prev = document.querySelector("#prev-course");
    const next = document.querySelector("#next-course");
    if (!prev || !next || !courseViewport) return;
    const maxScroll = Math.max(0, courseViewport.scrollWidth - courseViewport.clientWidth);
    prev.disabled = courseViewport.scrollLeft <= 2;
    next.disabled = courseViewport.scrollLeft >= maxScroll - 2;
    prev.setAttribute("aria-disabled", String(prev.disabled));
    next.setAttribute("aria-disabled", String(next.disabled));
    prev.style.opacity = prev.disabled ? ".45" : "1";
    next.style.opacity = next.disabled ? ".45" : "1";
    if (cards.length <= 1) {
      prev.disabled = true;
      next.disabled = true;
    }
  }

  function moveCarousel(direction) {
    if (!courseViewport) return;
    const step = getCardStep() || courseViewport.clientWidth * 0.8;
    courseViewport.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  document.querySelector("#prev-course")?.addEventListener("click", () => moveCarousel(-1));
  document.querySelector("#next-course")?.addEventListener("click", () => moveCarousel(1));
  courseViewport?.addEventListener("scroll", updateCarouselButtons, { passive: true });
  courseViewport?.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") { event.preventDefault(); moveCarousel(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); moveCarousel(-1); }
  });

  function applyFilter(category) {
    currentFilter = category;
    courseCards.forEach(card => {
      card.hidden = category !== "Todos" && card.dataset.category !== category;
    });
    filterButtons.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (courseViewport) courseViewport.scrollTo({ left: 0, behavior: "smooth" });
    requestAnimationFrame(updateCarouselButtons);
  }

  filterButtons.forEach(button => button.addEventListener("click", () => applyFilter(button.dataset.filter)));
  document.querySelectorAll(".category-card[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.category);
      document.querySelector("#cursos")?.scrollIntoView({ behavior: "smooth" });
    });
  });
  document.querySelectorAll("[data-footer-filter]").forEach(link => {
    link.addEventListener("click", () => applyFilter(link.dataset.footerFilter));
  });

  // Animaciones progresivas; el contenido sigue visible si IntersectionObserver no está disponible.
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  function updateScrollUI() {
    backToTop?.classList.toggle("visible", window.scrollY > 450);
  }
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  backToTop?.addEventListener("click", () => document.querySelector("#inicio")?.scrollIntoView({ behavior: "smooth" }));
  document.querySelector("#current-year").textContent = new Date().getFullYear();

  function setError(field, message) {
    const error = document.querySelector(`#${field}-error`);
    if (error) error.textContent = message;
    const input = signupForm.elements[field];
    if (input && input.type !== "checkbox") {
      input.setAttribute("aria-invalid", String(Boolean(message)));
    }
  }

  function validateForm() {
    const email = signupForm.elements.email.value.trim();
    const consent = signupForm.elements.consent.checked;
    let valid = true;
    setError("email", "");
    setError("consent", "");
    formStatus.textContent = "";
    formStatus.classList.remove("error");

    if (!email) {
      setError("email", "Ingresa tu correo electrónico.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("email", "Ingresa un correo electrónico válido.");
      valid = false;
    }
    if (!consent) {
      setError("consent", "Debes aceptar el consentimiento para continuar.");
      valid = false;
    }
    return valid;
  }

  // Punto de integración futuro: conectar aquí una API REST o servicio de suscripción.
  // Esta demo no transmite ni almacena los datos.
  async function subscribeUser(payload) {
    await new Promise(resolve => window.setTimeout(resolve, 450));
    return { demo: true, email: payload.email };
  }

  signupForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (isSubmitting || !validateForm()) {
      if (!isSubmitting) signupForm.querySelector('[aria-invalid="true"], #consent')?.focus();
      return;
    }
    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Validando...";
    formStatus.classList.remove("error");
    try {
      const payload = {
        name: signupForm.elements.name.value.trim(),
        email: signupForm.elements.email.value.trim(),
        consent: signupForm.elements.consent.checked
      };
      await subscribeUser(payload);
      formStatus.textContent = "Validación completada. Esta demostración no envió ni guardó tus datos.";
      signupForm.reset();
      setError("email", "");
      setError("consent", "");
    } catch (error) {
      formStatus.textContent = "No se pudo completar la solicitud. Inténtalo nuevamente.";
      formStatus.classList.add("error");
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.innerHTML = 'Quiero recibir novedades <span aria-hidden="true">→</span>';
    }
  });

  ["email", "consent"].forEach(field => {
    const control = signupForm?.elements[field];
    control?.addEventListener("change", () => {
      if (field === "email" && control.value.trim()) setError("email", "");
      if (field === "consent" && control.checked) setError("consent", "");
    });
  });

  updateCarouselButtons();
  updateScrollUI();
})();
