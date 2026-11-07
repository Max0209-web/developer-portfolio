function select(buttons, active) {
  for (const button of buttons) button.setAttribute('aria-pressed', String(button === active));
}
function animate(element) {
  element.classList.remove('swap');
  void element.offsetWidth;
  element.classList.add('swap');
}
const planets = [
  ['Иней', 'Ледяные поля и голубое сияние. Здесь можно пройти по краю кратера и увидеть, как свет меняется над горизонтом.', '04 ч 20 мин', 'Ледяной', '#a5edff', 456, 158],
  ['Спектр', 'Скалы светятся после заката. Лучший вид открывается с тёмного плато, когда над ним поднимаются два спутника.', '02 ч 45 мин', 'Кристаллический', '#c8acff', 187, 126],
  ['Пепел', 'Ветер поднимает тёплую пыль над лавовыми полями. На рассвете кратеры становятся почти медными.', '07 ч 10 мин', 'Вулканический', '#ffc49a', 478, 314]
];
const planetButtons = document.querySelectorAll('[data-planet]');
for (const button of planetButtons) {
  button.addEventListener('click', () => {
    const [name, description, time, type, color, x, y] = planets[Number(button.dataset.planet)];
    select(planetButtons, button);
    document.body.style.setProperty('--planet', color);
    document.querySelector('#target').style.transform = 'translate(' + x + 'px,' + y + 'px)';
    document.querySelector('#route').setAttribute('d', 'M320 228 Q' + ((320 + x) / 2) + ' ' + (Math.min(y, 228) - 65) + ' ' + x + ' ' + y);
    for (const [id, value] of Object.entries({'planet-name':name,'planet-desc':description,'planet-time':time,'planet-type':type})) {
      document.getElementById(id).textContent = value;
    }
    animate(document.querySelector('.orbit-detail'));
  });
}

const coffeeButtons = document.querySelectorAll('[data-coffee]');
if (coffeeButtons.length) {
  const menu = [
    ['Флэт уайт','Сливочный, с нотами шоколада и жареного ореха.',290],
    ['Апельсиновый бамбл','Эспрессо, апельсиновый сок и лёд. Цитрусовый и бодрый.',330],
    ['Двойной американо','Чистый вкус эспрессо с лёгкой горечью какао.',240]
  ];
  const size = document.getElementById('size');
  const receipt = document.getElementById('receipt');
  let selected = 0;
  function total() { return menu[selected][2] + Number(size.value); }
  function refresh() {
    const [name, description] = menu[selected];
    document.getElementById('drink').textContent = name;
    document.getElementById('flavor').textContent = description;
    document.getElementById('price').textContent = total() + ' ₽';
    receipt.textContent = '';
  }
  for (const button of coffeeButtons) {
    button.addEventListener('click', () => {
      selected = Number(button.dataset.coffee);
      select(coffeeButtons, button);
      refresh();
      animate(document.querySelector('.coffee-result'));
    });
  }
  size.addEventListener('change', refresh);
  document.getElementById('add-drink').addEventListener('click', () => {
    receipt.textContent = 'В демо-заказе: ' + menu[selected][0] + ', ' + size.selectedOptions[0].text + ' · ' + total() + ' ₽';
  });
}

const beatGrid = document.getElementById('beat-grid');
if (beatGrid) {
  const instruments = ['Бочка','Малый','Хэт'];
  const presets = [
    [[0,4,8,12],[4,12],[0,2,4,6,8,10,12,14]],
    [[0,3,8,10],[4,12,15],[2,6,7,10,14]],
    [[0,7,10],[4,11,12],[0,2,5,6,8,9,13,15]]
  ];
  let preset = 0, step = 0, timer, context, master, noise, running = false;
  const play = document.getElementById('play');
  const tempo = document.getElementById('tempo');
  const status = document.getElementById('beat-status');
  const pads = instruments.map(name => {
    const row = document.createElement('div');
    row.className = 'beat-row';
    const label = document.createElement('span');
    label.textContent = name;
    row.append(label);
    const buttons = Array.from({length:16}, (_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', name + ', шаг ' + (index + 1));
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true')));
      row.append(button);
      return button;
    });
    beatGrid.append(row);
    return buttons;
  });
  function loadPreset() {
    pads.forEach((row, track) => row.forEach((button, index) => button.setAttribute('aria-pressed', String(presets[preset][track].includes(index)))));
  }
  function sound(track) {
    const time = context.currentTime;
    const volume = context.createGain();
    volume.connect(master);
    if (track === 0) {
      const oscillator = context.createOscillator();
      oscillator.frequency.setValueAtTime(135, time);
      oscillator.frequency.exponentialRampToValueAtTime(44, time + .12);
      volume.gain.setValueAtTime(.7, time);
      volume.gain.exponentialRampToValueAtTime(.001, time + .19);
      oscillator.connect(volume);
      oscillator.start(time);
      oscillator.stop(time + .2);
      return;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const duration = track === 1 ? .13 : .06;
    filter.type = 'highpass';
    filter.frequency.value = track === 1 ? 900 : 6500;
    source.buffer = noise;
    source.connect(filter);
    filter.connect(volume);
    volume.gain.setValueAtTime(track === 1 ? .32 : .19, time);
    volume.gain.exponentialRampToValueAtTime(.001, time + duration);
    source.start(time);
    source.stop(time + duration);
  }
  function tick() {
    for (const row of pads) {
      row[(step + 15) % 16].classList.remove('current');
      row[step].classList.add('current');
    }
    pads.forEach((row, track) => { if (row[step].getAttribute('aria-pressed') === 'true') sound(track); });
    step = (step + 1) % 16;
    timer = setTimeout(tick, 15000 / Number(tempo.value));
  }
  function stop() {
    clearTimeout(timer);
    running = false;
    document.body.classList.remove('playing');
    play.textContent = 'Играть';
    play.setAttribute('aria-pressed', 'false');
    status.textContent = 'Остановлено';
    for (const button of beatGrid.querySelectorAll('.current')) button.classList.remove('current');
  }
  play.addEventListener('click', async () => {
    if (running) { stop(); return; }
    play.disabled = true;
    try {
      if (!context) {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = .25;
        master.connect(context.destination);
        noise = context.createBuffer(1, Math.ceil(context.sampleRate * .2), context.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
      await context.resume();
      running = true;
      step = 0;
      document.body.classList.add('playing');
      play.textContent = 'Стоп';
      play.setAttribute('aria-pressed', 'true');
      status.textContent = 'Играет';
      tick();
    } catch {
      stop();
      status.textContent = 'Браузер не запустил звук';
    } finally {
      play.disabled = false;
    }
  });
  tempo.addEventListener('input', () => document.getElementById('bpm').textContent = tempo.value);
  document.getElementById('preset').addEventListener('click', () => {
    preset = (preset + 1) % presets.length;
    loadPreset();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && running) stop(); });
  loadPreset();
}
