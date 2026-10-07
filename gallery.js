/* ---------------- Portfolio data + masonry ---------------- */
const grid = document.getElementById('masonryGrid');
const filterRow = document.getElementById('filterRow');
let masonRevealObserver = null;
let activePortfolioFilter = 'Events';
let portfolioRenderTimer = 0;
let portfolioMutationQueued = false;
const portfolioItems = new Proxy(window.FOTO_STAR_DATA.getGalleryItems(), {
  set(target,property,value,receiver){
    const updated = Reflect.set(target,property,value,receiver);
    if(updated && property !== 'length') schedulePortfolioRefresh();
    return updated;
  },
  deleteProperty(items,property){
    const deleted = Reflect.deleteProperty(items,property);
    if(deleted) schedulePortfolioRefresh();
    return deleted;
  }
});
function schedulePortfolioRefresh(){
  if(portfolioMutationQueued) return;
  portfolioMutationQueued = true;
  queueMicrotask(()=>{
    portfolioMutationQueued = false;
    try{
      window.FOTO_STAR_DATA.saveGalleryItems([...portfolioItems]);
    }catch(error){
      console.error('Could not save the public gallery changes in this browser.',error);
    }
    refreshPortfolio();
  });
}
function renderPortfolioFilters(){
  const focusedFilter = document.activeElement?.closest('#filterRow .filter-btn')?.dataset.filter;
  const categories = [...new Set(portfolioItems.map(item => item.category).filter(Boolean))];
  if(activePortfolioFilter !== 'all' && !categories.includes(activePortfolioFilter)) activePortfolioFilter = 'all';
  filterRow.replaceChildren();
  ['all',...categories].forEach(category=>{
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-btn${activePortfolioFilter === category ? ' active' : ''}`;
    button.dataset.filter = category;
    button.setAttribute('aria-pressed',String(activePortfolioFilter === category));
    button.textContent = category === 'all' ? 'All' : category;
    filterRow.appendChild(button);
  });
  if(focusedFilter && [...filterRow.children].some(button => button.dataset.filter === focusedFilter)){
    [...filterRow.children].find(button => button.dataset.filter === focusedFilter)?.focus({preventScroll:true});
  }
}
function renderPortfolio({animate=false}={}){
  if(portfolioRenderTimer) clearTimeout(portfolioRenderTimer);
  if(animate) grid.classList.add('is-filtering');
  const draw = ()=>{
    const filtered = portfolioItems
      .filter(item => activePortfolioFilter === 'all' || item.category === activePortfolioFilter)
      .slice()
      .sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)));
    grid.replaceChildren();
    if(!filtered.length){
      const empty = document.createElement('p');
      empty.className = 'portfolio-empty';
      empty.textContent = 'No photographs in this collection yet.';
      grid.appendChild(empty);
    }
    filtered.forEach((item,index)=>{
      const card = document.createElement('div');
      card.className = 'mason-item pre-reveal';
      card.style.transitionDelay = `${(index % 6) * 70}ms`;
      card.dataset.cursor = 'view';
      card.dataset.featured = String(Boolean(item.featured));
      card.tabIndex = 0;
      card.setAttribute('role','button');
      card.setAttribute('aria-label',`View ${item.title}${item.featured ? ', featured' : ''}`);

      const inner = document.createElement('div');
      inner.className = 'tilt-inner';
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = `${item.title}, ${item.category} photography by Foto Star Nepal`;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.style.setProperty('--image-height',`${item.height || 520}px`);
      image.style.objectFit = 'cover';

      const caption = document.createElement('div');
      caption.className = 'mason-cap';
      const copy = document.createElement('div');
      const category = document.createElement('span');
      category.className = 'cat';
      category.textContent = item.category;
      copy.appendChild(category);
      if(item.featured){
        const featured = document.createElement('span');
        featured.className = 'featured-tag';
        featured.textContent = 'Featured';
        copy.appendChild(featured);
      }
      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = item.title;
      copy.appendChild(title);
      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = '↗';
      caption.append(copy,arrow);
      inner.append(image,caption);
      card.appendChild(inner);
      card.addEventListener('click',()=>openLightbox(filtered,index));
      card.addEventListener('keydown',event=>{
        if(event.key === 'Enter' || event.key === ' '){
          event.preventDefault();
          openLightbox(filtered,index);
        }
      });
      grid.appendChild(card);
    });
    grid.classList.remove('is-filtering');
    observeMasonItems();
  };
  if(animate) portfolioRenderTimer = window.setTimeout(()=>{
    portfolioRenderTimer = 0;
    draw();
  },150);
  else draw();
}
function refreshPortfolio(){
  renderPortfolioFilters();
  renderPortfolio({animate:true});
}
window.addEventListener('storage',event=>{
  if(event.key !== window.FOTO_STAR_DATA.GALLERY_KEY) return;
  const savedItems = window.FOTO_STAR_DATA.getGalleryItems();
  portfolioItems.splice(0,portfolioItems.length,...savedItems);
});
window.fotoStarGallery = {
  items:portfolioItems,
  add(item){ portfolioItems.push(item); },
  remove(title){
    const index = portfolioItems.findIndex(item=>item.title === title);
    if(index < 0) return false;
    portfolioItems.splice(index,1);
    return true;
  },
  refresh:refreshPortfolio
};
renderPortfolioFilters();
renderPortfolio();

/* reveal + settle observer for masonry items */
function observeMasonItems(){
  if(masonRevealObserver) masonRevealObserver.disconnect();
  const items = document.querySelectorAll('.mason-item.pre-reveal');
  masonRevealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('in-view');
        setTimeout(()=> en.target.classList.add('settled'), 60);
        masonRevealObserver.unobserve(en.target);
      }
    });
  }, {threshold:.12});
  items.forEach(el => masonRevealObserver.observe(el));
}

/* subtle tilt on featured (first) masonry item per row-ish: apply to all via pointer move, capped */
grid.addEventListener('mousemove', (e) => {
  const item = e.target.closest('.mason-item');
  if(!item) return;
  const inner = item.querySelector('.tilt-inner');
  const r = item.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - .5;
  const py = (e.clientY - r.top) / r.height - .5;
  inner.style.transform = `rotateY(${px*3}deg) rotateX(${-py*3}deg)`;
});
grid.addEventListener('mouseleave', (e)=>{
  document.querySelectorAll('.tilt-inner').forEach(el => el.style.transform = '');
}, true);
filterRow.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if(!btn) return;
  activePortfolioFilter = btn.dataset.filter;
  renderPortfolioFilters();
  renderPortfolio({animate:true});
});



/* ---------------- Lightbox ---------------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxImgWrap = lightboxImg.parentElement;
let lbItems = [], lbIndex = 0;
function openLightbox(items, idx){
  lbItems = items; lbIndex = idx;
  updateLightbox(false);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
}
function updateLightbox(animate = true){
  const it = lbItems[lbIndex];
  document.getElementById('lightboxTitle').textContent = it.title;
  document.getElementById('lightboxCount').textContent = String(lbIndex+1).padStart(2,'0') + ' / ' + String(lbItems.length).padStart(2,'0');
  if(!animate){
    lightboxImg.src = it.image.replace('w=900','w=1600');
    lightboxImg.alt = it.title;
    return;
  }
  lightboxImgWrap.classList.add('is-changing');
  requestAnimationFrame(() => {
    lightboxImg.src = it.image.replace('w=900','w=1600');
    lightboxImg.alt = it.title;
    requestAnimationFrame(() => lightboxImgWrap.classList.remove('is-changing'));
  });
}
function closeLightbox(){ lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden','true'); }
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxBg').addEventListener('click', closeLightbox);
document.getElementById('lbNext').addEventListener('click', () => {
  if(!lbItems.length) return;
  lbIndex = (lbIndex+1)%lbItems.length;
  updateLightbox();
});
document.getElementById('lbPrev').addEventListener('click', () => {
  if(!lbItems.length) return;
  lbIndex = (lbIndex-1+lbItems.length)%lbItems.length;
  updateLightbox();
});
let lbTouchStart = null;
lightboxImgWrap.addEventListener('pointerdown', e => {
  if(e.pointerType !== 'touch') return;
  lbTouchStart = {x:e.clientX, y:e.clientY};
});
lightboxImgWrap.addEventListener('pointerup', e => {
  if(!lbTouchStart || e.pointerType !== 'touch') return;
  const deltaX = e.clientX - lbTouchStart.x;
  const deltaY = e.clientY - lbTouchStart.y;
  lbTouchStart = null;
  if(Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
  document.getElementById(deltaX < 0 ? 'lbNext' : 'lbPrev').click();
});
lightboxImgWrap.addEventListener('pointercancel', () => { lbTouchStart = null; });
window.addEventListener('keydown', e => {
  if(!lightbox.classList.contains('open')) return;
  if(e.key==='Escape') closeLightbox();
  if(e.key==='ArrowRight') document.getElementById('lbNext').click();
  if(e.key==='ArrowLeft') document.getElementById('lbPrev').click();
});

/* ---------------- Reel progress ---------------- */
const reelTrack = document.getElementById('reelTrack');
const reelProgress = document.getElementById('reelProgress');
const reelCount = reelTrack.children.length;
reelTrack.addEventListener('scroll', () => {
  const cardWidth = reelTrack.children[0].offsetWidth + 20;
  const idx = Math.min(reelCount-1, Math.round(reelTrack.scrollLeft / cardWidth));
  reelProgress.textContent = String(idx+1).padStart(2,'0') + ' / ' + String(reelCount).padStart(2,'0');
}, {passive:true});
/* drag-to-scroll for mouse users */
let reelDown=false, reelStartX=0, reelScrollStart=0;
reelTrack.addEventListener('mousedown', e => { reelDown=true; reelStartX=e.pageX; reelScrollStart=reelTrack.scrollLeft; });
window.addEventListener('mouseup', () => reelDown=false);
window.addEventListener('mousemove', e => { if(!reelDown) return; reelTrack.scrollLeft = reelScrollStart - (e.pageX - reelStartX); });
