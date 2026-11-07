const input = document.getElementById('example');
const result = document.getElementById('result');
const run = document.getElementById('run');
const reset = document.getElementById('reset');
const counts = document.getElementById('counts');
const labels = ['Напоминания','Задачи','Привычки','Заметки'];
let fixture;
let sent = false;

function showCounts(values) {
  counts.replaceChildren(...labels.map((label,index) => {
    const tile = document.createElement('span');
    const value = document.createElement('strong');
    value.textContent = values[index];
    tile.append(value,label);
    return tile;
  }));
}
run.addEventListener('click', () => {
  result.textContent = sent ? fixture.repeat : fixture.first;
  sent = true;
  run.textContent = 'Отправить повторно →';
  reset.disabled = false;
  showCounts(fixture.counts);
});
reset.addEventListener('click', () => {
  sent = false;
  result.textContent = 'Здесь появится ответ обработчика.';
  run.textContent = 'Показать разбор →';
  reset.disabled = true;
  showCounts([0,0,0,0]);
});
fetch('data/life.json').then(response => {
  if (!response.ok) throw new Error('Fixture unavailable');
  return response.json();
}).then(data => {
  fixture = data;
  input.textContent = data.input;
  run.disabled = false;
  showCounts([0,0,0,0]);
}).catch(() => { input.textContent = 'Не удалось загрузить сохранённый сценарий.'; });
