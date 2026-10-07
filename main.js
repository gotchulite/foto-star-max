/* ---------------- Loader ---------------- */
function finishLoader(){
  const loader = document.getElementById('loader');
  if(!loader) return;
  loader.classList.add('is-focused');
  document.querySelector('.hero')?.classList.add('loaded');
  setTimeout(()=>{
    loader.classList.add('hide');
    const removeAfterFade = event=>{
      if(event.propertyName !== 'opacity') return;
      loader.removeEventListener('transitionend', removeAfterFade);
      loader.remove();
    };
    loader.addEventListener('transitionend', removeAfterFade);
    setTimeout(()=>loader.remove(), 700);
  }, 520);
}
if(document.readyState === 'complete') finishLoader();
else window.addEventListener('load', finishLoader, {once:true});

/* ---------------- Nav scroll state ---------------- */
const header = document.getElementById('siteHeader');
let lastScrollY = window.scrollY;
let scrollDirection = 0;
let scrollDistance = 0;
function updateHeaderScrollState(){
  const scrollY = window.scrollY;
  const delta = scrollY - lastScrollY;
  header.classList.toggle('scrolled', scrollY > 60);
  if(scrollY <= 80 || header.classList.contains('menu-open')){
    header.classList.remove('nav-hidden');
    header.inert = false;
    scrollDirection = 0;
    scrollDistance = 0;
  }else if(delta !== 0){
    const direction = Math.sign(delta);
    if(direction !== scrollDirection){
      scrollDirection = direction;
      scrollDistance = 0;
    }
    scrollDistance += Math.abs(delta);
    if(scrollDistance > 12){
      const shouldHide = direction > 0 && !header.contains(document.activeElement);
      header.classList.toggle('nav-hidden', shouldHide);
      header.inert = shouldHide;
    }
  }
  lastScrollY = scrollY;
}
window.addEventListener('scroll', updateHeaderScrollState, {passive:true});
updateHeaderScrollState();

function updateAccountLinks(){
  let hasSession = false;
  try{
    hasSession = Boolean(localStorage.getItem('fsn_session') || sessionStorage.getItem('fsn_session'));
  }catch(error){
    console.warn('Account status is unavailable in this browser.', error);
  }
  document.querySelectorAll('[data-account-link]').forEach(link => {
    link.textContent = hasSession ? link.dataset.signedInLabel : 'Sign in';
  });
}
updateAccountLinks();

const SOCIAL_PROFILE_URLS = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  tiktok: 'https://www.tiktok.com/'
};
document.querySelectorAll('[data-social-profile]').forEach(link => {
  const profileUrl = SOCIAL_PROFILE_URLS[link.dataset.socialProfile];
  if(profileUrl){
    link.href = profileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.removeAttribute('aria-disabled');
    link.removeAttribute('tabindex');
  }else{
    link.removeAttribute('href');
    link.setAttribute('aria-disabled','true');
    link.tabIndex = -1;
  }
});

/* ---------------- Mobile menu ---------------- */
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuClose = document.getElementById('mobileMenuClose');
let menuPreviousOverflow = '';
let menuPreviousPaddingRight = '';
function closeMobileMenu({restoreFocus = false} = {}){
  if(!mobileMenu.classList.contains('open')) return;
  mobileMenu.classList.remove('open');
  header.classList.remove('menu-open');
  navToggle.classList.remove('active');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open menu');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = menuPreviousOverflow;
  document.body.style.paddingRight = menuPreviousPaddingRight;
  if(restoreFocus) navToggle.focus();
}
function openMobileMenu(){
  menuPreviousOverflow = document.body.style.overflow;
  menuPreviousPaddingRight = document.body.style.paddingRight;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if(scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
  document.body.style.overflow = 'hidden';
  mobileMenu.classList.add('open');
  header.classList.add('menu-open');
  navToggle.classList.add('active');
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Close menu');
  mobileMenu.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => mobileMenuClose.focus({preventScroll:true}));
}
navToggle.addEventListener('click', () => {
  if(mobileMenu.classList.contains('open')) closeMobileMenu();
  else openMobileMenu();
});
mobileMenuClose.addEventListener('click', () => closeMobileMenu({restoreFocus:true}));
mobileMenu.addEventListener('click', e => {
  if(e.target === mobileMenu) closeMobileMenu({restoreFocus:true});
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  if(a.matches('.social-link[aria-disabled="true"]')) return;
  closeMobileMenu();
}));
const mobileActionBarObserver = new IntersectionObserver(([entry]) => {
  document.body.classList.toggle('booking-in-view', entry.isIntersecting);
}, {threshold:0});
mobileActionBarObserver.observe(document.getElementById('booking'));
window.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeMobileMenu({restoreFocus:true});
});
window.matchMedia('(min-width: 901px)').addEventListener('change', e => {
  if(e.matches) closeMobileMenu();
});

