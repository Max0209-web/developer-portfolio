const slug = document.body.dataset.product;
const shop = storefronts[slug];
const isStudio = slug === 'kadr';
const key = 'maxim-portfolio-' + slug + '-v1';
const money = new Intl.NumberFormat('ru-RU', {style:'currency',currency:'RUB',maximumFractionDigits:0});
const $ = selector => document.querySelector(selector);
const panel = $('#panel');
const body = $('#panel-body');
let category = 'Все';
let search = '';
let memoryState;
const catalogDate = $('#catalog-date');

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Array.isArray(saved.cart) && Array.isArray(saved.orders)) return saved;
  } catch {}
  return memoryState || {cart:[],orders:[]};
}
let state = read();
function save() {
  memoryState = state;
  try { localStorage.setItem(key, JSON.stringify(state)); return true; }
  catch { return false; }
}
function update() {
  save();
  $('#cart-count').textContent = isStudio ? state.orders.length : state.cart.reduce((sum,line) => sum+line.quantity,0);
  showCatalog();
}
function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function openPanel(title, html) {
  body.innerHTML = '<h2 class="panel-title" id="panel-title">' + title + '</h2>' + html;
  if (!panel.open) panel.showModal();
  panel.scrollTop = 0;
}
function getItem(id) { return shop.items.find(item => item.id === id); }
function sold(id) {
  return state.orders.reduce((sum,order) => sum + (order.lines || []).filter(line => line.id === id).reduce((n,line) => n+line.quantity,0),0);
}
function left(item) { return Math.max(0,item.stock-sold(item.id)); }
function inCart(id) {
  return state.cart.filter(line => line.id === id).reduce((sum,line) => sum+line.quantity,0);
}
function linePrice(line) {
  const item = getItem(line.id);
  return item.price + item.options[line.option][1];
}
function subtotal() {
  return state.cart.reduce((sum,line) => sum+linePrice(line)*line.quantity,0);
}
function roomIsFree(room, date, start, hours) {
  return !state.orders.some(order => order.room === room && order.date === date &&
    start < order.start + order.hours && start + hours > order.start);
}
function startTimes(hours) {
  return Array.from({length: 11 - hours}, (_, index) => index + 10);
}
function availabilityLabel(item) {
  if (!isStudio) return left(item) ? 'В наличии: ' + left(item) : 'Распродано';
  const first = startTimes(1).find(hour => roomIsFree(item.id, catalogDate.value, hour, 1));
  return first === undefined ? 'На эту дату мест нет' : 'Ближайшее окно: ' + first + ':00';
}
function showCatalog() {
  const matching = shop.items.filter(item => (category === 'Все' || item.category === category) && item.title.toLowerCase().includes(search));
  $('#catalog-grid').innerHTML = matching.map(item => {
    const availability = availabilityLabel(item);
    const label = isStudio ? 'Выбрать время' : 'Подробнее';
    return '<article class="product-card"><div class="product-photo"><img src="photos/' + item.photo + '.jpg" alt="' + item.title + '" loading="lazy"></div>' +
      '<div class="product-copy"><small class="availability">' + availability + '</small><h3>' + item.title + '</h3><small>' + item.detail + '</small><strong>' + money.format(item.price) +
      (isStudio ? ' / ч' : '') + '</strong><button class="secondary" data-item="' + item.id + '" aria-label="' + label + ': ' + item.title + '">' + label + '</button></div></article>';
  }).join('') || '<p class="empty">Ничего не нашлось. Попробуйте изменить запрос.</p>';
}
function product(item, initialOption = 0) {
  if (isStudio) { booking(item); return; }
  const options = item.options.map(([name,extra],index) => '<option value="' + index + '">' + name + (extra ? ' +' + money.format(extra) : '') + '</option>').join('');
  const available = left(item)-inCart(item.id);
  openPanel(item.title, '<img class="panel-img" src="photos/' + item.photo + '.jpg" alt=""><p>' + item.description + '</p><p class="panel-note">' + item.detail + '</p>' +
    '<form class="panel-form" id="add-form"><label>' + 'Отделка' + '<select name="option">' + options +
    '</select></label><p class="panel-note">На фото базовая отделка. Цена меняется при выборе варианта.</p><output id="item-price" aria-live="polite">' + money.format(item.price) + '</output><button class="primary"' + (available<=0 ? ' disabled' : '') +
    '>' + (available<=0 ? 'Доступное количество уже выбрано' : 'Добавить в корзину') + '</button></form>');
  const form = $('#add-form');
  const option = form.elements.option;
  option.value = String(initialOption);
  $('#item-price').textContent = money.format(item.price + item.options[option.value][1]);
  option.addEventListener('change', () => { $('#item-price').textContent = money.format(item.price+item.options[option.value][1]); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    state = read();
    if (inCart(item.id)>=left(item)) { product(item); return; }
    const selected = Number(option.value);
    const line = state.cart.find(entry => entry.id===item.id && entry.option===selected);
    if (line) line.quantity++;
    else state.cart.push({id:item.id,option:selected,quantity:1});
    update();
    cart();
  });
}
function orderHistory() {
  return '<div class="cart-actions">' + (state.orders.length ? state.orders.slice().reverse().map(order => {
    return '<div class="confirmation"><strong>' + escapeText(order.number) + '</strong><p>' +
      escapeText(order.summary) + '</p><p>' + money.format(order.total) + '</p>' +
      (isStudio ? '<button class="secondary" data-cancel="' + escapeText(order.number) + '">Отменить бронь</button>' : '') + '</div>';
  }).join('') : '<p class="empty">' + (isStudio ? 'Пока нет броней.' : 'Пока нет заказов.') + '</p>') + '</div>';
}
function cart() {
  state = read();
  if (isStudio) { openPanel('Мои брони', orderHistory()); return; }
  const lines = state.cart.map((line,index) => {
    const item = getItem(line.id);
    const change = (delta,label,mark,disabled='') => '<button type="button" data-index="' + index + '" data-change="' + delta +
      '" aria-label="' + label + '" ' + disabled + '>' + mark + '</button>';
    return '<div class="cart-line"><div><strong>' + item.title + '</strong><p class="panel-note">' + item.options[line.option][0] + ' · ' +
      money.format(linePrice(line)) + '</p></div><div class="qty">' + change(-1,'Уменьшить','−') + '<span>' + line.quantity + '</span>' +
      change(1,'Увеличить','+',inCart(item.id)>=left(item) ? 'disabled' : '') + '</div></div>';
  }).join('');
  openPanel('Корзина', (lines || '<p class="empty">Корзина пока пуста.</p>') + '<div class="cart-actions">' +
    (lines ? '<strong>Товары: ' + money.format(subtotal()) + '</strong><button class="primary" data-action="checkout">Оформить заказ</button>' : '') +
    '<button class="secondary" data-action="history">История заказов</button></div>');
}
function dateOptions() {
  const formatter = new Intl.DateTimeFormat('ru-RU',{weekday:'short',day:'numeric',month:'long'});
  return Array.from({length:7},(_,offset) => {
    const date = new Date();
    date.setDate(date.getDate()+offset+1);
    const stamp = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
    return '<option value="' + stamp + '">' + formatter.format(date) + '</option>';
  }).join('');
}
function number(prefix) {
  return prefix + '-' + crypto.randomUUID().slice(0,8).toUpperCase();
}
function checkout() {
  if (!state.cart.length) { cart(); return; }
  const fields = '<label>Получение<select name="delivery"><option value="pickup">Самовывоз</option><option value="city">Доставка по городу</option></select></label><label id="address-field" hidden>Адрес для демо<input name="address" maxlength="120" placeholder="Пример: ул. Лесная, 5"></label>';
  openPanel('Оформление', '<p class="panel-note">Демонстрационный заказ. Оплата и отправка не выполняются.</p><form id="checkout-form" class="panel-form">' +
    fields + '<dl class="order-breakdown"><div><dt>Товары</dt><dd id="checkout-subtotal"></dd></div><div><dt>Получение</dt><dd id="checkout-delivery"></dd></div><div><dt>Итого</dt><dd><output id="checkout-total" aria-live="polite"></output></dd></div></dl><p class="panel-note" id="form-message" role="status"></p><button class="primary">Подтвердить демо-заказ</button></form>');
  const form = $('#checkout-form');
  function deliveryCost() { return form.elements.delivery.value==='city' && subtotal()<75000 ? 990 : 0; }
  function refresh() {
    const needsAddress = form.elements.delivery.value==='city';
    $('#address-field').hidden = !needsAddress;
    form.elements.address.required = needsAddress;
    const shipping = deliveryCost();
    $('#checkout-subtotal').textContent = money.format(subtotal());
    $('#checkout-delivery').textContent = shipping ? money.format(shipping) : 'Бесплатно';
    $('#checkout-total').textContent = money.format(subtotal() + shipping);
  }
  form.elements.delivery.addEventListener('change', refresh);
  refresh();
  form.addEventListener('submit', event => {
    event.preventDefault();
    state = read();
    if (!state.cart.length || state.cart.some(line => inCart(line.id)>left(getItem(line.id)))) {
      $('#form-message').textContent = 'Наличие изменилось. Проверьте корзину.';
      return;
    }
    const items = state.cart.map(line => {
      const item = getItem(line.id);
      return item.title + ' (' + item.options[line.option][0] + ') × ' + line.quantity;
    }).join(', ');
    const method = form.elements.delivery.selectedOptions[0].text;
    const receipt = {number:number('N'),lines:state.cart,total:subtotal()+deliveryCost(),summary:items+' · '+method};
    state.orders.push(receipt);
    state.cart = [];
    const saved = save();
    update();
    confirmation('Демо-заказ оформлен',receipt,saved);
  });
}
function booking(item) {
  openPanel(item.title, '<img class="panel-img" src="photos/' + item.photo + '.jpg" alt=""><p>' + item.description + '</p><p class="panel-note">' + item.detail +
    '</p><form id="booking-form" class="panel-form"><label>Дата<select name="date">' + dateOptions() +
    '</select></label><label>Длительность<select name="hours"><option value="1">1 час</option><option value="2">2 часа</option><option value="3">3 часа</option></select></label>' +
    '<input type="hidden" name="start"><fieldset class="time-picker"><legend>Начало съёмки</legend><div id="booking-slots" class="booking-slots"></div></fieldset><output id="booking-total"></output><p id="form-message" class="panel-note" role="status"></p><button class="primary" type="submit">Подтвердить демо-бронь</button></form>');
  const form = $('#booking-form');
  form.elements.date.value = catalogDate.value;
  const duration = () => Number(form.elements.hours.value);
  function free(start) {
    return roomIsFree(item.id, form.elements.date.value, start, duration());
  }
  function refresh() {
    const times = startTimes(duration());
    const previous = Number(form.elements.start.value);
    const firstOpen = times.find(free);
    const selected = times.includes(previous) && free(previous) ? previous : firstOpen;
    form.elements.start.value = selected ?? '';
    showSlots(times);
    const hasOpenSlot = firstOpen !== undefined;
    form.querySelector('button[type="submit"]').disabled = !hasOpenSlot;
    $('#form-message').textContent = hasOpenSlot ? '' : 'На выбранную длительность свободных окон нет.';
    $('#booking-total').textContent = money.format(item.price*duration());
  }
  function showSlots(times) {
    $('#booking-slots').innerHTML = times.map(hour => {
      const available = free(hour);
      const active = String(hour) === form.elements.start.value;
      return '<button type="button" class="filter" data-hour="' + hour + '" aria-pressed="' + active + '"' +
        (available ? '' : ' disabled title="Занято"') + '>' + hour + ':00</button>';
    }).join('');
  }
  $('#booking-slots').addEventListener('click', event => {
    const button = event.target.closest('[data-hour]');
    if (!button || button.disabled) return;
    form.elements.start.value = button.dataset.hour;
    for (const choice of $('#booking-slots').querySelectorAll('button')) {
      choice.setAttribute('aria-pressed', String(choice===button));
    }
  });
  form.addEventListener('change', refresh);
  refresh();
  form.addEventListener('submit', event => {
    event.preventDefault();
    state = read();
    const start = Number(form.elements.start.value);
    if (!start || !free(start)) {
      refresh();
      $('#form-message').textContent = 'Это время уже занято. Выберите другое.';
      return;
    }
    const date = form.elements.date.value;
    const hours = duration();
    const receipt = {number:number('S'),date,start,hours,room:item.id,total:item.price*hours,
      summary:item.title+' · '+form.elements.date.selectedOptions[0].text+' · '+start+':00–'+(start+hours)+':00'};
    state.orders.push(receipt);
    catalogDate.value = date;
    const saved = save();
    update();
    confirmation('Демо-бронь создана',receipt,saved);
  });
}
function confirmation(title, receipt, saved) {
  openPanel(title, '<div class="confirmation"><strong>' + receipt.number + '</strong><p>' + escapeText(receipt.summary) +
    '</p><p>' + money.format(receipt.total) + '</p></div><p class="panel-note">' +
    (saved ? 'Подтверждение сохранено на этом устройстве.' : 'Хранилище браузера недоступно. Подтверждение сохранено только в этом окне.') +
    '</p><button class="primary" data-action="done">Готово</button>');
}
if (catalogDate) {
  catalogDate.innerHTML = dateOptions();
  catalogDate.addEventListener('change', showCatalog);
}
$('#benefits').innerHTML = shop.benefits.map(label => '<span>' + label + '</span>').join('');
$('#info-grid').innerHTML = shop.conditions.map(([title,copy]) => '<article><h3>' + title + '</h3><p>' + copy + '</p></article>').join('');
const categories = ['Все',...new Set(shop.items.map(item => item.category))];
$('#filters').innerHTML = categories.map(label => '<button type="button" class="filter" data-category="' + label + '" aria-pressed="' +
  String(label==='Все') + '">' + label + '</button>').join('') + '<input type="search" aria-label="Поиск по каталогу" placeholder="Поиск по каталогу">';
