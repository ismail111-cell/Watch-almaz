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

/* Ссылка на Telegram-бота для оформления заказа */
const BOT_URL = 'https://t.me/almazwatchbot';

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
   2. RIPPLE-ЭФФЕКТ НА КНОПКАХ (волна при клике)
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
   8. ГЛАВНАЯ СТРАНИЦА: последние 4 товара + 3 отзыва
   ========================================================================== */
async function loadHomeProducts() {
  const grid = document.querySelector('#home-products-grid');
  if (!grid) return;

  grid.innerHTML = stateBoxHtml('loading', 'Загружаем последние работы…');

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

    grid.innerHTML = data.map(productCardHtml).join('');
    initScrollReveal(grid);
    initRipple();
  } catch (err) {
    console.error('Ошибка загрузки товаров:', err);
    grid.innerHTML = stateBoxHtml('error', 'Не удалось загрузить товары. Попробуйте обновить страницу.');
  }
}

async function loadHomeReviews() {
  const grid = document.querySelector('#home-reviews-grid');
  if (!grid) return;

  grid.innerHTML = stateBoxHtml('loading', 'Загружаем отзывы…');

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

    grid.innerHTML = data.map(reviewCardHtml).join('');
    initScrollReveal(grid);
  } catch (err) {
    console.error('Ошибка загрузки отзывов:', err);
    grid.innerHTML = stateBoxHtml('error', 'Не удалось загрузить отзывы. Попробуйте обновить страницу.');
  }
}

/* ==========================================================================
   9. СТРАНИЦА КАТАЛОГА: все товары + фильтрация по категориям
   ========================================================================== */
let allProductsCache = null;

async function loadCatalog() {
  const grid = document.querySelector('#catalog-grid');
  if (!grid) return;

  grid.innerHTML = stateBoxHtml('loading', 'Загружаем каталог часов…');

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    allProductsCache = data || [];

    if (allProductsCache.length === 0) {
      grid.innerHTML = stateBoxHtml('empty', 'В каталоге пока нет товаров.');
      return;
    }

    renderCatalog('all');
    initFilters();
  } catch (err) {
    console.error('Ошибка загрузки каталога:', err);
    grid.innerHTML = stateBoxHtml('error', 'Не удалось загрузить каталог. Попробуйте обновить страницу.');
  }
}

function renderCatalog(category) {
  const grid = document.querySelector('#catalog-grid');
  if (!grid || !allProductsCache) return;

  const filtered =
    category === 'all'
      ? allProductsCache
      : allProductsCache.filter((p) => (p.category || '').toLowerCase() === category.toLowerCase());

  if (filtered.length === 0) {
    grid.innerHTML = stateBoxHtml('empty', 'В этой категории пока нет товаров.');
    return;
  }

  grid.innerHTML = filtered.map(productCardHtml).join('');
  initScrollReveal(grid);
  initRipple();
}

function initFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderCatalog(btn.dataset.category);
    });
  });
}

/* ==========================================================================
   10. СТРАНИЦА ОТЗЫВОВ: все отзывы
   ========================================================================== */
async function loadAllReviews() {
  const grid = document.querySelector('#all-reviews-grid');
  if (!grid) return;

  grid.innerHTML = stateBoxHtml('loading', 'Загружаем отзывы клиентов…');

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

    grid.innerHTML = data.map(reviewCardHtml).join('');
    initScrollReveal(grid);
  } catch (err) {
    console.error('Ошибка загрузки отзывов:', err);
    grid.innerHTML = stateBoxHtml('error', 'Не удалось загрузить отзывы. Попробуйте обновить страницу.');
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

  // Загружаем данные в зависимости от того, какая страница открыта
  loadHomeProducts();
  loadHomeReviews();
  loadCatalog();
  loadAllReviews();

  // Общая инициализация fade-up для статичных блоков (не из базы)
  initScrollReveal();
});
