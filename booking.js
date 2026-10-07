/* ---------------- Booking flow -> WhatsApp ---------------- */
const bookingForm = document.getElementById('bookingForm');
const bookingSteps = [...bookingForm.querySelectorAll('.booking-step')];
const bookingProgress = document.getElementById('bookingProgressTrack');
const bookingStepCount = document.getElementById('bookingStepCount');
const bookingStepName = document.getElementById('bookingStepName');
const bookingStepError = document.getElementById('bookingStepError');
const bookingNext = document.getElementById('bookingNext');
const bookingBack = document.getElementById('bookingBack');
const bookingServiceSelect = document.getElementById('fservice');
const bookingStepNames = ['Choose a service','Choose a date','Choose a time','Your details','Shoot location','Review'];
const bookingDate = document.getElementById('fdate');
const bookingTime = document.getElementById('ftime');
const bookingTimeSlots = document.getElementById('bookingTimeSlots');
const bookingTimeDate = document.getElementById('bookingTimeDate');
const localToday = new Date();
bookingDate.min = `${localToday.getFullYear()}-${String(localToday.getMonth()+1).padStart(2,'0')}-${String(localToday.getDate()).padStart(2,'0')}`;
let currentBookingStep = 1;
const bookingTimeOptions = ['9:00 AM','10:30 AM','12:00 PM','1:30 PM','3:00 PM','4:30 PM','6:00 PM'];

function syncBookingServiceChoice(){
  const selectedService = bookingServiceSelect.value;
  bookingForm.querySelectorAll('input[name="bookingServiceChoice"]').forEach(input => {
    input.checked = input.value === selectedService;
    input.closest('.booking-service-card').classList.toggle('selected', input.checked);
  });
}
bookingServiceSelect.addEventListener('change', syncBookingServiceChoice);
bookingForm.querySelectorAll('input[name="bookingServiceChoice"]').forEach(input => {
  input.addEventListener('change', () => {
    bookingServiceSelect.value = input.value;
    bookingServiceSelect.dispatchEvent(new Event('change', {bubbles:true}));
    clearBookingError();
  });
});
syncBookingServiceChoice();

