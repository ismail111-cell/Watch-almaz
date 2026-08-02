/* ==========================================================================
   ALMAZ WATCH — app.js
   Вся логика сайта: подключение к Supabase, загрузка товаров и отзывов,
   фильтры каталога, мобильное меню, анимации (Intersection Observer,
   ripple-эффект, частицы, счётчики статистики).
   Подключается на всех страницах через <script type="module" src="app.js">.
   ========================================================================== */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/* ---------- Настройки подключения к Supabase ---------- */
/* ВАЖНО: здесь используется только публичный anon-ключ.
   Никогда не храните здесь service_role ключ — он даёт полный доступ к базе. */
const SUPABASE_URL = 'https://kfjknmlgiodghtgzbyfd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6aBgxKYTS5euAUVq8ZAYpw_dxw6LKc3';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Ссылка на Telegram-бота для оформления заказа и канал бренда */
const BOT_URL = 'https://t.me/almazwatchbot';
const CHANNEL_URL = 'https://t.me/almaz_watch';

/* Ключи localStorage — единое место, чтобы не разбросать по коду */
const LS_KEYS = {
  theme: 'almaz_theme',
  recentlyViewed: 'almaz_recently_viewed',
  achievements: 'almaz_achievements',
  productsCache: 'almaz_products_cache',
  reviewsCache: 'almaz_reviews_cache',
  soundEnabled: 'almaz_sound_enabled',
};

/* ==========================================================================
   1. МОБИЛЬНОЕ МЕНЮ (бургер)
   ========================================================================== */
function initMobileMenu() {
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.mobile-menu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Закрываем меню при клике на любую ссылку внутри него
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ==========================================================================
   2.0 ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ (тёмная / светлая, с сохранением выбора)
   ========================================================================== */
function initThemeToggle() {
  const saved = localStorage.getItem(LS_KEYS.theme);
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    updateThemeIcon(btn);
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      if (next === 'dark') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(LS_KEYS.theme, next);
      document.querySelectorAll('.theme-toggle').forEach(updateThemeIcon);
    });
  });
}

function updateThemeIcon(btn) {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  btn.textContent = isLight ? '🌙' : '☀️';
  btn.setAttribute('aria-label', isLight ? 'Включить тёмную тему' : 'Включить светлую тему');
}

/* ==========================================================================
   2.1 ШАПКА: СЖАТИЕ И СКРЫТИЕ ПРИ СКРОЛЛЕ
   ========================================================================== */
function initSmartHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let lastY = window.scrollY;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);

    // скрываем при скролле вниз, показываем при скролле вверх
    if (y > lastY && y > 160) {
      header.classList.add('hide-on-scroll');
    } else {
      header.classList.remove('hide-on-scroll');
    }
    lastY = y;
  }, { passive: true });
}

/* ==========================================================================
   2.2 ПАРАЛЛАКС В ГЕРОЕ (реагирует на движение мыши)
   ========================================================================== */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  const clockWrap = document.querySelector('.clock-wrap');
  if (!hero || !clockWrap || window.matchMedia('(pointer: coarse)').matches) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    clockWrap.style.transform = `translate(${relX * -18}px, ${relY * -18}px)`;
  });

  hero.addEventListener('mouseleave', () => {
    clockWrap.style.transform = 'translate(0, 0)';
  });
}

/* ==========================================================================
   2.3 ЧАСЫ: ПЕРЕТАСКИВАНИЕ В 3D + СМЕНА ЦВЕТА ПО КЛИКУ
   ========================================================================== */
