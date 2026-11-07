const kind=new URLSearchParams(location.search).get('project')==='arbitrage'?'arbitrage':'crypto';
document.body.dataset.demo = kind;
const projects={crypto:{number:'01 / АВТОМАТИЗАЦИЯ КОНТЕНТА',title:'CryptoNews\nPublisher',description:'От нескольких источников — к одной очереди публикаций. Редактор управляет всем процессом через Telegram.',avatar:'CN',chat:'CryptoNews Publisher',repo:'cryptonews-publisher',steps:[{name:'Панель редактора',description:'Канал, расписание и основные действия в одном сообщении.',snapshot:true},{name:'Подготовка поста',description:'Черновик из учебной ленты релизов. Можно запросить вторую редакцию, отклонить или подтвердить публикацию в демо.',text:'Предпросмотр публикации\n\nКак устроен путь новости до канала\n\nСистема собирает материалы из RSS и Telegram, подготавливает текст и передаёт его редактору. Перед публикацией можно проверить содержание, отклонить материал или запросить новую версию.\n\nЭто пример для демонстрации интерфейса, а не реальная новость.\n\n#Telegram #Автоматизация',buttons:[['Опубликовать','Отклонить'],['Перегенерировать','Без фото'],['Главная']]},{name:'Расписание',description:'Выбор часов публикации по московскому времени.',text:'Расписание\n\nВыберите часы публикации.\nЧасовой пояс: Москва (UTC+3).\n\nВ этом стенде настройки не сохраняются на сервере.',buttons:[['06:00','07:00','08:00','09:00'],['12:00','13:00','16:00','19:00'],['21:00','22:00','23:00'],['Назад']]},{name:'Очередь публикаций',description:'Редактор возвращается к неопубликованным материалам.',text:'Неопубликованные\n\nДемонстрационный материал ожидает проверки.\n\nРедактор может открыть предпросмотр, обновить текст или отклонить публикацию.',buttons:[['Открыть предпросмотр'],['Главная']]}]},arbitrage:{number:'02 / МОНИТОРИНГ И ИНТЕГРАЦИИ',title:'CEX/DEX\nMonitor',description:'Рыночные данные, ограничения и управление в Telegram. Демонстрация панели на тестовом состоянии без подключения торговых аккаунтов.',avatar:'AM',chat:'Arbitrage Monitor',repo:'cex-dex-arbitrage-monitor',steps:[{name:'Панель мониторинга',description:'Панель сформирована реальной функцией проекта на нулевом тестовом состоянии.',snapshot:true},{name:'Открытые позиции',description:'Пустое состояние: показываем отсутствие данных без выдуманной прибыли.',text:'Открытые DEX позиции\n\nОткрытых позиций нет.\n\nРежим демонстрации: торговые аккаунты и кошельки не подключены.',buttons:[['Обновить'],['Назад']]},{name:'Контроль исполнения',description:'Пример параметров из конфигурации проекта.',text:'Настройки стратегии\n\nРеальная торговля: выключена\nРазмер сделки: 30 USDT\nTake profit: 1.2%\nStop loss: 0.7%\nДопуск проскальзывания: 0.5%\nДневной лимит убытка: 10 USDT\nЛимит сделок: 50\n\nТестовые значения из конфигурации. Изменения на этом стенде не применяются.',buttons:[['Назад']]},{name:'P2P-сценарий',description:'Пояснение потока данных из сервисов проекта.',text:'P2P Triangle\n\nПроверка направлений между площадками с учётом:\n\nПлатёжного метода\nЛимитов объявления\nДоступной ликвидности\nКомиссий и запаса по издержкам\n\nДемонстрационный сценарий. Рыночные котировки не загружаются.',buttons:[['Главная']]}]}};
const p=projects[kind];
document.getElementById('sidebar-avatar').textContent = p.avatar;
document.getElementById('sidebar-title').textContent = p.chat;
document.title=p.chat+' — демонстрация';for(const [id,value] of Object.entries({number:p.number,title:p.title,description:p.description,avatar:p.avatar,'chat-title':p.chat,sender:p.chat})){document.getElementById(id).textContent=value}document.getElementById('title').style.whiteSpace='pre-line';document.getElementById('source').href='https://github.com/Max0209-web/'+p.repo;let step=0;let snapshot=null;
function render(){syncCryptoSteps();document.getElementById('chapters').replaceChildren(...p.steps.map((s,i)=>{const b=document.createElement('button');b.className='chapter'+(i===step?' active':'');b.textContent=String(i+1).padStart(2,'0')+' / '+s.name;b.onclick=()=>{step=i;render()};return b}));const s=p.steps[step];document.getElementById('counter').textContent=String(step+1).padStart(2,'0')+' / 04';document.getElementById('step-label').textContent=s.name;document.getElementById('step-description').textContent=s.description;document.getElementById('feedback').textContent='';document.getElementById('message').textContent=s.snapshot?(snapshot?.text||'Загрузка демонстрационного состояния…'):s.text;const rows=s.snapshot?(snapshot?.buttons||[]):s.buttons;document.getElementById('keyboard').replaceChildren(...rows.map(row=>{const d=document.createElement('div');d.className='key-row';row.forEach(label=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>action(label,b);d.append(b)});return d}));document.getElementById('next').textContent=step===3?'К началу →':'Следующий шаг →'}
// State for the public walkthrough, independent from Telegram and Gemini.
let draftState = 'empty';
let draftVersion = 1;
const schedule = new Set(['07:00','13:00','19:00']);
function syncCryptoSteps() {
  if (kind !== 'crypto') return;
  const heading = 'Условный пример: вышло обновление клиента сети';
  p.steps[1].text = draftState === 'pending'
    ? heading + '\n\n' + (draftVersion === 1
      ? 'Учебная лента релизов сообщила о версии 2.4. В журнале изменений отмечены исправления синхронизации. Перед публикацией редактор сверяет версию и формулировку с источником.'
      : 'Версия 2.4: исправлена синхронизация. Вторая редакция убирает лишние подробности и оставляет только сведения из учебного журнала изменений.')
    : {empty:'Сначала создайте черновик из примера RSS.',published:'Черновик отмечен как опубликованный в демо.',rejected:'Черновик отклонён и убран из очереди.'}[draftState];
  p.steps[1].buttons = draftState === 'pending'
    ? [['Опубликовать','Отклонить'],['Перегенерировать','Без фото'],['Главная']]
    : [['Сгенерировать пост'],['Главная']];
  p.steps[2].text = 'Часы в демо (МСК): ' + ([...schedule].sort().join(', ') || 'не выбраны') + '\n\nНажмите на время, чтобы добавить или убрать его.';
  p.steps[3].text = draftState === 'pending'
    ? 'Ожидает проверки: 1\n\n' + heading
    : 'Ожидает проверки: 0';
  p.steps[3].buttons = draftState === 'pending' ? [['Открыть предпросмотр'],['Главная']] : [['Главная']];
}
function updateCrypto(label) {
  if (kind !== 'crypto') return false;
  let feedback = '';
  if (label === 'Сгенерировать пост') {
    draftState = 'pending';
    draftVersion = 1;
    step = 1;
    feedback = 'Черновик добавлен в очередь редактора.';
  } else if (label === 'Перегенерировать' && draftState === 'pending') {
    draftVersion = 2;
    feedback = 'Показана вторая редакция учебного черновика.';
  } else if (label === 'Отклонить' && draftState === 'pending') {
    draftState = 'rejected';
    feedback = 'Черновик убран из очереди.';
  } else if (['Опубликовать','Без фото'].includes(label) && draftState === 'pending') {
    draftState = 'published';
    feedback = 'Отмечено в демо. Публикация в Telegram не выполнялась.';
  } else if (/^\d\d:00$/.test(label)) {
    if (schedule.has(label)) schedule.delete(label);
    else schedule.add(label);
  } else {
    return false;
  }
  render();
  document.getElementById('feedback').textContent = feedback;
  return true;
}
function action(label,button){if(updateCrypto(label))return;if(/Главная|Назад/.test(label)){step=0;render();return}if(/Сгенерировать|предпросмотр/.test(label)){step=1;render();return}if(/Настройки/.test(label)){step=2;render();return}if(/Неопубликованные/.test(label)){step=3;render();return}if(/Позиции/.test(label)){step=1;render();return}if(/\d\d:00/.test(label)){button.style.background=button.style.background?'':'#5d7a64';document.getElementById('feedback').textContent='Выбор времени изменён только в демонстрации.';return}const messages={'Опубликовать':'Согласование показано. Настоящая публикация в Telegram не выполнялась.','Отклонить':'Материал отклонён в демонстрационной очереди.','Перегенерировать':'В рабочем боте здесь запускается новый запрос к Gemini.','Без фото':'Показан сценарий публикации без медиа. Запросы к Telegram не отправляются.','Обновить':'Тестовое состояние обновлено. Внешние сервисы не подключены.','История':'История пуста: сделки в демонстрации не исполнялись.','Балансы':'Биржевые аккаунты и кошельки в демонстрации не подключены.','Дайджест':'В рабочем боте здесь собирается дайджест новостей.'};document.getElementById('feedback').textContent=messages[label]||'Этот раздел доступен в рабочем боте. Исходный код — по ссылке слева.'}
document.getElementById('next').onclick=()=>{step=(step+1)%4;render()};render();fetch('data/'+kind+'.json').then(r=>{if(!r.ok)throw Error('snapshot');return r.json()}).then(data=>{snapshot=data;render()}).catch(()=>{document.getElementById('message').textContent='Запустите локальный сервер по инструкции в README или откройте опубликованную версию.'});
const guideCopy = document.getElementById('guide-copy');
if (guideCopy) {
  const project = new URLSearchParams(location.search).get('project');
  guideCopy.textContent = project === 'arbitrage'
    ? 'Загляни в настройки. Тут всё в режиме демо.'
    : 'Сначала черновик, потом кнопка «Опубликовать».';
}

const demo = document.querySelector('main');
function dismissInteractionHint(event) {
  if (!event.target.closest('button:not(:disabled)')) return;
  demo.querySelector('.interaction-hint')?.remove();
  demo.removeEventListener('click', dismissInteractionHint, true);
}
demo.addEventListener('click', dismissInteractionHint, true);
