function miniInteraction(item) {
  const offer=getOffer(item.offer), company=getCompany(item.company), student=getStudent(item.student);
  if (!offer || !company || !student) return '';
  return `<div class="split interaction-mini"><div><strong>${esc(offer.title)}</strong><div class="meta">${esc(state.role==='student'?company.title:studentName(student))}</div></div>${status(item.status)}</div>`;
}
function openInteraction(item) { return state.role+'/thread/'+item.id; }
function setInteraction(item, statusText, title='', text='') {
  if (item.status!==statusText) {
    item.status=statusText;
    item.history.push(statusText);
  }
  if (title) {
    const target=state.role==='student'?'company':'student';
    notify(target,target==='student'?item.student:item.company,title,text,target+'/thread/'+item.id);
  }
}
function addMessage(item,text,attachment) {
  if (!text && !attachment) return;
  item.messages.push({role:state.role,text,attachment,date:today()});
}
function applyOffer(id) {
  const offer=publicOffer(id);
  if (!offer || offer.status!==S.published) return;
  if (state.role==='guest') {loginGate('Чтобы отправить отклик, войдите как студент.','offers/'+id);return;}
  if (state.role!=='student') {modal('Отклик доступен студентам',`<p>Чтобы пройти этот сценарий, откройте кабинет студента.</p>${link('Выбрать другой аккаунт','login','btn primary')}`);return;}
  const student=getStudent();
  if (!isConfirmed()) {
    modal('Требуется подтверждение колледжа',`<p>После проверки аккаунта вы сможете отправлять отклики.</p>${link('Статус проверки','student/approval','btn primary')}`);return;
  }
  const previous=matchingInteraction('apply',id);
  if (previous) {navigate('student/thread/'+previous.id);return;}
  if (!studentPresent(student)) {
    const keys={first:'Имя',last:'Фамилия',city:'Город',title:'Желаемая профессия',specialty:'Специальность',course:'Курс',group:'Группа',about:'О себе',skills:'Навыки',interests:'Тип предложения'};
    modal('Профиль не заполнен',`<p>Для отклика заполните обязательные поля.</p><ul>${Object.entries(keys).filter(([key])=>!student[key]).map(([,label])=>`<li>${esc(label)}</li>`).join('')}</ul><div class="actions top-gap">
      ${link('Заполнить профиль','student/resume','btn primary')}${button('Отмена','close-modal',{cls:'outline'})}</div>`);return;
  }
  question('Отклик на предложение',offer.title,'Отправить отклик',({message})=>{
    if (matchingInteraction('apply',id)) return false;
    const item={id:uid(),kind:'apply',student:student.id,company:offer.company,offer:id,date:today(),status:S.sent,text:message.trim(),messages:[],history:[S.sent]};
    state.interactions.unshift(item);
    notify('company',offer.company,'Получен отклик',studentName(student)+' · '+offer.title,'company/thread/'+item.id);
    finish('Отклик отправлен','student/applications');
  },{fields:info(`Компания увидит текущую версию ${link('вашего профиля','student/profile')}.`)+field('message','Сообщение компании',{type:'textarea',placeholder:'Расскажите, почему вам интересна эта позиция.'})});
}
function inviteStudent(id) {
  const student=getStudent(id);
  if (!canSeeStudent(student) || !isConfirmed() || state.role!=='company') return;
  const active=catalogOffers().filter(item=>item.company===state.companyId);
  if (!active.length) {
    modal('Нужно активное предложение',`<p>Опубликуйте предложение о работе, стажировке или практике, чтобы пригласить студента.</p>${link('Создать предложение','company/offer-edit','btn primary')}`);
    return;
  }
  question('Приглашение студента',studentName(student),'Отправить приглашение',(data)=>{
    const old=myInteractions('invite').find(item=>item.student===id && item.offer===data.offer && item.status!==S.revokedInvite);
    if (old) {
      modal('Приглашение уже отправлено',`<p>${esc(old.status)}</p>${link('Открыть приглашение','company/thread/'+old.id,'btn primary')}`);
      return false;
    }
    const item={id:uid(),kind:'invite',student:id,company:state.companyId,offer:data.offer,date:today(),status:S.newInvite,text:data.message.trim(),messages:[],history:[S.newInvite]};
    state.interactions.unshift(item);
    notify('student',id,'Пришло приглашение',getOffer(data.offer).title,'student/thread/'+item.id);
    finish('Приглашение отправлено','company/invitations');
  },{fields:field('offer','Активное предложение',{required:true,choices:active.map(item=>[item.id,item.title])})+
    field('message','Сообщение студенту',{type:'textarea',required:true})});
}
function listInteractions(kind, offerId) {
  const student=state.role==='student', invite=kind==='invite', role=state.role;
  const title=invite?(student?'Приглашения':'Отправленные приглашения'):(student?'Мои отклики':'Отклики студентов');
  const tab=memory.tab??'all';
  const choices=invite ? student ? [['all','Все'],[S.newInvite,'Новые'],[S.interested,'Принятые'],[S.noInvite,'Отклонённые']] :
    [['all','Все'],[S.newInvite,'Ожидают ответа'],[S.interested,'Принятые'],[S.noInvite,'Отклонённые'],[S.revokedInvite,'Отозванные']] :
    student ? [['all','Все'],['active','Активные'],['closed','Завершённые']] : [['all','Все'],[S.sent,'Новые'],[S.review,'На рассмотрении'],[S.rejected,'Отказы']];
  const matchTab=x=>tab==='all' || x.status===tab || tab==='active'&&!CLOSED.includes(x.status) || tab==='closed'&&CLOSED.includes(x.status) ||
    tab===S.interested&&x.history.includes(S.interested);
  const filters=memory.filters??{};
  const items=myInteractions(kind).filter(x=>(!offerId||x.offer===offerId) && matchTab(x) &&
    (!filters.offer||x.offer===filters.offer) && (!filters.status||x.status===filters.status) && (!filters.new||x.status===S.sent) &&
    (student||contains(studentName(getStudent(x.student)))));
  const listEmpty=invite?(student?'Приглашений пока нет':'В этом разделе нет приглашений'):(student?'Вы ещё не откликались на предложения':'В этом разделе нет откликов');
  const listAction=invite?(student?link('Перейти к профилю','student/profile','btn primary'):link('Найти студентов','company/students','btn primary')):
    (student?link('Найти предложения','offers','btn primary'):link('К предложениям','company/offers','btn primary'));
  const staffFilters=[['offer','Предложение',companyOfferItems().map(x=>[x.id,x.title])],['status','Статус',[S.sent,S.viewed,S.review,S.interview,S.place,S.accepted,S.rejected,S.withdrawn,S.declinedPlace]]];
  const accounts=`<div class="stack">${tabs(choices,tab)}${items.length?items.map(listItem).join(''):
    empty(listEmpty,invite&&student?'Заполненный профиль поможет компаниям оценить ваши навыки.':'Здесь появятся записи, подходящие под выбранные условия.',listAction,invite?'mail':'file')}</div>`;
  const filtersContent=!student&&!invite?searchForm('Поиск по имени студента')+`<div class="actions filter-toggle">${button('Фильтры','open-filters',{icon:'sliders',cls:'outline',expanded:!!memory.filterOpen,controls:'filters'})}</div>
    <div class="page-columns catalog-layout">${filterForm(staffFilters,field('new','Только новые',{type:'checkbox',value:filters.new}))}${accounts}</div>`:accounts;
  return work(title,filtersContent,{description:offerId?getOffer(offerId)?.title:''});
  function listItem(item) {
    const offer=getOffer(item.offer), owner=student?getCompany(item.company).title:studentName(getStudent(item.student));
    const isNew=item.kind==='invite'&&item.status===S.newInvite;
    const unread=getNotices().filter(note=>!note.read&&note.path===openInteraction(item)).length;
    const last=item.messages.at(-1)?.text||item.text;
    return `<article class="card"><div class="split"><div class="meta">${esc(owner)} · ${esc(item.date)}</div><div class="chips">${status(item.status)}${unread?chip('Непрочитанных: '+unread):''}</div></div>
      <h3>${link(offer.title,openInteraction(item))}</h3>${last?`<p>${esc(last)}</p>`:''}
      ${isNew&&student?info('«Мне интересно» открывает переписку с компанией. Решение о месте вы примете отдельно.'):''}
      <div class="actions">${isNew&&student?button('Мне интересно','interested',{id:item.id,cls:'primary'})+button('Отклонить','decline-invite',{id:item.id,cls:'outline'}):
        link(item.kind==='apply'&&!student?'Открыть отклик':item.status===S.interested?'Открыть переписку':'Открыть',openInteraction(item),'btn primary')}
      ${student?link(isNew?'Посмотреть предложение':'Открыть предложение','offers/'+offer.id,'btn outline'):link('Посмотреть профиль','company/student/'+item.student,'btn outline')}
      ${student&&!invite&&!CLOSED.includes(item.status)?button('Отозвать отклик','withdraw',{id:item.id,cls:'ghost'}):''}
      ${!student&&isNew?button('Отозвать приглашение','revoke-invite',{id:item.id,cls:'ghost'}):''}</div></article>`;
  }
}
function threadPage(id) {
  const item=myInteractions().find(x=>x.id===id);
  if (!item) return unavailable('Переписка недоступна','Откройте отклик или приглашение из своего кабинета.',state.role,'В кабинет');
  const student=state.role==='student', invite=item.kind==='invite', open=!CLOSED.includes(item.status);
  const awaiting=invite&&item.status===S.newInvite;
  const offer=getOffer(item.offer), company=getCompany(item.company), person=getStudent(item.student);
  const peer=student?company.title:studentName(person);
  const interview=item.interview, place=item.place;
  const outgoing=(student && !invite)||(!student&&invite);
  const history=item.history.map(text=>`<li>${esc(text)}</li>`).join('');
  if (!student&&item.status===S.sent&&!memory.viewed) {
    item.status=S.viewed; item.history.push(S.viewed); memory.viewed=true;
    notify('student',item.student,'Отклик просмотрен',offer.title,'student/thread/'+id);
    save();
  }
  const messageForm=awaiting?info('Переписка откроется после ответа студента.') : open&&isConfirmed()?form('message',field('message','Сообщение',{type:'textarea'})+
    field('attachment','Прикрепить файл',{type:'file',help:'До 1 МБ.'})+submit('Отправить'),async(data,_intent,f)=>{
      const text=data.message.trim();
      const hasFile=fileName(data.attachment);
      if (!text&&!hasFile) {formError(f.elements.message,'Напишите сообщение или прикрепите файл.');f.elements.message.focus();return;}
      let attachment;
      if(hasFile) try {attachment=await readAttachment(data.attachment);}catch(error){formError(f.elements.attachment,error.message);f.elements.attachment.focus();return;}
      addMessage(item,text,attachment);
      const target=student?'company':'student';
      notify(target,student?item.company:item.student,'Получено сообщение',text||'Прикреплён файл',target+'/thread/'+id);
      finish('Сообщение отправлено');
    }):'';
  const bubbles=(item.text?[{role:outgoing?state.role:student?'company':'student',text:item.text,date:item.date},...item.messages]:item.messages).map(message=>
    `<div class="message${message.role===state.role?' self':''}"><small>${message.role===state.role?'Вы':esc(peer)}${message.date?' · '+esc(message.date):''}</small>${esc(message.text)}
    ${message.attachment?`<a class="text-link" href="${esc(message.attachment.data)}" download="${esc(message.attachment.name)}">${icon('file')}${esc(message.attachment.name)}</a>`:''}</div>`).join('');
  const candidateActions=student&&open?`<div class="actions">${awaiting?button('Мне интересно','interested',{id,cls:'primary'})+button('Отклонить','decline-invite',{id,cls:'outline'}):
    button(item.contacts?'Контакты переданы':'Поделиться контактами','contacts',{id,cls:'outline',disabled:!!item.contacts})}
    ${invite?'':button('Отозвать отклик','withdraw',{id,cls:'danger'})}</div>`:'';
  const ownerActions=!student&&open?`<div class="actions">${awaiting?button('Отозвать приглашение','revoke-invite',{id,cls:'danger'}):
    (item.status!==S.review&&!interview&&!place?button('Взять на рассмотрение','consider',{id,cls:'primary'}):'')+
    button(interview?'Изменить собеседование':'Пригласить на собеседование','interview',{id,cls:'outline'})+
    button('Предложить место','place',{id,cls:'outline',disabled:!!place})+button('Отказать','refuse',{id,cls:'danger'})}</div>`:'';
  const interviewActions=student&&open&&interview&&['Ожидает подтверждения','Запрошено другое время'].includes(interview.status)?
    `<div class="actions">${button('Подтвердить участие','interview-answer',{id:id+'|confirm',cls:'primary'})}
    ${button('Предложить другое время','interview-answer',{id:id+'|time',cls:'outline'})}${button('Отказаться','interview-answer',{id:id+'|no',cls:'ghost'})}</div>`:
    !student&&open&&interview&&interview.status!=='Отменено'?button('Отменить собеседование','interview-cancel',{id,cls:'ghost'}):'';
  return work(offer.title,`<div class="page-columns detail conversation"><div class="stack">
    ${ownerActions || candidateActions ? panel(`<div class="stack"><div class="chips">${status(item.status)}</div>${ownerActions||candidateActions}
    ${awaiting&&student?info('Принятие приглашения открывает переписку.'):''}</div>`) : ''}
    ${interview?panel(`<div class="stack"><div class="split"><h2>Собеседование</h2>${status(interview.status)}</div>
      <p>${esc([interview.date,interview.time,interview.zone,interview.format].join(' · '))}</p><p>${esc(interview.address)}</p>
      ${interview.comment?`<p>${esc(interview.comment)}</p>`:''}${interview.answer?`<p>${esc(interview.answer)}</p>`:''}${interviewActions}</div>`):''}
    ${place?panel(`<div class="stack"><div class="split"><h2>Предложение места</h2>${status(place.status)}</div>${block('Условия',place.conditions)}${block('Дата начала',place.date)}${block('Сообщение компании',place.message)}
    ${student&&open?`<div class="actions">${button('Принять предложение','place-answer',{id:id+'|yes',cls:'primary'})}${button('Отказаться','place-answer',{id:id+'|no',cls:'outline'})}</div>`:''}</div>`):''}
    ${panel(`<h2>Переписка</h2><div class="messages">${bubbles||'<p class="muted">Сообщений пока нет.</p>'}</div>${messageForm}`)}</div>
    <aside class="stack">${panel(`<div class="stack"><h2>Детали</h2><div class="meta">${esc(peer)}</div><div class="chips">${status(item.status)}</div>
      <div class="actions">${link('Посмотреть предложение',publicOffer(offer.id)?'offers/'+offer.id:student?'offers':'company/offer/'+offer.id,'btn outline')}
      ${student?button('Пожаловаться','report',{id:offer.id,cls:'ghost',icon:'flag'}):link('Посмотреть профиль','company/student/'+item.student,'btn outline')}</div></div>`)}
    ${panel(`<h2>История действий</h2><ol>${history}</ol>`)}</aside></div>`,{back:[invite?'Приглашения':'Отклики',state.role+(invite?'/invitations':'/applications')],description:peer});
}
function interactionAction(action,id) {
  const [key,value]=id.split('|');
  const item=myInteractions().find(row=>row.id===key);
  if (!item || !isConfirmed() || CLOSED.includes(item.status)) return;
  const offer=getOffer(item.offer);
  const update=(statusText,message=statusText,path)=>{setInteraction(item,statusText,message,offer.title);finish(message,path);};
  const student=state.role==='student';
  if(student) {
    if (action==='interested'&&item.status===S.newInvite) {
      update(S.interested,'Приглашение принято','student/thread/'+key);
    } else if (action==='decline-invite'&&item.status===S.newInvite) {
      question('Отклонить приглашение','Компания увидит, что вы отклонили приглашение.','Отклонить',({comment})=>{
        addMessage(item,comment); update(S.noInvite);
      },{fields:field('comment','Комментарий',{type:'textarea'}),danger:true});
    } else if (action==='withdraw'&&item.kind==='apply') {
      question('Отозвать отклик','Компания увидит, что вы отозвали отклик. Переписка сохранится.','Отозвать',()=>update(S.withdrawn),{danger:true,cancel:'Оставить отклик'});
    } else if (action==='contacts'&&!item.contacts&&item.status!==S.newInvite) {
      const person=getStudent();
      question('Поделиться контактами',`Компания ${getCompany(item.company).title} увидит: ${[person.email,person.phone].filter(Boolean).join(', ')}.`,'Поделиться',()=>{
        item.contacts=true;notify('company',item.company,'Студент поделился контактами',studentName(person),'company/student/'+person.id);finish('Контакты переданы');
      });
    } else if (action==='interview-answer' && item.interview) {
      const respond=(answer='')=>{
        item.interview.status={confirm:'Подтверждено',time:'Запрошено другое время',no:'Отклонено'}[value];
        item.interview.answer=answer;
        item.history.push('Собеседование: '+item.interview.status.toLowerCase());
        notify('company',item.company,'Студент ответил на собеседование',item.interview.status,'company/thread/'+key);
        finish(value==='confirm'?'Участие подтверждено':'Ответ отправлен');
      };
      if (value==='confirm') respond();
      else question(value==='time'?'Предложить другое время':'Отказаться от собеседования','Компания получит ваш ответ.','Отправить ответ',data=>respond(data.answer),
        {fields:field('answer',value==='time'?'Удобное время':'Комментарий',{type:'textarea',required:value==='time'})});
    } else if (action==='place-answer' && item.place) {
      const yes=value==='yes';
      question(yes?'Принять предложение':'Отказаться от предложения','Компания получит ваш ответ.',yes?'Принять предложение':'Отказаться',()=>{
        item.place.status=yes?'Принято':'Отклонено'; update(yes?S.accepted:S.declinedPlace);
      },{danger:!yes});
    }
    return;
  }
  if (state.role!=='company') return;
  if(action==='revoke-invite'&&item.status===S.newInvite) {
    question('Отозвать приглашение','Студент получит уведомление об отзыве.','Отозвать приглашение',()=>update(S.revokedInvite),{danger:true});
    return;
  }
  if (item.status===S.newInvite) return;
  if(action==='consider') update(S.review,'Отклик на рассмотрении');
  if(action==='refuse') question('Отказ студенту','Студент увидит сообщение в своём кабинете.','Отправить отказ',({message})=>{
    addMessage(item,message);update(S.rejected,'Отказ отправлен');
  },{fields:field('message','Сообщение студенту',{type:'textarea',required:true}),danger:true});
  if(action==='interview') question(item.interview?'Изменить собеседование':'Пригласить на собеседование',item.interview?'Студенту нужно будет подтвердить участие заново.':'Укажите время и место встречи.','Отправить приглашение',(data)=>{
    item.interview={...data,status:'Ожидает подтверждения'};update(S.interview,'Назначено собеседование');
  },{fields:`<div class="grid two">${fields([
    ['date','Дата',{type:'date',required:true}],['time','Время',{type:'time',required:true}],['zone','Часовой пояс',requiredSelect(['UTC+5 (Кызылорда)','UTC+3','UTC+0'])],
    ['format','Формат',requiredSelect(['Онлайн','Очно'])],['address','Ссылка или адрес',required],['comment','Комментарий',{type:'textarea'}]
  ],item.interview??{zone:'UTC+5 (Кызылорда)'})}</div>`});
  if(action==='interview-cancel'&&item.interview) question('Отменить собеседование','Студент получит уведомление об отмене.','Отменить собеседование',()=>{
    item.interview.status='Отменено'; item.history.push('Собеседование отменено');
    notify('student',item.student,'Собеседование отменено',offer.title,'student/thread/'+key); finish('Собеседование отменено');
  },{danger:true});
  if(action==='place'&&!item.place) question('Предложить место','Студент сможет принять предложение или отказаться.','Отправить предложение',(data)=>{
    item.place={...data,status:S.newInvite};update(S.place,'Предложение места отправлено');
  },{fields:fields([['date','Дата начала',{type:'date'}],['conditions','Условия',requiredArea],['message','Сообщение студенту',requiredArea]])});
}
