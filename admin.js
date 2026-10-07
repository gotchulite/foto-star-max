(() => {
  'use strict';
  const BOOKINGS_KEY='fsn_demo_bookings_v1';
  const SESSION_KEY='fsn_session';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const iconFor={Dashboard:'◫',Bookings:'◷',Gallery:'▧',Services:'≡',Settings:'⚙'};
  const sampleBookings=[
    {id:'FSN-DEMO-4821',createdAt:hoursAgo(2),status:'pending-confirmation',demo:true,request:{service:'Wedding / Reception',preferredDate:daysFromNow(2),preferredTime:'10:30 AM',client:{name:'Aarav Shrestha',phone:'+977 9800000142',email:'aarav@example.com'},location:{address:'Patan Durbar Square, Lalitpur'},requirements:'Wedding ceremony and family portraits.'}},
    {id:'FSN-DEMO-4818',createdAt:hoursAgo(9),status:'confirmed',demo:true,request:{service:'Portrait',preferredDate:daysFromNow(4),preferredTime:'1:30 PM',client:{name:'Sanjana Maharjan',phone:'+977 9800000217',email:'sanjana@example.com'},location:{address:'Foto Star Nepal Studio'},requirements:'Studio portrait session.'}},
    {id:'FSN-DEMO-4812',createdAt:hoursAgo(26),status:'contacted',demo:true,request:{service:'Photo Restoration',preferredDate:daysFromNow(6),preferredTime:'3:00 PM',client:{name:'Nima Tamang',phone:'+977 9800000324',email:'nima@example.com'},location:{address:'Foto Star Nepal Studio'},requirements:'Restore and print a family photograph.'}}
  ];
  function daysFromNow(days){const date=new Date();date.setDate(date.getDate()+days);return date.toISOString().slice(0,10)}
  function hoursAgo(hours){return new Date(Date.now()-hours*3600000).toISOString()}
  function readBookings(){
    const raw=localStorage.getItem(BOOKINGS_KEY);
    if(!raw)return [];
    const value=JSON.parse(raw);
    if(!Array.isArray(value))throw new Error('Saved booking data is not an array.');
    return value;
  }
  function readStaffSession(){
    for(const storage of [sessionStorage,localStorage]){
      try{
        const session=JSON.parse(storage.getItem(SESSION_KEY)||'null');
        if(session?.role==='staff'&&session.email)return session;
      }catch(error){
        console.error('Could not read the demo staff session.',error);
      }
    }
    return null;
  }
  const staffSession=readStaffSession();
  if(!staffSession){
    window.location.replace('signin.html?role=staff&next=admin');
    return;
  }
  function saveBookings(items){localStorage.setItem(BOOKINGS_KEY,JSON.stringify(items))}
  function allGallery(){return window.FOTO_STAR_DATA.getGalleryItems()}
  function toast(message){
    const el=$('#toast');el.textContent=message;el.classList.add('show');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2800);
  }
  function initials(name){return (name||'?').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}
  function dateLabel(value,options={month:'short',day:'numeric',year:'numeric'}){
    if(!value)return 'Date not set';
    const date=new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime())?'Date not set':date.toLocaleDateString(undefined,options);
  }
  function timeAgo(value){
    const time=new Date(value).getTime();
    if(!Number.isFinite(time))return 'Recently';
    const minutes=Math.max(1,Math.floor((Date.now()-time)/60000));
    if(minutes<60)return `${minutes} min ago`;
    const hours=Math.floor(minutes/60);
    if(hours<24)return `${hours} hr${hours===1?'':'s'} ago`;
    return `${Math.floor(hours/24)} day${Math.floor(hours/24)===1?'':'s'} ago`;
  }
  function statusLabel(status){
    return ({'pending-confirmation':'Awaiting confirmation',confirmed:'Confirmed',contacted:'Contacted',inquiry:'New inquiry'})[status]||'New inquiry';
  }
  function statusClass(status){
    return status==='confirmed'?'status-confirmed':status==='contacted'?'status-contacted':'';
  }
  function getData(){
    const saved=readBookings();
    return {saved,bookings:saved.length?saved:sampleBookings.map(item=>({...item,request:{...item.request,client:{...item.request.client},location:{...item.request.location}}})),usingSamples:saved.length===0};
  }
  function bookingRow(booking,{compact=false}={}){
    const r=booking.request||{},client=r.client||{};
    const row=document.createElement('div');row.className='booking-row';
    const identity=document.createElement('div');identity.className='client-cell';
    const avatar=document.createElement('span');avatar.className='client-avatar';avatar.textContent=initials(client.name);
    const clientCopy=document.createElement('div');
    const name=document.createElement('div');name.className='client-name';name.textContent=client.name||'Studio inquiry';
    const ref=document.createElement('div');ref.className='client-meta';ref.textContent=booking.id||'No reference';
    clientCopy.append(name,ref);identity.append(avatar,clientCopy);
    const service=document.createElement('div');service.innerHTML='';
    const serviceName=document.createElement('div');serviceName.className='booking-service';serviceName.textContent=r.service||'Photography service';
    const serviceMeta=document.createElement('div');serviceMeta.className='booking-meta';serviceMeta.textContent=r.preferredTime||'Time flexible';
    service.append(serviceName,serviceMeta);
    const date=document.createElement('div');date.innerHTML='';
    const dateMain=document.createElement('div');dateMain.className='booking-date';dateMain.textContent=dateLabel(r.preferredDate,{month:'short',day:'numeric'});
    const dateMeta=document.createElement('div');dateMeta.className='booking-meta';dateMeta.textContent=compact?timeAgo(booking.createdAt):dateLabel(r.preferredDate,{weekday:'short'});
    date.append(dateMain,dateMeta);
    const status=document.createElement('span');status.className=`status ${booking.demo?'status-sample ':''}${statusClass(booking.status)}`;status.textContent=booking.demo?'Sample':statusLabel(booking.status);
    row.append(identity,service,date,status);return row;
  }
  function renderBookings(){
    const {bookings,usingSamples}=getData();
    const future=bookings.filter(item=>item.request?.preferredDate&&item.request.preferredDate>=daysFromNow(0)).sort((a,b)=>a.request.preferredDate.localeCompare(b.request.preferredDate));
    const recent=[...bookings].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const pending=bookings.filter(item=>!['confirmed','contacted'].includes(item.status)).length;
    $('#stat-total').textContent=bookings.length;
    $('#stat-total-note').textContent=usingSamples?'Preview examples · no inquiries saved yet':`${bookings.length} saved in this browser`;
    $('#stat-pending').textContent=pending;
    $('#stat-upcoming').textContent=future.length;
    $('#upcomingList').replaceChildren();
    if(future.length)future.slice(0,4).forEach(item=>$('#upcomingList').appendChild(bookingRow(item,{compact:true})));
    else $('#upcomingList').innerHTML='<div class="booking-empty">No upcoming bookings yet.</div>';
    $('#recentBookings').replaceChildren();
    recent.slice(0,5).forEach(item=>{
      const r=item.request||{},tr=document.createElement('tr');
      const values=[r.client?.name||'Studio inquiry',r.service||'Photography service',dateLabel(r.preferredDate),item.demo?'Sample':statusLabel(item.status)];
      values.forEach((value,index)=>{const td=document.createElement('td');td.textContent=value;if(index===3){const badge=document.createElement('span');badge.className=`status ${item.demo?'status-sample ':''}${statusClass(item.status)}`;badge.textContent=value;td.replaceChildren(badge)}tr.appendChild(td)});
      $('#recentBookings').appendChild(tr);
    });
    $('#bookingTableNote').textContent=usingSamples?'Showing preview examples. Add a demo booking to save a local record.':`${bookings.length} booking${bookings.length===1?'':'s'} saved in this browser`;
    $('#allBookings').replaceChildren();
    bookings.forEach(item=>{
      const r=item.request||{},tr=document.createElement('tr');
      const cells=[item.id||'—',r.client?.name||'Studio inquiry',r.service||'Photography service',`${dateLabel(r.preferredDate)} · ${r.preferredTime||'Flexible'}`,r.location?.address||'To be confirmed'];
      cells.forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.appendChild(td)});
      const statusTd=document.createElement('td'),badge=document.createElement('span');badge.className=`status ${item.demo?'status-sample ':''}${statusClass(item.status)}`;badge.textContent=item.demo?'Sample':statusLabel(item.status);statusTd.appendChild(badge);tr.appendChild(statusTd);
      const actionTd=document.createElement('td');
      if(item.demo){actionTd.textContent='Preview'}
      else{
        const select=document.createElement('select');select.setAttribute('aria-label',`Update status for ${r.client?.name||item.id}`);
        [['pending-confirmation','Awaiting confirmation'],['contacted','Contacted'],['confirmed','Confirmed']].forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;option.selected=item.status===value;select.appendChild(option)});
        select.addEventListener('change',()=>{const records=readBookings();const saved=records.find(record=>record.id===item.id);if(saved){saved.status=select.value;saveBookings(records);render();toast('Booking status updated.')}});
        actionTd.appendChild(select)
      }
      tr.appendChild(actionTd);$('#allBookings').appendChild(tr)
    });
    const activities=[];
    recent.slice(0,3).forEach(item=>activities.push({icon:item.demo?'◷':'＋',text:`<strong>${escapeHtml(item.request?.client?.name||'A client')}</strong> ${item.demo?'sample inquiry':'sent a booking inquiry'}`,time:timeAgo(item.createdAt)}));
    activities.push({icon:'▧',text:`Portfolio has <strong>${allGallery().length} photos</strong> across ${new Set(allGallery().map(item=>item.category)).size} collections`,time:'Gallery catalog'});
    $('#activityList').replaceChildren();
    activities.slice(0,4).forEach(item=>{const entry=document.createElement('div');entry.className='activity';const mark=document.createElement('span');mark.className='activity-mark';mark.textContent=item.icon;const copy=document.createElement('div');copy.className='activity-copy';copy.innerHTML=item.text;const time=document.createElement('div');time.className='activity-time';time.textContent=item.time;copy.appendChild(time);entry.append(mark,copy);$('#activityList').appendChild(entry)});
    $('#settingsBookingCount').textContent=readBookings().length;
  }
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
  function renderGallery(){
    const items=allGallery(),categories=new Set(items.map(item=>item.category));
    $('#stat-gallery').textContent=items.length;$('#stat-featured').textContent=`${items.filter(item=>item.featured).length} featured in portfolio`;
    $('#gallery-total').textContent=items.length;$('#gallery-featured').textContent=items.filter(item=>item.featured).length;$('#gallery-categories').textContent=categories.size;
    $('#settingsGalleryCount').textContent=items.length;
    const grid=$('#galleryGrid');grid.replaceChildren();
    if(!items.length){grid.innerHTML='<div class="empty">Your portfolio is empty. Add a photo to get started.</div>';return}
    items.forEach((item,index)=>{
      const card=document.createElement('article');card.className='gallery-card';
      const thumb=document.createElement('div');thumb.className='gallery-thumb';
      const image=document.createElement('img');image.src=item.image;image.alt=item.title;image.loading='lazy';thumb.appendChild(image);
      if(item.featured){const badge=document.createElement('span');badge.className='featured-badge';badge.textContent='Featured';thumb.appendChild(badge)}
      const info=document.createElement('div');info.className='gallery-info';
      const top=document.createElement('div');top.className='gallery-info-top';
      const title=document.createElement('div');title.className='gallery-name';title.textContent=item.title;
      const remove=document.createElement('button');remove.className='gallery-remove';remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label',`Remove ${item.title}`);
      remove.addEventListener('click',()=>{
        const next=allGallery();next.splice(index,1);
        try{window.FOTO_STAR_DATA.saveGalleryItems(next);renderGallery();renderBookings();toast('Photo removed from the public gallery.')}
        catch(error){console.error('Could not save the gallery update.',error);toast('Could not save this change in browser storage.')}
      });
      const category=document.createElement('div');category.className='gallery-category';category.textContent=item.category;
      top.append(title,remove);info.append(top,category);card.append(thumb,info);grid.appendChild(card)
    });
    $('#galleryCategoryOptions').replaceChildren();
    [...categories].sort().forEach(category=>{const option=document.createElement('option');option.value=category;$('#galleryCategoryOptions').appendChild(option)})
  }
  function renderServices(){
    const grid=$('#serviceGrid');grid.replaceChildren();
    window.FOTO_STAR_DATA.services.forEach((service,index)=>{
      const card=document.createElement('article');card.className='service-card';
      const top=document.createElement('div');top.className='service-card-top';
      const number=document.createElement('span');number.className='service-number';number.textContent=String(index+1).padStart(2,'0');
      const enabled=document.createElement('span');enabled.className='status status-confirmed';enabled.textContent='Active';top.append(number,enabled);
      const title=document.createElement('h2');title.className='service-title';title.textContent=service.title;
      const body=document.createElement('p');body.className='service-body';body.textContent=service.body;
      const meta=document.createElement('div');meta.className='service-meta';meta.textContent=service.forWho;
      card.append(top,title,body,meta);grid.appendChild(card)
    })
  }
  function render(){
    try{renderBookings();renderGallery();renderServices()}
    catch(error){console.error('Could not render dashboard data.',error);toast(`Dashboard data could not be loaded: ${error.message}`)}
  }
  function showView(view){
    const known=['dashboard','bookings','gallery','services','settings'];
    if(!known.includes(view))view='dashboard';
    $$('.view').forEach(section=>{const active=section.id===`view-${view}`;section.hidden=!active;if(active){section.classList.remove('view');void section.offsetWidth;section.classList.add('view')}});
    $$('.nav [data-view]').forEach(link=>{const active=link.dataset.view===view;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
    $('#breadcrumbTitle').textContent=view[0].toUpperCase()+view.slice(1);
    if(location.hash!==`#${view}`)history.replaceState(null,'',`#${view}`);
  }
  $$('.nav [data-view]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();showView(link.dataset.view)}));
  $$('[data-go]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();showView(link.dataset.go)}));
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='add-gallery')openGalleryDialog();
    if(action==='add-booking')addDemoBooking();
  });
  function addDemoBooking(){
    const services=window.FOTO_STAR_DATA.services;
    const service=services[Math.floor(Math.random()*services.length)];
    const dayOffset=3+Math.floor(Math.random()*12);
    const date=new Date();date.setDate(date.getDate()+dayOffset);
    const value=date.toISOString().slice(0,10);
    const times=['9:00 AM','10:30 AM','12:00 PM','1:30 PM','3:00 PM','4:30 PM','6:00 PM'];
    const dayNumber=Number(value.slice(-2)),weekday=date.getDay();
    const unavailable=new Set([(dayNumber+weekday)%times.length,(dayNumber*2+weekday+3)%times.length]);
    if(unavailable.size<2)unavailable.add((unavailable.values().next().value+1)%times.length);
    const availableTimes=times.filter((time,index)=>!unavailable.has(index));
    const booking={id:`FSN-${date.toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,createdAt:new Date().toISOString(),status:'pending-confirmation',source:'admin-demo',request:{service:service.booking,preferredDate:value,preferredTime:availableTimes[Math.floor(Math.random()*availableTimes.length)],client:{name:'Demo Client',phone:'+977 9800000100',email:''},location:{type:'Foto Star Nepal Studio',address:'Foto Star Nepal Studio — Kupondole / Pulchowk Main Road, Lalitpur'},requirements:'Demo booking created from the studio dashboard.'}};
    try{const records=readBookings();records.unshift(booking);saveBookings(records);render();toast(`Demo booking ${booking.id} added.`)}
    catch(error){console.error('Could not save the demo booking.',error);toast('Could not save the booking in browser storage.')}
  }
  const backdrop=$('#galleryDialogBackdrop'),galleryForm=$('#galleryForm');
  function openGalleryDialog(){backdrop.hidden=false;$('#galleryTitle').focus()}
  function closeGalleryDialog(){backdrop.hidden=true;galleryForm.reset();$('#galleryFormError').textContent=''}
  $$('[data-close-dialog]').forEach(button=>button.addEventListener('click',closeGalleryDialog));
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeGalleryDialog()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!backdrop.hidden)closeGalleryDialog()});
  galleryForm.addEventListener('submit',event=>{
    event.preventDefault();$('#galleryFormError').textContent='';
    const form=new FormData(galleryForm),image=String(form.get('image')).trim();
    if(!/^https?:\/\//i.test(image)){ $('#galleryFormError').textContent='Use a valid image URL starting with http or https.';return}
    const item={title:String(form.get('title')).trim(),category:String(form.get('category')).trim(),image,featured:form.get('featured')==='on',height:Number(form.get('height'))||540};
    if(!item.title||!item.category){$('#galleryFormError').textContent='Add a title and category to continue.';return}
    try{const items=allGallery();items.push(item);window.FOTO_STAR_DATA.saveGalleryItems(items);closeGalleryDialog();renderGallery();renderBookings();toast('Photo added to the public portfolio.')}
    catch(error){console.error('Could not save the gallery item.',error);$('#galleryFormError').textContent='Could not save this photo in browser storage.'}
  });
  $('#clearBookings').addEventListener('click',()=>{
    if(!readBookings().length){toast('There are no saved demo bookings to clear.');return}
    if(!confirm('Clear all demo booking records saved in this browser?'))return;
    try{localStorage.removeItem(BOOKINGS_KEY);render();toast('Saved demo bookings cleared.')}
    catch(error){console.error('Could not clear demo bookings.',error);toast('Could not clear browser storage.')}
  });
  $('#signOutButton').addEventListener('click',()=>{
    try{
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      window.location.replace('signin.html?role=staff');
    }catch(error){
      console.error('Could not clear the demo staff session.',error);
      toast('Could not sign out in this browser.');
    }
  });
  window.addEventListener('storage',event=>{
    if([BOOKINGS_KEY,window.FOTO_STAR_DATA.GALLERY_KEY].includes(event.key)||event.key===null)render()
  });
  $('#todayLabel').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
  render();
  showView(location.hash.slice(1)||'dashboard');
})();
