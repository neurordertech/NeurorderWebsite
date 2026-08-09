const partners={general:{name:'Community partners',focus:'A national framework for responsible healthcare education and community outreach.',tags:['Health literacy','Community outreach','Digital enablement'],strip:'Community Health Partner'},cureday:{name:'Cure Day Hospitals',focus:'A proposed collaboration supporting community wellness, patient education and digitally enabled outreach in the Western Cape.',tags:['Community wellness','Patient education','Western Cape'],strip:'Cure Day Hospitals'},nitefalls:{name:'Nitefalls Medical',focus:'A cross-provincial opportunity connecting Gauteng medical expertise with Western Cape community visibility and shared public-health learning.',tags:['Gauteng','Cross-provincial reach','Brand visibility'],strip:'Nitefalls Medical'},observatory:{name:'Observatory Library',focus:'A proposal to strengthen the library as a community knowledge hub for accessible healthcare information and public programmes.',tags:['Health literacy','Community knowledge hub','Public access'],strip:'Observatory Library'}};
const key=new URLSearchParams(location.search).get('partner')||'general',p=partners[key]||partners.general;
const set=(id,text)=>{const e=document.getElementById(id);if(e)e.textContent=text};set('partner-name',p.name);set('partner-focus',p.focus);set('partner-strip',p.strip);const tags=document.getElementById('partner-tags');if(tags)tags.innerHTML=p.tags.map(t=>`<span>${t}</span>`).join('');
const toggle=document.querySelector('.menu-toggle'),nav=document.getElementById('primary-nav');if(toggle&&nav)toggle.onclick=()=>nav.classList.toggle('open');


// Preserve the personalised organisation view across the CHKI portal.
(() => {
  const params = new URLSearchParams(window.location.search);
  const partner = params.get('partner');
  if (!partner) return;

  document.querySelectorAll('a[href]').forEach(link => {
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('http')) return;
    try {
      const url = new URL(raw, window.location.href);
      if (url.origin !== window.location.origin && window.location.protocol !== 'file:') return;
      url.searchParams.set('partner', partner);
      link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
      if (link.hasAttribute('data-partner-access')) {
        link.setAttribute('href', `../../partner-discussion.html?programme=chki&partner=${encodeURIComponent(partner)}`);
      }
    } catch (_) {}
  });
})();
