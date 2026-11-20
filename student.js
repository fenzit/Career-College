const menu = {
  student:[['Обзор','','grid'],['Вакансии и стажировки','/offers','briefcase'],['Мой профиль','profile','user'],['Мои отклики','applications','file'],['Приглашения','invitations','mail'],['Избранное','saved','bookmark'],['Настройки','settings','settings']],
  company:[['Обзор','','grid'],['Найти студентов','students','users'],['Мои предложения','offers','briefcase'],['Отклики','applications','file'],['Приглашения','invitations','mail'],['Избранные студенты','saved','bookmark'],['Профиль компании','profile','building'],['Настройки','settings','settings']],
  coordinator:[['Обзор','','grid'],['Студенты','students','users'],['Компании','companies','building'],['Предложения','offers','briefcase'],['Жалобы','complaints','flag'],['Статистика','stats','chart'],['Справочники','reference','file']]
};
function work(title, content, {description='', actions='', back=null}={}) {
  const role=state.role;
  const items=menu[role].map(([label,suffix,glyph]) => {
    const path=suffix.startsWith('/') ? suffix.slice(1) : suffix ? role+'/'+suffix : role;
    const current=(route[1]??'')===suffix;
    return `<a href="#/${path}"${current?' aria-current="page"':''}>${icon(glyph)}${esc(label)}</a>`;
  }).join('');
  return page(`<div class="workspace"><aside class="panel sidebar"><small>${roleLabels[role]}</small>
    ${button('Разделы кабинета','sidebar-menu',{icon:'menu',cls:'outline sidebar-toggle',expanded:false,controls:'sidebar-nav'})}
    <nav id="sidebar-nav" aria-label="Разделы кабинета">${items}</nav></aside>
    <div class="stack"><div class="work-head">${heading(title,description,back,actions)}</div>${content}</div></div>`);
}
function tile(title,count,path,glyph='grid') {
  return `<a class="card tile" href="#/${path}">${square(icon(glyph))}<strong>${count}</strong><span>${esc(title)}</span></a>`;
}
function accountStatus(person) {
  const role=state.role;
  if (person.status===S.confirmed) return '';
  const suspended=person.status===S.suspended, revision=person.status===S.revision;
  const note=state.approvalNotes[person.id]?.at(-1);
  return panel(`<div class="stack"><div class="chips">${status(person.status)}</div><p>${esc(suspended?'Доступ к действиям в кабинете ограничен.':revision?
    'Внесите исправления и отправьте данные повторно.':role==='student'?
    'Пока колледж проверяет данные, можно заполнить профиль и смотреть предложения. Отправка откликов откроется после проверки.':
    'Пока колледж проверяет данные, можно заполнить профиль и сохранить черновики. Каталог студентов откроется после проверки.')}</p>
    ${note?info(esc(note),'amber'):''}<div class="actions">
    ${suspended?'':link(revision?'Исправить данные':'Заполнить профиль',role+(role==='student'?'/resume':'/edit'),'btn primary')}
    ${revision?button('Отправить повторно','account-resubmit',{cls:'outline'}):''}${link('Связаться с колледжем','help','btn outline')}
    ${suspended?button('Выйти','out',{cls:'ghost'}):''}</div></div>`);
}
function studentPresent(student) {
  return !!student && !!['first','last','city','title','specialty','course','group','about','skills','interests'].every(key=>student[key]);
}
function studentHome() {
  const student=getStudent(), apps=myInteractions('apply'), invites=myInteractions('invite');
  const requiredKeys={city:'Город',title:'Желаемая профессия',about:'О себе',skills:'Навыки',interests:'Тип предложения'};
  const missing=Object.entries(requiredKeys).filter(([key])=>!student[key]).map(([,label])=>label);
  const loading=missing.length===0 ? 100 : Math.round((5-missing.length)*100/5);
  return work('Привет, '+student.first,`${accountStatus(student)}
    <div class="grid three">${tile('Активные отклики',apps.filter(item=>!CLOSED.includes(item.status)).length,'student/applications','file')}${tile('Новые приглашения',invites.filter(x=>x.status===S.newInvite).length,'student/invitations','mail')}${tile('Непрочитанные сообщения',getNotices().filter(x=>!x.read).length,'student/notifications','chat')}</div>
    ${panel(`<div class="stack"><div class="split"><h2>Ваш профиль</h2><div class="chips">${status(student.status)}${chip(visibility(student))}</div></div>
    <div class="bar" role="progressbar" aria-label="Заполненность профиля" aria-valuenow="${loading}" aria-valuemin="0" aria-valuemax="100"><span style="width:${loading}%"></span></div>
    <p>${missing.length?'Осталось заполнить: '+esc(missing.join(', '))+'.':'Обязательные поля заполнены. Добавьте проект, чтобы показать свои навыки.'}</p>
    <div class="actions">${link('Заполнить профиль','student/resume','btn primary')}${link('Посмотреть мой профиль','student/profile','btn outline')}</div></div>`)}
    <div class="grid two">${panel('<h2>Новые приглашения</h2>'+(invites.length?miniInteraction(invites[0]):'<p class="muted">Приглашений пока нет.</p>')+`<div class="top-gap">${link('Все приглашения','student/invitations','text-link','arrow')}</div>`)}
    ${panel('<h2>Последние отклики</h2>'+(apps.length?miniInteraction(apps[0]):'<p class="muted">Вы ещё не откликались на предложения.</p>')+`<div class="top-gap">${link('Все отклики','student/applications','text-link','arrow')}</div>`)}</div>
    ${sectionHead('Подходящие предложения','',link('Найти предложения','offers','btn outline','arrow'))}
    <div class="grid two">${catalogOffers().slice(0,2).map(o=>offerCard(o,true)).join('')}</div>`,{description:'Ваши отклики, приглашения и профиль.'});
}
function visibility(student) { return student.visible?'Доступен для предложений':'Не ищу предложения'; }
function canSeeStudent(student) {
  if (!student) return false;
  if (state.role==='coordinator' || state.role==='student' && student.id===state.studentId) return true;
  if (state.role!=='company' || !isConfirmed()) return false;
  return student.status===S.confirmed && (student.visible || myInteractions().some(item=>item.student===student.id && (item.kind==='apply' || item.history.includes(S.interested))));
}
function studentProjects(student, full=false) {
  return state.projects.filter(item=>item.owner===student.id && (full || item.status===S.published));
}
function photo(person, text) {
  return person.photo?`<img class="avatar big profile-photo" width="66" height="66" src="${esc(person.photo)}" alt="">`:avatar(text,'big');
}
function studentProfile(student, owner=false, preview=false) {
  if (!canSeeStudent(student)) return work('Профиль недоступен',empty('Резюме и проекты скрыты','Студент мог изменить видимость профиля.',link('К списку студентов',state.role+'/students','btn primary'),'user'));
  const name=studentName(student), tab=memory.tab??'resume';
  const active=myInteractions().find(item=>item.student===student.id && (item.kind==='apply'||item.status===S.interested));
  const invite=state.role==='company' ? myInteractions('invite').find(item=>item.student===student.id && item.status!==S.revokedInvite) : null;
  const contacts=state.role==='company' && myInteractions().some(item=>item.student===student.id && item.contacts);
  const isCompany=state.role==='company';
  const projectPath=state.role+'/project';
  const ownerActions=`${link('Редактировать резюме','student/resume','btn primary')}${link('Добавить проект','student/project-edit','btn outline', 'plus')}
    ${link('Посмотреть глазами работодателя','student/preview','btn outline')}${button('Настроить видимость','visibility',{cls:'ghost'})}`;
  const companyActions=isCompany ? `${invite ? link('Открыть приглашение','company/thread/'+invite.id,'btn outline') : button('Пригласить','invite',{id:student.id,cls:'primary'})}
    ${button((state.savedStudents[state.companyId]??[]).includes(student.id)?'Убрать из избранного':'В избранное','save-student',{id:student.id,icon:'bookmark',cls:'outline',pressed:(state.savedStudents[state.companyId]??[]).includes(student.id)})}
    ${active?link('Открыть переписку','company/thread/'+active.id,'btn outline'):''}`:'';
  let content;
  if (tab==='portfolio') {
    const items=studentProjects(student,owner);
    content=items.length?`<div class="grid two">${items.map(project=>projectCard(project,projectPath,owner)).join('')}</div>`:
      empty('Проектов пока нет',owner?'Покажите свою первую работу.':'Студент пока не опубликовал проекты.',owner?link('Добавить проект','student/project-edit','btn primary'):link('К резюме',route.join('/'),'btn outline'),'code');
    if (owner) content=`<div class="stack"><div class="actions">${link('Управлять портфолио','student/portfolio','btn outline')}</div>${content}</div>`;
  } else if (tab==='certificates') {
    content=student.certificates?panel(block('Сертификаты',student.certificates)):empty('Сертификатов пока нет','Сертификаты появятся после добавления в резюме.',owner?link('Редактировать резюме','student/resume','btn outline'):'','file');
  } else {
    content=panel(block('О себе',student.about)+block('Образование',[student.specialty,student.course,student.graduation && 'Выпуск: '+student.graduation].filter(Boolean).join(' · '))+
      block('Навыки',student.skills)+block('Практика и опыт',student.experience||'Пока нет опыта работы. Навыки можно оценить по учебным проектам.')+
      block('Языки',student.languages)+block('Достижения',student.achievements)+block('Желаемые условия',[student.interests,student.format,student.employment,student.start].filter(Boolean).join(' · ')));
  }
  return work(owner?'Мой профиль':preview?'Предпросмотр профиля':name,`<div class="panel stack"><div class="profile-head">${photo(student,name)}<div>${owner||preview?`<h2>${esc(name)}</h2>`:''}
    <p>${esc(student.title||'Желаемая профессия не указана')}</p><div class="meta">${esc([student.specialty,student.course,student.city].filter(Boolean).join(' · '))}</div>
    <div class="chips">${chip(visibility(student))}${tags(student.skills)}</div></div></div>${owner||isCompany?`<div class="actions">${owner?ownerActions:companyActions}</div>`:''}</div>
    ${tabs([['resume','Резюме'],['portfolio','Портфолио'],['certificates','Сертификаты']],tab)}${content}
    ${isCompany ? panel(block('Контакты',contacts?[student.email,student.phone].filter(Boolean).join('\n'):'Студент может поделиться контактами в переписке.')) : ''}`,
    {back:owner?null:preview?['Мой профиль','student/profile']:['Студенты',state.role+'/students']});
}
function resume() {
  const student=getStudent();
  const blocks=[
    ['Основная информация',[['photo','Фото',{type:'file',accept:'image/png,image/jpeg,image/webp',help:'PNG, JPEG или WebP, до 1 МБ.'}],['first','Имя',required],['last','Фамилия',required],['city','Город',requiredSelect(CITIES)],['title','Желаемая профессия',required]]],
    ['Обучение',[['specialty','Специальность',requiredSelect(valuesFor('specialties'))],['course','Курс',requiredSelect(COURSES)],['group','Группа',requiredSelect(valuesFor('groups'))],['graduation','Предполагаемый год выпуска']]],
    ['О себе и навыки',[['about','Кратко о себе',requiredArea],['skills','Навыки',{...required,help:'Перечислите навыки через запятую, например HTML, CSS.'}],['experience','Практика и опыт',{type:'textarea'}],['languages','Языки'],['achievements','Достижения',{type:'textarea'}],['certificates','Сертификаты',{type:'textarea'}]]],
    ['Предпочтения',[['interests','Какое предложение ищете',requiredSelect(TYPES)],['format','Формат', {choices:FORMATS}],['employment','Занятость',{choices:SCHEDULES}],['start','Готовность начать',{type:'date'}]]],
    ['Контакты',[['email','Электронная почта',{type:'email',required:true}],['phone','Телефон',{type:'tel'}],['professional','Профессиональная ссылка',{type:'url'}]]]
  ];
  return work('Редактирование резюме',form('resume',blocks.map(([title,descs])=>panel(`<h2>${title}</h2><div class="grid two">${fields(descs,student)}</div>`)).join('')+
    `<div class="actions">${submit('Сохранить изменения')}${link('Отмена','student/profile','btn outline')}</div>`,async(data,_intent,f)=>{
      let image;
      try { image=await readImage(data.photo); } catch (error) { formError(f.elements.photo,error.message); f.elements.photo.focus(); return; }
      if ([...state.students,...state.companies].some(item=>item.id!==student.id && item.email?.toLowerCase()===data.email.trim().toLowerCase())) {
        formError(f.elements.email,'Эта почта уже используется.'); f.elements.email.focus(); return;
      }
      Object.assign(student,updateFromForm(data),image?{photo:image}:{});
      finish('Изменения сохранены','student/profile');
    },{edit:true}),{description:'Резюме используется для всех ваших откликов.',back:['Мой профиль','student/profile']});
}
function projectArt(project) {
  return `<div class="project-art">${project.cover?`<img src="${esc(project.cover)}" alt="Обложка проекта">`:icon('code')}</div>`;
}
function projectCard(project,path,owner) {
  return `<article class="card">${projectArt(project)}<div class="chips">${chip(project.category)}${owner?status(project.status):''}</div><h3>${link(project.title,path+'/'+project.id)}</h3><p>${esc(project.description)}</p>
    <div class="actions">${link('Открыть',path+'/'+project.id,'btn outline')}${owner?link('Редактировать','student/project-edit/'+project.id,'btn outline')+
      button(project.status===S.published?'Скрыть':'Опубликовать','project-toggle',{id:project.id,cls:'ghost'})+button('Удалить','project-delete',{id:project.id,cls:'danger'}):''}</div></article>`;
}
function portfolio() {
  const items=studentProjects(getStudent(),true);
  return work('Мои проекты',items.length?`<div class="grid two">${items.map(project=>projectCard(project,'student/project',true)).join('')}</div>`:
    empty('Покажите свою первую работу','Добавьте учебный проект, результат практики или собственную разработку.',link('Добавить первый проект','student/project-edit','btn primary'),'code'),
    {actions:items.length?link('Добавить проект','student/project-edit','btn primary','plus'):'',back:['Мой профиль','student/profile']});
}
const projectFields=[
  ['title','Название проекта',required],['category','Категория',requiredSelect(['Веб-приложение','Дизайн интерфейсов','Аналитика','Другое'])],
  ['description','Краткое описание',requiredArea],['task','Задача проекта',requiredArea],['contribution','Что вы сделали лично',requiredArea],
  ['skills','Использованные навыки'],['result','Результат',{type:'textarea'}],['period','Дата или период'],['website','Внешняя ссылка',{type:'url'}],
  ['cover','Обложка',{type:'file',accept:'image/png,image/jpeg,image/webp',help:'PNG, JPEG или WebP, до 1 МБ.'}],
  ['media','Дополнительное изображение',{type:'file',accept:'image/png,image/jpeg,image/webp'}],
  ['attachment','Файл проекта',{type:'file',help:'До 1 МБ. Файл доступен в текущем браузере.'}],
  ['team','Командный проект',{type:'checkbox'}],
  ['teamRole','Моя роль в команде',{attrs:'data-team-field'}]
];
function projectForm(id) {
  const stored=id?find(state.projects,id):null;
  if (id && (!stored || stored.owner!==state.studentId)) return unavailable('Проект недоступен','Проверьте список ваших проектов.','student/portfolio','К проектам');
  const project=memory.project??stored??{};
  if (memory.preview) return work('Предпросмотр проекта',projectDetails(project,getStudent())+
    `<div class="actions">${button('Вернуться к редактированию','project-back',{cls:'outline'})}${button('Опубликовать проект','project-publish-preview',{cls:'primary'})}</div>`);
  return work(stored?'Редактирование проекта':'Новый проект',panel(form('project',`<div class="grid two">${fields(projectFields,project)}</div>
    ${project.cover||project.media||project.attachment?`<div class="actions">${project.cover?button('Удалить обложку','project-remove-file',{id:'cover',cls:'ghost'}):''}${project.media?button('Сделать изображение обложкой','project-use-cover',{cls:'ghost'})+button('Удалить изображение','project-remove-file',{id:'media',cls:'ghost'}):''}${project.attachment?button('Убрать файл','project-remove-file',{id:'attachment',cls:'ghost'}):''}</div>`:''}
    <div class="actions">${submit('Опубликовать проект','publish')}${submit('Предпросмотр','preview',{cls:'outline'})}${submit('Сохранить черновик','draft',{skip:true,cls:'outline'})}${link('Отмена','student/portfolio','btn ghost')}</div>`,async(data,intent,f)=>{
      const next={...project,...updateFromForm(data,['team']),team:data.team==='on',id:project.id??uid(),owner:state.studentId};
      for(const key of ['cover','media','attachment']) {
        if (!fileName(data[key])) continue;
        try {
          next[key]=key==='attachment'?await readAttachment(data[key]):await readImage(data[key]);
        } catch (error) {
          formError(f.elements[key],error.message);f.elements[key].focus();return;
        }
      }
      if (intent==='preview') { memory.project=next; memory.preview=true; dirty=true; render(); return; }
      storeProject(next,intent==='draft'?S.draft:S.published);
    },{edit:true})),{back:['Мои проекты','student/portfolio']});
}
function readAttachment(file) {
  if (file.size>1024*1024) return Promise.reject(new Error('Выберите файл размером до 1 МБ.'));
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve({name:file.name,data:reader.result});
    reader.onerror=()=>reject(new Error('Не удалось прочитать файл. Выберите его повторно.'));
    reader.readAsDataURL(file);
  });
}
function storeProject(project,statusText) {
  if (!project.title) project.title='Проект без названия';
  project.status=statusText;
  const stored=find(state.projects,project.id);
  if (stored) Object.assign(stored,project);
  else state.projects.unshift(project);
  finish(statusText===S.published?'Проект опубликован':'Черновик сохранён',statusText===S.published?'student/project/'+project.id:'student/portfolio');
}
function projectDetails(project,student) {
  const href=safeUrl(project.website);
  return `<div class="stack">${panel(`<div class="stack"><div class="split"><div class="chips">${chip(project.category)}${state.role==='student'?status(project.status):''}</div>
   ${link(studentName(student),state.role==='student'?'student/profile':state.role+'/student/'+student.id,'text-link')}</div>${projectArt(project)}<p>${esc(project.description)}</p></div>`)}
   ${panel(block('Задача проекта',project.task)+block('Личный вклад',project.contribution)+block('Моя роль в команде',project.team&&project.teamRole)+
    block('Навыки',project.skills)+block('Результат',project.result)+block('Период',project.period))}
   ${project.media?panel('<h2>Галерея</h2>'+`<img class="content-photo" alt="Изображение проекта" src="${esc(project.media)}">`):''}
   ${href||project.attachment?panel(`<div class="actions">${href?`<a class="btn outline" href="${esc(href)}" target="_blank" rel="noopener">Открыть ссылку ${icon('external')}</a>`:''}
   ${project.attachment?`<a class="btn outline" href="${esc(project.attachment.data)}" download="${esc(project.attachment.name)}">Скачать файл ${icon('file')}</a>`:''}</div>`):''}</div>`;
}
function projectPage(id) {
  const project=find(state.projects,id), student=project&&getStudent(project.owner);
  const owner=state.role==='student'&&student?.id===state.studentId;
  if (!project || !canSeeStudent(student) || !owner&&project.status!==S.published) return work('Проект недоступен',empty('Проект скрыт или удалён','Вы можете вернуться в свой кабинет.',link('В кабинет',state.role,'btn primary'),'code'));
  const back=owner?'student/portfolio':state.role+'/student/'+project.owner;
  return work(project.title,projectDetails(project,student),{back:['Назад к профилю',back],
    actions:owner?link('Редактировать проект','student/project-edit/'+id,'btn primary'):state.role==='company'?button('Пригласить студента','invite',{id:project.owner,cls:'primary'}):''});
}
function savedOffers() {
  const items=(state.savedOffers[state.studentId]??[]).map(publicOffer).filter(Boolean);
  return work('Избранное',items.length?`<div class="grid two">${items.map(offer=>offerCard(offer)).join('')}</div>`:
    empty('Здесь будут сохранённые предложения','Добавьте предложение в избранное, чтобы вернуться к нему позже.',link('Открыть каталог','offers','btn primary'),'bookmark'));
}
function showVisibility() {
  const student=getStudent();
  question('Видимость профиля','Телефон и почта доступны компании после вашего согласия поделиться контактами.','Сохранить',({visibility})=>{
    student.visible=visibility==='visible'; finish('Видимость профиля обновлена');
  },{fields:`<label class="option"><input type="radio" name="visibility" value="visible"${student.visible?' checked':''}><span>Доступен для предложений<small>Подтверждённые компании могут найти ваше резюме и опубликованные проекты.</small></span></label>
  <label class="option"><input type="radio" name="visibility" value="hidden"${student.visible?'':' checked'}><span>Не ищу предложения<small>Профиль скрыт из поиска. Компании сохранят доступ в рамках начатых взаимодействий.</small></span></label>`});
}