function initInteractiveClocks() {
  const colors = ['gold', 'red', 'blue', 'green'];

  document.querySelectorAll('.clock').forEach((clock) => {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let rotY = -10;
    let rotX = 10;
    let colorIndex = 0;
    let movedDuringDrag = false;

    const applyRotation = () => {
      clock.style.transform = `perspective(800px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    };

    const pointerDown = (x, y) => {
      dragging = true;
      movedDuringDrag = false;
      startX = x;
      startY = y;
    };

    const pointerMove = (x, y) => {
      if (!dragging) return;
      movedDuringDrag = true;
      rotY = Math.max(-45, Math.min(45, -10 + (x - startX) * 0.3));
      rotX = Math.max(-30, Math.min(30, 10 - (y - startY) * 0.3));
      applyRotation();
    };

    const pointerUp = () => {
      dragging = false;
    };

    clock.addEventListener('mousedown', (e) => pointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => pointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', pointerUp);

    clock.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      pointerDown(t.clientX, t.clientY);
    }, { passive: true });
    clock.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      pointerMove(t.clientX, t.clientY);
    }, { passive: true });
    clock.addEventListener('touchend', pointerUp);

    // Клик (без перетаскивания) меняет цвет стрелок
    clock.addEventListener('click', () => {
      if (movedDuringDrag) return;
      clock.classList.remove(...colors.map((c) => `color-${c}`));
      colorIndex = (colorIndex + 1) % colors.length;
      if (colors[colorIndex] !== 'gold') clock.classList.add(`color-${colors[colorIndex]}`);
      playClickSound();
      triggerHaptic();
    });
  });
}

/* ==========================================================================
   2.4 ЗВУК И ВИБРАЦИЯ (лёгкий, честный фидбек — без внешних аудиофайлов)
   ========================================================================== */

// Генерируем короткий "тик" через Web Audio API — без загрузки mp3-файлов.
// Звук включён по умолчанию выключен, чтобы не раздражать; переключается вместе с темой при желании расширить UI.
let audioCtx = null;

function playClickSound() {
  if (localStorage.getItem(LS_KEYS.soundEnabled) !== 'on') return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    /* Web Audio недоступен — просто пропускаем звук */
  }
}

// Вибрация поддерживается только в Chrome/Android — в Safari/iOS API отсутствует,
// поэтому оборачиваем в проверку, чтобы не бросать ошибку на iPhone.
function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(12);
  }
}

/* ==========================================================================
   2.5 КНОПКА "НАВЕРХ"
   ========================================================================== */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ==========================================================================
   RIPPLE-ЭФФЕКТ НА КНОПКАХ (волна при клике)
   ========================================================================== */
function initRipple() {
  document.querySelectorAll('.btn, .filter-btn, .product-order-btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/* ==========================================================================
   3. ПОЯВЛЕНИЕ ЭЛЕМЕНТОВ ПРИ СКРОЛЛЕ (Intersection Observer + fade-up)
   ========================================================================== */
function initScrollReveal(root = document) {
  const items = root.querySelectorAll('.reveal:not(.visible)');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // небольшая задержка по индексу — карточки "выстраиваются" друг за другом
          const delay = (entry.target.dataset.delay || 0) * 1;
          setTimeout(() => entry.target.classList.add('visible'), delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((item, index) => {
    item.dataset.delay = String((index % 4) * 90);
    observer.observe(item);
  });
}

/* ==========================================================================
   4. ЗОЛОТЫЕ ЧАСТИЦЫ НА ФОНЕ ГЕРОЯ
   ========================================================================== */
function initParticles() {
  const wrap = document.querySelector('.hero-particles');
  if (!wrap) return;
  const count = window.innerWidth < 700 ? 16 : 30;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.bottom = `${Math.random() * -20}%`;
    p.style.animationDuration = `${8 + Math.random() * 10}s`;
    p.style.animationDelay = `${Math.random() * 10}s`;
    wrap.appendChild(p);
  }
}

/* ==========================================================================
   5. ЧАСОВАЯ ШКАЛА (деления на циферблате часов)
   ========================================================================== */
function initClockTicks() {
  document.querySelectorAll('.clock-face').forEach((face) => {
    if (face.dataset.ticksReady) return;
    for (let i = 0; i < 12; i++) {
      const tick = document.createElement('span');
      tick.className = 'clock-tick' + (i % 3 === 0 ? ' major' : '');
      tick.style.transform = `translateX(-50%) rotate(${i * 30}deg)`;
      face.appendChild(tick);
    }
    face.dataset.ticksReady = 'true';
  });
}

/* ==========================================================================
   6. ЧИСЛОВАЯ АНИМАЦИЯ СТАТИСТИКИ (нарастание чисел при появлении)
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutQuad — плавное замедление к концу
      const eased = 1 - (1 - progress) * (1 - progress);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => observer.observe(c));
}

/* ==========================================================================
   7. УТИЛИТЫ РЕНДЕРИНГА
   ========================================================================== */

// Экранирование текста, чтобы данные из базы не ломали вёрстку
function escapeHtml(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function starsHtml(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function productCardHtml(product, index) {
  const img = product.image
    ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">`
    : '';
  return `
    <article class="product-card reveal" data-category="${escapeHtml(product.category || '')}">
      <div class="product-media">
        ${img}
        <span class="product-category">${escapeHtml(product.category || 'Custom')}</span>
      </div>
      <div class="product-body">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description || '')}</p>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          <a class="product-order-btn" target="_blank" rel="noopener"
             href="${BOT_URL}?start=product_${encodeURIComponent(product.id)}"
             aria-label="Заказать ${escapeHtml(product.name)} в Telegram">
             Заказать →
          </a>
        </div>
      </div>
    </article>`;
}

function reviewCardHtml(review) {
  const avatar = review.image
    ? `<img class="review-avatar" src="${escapeHtml(review.image)}" alt="${escapeHtml(review.name)}" loading="lazy">`
    : `<span class="review-avatar-fallback" aria-hidden="true">${escapeHtml(initialsOf(review.name))}</span>`;

  return `
    <article class="review-card reveal">
      <div class="review-top">
        ${avatar}
        <div>
          <div class="review-name">${escapeHtml(review.name)}</div>
          <div class="review-stars" aria-label="Оценка ${review.rating} из 5">${starsHtml(review.rating)}</div>
        </div>
      </div>
      <p class="review-text">${escapeHtml(review.text)}</p>
    </article>`;
}

function skeletonProductsHtml(count = 4) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="skeleton-card">
        <div class="skeleton-media"></div>
        <div class="skeleton-lines">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>`
    )
    .join('');
}

function skeletonReviewsHtml(count = 3) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="skeleton-review">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-line" style="width:100px;"></div>
        </div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>`
    )
    .join('');
}

function stateBoxHtml(type, message) {
  if (type === 'loading') {
    return `<div class="state-box"><div class="loader"></div><p>${escapeHtml(message)}</p></div>`;
  }
  if (type === 'error') {
    return `<div class="state-box error"><p>⚠️ ${escapeHtml(message)}</p></div>`;
  }
  return `<div class="state-box"><p>${escapeHtml(message)}</p></div>`;
}

/* ==========================================================================
   7.1 "НЕДАВНО ПРОСМОТРЕННЫЕ" (честный localStorage, без выдумок)
   ========================================================================== */
function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.recentlyViewed) || '[]');
  } catch {
    return [];
  }
}

