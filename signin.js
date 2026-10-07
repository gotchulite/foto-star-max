/* =========================================================
   Foto Star Nepal — Sign in (front-end only demo)
   - No backend. Client accounts live in this browser's localStorage.
   - Staff accounts are defined below as salted-style SHA-256 hashes.
   - NOTE: client-side checks are NOT real security. Replace with a
     server/auth provider before using this for real staff access.
   ========================================================= */
const CONFIG = {
  redirect: { client: 'index.html', staff: 'admin.html' },
  autoRedirect: false,          // set true to jump straight after sign-in
  lockAfter: 5,                 // failed staff attempts before a temporary lock
  lockSeconds: 30,
  // sha256("email:password") — demo account: fotostar@gmail.com / 12345678
  staff: [
    { email: 'fotostar@gmail.com', name: 'Studio Staff', title: 'Staff',
      hash: '8c6f552eb319beb0fcb3deb40796b82f54b2c020f90571d600da671d498d0881' }
  ],
};

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const store = {
  get(k, session){ try{ return JSON.parse((session?sessionStorage:localStorage).getItem(k)); }catch{ return null; } },
  set(k, v, session){ try{ (session?sessionStorage:localStorage).setItem(k, JSON.stringify(v)); }catch{} },
  del(k){ try{ localStorage.removeItem(k); sessionStorage.removeItem(k); }catch{} }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function sha256(text){
  if(!(window.crypto && crypto.subtle)) throw new Error('secure-context');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}
function randomSalt(){
  const a = new Uint8Array(16); crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2,'0')).join('');
}

/* ---------- State / content per role ---------- */
let role = 'client';
let view = 'signin';
const signInParams = new URLSearchParams(window.location.search);
const requestedDestination = signInParams.get('next') === 'admin' ? 'admin' : '';
if(signInParams.get('role') === 'staff' || requestedDestination === 'admin') role = 'staff';

const copy = {
  client: {
    kicker: 'Client portal',
    vTitle: 'Moments worth remembering.',
    vText: 'Sign in to manage your bookings, follow your shoot and keep every memory in one place.',
    signin: ['Welcome back', 'Sign in to your account.', 'Enter your details to continue.'],
    signup: ['Join Foto Star', 'Create your account.', 'Book shoots and keep your memories organised.'],
    forgot: ['Password help', 'Reset your password.', 'Enter your email and we will send a reset link.'],
  },
  staff: {
    kicker: 'Staff portal',
    vTitle: 'Behind every frame, a team.',
    vText: 'Demo access for the Foto Star Nepal team to manage bookings, shoots and deliveries.',
    signin: ['Staff access', 'Sign in to the studio.', 'Use your studio email and password.'],
  }
};

function setHeader(a,b,c){
  const head = $('#head');
  head.style.opacity = 0;
  setTimeout(() => {
    $('#eyebrow').textContent = a; $('#title').textContent = b; $('#subtitle').textContent = c;
    head.style.opacity = 1;
  }, 140);
}
$('#head').style.transition = 'opacity .25s ease';

function show(id){
  $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
  $$('.alert').forEach(a => a.classList.remove('show'));
}

