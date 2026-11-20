const KEY = 'career-college-demo-v1';
function restore() {
  try {
    const cached = JSON.parse(localStorage.getItem(KEY));
    if (cached?.offers && cached?.settings) return cached;
  } catch {}
  return structuredClone(DEMO);
}
let state = restore();
const main = document.querySelector('main');
const header = document.querySelector('header');
const footer = document.querySelector('footer');
const dialog = document.querySelector('dialog');
const toast = document.getElementById('toast');
const handlers = new Map();
let route = [];
let memory = {};
let dirty = false;
let nextAfterLogin = '';
let toastTimer;
let dialogLocked = false;

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}
function esc(text = '') {
  return String(text ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]);
}
function safeUrl(value) {
  try {
    const url = new URL(value);
    if (['http:', 'https:'].includes(url.protocol)) return url.href;
  } catch {}
  return '';
}
function find(items, id) { return items.find(item => item.id === id); }
function getOffer(id) { return find(state.offers,id); }
function getCompany(id=state.companyId) { return find(state.companies,id); }
function getStudent(id=state.studentId) { return find(state.students,id); }
function studentName(student) { return [student.first,student.last].join(' '); }
function initials(name) { return name.trim().split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase(); }
function today() { return new Intl.DateTimeFormat('ru-KZ',{day:'numeric',month:'long',timeZone:'Asia/Qyzylorda'}).format(new Date()); }
function uid() { return crypto.randomUUID?.() ?? Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function catalogOffers() {
  return state.offers.filter(offer => isPublicOffer(offer,S.published) || offer.publicVersion && getCompany(offer.company)?.status===S.confirmed)
    .map(offer => isPublicOffer(offer,S.published) ? offer : offer.publicVersion)
    .sort((a,b)=>(b.publishedAt??0)-(a.publishedAt??0));
}
function isPublicOffer(offer, status=offer.status) {
  return [S.published,S.closed].includes(status) && offer.status===status && getCompany(offer.company)?.status===S.confirmed;
}
function publicOffer(id) {
  const offer = getOffer(id);
  return offer && (isPublicOffer(offer) ? offer : getCompany(offer.company)?.status===S.confirmed ? offer.publicVersion : undefined);
}
function matchingInteraction(kind, offer, student=state.studentId) {
  return state.interactions.find(item => item.kind===kind && item.offer===offer && item.student===student);
}
function myInteractions(kind) {
  return state.interactions.filter(item => (!kind || item.kind===kind) && (state.role==='student' ? item.student===state.studentId : item.company===state.companyId));
}
function notify(role, id, title, description, path) {
  state.notices.unshift({id:uid(),role,owner:id,title,description,path,date:today(),read:false});
}
function getNotices() {
  return state.notices.filter(item => item.role===state.role && item.owner===(state.role==='student'?state.studentId:state.companyId));
}
function isConfirmed() {
  return state.role==='coordinator' || (state.role==='student' ? getStudent()?.status : getCompany()?.status) === S.confirmed;
}
function valuesFor(key) {
  return state.lookup[key].filter(value => !(state.archived[key] ?? []).includes(value));
}
function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${marks[name] ?? marks.file}</svg>`;
}
function link(label, path, cls='', glyph='') {
  return `<a class="${cls}" href="#/${path}">${esc(label)}${glyph ? icon(glyph) : ''}</a>`;
}
function button(label, action, options={}) {
  const {cls='', id='', icon:glyph, only=false, pressed, disabled=false, expanded, controls=''}=options;
  return `<button type="button" class="btn ${cls}${only ? ' icon-btn' : ''}" data-do="${action}"${id ? ` data-id="${esc(id)}"` : ''}${only ? ` aria-label="${esc(label)}" title="${esc(label)}"` : ''}${pressed!==undefined?` aria-pressed="${pressed}"`:''}${expanded!==undefined?` aria-expanded="${expanded}"`:''}${controls?` aria-controls="${controls}"`:''}${disabled?' disabled':''}>${glyph?icon(glyph):''}${only?'':esc(label)}</button>`;
}
function submit(label, value='submit', options={}) {
  return `<button class="btn ${options.cls ?? 'primary'}" type="submit" value="${value}"${options.skip ? ' data-skip-validation' : ''}>${esc(label)}</button>`;
}
function chip(text, tono='') { return text ? `<span class="chip ${tono}">${esc(text)}</span>` : ''; }
function status(text) { return chip(text,Object.keys(TONES).find(tone => TONES[tone].includes(text)) ?? 'neutral'); }
function info(text, tone='') { return `<div class="info ${tone}">${text}</div>`; }
function square(content, cls='') { return `<span class="square ${cls}" aria-hidden="true">${content}</span>`; }
function avatar(name, cls='') { return `<span class="avatar ${cls}" aria-hidden="true">${esc(initials(name))}</span>`; }
function block(title, text) {
  return text ? `<section class="text-block"><h3>${esc(title)}</h3><div>${esc(text)}</div></section>` : '';
}
function heading(title, description='', back=null, actions='') {
  return `<div class="page-head"><div>${back?`<a class="back" href="#/${back[1]}">${icon('back')}${esc(back[0])}</a>`:''}</div>
  <div class="split"><h1>${esc(title)}</h1>${actions ? `<div class="actions">${actions}</div>` : ''}</div>${description?`<p>${esc(description)}</p>`:''}</div>`;
}
function sectionHead(title, text='', actions='') {
  return `<div class="section-head"><div><h2>${esc(title)}</h2>${text?`<p>${esc(text)}</p>`:''}</div>${actions}</div>`;
}
function page(content) { return `<div class="page"><div class="wrap">${content}</div></div>`; }
function panel(content, cls='') { return `<div class="panel ${cls}">${content}</div>`; }
function empty(title, description, action='', glyph='briefcase') {
  return panel(`${square(icon(glyph))}<h2>${esc(title)}</h2><p class="muted">${esc(description)}</p>${action?`<div class="actions">${action}</div>`:''}`,'empty stack');
}
function money(offer) { return offer.amount || (offer.pay===PAY[1] ? 'Без оплаты' : 'Оплата не указана'); }
function tags(csv) { return String(csv ?? '').split(',').map(tag => tag.trim()).filter(Boolean).map(tag => chip(tag)).join(''); }

function field(name, label, opts={}) {
  const {value='', type='text', choices, required=false, help='', placeholder='', auto='', min, accept, attrs=''}=opts;
  const properties = `id="field-${name}" name="${name}"${required?' required':''}${auto?` autocomplete="${auto}"`:''}${placeholder?` placeholder="${esc(placeholder)}"`:''}${min===undefined?'':` minlength="${min}"`}${help?` aria-describedby="help-${name}"`:''} ${attrs}`;
  const explanatory = (help?`<small id="help-${name}">${esc(help)}</small>`:'')+`<small class="field-error" id="error-${name}" hidden></small>`;
  if (type==='checkbox') {
    return `<div class="field"><label class="field check"><input type="checkbox" ${properties}${value?' checked':''}> <span>${esc(label)}${required?' *':''}</span></label>${explanatory}</div>`;
  }
  let input;
  if (choices) {
    const options = value && !choices.some(entry=>String(Array.isArray(entry)?entry[0]:entry)===String(value)) ? [...choices,[value,value]] : choices;
    input = `<select ${properties}><option value="">${esc(placeholder || 'Выберите значение')}</option>${options.map(entry => {
      const [key, title] = Array.isArray(entry) ? entry : [entry,entry];
      return `<option value="${esc(key)}"${String(value)===String(key)?' selected':''}>${esc(title)}</option>`;
    }).join('')}</select>`;
  } else if (type==='textarea') {
    input = `<textarea ${properties}>${esc(value)}</textarea>`;
  } else if (type==='file') {
    input = `<input type="file" ${properties}${accept?` accept="${accept}"`:''}>`;
  } else {
    input = `<input type="${type}" ${properties} value="${esc(value)}">`;
  }
  if (type==='password') input=`<span class="with-button">${input}${button('Показать','toggle-password',{id:name,cls:'outline',pressed:false})}</span>`;
  return `<div class="field"><label for="field-${name}">${esc(label)}${required?' *':''}</label>${input}${explanatory}</div>`;
}
function fields(descriptions, data={}) {
  return descriptions.map(([key,label,options={}]) => field(key,label,{...options,value:data[key] ?? options.value})).join('');
}
function form(id, content, handler, {edit=false}={}) {
  handlers.set(id,handler);
  const prefixed=content.replace(/\b(id|for|aria-describedby)="(field|help|error)-([\w-]+)"/g, '$1="$2-'+id+'-$3"');
  return `<form class="form" data-form="${id}"${edit?' data-edit':''} novalidate>${prefixed}</form>`;
}
function formError(input, message) {
  const key=input.form?.dataset.form ? input.form.dataset.form+'-'+input.name : input.name;
  const output = document.getElementById('error-'+key);
  if (output) {
    output.textContent = message;
    output.hidden = !message;
  }
  const description = [document.getElementById('help-'+key)?.id, message && output?.id].filter(Boolean).join(' ');
  if (description) input.setAttribute('aria-describedby',description);
  else input.removeAttribute('aria-describedby');
  if (message) input.setAttribute('aria-invalid','true');
  else input.removeAttribute('aria-invalid');
}
function validate(element) {
  if (element.validity.valueMissing || element.required && typeof element.value==='string' && !element.value.trim()) return element.type==='checkbox' ? 'Подтвердите согласие, чтобы продолжить.' : 'Заполните это поле.';
  if (element.validity.typeMismatch) return element.type==='email' ? 'Введите адрес в формате name@example.com.' : 'Введите полный адрес, начиная с https://.';
  if (element.validity.tooShort) return `Используйте не менее ${element.minLength} символов.`;
  if (element.validity.badInput || element.validity.rangeUnderflow) return 'Проверьте значение.';
  return '';
}
async function handleForm(event) {
  const f=event.target;
  if (!f.matches('[data-form]')) return;
  event.preventDefault();
  const trigger=event.submitter;
  if (f.dataset.sending) return;
  const inputs=[...f.elements].filter(el => el.name && el.willValidate);
  let firstError;
  for (const input of inputs) {
    let message=trigger?.hasAttribute('data-skip-validation') ? '' : validate(input);
    if (!message && input.name==='repeat' && f.elements.password?.value !== input.value && !trigger?.hasAttribute('data-skip-validation')) message='Пароли должны совпадать.';
    formError(input,message);
    if (message) firstError ??= input;
  }
  if (firstError) { firstError.focus(); return; }
  const handler = handlers.get(f.dataset.form);
  if (!handler) return;
  const payload=Object.fromEntries(new FormData(f));
  const original=trigger?.textContent;
  f.dataset.sending='true';
  if (trigger) { trigger.disabled=true; trigger.textContent='Выполняется…'; }
  try {
    await handler(payload,trigger?.value,f);
  } catch (error) {
    console.error(error);
    notice('Действие не выполнено. Попробуйте снова.');
  } finally {
    delete f.dataset.sending;
    if (trigger) { trigger.disabled=false; trigger.textContent=original; }
  }
}
function notice(message) {
  toast.textContent=message;
  toast.hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(() => {toast.hidden=true;},3300);
}
function modal(title, content, {locked=false}={}) {
  dialogLocked=locked;
  dialog.innerHTML=`<div class="split dialog-head"><h2 id="dialog-title">${esc(title)}</h2>${button('Закрыть окно','close-modal',{only:true,icon:'close',cls:'ghost dialog-close'})}</div>${content}`;
  if (!dialog.open) dialog.showModal();
}
function closeModal() {
  dialog.close();
  dialogLocked=false;
}
function question(title, description, action, callback, {fields:extra='', danger=false, cancel='Отмена'}={}) {
  modal(title,`${description?`<p>${esc(description)}</p>`:''}${form('modal-action',`${extra}<div class="actions">${submit(action,'submit',{cls:danger?'danger':'primary'})}${button(cancel,'close-modal',{cls:'outline'})}</div>`,async (data) => {
    const accepted=await callback(data);
    if (accepted!==false && dialog.open && dialog.querySelector('[data-form="modal-action"]')) closeModal();
  })}`);
}
function navigate(path) {
  if (dirty) {
    question('Несохранённые изменения','Если выйти сейчас, введённые данные будут потеряны.','Выйти без сохранения', () => {
      dirty=false;
      navigate(path);
    },{danger:true,cancel:'Продолжить редактирование'});
    return;
  }
  if (dialog.open) closeModal();
  if (location.hash === '#/'+path) render(true);
  else location.hash='/'+path;
}
function finish(message, path) {
  dirty=false;
  if (dialog.open) closeModal();
  save();
  if (path===undefined) render(); else navigate(path);
  if (message) notice(message);
}
function toggleFilter(target, el) {
  const expanded=target.classList.toggle('is-open');
  el.setAttribute('aria-expanded',String(expanded));
}
function unavailable(title='Страница не найдена', desc='Адрес мог измениться. Проверьте ссылку или откройте каталог.', path='', action='На главную') {
  return page(empty(title,desc,link(action,path,'btn primary'),'flag'));
}
function roleDashboard() { return state.role==='guest'?'login':state.role; }
function signin(role, id) {
  closeModal();
  state.role=role;
  if (role==='student') state.studentId=id ?? 'aigerim';
  if (role==='company') state.companyId=id ?? 'orda';
  const after=nextAfterLogin;
  nextAfterLogin='';
  finish('', role==='student' && after ? after : role);
}
function signout() {
  state.role='guest';
  nextAfterLogin='';
  finish('Вы вышли из кабинета','');
}
function loginGate(description, path=route.join('/')) {
  nextAfterLogin=path;
  modal('Требуется вход',`<p>${esc(description)}</p><div class="actions">${link('Войти','login','btn primary')}${link('Зарегистрироваться','register','btn outline')}</div>`);
}
function roleGate(role) {
  return unavailable('У вас нет доступа к этому разделу',
    'Откройте кабинет своей роли. Для просмотра демонстрации можно выбрать другой аккаунт на странице входа.',roleDashboard(),state.role==='guest'?'Войти':'Перейти в кабинет');
}
function tabs(values, current, action='tab') {
  return `<div class="tabs" role="group" aria-label="Разделы">${values.map(entry => {
    const [value,label] = Array.isArray(entry)?entry:[entry,entry];
    return `<button type="button" data-do="${action}" data-id="${esc(value)}" aria-pressed="${value===current}">${esc(label)}</button>`;
  }).join('')}</div>`;
}
function setTab(value) { memory.tab=value; render(); }
function fileName(file) { return file instanceof File && file.size ? file.name : ''; }
function readImage(file) {
  if (!(file instanceof File) || !file.size) return Promise.resolve('');
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>1024*1024) return Promise.reject(new Error('Используйте PNG, JPEG или WebP размером до 1 МБ.'));
  return new Promise((resolve,reject) => {
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error);
    reader.readAsDataURL(file);
  });
}
function updateFromForm(data, remove=[]) {
  return Object.fromEntries(Object.entries(data).filter(([key,value])=>!remove.includes(key) && !(value instanceof File)).map(([key,value])=>[key,typeof value==='string' ? value.trim() : value]));
}