const navLinks = [...document.querySelectorAll('.nav-links a, .mobile-menu-panel a:not(.nav-cta):not(.social-link)')];
const navSections = [...new Set(navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean))];
const navSectionObserver = new IntersectionObserver(entries => {
  const active = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
  if(!active) return;
  navLinks.forEach(link => {
    const isActive = link.getAttribute('href') === `#${active.target.id}`;
    if(isActive) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
}, {rootMargin:'-18% 0px -68% 0px',threshold:[0,.15,.35,.6,.85]});
navSections.forEach(section => navSectionObserver.observe(section));



/* ---------------- Services interactive list ---------------- */
const services = window.FOTO_STAR_DATA.services;

const serviceList = document.getElementById('serviceList');
const serviceVisual = document.getElementById('serviceVisual');
const servicePanel = document.getElementById('servicePanel');
let activeServiceIndex = 0;
services.forEach((s, i) => {
  const row = document.createElement('div');
  row.className = 'service-row' + (i===0 ? ' active':'');
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', s.title);
  row.innerHTML = `
    <button class="service-row-head" type="button" aria-expanded="${i===0}" aria-controls="service-body-${i}">
      <h3>${s.title}</h3>
      <span class="service-index">${String(i+1).padStart(2,'0')}</span>
      <span class="service-plus" aria-hidden="true">+</span>
    </button>
    <div class="service-body" id="service-body-${i}" aria-hidden="${i!==0}">
      <div class="service-body-in">
        <p>${s.body}</p>
        <div class="for">${s.forWho}</div>
        <a href="#booking" class="service-link" tabindex="${i===0 ? 0 : -1}">Book this service <span aria-hidden="true">↗</span></a>
      </div>
    </div>`;
  row.querySelector('.service-row-head').addEventListener('click', () => activateService(i));
  row.querySelector('.service-link').addEventListener('click', () => selectBookingService(s.booking));
  row.addEventListener('mouseenter', () => {
    if(window.matchMedia('(hover:hover) and (pointer:fine)').matches) activateService(i);
  });
  serviceList.appendChild(row);

  const img = document.createElement('img');
  img.src = s.img;
  img.alt = s.title;
  img.loading = i === 0 ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.className = i===0 ? 'active' : '';
  serviceVisual.insertBefore(img, servicePanel);
});
const servicePanelLink = document.getElementById('spLink');
servicePanelLink.textContent = 'Book this service ↗';
servicePanelLink.addEventListener('click', () => selectBookingService(services[activeServiceIndex].booking));
function selectBookingService(serviceName){
  ['fservice','mfservice'].forEach(id => {
    const select = document.getElementById(id);
    const option = [...select.options].find(item => item.textContent.trim() === serviceName);
    if(option){
      select.value = option.value;
      if(id === 'fservice') select.dispatchEvent(new Event('change', {bubbles:true}));
    }
  });
}
function activateService(i){
  if(i === activeServiceIndex && serviceList.children[i].classList.contains('active')) return;
  activeServiceIndex = i;
  document.querySelectorAll('.service-row').forEach((r,idx)=>{
    r.classList.toggle('active', idx===i);
    r.querySelector('.service-row-head').setAttribute('aria-expanded', String(idx===i));
    r.querySelector('.service-body').setAttribute('aria-hidden', String(idx!==i));
    r.querySelector('.service-link').tabIndex = idx===i ? 0 : -1;
  });
  document.querySelectorAll('.service-visual img').forEach((im,idx)=> im.classList.toggle('active', idx===i));
  const s = services[i];
  servicePanel.classList.add('is-changing');
  document.getElementById('spNum').textContent = String(i+1).padStart(2,'0');
  document.getElementById('spTitle').textContent = s.title;
  document.getElementById('spBody').textContent = s.body;
  requestAnimationFrame(() => requestAnimationFrame(() => servicePanel.classList.remove('is-changing')));
}
activateService(0);

/* ---------------- FAQ ---------------- */
const faqs = [
  {q:'What photography services do you provide?', a:'Wedding, event, portrait, corporate, passport/visa photography, framing, canvas printing and restoration.'},
  {q:'Do you photograph weddings?', a:'Yes — wedding and reception photography and videography are offered.'},
  {q:'Do you provide passport and visa photos?', a:'Yes, official-format photographs are offered according to applicable requirements.'},
  {q:'Can you restore old photographs?', a:'Yes, photo restoration and digital editing services are available.'},
  {q:'Do you provide photo framing?', a:'Yes, custom framing and canvas printing are available.'},
  {q:'How do I book a photography service?', a:'Contact the studio through WhatsApp, phone or the online inquiry form on this page.'},
  {q:'Do you cover outdoor events?', a:'Please confirm availability and requirements with the studio directly.'},
];
const testimonialStories = [
  {quote:'"They made our wedding day feel effortless — the photos still bring us right back to that morning."', name:'Placeholder Review', role:'Wedding — Lalitpur'},
  {quote:'"Fast, professional, and the corporate headshots looked genuinely polished."', name:'Placeholder Review', role:'Corporate Portraits'},
  {quote:'"Our old family photo was falling apart. Now it’s restored and framed on our wall."', name:'Placeholder Review', role:'Photo Restoration'},
];
const testimonialTrack = document.getElementById('testimonialTrack');
testimonialStories.forEach(story => {
  const card = document.createElement('article');
  card.className = 'testi-card';
  const quote = document.createElement('p');
  quote.className = 'q';
  quote.textContent = story.quote;
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = story.name;
  const role = document.createElement('div');
  role.className = 'role';
  role.textContent = story.role;
  card.append(quote,name,role);
  testimonialTrack.appendChild(card);
});
const faqList = document.getElementById('faqList');
faqs.forEach((f,index) => {
  const item = document.createElement('div');
  item.className = 'faq-item';
  const answerId = `faq-answer-${index+1}`;
  item.innerHTML = `
    <button class="faq-q" type="button" aria-expanded="false" aria-controls="${answerId}"><span>${f.q}</span><span class="faq-plus" aria-hidden="true">+</span></button>
    <div class="faq-a" id="${answerId}" role="region" aria-label="${f.q}" aria-hidden="true"><p>${f.a}</p></div>`;
  const question = item.querySelector('.faq-q');
  const answer = item.querySelector('.faq-a');
  question.addEventListener('click', () => {
    const isOpen = item.classList.toggle('open');
    question.setAttribute('aria-expanded', String(isOpen));
    answer.setAttribute('aria-hidden', String(!isOpen));
  });
  faqList.appendChild(item);
});

/* ---------------- Before / After slider ---------------- */
const ba = document.getElementById('baSlider');
const baRange = document.getElementById('baRange');
const baHandle = document.getElementById('baHandle');
const baAfter = ba.querySelector('.ba-after');
function setBA(pct){
  baAfter.style.clipPath = `inset(0 0 0 ${pct}%)`;
  baHandle.style.left = pct + '%';
}
baRange.addEventListener('input', e => setBA(e.target.value));
setBA(50);



/* ---------------- Scroll reveal ---------------- */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
}, {threshold:.15});
revealEls.forEach(el => io.observe(el));

