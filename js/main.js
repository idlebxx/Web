/* =========================================================
   🚀  Main.js — الوظائف التفاعلية للموقع
   ========================================================= */

(function() {
  'use strict';

  const cfg = window.SITE_CONFIG || {};

  // ============= تحميل الإعدادات في DOM =============
  function applyConfig() {
    if (cfg.company) {
      const c = cfg.company;
      const hero = document.getElementById('heroCompanyName');
      const desc = document.getElementById('heroDesc');
      const emailEl = document.getElementById('footerEmail');
      const phoneEl = document.getElementById('footerPhone');
      const addrEl  = document.getElementById('footerAddress');
      const compEl  = document.getElementById('footerCompany');
      if (hero) hero.textContent = c.name;
      if (desc) desc.textContent = c.description;
      if (emailEl) emailEl.textContent = c.email;
      if (phoneEl) phoneEl.textContent = c.phone;
      if (addrEl)  addrEl.textContent  = c.address;
      if (compEl)  compEl.textContent  = c.name;
    }

    if (cfg.stats) {
      document.querySelectorAll('.stat-number').forEach(el => {
        const key = el.parentElement.querySelector('.stat-label')?.textContent || '';
        let val = 0;
        if (key.includes('عميل'))       val = cfg.stats.clients;
        else if (key.includes('مشروع'))  val = cfg.stats.projects;
        else if (key.includes('جائزة'))  val = cfg.stats.awards;
        else if (key.includes('خبرة'))   val = cfg.stats.years;
        el.setAttribute('data-target', val);
      });
    }

    if (cfg.social) {
      document.querySelectorAll('[data-social]').forEach(el => {
        const k = el.getAttribute('data-social');
        if (cfg.social[k]) el.setAttribute('href', cfg.social[k]);
      });
    }

    if (cfg.followers) {
      document.querySelectorAll('[data-follow]').forEach(el => {
        const k = el.getAttribute('data-follow');
        if (cfg.followers[k]) el.textContent = cfg.followers[k] + ' متابع';
      });
    }

    const yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  // ============= تأثير الكتابة (Typing) =============
  function initTyping() {
    const el = document.getElementById('typed');
    if (!el) return;
    const words = ['تجربة رقمية', 'موقع احترافي', 'تطبيق مبتكر', 'حلول متكاملة', 'مستقبل باهر'];
    let wi = 0, ci = 0, deleting = false;

    function tick() {
      const word = words[wi];
      if (!deleting) {
        el.textContent = word.slice(0, ++ci);
        if (ci === word.length) { deleting = true; setTimeout(tick, 1800); return; }
      } else {
        el.textContent = word.slice(0, --ci);
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
      }
      setTimeout(tick, deleting ? 50 : 110);
    }
    tick();
  }

  // ============= شاشة التحميل =============
  function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => loader.classList.add('hide'), 600);
    }
  }

  // ============= شريط التنقل =============
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const menuBtn = document.getElementById('menuToggle');
    const links   = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) navbar?.classList.add('scrolled');
      else navbar?.classList.remove('scrolled');
    });

    menuBtn?.addEventListener('click', () => {
      links?.classList.toggle('open');
      const icon = menuBtn.querySelector('i');
      if (links.classList.contains('open')) icon.className = 'fas fa-times';
      else icon.className = 'fas fa-bars';
    });

    // إغلاق القائمة عند الضغط على رابط
    links?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        const icon = menuBtn?.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });

    // إبراز الرابط النشط
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(sec => {
        const top = sec.offsetTop - 120;
        if (window.scrollY >= top) current = sec.id;
      });
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    });
  }

  // ============= تبديل الوضع (داكن/فاتح) =============
  function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const saved = localStorage.getItem('theme');
    if (saved === 'light') document.body.classList.add('light-mode');

    btn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      const icon = btn.querySelector('i');
      icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
    });
  }

  // ============= تبديل اللغة (عربي/إنجليزي) =============
  function initLangToggle() {
    const btn = document.getElementById('langToggle');
    if (!btn) return;
    const html = document.documentElement;

    btn.addEventListener('click', () => {
      const isAr = html.lang === 'ar';
      html.lang = isAr ? 'en' : 'ar';
      html.dir  = isAr ? 'ltr' : 'rtl';
      btn.innerHTML = isAr ? '<i class="fas fa-language"></i>' : '<i class="fas fa-language"></i>';
    });
  }

  // ============= العداد المتحرك =============
  function initCounters() {
    const numbers = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.done) {
          entry.target.dataset.done = '1';
          const target = +entry.target.getAttribute('data-target') || 0;
          const duration = 1800;
          const startTime = performance.now();
          function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            entry.target.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(step);
            else entry.target.textContent = target;
          }
          requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.4 });
    numbers.forEach(n => observer.observe(n));
  }

  // ============= سلايدر آراء العملاء =============
  function initTestimonialSlider() {
    const track = document.getElementById('testimonialTrack');
    if (!track) return;
    const cards = track.querySelectorAll('.testimonial-card');
    const prev  = document.getElementById('prevTestimonial');
    const next  = document.getElementById('nextTestimonial');
    let idx = 0;
    const total = cards.length;

    function goTo(i) {
      idx = (i + total) % total;
      track.style.transform = `translateX(${idx * 100}%)`;
    }
    prev?.addEventListener('click', () => goTo(idx - 1));
    next?.addEventListener('click', () => goTo(idx + 1));

    // تشغيل تلقائي
    let auto = setInterval(() => goTo(idx + 1), 5000);
    track.parentElement.addEventListener('mouseenter', () => clearInterval(auto));
    track.parentElement.addEventListener('mouseleave', () => {
      auto = setInterval(() => goTo(idx + 1), 5000);
    });
  }

  // ============= زر العودة للأعلى =============
  function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) btn.classList.add('show');
      else btn.classList.remove('show');
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ============= نسخ رابط =============
  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = btn.getAttribute('data-link');
        const link = cfg.social?.[key] || '';
        if (!link) return;
        navigator.clipboard.writeText(link).then(() => {
          showToast('تم نسخ الرابط ✓', 'success');
          const oldText = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ';
          setTimeout(() => { btn.innerHTML = oldText; }, 1800);
        });
      });
    });
  }

  // ============= تبديل حقل تفاصيل الخبرة =============
  function initExperienceToggle() {
    const sel = document.getElementById('hasExperience');
    const wrap = document.getElementById('experienceDetailsWrap');
    if (!sel || !wrap) return;
    sel.addEventListener('change', () => {
      wrap.style.display = sel.value === 'yes' ? 'block' : 'none';
    });
  }

  // ============= Parallax بسيط على الماوس =============
  function initParallax() {
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual) return;
    document.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 992) return;
      const x = (e.clientX / window.innerWidth  - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      heroVisual.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
    });
  }

  // ============= AOS Init =============
  function initAOS() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 60
      });
    }
  }

  // ============= Toast =============
  function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.className = 'toast ' + type;
    const icon = type === 'success' ? 'fa-check-circle'
              : type === 'error'   ? 'fa-times-circle'
              : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }
  window.showToast = showToast;

  // ============= التشغيل عند الجاهزية =============
  document.addEventListener('DOMContentLoaded', () => {
    applyConfig();
    initTyping();
    initNavbar();
    initThemeToggle();
    initLangToggle();
    initCounters();
    initTestimonialSlider();
    initScrollTop();
    initCopyButtons();
    initExperienceToggle();
    initParallax();
    initAOS();
    hideLoader();
  });
})();
