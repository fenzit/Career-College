const CITIES = ['Кызылорда', 'Алматы', 'Астана'];
const TYPES = ['Работа', 'Стажировка', 'Практика'];
const TRACKS = ['Разработка', 'Дизайн', 'Маркетинг', 'Аналитика', 'Техническая поддержка'];
const FORMATS = ['На месте', 'Удалённо', 'Гибрид'];
const SCHEDULES = ['Полная занятость', 'Частичная занятость', 'Гибкий график'];
const EXPERIENCE = ['Без опыта', 'С опытом'];
const PAY = ['Оплачиваемые', 'Без оплаты', 'Обсуждается'];
const AREAS = ['Разработка ПО', 'Дизайн и брендинг', 'Образовательные технологии', 'Аналитика данных'];
const SPECIALTIES = ['Программное обеспечение', 'Графический дизайн', 'Информационные системы'];
const COURSES = ['1 курс', '2 курс', '3 курс', '4 курс'];

const S = {
  pending: 'На проверке', confirmed: 'Подтверждено колледжем', revision: 'Нужны исправления',
  suspended: 'Доступ приостановлен', draft: 'Черновик', published: 'Опубликовано', closed: 'Закрыто',
  hidden: 'Скрыто колледжем', sent: 'Отправлен', viewed: 'Просмотрен', review: 'На рассмотрении',
  interview: 'Приглашение на собеседование', place: 'Предложение места', accepted: 'Предложение принято',
  rejected: 'Отказ компании', withdrawn: 'Отклик отозван', declinedPlace: 'Студент отказался от предложения',
  newInvite: 'Ожидает ответа', interested: 'Приглашение принято', noInvite: 'Приглашение отклонено',
  revokedInvite: 'Приглашение отозвано', complaint: 'Новая', resolved: 'Закрыта'
};
const CLOSED = [S.accepted, S.rejected, S.withdrawn, S.declinedPlace, S.noInvite, S.revokedInvite];
const TONES = {
  green: [S.confirmed, S.published, S.accepted, S.interested, 'Открыто', 'Подтверждено'],
  amber: [S.pending, S.revision, S.newInvite, 'Ожидает подтверждения', 'Запрошено другое время'],
  red: [S.suspended, S.rejected, S.hidden, 'Отклонено']
};

const FAQ = [
  ['Кто может зарегистрироваться?', 'Студенты Digital College и представители компаний. Колледж проверяет данные новых участников.'],
  ['Можно ли откликаться без опыта?', 'Да. В каталоге есть фильтр «Без опыта». В отклике можно рассказать об учебных или личных проектах.'],
  ['Что добавить в портфолио?', 'Подойдёт учебный проект, работа с практики или самостоятельная разработка. Опишите задачу, ваш вклад и результат.'],
  ['Кто увидит мой профиль?', 'Резюме и опубликованные проекты видны подтверждённым компаниям, если вы открыли профиль для предложений. Контакты передаются по вашему согласию.'],
  ['Как компания становится партнёром?', 'Представитель регистрирует компанию и подтверждает рабочую почту. После проверки колледжем откроются публикация предложений и каталог студентов.']
];

const companies = [
  {id:'orda', title:'Orda Tech', mark:'OT', area:AREAS[0], city:CITIES[0], status:S.confirmed, description:'Создаём веб-сервисы для местного бизнеса. В команде есть отдельные наставники для начинающих разработчиков.', benefits:'Студенты работают над небольшими задачами в паре с разработчиком и получают обратную связь на ревью.', representative:'Данияр Садыков', position:'Руководитель разработки', email:'orda@example.com', phone:'+7 700 000 00 01'},
  {id:'forma', title:'Forma Studio', mark:'FS', area:AREAS[1], city:CITIES[1], status:S.confirmed, description:'Студия проектирует интерфейсы, айдентику и сайты для образовательных и городских проектов.', benefits:'Первый проект можно выполнить в команде с дизайнером и добавить его в портфолио.', representative:'Алина Волкова', position:'Арт-директор', email:'forma@example.com'},
  {id:'bilim', title:'Bilim Lab', mark:'BL', area:AREAS[2], city:CITIES[0], status:S.confirmed, description:'Делаем цифровые материалы для обучения и помогаем преподавателям вести курсы.', benefits:'Знакомим стажёров с работой редакторов, методистов и команды поддержки.', representative:'Сауле Исаева', position:'Менеджер продукта', email:'bilim@example.com'},
  {id:'delta', title:'Delta Insights', mark:'DI', area:AREAS[3], city:CITIES[2], status:S.pending, description:'Готовим отчёты и автоматизируем обработку данных для небольших команд.', representative:'Азамат Сериков', position:'Аналитик', email:'delta@example.com', phone:'+7 700 000 00 04'}
];