function addRecentlyViewed(product) {
  let list = getRecentlyViewed().filter((p) => p.id !== product.id);
  list.unshift({ id: product.id, name: product.name, image: product.image, price: product.price });
  list = list.slice(0, 6);
  localStorage.setItem(LS_KEYS.recentlyViewed, JSON.stringify(list));
}

function renderRecentlyViewedBanner() {
  const banner = document.querySelector('.recent-banner');
  const strip = document.querySelector('.recent-strip');
  if (!banner || !strip) return;

  const list = getRecentlyViewed();
  if (list.length === 0) {
    banner.classList.remove('has-items');
    return;
  }

  banner.classList.add('has-items');
  strip.innerHTML = list
    .map(
      (p) => `
      <div class="recent-chip" data-product-id="${escapeHtml(String(p.id))}">
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">` : ''}
        <div class="recent-chip-name">${escapeHtml(p.name)}</div>
      </div>`
    )
    .join('');

  strip.querySelectorAll('.recent-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.productId;
      const product = (allProductsCache || []).find((p) => String(p.id) === id) ||
        list.find((p) => String(p.id) === id);
      if (product) openQuickView(product);
    });
  });
}

/* ==========================================================================
   7.2 ДОСТИЖЕНИЯ (лёгкая геймификация на основе реальных действий пользователя —
   никаких выдуманных цифр, только то, что человек правда сделал в этой сессии)
   ========================================================================== */
const ACHIEVEMENTS = {
  first_view: { label: '🔎 Первый просмотр товара', check: (s) => s.viewedIds.length >= 1 },
  browsed_5: { label: '👀 Просмотрено 5 моделей', check: (s) => s.viewedIds.length >= 5 },
  shared: { label: '📤 Поделились товаром', check: (s) => s.shared },
};

function getAchievementsState() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.achievements) || '{"viewedIds":[],"shared":false,"unlocked":[]}');
  } catch {
    return { viewedIds: [], shared: false, unlocked: [] };
  }
}

function saveAchievementsState(state) {
  localStorage.setItem(LS_KEYS.achievements, JSON.stringify(state));
}

function registerProductView(productId) {
  const state = getAchievementsState();
  if (!state.viewedIds.includes(productId)) state.viewedIds.push(productId);
  checkAchievements(state);
}

function registerShare() {
  const state = getAchievementsState();
  state.shared = true;
  checkAchievements(state);
}

function checkAchievements(state) {
  Object.entries(ACHIEVEMENTS).forEach(([key, ach]) => {
    if (!state.unlocked.includes(key) && ach.check(state)) {
      state.unlocked.push(key);
      showAchievementToast(ach.label);
    }
  });
  saveAchievementsState(state);
}

function showAchievementToast(label) {
  let toast = document.querySelector('.achievement-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'achievement-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = label;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

/* ==========================================================================
   7.3 ШАРИНГ ТОВАРА В TELEGRAM (готовый текст + ссылка)
   ========================================================================== */
function shareProduct(product) {
  const text = `Смотри какие часы нашёл в Almaz Watch: «${product.name}» за ${formatPrice(product.price)} ⌚\n${BOT_URL}?start=product_${product.id}`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(BOT_URL + '?start=product_' + product.id)}&text=${encodeURIComponent(text)}`;
  window.open(shareUrl, '_blank', 'noopener');
  registerShare();
}

