const publicRoutes={
  '':home, offers:()=>route[1]?offerPage(publicOffer(route[1])):catalog(),
  companies:()=>{
    if (!route[1]) return companyCatalog();
    const company=getCompany(route[1]);
    return company?.status===S.confirmed ? page(heading('Компания-партнёр','',['Компании','companies'])+companyProfile(company)) :
      unavailable(company?.status===S.suspended?'Компания недоступна':'Страница компании недоступна','Откройте каталог, чтобы посмотреть подтверждённых партнёров.','companies','К компаниям');
  },
  about, help:helpPage, rules:()=>legal('rules'), privacy:()=>legal('privacy'),
  login:loginPage, register:()=>register(route[1]), verify, recovery, map:sitemap, components:componentPage
};
const commonRoutes={thread:threadPage, applications:id=>listInteractions('apply',id), invitations:()=>listInteractions('invite'),
  project:projectPage, settings:settingsPage, approval:approvalPage, notifications};
const roleRoutes={
  student:{...commonRoutes,'':studentHome,profile:()=>studentProfile(getStudent(),true),preview:()=>studentProfile(getStudent(),false,true),
    resume,portfolio,'project-edit':projectForm,saved:savedOffers},
  company:{...commonRoutes,'':companyHome,profile:()=>work('Профиль компании',companyProfile(getCompany(),true)),
    preview:()=>work('Предпросмотр компании',companyProfile(getCompany(),false,true),{back:['Профиль компании','company/profile']}),
    edit:companyEdit,students:studentCatalog,student:id=>studentProfile(getStudent(id)),saved:savedStudents,
    offers:companyOffers,offer:companyOffer,'offer-edit':id=>offerWizard(id,route[3]==='preview'),submitted:offerSubmitted},
  coordinator:{'':coordinatorHome, students:()=>accountReviewList('students'),record:id=>accountReview(id,true),student:id=>studentProfile(getStudent(id)),
    project:projectPage,companies:()=>accountReviewList('companies'),company:id=>accountReview(id,false),offers:offerReviewList,
    offer:offerReviewPage,complaints:complaintsList,complaint:complaintPage,stats,reference:references,settings:settingsPage}
};
function lookupHandler(map,key) { return Object.hasOwn(map,key) ? map[key] : undefined; }
function routeContent() {
  const [section='',sub='',id]=route;
  const publicPage=lookupHandler(publicRoutes,section);
  if (publicPage) return publicPage();
  const areas=lookupHandler(roleRoutes,section);
  if (areas) {
    if (state.role!==section) return roleGate(section);
    if (state.role!=='coordinator' && (state.role==='student'?getStudent():getCompany())?.status===S.suspended && sub!=='approval') {
      return approvalPage();
    }
    const handler=lookupHandler(areas,sub);
    if (handler) return handler(id ?? '');
  }
  return unavailable();
}
function readRoute() {
  const hash=location.hash.startsWith('#/')?location.hash.slice(2):'';
  const [path,query]=hash.split('?');
  route=path.split('/').filter(Boolean);
  memory={};
  const options=new URLSearchParams(query);
  if (route[0]==='coordinator') {
    const selection=options.get('status');
    if (route[1]==='offers') {
      if (selection && S[selection]) memory.tab=S[selection];
      const company=options.get('company');
      if (company && getCompany(company)) {memory.filters={company};memory.tab='all';}
    } else if (route[1]==='complaints' && selection==='open') memory.tab='open';
    else if (['students','companies'].includes(route[1]) && selection==='pending') memory.filters={status:S.pending};
  }
}
function render(focus=false) {
  handlers.clear();
  showHeader();
  main.innerHTML=routeContent();
  main.querySelector('[data-team-field]')?.closest('.field').toggleAttribute('hidden',!main.querySelector('[name="team"]')?.checked);
  if (roleRoutes[state.role] && route[0]===state.role && route[1]==='thread') showHeader();
  const title=main.querySelector('h1,h2')?.textContent;
  document.title=route.length&&title?title+' · Карьера колледжа':'Карьера колледжа · Digital College';
  if (focus) {
    window.scrollTo({top:0,left:0,behavior:'instant'});
    main.focus({preventScroll:true});
  }
}
function demoSwitch(role,path) {
  if (role==='delta' || role==='orda') {
    const actor=getCompany(role);
    if (actor?.deleted) {notice('Этот аккаунт удалён в демонстрации.');return;}
    signin('company',role);
    if (path) navigate(path);
    return;
  }
  if (role==='student'||role==='company') {
    const active=role==='student'?getStudent():getCompany();
    const base=role==='student'?'aigerim':'orda';
    const account=path?base:active?.deleted?base:active?.id??base;
    signin(role,account);
  } else if (role==='coordinator') signin(role);
  if(path) navigate(path);
}
function accountMenu() {
  dialogLocked=false;
  const role=state.role;
  const profile=role==='student'?'Мой профиль':role==='company'?'Профиль компании':'Обзор';
  modal('Аккаунт',`<div class="stack"><div class="actions">${link(profile,role+(role==='coordinator'?'':'/profile'),'btn primary')}
    ${link('Настройки',role+'/settings','btn outline')}${link('Помощь','help','btn outline')}${button('Выйти','out',{cls:'ghost'})}</div>
    <div><h3>Сменить демонстрационный кабинет</h3><div class="actions top-gap">
    ${[['student','Студент'],['company','Компания'],['coordinator','Координатор'],['orda','Orda Tech'],['delta','Delta Insights']].map(([id,label])=>button(label,'demo',{id,cls:'outline'})).join('')}</div></div></div>`);
}
function verifyAccount() {
  const current=state.pendingAccount;
  if (!current) return;
  const student=current.role==='student';
  const id=uid();
  const record={...current.data,id,registered:today(),status:S.pending,...(student?{visible:true}:{mark:initials(current.data.title)})};
  (student?state.students:state.companies).unshift(record);
  state.role=current.role;
  if(student) state.studentId=id; else state.companyId=id;
  state.pendingAccount=null;
  finish('Почта подтверждена',current.role+'/approval');
}
function switchSaved(kind, id) {
  const student=kind==='offer';
  if(student&&state.role==='guest') {loginGate('Войдите как студент, чтобы сохранить предложение.');return;}
  const target=student?publicOffer(id):getStudent(id);
  if (!target || state.role!==(student?'student':'company') || !student&&!isConfirmed()) {
    if (student&&target) modal('Избранное студента',`<p>Предложения сохраняются в кабинете студента.</p>${link('Выбрать другой аккаунт','login','btn primary')}`);
    return;
  }
  const list=student ? (state.savedOffers[state.studentId]??=[]) : (state.savedStudents[state.companyId]??=[]);
  const index=list.indexOf(id);
  if(index>=0) list.splice(index,1);
  else list.push(id);
  finish(index>=0?'Удалено из избранного':'Добавлено в избранное');
}
async function shareOffer(id) {
  const url=new URL(location.href);
  url.hash='/offers/'+id;
  try {
    await navigator.clipboard.writeText(url.href);
    notice('Ссылка скопирована');
  } catch {
    modal('Поделиться предложением',`<p>Скопируйте адрес этой страницы.</p>${field('copy','Ссылка',{value:url.href,attrs:'readonly'})}`);
    const input=dialog.querySelector('input');
    input.focus(); input.select();
  }
}
function studentProjectAction(action,id) {
  if(state.role!=='student') return;
  if(action==='project-back') {memory.preview=false;render();return;}
  if(action==='project-publish-preview') {storeProject(memory.project,S.published);return;}
  if (action==='project-remove-file'||action==='project-use-cover') {
    const i=main.querySelector('[data-form="project"]');
    const data=Object.fromEntries(new FormData(i));
    const value=memory.project??find(state.projects,route[2])??{};
    memory.project={...value,...updateFromForm(data,['team']),team:data.team==='on'};
    if(action==='project-use-cover') memory.project.cover=memory.project.media;
    else delete memory.project[id];
    dirty=true; render();return;
  }
  const project=find(state.projects,id);
  if (!project||project.owner!==state.studentId) return;
  if(action==='project-delete') question('Удалить проект','«'+project.title+'» исчезнет из вашего портфолио.','Удалить',()=>{
    state.projects=state.projects.filter(item=>item.id!==id); finish('Проект удалён','student/portfolio');
  },{danger:true});
  if(action==='project-toggle') {
    if(project.status===S.published) {project.status=S.draft;finish('Проект скрыт');}
    else if(['title','category','description','task','contribution'].every(key=>project[key])) storeProject(project,S.published);
    else navigate('student/project-edit/'+id);
  }
}
function offerAction(action,id) {
  if (state.role!=='company') return;
  const offer=id?getOffer(id):null;
  if (id && offer?.company!==state.companyId) return;
  if (action==='wizard-back') {memory.step=2;dirty=true;render(true);return;}
  const draft=memory.offer??(route[2]?getOffer(route[2]):null);
  if (action==='wizard-send' && draft) {sendOffer(draft);return;}
  if (action==='wizard-save' && draft) {storeOffer(draft,S.draft);return;}
  if (!offer) return;
  if (action==='offer-review'&&[S.draft,S.revision].includes(offer.status)) {sendOffer(offer);return;}
  if (action==='offer-delete'&&offer.status===S.draft) question('Удалить черновик','Черновик исчезнет из списка предложений.','Удалить',()=>{
    if (offer.publicVersion) Object.assign(offer,offer.publicVersion,{publicVersion:undefined});
    else state.offers=state.offers.filter(x=>x.id!==id);
    finish('Черновик удалён','company/offers');
  },{danger:true});
  if(action==='offer-close'&&offer.status===S.published) question('Закрыть предложение','Новые отклики перестанут поступать, прежняя переписка сохранится.','Закрыть предложение',()=>{
    offer.status=S.closed; finish('Предложение закрыто');
  },{danger:true});
  if (action==='offer-recall'&&offer.status===S.pending) question('Отозвать с проверки','Предложение вернётся в черновики.','Отозвать с проверки',()=>{
    offer.status=S.draft; finish('Предложение отозвано с проверки');
  });
  if (action==='offer-copy'&&offer.status===S.closed) storeOffer({...offer,id:undefined,title:offer.title+' (копия)',date:today(),notes:[]},S.draft);
}
const actionHandlers={
  'close-modal':()=>closeModal(), 'mobile-menu':(_id,el)=>{
    const nav=document.getElementById('mobile-nav');
    nav.hidden=!nav.hidden; el.setAttribute('aria-expanded',String(!nav.hidden));
  },
  'sidebar-menu':(_id,el)=>toggleFilter(document.getElementById('sidebar-nav'),el), 'account-menu':accountMenu, out:signout,
  demo:demoSwitch, 'demo-path':id=>demoSwitch(...id.split('|')),
  'demo-reset':()=>question('Сбросить примеры','В этом браузере восстановятся исходные данные макета. Добавленные записи и изменения удалятся.','Сбросить примеры',()=>{
    state=structuredClone(DEMO);memory={};finish('Исходные данные восстановлены','map');
  },{danger:true}),
  'toggle-password':(_id,el)=>{
    const input=el.closest('.with-button').querySelector('input'), visible=input.type==='password';
    input.type=visible?'text':'password';el.textContent=visible?'Скрыть':'Показать';el.setAttribute('aria-pressed',String(visible));
  },
  'open-filters':(_id,el)=>{toggleFilter(document.getElementById('filters'),el);memory.filterOpen=el.getAttribute('aria-expanded')==='true';},
  'clear-filters':()=>{memory.filters={};memory.filterOpen=false;memory.page=1;renderResults();},
  'clear-search':()=>{memory.filters={};memory.query='';memory.filterOpen=false;memory.page=1;renderResults();},
  'remove-filter':id=>{delete memory.filters[id];memory.page=1;renderResults();},
  page:id=>{memory.page=Number(id);render(true);}, tab:setTab,
  'verify-account':verifyAccount, 'verify-resend':(_id,el)=>{
    if(route[1]==='expired') {finish('Письмо отправлено в демонстрации','verify');return;}
    el.disabled=true;
    let seconds=10;
    const tick=()=>{
      if(!el.isConnected) return;
      if(seconds) {el.textContent='Повторить через '+seconds+' с';seconds--;setTimeout(tick,1000);}
      else {el.textContent='Отправить письмо повторно';el.disabled=false;}
    };
    tick();notice('Письмо отправлено в демонстрации');
  },
  apply:applyOffer, invite:inviteStudent, 'save-offer':id=>switchSaved('offer',id),'save-student':id=>switchSaved('student',id),
  share:shareOffer, report:reportOffer, visibility:showVisibility,
  'company-preview-back':()=>{memory.preview=false;render();},
  'company-save-preview':()=>{Object.assign(getCompany(),memory.companyDraft);finish('Изменения сохранены','company/profile');},
  'account-resubmit':()=>{
    const actor=state.role==='student'?getStudent():getCompany();
    if(actor?.status===S.revision) {actor.status=S.pending;finish('Данные снова на проверке',state.role+'/approval');}
  },
  'notice-all':()=>{getNotices().forEach(item=>{item.read=true;});if(state.role==='student'&&state.studentId==='aigerim') state.settings.exampleSeen=true;finish('Уведомления отмечены прочитанными');},
  'notice-open':id=>{
    if(id==='example') {state.settings.exampleSeen=true;finish('','student/thread/example-invite');return;}
    const note=getNotices().find(item=>item.id===id);
    if(note) {note.read=true;finish('',note.path);}
  },
  'component-success':()=>notice('Действие выполнено'),
  'component-modal':()=>question('Подтвердите действие','В этом примере можно проверить фокус, отмену и подтверждение.','Продолжить',()=>finish('Действие подтверждено')),
  'component-state':id=>{memory.load=id;render();},
  'component-retry':()=>{memory.load='loading';render();setTimeout(()=>{if(route[0]==='components'&&memory.load==='loading'){memory.load='success';render();}},650);}
};
const actionGroups=[
  [['project-back','project-publish-preview','project-remove-file','project-use-cover','project-delete','project-toggle'],studentProjectAction],
  [['wizard-back','wizard-send','wizard-save','offer-review','offer-delete','offer-close','offer-recall','offer-copy'],offerAction],
  [['interested','decline-invite','withdraw','contacts','interview-answer','place-answer','revoke-invite','consider','refuse','interview','interview-cancel','place'],interactionAction],
  [['account-approve','account-revision','account-suspend'],accountReviewAction],
  [['moderate-publish','moderate-revision','moderate-hide'],moderateOffer],
  [['complaint-open','complaint-close'],complaintAction],
  [['ref-add','ref-edit','ref-archive'],refAction],
  [['settings-email','settings-password','settings-delete'],settingsAction]
];
for(const [keys,handler] of actionGroups) for(const key of keys) actionHandlers[key]=id=>handler(key,id);