function render(){
  const c = copy[role];
  $('#visualKicker').textContent = c.kicker;
  $('#visualTitle').textContent = c.vTitle;
  $('#visualText').textContent = c.vText;
  $('#roles').dataset.role = role;
  $$('#roles button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.role === role)));
  $('#roles').style.display = '';
  $('#head').style.display = '';
  $('#footLegal').style.display = '';

  if(role === 'staff'){
    show('view-staff'); setHeader(...c.signin);
  } else if(view === 'signup'){
    show('view-client-signup'); setHeader(...c.signup);
  } else if(view === 'forgot'){
    show('view-forgot'); setHeader(...c.forgot);
  } else {
    show('view-client-signin'); setHeader(...c.signin);
  }
  document.title = (role === 'staff' ? 'Staff sign in' : view === 'signup' ? 'Create account' : 'Sign in') + ' | Foto Star Nepal';
}

$$('#roles button').forEach(b => b.addEventListener('click', () => {
  if(role === b.dataset.role) return;
  role = b.dataset.role; view = 'signin'; render();
}));
$$('[data-goto]').forEach(b => b.addEventListener('click', () => { view = b.dataset.goto; render(); }));

/* ---------- Helpers: fields, alerts, buttons ---------- */
function setInvalid(input, msg){
  const f = input.closest('.field'); f.classList.add('invalid');
  if(msg) f.querySelector('.field-error').textContent = msg;
}
function clearField(input){ input.closest('.field')?.classList.remove('invalid'); }
function showAlert(id, msg){
  const el = $('#'+id); el.querySelector('span').textContent = msg; el.classList.add('show');
}
function hideAlert(id){ $('#'+id).classList.remove('show'); }
function shake(form){ form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }
function loading(form, on){ form.querySelector('.btn').classList.toggle('loading', on); }
$$('input').forEach(i => i.addEventListener('input', () => {
  clearField(i);
  const form = i.closest('form'); if(form){ const al = form.parentElement.querySelector('.alert'); if(al && al.classList.contains('error')) al.classList.remove('show'); }
}));

/* show/hide password */
$$('.toggle-pw').forEach(b => b.addEventListener('click', () => {
  const inp = $('#'+b.dataset.toggle); const showing = inp.type === 'text';
  inp.type = showing ? 'password' : 'text';
  b.classList.toggle('on', !showing);
  b.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
}));

/* toast */
let toastTimer;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------- Password strength ---------- */
function strengthScore(p){
  let s = 0;
  if(p.length >= 8) s++;
  if(/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if(/\d/.test(p)) s++;
  if(/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return p ? Math.max(1, s) : 0;
}
$('#sPass').addEventListener('input', e => {
  const s = strengthScore(e.target.value);
  const bar = $('#strengthBar'); bar.className = 'strength' + (s ? ' s'+s : '');
  $('#strengthText').textContent = ['Use 8+ characters with letters and numbers.','Weak — add more characters.','Fair — try mixing upper and lower case.','Good — almost there.','Strong password.'][s];
});

/* ---------- Client accounts (localStorage demo) ---------- */
const getUsers = () => store.get('fsn_users') || {};
const saveUsers = u => store.set('fsn_users', u);

$('#signupForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target; hideAlert('signupAlert');
  const name = $('#sName').value.trim(), email = $('#sEmail').value.trim().toLowerCase(),
        phone = $('#sPhone').value.trim(), pass = $('#sPass').value, conf = $('#sConfirm').value;
  let ok = true;
  if(name.length < 2){ setInvalid($('#sName')); ok = false; }
  if(!EMAIL_RE.test(email)){ setInvalid($('#sEmail')); ok = false; }
  if(phone.replace(/\D/g,'').length < 7 || !/^[0-9+().\s-]{7,20}$/.test(phone)){ setInvalid($('#sPhone')); ok = false; }
  if(pass.length < 8){ setInvalid($('#sPass')); ok = false; }
  if(pass && conf !== pass){ setInvalid($('#sConfirm')); ok = false; }
  else if(!conf){ setInvalid($('#sConfirm'), 'Please confirm your password.'); ok = false; }
  if(!$('#sTerms').checked){ $('#sTerms').closest('.field').classList.add('invalid'); ok = false; }
  if(!ok){ shake(f); return; }

  loading(f, true);
  try{
    await sleep(900);
    const users = getUsers();
    if(users[email]){ showAlert('signupAlert','An account with this email already exists. Try signing in.'); shake(f); return; }
    const salt = randomSalt();
    users[email] = { name, phone, salt, hash: await sha256(salt + ':' + pass), created: Date.now() };
    saveUsers(users);
    startSession({ email, name, role:'client' }, true);
  }catch(err){
    showAlert('signupAlert', err.message === 'secure-context'
      ? 'Secure sign-in needs https:// or localhost. Please open the page from a web server.'
      : 'Something went wrong. Please try again.');
    shake(f);
  }finally{ loading(f, false); }
});

$('#clientSigninForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target; hideAlert('clientSigninAlert');
  const email = $('#cEmail').value.trim().toLowerCase(), pass = $('#cPass').value;
  let ok = true;
  if(!EMAIL_RE.test(email)){ setInvalid($('#cEmail')); ok = false; }
  if(!pass){ setInvalid($('#cPass')); ok = false; }
  if(!ok){ shake(f); return; }

  loading(f, true);
  try{
    await sleep(800);
    const u = getUsers()[email];
    const good = u && (await sha256(u.salt + ':' + pass)) === u.hash;
    if(!good){ showAlert('clientSigninAlert','Incorrect email or password. If you are new, create an account first.'); shake(f); return; }
    startSession({ email, name:u.name, role:'client' }, $('#cRemember').checked);
  }catch(err){
    showAlert('clientSigninAlert', err.message === 'secure-context'
      ? 'Secure sign-in needs https:// or localhost. Please open the page from a web server.'
      : 'Something went wrong. Please try again.');
    shake(f);
  }finally{ loading(f, false); }
});

$('#forgotForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target; hideAlert('forgotAlert');
  const email = $('#fEmail').value.trim();
  if(!EMAIL_RE.test(email)){ setInvalid($('#fEmail')); shake(f); return; }
  loading(f, true); await sleep(900); loading(f, false);
  // Same message whether or not the account exists (avoids revealing who has an account).
  showAlert('forgotAlert','Password reset is not connected in this demo. Please contact the studio for assistance.');
});