/* ==========================================================================
   7.4 БЫСТРЫЙ ПРОСМОТР ТОВАРА (модальное окно)
   ========================================================================== */
function ensureQuickViewModal() {
  let overlay = document.querySelector('.modal-overlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="Закрыть">✕</button>
      <div class="modal-media"></div>
      <div class="modal-body"></div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeQuickView();
  });
  overlay.querySelector('.modal-close').addEventListener('click', closeQuickView);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeQuickView();
  });

  return overlay;
}

function openQuickView(product) {
  const overlay = ensureQuickViewModal();
  overlay.querySelector('.modal-media').innerHTML = product.image
    ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">`
    : '';

  overlay.querySelector('.modal-body').innerHTML = `
    <span class="product-category">${escapeHtml(product.category || 'Custom')}</span>
    <h3>${escapeHtml(product.name)}</h3>
    <p>${escapeHtml(product.description || '')}</p>
    <div class="modal-price">${formatPrice(product.price)}</div>
    <div class="modal-views" data-views-for="${escapeHtml(String(product.id))}">
      ${typeof product.views === 'number' ? `👁 ${product.views} просмотров` : ''}
    </div>
    <div class="modal-actions">
      <a class="btn btn-primary" target="_blank" rel="noopener" href="${BOT_URL}?start=product_${encodeURIComponent(product.id)}">📩 Заказать в Telegram</a>
      <button class="btn btn-outline" data-share-btn>📤 Поделиться</button>
    </div>`;

  overlay.querySelector('[data-share-btn]').addEventListener('click', () => shareProduct(product));

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  addRecentlyViewed(product);
  renderRecentlyViewedBanner();
  registerProductView(product.id);
  incrementProductView(product.id);
}

