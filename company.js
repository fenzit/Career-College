function companyHome() {
  const company=getCompany(), incoming=myInteractions('apply'), invitations=myInteractions('invite');
  const active=catalogOffers().filter(item=>item.company===company.id).length;
  return work(company.title,`${accountStatus(company)}
    <div class="grid three">${tile('Активные предложения',active,'company/offers','briefcase')}
    ${tile('Новые отклики',incoming.filter(x=>x.status===S.sent).length,'company/applications','file')}
    ${tile('Непрочитанные сообщения',getNotices().filter(x=>!x.read).length,'company/notifications','chat')}</div>
    ${panel(`<div class="stack"><div class="split"><h2>Профиль компании</h2>${status(company.status)}</div>
    <p>${company.benefits?'Условия для студентов заполнены.':'Добавьте условия для студентов и подробное описание команды.'}</p>
    <div class="actions">${link('Заполнить профиль компании','company/edit','btn outline')}${link('Найти студентов','company/students','btn outline')}${link('Посмотреть все отклики','company/applications','btn ghost')}</div></div>`)}
    ${panel('<h2>Последние приглашения</h2>'+(invitations.length?invitations.slice(0,3).map(miniInteraction).join(''):'<p class="muted">У компании пока нет приглашений.</p>')+
    `<div class="top-gap">${link('Все приглашения','company/invitations','text-link','arrow')}</div>`)}`,
    {description:'Предложения, отклики и приглашения вашей компании.',actions:link('Разместить предложение','company/offer-edit','btn primary','plus')});
}
const companyFields=[
  ['title','Название',required],['area','Сфера деятельности',requiredSelect(AREAS)],['city','Город',requiredSelect(CITIES)],
  ['address','Адрес'],['website','Сайт',{type:'url'}],['logo','Логотип',{type:'file',accept:'image/png,image/jpeg,image/webp'}],
  ['description','Краткое описание',requiredArea],['details','Подробное описание',{type:'textarea'}],
  ['benefits','Что компания предлагает студентам',{type:'textarea'}],['photo','Фотография',{type:'file',accept:'image/png,image/jpeg,image/webp',help:'PNG, JPEG или WebP, до 1 МБ.'}],
  ['representative','Имя и фамилия представителя',required],['position','Должность',required],
  ['email','Рабочая почта',{type:'email',required:true}],['phone','Телефон',{type:'tel',required:true}]
];
function companyEdit() {
  const company=getCompany();
  const data=memory.companyDraft??company;
  if (memory.preview) return work('Предпросмотр компании',companyProfile(data,false,true)+
    `<div class="actions">${button('Вернуться к редактированию','company-preview-back',{cls:'outline'})}${button('Сохранить изменения','company-save-preview',{cls:'primary'})}</div>`);
  return work('Редактирование компании',panel(form('company-edit',`<div class="grid two">${fields(companyFields.slice(0,10),data)}</div>
    ${info('Контакты представителя видит только колледж. Они не публикуются на странице компании.')}
    <div class="grid two">${fields(companyFields.slice(10),data)}</div>
    <div class="actions">${submit('Сохранить изменения','save')}${submit('Предпросмотр','preview',{cls:'outline'})}${link('Отмена','company/profile','btn ghost')}</div>`,async(values,intent,f)=>{
      const next={...data,...updateFromForm(values)};
      if ([...state.students,...state.companies].some(item=>item.id!==company.id && item.email?.toLowerCase()===next.email.toLowerCase())) {
        formError(f.elements.email,'Эта почта уже используется.'); f.elements.email.focus(); return;
      }
      for (const key of ['logo','photo']) {
        if (!fileName(values[key])) continue;
        try { next[key]=await readImage(values[key]); } catch (error) { formError(f.elements[key],error.message); f.elements[key].focus(); return; }
      }
      next.mark=initials(next.title);
      if (intent==='preview') {memory.preview=true;memory.companyDraft=next;dirty=true;render();return;}
      Object.assign(company,next);
      finish('Изменения сохранены','company/profile');
    },{edit:true})),{back:['Профиль компании','company/profile']});
}
const studentFilters=[
  ['specialty','Специальность',SPECIALTIES],['course','Курс',COURSES],['skill','Навык',lookup.skills],
  ['interests','Тип предложения',TYPES],['city','Город',CITIES],['format','Формат работы',FORMATS],['employment','Занятость',SCHEDULES]
];
function studentCard(student) {
  const name=studentName(student), count=studentProjects(student).length;
  const saved=(state.savedStudents[state.companyId]??[]).includes(student.id);
  const related=myInteractions('invite').find(item=>item.student===student.id && item.status!==S.revokedInvite);
  return `<article class="card"><div class="card-top">${photo(student,name)}${button(saved?'Убрать из избранного':'В избранное','save-student',{id:student.id,icon:'bookmark',pressed:saved,only:true,cls:'ghost bookmark'})}</div>
    <h3>${link(name,'company/student/'+student.id)}</h3><strong>${esc(student.title)}</strong><div class="meta">${esc(student.specialty)} · ${esc(student.course)} · ${esc(student.city)}</div>
    <div class="chips">${tags(student.skills)}</div><div class="meta">${esc(student.interests)} · ${esc(student.employment)} · Проектов: ${count}</div>
    <div class="actions">${link('Посмотреть профиль','company/student/'+student.id,'btn outline')}
    ${related?link('Открыть приглашение','company/thread/'+related.id,'btn'):button('Пригласить','invite',{id:student.id,cls:'primary'})}</div></article>`;
}
function studentCatalog() {
  if (!isConfirmed()) return work('Каталог студентов',empty('Подтвердите компанию','Колледж проверит данные компании. После этого откроются резюме и портфолио студентов.',link('Профиль компании','company/profile','btn primary'),'shield')+accountStatus(getCompany()));
  const {skill,projects,...filters}=memory.filters??{};
  const items=state.students.filter(student=>student.status===S.confirmed && student.visible && matches(student,filters) &&
    (!skill||student.skills?.toLowerCase().includes(skill.toLowerCase())) && (!projects||studentProjects(student).length) &&
    contains([studentName(student),student.title,student.skills].join(' ')));
  return work('Найти студентов',searchForm('Профессия, навык или имя студента')+`<div class="actions filter-toggle">${button('Фильтры','open-filters',{icon:'sliders',cls:'outline',expanded:!!memory.filterOpen,controls:'filters'})}</div>
    <div class="page-columns catalog-layout">${filterForm(studentFilters.map(row=>row[0]==='skill'?[row[0],row[1],valuesFor('skills')]:row),field('projects','Только с проектами',{type:'checkbox',value:projects}))}
    <div class="stack"><div class="split"><strong>Найдено студентов: ${items.length}</strong><div class="chips">${resultFilters(memory.filters??{},studentFilters)}</div></div>
    ${items.length?`<div class="grid two">${items.map(studentCard).join('')}</div>`:empty('Студенты не найдены','Измените запрос или сбросьте фильтры.',button('Сбросить фильтры','clear-search',{cls:'primary'}),'search')}</div></div>`);
}
function savedStudents() {
  if (!isConfirmed()) return studentCatalog();
  const list=(state.savedStudents[state.companyId]??[]).map(id=>getStudent(id)).filter(Boolean);
  return work('Избранные студенты',list.length?`<div class="grid two">${list.map(student=>canSeeStudent(student)?studentCard(student):
    empty('Профиль недоступен','Студент скрыл профиль.',button('Убрать из избранного','save-student',{id:student.id,cls:'outline'}),'user')).join('')}</div>`:
    empty('Здесь будут избранные студенты','Сохраняйте профили, чтобы вернуться к ним позже.',link('Найти студентов','company/students','btn primary'),'bookmark'));
}
function table(labels, entries) {
  return panel(`<div role="table" aria-label="Результаты"><div class="table-row table-head" role="row">${labels.map(label=>`<div role="columnheader">${esc(label)}</div>`).join('')}</div>
    ${entries.map(columns=>`<div class="table-row" role="row">${columns.map((col,index)=>`<div role="cell">${index===columns.length-1?'':`<span class="table-label">${esc(labels[index])}</span>`}${col}</div>`).join('')}</div>`).join('')}</div>`,'table');
}
function companyOfferItems() { return state.offers.filter(offer=>offer.company===state.companyId); }
const offerTabs=[['all','Все'],[S.draft,'Черновики'],[S.pending,'На проверке'],[S.published,'Опубликованные'],[S.revision,S.revision],[S.closed,'Закрытые']];
function companyOffers() {
  const tab=memory.tab??'all';
  const offers=companyOfferItems().filter(item=>tab==='all'||item.status===tab);
  return work('Мои предложения',tabs(offerTabs,tab)+(offers.length?table(['Предложение','Состояние','Отклики','Действия'],offers.map(offer=>[
    `<strong>${esc(offer.title)}</strong><div class="meta">${esc(offer.type)} · ${esc(offer.date)}</div>`,
    status(offer.status),
    esc(myInteractions('apply').filter(item=>item.offer===offer.id).length)+' всего · '+esc(myInteractions('apply').filter(item=>item.offer===offer.id&&item.status===S.sent).length)+' новых',
    link('Открыть','company/offer/'+offer.id,'btn outline')
  ])):empty('Предложений в этом разделе нет','Создайте предложение о работе, стажировке или практике.',link('Создать предложение','company/offer-edit','btn primary'),'briefcase')),
  {actions:link('Создать предложение','company/offer-edit','btn primary','plus')});
}
function companyOffer(id) {
  const offer=getOffer(id);
  if (offer?.company!==state.companyId) return unavailable('Предложение недоступно','Откройте список предложений вашей компании.','company/offers','К предложениям');
  const canUpdate=[S.draft,S.revision,S.published].includes(offer.status);
  let actions='';
  if (canUpdate) actions+=link('Редактировать','company/offer-edit/'+offer.id,'btn primary');
  if (offer.status===S.draft) actions+=link('Предпросмотр','company/offer-edit/'+offer.id+'/preview','btn outline')+button('Удалить черновик','offer-delete',{id,cls:'danger'});
  if (canUpdate && offer.status!==S.published) actions+=button(offer.status===S.revision?'Отправить повторно':'Отправить на проверку','offer-review',{id,cls:'outline'});
  if (offer.status===S.pending) actions+=button('Отозвать с проверки','offer-recall',{id,cls:'outline'});
  if (offer.status===S.published) actions+=link('Публичная страница','offers/'+id,'btn outline')+button('Закрыть предложение','offer-close',{id,cls:'danger'});
  if ([S.published,S.closed].includes(offer.status)) actions+=link('Открыть отклики','company/applications/'+id,'btn outline');
  if (offer.status===S.closed) actions+=button('Создать копию','offer-copy',{id,cls:'primary'});
  return work(offer.title,`<section class="panel stack"><div class="chips">${chip(offer.type)}${status(offer.status)}</div>
    <div class="meta">${esc([offer.city,offer.format,offer.employment,offer.date].filter(Boolean).join(' · '))}</div><div class="actions">${actions}</div>
    ${offer.publicVersion?info('До одобрения изменений в каталоге видна предыдущая версия.') : ''}
    ${offer.notes?.length?info('Замечания колледжа: '+esc(offer.notes.at(-1)),'amber'):''}</section>${panel(offerContent(offer))}`,{back:['Мои предложения','company/offers']});
}