const offerDescription = {
  tasks:'Разобраться в задаче вместе с наставником, подготовить решение и показать результат на встрече команды.',
  learn:'Работать с обратной связью, планировать небольшие задачи и объяснять принятые решения.',
  mentor:'В команде есть наставник. На первой неделе он поможет освоить инструменты и поставит первую задачу.',
  selection:'Отклик, короткая встреча с командой, знакомство с задачами.',
  schedule:'График согласовывается с учёбой.'
};
function demoOffer(id, title, company, type, track, city, format, pay, amount, date, description, skills, extra={}) {
  return {...offerDescription, id,title,company,type,track,city,format,pay,amount,date,description,skills,
    status:S.published, publishedAt:Date.UTC(2026,10,Number.parseInt(date,10)), experience:EXPERIENCE[0], employment:SCHEDULES[1], duration:'2 месяца', ...extra};
}
const offers = [
  demoOffer('frontend', 'Frontend-стажёр', 'orda', TYPES[1], TRACKS[0], CITIES[0], FORMATS[2], PAY[0], 'от 120 000 ₸', '18 ноября', 'Помогайте добавлять новые разделы в личный кабинет сервиса. Первую задачу разберёте с наставником, а затем покажете изменения на ревью.', 'HTML, CSS, JavaScript'),
  demoOffer('design', 'Помощник UX/UI-дизайнера', 'forma', TYPES[2], TRACKS[1], CITIES[1], FORMATS[1], PAY[0], 'от 80 000 ₸', '17 ноября', 'Собирайте прототипы экранов в Figma и готовьте материалы для тестирования. Первый интерфейс разработаете вместе с дизайнером студии.', 'Figma, прототипирование'),
  demoOffer('support', 'Специалист техподдержки', 'bilim', TYPES[0], TRACKS[4], CITIES[0], FORMATS[0], PAY[0], 'от 180 000 ₸', '15 ноября', 'Отвечайте на вопросы преподавателей о работе курсов и передавайте технические проблемы разработчикам.', 'Грамотная речь, работа с обращениями', {employment:SCHEDULES[0], duration:''}),
  demoOffer('testing', 'Стажёр по тестированию', 'orda', TYPES[1], TRACKS[0], CITIES[0], FORMATS[0], PAY[2], '', '13 ноября', 'Проверяйте сценарии личного кабинета и составляйте понятные отчёты об ошибках.', 'HTTP, тест-кейсы'),
  demoOffer('content', 'Практикант в редакцию курсов', 'bilim', TYPES[2], TRACKS[2], CITIES[0], FORMATS[2], PAY[1], '', '11 ноября', 'Помогайте готовить карточки уроков и проверять задания перед публикацией.', 'Редактура, работа с текстом'),
  demoOffer('brand', 'Младший дизайнер брендинга', 'forma', TYPES[0], TRACKS[1], CITIES[1], FORMATS[2], PAY[2], '', '10 ноября', 'Готовьте адаптации айдентики для сайтов и печатных материалов.', 'Figma, графический дизайн', {experience:EXPERIENCE[1], duration:''}),
  demoOffer('data', 'Стажёр по аналитике данных', 'delta', TYPES[1], TRACKS[3], CITIES[2], FORMATS[2], PAY[0], '100 000 ₸', '19 ноября', 'Собирайте отчёты о продажах вместе с аналитиком. Нужно уточнить график согласования отчётов с командой.', 'Excel, SQL', {status:S.pending, notes:[]}),
  demoOffer('html', 'Практикант по вёрстке', 'orda', TYPES[2], TRACKS[0], CITIES[0], FORMATS[0], PAY[1], '', '6 ноября', 'Помогать обновлять страницы справочного центра сервиса.', 'HTML, CSS', {status:S.closed})
];

const students = [
  {id:'aigerim', first:'Айгерим', last:'Сеитова', title:'Frontend-разработчик', specialty:SPECIALTIES[0], course:COURSES[2], group:'ПО-31', city:CITIES[0], status:S.confirmed, visible:true, format:FORMATS[2], employment:SCHEDULES[1], interests:TYPES[1], skills:'HTML, CSS, JavaScript, Figma', about:'Учусь на третьем курсе. Делаю небольшие веб-приложения и люблю доводить интерфейс до состояния, когда им удобно пользоваться с телефона.', experience:'Учебные командные проекты и самостоятельные прототипы.', languages:'Казахский, русский, английский B1', email:'aigerim@example.com', phone:'+7 700 000 00 11'},
  {id:'miras', first:'Мирас', last:'Оспанов', title:'UX/UI-дизайнер', specialty:SPECIALTIES[1], course:COURSES[1], group:'ГД-22', city:CITIES[0], status:S.confirmed, visible:true, format:FORMATS[1], employment:SCHEDULES[2], interests:TYPES[2], skills:'Figma, UX-исследования, прототипирование', about:'Проектирую интерфейсы учебных сервисов. Собираю обратную связь и уточняю сквозные сценарии.', email:'miras@example.com'},
  {id:'arina', first:'Арина', last:'Беловодова', title:'Аналитик данных', specialty:SPECIALTIES[2], course:COURSES[2], group:'ИС-32', city:CITIES[2], status:S.pending, visible:true, format:FORMATS[2], employment:SCHEDULES[1], interests:TYPES[1], skills:'SQL, Excel', about:'Разбираю открытые наборы данных и строю простые отчёты.', email:'arina@example.com'}
];