function closeQuickView() {
  const overlay = document.querySelector('.modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function attachQuickViewHandlers(container, sourceList) {
  container.querySelectorAll('.product-card').forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.product-order-btn')) return; // не открываем модалку при клике по кнопке заказа
      const product = sourceList[i];
      if (product) openQuickView(product);
    });
  });
}

/* ==========================================================================
   7.5 СЧЁТЧИК ПРОСМОТРОВ ТОВАРА (настоящий, через Supabase RPC/update —
   если в таблице products нет столбца views, эта функция просто тихо
   ничего не делает и не ломает сайт)
   ========================================================================== */
async function incrementProductView(productId) {
  try {
    await supabase.rpc('increment_product_views', { product_id: productId });
  } catch (err) {
    // Если функция increment_product_views не создана в Supabase — просто игнорируем.
    // Это НЕ ошибка сайта, счётчик — необязательная фича (см. README).
  }
}

/* ==========================================================================
   7.6 ЛОКАЛЬНОЕ КЕШИРОВАНИЕ ДЛЯ ОФЛАЙН-ПОКАЗА
   ========================================================================== */
function cacheData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* переполнение localStorage — не критично, просто не кешируем */
  }
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch {
    return null;
  }
}

/* ==========================================================================
   8. ГЛАВНАЯ СТРАНИЦА: последние 4 товара + 3 отзыва
   ========================================================================== */
async function loadHomeProducts() {
  const grid = document.querySelector('#home-products-grid');
  if (!grid) return;

  grid.innerHTML = skeletonProductsHtml(4);

  try {
    // Сначала пробуем получить товары с featured = true
    let { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .order('id', { ascending: false })
      .limit(4);

    if (error) throw error;

    // Если товаров с featured нет — просто берём последние 4
    if (!data || data.length === 0) {
      const fallback = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false })
        .limit(4);
      if (fallback.error) throw fallback.error;
      data = fallback.data;
    }

    if (!data || data.length === 0) {
      grid.innerHTML = stateBoxHtml('empty', 'Пока нет добавленных товаров. Загляните позже!');
      return;
    }

    cacheData('almaz_home_products', data);
    grid.innerHTML = data.map(productCardHtml).join('');
    initScrollReveal(grid);
    initRipple();
    attachQuickViewHandlers(grid, data);
  } catch (err) {
    console.error('Ошибка загрузки товаров:', err);
    const cached = readCache('almaz_home_products');
    if (cached && cached.length) {
      grid.innerHTML =
        `<div class="offline-banner">⚠️ Показаны сохранённые ранее данные — не удалось обновить с сервера.</div>` +
        cached.map(productCardHtml).join('');
      initScrollReveal(grid);
      initRipple();
      attachQuickViewHandlers(grid, cached);
    } else {
      grid.innerHTML = stateBoxHtml('error', 'Не удалось загрузить товары. Попробуйте обновить страницу.');
    }
  }
}

async function loadHomeReviews() {
  const grid = document.querySelector('#home-reviews-grid');
  if (!grid) return;

  grid.innerHTML = skeletonReviewsHtml(3);

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('id', { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = stateBoxHtml('empty', 'Отзывов пока нет — станьте первым!');
      return;
    }

    cacheData(LS_KEYS.reviewsCache, data);
    grid.innerHTML = data.map(reviewCardHtml).join('');
    initScrollReveal(grid);
  } catch (err) {
    console.error('Ошибка загрузки отзывов:', err);
    const cached = readCache(LS_KEYS.reviewsCache);
    if (cached && cached.length) {
      grid.innerHTML =
        `<div class="offline-banner">⚠️ Показаны сохранённые ранее отзывы.</div>` +
        cached.slice(0, 3).map(reviewCardHtml).join('');
      initScrollReveal(grid);
    } else {
      grid.innerHTML = stateBoxHtml('error', 'Не удалось загрузить отзывы. Попробуйте обновить страницу.');
    }
  }
}

/* ==========================================================================
   9. СТРАНИЦА КАТАЛОГА: все товары + фильтрация по категориям
   ========================================================================== */
