const reviewTabs=[[S.pending,'На проверке'],[S.published,'Опубликованные'],[S.revision,S.revision],[S.closed,'Закрытые'],[S.hidden,S.hidden],['all','Все']];
function coordinatorHome() {
  const students=state.students.filter(item=>item.status===S.pending);
  const companies=state.companies.filter(item=>item.status===S.pending);
  const offers=state.offers.filter(item=>item.status===S.pending);
  const complaints=state.complaints.filter(item=>item.status!==S.resolved);
  return work('Обзор колледжа',`<div class="grid three">${tile('Студенты на проверке',students.length,'coordinator/students?status=pending','users')}
    ${tile('Компании на проверке',companies.length,'coordinator/companies?status=pending','building')}
    ${tile('Предложения на проверке',offers.length,'coordinator/offers?status=pending','briefcase')}
    ${tile('Открытые жалобы',complaints.length,'coordinator/complaints?status=open','flag')}
    ${tile('Активные предложения',catalogOffers().length,'coordinator/offers?status=published','check')}</div>
    ${panel('<h2>Последние заявки</h2>'+`<div class="stack">${[...companies.slice(0,2).map(c=>[c.title,'company',c.id]),...offers.slice(0,2).map(o=>[o.title,'offer',o.id]),
      ...students.slice(0,2).map(s=>[studentName(s),'record',s.id])].map(([name,path,id])=>`<div class="split interaction-mini"><strong>${esc(name)}</strong>${link('Открыть','coordinator/'+path+'/'+id,'btn outline')}</div>`).join('')||'<p class="muted">Новых заявок нет.</p>'}</div>`)}`,
    {description:'Проверьте новые аккаунты, предложения и обращения.'});
}
function accountReviewList(kind) {
  const student=kind==='students';
  const selected=memory.filters??{};
  const statusOptions=[S.pending,S.confirmed,S.revision,S.suspended];
  const groups=[...new Set(state.students.map(item=>item.group).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
  const filters=student?[['specialty','Специальность',valuesFor('specialties')],['course','Курс',COURSES],['group','Группа',groups],['status','Статус аккаунта',statusOptions]]:
    [['status','Статус аккаунта',statusOptions],['area','Сфера деятельности',valuesFor('areas')],['city','Город',CITIES]];
  const list=(student?state.students:state.companies).filter(item=>matches(item,selected) &&
    contains(student?[studentName(item),item.email,item.group].join(' '):[item.title,item.email].join(' ')));
  const labels=student?['Студент','Обучение','Состояние','Действия']:['Компания','Представитель','Состояние','Действия'];
  return work(student?'Студенты':'Компании',searchForm(student?'ФИО, почта или группа':'Компания или почта представителя')+
    `<div class="actions filter-toggle">${button('Фильтры','open-filters',{cls:'outline',icon:'sliders',expanded:!!memory.filterOpen,controls:'filters'})}</div>
    <div class="page-columns catalog-layout">${filterForm(filters)}<div class="stack"><div class="chips">${resultFilters(selected,filters)}</div>
    ${list.length?table(labels,list.map(item=>[
      `<strong>${esc(student?studentName(item):item.title)}</strong><div class="meta">Регистрация: ${esc(item.registered??'14 ноября')}</div>`,
      `<strong>${esc(student?item.specialty:item.representative)}</strong><div class="meta">${esc(student?item.course+' · '+item.group:item.email)}</div>`,
      status(item.status),link('Открыть','coordinator/'+(student?'record':'company')+'/'+item.id,'btn outline')
    ])):empty('Участники не найдены','Попробуйте изменить условия поиска.',button('Сбросить фильтры','clear-search',{cls:'primary'}),'search')}</div></div>`);
}
function accountReview(id, student) {
  const entry=student?getStudent(id):getCompany(id);
  if (!entry) return unavailable();
  const notes=state.approvalNotes[id]??[];
  const title=student?studentName(entry):entry.title;
  const recordType=student?'student':'company';
  const actionId=recordType+'|'+id;
  const enrolled=entry.status===S.confirmed;
  return work(title,`<div class="panel stack"><div class="profile-head">${student?photo(entry,title):square(esc(entry.mark),'blue big')}
    <div class="chips">${status(entry.status)}</div></div>
    ${student?block('Данные студента',[entry.specialty,entry.course,entry.group,entry.city].filter(Boolean).join(' · ')):block('Данные компании',[entry.area,entry.city,entry.description].filter(Boolean).join('\n'))}
    ${block('Контакты',[entry.representative,entry.position,entry.email,entry.phone].filter(Boolean).join('\n'))}
    <div class="actions">${student?link('Открыть резюме','coordinator/student/'+id,'btn outline'):enrolled?link('Публичная страница','companies/'+id,'btn outline'):link('Предложения компании','coordinator/offers?company='+id,'btn outline')}</div></div>
    ${panel(`<div class="stack"><h2>Решение колледжа</h2><div class="actions">${entry.status===S.suspended?
      button('Восстановить доступ','account-approve',{id:actionId,cls:'primary'}):
      (enrolled?'':button(student?'Подтвердить':'Подтвердить компанию','account-approve',{id:actionId,cls:'primary'}))+
      button('Вернуть на исправление','account-revision',{id:actionId,cls:'outline'})+button('Приостановить доступ','account-suspend',{id:actionId,cls:'danger'})}</div></div>`)}
    ${panel('<h2>История решений</h2>'+(notes.length?`<ol>${notes.map(text=>`<li>${esc(text)}</li>`).join('')}</ol>`:'<p class="muted">Решений пока нет.</p>'))}`,
    {back:[student?'Студенты':'Компании','coordinator/'+(student?'students':'companies')]});
}
function accountReviewAction(action,dataId) {
  if(state.role!=='coordinator') return;
  const [role,id]=dataId.split('|'), entry=role==='student'?getStudent(id):getCompany(id);
  if (!entry) return;
  const update=(statusText,reason='')=>{
    entry.status=statusText;
    (state.approvalNotes[id]??=[]).push(statusText+(reason?'. '+reason:''));
    notify(role,id,statusText,reason||'Колледж подтвердил данные. Откройте кабинет.',role+'/approval');
    finish(statusText);
  };
  if(action==='account-approve') question(entry.status===S.suspended?'Восстановить доступ':'Подтвердить аккаунт',
    'Участник получит уведомление и доступ к основным действиям.',entry.status===S.suspended?'Восстановить доступ':'Подтвердить',()=>update(S.confirmed));
  if(action==='account-revision') question('Вернуть на исправление','Участник увидит замечания и сможет повторно отправить данные.','Отправить замечания',data=>update(S.revision,data.reason),
    {fields:field('reason','Причина и замечания',requiredArea)});
  if(action==='account-suspend') question('Приостановить доступ',role==='company'?
    'Компания потеряет доступ к новым взаимодействиям. Активные предложения скроются из каталога, история сохранится.':
    'Студент не сможет откликаться, а его профиль будет скрыт из каталога. История сохранится.',
    'Приостановить доступ',data=>update(S.suspended,data.reason),{fields:field('reason','Причина',requiredArea),danger:true});
}
function offerReviewList() {
  const tab=memory.tab??S.pending, filters=memory.filters??{};
  const items=state.offers.filter(offer=>(tab==='all'||offer.status===tab)&&
    Object.entries(filters).every(([key,value])=>key==='date'?offer.date===value:offer[key]===value)&&contains([offer.title,getCompany(offer.company).title].join(' ')));
  const description=[['company','Компания',state.companies.map(item=>[item.id,item.title])],['type','Тип предложения',TYPES],
    ['track','Направление',TRACKS],['date','Дата',Array.from(new Set(state.offers.map(o=>o.date)))]];
  return work('Предложения',searchForm('Название предложения или компании')+
    `<div class="actions filter-toggle">${button('Фильтры','open-filters',{cls:'outline',icon:'sliders',expanded:!!memory.filterOpen,controls:'filters'})}</div>
    <div class="page-columns catalog-layout">${filterForm(description)}<div class="stack">${tabs(reviewTabs,tab)}
    ${items.length?table(['Предложение','Компания','Состояние','Действия'],items.map(item=>[
      `<strong>${esc(item.title)}</strong><div class="meta">${esc(item.type)} · ${esc(item.date)}</div>`,esc(getCompany(item.company).title),
      status(item.status), link('Открыть','coordinator/offer/'+item.id,'btn outline')
    ])):empty('Предложений в этом разделе нет','Новые записи появятся после отправки компанией.',button('Показать все','tab',{id:'all',cls:'primary'}),'briefcase')}</div></div>`);
}
function offerReviewPage(id) {
  const offer=getOffer(id);
  const company=offer&&getCompany(offer.company);
  if(!offer||!company) return unavailable();
  return work(offer.title,`<div class="panel stack"><div class="split">${companyLine(company)}<div class="chips">${chip(offer.type)}${status(offer.status)}</div></div>
    <div class="meta">Дата отправки: ${esc(offer.date)}</div>${offer.publicVersion?info('Проверяется новая версия. В каталоге доступна предыдущая публикация.'):''}
    ${company.status!==S.confirmed?info('Сначала подтвердите компанию.','amber'):''}
    <div class="actions">${offer.status===S.pending?button('Одобрить и опубликовать','moderate-publish',{id,cls:'primary',disabled:company.status!==S.confirmed})+
      button('Вернуть на исправление','moderate-revision',{id,cls:'outline'}):''}
    ${offer.status===S.published?link('Публичная страница','offers/'+id,'btn primary')+button('Скрыть публикацию','moderate-hide',{id,cls:'danger'}):''}
    ${link('Данные компании','coordinator/company/'+company.id,'btn ghost')}</div></div>
    ${panel(offerContent(offer))}${panel('<h2>Предыдущие замечания</h2>'+(offer.notes?.length?`<ol>${offer.notes.map(note=>`<li>${esc(note)}</li>`).join('')}</ol>`:'<p class="muted">Замечаний пока нет.</p>'))}`,
    {description:'Проверка предложения',back:['Предложения','coordinator/offers']});
}
function moderateOffer(action,id) {
  if (state.role!=='coordinator') return;
  const offer=getOffer(id);
  if (!offer) return;
  const update=(statusText,reason='')=>{
    offer.status=statusText;
    if (statusText!==S.revision) delete offer.publicVersion;
    if (statusText===S.published) {
      offer.date=today();
      offer.publishedAt=Date.now();
    }
    if (reason) (offer.notes??=[]).push(reason);
    notify('company',offer.company,statusText===S.published?'Предложение опубликовано':statusText,offer.title,'company/offer/'+id);
    finish(statusText===S.published?'Предложение опубликовано':statusText===S.revision?'Замечания отправлены':'Публикация скрыта');
  };
  if (action==='moderate-publish'&&offer.status===S.pending&&getCompany(offer.company)?.status===S.confirmed) {
    question('Одобрить и опубликовать','После одобрения предложение появится в публичном каталоге.','Опубликовать',()=>update(S.published));
  }
  if (action==='moderate-revision'&&offer.status===S.pending) question('Вернуть на исправление','Компания получит замечания и сможет повторно отправить предложение.',
    'Отправить замечания',data=>update(S.revision,data.reason),{fields:field('reason','Причина и замечания',requiredArea)});
  if (action==='moderate-hide'&&offer.status===S.published) question('Скрыть публикацию','Предложение исчезнет из каталога. История откликов сохранится.',
    'Скрыть публикацию',data=>update(S.hidden,data.reason),{fields:field('reason','Причина',requiredArea),danger:true});
}
function reportOffer(id) {
  const offer=getOffer(id);
  if (!offer) return;
  if (state.role==='guest') {loginGate('Войдите, чтобы отправить обращение координатору.');return;}
  const sender=state.role==='student'?studentName(getStudent()):state.role==='company'?getCompany().title:'Координатор';
  question('Пожаловаться',offer.title,'Отправить жалобу',async(data)=>{
    let attachment;
    if (fileName(data.attachment)) {
      try {attachment=await readAttachment(data.attachment);}catch(error){const input=dialog.querySelector('[name="attachment"]');formError(input,error.message);input.focus();return false;}
    }
    state.complaints.unshift({id:uid(),title:data.reason,reason:data.reason,text:data.message,attachment,by:sender,date:today(),target:id,status:S.complaint});
    finish('Жалоба отправлена');
  },{fields:fields([['reason','Причина',requiredSelect(['Условия предложения','Неактуальное предложение','Нарушение правил','Другое'])],
    ['message','Описание',requiredArea],['attachment','Вложение',{type:'file',help:'До 1 МБ.'}]])});
}
function complaintsList() {
  const tab=memory.tab??'all';
  const items=state.complaints.filter(x=>tab==='all'||tab==='open'&&x.status!==S.resolved||x.status===tab);
  return work('Жалобы',tabs([['all','Все'],['open','Открытые'],[S.complaint,'Новые'],[S.review,S.review],[S.resolved,'Закрытые']],tab)+
    (items.length?table(['Дата и отправитель','Объект и причина','Состояние','Действия'],items.map(item=>[
      `<strong>${esc(item.date)}</strong><div class="meta">${esc(item.by)}</div>`,
      `<strong>${esc(getOffer(item.target)?.title||'Предложение')}</strong><div class="meta">${esc(item.reason)}</div>`,
      status(item.status),link('Открыть','coordinator/complaint/'+item.id,'btn outline')
    ])):empty('Жалоб пока нет','Новые обращения появятся в этом разделе.',link('К обзору','coordinator','btn primary'),'flag')));
}
function complaintPage(id) {
  const item=find(state.complaints,id);
  if (!item) return unavailable();
  return work(item.title,`<div class="panel stack"><div class="split"><div class="meta">${esc(item.by)} · ${esc(item.date)}</div>${status(item.status)}</div>${block('Текст обращения',item.text)}
    ${item.attachment?`<a class="text-link" href="${esc(item.attachment.data)}" download="${esc(item.attachment.name)}">${icon('file')}${esc(item.attachment.name)}</a>`:''}
    <div class="actions">${link('Открыть объект','coordinator/offer/'+item.target,'btn outline')}
    ${item.status===S.complaint?button('Взять в работу','complaint-open',{id,cls:'primary'}):''}
    ${item.status!==S.resolved?button('Закрыть жалобу','complaint-close',{id,cls:'outline'}):''}</div></div>${panel(block('История рассмотрения',item.result||item.status))}`,
    {back:['Жалобы','coordinator/complaints']});
}
function complaintAction(action,id) {
  if (state.role!=='coordinator') return;
  const item=find(state.complaints,id);
  if (!item||item.status===S.resolved) return;
  if(action==='complaint-open') {item.status=S.review;finish('Жалоба взята в работу');}
  else question('Закрыть жалобу','Укажите результат проверки обращения.','Закрыть жалобу',data=>{
    item.status=S.resolved;item.result=data.result;finish('Жалоба закрыта');
  },{fields:field('result','Результат рассмотрения',requiredArea)});
}
function stats() {
  const filters=memory.filters??{};
  const studentRows=state.students.filter(item=>matches(item,Object.fromEntries(Object.entries(filters).filter(([key])=>key!=='period'))));
  const ids=new Set(studentRows.map(item=>item.id));
  const records=state.interactions.filter(item=>ids.has(item.student) && (filters.period!=='today'||item.date===today()));
  const publicRows=catalogOffers().filter(item=>filters.period!=='today'||item.date===today());
  const metrics=[
    ['Подтверждённые студенты',studentRows.filter(s=>s.status===S.confirmed).length,'coordinator/students','users'],
    ['Подтверждённые компании',state.companies.filter(c=>c.status===S.confirmed).length,'coordinator/companies','building'],
    ['Опубликованные предложения',publicRows.length,'coordinator/offers?status=published','briefcase'],
    ['Отправленные отклики',records.filter(x=>x.kind==='apply').length,'coordinator/students','file'],
    ['Отправленные приглашения',records.filter(x=>x.kind==='invite').length,'coordinator/students','mail'],
    ['Приглашения на собеседование',records.filter(x=>x.interview).length,'coordinator/students','calendar'],
    ['Принятые предложения места',records.filter(x=>x.status===S.accepted).length,'coordinator/offers','check']
  ];
  function chart(title, rows) {
    const max=Math.max(1,...rows.map(x=>x[1]));
    return panel(`<h2>${title}</h2><div class="chart">${rows.map(([label,count])=>`<div class="chart-row"><span>${esc(label)}</span><div class="bar" aria-hidden="true"><span style="width:${100*count/max}%"></span></div><strong>${count}</strong></div>`).join('')}</div>`);
  }
  const months=Array.from(new Set(records.map(item=>item.date.replace(/^\d+\s+/,''))));
  return work('Статистика',`<div class="actions filter-toggle">${button('Фильтры','open-filters',{cls:'outline',icon:'sliders',expanded:!!memory.filterOpen,controls:'filters'})}</div>
    ${filterForm([['period','Период',[['all','Весь период'],['today','Сегодня']]],['specialty','Специальность',valuesFor('specialties')],['course','Курс',COURSES]])}
    <div class="grid three">${metrics.map(values=>tile(...values)).join('')}</div><div class="grid two">
    ${chart('Активность по месяцам',months.length?months.map(month=>[month,records.filter(item=>item.date.endsWith(month)).length]):[['Нет событий',0]])}
    ${chart('Предложения по типам',TYPES.map(type=>[type,publicRows.filter(o=>o.type===type).length]))}
    ${chart('Отклики по специальностям',valuesFor('specialties').map(s=>[s,records.filter(x=>x.kind==='apply'&&getStudent(x.student).specialty===s).length]))}</div>`);
}
function references() {
  const category=memory.tab??'specialties';
  const values=state.lookup[category], archived=state.archived[category]??[];
  return work('Справочники',tabs(Object.entries(lookupNames),category)+
    (values.length?table(['Значение','Состояние','Справочник','Действия'],values.map((value,index)=>[
      `<strong>${esc(value)}</strong>`,status(archived.includes(value)?'В архиве':'Активно'),esc(lookupNames[category]),
      `<div class="actions">${button('Редактировать','ref-edit',{id:String(index),cls:'outline'})}${button(archived.includes(value)?'Восстановить':'Архивировать','ref-archive',{id:String(index),cls:'ghost'})}</div>`
    ])):empty('В справочнике пока нет значений','Добавьте первое значение.',button('Добавить','ref-add',{cls:'primary'}),'file')),
    {actions:button('Добавить','ref-add',{cls:'primary',icon:'plus'})});
}
function refAction(action,index) {
  if(state.role!=='coordinator') return;
  const category=memory.tab??'specialties', data=state.lookup[category], archived=(state.archived[category]??=[]);
  const value=data[index];
  if (action==='ref-archive') {
    const position=archived.indexOf(value);
    if (position>=0) {archived.splice(position,1);finish('Значение восстановлено');return;}
    question('Архивировать значение',value+' останется в существующих профилях.','Архивировать',()=>{archived.push(value);finish('Значение архивировано');});return;
  }
  question(action==='ref-add'?'Добавить значение':'Редактировать значение',lookupNames[category],'Сохранить',({name})=>{
    const next=name.trim();
    if (!next || data.some((item,idx)=>item.toLowerCase()===next.toLowerCase()&&idx!==Number(index))) {
      const input=dialog.querySelector('[name="name"]');formError(input,'Введите новое уникальное значение.');input.focus();return false;
    }
    if(action==='ref-add') data.push(next);
    else {
      data[index]=next;
      if (archived.includes(value)) archived[archived.indexOf(value)]=next;
      if(category==='skills') state.students.forEach(item=>{if(item.skills)item.skills=item.skills.split(',').map(skill=>skill.trim()===value?next:skill.trim()).join(', ');});
      else {
        const key={specialties:'specialty',groups:'group',areas:'area'}[category];
        const rows=category==='areas'?state.companies:state.students;
        rows.filter(item=>item[key]===value).forEach(item=>{item[key]=next;});
      }
    }
    finish('Изменения сохранены');
  },{fields:field('name','Название',{required:true,value})});
}