$('#filters').addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  category = button.dataset.category;
  for (const filter of document.querySelectorAll('[data-category]')) filter.setAttribute('aria-pressed',String(filter===button));
  showCatalog();
});
$('#filters input').addEventListener('input', event => {
  search = event.target.value.trim().toLowerCase();
  showCatalog();
});
$('#catalog-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-item]');
  if (button) { state=read(); product(getItem(button.dataset.item)); }
});
body.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.change) {
    state=read();
    const line=state.cart[Number(button.dataset.index)];
    if (!line) return;
    const delta=Number(button.dataset.change);
    if (delta>0 && inCart(line.id)>=left(getItem(line.id))) return;
    line.quantity+=delta;
    state.cart=state.cart.filter(entry => entry.quantity>0);
    update();
    cart();
  }
  if (button.dataset.cancel) {
    state=read();
    const receipt=state.orders.find(order => order.number===button.dataset.cancel);
    if (receipt) openPanel('Отменить бронь?', '<p>' + escapeText(receipt.summary) +
      '</p><div class="cart-actions"><button class="primary" data-confirm-cancel="' + escapeText(receipt.number) +
      '">Да, отменить</button><button class="secondary" data-action="back">Оставить бронь</button></div>');
  }
  if (button.dataset.confirmCancel) {
    state=read();
    state.orders=state.orders.filter(order => order.number!==button.dataset.confirmCancel);
    update();
    cart();
  }
  if (button.dataset.action==='checkout') checkout();
  if (button.dataset.action==='history') openPanel('История заказов',orderHistory()+'<div class="cart-actions"><button class="secondary" data-action="back">К корзине</button></div>');
  if (button.dataset.action==='back') cart();
  if (button.dataset.action==='done') panel.close();
});
for (const selector of ['#studio-book','#featured-details']) {
  const button = $(selector);
  button?.addEventListener('click', () => {
    state = read();
    product(getItem(button.dataset.item), Number(button.dataset.option || 0));
  });
}
$('#open-cart').addEventListener('click',cart);
$('#close-panel').addEventListener('click',()=>panel.close());
panel.addEventListener('click',event => { if (event.target===panel) panel.close(); });
window.addEventListener('storage',event => {
  if (event.key===key) { state=read(); $('#cart-count').textContent=isStudio?state.orders.length:state.cart.reduce((sum,line)=>sum+line.quantity,0); showCatalog(); }
});
update();
