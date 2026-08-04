
const data={health:{title:'Verified health knowledge',copy:'Clinical partners guide the information, professional boundaries and referral pathways presented to the public.'},community:{title:'Community access',copy:'Libraries, schools, volunteers and outreach programmes create trusted places where people can engage with information.'},technology:{title:'Responsible technology',copy:'NEURORDER provides the interface, programme pages, registration systems and future interactive learning environments.'}};
document.querySelectorAll('.impact-node').forEach(node=>node.addEventListener('click',()=>{document.querySelectorAll('.impact-node').forEach(n=>n.classList.remove('active'));node.classList.add('active');const d=data[node.dataset.node];document.getElementById('node-detail').innerHTML=`<span>ACTIVE NODE</span><h3>${d.title}</h3><p>${d.copy}</p>`;}));
const space=document.getElementById('node-space');if(space){let down=false,startX=0,startY=0,rx=0,ry=0;space.addEventListener('pointerdown',e=>{down=true;startX=e.clientX;startY=e.clientY;space.setPointerCapture(e.pointerId)});space.addEventListener('pointermove',e=>{if(!down)return;ry+=(e.clientX-startX)*.03;rx-=(e.clientY-startY)*.03;startX=e.clientX;startY=e.clientY;space.querySelectorAll('.impact-node,.orbit-line').forEach(el=>el.style.filter=`hue-rotate(${ry}deg)`)});space.addEventListener('pointerup',()=>down=false)}

// CHKI MEDICAL UNIVERSE

(() => {
  const shell=document.querySelector(".universe-shell"),canvas=document.getElementById("universe-canvas"),layer=document.getElementById("galaxy-layer");
  if(!shell||!canvas||!layer)return;
  const ctx=canvas.getContext("2d"),dpr=Math.min(window.devicePixelRatio||1,2);
  let width=0,height=0,stars=[];
  const state={x:0,y:0,scale:1,dragging:false,startX:0,startY:0,originX:0,originY:0};
  const worlds={
    cardiology:{title:"Cardiology",description:"The study and treatment of the heart and blood vessels.",a:"#ff566f",b:"#5b1028"},
    neurology:{title:"Neurology",description:"The study and treatment of the brain, spinal cord and nervous system.",a:"#9f7cff",b:"#2d246b"},
    oncology:{title:"Oncology",description:"The diagnosis, research and treatment of cancer.",a:"#4bd7ff",b:"#124f76"},
    pediatrics:{title:"Pediatrics",description:"Medical care for infants, children and adolescents.",a:"#ffc76d",b:"#805119"},
    psychiatry:{title:"Psychiatry",description:"The diagnosis and treatment of mental health and behavioural disorders.",a:"#72e4c0",b:"#155e55"},
    surgery:{title:"Surgery",description:"The use of operative procedures to diagnose, treat and support recovery.",a:"#e8efff",b:"#536585"}
  };
  function resize(){const r=shell.getBoundingClientRect();width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;ctx.setTransform(dpr,0,0,dpr,0,0);const n=Math.max(160,Math.floor(width*height/3800));stars=Array.from({length:n},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.4+.2,a:Math.random()*.65+.15,d:Math.random()*.65+.25}))}
  function draw(){ctx.clearRect(0,0,width,height);for(const s of stars){const px=((s.x+state.x*s.d)%width+width)%width,py=((s.y+state.y*s.d)%height+height)%height;ctx.beginPath();ctx.fillStyle=`rgba(255,255,255,${s.a})`;ctx.arc(px,py,s.r*state.scale,0,Math.PI*2);ctx.fill()}requestAnimationFrame(draw)}
  function apply(){layer.style.transform=`translate(${state.x}px,${state.y}px) scale(${state.scale})`;const h=document.getElementById("hud-coordinates");if(h)h.textContent=`X ${Math.round(state.x)} · Y ${Math.round(state.y)} · Z ${state.scale.toFixed(2)}`}
  shell.addEventListener("pointerdown",e=>{if(e.target.closest(".medical-galaxy"))return;state.dragging=true;state.startX=e.clientX;state.startY=e.clientY;state.originX=state.x;state.originY=state.y;shell.setPointerCapture(e.pointerId)});
  shell.addEventListener("pointermove",e=>{if(!state.dragging)return;state.x=state.originX+(e.clientX-state.startX);state.y=state.originY+(e.clientY-state.startY);apply()});
  shell.addEventListener("pointerup",()=>state.dragging=false);shell.addEventListener("pointercancel",()=>state.dragging=false);
  shell.addEventListener("wheel",e=>{e.preventDefault();state.scale=Math.min(1.8,Math.max(.65,state.scale+(e.deltaY>0?-.08:.08)));apply()},{passive:false});
  document.getElementById("recenter-universe")?.addEventListener("click",()=>{state.x=0;state.y=0;state.scale=1;apply()});
  const dialog=document.getElementById("world-dialog"),title=document.getElementById("world-title"),description=document.getElementById("world-description"),orb=document.getElementById("world-orb");
  document.querySelectorAll(".medical-galaxy").forEach(b=>b.addEventListener("click",()=>{const w=worlds[b.dataset.world];if(!w||!dialog)return;title.textContent=w.title;description.textContent=w.description;orb.style.setProperty("--world-a",w.a);orb.style.setProperty("--world-b",w.b);dialog.showModal()}));
  document.getElementById("close-world")?.addEventListener("click",()=>dialog.close());
  dialog?.addEventListener("click",e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});
  resize();apply();draw();window.addEventListener("resize",resize);
})();