const wizardFields=[
  [['type','Тип предложения',requiredSelect(TYPES)],['title','Название',required],['track','Направление или специальность',requiredSelect(TRACKS)],
    ['city','Город',requiredSelect(CITIES)],['format','Формат',requiredSelect(FORMATS)],['employment','Занятость',requiredSelect(SCHEDULES)],
    ['places','Количество мест',{type:'number',attrs:'min="1"'}]],
  [['description','Описание',requiredArea],['tasks','Задачи студента',requiredArea],['skills','Необходимые навыки',required],
    ['experience','Требования к опыту',requiredSelect(EXPERIENCE)],['learn','Чему студент научится',{type:'textarea'}],['courses','Подходящие курсы обучения']],
  [['pay','Оплата',requiredSelect(PAY)],['amount','Сумма или диапазон'],['currency','Валюта и период выплаты'],
    ['schedule','График',required],['start','Дата начала',{type:'date'}],['duration','Длительность'],['mentor','Наличие наставника'],
    ['address','Адрес'],['conditions','Дополнительные условия',{type:'textarea'}],['selection','Этапы отбора',{type:'textarea'}],['deadline','Срок приёма откликов',{type:'date'}]]
];
const wizardTitles=['Основная информация','Задачи и требования','Условия','Предпросмотр'];
const wizardRequired=(offer)=>[...wizardFields.flat().filter(([, , opts])=>opts?.required).map(([key])=>key),...(offer.type===TYPES[0]?[]:['duration']),...(offer.pay===PAY[0]?['amount']:[])];
function firstIncompleteStep(offer) {
  const missing=wizardRequired(offer).find(key=>!String(offer[key]??'').trim());
  return missing ? wizardFields.findIndex(fields=>fields.some(([key])=>key===missing)) : -1;
}
function offerWizard(id, showPreview=false) {
  const existing=id?getOffer(id):null;
  if (id && (existing?.company!==state.companyId || ![S.draft,S.revision,S.published].includes(existing.status))) return unavailable('Редактирование недоступно','Проверьте статус предложения.','company/offers','К предложениям');
  const step=memory.step??(showPreview?3:0);
  const draft=memory.offer??{...(existing??{}),company:state.companyId};
  const newVersion=existing?.status===S.published || !!existing?.publicVersion;
  const steps=`<div class="step-list" aria-label="Шаги формы">${wizardTitles.map((title,idx)=>chip((idx+1)+'. '+title,idx===step?'current':'neutral')).join('')}</div>`;
  let content;
  if (step===3) {
    content=`<section class="panel stack"><div class="chips">${chip(draft.type)}${chip('Предпросмотр')}</div><h2>${esc(draft.title||'Предложение без названия')}</h2>
      ${companyLine(getCompany())}<div class="meta">${esc([draft.city,draft.format,draft.employment].filter(Boolean).join(' · '))}</div></section>${panel(offerContent(draft))}
      ${isConfirmed()?'':info('Отправка на проверку станет доступна после подтверждения компании.','amber')}
      <div class="actions">${button('Отправить на проверку','wizard-send',{cls:'primary',disabled:!isConfirmed()})}${button('Вернуться к редактированию','wizard-back',{cls:'outline'})}
      ${button('Сохранить черновик','wizard-save',{cls:'outline'})}</div>`;
  } else {
    const descriptions=wizardFields[step].map(([key,label,options])=>[key,label,{
      ...options, required:options?.required||key==='duration'&&draft.type!==TYPES[0],
      attrs:key==='amount'?'data-pay-field':options?.attrs
    }]);
    content=panel(`<h2>${wizardTitles[step]}</h2>${form('wizard',`<div class="grid two">${fields(descriptions,draft)}</div>
      <div class="actions">${submit('Далее','next')}${step?submit('Назад','back',{cls:'outline',skip:true}):''}${submit('Сохранить черновик','draft',{cls:'outline',skip:true})}${link('Отмена','company/offers','btn ghost')}</div>`,(data,intent,f)=>{
        const updated={...draft,...updateFromForm(data)};
        if (step===2 && intent==='next' && updated.pay===PAY[0] && !updated.amount) {
          formError(f.elements.amount,'Укажите сумму или диапазон.'); f.elements.amount.focus(); return;
        }
        if (intent==='draft') {storeOffer(updated,S.draft);return;}
        memory.offer=updated; memory.step=step+(intent==='back'?-1:1); dirty=true; render(true);
      },{edit:true})}`);
  }
  return work(existing?'Редактирование предложения':'Создать предложение',steps+(newVersion?info('После отправки изменений на проверку старая версия останется в каталоге до одобрения.'): '')+
    (draft.notes?.length?info('Замечания колледжа: '+esc(draft.notes.at(-1)),'amber'):'')+content,{back:['Мои предложения','company/offers']});
}
function storeOffer(draft,newStatus) {
  const id=draft.id??uid();
  const existing=getOffer(id);
  const snapshot=existing?.status===S.published ? {...existing} : existing?.publicVersion;
  const offer={...draft,id,status:newStatus,title:draft.title||'Предложение без названия',date:existing?.date??today(),publicVersion:snapshot};
  if (existing) Object.assign(existing,offer);
  else state.offers.unshift(offer);
  finish(newStatus===S.pending?'Предложение отправлено на проверку':'Черновик сохранён',newStatus===S.pending?'company/submitted/'+id:'company/offer/'+id);
}
function sendOffer(draft) {
  if (!isConfirmed()) {notice('Сначала подтвердите компанию.');return;}
  const incomplete=firstIncompleteStep(draft);
  if (incomplete>=0) {
    if (route[1]==='offer-edit') {memory.offer=draft;memory.step=incomplete;render(true);}
    else navigate('company/offer-edit/'+draft.id);
    notice('Заполните обязательные поля предложения.');
    return;
  }
  storeOffer(draft,S.pending);
}
function offerSubmitted(id) {
  if (getOffer(id)?.company!==state.companyId) return unavailable();
  return work('Предложение отправлено на проверку',empty('Колледж проверит описание','Статус и замечания появятся в разделе «Мои предложения».',
    link('К моим предложениям','company/offers','btn primary')+link('Создать ещё одно','company/offer-edit','btn outline'),'check'));
}