/* ---------------- Reduced motion / touch detection ---------------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
const enableRichMotion = !prefersReduced && isFinePointer && window.innerWidth > 900;

/* ---------------- Custom cursor ---------------- */
if(enableRichMotion){
  document.body.classList.add('has-custom-cursor');
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const ringLabel = document.getElementById('cursorRingLabel');
  let mx=0,my=0, rx=0,ry=0;
  window.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; });
  (function loopCursor(){
    rx += (mx-rx)*.18; ry += (my-ry)*.18;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loopCursor);
  })();
  const cursorLabels = {view:'VIEW', open:'OPEN', drag:'DRAG', close:'CLOSE'};
  document.addEventListener('mouseover', e => {
    const target = e.target.closest('[data-cursor]');
    if(target && target.dataset.cursor){
      ring.classList.add('show');
      ringLabel.textContent = cursorLabels[target.dataset.cursor] || '';
      const dark = getComputedStyle(target.closest('section, header') || document.body).getPropertyValue('background-color');
      ring.classList.toggle('dark', target.closest('.section-pad') && !target.closest('.signature, .booking, footer'));
    } else if(!e.target.closest('a,button,input,select,textarea')){
      ring.classList.remove('show');
    }
  });

  /* ambient mouse light */
  const mLight = document.getElementById('mouseLight');
  mLight.classList.add('active');
  window.addEventListener('mousemove', e => {
    mLight.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
  });

  /* magnetic buttons */
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const px = (e.clientX - r.left - r.width/2) * .25;
      const py = (e.clientY - r.top - r.height/2) * .35;
      btn.style.transform = `translate(${px}px, ${py}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  /* hero parallax */
  const heroImg = document.querySelector('.hero-media img');
  const heroContent = document.getElementById('heroContent');
  const heroSection = document.querySelector('.hero');
  let parallaxFrame = 0;
  let parallaxStarted = false;
  const updateHeroParallax = () => {
    const progress = Math.min(window.scrollY / Math.max(heroSection.offsetHeight * .85, 1), 1);
    if(!parallaxStarted){
      heroImg.style.transition = 'none';
      parallaxStarted = true;
    }
    heroImg.style.transform = `scale(${1 + progress * .035}) translate3d(0,${progress * 22}px,0)`;
    heroContent.style.transform = `translate3d(0,${progress * 12}px,0)`;
    parallaxFrame = 0;
  };
  window.addEventListener('scroll', () => {
    if(!parallaxFrame) parallaxFrame = requestAnimationFrame(updateHeroParallax);
  }, {passive:true});
}



/* ---------------- Footer reveal ---------------- */
const footerCta = document.getElementById('footerCta');
const footerIo = new IntersectionObserver((entries) => {
  entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); footerIo.unobserve(en.target); } });
}, {threshold:.4});
footerIo.observe(footerCta);
const footerVisibilityIo = new IntersectionObserver(([entry]) => {
  document.body.classList.toggle('footer-in-view', entry.isIntersecting);
}, {threshold:0});
footerVisibilityIo.observe(document.querySelector('footer'));
