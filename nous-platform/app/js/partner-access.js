
(() => {
  const config = window.NOUS_SUPABASE_CONFIG;
  const params = new URLSearchParams(window.location.search);
  const partner = params.get('partner') || 'general';
  const publicUrl = `./community/chki-executive-briefing-v3/index.html?partner=${encodeURIComponent(partner)}`;
  ['back-to-chki','public-portal-link','pending-public-link'].forEach(id=>{const e=document.getElementById(id);if(e)e.href=publicUrl});

  const states=['loading-state','signed-out-state','pending-state','workspace-state'];
  const show=id=>states.forEach(s=>document.getElementById(s)?.classList.toggle('hidden',s!==id));
  if (!config?.url || !config?.publishableKey || !window.supabase) { show('pending-state'); return; }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  async function check(){
    try{
      const {data:{session}}=await client.auth.getSession();
      if(!session){show('signed-out-state');return}
      const {data,error}=await client.rpc('get_my_programme_access',{requested_programme:'chki'});
      if(error || !data || data.length===0){
        const email=session.user.email||'';
        document.getElementById('pending-copy').textContent=`${email} is signed in, but no active CHKI partner organisation is linked to this account yet.`;
        const request=document.getElementById('request-access');
        request.href=`mailto:partnerships@neurorder.com?subject=${encodeURIComponent('CHKI Partner Access Request')}&body=${encodeURIComponent('Please verify CHKI access for '+email+'. Organisation: ')}`;
        show('pending-state');return;
      }
      document.getElementById('organisation-name').textContent=data[0].organisation_name;
      show('workspace-state');
    }catch(e){show('pending-state')}
  }
  document.getElementById('sign-out')?.addEventListener('click',async()=>{await client.auth.signOut();show('signed-out-state')});
  check();
})();