const projects = [
  {id:'campus', owner:'aigerim', title:'Расписание колледжа', category:'Веб-приложение', description:'Адаптивное расписание с быстрым поиском по группе.', task:'Сделать расписание, которое можно проверить с телефона между занятиями.', contribution:'Сверстала экраны и настроила фильтрацию по группе и дню недели.', result:'Собран прототип на пять учебных дней и проверен на телефонах одногруппников.', skills:'HTML, CSS, JavaScript', period:'Октябрь', status:S.published},
  {id:'library', owner:'miras', title:'Каталог библиотеки', category:'Дизайн интерфейсов', description:'Прототип поиска учебных материалов по предметам.', task:'Упростить поиск книг и методичек по специальности.', contribution:'Провёл интервью, спроектировал поиск и интерактивный прототип.', result:'Проверил пять поисковых сценариев с одногруппниками.', skills:'Figma, UX-исследования', status:S.published}
];
const interactions = [
  { id:'example-invite', kind:'invite', student:'aigerim', company:'orda', offer:'testing', date:'18 ноября', status:S.newInvite, text:'Айгерим, нам понравился ваш проект с расписанием. Хотели бы обсудить стажировку в команде тестирования.', messages:[], history:[S.newInvite] },
  { id:'example-apply', kind:'apply', student:'aigerim', company:'orda', offer:'html', date:'14 ноября', status:S.review, text:'Здравствуйте! Хочу подробнее узнать о задачах на практике.', messages:[{role:'company', text:'Здравствуйте! Посмотрели ваш проект. Хотим обсудить практику и график.'}], history:[S.sent,S.review] }
];
const complaints = [{id:'hours', title:'График в описании предложения', by:'Айгерим Сеитова', date:'18 ноября', target:'testing', reason:'Условия предложения', text:'На собеседовании назвали другой график. Можно ли уточнить часы в опубликованном описании?', status:S.complaint}];
const lookup = {specialties:[...SPECIALTIES], groups:['ПО-31','ГД-22','ИС-32'], skills:['HTML','CSS','JavaScript','Figma','SQL'], areas:[...AREAS]};
const lookupNames = {specialties:'Специальности', groups:'Группы', skills:'Навыки', areas:'Сферы деятельности'};

const marks = {
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>', back:'<path d="M19 12H5m6 6-6-6 6-6"/>',
  external:'<path d="M13 5h6v6m0-6-9 9"/><path d="M19 13v6H5V5h6"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>', search:'<circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4 4"/>',
  briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13a21 21 0 0 0 18 0m-9 1v2"/>',
  cap:'<path d="m2 10 10-5 10 5-10 5-10-5Zm4 2v5c4 3 8 3 12 0v-5m4-2v7"/>',
  building:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h.1M15 7h.1M9 11h.1m5.9 0h.1m-6.1 10v-6h6v6"/>',
  pin:'<path d="M20 10c0 5-8 11-8 11s-8-6-8-11a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  bookmark:'<path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1Z"/>',
  shield:'<path d="M12 22s7-3 7-10V6l-7-3-7 3v6c0 7 7 10 7 10Z"/><path d="m9 12 2 2 4-4"/>',
  sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="white"/><circle cx="15" cy="17" r="2.5" fill="white"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>',
  user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  users:'<path d="M16 21v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2m18 0v-2a5 5 0 0 0-3.5-4.8"/><circle cx="9.5" cy="7" r="3.5"/><path d="M17 3.5a3.5 3.5 0 0 1 0 7"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  chat:'<path d="M20 5H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3v4l5-4h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z"/><path d="M7 9h10M7 13h6"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 9h16c0-2-2-3-2-9m-8 12a2 2 0 0 0 4 0"/>',
  chart:'<path d="M3 4v17h18M8 17v-4m5 4V9m5 8V6"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m5 12 4 4L19 6"/>', link:'<path d="M10 13a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-2 2m2 6a4 4 0 0 0-6 0l-4 4a4 4 0 0 0 6 6l2-2"/>',
  file:'<path d="M5 3h9l5 5v13H5V3Zm9 0v5h5M8 12h8m-8 4h8"/>',
  flag:'<path d="M5 22V3m0 1c5-4 10 4 15 0v12c-5 4-10-4-15 0"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  settings:'<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2.2" fill="white"/><circle cx="16" cy="12" r="2.2" fill="white"/><circle cx="9" cy="19" r="2.2" fill="white"/>',
  code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-14-4 16"/>'
};

const DEMO = {
  role:'guest', studentId:'aigerim', companyId:'orda', pendingAccount:null,
  offers, companies, students, projects, interactions, complaints,
  savedOffers:{aigerim:['design']}, savedStudents:{orda:[]}, lookup, archived:{}, notices:[],
  settings:{}, approvalNotes:{}
};
