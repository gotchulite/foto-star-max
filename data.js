window.FOTO_STAR_DATA = (() => {
  const GALLERY_KEY = 'fsn_demo_gallery_v1';

  const gallery = [
    {category:'Weddings', title:'Wedding — Lalitpur', image:'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=900&auto=format&fit=crop', featured:true, height:520},
    {category:'Portraits', title:'Portrait — Studio', image:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=900&auto=format&fit=crop', featured:true, height:640},
    {category:'Cultural', title:'Pasni — Kathmandu', image:'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=900&auto=format&fit=crop', featured:false, height:400},
    {category:'Corporate', title:'Corporate Portrait — Lalitpur', image:'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=900&auto=format&fit=crop', featured:false, height:560},
    {category:'Weddings', title:'Reception — Patan', image:'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=900&auto=format&fit=crop', featured:false, height:460},
    {category:'Family', title:'Family Portrait — Studio', image:'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?q=80&w=900&auto=format&fit=crop', featured:false, height:600},
    {category:'Events', title:'Celebration — Lalitpur', image:'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=900&auto=format&fit=crop', featured:true, height:380},
    {category:'Portraits', title:'Model Portfolio — Studio', image:'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=900&auto=format&fit=crop', featured:false, height:700},
    {category:'Cultural', title:'Bratabandha — Lalitpur', image:'https://images.unsplash.com/photo-1600091166971-7f9faad6c1e2?q=80&w=900&auto=format&fit=crop', featured:false, height:500},
    {category:'Weddings', title:'Ceremony Detail — Lalitpur', image:'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=900&auto=format&fit=crop', featured:false, height:420},
    {category:'Corporate', title:'Team Profile — Kathmandu', image:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=900&auto=format&fit=crop', featured:true, height:560},
    {category:'Family', title:'Generations — Studio', image:'https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=900&auto=format&fit=crop', featured:false, height:640}
  ];

  const services = [
    {
      title:'Wedding & Reception',
      body:'Full-day coverage of the ceremony, candid moments and celebration.',
      forWho:'For couples and families.',
      booking:'Wedding / Reception',
      img:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title:'Cultural & Milestone Events',
      body:'Thoughtful coverage of family rituals, milestones and traditions.',
      forWho:'For families marking milestones.',
      booking:'Cultural Event',
      img:'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title:'Studio Portraits & Corporate Headshots',
      body:'Considered studio portraits for people, families and professional profiles.',
      forWho:'For professionals and individuals.',
      booking:'Corporate Headshot',
      img:'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title:'Passport & Visa Photos',
      body:'Official-format portraits prepared to the requirements you provide.',
      forWho:'For travel and official documents.',
      booking:'Passport / Visa Photo',
      img:'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title:'Custom Photo Framing & Canvas',
      body:'Custom frames and canvas prints, finished with care in the studio.',
      forWho:'For finished, framed keepsakes.',
      booking:'Photo Framing',
      img:'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title:'Photo Restoration & Digital Editing',
      body:'Repair, restore and retouch photographs worth keeping.',
      forWho:'For preserving family history.',
      booking:'Photo Restoration',
      img:'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?q=80&w=1000&auto=format&fit=crop'
    }
  ];

  function getGalleryItems(){
    try{
      const saved = localStorage.getItem(GALLERY_KEY);
      if(saved){
        const parsed = JSON.parse(saved);
        if(Array.isArray(parsed)){
          return parsed.filter(item=>
            item &&
            typeof item.title === 'string' &&
            typeof item.category === 'string' &&
            typeof item.image === 'string'
          );
        }
        console.error('Saved demo gallery is not an array; using the default gallery.');
      }
    }catch(error){
      console.error('Could not load the saved demo gallery; using the default gallery.', error);
    }
    return gallery.map(item=>({...item}));
  }

  function saveGalleryItems(items){
    if(!Array.isArray(items)) throw new TypeError('Gallery data must be an array.');
    localStorage.setItem(GALLERY_KEY,JSON.stringify(items));
  }

  return {gallery,services,GALLERY_KEY,getGalleryItems,saveGalleryItems};
})();
