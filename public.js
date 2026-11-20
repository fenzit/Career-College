const publicNav = [['Вакансии и стажировки','offers'],['Компании','companies'],['О платформе','about']];
const brand = () => `<a class="brand" href="#/" aria-label="Карьера колледжа, главная"><img src="assets/college-mark.png" alt="" width="39" height="41"><span><strong>Карьера колледжа</strong><small>Digital College</small></span></a>`;
const roleLabels = {student:'Кабинет студента',company:'Кабинет компании',coordinator:'Кабинет колледжа'};
function showHeader() {
  const guest=state.role==='guest';
  const count=getNotices().filter(note => !note.read).length + (state.role==='student' && state.studentId==='aigerim' && !state.settings.exampleSeen ? 1 : 0);
  const nav=publicNav.map(([label,path]) => `<a href="#/${path}"${route[0]===path?' aria-current="page"':''}>${label}</a>`).join('');
  const account=guest ? '' : state.role==='student' ? studentName(getStudent()) : state.role==='company' ? getCompany().title : 'Колледж';
  const mobileItems=guest ? link('Войти','login','btn outline')+link('Зарегистрироваться','register','btn primary') :
    link(roleLabels[state.role],state.role,'btn primary')+link('Настройки',state.role+'/settings','btn ghost')+button('Выйти','out',{cls:'ghost'});
  header.innerHTML=`<div class="wrap header-inner">${brand()}
    <nav class="nav" aria-label="Основное меню">${nav}</nav>
    <div class="header-actions">${guest ? link('Войти','login','btn ghost desktop')+link('Зарегистрироваться','register','btn primary desktop') :
    link('Кабинет',state.role,'btn outline desktop')+ (state.role!=='coordinator' ? `<a href="#/${state.role}/notifications" class="btn outline icon-btn notification-button" aria-label="Уведомления${count?', непрочитанных '+count:''}">${icon('bell')}${count?`<b>${count}</b>`:''}</a>` : '')+
    button(account,'account-menu',{icon:'user',only:true,cls:'outline',expanded:false})}
    ${button('Открыть меню','mobile-menu',{icon:'menu',only:true,cls:'outline menu-toggle',expanded:false,controls:'mobile-nav'})}</div>
    </div><nav id="mobile-nav" class="wrap mobile-nav" aria-label="Меню" hidden>${nav}${mobileItems}</nav>`;
  footer.className='footer';
  footer.innerHTML=`<div class="wrap split"><div>${brand()}<p>Практика, стажировки и работа для студентов колледжа.</p></div>
   <nav class="nav footer-links" aria-label="О платформе">${[['О платформе','about'],['Помощь и контакты','help'],['Правила использования','rules'],['Политика конфиденциальности','privacy'],['Карта прототипа','map']].map(([label,path])=>link(label,path)).join('')}</nav></div>`;
}
function home() {
  const recent=catalogOffers().slice(0,3);
  const featured=state.companies.filter(company=>company.status===S.confirmed).slice(0,3);
  return `<section class="hero"><div class="wrap hero-grid">
    <div class="hero-copy"><div class="kicker">${icon('cap')} Карьерная платформа Digital College</div>
    <h1>Начни карьеру <em>вместе с&nbsp;колледжем</em></h1>
    <p>Создай резюме, покажи свои проекты и найди практику, стажировку или работу у компаний-партнёров.</p>
    <div class="actions">${link('Я студент','register/student','btn primary large','arrow')}${link('Я работодатель','register/company','btn outline large','building')}</div>
    <div class="hero-link">${link('Смотреть предложения','offers','text-link','arrow')}</div></div>
    <figure class="hero-art"><img src="assets/students.webp" alt="Двое студентов работают за ноутбуком" width="1350" height="1013" fetchpriority="high"><figcaption class="photo-note">${square(icon('shield'),'blue')}<span><strong>Проверенные партнёры</strong><small>Компании подтверждает колледж</small></span></figcaption></figure>
    </div></section>
    <section class="section"><div class="wrap">${sectionHead('Новые предложения','Практика, стажировки и работа от компаний-партнёров.',link('Все предложения','offers','btn outline','arrow'))}<div class="grid three">${recent.map(offer=>offerCard(offer,true)).join('')}</div></div></section>
    <section class="section tint"><div class="wrap">${sectionHead('Как это работает')}<div class="grid two">
    <div class="card how-card">${square(icon('cap'),'blue')}<h3>Для студентов</h3><ol><li>Заполни профиль и резюме.</li><li>Добавь учебные или личные проекты.</li><li>Откликайся и отвечай на приглашения.</li></ol>${link('Создать профиль','register/student','text-link','arrow')}</div>
    <div class="card how-card">${square(icon('building'))}<h3>Для компаний</h3><ol><li>Зарегистрируй компанию.</li><li>Пройди подтверждение колледжем.</li><li>Публикуй предложения и приглашай студентов.</li></ol>${link('Стать партнёром','register/company','text-link','arrow')}</div>
    </div></div></section>
    <section class="section"><div class="wrap">${sectionHead('Компании-партнёры','',link('Все компании','companies','btn outline','arrow'))}<div class="grid three">${featured.map(company=>companyCard(company,true)).join('')}</div></div></section>
    <section class="section tint"><div class="wrap">${sectionHead('Вопросы и ответы')}${faqList()}</div></section>`;
}
function faqList() {
  return `<div class="faq">${FAQ.map(([question,answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join('')}</div>`;
}
function companyLine(company, linked=false) {
  return `<span class="company-line">${square(esc(company.mark),company.id==='orda'?'blue':'light')}${linked ? link(company.title,'companies/'+company.id) : esc(company.title)}</span>`;
}
function offerCard(offer, compact=false) {
  const company=getCompany(offer.company);
  const fav=state.role==='student' && (state.savedOffers[state.studentId] ?? []).includes(offer.id);
  const applied=state.role==='student' && matchingInteraction('apply',offer.id);
  const details='offers/'+offer.id;
  return `<article class="card">
    <div class="card-top"><div class="chips">${chip(offer.type)}${offer.status===S.closed?status(S.closed):''}</div>
    ${button(fav?'Убрать из избранного':'Сохранить предложение','save-offer',{id:offer.id,icon:'bookmark',only:true,cls:'ghost bookmark',pressed:fav})}</div>
    <h3>${link(offer.title,details)}</h3>${companyLine(company,true)}
    <div class="meta"><span>${icon('pin')}${esc(offer.city)}</span><span>${esc(offer.format)}</span><span>${esc(offer.experience)}</span>${compact?'':`<span>${esc(offer.employment)}</span>`}</div>
    ${compact?'':`<p>${esc(offer.description)}</p>`}
    <div class="split card-footer"><strong>${esc(money(offer))}</strong><span class="meta">${esc(offer.date)}</span></div>
    <div class="actions">${compact ? link('Подробнее',details,'text-link','arrow') : link('Подробнее',details,'btn outline','arrow')+
      (applied ? link('Открыть отклик','student/thread/'+applied.id,'btn') : button('Откликнуться','apply',{id:offer.id,cls:'primary',disabled:offer.status===S.closed}))}
      ${applied?chip('Вы откликнулись','green'):''}</div>
  </article>`;
}
const offerFilters = [
  ['type','Тип предложения',TYPES], ['track','Направление',TRACKS], ['city','Город',CITIES], ['format','Формат',FORMATS],
  ['employment','Занятость',SCHEDULES], ['experience','Опыт',EXPERIENCE], ['pay','Оплата',PAY]
];
function filterForm(items, additional='') {
  return panel(`<h2>Фильтры</h2>${form('filters',items.map(([key,label,choices])=>field(key,label,{choices,placeholder:'Любое значение',value:memory.filters?.[key]})).join('')+
     additional+`<div class="actions">${submit('Применить')}${button('Сбросить','clear-filters',{cls:'ghost'})}</div>`,(data)=>{
     memory.filters=Object.fromEntries(Object.entries(data).filter(([,value])=>value)); memory.filterOpen=false; memory.page=1; renderResults();
  })}`,'filters'+(memory.filterOpen?' is-open':'')).replace('<div class="panel','<div id="filters" class="panel');
}
function searchForm(placeholder) {
  return form('search',`<div class="search-box">${icon('search')}<input name="q" type="search" aria-label="${esc(placeholder)}" placeholder="${esc(placeholder)}" value="${esc(memory.query ?? '')}"></div>${submit('Найти')}`,data=>{
    memory.query=data.q.trim(); memory.page=1; renderResults();
  }).replace('class="form"','class="search"');
}
function contains(text, query=memory.query) {
  return !query || query.toLocaleLowerCase('ru').split(/\s+/).every(word=>String(text).toLocaleLowerCase('ru').includes(word));
}
const matches = (item, filters=memory.filters ?? {}) => Object.entries(filters).every(([key,value])=>String(item[key]??'')===value);
function resultFilters(filters,mapping) {
  const labels=new Map(mapping.map(([key,label])=>[key,label]));
  return Object.entries(filters).map(([key,value])=>`<span class="chip">${esc(key==='open'?'Есть предложения':key==='projects'?'Есть проекты':key==='new'?'Только новые':value)} <button type="button" data-do="remove-filter" data-id="${esc(key)}" aria-label="Убрать фильтр «${esc(labels.get(key) ?? value)}»">${icon('close')}</button></span>`).join('');
}
function catalog() {
  const filters=memory.filters ?? {};
  const results=catalogOffers().filter(o=>matches(o,filters) && contains([o.title,o.skills,getCompany(o.company).title,o.track].join(' ')));
  if (memory.sort==='match') results.sort((a,b)=>Number(a.experience!==EXPERIENCE[0])-Number(b.experience!==EXPERIENCE[0]) || Number(b.city===CITIES[0])-Number(a.city===CITIES[0]));
  const batch=4, pages=Math.ceil(results.length/batch);
  const current=Math.min(memory.page??1,pages||1);
  return page(heading('Вакансии, стажировки и практика','Найдите предложение по своей специальности и удобному формату.', ['Главная',''])+searchForm('Должность, навык или компания')+
    `<div class="actions filter-toggle">${button('Фильтры','open-filters',{icon:'sliders',cls:'outline',expanded:!!memory.filterOpen,controls:'filters'})}</div>
    <div class="page-columns catalog-layout">${filterForm(offerFilters)}<section aria-label="Результаты поиска">
    <div class="split results-bar"><p>Найдено предложений: ${results.length}</p><select class="sort" aria-label="Сортировка" data-sort><option value="new">Сначала новые</option><option value="match"${memory.sort==='match'?' selected':''}>По соответствию</option></select></div>
    ${Object.keys(filters).length?`<div class="chips applied-filters">${resultFilters(filters,offerFilters)}</div>`:''}
    ${results.length ? `<div class="grid two results">${results.slice((current-1)*batch,current*batch).map(offer=>offerCard(offer)).join('')}</div>` :
    empty('По вашим условиям ничего не найдено','Попробуйте другой запрос или сбросьте фильтры.',button('Сбросить фильтры','clear-search',{cls:'primary'}),'search')}
    ${pages>1?`<nav class="pagination" aria-label="Страницы результатов">${Array.from({length:pages},(_,index)=>button(String(index+1),'page',{id:index+1,pressed:current===index+1,cls:current===index+1?'primary':'outline'})).join('')}</nav>`:''}</section></div>`);
}
function offerContent(offer) {
  return [
    ['О предложении',offer.description],['Что предстоит делать',offer.tasks],['Какие навыки нужны',offer.skills],
    ['Чему можно научиться',offer.learn],['Условия',[money(offer),offer.employment,offer.format,offer.conditions].filter(Boolean).join(' · ')],
    ['График',[offer.schedule,offer.start && 'Начало: '+offer.start,offer.deadline && 'Приём откликов до: '+offer.deadline].filter(Boolean).join('\n')],
    ['Длительность',offer.type!==TYPES[0]?offer.duration:''],['Наставник',offer.mentor],['Этапы отбора',offer.selection]
  ].map(([label,text])=>block(label,text)).join('');
}
function offerPage(offer) {
  if (!offer) {
    const unavailableOffer=getOffer(route[1]);
    return unavailable(unavailableOffer?'Предложение недоступно':'Страница не найдена',unavailableOffer?'Публикация сейчас недоступна. В каталоге можно посмотреть открытые предложения.':'Проверьте ссылку или откройте каталог.','offers','В каталог');
  }
  const company=getCompany(offer.company);
  const related=catalogOffers().filter(item=>item.id!==offer.id && (item.track===offer.track || item.company===offer.company)).slice(0,2);
  const closed=offer.status===S.closed;
  const saved=(state.savedOffers[state.studentId]??[]).includes(offer.id) && state.role==='student';
  const applied=state.role==='student' && matchingInteraction('apply',offer.id);
  return page(heading(offer.title,'',['Вакансии и стажировки','offers'])+
    `<div class="stack"><section class="panel stack"><div class="split">${companyLine(company,true)}<div class="chips">${chip(offer.type)}${status(closed?S.closed:'Открыто')}</div></div>
    <div class="meta"><span>${icon('pin')}${esc(offer.city)} · ${esc(offer.format)}</span><span>${esc(offer.employment)}</span><span>${esc(offer.experience)}</span><span>${icon('calendar')}${esc(offer.date)}</span></div>
    <h2>${esc(money(offer))}</h2>
    <div class="actions">${applied ? link('Открыть отклик','student/thread/'+applied.id,'btn primary')+chip('Вы откликнулись','green') :
      button('Откликнуться','apply',{id:offer.id,cls:'primary',disabled:closed})}
    ${button(saved?'Сохранено':'Сохранить','save-offer',{id:offer.id,cls:'outline bookmark',icon:'bookmark',pressed:saved})}
    ${button('Поделиться','share',{id:offer.id,cls:'outline',icon:'link'})}</div>
    ${closed?info('Приём откликов завершён.','amber'):''}</section>
    <div class="page-columns detail">${panel(offerContent(offer))}<aside class="stack">${companyCard(company)}
    ${button('Пожаловаться','report',{id:offer.id,cls:'ghost',icon:'flag'})}</aside></div>
    ${related.length?`<section class="section">${sectionHead('Похожие предложения')}<div class="grid two">${related.map(item=>offerCard(item,true)).join('')}</div></section>`:''}</div>`);
}
function companyCard(company, simple=false) {
  const available=catalogOffers().filter(item=>item.company===company.id).length;
  return `<article class="card"><div class="card-top">${square(esc(company.mark),'blue')}${simple?'':status(company.status)}</div><h3>${link(company.title,'companies/'+company.id)}</h3>
    <p>${esc(company.area)}</p>${simple?'':`<div class="meta"><span>${icon('pin')}${esc(company.city)}</span><span>Открытых предложений: ${available}</span></div><p>${esc(company.description)}</p>`}
    <div class="actions">${link('О компании','companies/'+company.id,'text-link','arrow')}</div></article>`;
}
function companyCatalog() {
  const filters=memory.filters??{};
  const items=state.companies.filter(company=>company.status===S.confirmed && contains(company.title) &&
    (!filters.city || company.city===filters.city) && (!filters.area || company.area===filters.area) &&
    (!filters.open || catalogOffers().some(offer=>offer.company===company.id)));
  const filtersList=[['area','Сфера деятельности',valuesFor('areas')],['city','Город',CITIES]];
  return page(heading('Компании-партнёры','В каталоге представлены компании, которые прошли проверку колледжа.',['Главная',''])+
    searchForm('Название компании')+`<div class="actions filter-toggle">${button('Фильтры','open-filters',{icon:'sliders',cls:'outline',expanded:!!memory.filterOpen,controls:'filters'})}</div>
    <div class="page-columns catalog-layout">${filterForm(filtersList,field('open','Только с открытыми предложениями',{type:'checkbox',value:filters.open}))}
    <div><div class="results-bar"><p>Найдено компаний: ${items.length}</p><div class="chips">${resultFilters(filters,filtersList)}</div></div>${items.length?`<div class="grid two">${items.map(x=>companyCard(x)).join('')}</div>`:
    empty('Компании не найдены','Измените запрос или сбросьте фильтры.',button('Сбросить фильтры','clear-search',{cls:'primary'}),'search')}</div></div>`);
}
function companyProfile(company, owner=false, preview=false) {
  const offers=catalogOffers().filter(item=>item.company===company.id);
  const tab=memory.tab??'about';
  return `<div class="stack"><div class="panel stack">
    <div class="profile-head">${company.logo?`<img class="square big profile-photo" src="${esc(company.logo)}" width="66" height="66" alt="">`:square(esc(company.mark),'big blue')}
    <div><h2>${esc(company.title)}</h2><div class="meta">${esc(company.area)} · ${esc(company.city)}</div><div class="chips">${status(company.status)}</div></div></div>
    ${owner ? `<div class="actions">${link('Редактировать профиль','company/edit','btn primary')}${link('Посмотреть публичную страницу','company/preview','btn outline')}${link('Разместить предложение','company/offer-edit','btn outline')}</div>` :
    safeUrl(company.website) ? `<a class="text-link" href="${esc(safeUrl(company.website))}" target="_blank" rel="noopener">Сайт компании ${icon('external')}</a>`:''}</div>
    ${tabs([['about','О компании'],['offers','Предложения ('+offers.length+')']],tab)}
    ${tab==='offers'? (offers.length ? `<div class="grid two">${offers.map(x=>offerCard(x,true)).join('')}</div>` :
    empty('Открытых предложений пока нет','Посмотрите предложения других компаний.',link('В каталог','offers','btn outline'))) :
    panel(block('О компании',company.details||company.description)+block('Условия для студентов',company.benefits)+
    (company.photo?`<img class="content-photo" src="${esc(company.photo)}" alt="Фотография компании">`:''))}
    ${owner && !preview ? panel(block('Контакты представителя', [company.representative,company.position,company.email,company.phone].filter(Boolean).join('\n'))+info('Эти данные доступны представителю компании и колледжу.')):''}</div>`;
}
function about() {
  const sections=[
    ['Для чего нужна платформа','Студенты Digital College могут найти место для практики, стажировки или первой работы. Компании размещают предложения для студентов колледжа.'],
    ['Что может студент','Подготовить резюме и портфолио, сохранить интересные предложения, отправить отклик или ответить на приглашение.'],
    ['Что может компания','Опубликовать предложение после проверки, посмотреть доступные резюме и пригласить студента на собеседование.'],
    ['Как проходит подтверждение','Координатор проверяет данные студентов и представителей компаний. Перед публикацией предложений он проверяет задачи и условия.'],
    ['Правила взаимодействия','Обсуждать собеседования и условия можно в переписке по отклику или приглашению. Контакты студента становятся доступны компании после его согласия.']
  ];
  return page(heading('О платформе','Карьерный сервис Digital College для студентов и компаний.',['Главная',''])+
    panel(sections.map(([title,text])=>block(title,text)).join('')+`<div class="actions top-gap">${link('Создать профиль студента','register/student','btn primary')}${link('Стать партнёром','register/company','btn outline')}</div>`));
}
function helpPage() {
  return page(heading('Помощь и контакты','По вопросам регистрации и проверки обратитесь в карьерный центр.',['Главная',''])+
    `<div class="grid two">${panel('<h2>Частые вопросы</h2>'+faqList())}
    ${panel('<h2>Написать в карьерный центр</h2>'+info('Время работы для примера: понедельник–пятница, 09:00–18:00 (UTC+5).')+
    form('support',field('subject','Тема',{required:true})+field('email','Почта для ответа',{type:'email',required:true,value:state.role==='student'?getStudent().email:state.role==='company'?getCompany().email:''})+
    field('message','Сообщение',{type:'textarea',required:true})+submit('Отправить обращение'),async(_data,_intent,f)=> {
      await new Promise(resolve=>setTimeout(resolve,260)); f.reset(); notice('Обращение отправлено в демонстрации.');
    }))}</div>`);
}
function legal(kind) {
  const privacy=kind==='privacy';
  const paragraphs=privacy ? [
    ['Данные профиля','На платформе предполагается хранение данных, которые участник указывает в профиле и при регистрации. Этот макет использует демонстрационные данные и хранит изменения в текущем браузере.'],
    ['Кто видит контакты','Компания увидит контактные данные студента после его согласия. Контакты представителя компании не отображаются в публичном каталоге.'],
    ['Управление видимостью','Студент может скрыть профиль из поиска компаний в настройках. Доступ в уже начатых взаимодействиях сохраняется.']
  ] : [
    ['Доступ к платформе','Студенты и компании подтверждают данные у колледжа. Участник размещает только материалы, которыми вправе делиться.'],
    ['Публикация предложений','Координатор проверяет цели, условия и наличие наставника перед публикацией. При необходимости он возвращает описание с замечаниями.'],
    ['Взаимодействие участников','Переписка относится к конкретному отклику или приглашению. При спорной ситуации можно обратиться в карьерный центр.']
  ];
  return page(heading(privacy?'Политика конфиденциальности':'Правила использования','Текст для демонстрации интерфейса.',['Главная',''])+panel(paragraphs.map(x=>block(...x)).join('')));
}
const required = {required:true};
const requiredSelect = choices => ({required:true,choices});
const requiredArea = {type:'textarea',required:true};
const passwordFields = () => [
  ['password','Пароль',{type:'password',required:true,min:8,auto:'new-password',help:'Не менее 8 символов.'}],
  ['repeat','Повторите пароль',{type:'password',required:true,min:8,auto:'new-password'}]
];
function auth(title, description, content, narrow=false, back=['Главная','']) {
  return page(`<div class="auth${narrow?' narrow':''}">${heading(title,description,back)}${content}</div>`);
}
function loginPage() {
  return auth('Вход','Войдите, чтобы открыть личный кабинет.',panel(form('login',
    field('email','Электронная почта',{required:true,type:'email',auto:'username'})+
    field('password','Пароль',{required:true,type:'password',auto:'current-password'})+
    field('remember','Запомнить меня',{type:'checkbox'})+
    `<div class="actions">${submit('Войти')}${link('Забыли пароль?','recovery','btn ghost')}</div>`,
    (data,_intent,f)=>{
      const student=state.students.find(item=>!item.deleted&&item.email?.toLowerCase()===data.email.trim().toLowerCase());
      const company=state.companies.find(item=>!item.deleted&&item.email?.toLowerCase()===data.email.trim().toLowerCase());
      if (student || company) signin(student?'student':'company',(student??company).id);
      else {
        formError(f.elements.email,'Аккаунт не найден. Проверьте почту или выберите демонстрационный вход.');
        f.elements.email.focus();
      }
    })+`<p class="top-gap">Нет аккаунта? ${link('Зарегистрироваться','register','text-link')}</p>
    <details class="demo-entry"><summary>Войти в демонстрационный кабинет</summary>
    <div class="stack"><p>Можно переключаться между ролями, чтобы пройти сценарий с нескольких сторон.</p><div class="actions">${button('Студент','demo',{id:'student',cls:'outline'})}${button('Компания','demo',{id:'company',cls:'outline'})}${button('Координатор','demo',{id:'coordinator',cls:'outline'})}${button('Delta Insights','demo',{id:'delta',cls:'outline'})}</div></div></details>`),true);
}
function register(role) {
  if (!role) return auth('Выберите роль','От роли зависит, какие разделы доступны в кабинете.',`<div class="grid two">${
    [['Я студент','Хочу найти практику, стажировку или работу.','student','cap','Зарегистрироваться как студент'],['Я представитель компании','Хочу размещать предложения и приглашать студентов.','company','building','Зарегистрировать компанию']].map(([title,text,role,glyph,action])=>
      `<div class="card">${square(icon(glyph))}<h3>${title}</h3><p>${text}</p><div class="actions">${link(action,'register/'+role,'btn primary')}</div></div>`).join('')
  }</div><p class="top-gap">Уже есть аккаунт? ${link('Войти','login','text-link')}</p>`);
  const student=role==='student';
  if (!student && role!=='company') return unavailable();
  const descriptions=student ? [
    ['last','Фамилия',{...required,auto:'family-name'}],['first','Имя',{...required,auto:'given-name'}],['middle','Отчество'],
    ['email','Электронная почта',{...required,type:'email',auto:'email'}],
    ['specialty','Специальность',requiredSelect(valuesFor('specialties'))],['course','Курс',requiredSelect(COURSES)],['group','Группа',requiredSelect(valuesFor('groups'))]
  ] : [
    ['title','Название компании',required],['area','Сфера деятельности',requiredSelect(valuesFor('areas'))],['city','Город',requiredSelect(CITIES)],['website','Сайт компании',{type:'url'}],
    ['representative','Имя и фамилия представителя',required],['position','Должность представителя',required],
    ['email','Рабочая почта',{...required,type:'email',auto:'email'}],['phone','Телефон',{...required,type:'tel'}],['description','Краткое описание компании',requiredArea]
  ];
  return auth(student?'Регистрация студента':'Регистрация компании','Колледж проверит данные после подтверждения почты.',panel(
    form('register',`<div class="grid two">${fields([...descriptions,...passwordFields()])}</div>
    <div class="meta">${link('Правила использования','rules')}<span>·</span>${link('Политика конфиденциальности','privacy')}</div>
    ${field('agree','Согласен с правилами и обработкой данных',{...required,type:'checkbox'})}
    <div class="actions">${submit(student?'Создать аккаунт':'Создать аккаунт компании')}${link('Войти','login','btn ghost')}</div>`,(data,_intent,f)=>{
      const email=data.email.trim().toLowerCase();
      if ([...state.students,...state.companies].some(person=>person.email?.toLowerCase()===email)) {
        formError(f.elements.email,'Эта почта уже используется. Войдите или укажите другую.');
        f.elements.email.focus();
        return;
      }
      state.pendingAccount={role,data:{...updateFromForm(data,['password','repeat','agree']),email}};
      finish('','verify');
    })),false,['Выбрать роль','register']);
}
function verify() {
  const pending=state.pendingAccount;
  if (!pending) return unavailable('Подтверждение почты недоступно','Заполните форму регистрации, чтобы продолжить.','register','Зарегистрироваться');
  if (route[1]==='change') return auth('Изменить почту','Укажите адрес, на который нужно повторно отправить письмо.',panel(form('change-email',
    field('email','Электронная почта',{type:'email',required:true,value:pending.data.email})+submit('Отправить письмо'),(data,_intent,f)=>{
      if ([...state.students,...state.companies].some(item=>item.email?.toLowerCase()===data.email.trim().toLowerCase())) {
        formError(f.elements.email,'Эта почта уже используется.'); f.elements.email.focus(); return;
      }
      pending.data.email=data.email.trim(); finish('Письмо отправлено в демонстрации','verify');
    })),true,['К подтверждению','verify']);
  const expired=route[1]==='expired';
  return auth(expired?'Ссылка устарела':'Подтвердите электронную почту',`Адрес для подтверждения: ${pending.data.email}`,panel(`<div class="stack">
    ${info(expired?'Запросите новое письмо и воспользуйтесь последней ссылкой.':'Откройте письмо и перейдите по ссылке. В макете это действие можно выполнить кнопкой ниже.',expired?'amber':'')}
    <div class="actions">${expired?'':button('Подтвердить почту в макете','verify-account',{cls:'primary'})}
    ${button('Отправить письмо повторно','verify-resend',{cls:expired?'primary':'outline'})}</div>
    <div class="actions">${link('Изменить почту','verify/change','text-link')}${link('Вернуться ко входу','login','text-link')}</div></div>`),true);
}
function recovery() {
  if (route[1]==='sent') return auth('Проверьте почту','Если аккаунт существует, на указанный адрес придёт ссылка для восстановления.',panel(
    `<div class="actions">${link('Установить пароль в макете','recovery/reset','btn primary')}${link('Вернуться ко входу','login','btn outline')}</div>`),true);
  if (route[1]==='reset') return auth('Установите новый пароль','',panel(form('reset',fields(passwordFields())+submit('Сохранить пароль'),()=>finish('Новый пароль принят в демонстрации','login'))),true,['Вернуться ко входу','login']);
  return auth('Восстановление пароля','Укажите почту, с которой вы зарегистрировались.',panel(
    form('recovery',field('email','Электронная почта',{required:true,type:'email'})+submit('Отправить ссылку'),()=>finish('','recovery/sent'))),true,['Вернуться ко входу','login']);
}