function renderResults() {
  render();
  const results=main.querySelector('.catalog-layout > :nth-child(2)');
  if (!results) return;
  results.tabIndex=-1;
  results.focus({preventScroll:true});
  if (matchMedia('(max-width: 690px)').matches) results.scrollIntoView({block:'start'});
}
function handleClick(event) {
  const action=event.target.closest('[data-do]');
  if(action) {
    const handler=lookupHandler(actionHandlers,action.dataset.do);
    const id=action.dataset.id??'';
    if (action.dataset.do==='demo') return demoSwitch(id);
    if(handler) handler(id,action);
    return;
  }
  const a=event.target.closest('a[href^="#/"]');
  if(a&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey) {
    event.preventDefault();navigate(a.getAttribute('href').slice(2));
  }
}
document.addEventListener('click',handleClick);
document.addEventListener('submit',handleForm);
document.addEventListener('input',event=>{
  if(event.target.closest('[data-edit]')) dirty=true;
  if(event.target.getAttribute('aria-invalid')==='true') formError(event.target,'');
  if(event.target.name==='team') main.querySelector('[data-team-field]')?.closest('.field').toggleAttribute('hidden',!event.target.checked);
});
document.addEventListener('change',event=>{
  if(event.target.hasAttribute('data-sort')) {memory.sort=event.target.value;memory.page=1;render();}
});
dialog.addEventListener('cancel',event=>{if(dialogLocked) event.preventDefault();});
let currentHash=location.hash;
window.addEventListener('hashchange',()=>{
  if(dirty) {
    const intended=location.hash.startsWith('#/')?location.hash.slice(2):'';
    history.replaceState(null,'',currentHash||'#/');
    navigate(intended);
    return;
  }
  currentHash=location.hash;
  readRoute(); render(true);
});
window.addEventListener('beforeunload',event=>{
  if(dirty) {event.preventDefault();event.returnValue='';}
});
readRoute();
render();
