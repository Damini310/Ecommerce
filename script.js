// script.js - central interactivity for StyleMart
// Attach <script src="script.js" defer></script> at bottom of each page

/* Utility: format price */
function toNumberPrice(str) {
  // Accepts "$50" or "50" or "50.00" -> returns Number
  return Number(String(str).replace(/[^0-9.-]+/g, "")) || 0;
}
function formatPrice(n) { return `$${Number(n).toFixed(2)}`; }

/* ===== C A R T  - localStorage based ===== */
const CART_KEY = 'stylemart_cart_v1';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) { return []; }
}
function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* Add to Cart: called when add buttons clicked */
function handleAddToCartFromButton(btn) {
  const card = btn.closest('.product');
  const name = card.querySelector('h3')?.textContent?.trim() || 'Item';
  const priceText = card.querySelector('.price')?.textContent || card.querySelector('p')?.textContent || '$0';
  const price = formatPrice(toNumberPrice(priceText));
  const img = card.querySelector('img')?.src || '';

  const cart = getCart();
  const existing = cart.find(i => i.name === name);
  if (existing) existing.quantity += 1;
  else cart.push({ name, price, image: img, quantity: 1 });
  setCart(cart);
  // small toast
  flash(`${name} added to cart`);
  updateCartCount();
}

/* Render cart view (cart.html) */
function renderCartPage() {
  const container = document.querySelector('.cart-items');
  const totalEl = document.querySelector('.cart-summary h3');
  if (!container || !totalEl) return;
  const cart = getCart();
  container.innerHTML = '';
  let total = 0;
  cart.forEach((item, idx) => {
    const itemPrice = toNumberPrice(item.price);
    total += itemPrice * item.quantity;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="item-details">
        <h3>${item.name}</h3>
        <p>Price: ${item.price}</p>
        <p>Quantity: <input type="number" min="1" value="${item.quantity}" data-index="${idx}" /></p>
      </div>
      <div>
        <button class="remove-btn" data-index="${idx}">Remove</button>
      </div>
    `;
    container.appendChild(div);
  });
  totalEl.textContent = `Total: ${formatPrice(total)}`;
}

/* Remove item handler */
function cartRemoveHandler(e) {
  if (!e.target.matches('.remove-btn')) return;
  const idx = Number(e.target.dataset.index);
  const cart = getCart();
  cart.splice(idx, 1);
  setCart(cart);
  renderCartPage();
  updateCartCount();
}

/* Quantity change handler */
function cartQuantityHandler(e) {
  if (e.target.tagName !== 'INPUT') return;
  const idx = Number(e.target.dataset.index);
  const cart = getCart();
  const val = Math.max(1, parseInt(e.target.value) || 1);
  cart[idx].quantity = val;
  setCart(cart);
  renderCartPage();
  updateCartCount();
}

/* Checkout summary render (on checkout page) */
function renderCheckoutSummary() {
  const summaryEl = document.querySelector('.checkout-summary');
  const totalEl = document.querySelector('.checkout-total');
  if (!summaryEl || !totalEl) return;
  const cart = getCart();
  summaryEl.innerHTML = '';
  let total = 0;
  cart.forEach(it => {
    const priceN = toNumberPrice(it.price);
    total += priceN * it.quantity;
    const row = document.createElement('div');
    row.style.display='flex';
    row.style.justifyContent='space-between';
    row.style.marginBottom='6px';
    row.innerHTML = `<span>${it.name} x${it.quantity}</span><strong>${formatPrice(priceN * it.quantity)}</strong>`;
    summaryEl.appendChild(row);
  });
  totalEl.textContent = formatPrice(total);
}

/* Complete checkout */
function handleCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.querySelector('[name=name]').value.trim(),
    email: form.querySelector('[name=email]').value.trim(),
    address: form.querySelector('[name=address]').value.trim(),
    payment: form.querySelector('[name=payment]').value
  };
  if (!data.name || !data.email || !data.address) {
    flash('Please fill in required fields');
    return;
  }
  // Mock payment process
  flash('Processing payment...', 1000);
  setTimeout(()=> {
    flash('✅ Order placed! Thank you.', 2200);
    localStorage.removeItem(CART_KEY);
    updateCartCount();
    setTimeout(()=> window.location.href = 'index.html', 1400);
  }, 900);
}

/* Small toast message */
function flash(msg='Done', time=1200) {
  let t = document.querySelector('#sm-toast');
  if (!t) {
    t = document.createElement('div');
    t.id='sm-toast';
    t.style.position='fixed';
    t.style.right='18px';
    t.style.bottom='18px';
    t.style.background='rgba(15,23,42,0.95)';
    t.style.color='white';
    t.style.padding='10px 14px';
    t.style.borderRadius='8px';
    t.style.zIndex=9999;
    t.style.boxShadow='0 10px 28px rgba(2,6,23,0.35)';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity='1';
  clearTimeout(t._out);
  t._out = setTimeout(()=> t.style.opacity='0', time);
}

/* Update cart count on nav (if you add a small bubble) */
function updateCartCount() {
  const countEl = document.querySelector('.cart-count');
  if (!countEl) return;
  const cart = getCart();
  let total = cart.reduce((s,i)=> s + (i.quantity||0), 0);
  countEl.textContent = total;
  countEl.style.display = total ? 'inline-block' : 'none';
}

/* ===== Animations & reveals ===== */
function setupReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const products = document.querySelectorAll('.product-grid .product');
  function onScroll() {
    const hh = window.innerHeight;
    reveals.forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < hh - 80) el.classList.add('active');
      else el.classList.remove('active');
    });
    // stagger products
    products.forEach((p,i) => {
      const top = p.getBoundingClientRect().top;
      if (top < hh - 60) {
        setTimeout(()=> p.classList.add('show'), i * 80);
      } else {
        p.classList.remove('show');
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('load', onScroll);
  onScroll();
}

/* ===== Page helpers: nav active & mobile toggle ===== */
function initNavAndMobile() {
  // active link by pathname
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (href === '#' && path === 'index.html')) {
      a.classList.add('active');
    } else a.classList.remove('active');
  });
  // mobile toggle
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('nav ul');
  if (toggle && menu) {
    toggle.addEventListener('click', ()=> menu.classList.toggle('open'));
  }
}

/* Attach events for product Add buttons (delegated) */
function attachAddButtons() {
  document.body.addEventListener('click', e => {
    if (e.target && e.target.matches('.add-btn')) {
      handleAddToCartFromButton(e.target);
    }
  });
}

/* Wire up cart page interactions */
function wireCartPageControls() {
  const cartContainer = document.querySelector('.cart-items');
  if (!cartContainer) return;
  cartContainer.addEventListener('click', cartRemoveHandler);
  cartContainer.addEventListener('input', cartQuantityHandler);
}

/* Hook checkout submit */
function wireCheckout() {
  const form = document.querySelector('.checkout-form');
  if (form) form.addEventListener('submit', handleCheckoutSubmit);
}

/* fade in page */
function fadeInPage() {
  const body = document.body;
  body.classList.add('page-fade');
  window.requestAnimationFrame(()=> {
    setTimeout(()=> body.classList.add('in'), 40);
  });
}

/* Initialize on load */
document.addEventListener('DOMContentLoaded', () => {
  fadeInPage();
  initNavAndMobile();
  setupReveal();
  attachAddButtons();
  updateCartCount();
  wireCartPageControls();
  wireCheckout();
  renderCartPage && renderCartPage();
  renderCheckoutSummary && renderCheckoutSummary();
});
