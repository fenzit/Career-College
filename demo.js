function approvalPage() {
  const item=state.role==='student'?getStudent():getCompany();
  return work('Статус проверки',item.status===S.confirmed?empty(S.confirmed,'Все действия для вашей роли доступны.',link('В кабинет',state.role,'btn primary'),'shield'):accountStatus(item));
}
function notifications() {
  const role=state.role, tab=memory.tab??'all';
  const list=getNotices();
  if(role==='student'&&state.studentId==='aigerim') list.push({id:'example',title:'Пришло приглашение',description:'Orda Tech приглашает обсудить стажировку по тестированию.',date:'18 ноября',path:'student/thread/example-invite',read:!!state.settings.exampleSeen});
  const visible=list.filter(item=>tab==='all'||!item.read);
  return work('Уведомления',tabs([['all','Все'],['unread','Непрочитанные']],tab)+
    (visible.length?`<div class="stack">${visible.map(item=>`<article class="card"><div class="split"><div class="row">${square(icon('bell'))}<div><h3>${esc(item.title)}</h3><div class="meta">${esc(item.date)}</div></div></div>${item.read?'':chip('Непрочитанное')}</div>
    <p>${esc(item.description)}</p>${button('Открыть','notice-open',{id:item.id,cls:'outline',icon:'arrow'})}</article>`).join('')}</div>`:
    empty('Уведомлений в этом разделе нет','Здесь появятся новые события в вашем кабинете.',link('К обзору',role,'btn primary'),'bell')),
    {actions:button('Отметить все прочитанными','notice-all',{cls:'outline',disabled:list.every(item=>item.read)})+link('Настроить уведомления',role+'/settings/alerts','btn outline')});
}
function settingsPage() {
  const role=state.role, actor=role==='student'?getStudent():role==='company'?getCompany():null;
  if (!actor) return work('Настройки',panel(block('Данные входа','Демонстрационный кабинет координатора.')+button('Выйти','out',{cls:'outline'})));
  const key=role+':'+actor.id;
  const settings=state.settings[key]??{};
  const tab=memory.tab??(route[2]==='alerts'?'alerts':'account');
  let content;
  if (tab==='alerts') content=panel('<h2>Почтовые уведомления</h2>'+form('settings-alerts',fields([
    ['responses','Отклики и приглашения',{type:'checkbox',value:true}],['messages','Сообщения',{type:'checkbox',value:true}],
    ['interviews','Собеседования',{type:'checkbox',value:true}],['moderation','Результаты проверки',{type:'checkbox',value:true}]
  ],Object.fromEntries(Object.entries(settings).map(([key,value])=>[key,Boolean(value)])))+info('Уведомления о безопасности аккаунта включены всегда.')+submit('Сохранить настройки'),data=>{
    state.settings[key]=Object.fromEntries(['responses','messages','interviews','moderation'].map(key=>[key,data[key]==='on']));
    finish('Настройки сохранены');
  }));
  else if (tab==='privacy'&&role==='student') content=panel(block('Видимость профиля',visibility(actor))+info('Компания увидит телефон и почту после вашего согласия поделиться контактами.')+
    `<div class="actions top-gap">${button('Настроить видимость','visibility',{cls:'primary'})}</div>`);
  else content=`<div class="stack">${panel(block('Электронная почта',actor.email)+`<div class="actions top-gap">${button('Изменить почту','settings-email',{cls:'outline'})}${button('Изменить пароль','settings-password',{cls:'outline'})}</div>`)}
   ${panel('<h2>Управление аккаунтом</h2>'+`<div class="actions">${button('Выйти','out',{cls:'outline'})}${button('Удалить аккаунт','settings-delete',{cls:'danger'})}</div>`)}</div>`;
  return work('Настройки',tabs([['account','Данные входа'],['alerts','Уведомления'],...(role==='student'?[['privacy','Конфиденциальность']]:[])],tab)+content);
}
function settingsAction(action) {
  const actor=state.role==='student'?getStudent():getCompany();
  if (!actor||!['student','company'].includes(state.role)) return;
  if (action==='settings-email') question('Изменить почту','Укажите адрес для входа в аккаунт.','Сохранить почту',data=>{
    const email=data.email.trim();
    if ([...state.students,...state.companies].some(item=>item!==actor && item.email?.toLowerCase()===email.toLowerCase())) {
      const f=dialog.querySelector('[name="email"]');formError(f,'Адрес уже используется.');f.focus();return false;
    }
    actor.email=email; finish('Почта обновлена');
  },{fields:field('email','Новая почта',{type:'email',required:true,value:actor.email})});
  if (action==='settings-password') question('Изменить пароль','В макете можно проверить форму смены пароля.','Сохранить пароль',()=>{
    finish('Форма смены пароля заполнена');
  },{fields:field('current','Текущий пароль',{type:'password',required:true})+fields(passwordFields())});
  if (action==='settings-delete') question('Удалить аккаунт','В этом браузере аккаунт скроется из каталога и станет недоступен для входа. История взаимодействий сохранится.',
    'Удалить аккаунт',()=>{
      actor.status=S.suspended; actor.deleted=true; state.role='guest'; finish('Аккаунт удалён в демонстрации','');
    },{danger:true});
}