let allProductsCache = null;
let catalogState = { category: 'all', query: '', visibleCount: 8 };
const CATALOG_BATCH_SIZE = 8;

async function loadCatalog() {
  const grid = document.querySelector('#catalog-grid');
  if (!grid) return;

  grid.innerHTML = skeletonProductsHtml(8);

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    allProductsCache = data || [];
    cacheData(LS_KEYS.productsCache, allProductsCache);

    if (allProductsCache.length === 0) {
      grid.innerHTML = stateBoxHtml('empty', 'В каталоге пока нет товаров.');
      return;
    }

    renderCatalog();
    initFilters();
    initCatalogSearch();
  } catch (err) {
    console.error('Ошибка загрузки каталога:', err);
    const cached = readCache(LS_KEYS.productsCache);
    if (cached && cached.length) {
      allProductsCache = cached;
      renderCatalog(true);
      initFilters();
      initCatalogSearch();
    } else {
      grid.innerHTML = stateBoxHtml('error', 'Не удалось загрузить каталог. Попробуйте обновить страницу.');
    }
  }
}

function getFilteredProducts() {
  const q = catalogState.query.trim().toLowerCase();
  return allProductsCache.filter((p) => {
    const matchesCategory =
      catalogState.category === 'all' || (p.category || '').toLowerCase() === catalogState.category.toLowerCase();
    const matchesQuery =
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.color || '').toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

function renderCatalog(offline = false) {
  const grid = document.querySelector('#catalog-grid');
  if (!grid || !allProductsCache) return;

  const filtered = getFilteredProducts();

  if (filtered.length === 0) {
    grid.innerHTML = stateBoxHtml('empty', 'Ничего не найдено. Попробуйте изменить фильтр или запрос.');
    return;
  }

  const visible = filtered.slice(0, catalogState.visibleCount);
  const offlineNote = offline
    ? '<div class="offline-banner">⚠️ Показаны сохранённые ранее данные — не удалось обновить с сервера.</div>'
    : '';

  grid.innerHTML = offlineNote + visible.map(productCardHtml).join('');

  if (visible.length < filtered.length) {
    grid.insertAdjacentHTML(
      'beforeend',
      '<div class="load-sentinel" id="catalog-sentinel"></div>'
    );
    observeCatalogSentinel();
  }

  initScrollReveal(grid);
  initRipple();
  attachQuickViewHandlers(grid, visible);
}

let catalogObserver = null;
function observeCatalogSentinel() {
  const sentinel = document.querySelector('#catalog-sentinel');
  if (!sentinel) return;
  if (catalogObserver) catalogObserver.disconnect();

  catalogObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          catalogState.visibleCount += CATALOG_BATCH_SIZE;
          renderCatalog();
        }
      });
    },
    { rootMargin: '200px' }
  );
  catalogObserver.observe(sentinel);
}

function initFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      catalogState.category = btn.dataset.category;
      catalogState.visibleCount = CATALOG_BATCH_SIZE;
      renderCatalog();
    });
  });
}

/* ---------- Умный поиск с автодополнением ---------- */
function initCatalogSearch() {
  const input = document.querySelector('#catalog-search');
  const suggestionsBox = document.querySelector('#catalog-suggestions');
  if (!input || !allProductsCache) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    catalogState.query = input.value;
    catalogState.visibleCount = CATALOG_BATCH_SIZE;
    renderCatalog();

    if (!q) {
      suggestionsBox.classList.remove('open');
      suggestionsBox.innerHTML = '';
      return;
    }

    const matches = allProductsCache
      .filter((p) => (p.name || '').toLowerCase().includes(q))
      .slice(0, 5);

    if (matches.length === 0) {
      suggestionsBox.classList.remove('open');
      return;
    }

    suggestionsBox.innerHTML = matches
      .map(
        (p) => `<div class="search-suggestion" data-id="${escapeHtml(String(p.id))}">
          <span>${escapeHtml(p.name)}</span><small>${escapeHtml(p.category || '')}</small>
        </div>`
      )
      .join('');
    suggestionsBox.classList.add('open');

    suggestionsBox.querySelectorAll('.search-suggestion').forEach((el) => {
      el.addEventListener('click', () => {
        const product = allProductsCache.find((p) => String(p.id) === el.dataset.id);
        if (product) openQuickView(product);
        suggestionsBox.classList.remove('open');
      });
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      suggestionsBox?.classList.remove('open');
    }
  });
}