// =========================================================
// IMPACT PAGE — FULL-SCREEN MEDICAL VOID
// =========================================================
(() => {
  const stage=document.getElementById('medical-void');
  const canvas=document.getElementById('void-stars');
  const world=document.getElementById('void-world');
  if(!stage||!canvas||!world)return;

  const ctx=canvas.getContext('2d');
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const state={x:0,y:0,scale:1,drag:false,sx:0,sy:0,ox:0,oy:0};
  let width=0,height=0,stars=[];

  const medicalWorlds={
    cardiology:['Cardiology','The study and treatment of the heart and blood vessels.'],
    neurology:['Neurology','The study and treatment of the nervous system, spinal cord and brain.'],
    oncology:['Oncology','The diagnosis, research and treatment of cancer.'],
    pediatrics:['Pediatrics','Medical care for infants, children and adolescents.'],
    psychiatry:['Psychiatry','The diagnosis and treatment of mental health and behavioural disorders.'],
    surgery:['Surgery','The use of operative procedures to diagnose, treat and support recovery.']
  };

  function resize(){
    width=stage.clientWidth;height=stage.clientHeight;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    stars=Array.from({length:Math.max(220,Math.floor(width*height/3100))},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.5+.15,a:Math.random()*.65+.15,d:Math.random()*.7+.15,t:Math.random()*Math.PI*2}));
  }
  function render(time=0){
    ctx.clearRect(0,0,width,height);
    for(const s of stars){
      const x=((s.x+state.x*s.d)%width+width)%width;
      const y=((s.y+state.y*s.d)%height+height)%height;
      const alpha=s.a*(.72+.28*Math.sin(time*.0012+s.t));
      ctx.beginPath();ctx.fillStyle=`rgba(255,255,255,${alpha})`;ctx.arc(x,y,s.r*state.scale,0,Math.PI*2);ctx.fill();
    }
    requestAnimationFrame(render);
  }
  function apply(){world.style.transform=`translate3d(${state.x}px,${state.y}px,0) scale(${state.scale})`}

  stage.addEventListener('pointerdown',e=>{if(e.target.closest('.void-galaxy,.void-home,.void-reset'))return;state.drag=true;state.sx=e.clientX;state.sy=e.clientY;state.ox=state.x;state.oy=state.y;stage.setPointerCapture(e.pointerId)});
  stage.addEventListener('pointermove',e=>{if(!state.drag)return;state.x=state.ox+e.clientX-state.sx;state.y=state.oy+e.clientY-state.sy;apply()});
  stage.addEventListener('pointerup',()=>state.drag=false);stage.addEventListener('pointercancel',()=>state.drag=false);
  stage.addEventListener('wheel',e=>{e.preventDefault();state.scale=Math.max(.55,Math.min(2.25,state.scale+(e.deltaY>0?-.08:.08)));apply()},{passive:false});
  document.getElementById('void-reset')?.addEventListener('click',()=>{state.x=0;state.y=0;state.scale=1;apply()});

  const dialog=document.getElementById('void-dialog');
  document.querySelectorAll('.void-galaxy').forEach(g=>g.addEventListener('click',()=>{const data=medicalWorlds[g.dataset.world];if(!data)return;document.getElementById('void-dialog-title').textContent=data[0];document.getElementById('void-dialog-description').textContent=data[1];dialog.showModal()}));
  document.getElementById('void-dialog-close')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});

  resize();apply();render();window.addEventListener('resize',resize);
  setTimeout(()=>{const hint=document.querySelector('.void-hint');if(hint)hint.style.opacity='.12'},5000);
})();