/* ---------- Staff sign in ---------- */
let attempts = 0, lockedUntil = 0, lockTimer;
function lockTick(){
  const left = Math.ceil((lockedUntil - Date.now())/1000);
  const btn = $('#staffForm .btn');
  if(left > 0){
    btn.disabled = true;
    showAlert('staffAlert', `Too many attempts. Try again in ${left}s.`);
    $('#staffAlert').className = 'alert info show';
  } else {
    clearInterval(lockTimer); btn.disabled = false; attempts = 0; hideAlert('staffAlert');
  }
}
$('#staffForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target; hideAlert('staffAlert'); $('#staffAlert').className = 'alert error';
  if(Date.now() < lockedUntil) return;
  const email = $('#tEmail').value.trim().toLowerCase(), pass = $('#tPass').value;
  let ok = true;
  if(!EMAIL_RE.test(email)){ setInvalid($('#tEmail')); ok = false; }
  if(!pass){ setInvalid($('#tPass')); ok = false; }
  if(!ok){ shake(f); return; }

  loading(f, true);
  try{
    await sleep(1000);
    const h = await sha256(email + ':' + pass);
    const member = CONFIG.staff.find(s => s.email === email && s.hash === h);
    if(!member){
      attempts++;
      if(attempts >= CONFIG.lockAfter){
        lockedUntil = Date.now() + CONFIG.lockSeconds*1000;
        lockTick(); lockTimer = setInterval(lockTick, 1000);
      } else {
        const left = CONFIG.lockAfter - attempts;
        showAlert('staffAlert', `Invalid staff email or password. ${left} attempt${left===1?'':'s'} remaining.`);
      }
      shake(f); return;
    }
    attempts = 0;
    startSession({ email, name:member.name, role:'staff', title:member.title }, $('#tRemember').checked);
  }catch(err){
    showAlert('staffAlert', err.message === 'secure-context'
      ? 'Secure sign-in needs https:// or localhost. Please open the page from a web server.'
      : 'Something went wrong. Please try again.');
    shake(f);
  }finally{ if(Date.now() >= lockedUntil) loading(f, false); else loading(f,false); }
});

/* ---------- Session ---------- */
function startSession(user, remember){
  const session = { ...user, at: Date.now() };
  store.del('fsn_session');
  store.set('fsn_session', session, !remember);
  showSuccess(session, true);
}
function showSuccess(s, fresh){
  const isStaff = s.role === 'staff';
  role = s.role;
  $('#roles').dataset.role = role;
  $('#roles').style.display = 'none';
  $('#head').style.display = 'none';
  $('#footLegal').style.display = 'none';
  const first = (s.name || '').split(' ')[0] || 'there';
  $('#successEyebrow').textContent = fresh ? 'Signed in successfully' : 'Active session';
  $('#successTitle').textContent = isStaff ? `Welcome, ${first}.` : `Welcome back, ${first}.`;
  $('#successText').textContent = isStaff
    ? 'Your staff session is active. Continue to the studio dashboard.'
    : 'You are signed in. Continue to the website to book a shoot.';
  $('#sessName').textContent = s.name || '—';
  $('#sessEmail').textContent = s.email;
  const badge = $('#sessRole'); badge.textContent = isStaff ? (s.title || 'Staff') : 'Client'; badge.className = 'badge ' + (isStaff ? '' : 'client');
  $('#sessTime').textContent = new Date(s.at).toLocaleString(undefined,{dateStyle:'medium', timeStyle:'short'});
  $('#continueLabel').textContent = isStaff ? 'Continue to studio dashboard' : 'Continue to website';
  $('#visualKicker').textContent = copy[role].kicker;
  $('#visualTitle').textContent = copy[role].vTitle;
  $('#visualText').textContent = copy[role].vText;
  show('view-success');
  document.title = 'Signed in | Foto Star Nepal';
  if(fresh && CONFIG.autoRedirect){
    $('#redirectBar').classList.add('run'); $('#redirectNote').classList.add('show');
    setTimeout(go, 2300);
  }
}
function go(){ window.location.href = CONFIG.redirect[role]; }
$('#continueBtn').addEventListener('click', go);
$('#signOutBtn').addEventListener('click', () => {
  store.del('fsn_session');
  $('#redirectBar').classList.remove('run'); $('#redirectNote').classList.remove('show');
  view = 'signin'; ['cPass','tPass'].forEach(id => $('#'+id).value = '');
  render(); toast('You have been signed out.');
});

/* restore an existing session */
const existing = store.get('fsn_session', true) || store.get('fsn_session', false);
if(existing && existing.email && (existing.role === 'staff' || !requestedDestination)) showSuccess(existing, false);
else render();

/* ESC / enter niceties */
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && (view === 'signup' || view === 'forgot') && role === 'client'){ view = 'signin'; render(); }
});
