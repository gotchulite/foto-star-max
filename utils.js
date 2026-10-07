/* ---------------- WhatsApp deep links ---------------- */
const WA_NUMBER = '9779841000000';
function buildWaLink(msg){
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}
const DEMO_BOOKINGS_KEY = 'fsn_demo_bookings_v1';
function readDemoBookings(){
  const saved = localStorage.getItem(DEMO_BOOKINGS_KEY);
  const bookings = saved ? JSON.parse(saved) : [];
  if(!Array.isArray(bookings)) throw new Error('Saved demo inquiries are not in the expected format.');
  return bookings;
}
function saveDemoBooking(request, source){
  const bookings = readDemoBookings();
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  let reference;
  do{
    const token = Math.random().toString(36).slice(2,8).toUpperCase().padEnd(6,'0');
    reference = `FSN-${datePart}-${token}`;
  }while(bookings.some(booking => booking.id === reference));
  const booking = {
    id:reference,
    createdAt:now.toISOString(),
    status:'pending-confirmation',
    source,
    request
  };
  bookings.unshift(booking);
  localStorage.setItem(DEMO_BOOKINGS_KEY, JSON.stringify(bookings));
  return booking;
}
const defaultMsg = 'Hello Foto Star Nepal, I would like to inquire about a photography service.';
['waCta','waCta2','waCta3'].forEach(id => {
  document.getElementById(id).href = buildWaLink(defaultMsg);
});