function clearBookingError(){
  bookingStepError.hidden = true;
  bookingStepError.textContent = '';
}
function setBookingError(message){
  bookingStepError.textContent = message;
  bookingStepError.hidden = false;
}
function renderBookingTimeSlots(){
  bookingTimeSlots.replaceChildren();
  bookingTimeDate.textContent = bookingDate.value
    ? `Times for ${formatBookingDate(bookingDate.value)}`
    : 'Select a date to see available times.';
  bookingDate.dataset.renderedDate = bookingDate.value;
  if(!bookingDate.value) return;
  let bookings;
  try{
    bookings = readDemoBookings();
  }catch(error){
    console.error('Could not load demo booking availability from this browser.', error);
    if(currentBookingStep === 3) setBookingError('Demo availability could not be loaded. Check this browser’s storage and try again.');
    return;
  }
  const date = new Date(`${bookingDate.value}T12:00:00`);
  const dayNumber = Number(bookingDate.value.slice(-2));
  const simulatedUnavailable = new Set([
    (dayNumber + date.getDay()) % bookingTimeOptions.length,
    (dayNumber * 2 + date.getDay() + 3) % bookingTimeOptions.length
  ]);
  if(simulatedUnavailable.size < 2){
    simulatedUnavailable.add((simulatedUnavailable.values().next().value + 1) % bookingTimeOptions.length);
  }
  bookingTimeOptions.forEach((time,index)=>{
    const isBooked = bookings.some(booking =>
      booking.request?.preferredDate === bookingDate.value &&
      booking.request?.preferredTime === time
    );
    const available = !isBooked && !simulatedUnavailable.has(index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'booking-time-slot';
    button.dataset.time = time;
    button.disabled = !available;
    button.setAttribute('aria-pressed',String(bookingTime.value === time));
    button.setAttribute('aria-label',`${time}, ${isBooked ? 'booked' : available ? 'available' : 'unavailable'}`);
    const label = document.createElement('span');
    label.className = 'booking-time-label';
    label.textContent = time;
    const status = document.createElement('span');
    status.className = 'booking-time-status';
    status.textContent = isBooked ? 'Booked' : available ? 'Available' : 'Unavailable';
    button.append(label,status);
    bookingTimeSlots.appendChild(button);
  });
}
function updateBookingProgress(){
  bookingStepCount.innerHTML = `${String(currentBookingStep).padStart(2,'0')} <span>/ ${String(bookingSteps.length).padStart(2,'0')}</span>`;
  bookingStepName.textContent = bookingStepNames[currentBookingStep-1];
  [...bookingProgress.children].forEach((bar,index)=>bar.classList.toggle('complete',index<currentBookingStep));
  bookingBack.disabled = currentBookingStep === 1;
  bookingNext.type = 'button';
  bookingNext.innerHTML = currentBookingStep === bookingSteps.length
    ? 'Confirm request <span aria-hidden="true">→</span>'
    : 'Continue <span aria-hidden="true">→</span>';
  document.getElementById('bookingFooterNote').textContent = currentBookingStep === bookingSteps.length ? 'No payment required' : 'No payment required';
}
function goToBookingStep(step){
  currentBookingStep = Math.min(bookingSteps.length,Math.max(1,step));
  bookingSteps.forEach((panel,index)=>{
    const active = index+1 === currentBookingStep;
    panel.hidden = !active;
    panel.classList.toggle('active',active);
  });
  clearBookingError();
  updateBookingProgress();
  if(currentBookingStep === 3) renderBookingTimeSlots();
  if(currentBookingStep === bookingSteps.length) renderBookingSummary();
  const heading = bookingSteps[currentBookingStep-1].querySelector('h3');
  if(heading){
    heading.tabIndex = -1;
    requestAnimationFrame(()=>heading.focus({preventScroll:true}));
  }
}
function validateBookingStep(){
  clearBookingError();
  const panel = bookingSteps[currentBookingStep-1];
  if(currentBookingStep === 1 && !bookingForm.querySelector('input[name="bookingServiceChoice"]:checked')){
    setBookingError('Choose a service to continue.');
    bookingForm.querySelector('input[name="bookingServiceChoice"]').focus();
    return false;
  }
  if(currentBookingStep === 3 && !bookingTime.value){
    setBookingError('Choose an available time to continue.');
    bookingTimeSlots.querySelector('.booking-time-slot:not(:disabled)')?.focus();
    return false;
  }
  if(currentBookingStep === 5){
    const locationType = bookingForm.querySelector('input[name="bookingLocation"]:checked');
    if(!locationType){
      setBookingError('Choose where the shoot will take place.');
      bookingForm.querySelector('input[name="bookingLocation"]').focus();
      return false;
    }
    if(locationType.value === 'On location' && !document.getElementById('flocation').value.trim()){
      const address = document.getElementById('flocation');
      address.setCustomValidity('Please add the venue or address.');
      address.reportValidity();
      address.focus();
      setBookingError('Add the venue or address to continue.');
      return false;
    }
  }
  const invalid = [...panel.querySelectorAll('input,select,textarea')]
    .filter(control => control.required || control.value)
    .find(control => !control.checkValidity());
  if(invalid){
    invalid.reportValidity();
    invalid.focus();
    setBookingError('Please complete the required field to continue.');
    return false;
  }
  if(currentBookingStep === 4 && !document.getElementById('fname').value.trim()){
    document.getElementById('fname').setCustomValidity('Please enter your name.');
    document.getElementById('fname').reportValidity();
    document.getElementById('fname').focus();
    setBookingError('Please enter your name to continue.');
    return false;
  }
  if(currentBookingStep === 4){
    const phone = document.getElementById('fphone');
    const phoneValue = phone.value.trim();
    if(!/^[0-9+().\s-]{7,20}$/.test(phoneValue) || phoneValue.replace(/\D/g,'').length < 7){
      phone.setCustomValidity('Enter a valid phone number with at least 7 digits.');
      phone.reportValidity();
      phone.focus();
      setBookingError('Please enter a valid phone number to continue.');
      return false;
    }
  }
  return true;
}
bookingForm.addEventListener('input', e => {
  if(e.target.matches('input,textarea')) e.target.setCustomValidity('');
  if(e.target.closest('.booking-step-error')) clearBookingError();
  if(currentBookingStep === bookingSteps.length) renderBookingSummary();
});
bookingForm.addEventListener('change', e => {
  if(e.target.name === 'bookingLocation'){
    const atLocation = e.target.value === 'On location';
    const addressField = document.getElementById('bookingAddressField');
    const address = document.getElementById('flocation');
    addressField.hidden = !atLocation;
    address.required = atLocation;
    address.setCustomValidity('');
    document.getElementById('bookingLocationNote').textContent = atLocation
      ? 'Add a venue or area so we can plan travel and coverage.'
      : e.target.value === 'Foto Star Nepal Studio'
        ? 'Studio: Kupondole / Pulchowk Main Road, Lalitpur.'
        : 'We can confirm the location together after your inquiry.';
  }
  if(e.target === bookingDate){
    bookingTime.value = '';
    renderBookingTimeSlots();
  }
  if(e.target.matches('input,select,textarea')) clearBookingError();
  if(currentBookingStep === bookingSteps.length) renderBookingSummary();
});
bookingTimeSlots.addEventListener('click',e=>{
  const slot = e.target.closest('.booking-time-slot');
  if(!slot || slot.disabled) return;
  bookingTime.value = slot.dataset.time;
  bookingTimeSlots.querySelectorAll('.booking-time-slot').forEach(button => {
    button.setAttribute('aria-pressed',String(button === slot));
  });
  clearBookingError();
  if(currentBookingStep === bookingSteps.length) renderBookingSummary();
});
bookingDate.addEventListener('input',()=>{
  if(bookingDate.value !== bookingDate.dataset.renderedDate){
    bookingTime.value = '';
    renderBookingTimeSlots();
  }
});
bookingNext.addEventListener('click',e => {
  e.preventDefault();
  if(!validateBookingStep()) return;
  if(currentBookingStep < bookingSteps.length) goToBookingStep(currentBookingStep+1);
  else bookingForm.requestSubmit();
});
bookingBack.addEventListener('click', () => goToBookingStep(currentBookingStep-1));

function createBookingRequest(){
  const locationType = bookingForm.querySelector('input[name="bookingLocation"]:checked')?.value || '';
  const address = document.getElementById('flocation').value.trim();
  const location = locationType === 'Foto Star Nepal Studio'
    ? 'Foto Star Nepal Studio — Kupondole / Pulchowk Main Road, Lalitpur'
    : locationType === 'On location'
      ? address
      : 'To be confirmed';
  return {
    service: bookingServiceSelect.value,
    preferredDate: bookingDate.value,
    preferredTime: document.getElementById('ftime').value,
    client: {
      name: document.getElementById('fname').value.trim(),
      phone: document.getElementById('fphone').value.trim(),
      email: document.getElementById('femail').value.trim()
    },
    location: {type:locationType, address:location},
    requirements: document.getElementById('fmsg').value.trim()
  };
}
function formatBookingDate(value){
  if(!value) return 'Not specified';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
}
function renderBookingSummary(targetId='bookingSummary',editable=true){
  const request = createBookingRequest();
  const rows = [
    ['Service',request.service,1],
    ['Date',formatBookingDate(request.preferredDate),2],
    ['Time',request.preferredTime,3],
    ['Name',request.client.name,4],
    ['Phone',request.client.phone,4],
    ...(request.client.email ? [['Email',request.client.email,4]] : []),
    ['Location',request.location.address,5],
    ['Notes',request.requirements || 'None provided',4]
  ];
  const summary = document.getElementById(targetId);
  summary.replaceChildren();
  rows.forEach(([label,value,step])=>{
    const row = document.createElement('div');
    row.className = 'booking-summary-row';
    const rowLabel = document.createElement('span');
    rowLabel.className = 'booking-summary-label';
    rowLabel.textContent = label;
    const rowValue = document.createElement('span');
    rowValue.className = 'booking-summary-value';
    rowValue.textContent = value;
    row.append(rowLabel,rowValue);
    if(editable){
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'booking-summary-edit';
      edit.textContent = 'Edit';
      edit.setAttribute('aria-label',`Edit ${label.toLowerCase()}`);
      edit.dataset.editBookingStep = step;
      row.appendChild(edit);
    }
    summary.appendChild(row);
  });
}
document.getElementById('bookingSummary').addEventListener('click',e=>{
  const edit = e.target.closest('[data-edit-booking-step]');
  if(edit) goToBookingStep(Number(edit.dataset.editBookingStep));
});
let lastBookingRequest = null;
function createBookingWhatsAppMessage(request){
  return `📸 New Photography Booking Inquiry — Foto Star Nepal
👤 Client: ${request.client.name}
📞 Phone: ${request.client.phone}
✉️ Email: ${request.client.email || 'Not provided'}
🎯 Service: ${request.service}
📅 Preferred date: ${formatBookingDate(request.preferredDate)}
🕒 Preferred time: ${request.preferredTime}
📍 Location: ${request.location.address}
📝 Requirements: ${request.requirements || 'None provided'}`;
}
bookingForm.addEventListener('submit',e=>{
  e.preventDefault();
  if(currentBookingStep < bookingSteps.length){
    if(validateBookingStep()) goToBookingStep(currentBookingStep+1);
    return;
  }
  if(!validateBookingStep()) return;
  lastBookingRequest = createBookingRequest();
  let savedBooking = null;
  let saveError = null;
  try{
    savedBooking = saveDemoBooking(lastBookingRequest, 'multi-step-form');
  }catch(error){
    saveError = error;
    console.error('Could not save the demo inquiry in this browser.', error);
  }
  const whatsappMessage = `${createBookingWhatsAppMessage(lastBookingRequest)}${savedBooking ? `\n🔖 Demo reference: ${savedBooking.id}` : ''}`;
  document.getElementById('bookingWhatsAppFallback').href = buildWaLink(whatsappMessage);
  document.getElementById('bookingReference').textContent = savedBooking?.id || 'Not saved';
  document.getElementById('bookingSuccessTitle').textContent = savedBooking ? 'Your request is on its way.' : 'Your request is ready.';
  document.getElementById('bookingConfirmationNote').textContent = savedBooking
    ? 'Your demo request is saved on this device. This is not a confirmed appointment; the studio will confirm availability with you.'
    : `We couldn’t save this request in this browser (${saveError instanceof Error ? saveError.message : String(saveError)}). You can still send your details to the studio via WhatsApp.`;
  renderBookingSummary('bookingSuccessSummary',false);
  document.getElementById('bookingFormContent').hidden = true;
  document.getElementById('bookingFormFooter').hidden = true;
  document.getElementById('bookingPrivacyNote').hidden = true;
  document.getElementById('bookingProgressTrack').parentElement.hidden = true;
  document.getElementById('bookingStepError').hidden = true;
  document.getElementById('bookingConfirmation').hidden = false;
  document.getElementById('bookingSuccessTitle').focus({preventScroll:true});
});
document.getElementById('bookingRestart').addEventListener('click',()=>{
  bookingForm.reset();
  bookingServiceSelect.value = '';
  bookingServiceSelect.dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('bookingAddressField').hidden = true;
  document.getElementById('flocation').required = false;
  document.getElementById('bookingLocationNote').textContent = 'Studio: Kupondole / Pulchowk Main Road, Lalitpur.';
  document.getElementById('bookingConfirmation').hidden = true;
  document.getElementById('bookingFormContent').hidden = false;
  document.getElementById('bookingFormFooter').hidden = false;
  document.getElementById('bookingPrivacyNote').hidden = false;
  document.getElementById('bookingProgressTrack').parentElement.hidden = false;
  lastBookingRequest = null;
  goToBookingStep(1);
});
goToBookingStep(1);



/* ---------------- Glass booking modal ---------------- */
const bookingModal = document.getElementById('bookingModal');
function openModal(){
  document.getElementById('modalFormStatus').textContent = 'This opens WhatsApp with your details pre-filled. Demo inquiries are saved only in this browser; clear this site’s browser data to remove them.';
  bookingModal.classList.add('open');
  bookingModal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeModal(){ bookingModal.classList.remove('open'); bookingModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
document.getElementById('navBookBtn').addEventListener('click', e => { e.preventDefault(); openModal(); });
document.getElementById('floatCta').addEventListener('click', e => { e.preventDefault(); openModal(); });
document.getElementById('mobileBookCta').addEventListener('click', e => { e.preventDefault(); openModal(); });
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBg').addEventListener('click', closeModal);
window.addEventListener('keydown', e => { if(e.key==='Escape' && bookingModal.classList.contains('open')) closeModal(); });

document.getElementById('modalForm').addEventListener('submit', function(e){
  e.preventDefault();
  const name = document.getElementById('mfname').value.trim();
  const phone = document.getElementById('mfphone').value.trim();
  const service = document.getElementById('mfservice').value;
  const date = document.getElementById('mfdate').value;
  const location = document.getElementById('mflocation').value.trim();
  const msg = document.getElementById('mfmsg').value.trim();
  let savedBooking = null;
  let saveError = null;
  try{
    savedBooking = saveDemoBooking({
      service,
      preferredDate:date,
      preferredTime:'Not specified',
      client:{name,phone,email:''},
      location:{type:location ? 'On location' : 'To be confirmed',address:location || 'Not specified'},
      requirements:msg
    }, 'quick-booking-modal');
  }catch(error){
    saveError = error;
    console.error('Could not save the demo inquiry in this browser.', error);
  }
  const waMsg = `📸 New Photography Booking Request — Foto Star Nepal
👤 Client Name: ${name}
📞 Contact Number: ${phone}
🎯 Service Needed: ${service}
📅 Event Date: ${date || 'Not specified'}
📍 Location/Venue: ${location || 'Not specified'}
⏰ Estimated Duration: Not specified
📝 Special Requirements: ${msg || 'None'}`;
  window.open(buildWaLink(waMsg), '_blank');
  if(saveError){
    document.getElementById('modalFormStatus').textContent = `This demo inquiry could not be saved in this browser (${saveError instanceof Error ? saveError.message : String(saveError)}). You can still send the WhatsApp message.`;
    return;
  }
  document.getElementById('modalFormStatus').textContent = `Demo inquiry ${savedBooking.id} saved in this browser only.`;
  closeModal();
  this.reset();
});