const paths = {
  public:[['Главная',''],['Каталог предложений','offers'],['Страница предложения','offers/frontend'],['Закрытое предложение','offers/html'],['Каталог компаний','companies'],
    ['Страница компании','companies/orda'],['О платформе','about'],['Помощь и контакты','help'],['Правила','rules'],['Конфиденциальность','privacy'],['Вход','login'],
    ['Выбор роли','register'],['Регистрация студента','register/student'],['Регистрация компании','register/company'],['Восстановление пароля','recovery'],
    ['Подтверждение почты','verify'],['Устаревшая ссылка','verify/expired']],
  student:[['Обзор','student'],['Мой профиль','student/profile'],['Редактирование резюме','student/resume'],['Управление портфолио','student/portfolio'],
    ['Создание проекта','student/project-edit'],['Страница проекта','student/project/campus'],['Мои отклики','student/applications'],['Приглашения','student/invitations'],
    ['Переписка по отклику','student/thread/example-apply'],['Переписка по приглашению','student/thread/example-invite'],['Избранное','student/saved'],
    ['Уведомления','student/notifications'],['Настройки','student/settings'],['Статус проверки','student/approval']],
  company:[['Обзор','company'],['Профиль компании','company/profile'],['Редактирование компании','company/edit'],['Каталог студентов','company/students'],
    ['Страница студента','company/student/aigerim'],['Проект студента','company/project/campus'],['Избранные студенты','company/saved'],['Мои предложения','company/offers'],
    ['Карточка предложения','company/offer/frontend'],['Создание предложения','company/offer-edit'],['Отклики','company/applications'],['Приглашения','company/invitations'],
    ['Страница взаимодействия','company/thread/example-apply'],['Уведомления','company/notifications'],['Настройки','company/settings'],['Статус проверки','company/approval']],
  coordinator:[['Обзор','coordinator'],['Студенты','coordinator/students'],['Карточка студента','coordinator/record/arina'],['Компании','coordinator/companies'],
    ['Карточка компании','coordinator/company/delta'],['Предложения','coordinator/offers'],['Страница проверки предложения','coordinator/offer/data'],
    ['Жалобы','coordinator/complaints'],['Карточка жалобы','coordinator/complaint/hours'],['Статистика','coordinator/stats'],['Справочники','coordinator/reference']]
};
const demos=[
  ['Регистрация студента','register/student','Подтвердите почту в макете → заполните резюме → добавьте проект → откройте профиль.'],
  ['Отклик студента','offers','Войдите как студент → найдите вакансию → отправьте отклик → откройте переписку в «Моих откликах».','student'],
  ['Ответ на приглашение','student/notifications','Откройте приглашение → нажмите «Мне интересно». В кабинете компании назначьте собеседование, затем подтвердите участие от студента.','student'],
  ['Регистрация компании','register/company','Подтвердите почту → заполните профиль. В кабинете колледжа откройте компанию и подтвердите её.'],
  ['Публикация предложения','company/offer-edit','Пройдите четыре шага → отправьте на проверку. В кабинете колледжа одобрите запись и откройте публичную страницу.','company'],
  ['Поиск студента','company/students','Отфильтруйте каталог → откройте профиль и проект → выберите активное предложение и отправьте приглашение.','company'],
  ['Рассмотрение отклика','company/thread/example-apply','Откройте резюме → назначьте собеседование → отправьте предложение места. В кабинете студента ответьте на него.','company'],
  ['Работа координатора','coordinator/company/delta','Подтвердите Delta Insights → верните «Стажёр по аналитике данных» с замечаниями. Войдите как Delta Insights, исправьте запись и отправьте повторно. Одобрите в кабинете колледжа.','coordinator'],
  ['Изменение видимости','student/profile','Откройте настройки видимости → выберите «Не ищу предложения». Профиль исчезнет из каталога компании.','student'],
  ['Отрицательные исходы','map#states','В отклике можно оформить отказ или отозвать отклик. В приглашении доступно отклонение, а в карточке предложения компании — закрытие.']
];
function sitemap() {
  const entry=(label,path,role='') => role ? button(label,'demo-path',{id:role+'|'+path,cls:'outline',icon:'arrow'}) : link(label,path,'btn outline','arrow');
  return page(heading('Карта прототипа','Перейдите к экрану или начните сценарий с нужной роли. Данные для демонстрации сохраняются в текущем браузере.',['Главная',''],
    link('Компоненты и состояния','components','btn primary')+button('Сбросить примеры','demo-reset',{cls:'outline'}))+
    `<div class="grid two">${Object.entries(paths).map(([role,links])=>panel(`<h2>${roleLabels[role]??'Публичные страницы'}</h2><div class="actions">${links.map(([label,path])=>entry(label,path,role==='public'?'':role)).join('')}</div>`)).join('')}</div>
    <section class="section">${sectionHead('Сценарии')}<div class="grid two">${demos.map(([label,path,steps,role])=>
      `<div class="card"><h3>${esc(label)}</h3><p>${esc(steps)}</p><div class="actions">${entry(label==='Отрицательные исходы'?'Посмотреть состояния':'Начать сценарий',label==='Отрицательные исходы'?'components':path,role)}</div></div>`).join('')}</div></section>`);
}
function componentPage() {
  const loading=memory.load??'loading';
  return page(heading('Компоненты и состояния','Базовые элементы интерфейса для всех кабинетов.',['Карта прототипа','map'])+
    `<div class="stack"><div class="grid two">
    ${panel(`<div class="stack"><h2>Акцент</h2><div class="row"><span class="swatch"></span><div><strong>Синий Digital College</strong><div class="meta">#004682 · кнопки, ссылки и фокус</div></div></div>
    <div class="actions">${button('Основное действие','component-success',{cls:'primary'})}${button('Вторичное действие','component-success',{cls:'outline'})}
    ${button('Недоступно','component-success',{disabled:true})}${button('Подтверждение','component-modal',{cls:'danger'})}</div></div>`)}
    ${panel('<h2>Статусы и вкладки</h2>'+`<div class="chips">${[S.pending,S.confirmed,S.revision,S.suspended,S.closed].map(status).join('')}</div>`+
      tabs([['all','Все'],['new','Новые'],['done','Завершённые']],memory.tab??'all')+`<p class="top-gap">${memory.tab==='new'?'Показаны новые записи.':memory.tab==='done'?'Показаны завершённые записи.':'Показаны все записи.'}</p>`)}
    ${panel('<h2>Поля формы</h2>'+form('components',field('email','Электронная почта',{type:'email',required:true,help:'Пример: name@example.com.'})+
      field('select','Формат работы',{choices:FORMATS})+submit('Проверить форму'),async()=>{
        await new Promise(resolve=>setTimeout(resolve,500)); notice('Данные проверены.');
      }))}
    ${panel('<h2>Уведомление</h2>'+`<div class="stack">${info('Отклик отправлен. Компания увидит его в своём кабинете.') }
    ${info('Для отправки отклика подтвердите свой аккаунт.','amber')}${info('Сообщение не отправлено. Повторите попытку.','error')}</div>`)}</div>
    ${sectionHead('Состояния интерфейса')}
    <div class="actions">${[['loading','Загрузка'],['error','Ошибка'],['empty','Пустой список'],['access','Нет доступа'],['closed','Объект недоступен'],['success','Успех']].map(([id,label])=>
      button(label,'component-state',{id,pressed:loading===id,cls:loading===id?'primary':'outline'})).join('')}</div>
    ${loading==='loading'?`<div class="grid three" aria-label="Загрузка карточек" aria-busy="true"><div class="card skeleton"></div><div class="card skeleton"></div><div class="card skeleton"></div></div>`:
      loading==='error'?empty('Не удалось загрузить предложения','Попробуйте снова. Введённые фильтры сохранятся.',button('Попробовать снова','component-retry',{cls:'primary'}),'flag'):
      loading==='empty'?empty('Вы ещё не откликались на предложения','Найдите стажировку, практику или работу в каталоге.',link('Найти предложения','offers','btn primary')):
      loading==='access'?empty('Нет доступа к каталогу студентов','Каталог доступен подтверждённым компаниям и координатору.',link('Войти','login','btn primary'),'shield'):
      loading==='closed'?empty('Приём откликов завершён','Описание закрытого предложения всё ещё можно посмотреть.',link('Открыть предложение','offers/html','btn primary')):
      empty('Изменения сохранены','Теперь их можно увидеть в профиле.',button('Открыть профиль в макете','demo-path',{id:'student|student/profile',cls:'primary'}),'check')}
    ${sectionHead('Карточки, фильтры и таблицы')}
    <div class="grid two">${offerCard(catalogOffers()[0]??DEMO.offers[0],true)}${filterForm(offerFilters.slice(0,3))}</div>
    ${table(['Предложение','Компания','Состояние','Действия'],[['Frontend-стажёр','Orda Tech',status(S.published),link('Открыть','offers/frontend','btn outline')]])}</div>`);
}