/* ==========================================================================
   10. СТРАНИЦА ОТЗЫВОВ: все отзывы
   ========================================================================== */
async function loadAllReviews() {
  const grid = document.querySelector('#all-reviews-grid');
  if (!grid) return;

  grid.innerHTML = skeletonReviewsHtml(6);

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = stateBoxHtml('empty', 'Отзывов пока нет — станьте первым!');
      return;
    }

    cacheData(LS_KEYS.reviewsCache, data);
    grid.innerHTML = data.map(reviewCardHtml).join('');
    initScrollReveal(grid);
  } catch (err) {
    console.error('Ошибка загрузки отзывов:', err);
    const cached = readCache(LS_KEYS.reviewsCache);
    if (cached && cached.length) {
      grid.innerHTML =
        `<div class="offline-banner">⚠️ Показаны сохранённые ранее отзывы.</div>` +
        cached.map(reviewCardHtml).join('');
      initScrollReveal(grid);
    } else {
      grid.innerHTML = stateBoxHtml('error', 'Не удалось загрузить отзывы. Попробуйте обновить страницу.');
    }
  }
}

/* ==========================================================================
   10.1 СЛУЧАЙНЫЙ КАСТОМ (виджет на главной)
   ========================================================================== */
async function loadRandomWidget() {
  const wrap = document.querySelector('#random-widget');
  if (!wrap) return;

  try {
    let pool = allProductsCache;
    if (!pool || pool.length === 0) {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      pool = data || [];
    }
    if (pool.length === 0) return;

    const product = pool[Math.floor(Math.random() * pool.length)];
    wrap.innerHTML = `
      <div class="random-widget-media">
        ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">` : ''}
      </div>
      <div>
        <span class="product-category">${escapeHtml(product.category || 'Custom')}</span>
        <h3 style="font-family:var(--font-display);font-size:1.2rem;margin:12px 0 8px;">${escapeHtml(product.name)}</h3>
        <p style="color:var(--text-secondary);margin-bottom:16px;">${escapeHtml(product.description || '')}</p>
        <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">
          <span class="product-price" style="font-size:1.3rem;">${formatPrice(product.price)}</span>
          <a class="btn btn-primary" target="_blank" rel="noopener" href="${BOT_URL}?start=product_${encodeURIComponent(product.id)}">📩 Хочу такие же</a>
          <button class="btn btn-outline" id="reroll-random">🎲 Другой вариант</button>
        </div>
      </div>`;

    document.querySelector('#reroll-random')?.addEventListener('click', loadRandomWidget);
    initRipple();
  } catch (err) {
    console.error('Не удалось загрузить случайный товар:', err);
  }
}

/* ==========================================================================
   10.2 ЛЕНТА ПОСЛЕДНИХ ПОСТОВ (таблица posts в Supabase, если создана)
   Если таблицы posts нет или она пуста — блок просто скрывается,
   ничего не ломается на сайте.
   ========================================================================== */
async function loadPostsFeed() {
  const grid = document.querySelector('#posts-grid');
  const section = document.querySelector('#posts-section');
  if (!grid || !section) return;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('id', { ascending: false })
      .limit(8);

    if (error || !data || data.length === 0) {
      section.style.display = 'none';
      return;
    }

    grid.innerHTML = data
      .map(
        (post) => `
        <a class="post-card reveal" href="${escapeHtml(post.link || CHANNEL_URL)}" target="_blank" rel="noopener">
          <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.caption || 'Пост Almaz Watch')}" loading="lazy">
        </a>`
      )
      .join('');
    initScrollReveal(grid);
  } catch (err) {
    section.style.display = 'none';
  }
}

/* ==========================================================================
   10.3 КВИЗ "ПОДБЕРИ СВОИ ЧАСЫ"
   ========================================================================== */
const QUIZ_QUESTIONS = [
  {
    q: 'Для кого выбираете часы?',
    options: [
      { label: 'Для себя, на каждый день', weight: { Classic: 1 } },
      { label: 'В подарок мужчине', weight: { 'G-Shock': 1 } },
      { label: 'В подарок женщине', weight: { Women: 1 } },
    ],
  },
  {
    q: 'Какой стиль вам ближе?',
    options: [
      { label: 'Спортивный, ударопрочный', weight: { 'G-Shock': 1 } },
      { label: 'Классический, строгий', weight: { Classic: 1 } },
      { label: 'Изящный, лёгкий', weight: { Women: 1 } },
    ],
  },
  {
    q: 'Где будете носить чаще всего?',
    options: [
      { label: 'Активный отдых, спорт', weight: { 'G-Shock': 1 } },
      { label: 'Офис, деловые встречи', weight: { Classic: 1 } },
      { label: 'Повседневные образы', weight: { Women: 1 } },
    ],
  },
];

function initQuiz() {
  const box = document.querySelector('#quiz-box');
  if (!box) return;

  let step = 0;
  const scores = { 'G-Shock': 0, Classic: 0, Women: 0 };

  function renderStep() {
    if (step >= QUIZ_QUESTIONS.length) {
      const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
      box.innerHTML = `
        <div class="quiz-progress"><div class="quiz-progress-bar" style="width:100%;"></div></div>
        <div class="quiz-result">
          <p class="eyebrow" style="justify-content:center;">Ваш результат</p>
          <h3 style="font-family:var(--font-display);font-size:1.4rem;margin-bottom:14px;">
            Категория «${winner}» — то, что нужно!
          </h3>
          <p style="color:var(--text-secondary);margin-bottom:24px;">
            Мы подобрали направление по вашим ответам. Посмотрите подходящие модели в каталоге.
          </p>
          <a class="btn btn-primary" href="catalog.html">Смотреть модели «${winner}» →</a>
        </div>`;
      initRipple();
      return;
    }

    const question = QUIZ_QUESTIONS[step];
    box.innerHTML = `
      <div class="quiz-progress"><div class="quiz-progress-bar" style="width:${(step / QUIZ_QUESTIONS.length) * 100}%;"></div></div>
      <p class="quiz-question">${escapeHtml(question.q)}</p>
      <div class="quiz-options">
        ${question.options
          .map((opt, i) => `<button class="quiz-option" data-index="${i}">${escapeHtml(opt.label)}</button>`)
          .join('')}
      </div>`;

    box.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const opt = question.options[Number(btn.dataset.index)];
        Object.entries(opt.weight).forEach(([cat, w]) => {
          scores[cat] = (scores[cat] || 0) + w;
        });
        step += 1;
        renderStep();
      });
    });
  }

  renderStep();
}

/* ==========================================================================
   10.4 PWA: РЕГИСТРАЦИЯ SERVICE WORKER
   ========================================================================== */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker не зарегистрирован:', err);
      });
    });
  }
}

/* ==========================================================================
   11. ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ
   ========================================================================== */
function markActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a, .mobile-menu a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ==========================================================================
   12. ТОЧКА ВХОДА
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initRipple();
  initParticles();
  initClockTicks();
  initCounters();
  markActiveNavLink();

  initThemeToggle();
  initSmartHeader();
  initHeroParallax();
  initInteractiveClocks();
  initBackToTop();
  renderRecentlyViewedBanner();
  initQuiz();
  registerServiceWorker();

  // Загружаем данные в зависимости от того, какая страница открыта
  loadHomeProducts();
  loadHomeReviews();
  loadCatalog().then(loadRandomWidget);
  loadAllReviews();
  loadPostsFeed();

  // Общая инициализация fade-up для статичных блоков (не из базы)
  initScrollReveal();
});
