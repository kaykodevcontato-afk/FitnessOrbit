'use strict';
const KEY='fitness-orbit-v1',today=()=>new Date().toLocaleDateString('sv-SE'),now=()=>new Date().toISOString(),uid=()=>String(Date.now())+Math.random().toString(36).slice(2,7);
const defaultMusicCategories=[
  {id:'pesado',name:'Treino pesado',subtitle:'Musculação • Hip-hop • Eletrônica',icon:'♜'},
  {id:'cardio',name:'Corrida e cardio',subtitle:'Energia • Dance • EDM',icon:'ϟ'},
  {id:'foco',name:'Foco e concentração',subtitle:'Instrumental • Lo-fi',icon:'◎'},
  {id:'personalizada',name:'Playlist personalizada',subtitle:'Músicas escolhidas por você',icon:'☷'}
];
const initial={profile:{name:'',age:'',gender:'',height:'',weight:'',goal:'saude',body:'',water:2000,reminder:60},water:{},workouts:[],history:[],activities:[],measures:[],music:[],musicCategories:structuredClone(defaultMusicCategories),settings:{theme:'azul',light:false,notify:false}};
let data;
try{const stored=JSON.parse(localStorage.getItem(KEY));data=stored&&typeof stored==='object'?{...structuredClone(initial),...stored}:structuredClone(initial)}catch{data=structuredClone(initial)}
const $=id=>document.getElementById(id),all=s=>document.querySelectorAll(s),save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{toast('Não foi possível salvar. Verifique o espaço do navegador.')}};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(s){$('toast').textContent=s;$('toast').classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.add('hidden'),3600)}
const n=(v,d=0)=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const titles={inicio:'Seu movimento começa aqui.',treinos:'Treino é constância.',alimentacao:'Alimente seu objetivo.',atividade:'Lá fora, o mundo é pista.',evolucao:'Cada conquista conta.',musica:'Entre no seu ritmo.',perfil:'Seu espaço, suas regras.'};
function page(p){all('.sections>section').forEach(e=>e.classList.toggle('active',e.id===p));all('.nav').forEach(e=>e.classList.toggle('on',e.dataset.page===p));$('pageTitle').textContent=titles[p];window.scrollTo({top:0,behavior:'smooth'});render()}
all('[data-page]').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));
all('[data-go]').forEach(b=>b.addEventListener('click',()=>page(b.dataset.go)));
function theme(){data.settings={...initial.settings,...data.settings};if(!['azul','rosa','roxo','vermelho'].includes(data.settings.theme))data.settings.theme='azul';document.body.dataset.theme=data.settings.theme;document.body.classList.toggle('light',!!data.settings.light);all('[data-theme-choice]').forEach(b=>{const active=b.dataset.themeChoice===data.settings.theme;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});all('[data-mode-choice]').forEach(b=>{const active=(b.dataset.modeChoice==='light')===!!data.settings.light;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.body).getPropertyValue('--bg').trim()}
all('[data-theme-choice]').forEach(b=>b.onclick=()=>{data.settings.theme=b.dataset.themeChoice;save();theme()});
all('[data-mode-choice]').forEach(b=>b.onclick=()=>{data.settings.light=b.dataset.modeChoice==='light';save();theme()});
function water(){let cur=Number(data.water[today()]||0),target=Number(data.profile.water||2000),pct=Math.max(0,Math.round(cur/target*100));$('waterNow').textContent=n(cur)+' ml';$('waterTarget').textContent='Meta '+n(target)+' ml';$('waterBadge').textContent=pct+'%';$('waterCircle').style.setProperty('--p',Math.min(100,pct)+'%')}
all('[data-water]').forEach(b=>b.onclick=()=>{data.water[today()]=Number(data.water[today()]||0)+Number(b.dataset.water);save();water()});
$('resetWater').onclick=()=>{if(confirm('Zerar água registrada hoje?')){data.water[today()]=0;save();water()}};
const days=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
function renderHome(){water();$('statWorkouts').textContent=data.history.length;$('statWeight').textContent=data.profile.weight?n(data.profile.weight,1):'—';$('statKm').textContent=n(data.activities.reduce((a,v)=>a+(Number(v.km)||0),0),1);let upcoming=data.workouts[0];$('nextWorkout').innerHTML=upcoming?`<b>${esc(upcoming.name)}</b><p class="muted">${esc(upcoming.day)} · ${esc(upcoming.type)} · ${n(upcoming.minutes)} min</p><div class="notice">${esc(upcoming.exercises).replace(/\n/g,'<br>')}</div>`:'Cadastre seu primeiro treino.';let current=new Date().getDay();$('weekStrip').innerHTML=days.slice(1).concat(days[0]).map((d,i)=>`<div class="day" style="${((i+1)%7)===current?'outline:2px solid var(--accent)':''}">${d.slice(0,3)}<b>${data.workouts.filter(w=>w.day===d).length?'●':'–'}</b></div>`).join('')}

// Cronômetro de ritmo de treino (bip + iluminação verde) e descanso (iluminação laranja)
let timerAudioCtx=null;
const timerState={phase:'idle',running:false,currentSet:1,remaining:40,elapsed:0,interval:null,workoutTitle:''};
function ensureTimerAudio(){
  if(!timerAudioCtx){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(AC)timerAudioCtx=new AC();
  }
  if(timerAudioCtx&&timerAudioCtx.state==='suspended')timerAudioCtx.resume().catch(()=>{});
}
function flashTimerBeep(){
  const card=$('workoutTimerCard');
  card.classList.add('beep-flash');
  clearTimeout(flashTimerBeep.t);
  flashTimerBeep.t=setTimeout(()=>card.classList.remove('beep-flash'),160);
}
function playBeepTone(freq,durationMs,delaySec=0,type='sine',gainVal=0.24){
  if($('timerBeepMode').value==='off')return;
  ensureTimerAudio();
  if(!timerAudioCtx)return;
  try{
    const t=timerAudioCtx.currentTime+delaySec;
    const osc=timerAudioCtx.createOscillator();
    const gain=timerAudioCtx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(freq,t);
    gain.gain.setValueAtTime(0.001,t);
    gain.gain.exponentialRampToValueAtTime(gainVal,t+0.01);
    gain.gain.exponentialRampToValueAtTime(0.001,t+durationMs/1000);
    osc.connect(gain);
    gain.connect(timerAudioCtx.destination);
    osc.start(t);
    osc.stop(t+durationMs/1000+0.02);
  }catch{}
}
function beepStartWork(){playBeepTone(988,110,0,'triangle',0.26);playBeepTone(1318,160,0.13,'triangle',0.28);flashTimerBeep()}
function beepStartRest(){playBeepTone(660,120,0,'sine',0.22);playBeepTone(440,180,0.13,'sine',0.22)}
function beepTickWork(){playBeepTone(740,65,0,'sine',0.16);flashTimerBeep()}
function beepCountdown(){playBeepTone(880,90,0,'square',0.15);if(timerState.phase==='work')flashTimerBeep()}
function beepFinishAll(){playBeepTone(784,110,0,'triangle',0.24);playBeepTone(988,110,0.13,'triangle',0.24);playBeepTone(1318,240,0.26,'triangle',0.28)}

function readTimerCfg(){
  return {
    workSec:Math.max(5,Math.min(600,Number($('timerWorkSec').value)||40)),
    restSec:Math.max(5,Math.min(600,Number($('timerRestSec').value)||60)),
    sets:Math.max(1,Math.min(50,Number($('timerSets').value)||4)),
    reps:Math.max(1,Math.min(200,Number($('timerReps').value)||12))
  };
}
function formatTimer(sec){
  const s=Math.max(0,Math.floor(sec));
  return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
}
function renderTimer(){
  const cfg=readTimerCfg();
  const card=$('workoutTimerCard');
  card.classList.remove('state-idle','state-work','state-rest','state-done');
  card.classList.add('state-'+timerState.phase);
  $('timerWorkoutTitle').textContent=timerState.workoutTitle||'Cronômetro com bip e descanso';

  let totalPhase=cfg.workSec;
  if(timerState.phase==='idle'){
    timerState.remaining=cfg.workSec;
    $('timerPhaseLabel').textContent='RITMO DE TREINO';
    $('timerPhaseBadge').textContent='Pronto para iniciar';
    $('timerMeta').textContent=`Série 1 de ${cfg.sets} · ${cfg.reps} repetições`;
    $('timerBarFill').style.width='0%';
    $('timerStartBtn').textContent='▶ Iniciar';
    $('timerSkipBtn').disabled=true;
  }else if(timerState.phase==='work'){
    totalPhase=cfg.workSec;
    $('timerPhaseLabel').textContent='EM TREINO';
    $('timerPhaseBadge').textContent=`🔥 Em treino · Série ${timerState.currentSet}/${cfg.sets}`;
    $('timerMeta').textContent=`Série ${timerState.currentSet} de ${cfg.sets} · ${cfg.reps} repetições`;
    $('timerBarFill').style.width=Math.min(100,Math.max(0,(1-timerState.remaining/totalPhase)*100))+'%';
    $('timerStartBtn').textContent=timerState.running?'❚❚ Pausar':'▶ Retomar';
    $('timerSkipBtn').disabled=false;
  }else if(timerState.phase==='rest'){
    totalPhase=cfg.restSec;
    $('timerPhaseLabel').textContent='TEMPO DE DESCANSO';
    $('timerPhaseBadge').textContent=`💧 Descanso · Próxima: Série ${timerState.currentSet+1}/${cfg.sets}`;
    $('timerMeta').textContent=`Respire · Próxima série (${cfg.reps} reps) em breve`;
    $('timerBarFill').style.width=Math.min(100,Math.max(0,(1-timerState.remaining/totalPhase)*100))+'%';
    $('timerStartBtn').textContent=timerState.running?'❚❚ Pausar':'▶ Retomar';
    $('timerSkipBtn').disabled=false;
  }else{
    $('timerPhaseLabel').textContent='FINALIZADO';
    $('timerPhaseBadge').textContent='✔ Séries concluídas!';
    $('timerMeta').textContent=`${cfg.sets} séries de ${cfg.reps} repetições finalizadas`;
    $('timerBarFill').style.width='100%';
    $('timerStartBtn').textContent='▶ Iniciar novo';
    $('timerSkipBtn').disabled=true;
  }
  $('timerClock').textContent=formatTimer(timerState.remaining);
}
function advanceTimerPhase(){
  const cfg=readTimerCfg();
  if(timerState.phase==='work'){
    if(timerState.currentSet>=cfg.sets){
      clearInterval(timerState.interval);
      timerState.interval=null;
      timerState.running=false;
      timerState.phase='done';
      timerState.remaining=0;
      beepFinishAll();
      toast('Todas as séries concluídas!');
    }else{
      timerState.phase='rest';
      timerState.remaining=cfg.restSec;
      timerState.elapsed=0;
      beepStartRest();
    }
  }else if(timerState.phase==='rest'){
    timerState.currentSet++;
    timerState.phase='work';
    timerState.remaining=cfg.workSec;
    timerState.elapsed=0;
    beepStartWork();
  }
  renderTimer();
}
function tickTimer(){
  if(!timerState.running)return;
  timerState.remaining--;
  timerState.elapsed++;
  if(timerState.remaining<=0){
    advanceTimerPhase();
    return;
  }
  const mode=$('timerBeepMode').value;
  if(timerState.remaining<=3){
    beepCountdown();
  }else if(timerState.phase==='work'&&(mode==='1s'||mode==='2s'||mode==='3s')){
    const step=parseInt(mode,10);
    if(timerState.elapsed%step===0)beepTickWork();
  }
  renderTimer();
}
function startOrPauseTimer(){
  ensureTimerAudio();
  const cfg=readTimerCfg();
  if(timerState.phase==='idle'||timerState.phase==='done'){
    timerState.phase='work';
    timerState.currentSet=1;
    timerState.remaining=cfg.workSec;
    timerState.elapsed=0;
    timerState.running=true;
    clearInterval(timerState.interval);
    timerState.interval=setInterval(tickTimer,1000);
    beepStartWork();
  }else if(timerState.running){
    timerState.running=false;
    clearInterval(timerState.interval);
    timerState.interval=null;
  }else{
    timerState.running=true;
    clearInterval(timerState.interval);
    timerState.interval=setInterval(tickTimer,1000);
  }
  renderTimer();
}
function resetTimer(){
  clearInterval(timerState.interval);
  timerState.interval=null;
  timerState.running=false;
  timerState.phase='idle';
  timerState.currentSet=1;
  timerState.elapsed=0;
  timerState.remaining=readTimerCfg().workSec;
  renderTimer();
}
function loadWorkoutIntoTimer(name){
  timerState.workoutTitle='Ritmo · '+name;
  resetTimer();
  $('workoutTimerCard').scrollIntoView({behavior:'smooth',block:'start'});
  toast('Cronômetro pronto para: '+name);
}
$('timerStartBtn').addEventListener('click',startOrPauseTimer);
$('timerSkipBtn').addEventListener('click',()=>{if(timerState.phase==='work'||timerState.phase==='rest')advanceTimerPhase()});
$('timerResetBtn').addEventListener('click',()=>{timerState.workoutTitle='';resetTimer()});
['timerWorkSec','timerRestSec','timerSets','timerReps'].forEach(id=>$(id).addEventListener('input',()=>{if(timerState.phase==='idle')renderTimer()}));
renderTimer();

const workoutTemplates={
Academia:{name:'Treino de musculação',minutes:50,description:'Escolha os exercícios por grupo muscular abaixo e monte seu treino.',exercises:'Supino reto com barra — 3×10\nPuxada alta frontal — 3×12\nDesenvolvimento com halteres — 3×10\nRosca direta com barra reta — 3×10\nTríceps corda — 3×12'},
Casa:{name:'Treino funcional em casa',minutes:30,description:'Exercícios práticos para fazer em casa no seu ritmo.',exercises:'Agachamento livre — 3×12\nFlexão de braço (ou com joelhos apoiados) — 3×8\nPonte de glúteos — 3×12\nAfundo alternado — 2×10 cada perna\nPrancha — 3×20 segundos'},
Rua:{name:'Caminhada ou corrida ao ar livre',minutes:35,description:'Planeje seu percurso de caminhada ou corrida ao ar livre.',exercises:'Aquecimento: caminhada leve — 5 min\nCaminhada em ritmo confortável — 20 min\nOpcional: trote leve — 5 min\nDesaceleração — 5 min'},
Calistenia:{name:'Treino básico de calistenia',minutes:35,description:'Movimentos com o peso do corpo.',exercises:'Agachamento com peso corporal — 3×12\nFlexão inclinada — 3×8\nBarra australiana (se houver apoio seguro) — 3×8\nElevação de joelhos — 3×10\nPrancha — 3×25 segundos'}
};

// Catálogo completo da opção Academia (78 exercícios em 7 grupos musculares, Masculino / Feminino)
const gymExercises=[
 {id:'antebraco-caminhada-do-fazendeiro',group:'Antebraço',name:'Caminhada do fazendeiro',primary:'Flexor dos dedos, Flexor ulnar do carpo',secondary:'Trapézio, Braquiorradial',dose:'3 × 30–40 m'},
 {id:'antebraco-extensao-de-punho',group:'Antebraço',name:'Extensão de punho',primary:'Extensor radial do carpo, Extensor ulnar do carpo',secondary:'Extensor dos dedos',dose:'3 × 12–15'},
 {id:'antebraco-rosca-de-punho',group:'Antebraço',name:'Rosca de punho',primary:'Flexor radial do carpo, Flexor ulnar do carpo',secondary:'Flexor dos dedos',dose:'3 × 12–15'},
 {id:'antebraco-rosca-inversa',group:'Antebraço',name:'Rosca inversa',primary:'Braquiorradial, Extensor radial do carpo',secondary:'Braquial, Bíceps braquial, Extensor dos dedos',dose:'3 × 10–12'},
 {id:'antebraco-rosca-martelo-cruzada',group:'Antebraço',name:'Rosca martelo cruzada',primary:'Braquiorradial, Braquial',secondary:'Bíceps braquial, Flexor radial do carpo',dose:'3 × 10–12'},
 {id:'antebraco-sustentacao-de-halteres',group:'Antebraço',name:'Sustentação de halteres',primary:'Flexor dos dedos, Flexor ulnar do carpo',secondary:'Trapézio, Braquiorradial, Flexor radial do carpo',dose:'3 × 30–45 s'},
 {id:'biceps-rosca-21',group:'Bíceps',name:'Rosca 21',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 21 (7+7+7)'},
 {id:'biceps-rosca-alternada',group:'Bíceps',name:'Rosca alternada',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 10–12'},
 {id:'biceps-rosca-aranha',group:'Bíceps',name:'Rosca aranha (Spider Curl)',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 10–12'},
 {id:'biceps-rosca-bayesian-na-polia',group:'Bíceps',name:'Rosca Bayesian na polia',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 10–12'},
 {id:'biceps-rosca-concentrada',group:'Bíceps',name:'Rosca concentrada',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 10–12'},
 {id:'biceps-rosca-direta-com-barra-reta',group:'Bíceps',name:'Rosca direta com barra reta',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 8–12'},
 {id:'biceps-rosca-direta-com-barra-w',group:'Bíceps',name:'Rosca direta com barra W',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 8–12'},
 {id:'biceps-rosca-direta-com-halteres',group:'Bíceps',name:'Rosca direta com halteres',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 10–12'},
 {id:'biceps-rosca-inclinada-com-halteres',group:'Bíceps',name:'Rosca inclinada com halteres',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 10–12'},
 {id:'biceps-rosca-martelo',group:'Bíceps',name:'Rosca martelo',primary:'Braquiorradial, Braquial',secondary:'Bíceps braquial',dose:'3 × 10–12'},
 {id:'biceps-rosca-na-polia-baixa',group:'Bíceps',name:'Rosca na polia baixa',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 10–12'},
 {id:'biceps-rosca-scott',group:'Bíceps',name:'Rosca Scott',primary:'Bíceps braquial',secondary:'Braquial, Braquiorradial',dose:'3 × 10–12'},
 {id:'costas-remada-articulada',group:'Costas',name:'Remada articulada',primary:'Trapézio médio, Romboides, Latíssimo do dorso',secondary:'Deltoide posterior, Flexores do cotovelo',dose:'3 × 10–12'},
 {id:'costas-remada-cavalinho',group:'Costas',name:'Remada cavalinho',primary:'Trapézio médio, Romboides, Latíssimo do dorso',secondary:'Deltoide posterior, Flexores do cotovelo',dose:'3 × 8–12'},
 {id:'costas-remada-na-maquina',group:'Costas',name:'Remada na máquina',primary:'Trapézio médio, Romboides, Latíssimo do dorso',secondary:'Deltoide posterior, Flexores do cotovelo',dose:'3 × 10–12'},
 {id:'costas-remada-curvada-com-barra',group:'Costas',name:'Remada curvada com barra',primary:'Trapézio médio, Romboides, Latíssimo do dorso',secondary:'Deltoide posterior, Flexores do cotovelo',dose:'3 × 8–10'},
 {id:'costas-remada-unilateral-serrote',group:'Costas',name:'Remada unilateral com halter (Serrote)',primary:'Trapézio médio, Romboides, Latíssimo do dorso',secondary:'Deltoide posterior, Flexores do cotovelo',dose:'3 × 10–12'},
 {id:'costas-puxada-alta-pegada-fechada',group:'Costas',name:'Puxada alta com pegada fechada',primary:'Latíssimo do dorso',secondary:'Redondo maior, Trapézio inferior, Bíceps braquial',dose:'3 × 10–12'},
 {id:'costas-puxada-alta-frontal',group:'Costas',name:'Puxada alta frontal',primary:'Latíssimo do dorso',secondary:'Redondo maior, Deltoide posterior, Bíceps braquial',dose:'3 × 10–12'},
 {id:'costas-puxada-alta-supinada',group:'Costas',name:'Puxada alta supinada',primary:'Latíssimo do dorso',secondary:'Redondo maior, Bíceps braquial, Braquial',dose:'3 × 10–12'},
 {id:'costas-puxada-unilateral-na-polia',group:'Costas',name:'Puxada unilateral na polia',primary:'Latíssimo do dorso',secondary:'Redondo maior, Deltoide posterior, Bíceps braquial',dose:'3 × 10–12'},
 {id:'costas-remada-baixa',group:'Costas',name:'Remada baixa',primary:'Trapézio médio, Romboides, Latíssimo do dorso',secondary:'Deltoide posterior, Bíceps braquial',dose:'3 × 10–12'},
 {id:'costas-barra-fixa-supinada',group:'Costas',name:'Barra fixa supinada',primary:'Latíssimo do dorso',secondary:'Redondo maior, Bíceps braquial, Braquial',dose:'3 × 6–10'},
 {id:'costas-barra-fixa',group:'Costas',name:'Barra fixa',primary:'Latíssimo do dorso',secondary:'Redondo maior, Bíceps braquial, Trapézio inferior',dose:'3 × 6–10'},
 {id:'costas-pullover-com-halter',group:'Costas',name:'Pullover com halter',primary:'Latíssimo do dorso',secondary:'Redondo maior, Deltoide posterior, Tríceps braquial',dose:'3 × 10–12'},
 {id:'costas-pullover-na-polia',group:'Costas',name:'Pullover na polia',primary:'Latíssimo do dorso',secondary:'Redondo maior, Deltoide posterior, Tríceps braquial',dose:'3 × 12–15'},
 {id:'ombros-crucifixo-inverso',group:'Ombros',name:'Crucifixo inverso',primary:'Deltoide posterior',secondary:'Trapézio, Infraespinhal, Romboides',dose:'3 × 12–15'},
 {id:'ombros-crucifixo-inverso-na-maquina',group:'Ombros',name:'Crucifixo inverso na máquina',primary:'Deltoide posterior',secondary:'Trapézio, Infraespinhal',dose:'3 × 12–15'},
 {id:'ombros-desenvolvimento-arnold',group:'Ombros',name:'Desenvolvimento Arnold',primary:'Deltoide anterior',secondary:'Trapézio, Deltoide lateral, Tríceps braquial',dose:'3 × 10–12'},
 {id:'ombros-desenvolvimento-com-barra',group:'Ombros',name:'Desenvolvimento com barra',primary:'Deltoide anterior',secondary:'Deltoide lateral, Trapézio, Tríceps braquial',dose:'3 × 8–10'},
 {id:'ombros-desenvolvimento-com-halteres',group:'Ombros',name:'Desenvolvimento com halteres',primary:'Deltoide anterior',secondary:'Deltoide lateral, Trapézio, Tríceps braquial',dose:'3 × 10–12'},
 {id:'ombros-desenvolvimento-militar',group:'Ombros',name:'Desenvolvimento militar',primary:'Deltoide anterior',secondary:'Trapézio, Deltoide lateral, Tríceps braquial',dose:'3 × 8–10'},
 {id:'ombros-desenvolvimento-na-maquina',group:'Ombros',name:'Desenvolvimento na máquina',primary:'Deltoide anterior',secondary:'Trapézio, Deltoide lateral, Tríceps braquial',dose:'3 × 10–12'},
 {id:'ombros-elevacao-frontal-com-barra',group:'Ombros',name:'Elevação frontal com barra',primary:'Deltoide anterior',secondary:'Deltoide lateral, Peitoral maior, Trapézio',dose:'3 × 12'},
 {id:'ombros-elevacao-frontal-com-halteres',group:'Ombros',name:'Elevação frontal com halteres',primary:'Deltoide anterior',secondary:'Deltoide lateral, Peitoral maior, Trapézio',dose:'3 × 12'},
 {id:'ombros-elevacao-lateral-com-halteres',group:'Ombros',name:'Elevação lateral com halteres',primary:'Deltoide lateral',secondary:'Deltoide anterior, Trapézio, Supraespinhal',dose:'3 × 12–15'},
 {id:'ombros-elevacao-frontal-na-polia',group:'Ombros',name:'Elevação frontal na polia',primary:'Deltoide anterior',secondary:'Deltoide lateral, Peitoral maior, Trapézio',dose:'3 × 12'},
 {id:'ombros-elevacao-lateral-na-maquina',group:'Ombros',name:'Elevação lateral na máquina',primary:'Deltoide lateral',secondary:'Deltoide anterior, Trapézio',dose:'3 × 12–15'},
 {id:'ombros-elevacao-lateral-na-polia',group:'Ombros',name:'Elevação lateral na polia',primary:'Deltoide lateral',secondary:'Deltoide anterior, Trapézio',dose:'3 × 12–15'},
 {id:'ombros-face-pull',group:'Ombros',name:'Face Pull',primary:'Deltoide posterior',secondary:'Trapézio, Infraespinhal, Romboides',dose:'3 × 12–15'},
 {id:'peito-crossover-polia-alta',group:'Peito',name:'Crossover na polia alta',primary:'Peitoral maior (ênfase esternocostal)',secondary:'Deltoide anterior',dose:'3 × 12–15'},
 {id:'peito-crossover-polia-media',group:'Peito',name:'Crossover na polia média',primary:'Peitoral maior',secondary:'Deltoide anterior',dose:'3 × 12–15'},
 {id:'peito-crossover-polia-baixa',group:'Peito',name:'Crossover na polia baixa',primary:'Peitoral maior (ênfase clavicular)',secondary:'Deltoide anterior',dose:'3 × 12–15'},
 {id:'peito-crucifixo-inclinado',group:'Peito',name:'Crucifixo inclinado',primary:'Peitoral maior (ênfase clavicular)',secondary:'Deltoide anterior',dose:'3 × 10–12'},
 {id:'peito-crucifixo-na-maquina-peck-deck',group:'Peito',name:'Crucifixo na máquina (Peck Deck)',primary:'Peitoral maior',secondary:'Deltoide anterior',dose:'3 × 12'},
 {id:'peito-crucifixo-reto',group:'Peito',name:'Crucifixo reto',primary:'Peitoral maior',secondary:'Deltoide anterior',dose:'3 × 10–12'},
 {id:'peito-flexao-de-bracos',group:'Peito',name:'Flexão de braços',primary:'Peitoral maior',secondary:'Deltoide anterior, Tríceps braquial',dose:'3 × 10–15'},
 {id:'peito-paralelas-foco-peito',group:'Peito',name:'Paralelas com foco no peito',primary:'Peitoral maior (ênfase esternocostal)',secondary:'Deltoide anterior, Tríceps braquial',dose:'3 × 8–12'},
 {id:'peito-supino-inclinado-com-barra',group:'Peito',name:'Supino inclinado com barra',primary:'Peitoral maior (porção clavicular)',secondary:'Deltoide anterior, Tríceps braquial',dose:'3 × 8–10'},
 {id:'peito-supino-reto-com-barra',group:'Peito',name:'Supino reto com barra',primary:'Peitoral maior',secondary:'Deltoide anterior, Tríceps',dose:'3 × 8–10'},
 {id:'peito-supino-reto-com-halteres',group:'Peito',name:'Supino reto com halteres',primary:'Peitoral maior',secondary:'Deltoide anterior, Tríceps braquial',dose:'3 × 8–12'},
 {id:'peito-supino-declinado',group:'Peito',name:'Supino declinado',primary:'Peitoral maior (porção inferior)',secondary:'Deltoide anterior, Tríceps braquial',dose:'3 × 8–12'},
 {id:'peito-supino-inclinado-com-halteres',group:'Peito',name:'Supino inclinado com halteres',primary:'Peitoral maior (porção clavicular)',secondary:'Deltoide anterior, Tríceps braquial',dose:'3 × 10–12'},
 {id:'peito-supino-na-maquina',group:'Peito',name:'Supino na máquina',primary:'Peitoral maior',secondary:'Deltoide anterior, Tríceps braquial',dose:'3 × 10–12'},
 {id:'trapezio-encolhimento-com-barra',group:'Trapézio',name:'Encolhimento com barra',primary:'Trapézio',secondary:'Levantador da escápula, Romboides',dose:'3 × 12–15'},
 {id:'trapezio-encolhimento-com-halteres',group:'Trapézio',name:'Encolhimento com halteres',primary:'Trapézio',secondary:'Levantador da escápula, Romboides, Deltoide lateral',dose:'3 × 12–15'},
 {id:'trapezio-encolhimento-na-maquina',group:'Trapézio',name:'Encolhimento na máquina',primary:'Trapézio',secondary:'Levantador da escápula, Romboides',dose:'3 × 12–15'},
 {id:'trapezio-encolhimento-na-polia',group:'Trapézio',name:'Encolhimento na polia',primary:'Trapézio',secondary:'Levantador da escápula, Romboides',dose:'3 × 12–15'},
 {id:'trapezio-remada-alta-com-barra',group:'Trapézio',name:'Remada alta com barra',primary:'Trapézio',secondary:'Deltoide lateral, Deltoide anterior, Bíceps braquial',dose:'3 × 10–12'},
 {id:'trapezio-remada-alta-na-polia',group:'Trapézio',name:'Remada alta na polia',primary:'Trapézio',secondary:'Deltoide lateral, Deltoide anterior, Bíceps braquial',dose:'3 × 10–12'},
 {id:'triceps-supino-fechado',group:'Tríceps',name:'Supino fechado',primary:'Tríceps braquial',secondary:'Deltoide anterior, Ancôneo',dose:'3 × 8–10'},
 {id:'triceps-banco',group:'Tríceps',name:'Tríceps banco',primary:'Tríceps braquial',secondary:'Ancôneo, Peitoral maior, Deltoide anterior',dose:'3 × 10–15'},
 {id:'triceps-coice',group:'Tríceps',name:'Tríceps coice',primary:'Tríceps braquial',secondary:'Deltoide posterior, Ancôneo',dose:'3 × 12'},
 {id:'triceps-frances',group:'Tríceps',name:'Tríceps francês',primary:'Tríceps braquial',secondary:'Ancôneo',dose:'3 × 10–12'},
 {id:'triceps-frances-na-polia',group:'Tríceps',name:'Tríceps francês na polia',primary:'Tríceps braquial',secondary:'Ancôneo',dose:'3 × 10–12'},
 {id:'triceps-unilateral-na-polia',group:'Tríceps',name:'Tríceps unilateral na polia',primary:'Tríceps braquial',secondary:'Ancôneo',dose:'3 × 12'},
 {id:'triceps-barra-reta',group:'Tríceps',name:'Tríceps barra reta',primary:'Tríceps braquial',secondary:'Deltoide posterior, Ancôneo',dose:'3 × 10–12'},
 {id:'triceps-barra-v',group:'Tríceps',name:'Tríceps barra V',primary:'Tríceps braquial',secondary:'Deltoide posterior, Ancôneo',dose:'3 × 10–12'},
 {id:'triceps-corda',group:'Tríceps',name:'Tríceps corda',primary:'Tríceps braquial',secondary:'Deltoide posterior, Ancôneo',dose:'3 × 12'},
 {id:'triceps-paralelas-foco-triceps',group:'Tríceps',name:'Paralelas com foco no tríceps',primary:'Tríceps braquial',secondary:'Peitoral maior, Deltoide anterior',dose:'3 × 8–12'},
 {id:'triceps-testa-com-barra-w',group:'Tríceps',name:'Tríceps testa com barra W',primary:'Tríceps braquial',secondary:'Deltoide anterior, Ancôneo',dose:'3 × 10–12'},
 {id:'triceps-testa-com-halteres',group:'Tríceps',name:'Tríceps testa com halteres',primary:'Tríceps braquial',secondary:'Deltoide anterior, Ancôneo',dose:'3 × 10–12'}
];

const gymGroupNames=['Todos','Peito','Costas','Ombros','Bíceps','Tríceps','Antebraço','Trapézio'];
const imgExts=['webp','png','jpg','jpeg'];
let gymGender='feminino',gymGroup='Todos',gymModalId=null;

function gymImageSrc(id,gender,extIdx=0){return `assets/academia/${gender}/${id}.${imgExts[extIdx]}`}
function handleGymImgError(img){
  const next=Number(img.dataset.extStep||0)+1;
  if(next<imgExts.length){
    img.dataset.extStep=String(next);
    img.src=gymImageSrc(img.dataset.id,img.dataset.gender,next);
  }else{
    img.classList.add('hidden');
    img.nextElementSibling?.classList.remove('hidden');
  }
}
function setGymGender(g){
  gymGender=g==='feminino'?'feminino':'masculino';
  all('[data-gym-gender]').forEach(b=>{
    const on=b.dataset.gymGender===gymGender;
    b.classList.toggle('selected',on);
    b.setAttribute('aria-pressed',String(on));
  });
  renderGymGallery();
  if(gymModalId)openGymModal(gymModalId);
}
function renderGymGroups(){
  $('gymGroups').innerHTML=gymGroupNames.map(g=>{
    const count=g==='Todos'?gymExercises.length:gymExercises.filter(x=>x.group===g).length;
    return `<button type="button" class="gym-group-btn${g===gymGroup?' selected':''}" data-gym-group="${esc(g)}">${esc(g)} (${count})</button>`;
  }).join('');
}
function renderGymGallery(){
  renderGymGroups();
  const term=$('gymSearch').value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const found=gymExercises.filter(x=>(gymGroup==='Todos'||x.group===gymGroup)&&[x.group,x.name,x.primary,x.secondary].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(term));
  $('gymGrid').innerHTML=found.length?found.map(ex=>`
    <article class="gym-card">
      <div class="gym-thumb" data-view-gym="${esc(ex.id)}" role="button" tabindex="0" aria-label="Ver foto de ${esc(ex.name)}">
        <img src="${esc(gymImageSrc(ex.id,gymGender))}" alt="${esc(ex.group)} — ${esc(ex.name)} (${gymGender})" loading="lazy" data-id="${esc(ex.id)}" data-gender="${esc(gymGender)}" data-ext-step="0">
        <div class="gym-fallback hidden">
          <span class="tag">${esc(ex.group)} · ${gymGender==='feminino'?'♀ Feminino':'♂ Masculino'}</span>
          <b>${esc(ex.name)}</b>
          <small>Imagem em breve</small>
        </div>
      </div>
      <div class="gym-meta">
        <span class="tag">${esc(ex.group)}</span>
        <span class="tiny">${gymGender==='feminino'?'♀ Feminino':'♂ Masculino'}</span>
      </div>
      <h3 class="gym-card-title">${esc(ex.name)}</h3>
      <div class="gym-muscles">
        <div><span class="dot-pri"></span><b>Principal:</b> ${esc(ex.primary)}</div>
        <div><span class="dot-sec"></span><b>Secundário:</b> ${esc(ex.secondary)}</div>
      </div>
      <div class="gym-card-actions">
        <button type="button" class="btn" data-view-gym="${esc(ex.id)}">🔍 Ver foto</button>
        <button type="button" class="btn primary" data-add-gym="${esc(ex.id)}">+ Treino</button>
      </div>
    </article>
  `).join(''):'<p class="notice">Nenhum exercício encontrado para este filtro.</p>';
  $('gymGrid').querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>handleGymImgError(img)));
}
function openGymModal(id){
  const ex=gymExercises.find(x=>x.id===id);if(!ex)return;
  gymModalId=id;
  $('gymModalGroup').textContent=ex.group;
  $('gymModalTitle').textContent=ex.name;
  $('gymModalMedia').innerHTML=`<img src="${esc(gymImageSrc(ex.id,gymGender))}" alt="${esc(ex.group)} — ${esc(ex.name)} (${gymGender})" data-id="${esc(ex.id)}" data-gender="${esc(gymGender)}" data-ext-step="0"><div class="gym-fallback hidden"><span class="tag">${esc(ex.group)} · ${gymGender==='feminino'?'♀ Feminino':'♂ Masculino'}</span><b>${esc(ex.name)}</b><small>Imagem em breve</small></div>`;
  const modalImg=$('gymModalMedia').querySelector('img');
  if(modalImg)modalImg.addEventListener('error',()=>handleGymImgError(modalImg));
  $('gymModalMuscles').innerHTML=`<div><span class="dot-pri"></span><b>Músculo principal:</b> ${esc(ex.primary)}</div><div><span class="dot-sec"></span><b>Músculos secundários:</b> ${esc(ex.secondary)}</div><div class="tiny" style="margin-top:4px">Sugestão de séries: ${esc(ex.dose)}</div>`;
  $('gymModalAdd').dataset.addGym=ex.id;
  $('gymModal').querySelectorAll('[data-gym-gender]').forEach(b=>b.classList.toggle('selected',b.dataset.gymGender===gymGender));
  $('gymModal').classList.remove('hidden');
}
function closeGymModal(){gymModalId=null;$('gymModal').classList.add('hidden')}
function addGymExercise(id){
  const ex=gymExercises.find(x=>x.id===id);if(!ex)return;
  if(!$('workoutEditor').classList.contains('opened')||$('workoutType').value!=='Academia'){
    selectWorkoutType('Academia');
    $('workoutExercises').value='';
  }
  const area=$('workoutExercises'),line=`${ex.name} — ${ex.dose}`,current=area.value.trim();
  area.value=current?current+'\n'+line:line;
  toast(ex.name+' adicionado ao treino!');
}

$('academiaGallery').addEventListener('click',e=>{
  const gb=e.target.closest('[data-gym-gender]');if(gb){setGymGender(gb.dataset.gymGender);return}
  const gr=e.target.closest('[data-gym-group]');if(gr){gymGroup=gr.dataset.gymGroup;renderGymGallery();return}
  const vw=e.target.closest('[data-view-gym]');if(vw){openGymModal(vw.dataset.viewGym);return}
  const ad=e.target.closest('[data-add-gym]');if(ad){addGymExercise(ad.dataset.addGym);return}
});
$('academiaGallery').addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){
    const vw=e.target.closest('[data-view-gym]');
    if(vw){e.preventDefault();openGymModal(vw.dataset.viewGym)}
  }
});
$('gymSearch').addEventListener('input',renderGymGallery);
$('gymModalClose').addEventListener('click',closeGymModal);
$('gymModal').addEventListener('click',e=>{
  if(e.target===$('gymModal')){closeGymModal();return}
  const gb=e.target.closest('[data-gym-gender]');if(gb){setGymGender(gb.dataset.gymGender);return}
  const ad=e.target.closest('[data-add-gym]');if(ad){addGymExercise(ad.dataset.addGym);closeGymModal()}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&gymModalId)closeGymModal()});

function toggleAcademiaView(type){
  const isGym=type==='Academia';
  $('academiaGallery').classList.toggle('hidden',!isGym);
  $('exerciseStudio').classList.toggle('hidden',isGym);
  if(isGym)renderGymGallery();
}
function selectWorkoutType(type,edit=false){
 const t=workoutTemplates[type];if(!t)return;
 document.querySelectorAll('[data-choose-workout]').forEach(b=>{const selected=b.dataset.chooseWorkout===type;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
 $('workoutEditor').classList.add('opened');$('workoutType').value=type;
 $('workoutHint').textContent=t.description;
 toggleAcademiaView(type);
 if(!edit){$('workoutId').value='';$('workoutFormTitle').textContent='Criar treino · '+type;$('workoutName').value=t.name;$('workoutMinutes').value=t.minutes;$('workoutExercises').value=t.exercises;}
 $('workoutEditor').scrollIntoView({behavior:'smooth',block:'start'});
}
$('workoutChoices').onclick=e=>{let btn=e.target.closest('[data-choose-workout]');if(btn)selectWorkoutType(btn.dataset.chooseWorkout)};
$('workoutType').onchange=e=>selectWorkoutType(e.target.value,Boolean($('workoutId').value));
function renderWorkouts(){$('workoutCount').textContent=data.workouts.length+' treino(s)';$('workoutList').innerHTML=data.workouts.length?data.workouts.map(w=>`<div class="item"><div><strong>${esc(w.name)}</strong><small>${esc(w.type)} · ${esc(w.day)} · ${n(w.minutes)} min</small><div class="notice">${esc(w.exercises).replace(/\n/g,'<br>')}</div><div class="exercise-line-actions" data-exercise-buttons="${esc(w.id)}"></div></div><div class="row"><button class="btn" data-timer-workout="${esc(w.id)}" title="Acompanhar no cronômetro">⏱ Ritmo</button><button class="btn" data-edit="${esc(w.id)}">Editar</button><button class="btn primary" data-done="${esc(w.id)}">Concluir</button><button class="btn" data-del="${esc(w.id)}">Excluir</button></div></div>`).join(''):'Nenhum treino cadastrado.';renderWorkoutExerciseButtons();$('workoutHistory').innerHTML=data.history.length?data.history.slice().reverse().slice(0,25).map(h=>`<div class="item"><div><b>${esc(h.name)}</b><small>${new Date(h.date).toLocaleString('pt-BR')} · ${esc(h.type)} · ${n(h.minutes)} min</small></div><button class="btn" data-delhistory="${esc(h.id)}">Excluir</button></div>`).join(''):'Sem treinos concluídos ainda.'}
function clearWorkout(){$('workoutForm').reset();$('workoutId').value='';$('workoutEditor').classList.remove('opened');$('workoutFormTitle').textContent='Novo treino';toggleAcademiaView('');document.querySelectorAll('[data-choose-workout]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false')})}
$('workoutClear').onclick=clearWorkout;
$('workoutForm').onsubmit=e=>{e.preventDefault();const id=$('workoutId').value;const w={id:id||uid(),name:$('workoutName').value.trim(),type:$('workoutType').value,day:$('workoutDay').value,minutes:Number($('workoutMinutes').value),exercises:$('workoutExercises').value.trim()};if(!w.name||!w.exercises)return;const pos=data.workouts.findIndex(x=>x.id===id);pos>=0?data.workouts[pos]=w:data.workouts.push(w);save();clearWorkout();render();toast('Treino salvo!')}
$('workoutList').onclick=e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.showGym){openGymModal(b.dataset.showGym);return}if(b.dataset.showExercise){showExercise(b.dataset.showExercise);return}let id=b.dataset.timerWorkout||b.dataset.edit||b.dataset.done||b.dataset.del,w=data.workouts.find(x=>x.id===id);if(!w)return;if(b.dataset.timerWorkout){loadWorkoutIntoTimer(w.name)}else if(b.dataset.edit){selectWorkoutType(workoutTemplates[w.type]?w.type:'Rua',true);$('workoutId').value=w.id;$('workoutName').value=w.name;$('workoutType').value=w.type;$('workoutDay').value=w.day;$('workoutMinutes').value=w.minutes;$('workoutExercises').value=w.exercises;$('workoutFormTitle').textContent='Editar treino';$('workoutName').focus()}else if(b.dataset.done){data.history.push({...w,id:uid(),date:now()});save();render();toast('Treino concluído!')}else if(confirm('Excluir este treino?')){data.workouts=data.workouts.filter(x=>x.id!==id);save();render()}};
$('workoutHistory').onclick=e=>{let id=e.target.closest('[data-delhistory]')?.dataset.delhistory;if(id&&confirm('Apagar este histórico?')){data.history=data.history.filter(h=>h.id!==id);save();render()}};

const mealSets={comum:{ganhar:[['Café da manhã','Ovos, pão integral e fruta'],['Almoço','Arroz, feijão, frango e legumes'],['Lanche','Iogurte e banana com aveia'],['Jantar','Batata, peixe e salada']],perder:[['Café da manhã','Ovos e fruta'],['Almoço','Arroz, feijão, proteína magra e salada'],['Lanche','Fruta e iogurte natural'],['Jantar','Legumes, proteína e porção de carboidrato']],saude:[['Café da manhã','Fruta, aveia e iogurte'],['Almoço','Arroz, feijão, frango e salada'],['Lanche','Fruta e castanhas'],['Jantar','Omelete, legumes e batata']]},vegetariana:{ganhar:[['Café da manhã','Aveia, leite ou bebida vegetal e banana'],['Almoço','Arroz, feijão, tofu e legumes'],['Lanche','Iogurte ou alternativa vegetal e frutas'],['Jantar','Lentilha, quinoa e vegetais']],perder:[['Café da manhã','Frutas e aveia'],['Almoço','Grão-de-bico, arroz integral e salada'],['Lanche','Iogurte ou alternativa vegetal'],['Jantar','Tofu, verduras e legumes']],saude:[['Café da manhã','Fruta e aveia'],['Almoço','Arroz, feijão e vegetais'],['Lanche','Frutas e sementes'],['Jantar','Lentilha e legumes']]}};
$('makeMeal').onclick=()=>{let pref=$('foodPreference').value,goal=data.profile.goal,group=goal==='ganhar'?'ganhar':goal==='perder'?'perder':'saude',notes=$('foodNotes').value.trim(),meals=mealSets[pref][group];$('mealResult').innerHTML=`<div class="tag" style="margin-bottom:12px">Objetivo: ${esc($('profileGoal').selectedOptions[0]?.textContent||goal)}</div>${meals.map(([a,b])=>`<div class="meal"><b>${esc(a)}</b>${esc(b)}</div>`).join('')}${notes?`<p class="notice">Observações: ${esc(notes)}</p>`:''}`};

function gpsDistance(a,b){let R=6371e3,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lon-a.lon)*Math.PI/180,x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
let tracking=null;
function secFormat(sec){let h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function kcal(sec,type){let met=type==='Corrida'?8.3:3.5,kg=Number(data.profile.weight||70);return Math.round(met*3.5*kg/200*(sec/60))}
function gpsUi(){let sec=tracking?Math.floor((Date.now()-tracking.started)/1000):0,km=tracking?.meters/1000||0;$('gpsKm').textContent=n(km,2);$('gpsTime').textContent=secFormat(sec);$('gpsCal').textContent=kcal(sec,$('trackType').value);$('startGps').disabled=!!tracking;$('stopGps').disabled=!tracking}
function gpsStart(){if(!navigator.geolocation){toast('GPS indisponível neste navegador.');return}if(!window.isSecureContext){toast('Localização disponível apenas em ambiente seguro (HTTPS).');return}tracking={started:Date.now(),meters:0,last:null,watch:null,tick:null,type:$('trackType').value};$('gpsStatus').textContent='Solicitando permissão de localização…';tracking.watch=navigator.geolocation.watchPosition(pos=>{if(!tracking)return;const p={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy};if(p.accuracy>60){$('gpsStatus').textContent='Precisão baixa ('+Math.round(p.accuracy)+' m). Aguardando sinal melhor.';return}if(tracking.last){const d=gpsDistance(tracking.last,p),dt=(pos.timestamp-tracking.lastTimestamp)/1000;if(d>=3&&d<100&&dt>0&&d/dt<12)tracking.meters+=d}tracking.last=p;tracking.lastTimestamp=pos.timestamp;$('gpsStatus').textContent='GPS ativo · precisão aproximada '+Math.round(p.accuracy)+' metros';gpsUi()},err=>{$('gpsStatus').textContent='Erro de GPS: '+err.message;if(err.code===1){gpsStop(false);toast('Permissão de localização negada.')}},{enableHighAccuracy:true,maximumAge:0,timeout:15000});tracking.tick=setInterval(gpsUi,1000);gpsUi()}
function gpsStop(keep){if(!tracking)return;const t=tracking;const seconds=Math.floor((Date.now()-t.started)/1000);navigator.geolocation.clearWatch(t.watch);clearInterval(t.tick);tracking=null;if(keep&&seconds>=5){data.activities.push({id:uid(),date:now(),type:t.type,seconds,km:t.meters/1000,cal:kcal(seconds,t.type)});save();toast('Atividade salva!')}else if(keep){toast('Atividade muito curta para registrar (mínimo 5 s).')}$('gpsStatus').textContent='Rastreamento finalizado.';gpsUi();renderActivities()}
$('startGps').onclick=gpsStart;$('stopGps').onclick=()=>gpsStop(true);
function renderActivities(){$('activityList').innerHTML=data.activities.length?data.activities.slice().reverse().map(x=>`<div class="item"><div><b>${esc(x.type)} · ${n(x.km,2)} km</b><small>${new Date(x.date).toLocaleString('pt-BR')} · ${secFormat(x.seconds)} · ~${n(x.cal)} kcal</small></div><button class="btn" data-delactivity="${esc(x.id)}">Excluir</button></div>`).join(''):'Nenhuma atividade registrada.'}
$('activityList').onclick=e=>{let id=e.target.closest('[data-delactivity]')?.dataset.delactivity;if(id&&confirm('Excluir atividade?')){data.activities=data.activities.filter(x=>x.id!==id);save();render()}};

$('measureDate').value=today();
$('measureForm').onsubmit=e=>{e.preventDefault();let item={id:uid(),date:$('measureDate').value,weight:Number($('measureWeight').value),waist:$('measureWaist').value,arm:$('measureArm').value};data.measures.push(item);data.measures.sort((a,b)=>a.date.localeCompare(b.date));data.profile.weight=item.weight;save();render();toast('Medição registrada!')};
function renderMeasures(){let ms=data.measures;$('measureList').innerHTML=ms.length?ms.slice().reverse().map(x=>`<div class="item"><div><strong>${esc(x.date)} · ${n(x.weight,1)} kg</strong><small>Cintura: ${x.waist?n(x.waist,1)+' cm':'—'} · Braço: ${x.arm?n(x.arm,1)+' cm':'—'}</small></div><button class="btn" data-delmeasure="${esc(x.id)}">Excluir</button></div>`).join(''):'Nenhuma medição registrada.';let last=ms.slice(-8),min=Math.min(...last.map(x=>x.weight),0),max=Math.max(...last.map(x=>x.weight),1);if(last.length){min=Math.min(...last.map(x=>x.weight))-2;max=Math.max(...last.map(x=>x.weight))+2}$('measureChart').innerHTML=last.length?last.map(x=>`<div class="bar" title="${esc(x.date)}: ${n(x.weight,1)} kg" style="height:${Math.max(12,((x.weight-min)/(max-min))*100)}%"><small>${esc(x.date.slice(5))}</small></div>`).join(''):'<span class="muted">O gráfico aparece ao registrar medidas.</span>'}
$('measureList').onclick=e=>{let id=e.target.closest('[data-delmeasure]')?.dataset.delmeasure;if(id&&confirm('Excluir medição?')){data.measures=data.measures.filter(x=>x.id!==id);save();render()}};

// Fit Music: categorias personalizáveis + links do YouTube + áudios locais.
let musicCategory='pesado',localTracks=[],activeMusicId=null,activeMusicType=null;
let youtubePlayer=null,youtubeReady=false,youtubeRequest=0,youtubeTick=null,youtubeApiPromise=null;

function ensureMusicCategories(){
  if(!Array.isArray(data.musicCategories)||!data.musicCategories.length){
    data.musicCategories=structuredClone(defaultMusicCategories);
  }
  data.musicCategories=data.musicCategories.filter(c=>c&&c.id&&c.name).map(c=>({
    id:String(c.id),
    name:String(c.name).trim(),
    subtitle:String(c.subtitle||'').trim(),
    icon:String(c.icon||'♫')
  }));
  if(!data.musicCategories.length)data.musicCategories=structuredClone(defaultMusicCategories);
  if(!data.musicCategories.some(c=>c.id===musicCategory))musicCategory=data.musicCategories[0].id;
}
function getMusicCategory(id){
  ensureMusicCategories();
  return data.musicCategories.find(c=>c.id===id)||data.musicCategories[0];
}
function renderMusicCategories(){
  ensureMusicCategories();
  $('musicPresets').innerHTML=data.musicCategories.map(cat=>{
    const on=cat.id===musicCategory;
    return `<div class="music-preset${on?' selected':''}"><button type="button" class="music-preset-main" data-music-category="${esc(cat.id)}"><span class="music-symbol">${esc(cat.icon||'♫')}</span><span class="music-preset-text"><b>${esc(cat.name)}</b><small>${esc(cat.subtitle||'Playlist de treino')}</small></span><span class="music-indicator">${on?'◉':'▷'}</span></button><button type="button" class="music-preset-edit" data-edit-category="${esc(cat.id)}" title="Editar categoria" aria-label="Editar categoria ${esc(cat.name)}">✎</button></div>`;
  }).join('');
  const prevSelect=$('musicEditId').value?$('musicCategory').value:musicCategory;
  $('musicCategory').innerHTML=data.musicCategories.map(cat=>`<option value="${esc(cat.id)}">${esc(cat.name)}</option>`).join('');
  $('musicCategory').value=data.musicCategories.some(c=>c.id===prevSelect)?prevSelect:musicCategory;
}
function openCategoryForm(catId=null){
  ensureMusicCategories();
  const form=$('musicCatForm');
  form.classList.remove('hidden');
  if(catId){
    const cat=data.musicCategories.find(c=>c.id===catId);
    if(!cat)return;
    $('catFormTitle').textContent='Editar categoria';
    $('catEditId').value=cat.id;
    $('catName').value=cat.name;
    $('catSubtitle').value=cat.subtitle||'';
    $('catIcon').value=Array.from($('catIcon').options).some(o=>o.value===cat.icon)?cat.icon:'♫';
    $('catDeleteBtn').classList.toggle('hidden',data.musicCategories.length<=1);
  }else{
    form.reset();
    $('catFormTitle').textContent='Nova categoria';
    $('catEditId').value='';
    $('catDeleteBtn').classList.add('hidden');
  }
  $('catName').focus();
}
function closeCategoryForm(){
  $('musicCatForm').reset();
  $('catEditId').value='';
  $('musicCatForm').classList.add('hidden');
  $('catDeleteBtn').classList.add('hidden');
}
$('newMusicCatBtn').addEventListener('click',()=>openCategoryForm());
$('catFormCancel').addEventListener('click',closeCategoryForm);
$('musicCatForm').addEventListener('submit',e=>{
  e.preventDefault();
  ensureMusicCategories();
  const id=$('catEditId').value;
  const name=$('catName').value.trim();
  const subtitle=$('catSubtitle').value.trim();
  const icon=$('catIcon').value||'♫';
  if(!name)return;
  if(id){
    const pos=data.musicCategories.findIndex(c=>c.id===id);
    if(pos>=0)data.musicCategories[pos]={...data.musicCategories[pos],name,subtitle,icon};
    save();
    closeCategoryForm();
    selectMusicCategory(id);
    if(activeMusicId){
      const playing=musicAll().find(t=>t.id===activeMusicId);
      if(playing&&playing.category===id)$('musicNowSubtitle').textContent=name;
    }
    toast('Categoria atualizada!');
  }else{
    const newCat={id:'cat-'+uid(),name,subtitle,icon};
    data.musicCategories.push(newCat);
    save();
    closeCategoryForm();
    selectMusicCategory(newCat.id);
    toast('Categoria criada!');
  }
});
$('catDeleteBtn').addEventListener('click',()=>{
  ensureMusicCategories();
  const id=$('catEditId').value;
  if(!id||data.musicCategories.length<=1)return;
  if(!confirm('Excluir esta categoria? As músicas dela serão movidas para outra categoria.'))return;
  const fallback=data.musicCategories.find(c=>c.id!==id);
  data.music.forEach(t=>{if((t.category||'personalizada')===id)t.category=fallback.id});
  localTracks.forEach(t=>{if(t.category===id)t.category=fallback.id});
  data.musicCategories=data.musicCategories.filter(c=>c.id!==id);
  if(musicCategory===id)musicCategory=fallback.id;
  save();
  closeCategoryForm();
  selectMusicCategory(musicCategory);
  toast('Categoria excluída.');
});

function loadYouTubeApi(){
  if(window.YT&&window.YT.Player)return Promise.resolve();
  if(youtubeApiPromise)return youtubeApiPromise;
  youtubeApiPromise=new Promise((resolve,reject)=>{
    const prior=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=function(){if(typeof prior==='function')prior();resolve()};
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
    script.onerror=()=>{youtubeApiPromise=null;reject(new Error('Falha ao carregar API do YouTube'))};
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}
function youtubeParams(raw){
  try{
    const u=new URL(raw),host=u.hostname.toLowerCase();
    if(!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host))return null;
    const id=host==='youtu.be'?u.pathname.slice(1).split('/')[0]:u.searchParams.get('v')||(/^\/(shorts|embed|live)\//.test(u.pathname)?u.pathname.split('/')[2]:null);
    if(id&&/^[\w-]{11}$/.test(id))return {videoId:id};
    const list=u.searchParams.get('list');
    if(list&&/^[\w-]{10,100}$/.test(list))return {playlist:list};
    return null;
  }catch{return null}
}
function validatedMusicUrl(url){
  try{
    const u=new URL(url);
    return (u.protocol==='https:'||u.protocol==='http:')&&!!youtubeParams(url);
  }catch{return false}
}
function stopYoutube(){
  clearInterval(youtubeTick);youtubeTick=null;youtubeReady=false;
  if(youtubePlayer){try{youtubePlayer.destroy()}catch{}youtubePlayer=null}
  $('playerBox').replaceChildren();
  $('musicInlineState').textContent='Player interno';
}
function syncYoutubeProgress(){
  if(!youtubeReady||!youtubePlayer||activeMusicType!=='youtube')return;
  try{
    const duration=youtubePlayer.getDuration()||0,current=youtubePlayer.getCurrentTime()||0;
    $('musicCurrentTime').textContent=musicTime(current);$('musicTotalTime').textContent=musicTime(duration);
    $('musicSeek').value=duration>0?String(Math.round(current/duration*100)):'0';
  }catch{}
}
async function playYoutubeTrack(track){
  const req=++youtubeRequest,params=youtubeParams(track.url);
  if(!params){musicStatus('Link do YouTube inválido.');return}
  $('playerBox').replaceChildren();
  if(!['http:','https:'].includes(location.protocol)){
    $('musicInlineState').textContent='Indisponível';
    musicStatus('Reprodução disponível apenas em endereço web (HTTPS).');
    return;
  }
  musicStatus('Abrindo no player do site…');$('musicInlineState').textContent='Carregando';
  try{
    await loadYouTubeApi();
    if(req!==youtubeRequest||activeMusicId!==track.id||activeMusicType!=='youtube')return;
    const videoUrl=new URL(params.videoId
      ? 'https://www.youtube.com/embed/'+encodeURIComponent(params.videoId)
      : 'https://www.youtube.com/embed/videoseries');
    videoUrl.searchParams.set('enablejsapi','1');
    videoUrl.searchParams.set('origin',location.origin);
    videoUrl.searchParams.set('playsinline','1');
    videoUrl.searchParams.set('controls','1');
    videoUrl.searchParams.set('rel','0');
    if(params.playlist)videoUrl.searchParams.set('list',params.playlist);
    const iframe=document.createElement('iframe');
    iframe.id='youtubePlayerMount';
    iframe.title='Reprodutor do YouTube — Fit Music';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen=true;
    iframe.setAttribute('loading','eager');
    iframe.src=videoUrl.toString();
    $('playerBox').appendChild(iframe);
    const playerVars={playsinline:1,controls:1,rel:0,origin:location.origin};
    if(params.playlist){playerVars.listType='playlist';playerVars.list=params.playlist}
    youtubePlayer=new YT.Player(iframe,{
      width:'100%',height:'315',playerVars,
      events:{
        onReady(event){
          if(req!==youtubeRequest)return;
          youtubeReady=true;event.target.setVolume(Number($('musicVolume').value));
          $('musicInlineState').textContent='Pronto';
          if(params.playlist){
            try{event.target.loadPlaylist({list:params.playlist,listType:'playlist',index:0})}catch{}
          }else{
            try{event.target.playVideo()}catch{}
          }
          musicStatus('Reproduzindo no player do site.');
          youtubeTick=setInterval(syncYoutubeProgress,500);
        },
        onStateChange(event){
          if(req!==youtubeRequest)return;
          if(event.data===YT.PlayerState.PLAYING){$('musicToggle').textContent='❚❚';$('musicInlineState').textContent='Reproduzindo';musicStatus('Reproduzindo.');}
          else if(event.data===YT.PlayerState.PAUSED){$('musicToggle').textContent='▶';$('musicInlineState').textContent='Pausado';musicStatus('Pausado.');}
          else if(event.data===YT.PlayerState.ENDED){$('musicToggle').textContent='▶';if(!params.playlist&&musicQueue().length>1)nextMusic(1);else musicStatus('Fim da reprodução.');}
          syncYoutubeProgress();
        },
        onError(){if(req===youtubeRequest){$('musicInlineState').textContent='Indisponível';musicStatus('Não foi possível reproduzir este vídeo aqui. Verifique o link.');}}
      }
    });
  }catch{if(req===youtubeRequest)musicStatus('Não foi possível carregar o player. Verifique sua conexão.');}
}

const musicAudio=$('musicAudio');musicAudio.volume=.8;
function musicAll(){
  ensureMusicCategories();
  const validIds=new Set(data.musicCategories.map(c=>c.id));
  const fallbackId=data.musicCategories[0].id;
  return [
    ...data.music.map(t=>({...t,kind:t.service||'youtube',category:validIds.has(t.category)?t.category:fallbackId})),
    ...localTracks.map(t=>({...t,category:validIds.has(t.category)?t.category:fallbackId}))
  ];
}
function musicQueue(){return musicAll().filter(t=>t.category===musicCategory)}
function musicStatus(message){$('musicStatus').textContent=message}
function musicTime(secs){if(!Number.isFinite(secs))return '0:00';const t=Math.max(0,Math.floor(secs));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
function stopCurrentMusic(){++youtubeRequest;stopYoutube();musicAudio.pause();musicAudio.removeAttribute('src');musicAudio.load();activeMusicId=null;activeMusicType=null;$('musicToggle').textContent='▶';$('musicNowTitle').textContent='Nenhuma música selecionada';$('musicNowSubtitle').textContent=getMusicCategory(musicCategory).name;$('musicPlayerMode').textContent='YouTube';$('musicCurrentTime').textContent='0:00';$('musicTotalTime').textContent='0:00';$('musicSeek').value=0}
function selectMusicCategory(category){
  ensureMusicCategories();
  const cat=getMusicCategory(category);
  musicCategory=cat.id;
  renderMusicCategories();
  renderMusic();
  if(!musicQueue().length)musicStatus('Adicione um link do YouTube para '+cat.name.toLowerCase()+'.');
  else musicStatus(musicQueue().length+' item(ns) em '+cat.name+'.');
}
function playMusicItem(id){
  const t=musicAll().find(item=>item.id===id);
  if(!t){musicStatus('Música não encontrada.');return}
  if(t.kind!=='local'&&!validatedMusicUrl(t.url)){musicStatus('Link inválido. Adicione um link do YouTube.');return}
  musicCategory=t.category;selectMusicCategory(musicCategory);stopCurrentMusic();
  activeMusicId=t.id;activeMusicType=t.kind==='local'?'local':'youtube';
  $('musicNowTitle').textContent=t.name;$('musicNowSubtitle').textContent=getMusicCategory(t.category).name;
  $('musicPlayerMode').textContent=activeMusicType==='local'?'Áudio local':'YouTube';
  if(activeMusicType==='local'){
    musicAudio.src=t.url;
    musicAudio.play().then(()=>$('musicToggle').textContent='❚❚').catch(()=>musicStatus('Toque em ▶ para iniciar o áudio.'));
    musicStatus('Reproduzindo áudio selecionado.');
  }else{
    playYoutubeTrack(t);
  }
  renderMusic();
}
function nextMusic(delta){let q=musicQueue();if(!q.length){musicStatus('Esta categoria não tem músicas.');return}let i=q.findIndex(x=>x.id===activeMusicId);let next=q[(i+delta+q.length)%q.length];playMusicItem(next.id)}
function renderMusic(){
  renderMusicCategories();
  let queue=musicQueue();
  $('musicCount').textContent=queue.length;
  $('musicList').innerHTML=queue.length?queue.map(t=>`<div class="item"><div class="track-heading"><b>${esc(t.name)}</b><small>${t.kind==='local'?'♫ Áudio local':'▶ YouTube'}</small></div><button type="button" class="btn primary" data-play="${esc(t.id)}" aria-label="Reproduzir ${esc(t.name)}">${t.kind!=='local'?'▶ Ouvir':'▶'}</button><button type="button" class="btn" data-editmusic="${esc(t.id)}" title="Editar música ou categoria" aria-label="Editar ${esc(t.name)}">✎</button><button type="button" class="btn" data-delmusic="${esc(t.id)}" aria-label="Excluir ${esc(t.name)}">✕</button></div>`).join(''):'<p class="notice">Sua trilha está vazia. Cole um link do YouTube acima.</p>';
}
function editMusicItem(id){
  const t=musicAll().find(x=>x.id===id);if(!t)return;
  $('musicEditId').value=t.id;
  $('musicCategory').value=t.category;
  $('musicName').value=t.name;
  if(t.kind==='local'){
    $('musicLinkLabel').classList.add('hidden');
    $('musicUrl').required=false;
    $('musicUrl').value='';
  }else{
    $('musicLinkLabel').classList.remove('hidden');
    $('musicUrl').required=true;
    $('musicUrl').value=t.url;
  }
  $('musicFormTitle').textContent='Editar música ou categoria';
  $('musicSubmitBtn').textContent='Salvar alterações';
  $('musicCancelEdit').classList.remove('hidden');
  $('musicForm').scrollIntoView({behavior:'smooth',block:'nearest'});
  $('musicName').focus();
}
function cancelMusicEdit(){
  $('musicForm').reset();
  $('musicEditId').value='';
  $('musicLinkLabel').classList.remove('hidden');
  $('musicUrl').required=true;
  $('musicFormTitle').textContent='Adicionar música do YouTube';
  $('musicSubmitBtn').textContent='＋ Salvar link do YouTube';
  $('musicCancelEdit').classList.add('hidden');
  $('musicCategory').value=musicCategory;
}

$('musicPresets').addEventListener('click',e=>{
  const editBtn=e.target.closest('[data-edit-category]');
  if(editBtn){openCategoryForm(editBtn.dataset.editCategory);return}
  const catBtn=e.target.closest('[data-music-category]');
  if(catBtn)selectMusicCategory(catBtn.dataset.musicCategory);
});
$('musicCategory').addEventListener('change',e=>{
  if(!$('musicEditId').value)selectMusicCategory(e.target.value);
});
$('musicCancelEdit').addEventListener('click',cancelMusicEdit);
$('musicFiles').addEventListener('change',e=>{let files=Array.from(e.target.files||[]),added=0;for(let f of files){if(!(f.type.startsWith('audio/')||/\.(mp3|m4a|ogg|wav|flac)$/i.test(f.name))){continue}localTracks.push({id:uid(),name:f.name.replace(/\.[^.]+$/,''),category:musicCategory,kind:'local',url:URL.createObjectURL(f)});added++}e.target.value='';renderMusic();musicStatus(added?added+' arquivo(s) adicionado(s).':'Nenhum áudio compatível selecionado.');});
$('musicForm').onsubmit=e=>{
  e.preventDefault();
  const editId=$('musicEditId').value;
  const chosenCat=$('musicCategory').value||musicCategory;
  const name=$('musicName').value.trim();
  const url=$('musicUrl').value.trim();
  if(!name)return;
  if(editId){
    const localIdx=localTracks.findIndex(x=>x.id===editId);
    if(localIdx>=0){
      localTracks[localIdx]={...localTracks[localIdx],name,category:chosenCat};
    }else{
      if(!validatedMusicUrl(url)){toast('Informe um link válido do YouTube.');return}
      const idx=data.music.findIndex(x=>x.id===editId);
      if(idx>=0){data.music[idx]={...data.music[idx],name,url,category:chosenCat,service:'youtube'};save();}
    }
    if(activeMusicId===editId){
      $('musicNowTitle').textContent=name;
      $('musicNowSubtitle').textContent=getMusicCategory(chosenCat).name;
    }
    cancelMusicEdit();
    selectMusicCategory(chosenCat);
    toast('Música atualizada!');
    return;
  }
  if(!validatedMusicUrl(url)){toast('Informe um link válido do YouTube.');return}
  let track={id:uid(),name,url,category:chosenCat,service:'youtube'};
  data.music.push(track);save();$('musicForm').reset();selectMusicCategory(chosenCat);toast('Link salvo! Clique em ▶ Ouvir para tocar.');
};
$('musicList').addEventListener('click',e=>{
  let b=e.target.closest('button');if(!b)return;
  if(b.dataset.play){playMusicItem(b.dataset.play);return}
  if(b.dataset.editmusic){editMusicItem(b.dataset.editmusic);return}
  if(b.dataset.delmusic){
    let id=b.dataset.delmusic;if(!confirm('Excluir esta música da lista?'))return;
    if(activeMusicId===id)stopCurrentMusic();
    if($('musicEditId').value===id)cancelMusicEdit();
    let local=localTracks.find(x=>x.id===id);
    if(local){URL.revokeObjectURL(local.url);localTracks=localTracks.filter(x=>x.id!==id)}
    else{data.music=data.music.filter(x=>x.id!==id);save()}
    renderMusic();toast('Música removida.');
  }
});
$('musicToggle').addEventListener('click',()=>{
  if(activeMusicType==='youtube'){
    if(!youtubeReady||!youtubePlayer){musicStatus('Carregando player…');return}
    const state=youtubePlayer.getPlayerState();
    if(state===YT.PlayerState.PLAYING)youtubePlayer.pauseVideo();else youtubePlayer.playVideo();
    return;
  }
  if(!activeMusicId){let first=musicQueue()[0];if(first)playMusicItem(first.id);else musicStatus('Adicione uma música antes de reproduzir.');return}
  if(musicAudio.paused){musicAudio.play().then(()=>$('musicToggle').textContent='❚❚').catch(()=>musicStatus('Não foi possível iniciar a reprodução.'))}else{musicAudio.pause();$('musicToggle').textContent='▶'}
});
$('musicPrev').addEventListener('click',()=>nextMusic(-1));$('musicNext').addEventListener('click',()=>nextMusic(1));
$('musicVolume').addEventListener('input',e=>{const vol=Number(e.target.value);musicAudio.volume=vol/100;if(youtubeReady&&youtubePlayer)youtubePlayer.setVolume(vol)});
$('musicSeek').addEventListener('input',e=>{if(activeMusicType==='local'&&Number.isFinite(musicAudio.duration))musicAudio.currentTime=Number(e.target.value)/100*musicAudio.duration;else if(activeMusicType==='youtube'&&youtubeReady&&youtubePlayer){const duration=youtubePlayer.getDuration();if(duration>0)youtubePlayer.seekTo(Number(e.target.value)/100*duration,true)}});
musicAudio.addEventListener('timeupdate',()=>{$('musicCurrentTime').textContent=musicTime(musicAudio.currentTime);$('musicTotalTime').textContent=musicTime(musicAudio.duration);$('musicSeek').value=Number.isFinite(musicAudio.duration)&&musicAudio.duration>0?String(Math.round(musicAudio.currentTime/musicAudio.duration*100)):'0'});
musicAudio.addEventListener('loadedmetadata',()=>$('musicTotalTime').textContent=musicTime(musicAudio.duration));
musicAudio.addEventListener('pause',()=>{if(activeMusicType==='local')$('musicToggle').textContent='▶'});
musicAudio.addEventListener('play',()=>{if(activeMusicType==='local')$('musicToggle').textContent='❚❚'});
musicAudio.addEventListener('ended',()=>{if(musicQueue().length>1)nextMusic(1);else{$('musicToggle').textContent='▶';musicStatus('Fim da trilha.')}});
musicAudio.addEventListener('error',()=>{if(activeMusicType==='local')musicStatus('Formato de áudio não suportado ou arquivo indisponível.');});
selectMusicCategory('pesado');

function syncProfile(){let p={...initial.profile,...data.profile};for(let k of ['name','age','gender','height','weight','goal','body','water','reminder'])$('profile'+k[0].toUpperCase()+k.slice(1)).value=p[k]??''}
$('profileForm').onsubmit=e=>{e.preventDefault();for(let k of ['name','age','gender','height','weight','goal','body','water','reminder'])data.profile[k]=$('profile'+k[0].toUpperCase()+k.slice(1)).value;if(data.profile.gender==='Feminino')gymGender='feminino';else if(data.profile.gender==='Masculino')gymGender='masculino';save();render();toast('Perfil atualizado.')};
let reminderTimer=null;
async function setNotification(){if(!('Notification' in window)){toast('Notificações indisponíveis neste navegador.');return}const permission=await Notification.requestPermission();data.settings.notify=permission==='granted';save();applyReminders();toast(data.settings.notify?'Notificações de água ativadas.':'Permissão de notificações não concedida.')}
function applyReminders(){clearInterval(reminderTimer);$('notifyBtn').textContent=data.settings.notify?'🔔 Avisos: ON':'🔔 Avisos';$('notifyBtn').classList.toggle('selected',!!data.settings.notify);if(data.settings.notify&&'Notification' in window&&Notification.permission==='granted'){const min=Math.max(10,Number(data.profile.reminder)||60);reminderTimer=setInterval(()=>{if(document.visibilityState==='visible')new Notification('Fitness Orbit',{body:'Hora de conferir sua hidratação! 💧'})},min*60000)}}
$('notifyBtn').onclick=()=>{if(data.settings.notify){data.settings.notify=false;save();applyReminders();toast('Notificações de água desativadas.')}else setNotification()};
$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='fitness-orbit-backup-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('importFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let parsed=JSON.parse(await f.text());if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.workouts)||!Array.isArray(parsed.history)||!Array.isArray(parsed.activities)||!Array.isArray(parsed.measures)||!Array.isArray(parsed.music)||!parsed.profile||!parsed.settings||!parsed.water)throw Error('Formato não reconhecido');if(confirm('Substituir todos os dados atuais pelos dados do backup?')){data={...structuredClone(initial),...parsed,profile:{...structuredClone(initial.profile),...(parsed.profile||{})},settings:{...structuredClone(initial.settings),...(parsed.settings||{})}};ensureMusicCategories();save();theme();syncProfile();render();toast('Backup importado!')}}catch{toast('Arquivo de backup inválido.')}e.target.value=''};
function render(){renderHome();renderWorkouts();renderActivities();renderMeasures();renderMusic();syncProfile();applyReminders();if(!$('academiaGallery').classList.contains('hidden'))renderGymGallery()}

const exerciseLibrary=[
 {id:'agachamento',name:'Agachamento livre',types:['Academia','Casa','Calistenia'],motion:'squat',primary:['quadriceps','gluteos'],secondary:['posterior','core'],steps:['Afaste os pés aproximadamente na largura dos ombros.','Flexione quadril e joelhos mantendo o tronco estável.','Empurre o chão e retorne sem perder o alinhamento.'],errors:['Joelhos colapsando para dentro','Perder controle da lombar'],dose:'3 × 10–12'},
 {id:'supino',name:'Supino reto',types:['Academia'],motion:'press',primary:['peitoral'],secondary:['triceps','ombros'],steps:['Deite no banco com pés firmes no solo.','Desça a barra com controle em direção ao peito.','Empurre sem tirar o quadril do banco.'],errors:['Quicar a barra no peito','Carga acima da capacidade'],dose:'3 × 8–12'},
 {id:'remada',name:'Remada com halteres',types:['Academia','Casa'],motion:'row',primary:['costas'],secondary:['biceps','posterior','core'],steps:['Incline o tronco e mantenha a coluna neutra.','Puxe o peso em direção ao quadril.','Retorne devagar, evitando girar o tronco.'],errors:['Arredondar as costas','Puxar com impulso'],dose:'3 × 10–12'},
 {id:'desenvolvimento',name:'Desenvolvimento de ombros',types:['Academia','Casa'],motion:'shoulder',primary:['ombros'],secondary:['triceps','core'],steps:['Mantenha punhos alinhados e abdômen firme.','Empurre os pesos acima da cabeça com controle.','Retorne à posição inicial sem exagerar na curvatura lombar.'],errors:['Arquear muito a lombar','Usar impulso'],dose:'3 × 8–12'},
 {id:'flexao',name:'Flexão de braço',types:['Casa','Calistenia'],motion:'push',primary:['peitoral'],secondary:['triceps','ombros','core'],steps:['Apoie mãos sob ou ligeiramente fora da linha dos ombros.','Mantenha quadris e tronco alinhados.','Desça até amplitude confortável e empurre de volta.'],errors:['Quadril despencando','Abrir excessivamente os cotovelos'],dose:'3 × 6–12'},
 {id:'prancha',name:'Prancha',types:['Casa','Calistenia','Academia'],motion:'plank',primary:['core'],secondary:['ombros','gluteos'],steps:['Apoie antebraços no chão e alinhe ombros e cotovelos.','Ative abdômen e glúteos sem prender a respiração.','Mantenha o corpo alinhado pelo tempo escolhido.'],errors:['Elevar demais o quadril','Deixar a lombar afundar'],dose:'3 × 20–40 s'},
 {id:'barra',name:'Barra fixa',types:['Calistenia','Academia'],motion:'pull',primary:['costas'],secondary:['biceps','core'],steps:['Use barra firme e pegada confortável.','Puxe levando o peito em direção à barra.','Desça de modo controlado, sem balançar.'],errors:['Balançar o corpo','Forçar pescoço para cima'],dose:'3 × 3–8'},
 {id:'australiana',name:'Barra australiana',types:['Calistenia','Casa'],motion:'australian',primary:['costas'],secondary:['biceps','core'],steps:['Use apoio sólido e seguro, com pés no chão.','Puxe o peito até perto da barra.','Baixe o tronco com controle.'],errors:['Usar apoio instável','Deixar quadril cair'],dose:'3 × 8–12'},
 {id:'afundo',name:'Afundo alternado',types:['Academia','Casa','Calistenia'],motion:'lunge',primary:['quadriceps','gluteos'],secondary:['posterior','core'],steps:['Dê um passo à frente com espaço para flexionar os joelhos.','Desça mantendo o tronco estável.','Retorne ao centro e alterne as pernas.'],errors:['Passo curto demais','Perder equilíbrio por pressa'],dose:'3 × 8 cada perna'},
 {id:'ponte',name:'Ponte de glúteos',types:['Casa','Calistenia'],motion:'glute',primary:['gluteos'],secondary:['posterior','core'],steps:['Deite de costas com joelhos flexionados.','Empurre os pés no solo e eleve o quadril.','Desça sem bater as costas no chão.'],errors:['Arquear excessivamente a lombar','Afastar muito os pés'],dose:'3 × 12–15'},
 {id:'caminhada',name:'Caminhada',types:['Rua'],motion:'walk',primary:['quadriceps','gluteos'],secondary:['panturrilhas','core'],steps:['Comece num ritmo confortável.','Mantenha postura natural e braços soltos.','Aumente o ritmo gradualmente conforme tolerância.'],errors:['Começar rápido demais','Ignorar dor ou tontura'],dose:'20–40 min'},
 {id:'corrida',name:'Corrida leve',types:['Rua'],motion:'run',primary:['quadriceps','gluteos','panturrilhas'],secondary:['posterior','core'],steps:['Faça aquecimento antes de acelerar.','Mantenha passadas confortáveis e respiração regular.','Reduza o ritmo para finalizar o treino.'],errors:['Aumentar volume abruptamente','Correr com dor persistente'],dose:'10–30 min'},
 {id:'panturrilha',name:'Elevação de panturrilha',types:['Academia','Casa','Calistenia'],motion:'calf',primary:['panturrilhas'],secondary:['core'],steps:['Fique em pé com apoio seguro se necessário.','Eleve os calcanhares sem usar impulso.','Retorne devagar até apoiar o pé.'],errors:['Balançar o tronco','Fazer repetições rápidas demais'],dose:'3 × 12–20'},
 {id:'joelhos',name:'Elevação de joelhos',types:['Calistenia','Casa'],motion:'knees',primary:['core'],secondary:['quadriceps'],steps:['Use apoio ou barra segura conforme a versão.','Eleve os joelhos sem balançar.','Retorne devagar mantendo o abdômen ativo.'],errors:['Balançar para ganhar impulso','Forçar a lombar'],dose:'3 × 8–12'}
];
const muscleNames={peitoral:'Peitoral',ombros:'Ombros',triceps:'Tríceps',biceps:'Bíceps',costas:'Costas',core:'Abdômen / core',quadriceps:'Quadríceps',gluteos:'Glúteos',posterior:'Posteriores da coxa',panturrilhas:'Panturrilhas'};
function anatomyFigure(view,ex){const m=(id)=>ex.primary.includes(id)?' primary-muscle':ex.secondary.includes(id)?' secondary-muscle':'';const part=(id,x,y,w,h,rx=5)=>`<rect class="body-part${m(id)}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;return `<svg class="anatomy-figure" viewBox="0 0 110 235" role="img" aria-label="Vista ${view==='front'?'frontal':'traseira'} dos músculos destacados"><circle cx="55" cy="19" r="13" fill="var(--muted)" opacity=".65"/><rect x="45" y="31" width="20" height="13" rx="5" fill="var(--line)"/>${part('ombros',17,43,22,23,8)}${part('ombros',71,43,22,23,8)}${view==='front'?part('peitoral',39,47,32,28,8):part('costas',38,44,34,51,7)}${part(view==='front'?'biceps':'triceps',13,70,17,42,8)}${part(view==='front'?'biceps':'triceps',80,70,17,42,8)}${part('core',40,77,30,51,7)}${part('gluteos',40,129,30,18,7)}${part(view==='front'?'quadriceps':'posterior',37,149,16,47,6)}${part(view==='front'?'quadriceps':'posterior',57,149,16,47,6)}${part('panturrilhas',37,199,15,32,6)}${part('panturrilhas',58,199,15,32,6)}<text x="55" y="10" text-anchor="middle" fill="var(--muted)" font-size="8">${view==='front'?'FRENTE':'COSTAS'}</text></svg>`}
function normStr(s){return String(s).toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function matchGymExercise(line){
  const lower=normStr(line);
  return gymExercises.slice().sort((a,b)=>b.name.length-a.name.length).find(ex=>lower.includes(normStr(ex.name)))||null;
}
function matchExercise(line){const lower=normStr(line);const aliases=[['agachamento','agachamento'],['supino','supino'],['remada','remada'],['desenvolvimento','desenvolvimento'],['flexao','flexao'],['prancha','prancha'],['barra australiana','australiana'],['barra fixa','barra'],['afundo','afundo'],['ponte','ponte'],['caminhada','caminhada'],['trote','corrida'],['corrida','corrida'],['panturrilha','panturrilha'],['elevacao de joelhos','joelhos']];const pair=aliases.find(([phrase])=>lower.includes(phrase));return pair?exerciseLibrary.find(ex=>ex.id===pair[1]):null}
function showExercise(id){
 const ex=exerciseLibrary.find(x=>x.id===id);if(!ex)return;
 const panel=$('exercisePreview');panel.classList.remove('hidden');
 panel.innerHTML=`<div class="row"><div><div class="eyebrow">GUIA DO EXERCÍCIO</div><h3 class="showcase-heading">${esc(ex.name)}</h3><div class="tiny">${esc(ex.types.join(' • '))}</div></div><button type="button" class="btn" id="hideExercise">Fechar ✕</button></div><div class="muscle-scene" style="margin-top:16px"><b>Músculos trabalhados</b><div class="anatomy-pair">${anatomyFigure('front',ex)}${anatomyFigure('back',ex)}</div><div class="muscle-legend"><span>Principal</span><span>Secundário</span></div><p class="tiny">Principal: ${esc(ex.primary.map(x=>muscleNames[x]).join(', '))}</p><p class="tiny">Secundário: ${esc(ex.secondary.map(x=>muscleNames[x]).join(', '))}</p></div><div class="two"><div><h4>Como executar</h4><ol class="steps-list">${ex.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></div><div><h4>Erros comuns</h4><div class="cue-box">${ex.errors.map(x=>'⚠ '+esc(x)).join('<br>')}<p class="tiny">Sugestão: ${esc(ex.dose)}</p></div></div></div><div class="row" style="margin-top:14px"><button class="btn primary" type="button" data-add-exercise="${esc(ex.id)}">+ Adicionar ao treino</button></div>`;
 panel.querySelector('#hideExercise').onclick=()=>panel.classList.add('hidden');panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function addExercise(id){const ex=exerciseLibrary.find(x=>x.id===id);if(!ex)return;const form=$('workoutEditor');if(!form.classList.contains('opened')){selectWorkoutType(ex.types[0]);$('workoutExercises').value='';}const area=$('workoutExercises');const line=ex.name+' — '+ex.dose;const current=area.value.trim();area.value=current?current+'\n'+line:line;toast(ex.name+' adicionado ao treino');}
function renderExerciseTiles(){
 const term=normStr($('exerciseSearch').value),cat=$('exerciseCategory').value;
 const found=exerciseLibrary.filter(x=>(cat==='Todos'||x.types.includes(cat))&&normStr([x.name,...x.primary.map(m=>muscleNames[m]),...x.secondary.map(m=>muscleNames[m])].join(' ')).includes(term));
 $('exerciseTiles').innerHTML=found.map(x=>`<article class="exercise-tile"><div class="tile-top"><strong>${esc(x.name)}</strong><span class="tag">${esc(x.types[0])}</span></div><span class="tiny">Músculos: ${esc(x.primary.map(m=>muscleNames[m]).join(' + '))}</span><div class="tile-tools"><button type="button" class="btn" data-show-exercise="${esc(x.id)}">Ver instruções e músculos</button><button type="button" class="btn" data-add-exercise="${esc(x.id)}">+ Treino</button></div></article>`).join('')||'<p class="notice">Nenhum exercício encontrado para este filtro.</p>';
}
function renderWorkoutExerciseButtons(){
  document.querySelectorAll('[data-exercise-buttons]').forEach(container=>{
    const id=container.dataset.exerciseButtons,w=data.workouts.find(x=>x.id===id);if(!w)return;
    const btns=[];const seen=new Set();
    w.exercises.split('\n').forEach(line=>{
      const g=matchGymExercise(line);
      if(g&&!seen.has('g:'+g.id)){seen.add('g:'+g.id);btns.push(`<button type="button" class="btn" data-show-gym="${esc(g.id)}">📷 ${esc(g.name)} · ${esc(g.group)}</button>`);return}
      const ex=matchExercise(line);
      if(ex&&!seen.has('e:'+ex.id)){seen.add('e:'+ex.id);btns.push(`<button type="button" class="btn" data-show-exercise="${esc(ex.id)}">${esc(ex.name)} · músculos</button>`)}
    });
    container.innerHTML=btns.join('');
  });
}
$('exerciseSearch').addEventListener('input',renderExerciseTiles);$('exerciseCategory').addEventListener('change',renderExerciseTiles);
$('treinos').addEventListener('click',event=>{const btn=event.target.closest('button');if(!btn)return;if(btn.dataset.showExercise){showExercise(btn.dataset.showExercise)}if(btn.dataset.addExercise){addExercise(btn.dataset.addExercise)}});
renderExerciseTiles();

if(data.profile.gender==='Feminino')gymGender='feminino';
else if(data.profile.gender==='Masculino')gymGender='masculino';
setGymGender(gymGender);
$('dateLabel').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});theme();render();

/* Alien Music KM */
(()=>{
  const by=id=>document.getElementById(id),open=by('radioOpen'),stop=by('radioStop'),frame=by('radioFrame'),audio=by('radioAudio'),status=by('radioStatus');
  const RADIO_STREAM_URL='';

  function halt(){
    frame.replaceChildren();
    frame.hidden=true;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    stop.disabled=true;
    open.disabled=false;
  }

  open.addEventListener('click',()=>{
    halt();
    open.disabled=true;
    stop.disabled=false;
    if(RADIO_STREAM_URL){
      audio.src=RADIO_STREAM_URL;
      status.textContent='Conectando à rádio…';
      audio.play().catch(()=>{status.textContent='Não foi possível iniciar o áudio automaticamente.'});
    }else{
      const f=document.createElement('iframe');
      f.src='https://zeno.fm/player/alien-music-km';
      f.title='Rádio Alien Music KM';
      f.width='300';
      f.height='250';
      f.scrolling='no';
      f.allow='autoplay';
      frame.append(f);
      frame.hidden=false;
      status.textContent='Pressione o play no player da rádio se não iniciar sozinho.';
    }
  });

  stop.addEventListener('click',()=>{
    halt();
    status.textContent='Rádio desligada.';
  });

  audio.addEventListener('playing',()=>{status.textContent='Rádio ligada.'});
  audio.addEventListener('error',()=>{if(audio.getAttribute('src'))status.textContent='Transmissão indisponível no momento.'});
})();
