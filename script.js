'use strict';const KEY='fitness-orbit-v1',today=()=>new Date().toLocaleDateString('sv-SE'),now=()=>new Date().toISOString(),uid=()=>String(Date.now())+Math.random().toString(36).slice(2,7);const initial={profile:{name:'',age:'',gender:'',height:'',weight:'',goal:'saude',body:'',water:2000,reminder:60},water:{},workouts:[],history:[],activities:[],measures:[],music:[],settings:{theme:'azul',light:false,notify:false}};let data;try{const stored=JSON.parse(localStorage.getItem(KEY));data=stored&&typeof stored==='object'?{...structuredClone(initial),...stored}:structuredClone(initial)}catch{data=structuredClone(initial)};const $=id=>document.getElementById(id),all=s=>document.querySelectorAll(s),save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{toast('Não foi possível salvar. Verifique o espaço do navegador.')}};function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function toast(s){$('toast').textContent=s;$('toast').classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.add('hidden'),3600)}const n=(v,d=0)=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});const titles={inicio:'Seu movimento começa aqui.',treinos:'Treino é constância.',alimentacao:'Alimente seu objetivo.',atividade:'Lá fora, o mundo é pista.',evolucao:'Cada conquista conta.',musica:'Entre no seu ritmo.',perfil:'Seu espaço, suas regras.'};function page(p){all('.sections>section').forEach(e=>e.classList.toggle('active',e.id===p));all('.nav').forEach(e=>e.classList.toggle('on',e.dataset.page===p));$('pageTitle').textContent=titles[p];window.scrollTo({top:0,behavior:'smooth'});render()}all('[data-page]').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));all('[data-go]').forEach(b=>b.addEventListener('click',()=>page(b.dataset.go)));function theme(){data.settings={...initial.settings,...data.settings};if(!['azul','rosa','roxo','vermelho'].includes(data.settings.theme))data.settings.theme='azul';document.body.dataset.theme=data.settings.theme;document.body.classList.toggle('light',!!data.settings.light);all('[data-theme-choice]').forEach(b=>{const active=b.dataset.themeChoice===data.settings.theme;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});all('[data-mode-choice]').forEach(b=>{const active=(b.dataset.modeChoice==='light')===!!data.settings.light;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.body).getPropertyValue('--bg').trim()}all('[data-theme-choice]').forEach(b=>b.onclick=()=>{data.settings.theme=b.dataset.themeChoice;save();theme()});all('[data-mode-choice]').forEach(b=>b.onclick=()=>{data.settings.light=b.dataset.modeChoice==='light';save();theme()});function water(){let cur=Number(data.water[today()]||0),target=Number(data.profile.water||2000),pct=Math.max(0,Math.round(cur/target*100));$('waterNow').textContent=n(cur)+' ml';$('waterTarget').textContent='Meta '+n(target)+' ml';$('waterBadge').textContent=pct+'%';$('waterCircle').style.setProperty('--p',Math.min(100,pct)+'%')}all('[data-water]').forEach(b=>b.onclick=()=>{data.water[today()]=Number(data.water[today()]||0)+Number(b.dataset.water);save();water()});$('resetWater').onclick=()=>{if(confirm('Zerar água registrada hoje?')){data.water[today()]=0;save();water()}};const days=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];function renderHome(){water();$('statWorkouts').textContent=data.history.length;$('statWeight').textContent=data.profile.weight?n(data.profile.weight,1):'—';$('statKm').textContent=n(data.activities.reduce((a,v)=>a+(Number(v.km)||0),0),1);let upcoming=data.workouts[0];$('nextWorkout').innerHTML=upcoming?`<b>${esc(upcoming.name)}</b><p class="muted">${esc(upcoming.day)} · ${esc(upcoming.type)} · ${n(upcoming.minutes)} min</p><div class="notice">${esc(upcoming.exercises).replace(/\n/g,'<br>')}</div>`:'Cadastre seu primeiro treino.';let current=new Date().getDay();$('weekStrip').innerHTML=days.slice(1).concat(days[0]).map((d,i)=>`<div class="day" style="${((i+1)%7)===current?'outline:2px solid var(--accent)':''}">${d.slice(0,3)}<b>${data.workouts.filter(w=>w.day===d).length?'●':'–'}</b></div>`).join('')};const workoutTemplates={
Academia:{name:'Treino de musculação',minutes:50,description:'Máquinas, pesos livres e progressão de carga.',exercises:'Agachamento — 3×10 — carga confortável\nSupino — 3×10 — carga confortável\nRemada — 3×12 — carga confortável\nDesenvolvimento de ombros — 3×10\nPrancha — 3×30 segundos'},
Casa:{name:'Treino funcional em casa',minutes:30,description:'Exercícios práticos para fazer em casa no seu ritmo.',exercises:'Agachamento livre — 3×12\nFlexão de braço (ou com joelhos apoiados) — 3×8\nPonte de glúteos — 3×12\nAfundo alternado — 2×10 cada perna\nPrancha — 3×20 segundos'},
Rua:{name:'Caminhada ou corrida ao ar livre',minutes:35,description:'Planeje seu percurso de caminhada ou corrida ao ar livre.',exercises:'Aquecimento: caminhada leve — 5 min\nCaminhada em ritmo confortável — 20 min\nOpcional: trote leve — 5 min\nDesaceleração — 5 min'},
Calistenia:{name:'Treino básico de calistenia',minutes:35,description:'Movimentos com o peso do corpo.',exercises:'Agachamento com peso corporal — 3×12\nFlexão inclinada — 3×8\nBarra australiana (se houver apoio seguro) — 3×8\nElevação de joelhos — 3×10\nPrancha — 3×25 segundos'}
};
function selectWorkoutType(type,edit=false){
 const t=workoutTemplates[type];if(!t)return;
 document.querySelectorAll('[data-choose-workout]').forEach(b=>{const selected=b.dataset.chooseWorkout===type;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
 $('workoutEditor').classList.add('opened');$('workoutType').value=type;
 $('workoutHint').textContent=t.description;
 if(!edit){$('workoutId').value='';$('workoutFormTitle').textContent='Criar treino · '+type;$('workoutName').value=t.name;$('workoutMinutes').value=t.minutes;$('workoutExercises').value=t.exercises;}
 $('workoutEditor').scrollIntoView({behavior:'smooth',block:'start'});
}
$('workoutChoices').onclick=e=>{let btn=e.target.closest('[data-choose-workout]');if(btn)selectWorkoutType(btn.dataset.chooseWorkout)};
$('workoutType').onchange=e=>selectWorkoutType(e.target.value,Boolean($('workoutId').value));
function renderWorkouts(){$('workoutCount').textContent=data.workouts.length+' treino(s)';$('workoutList').innerHTML=data.workouts.length?data.workouts.map(w=>`<div class="item"><div><strong>${esc(w.name)}</strong><small>${esc(w.type)} · ${esc(w.day)} · ${n(w.minutes)} min</small><div class="notice">${esc(w.exercises).replace(/\n/g,'<br>')}</div></div><div class="row"><button class="btn" data-edit="${esc(w.id)}">Editar</button><button class="btn primary" data-done="${esc(w.id)}">Concluir</button><button class="btn" data-del="${esc(w.id)}">Excluir</button></div></div>`).join(''):'Nenhum treino cadastrado.';$('workoutHistory').innerHTML=data.history.length?data.history.slice().reverse().slice(0,25).map(h=>`<div class="item"><div><b>${esc(h.name)}</b><small>${new Date(h.date).toLocaleString('pt-BR')} · ${esc(h.type)} · ${n(h.minutes)} min</small></div><button class="btn" data-delhistory="${esc(h.id)}">Excluir</button></div>`).join(''):'Sem treinos concluídos ainda.'}function clearWorkout(){$('workoutForm').reset();$('workoutId').value='';$('workoutEditor').classList.remove('opened');$('workoutFormTitle').textContent='Novo treino';document.querySelectorAll('[data-choose-workout]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false')})}$('workoutClear').onclick=clearWorkout;$('workoutForm').onsubmit=e=>{e.preventDefault();const id=$('workoutId').value;const w={id:id||uid(),name:$('workoutName').value.trim(),type:$('workoutType').value,day:$('workoutDay').value,minutes:Number($('workoutMinutes').value),exercises:$('workoutExercises').value.trim()};if(!w.name||!w.exercises)return;const pos=data.workouts.findIndex(x=>x.id===id);pos>=0?data.workouts[pos]=w:data.workouts.push(w);save();clearWorkout();render();toast('Treino salvo!')};$('workoutList').onclick=e=>{let b=e.target.closest('button');if(!b)return;let id=b.dataset.edit||b.dataset.done||b.dataset.del,w=data.workouts.find(x=>x.id===id);if(!w)return;if(b.dataset.edit){selectWorkoutType(workoutTemplates[w.type]?w.type:'Rua',true);$('workoutId').value=w.id;$('workoutName').value=w.name;$('workoutType').value=w.type;$('workoutDay').value=w.day;$('workoutMinutes').value=w.minutes;$('workoutExercises').value=w.exercises;$('workoutFormTitle').textContent='Editar treino';$('workoutName').focus()}else if(b.dataset.done){data.history.push({...w,id:uid(),date:now()});save();render();toast('Treino concluído!')}else if(confirm('Excluir este treino?')){data.workouts=data.workouts.filter(x=>x.id!==id);save();render()}};$('workoutHistory').onclick=e=>{let id=e.target.closest('[data-delhistory]')?.dataset.delhistory;if(id&&confirm('Apagar este histórico?')){data.history=data.history.filter(h=>h.id!==id);save();render()}};
const mealSets={comum:{ganhar:[['Café da manhã','Ovos, pão integral e fruta'],['Almoço','Arroz, feijão, frango e legumes'],['Lanche','Iogurte e banana com aveia'],['Jantar','Batata, peixe e salada']],perder:[['Café da manhã','Ovos e fruta'],['Almoço','Arroz, feijão, proteína magra e salada'],['Lanche','Fruta e iogurte natural'],['Jantar','Legumes, proteína e porção de carboidrato']],saude:[['Café da manhã','Fruta, aveia e iogurte'],['Almoço','Arroz, feijão, frango e salada'],['Lanche','Fruta e castanhas'],['Jantar','Omelete, legumes e batata']]},vegetariana:{ganhar:[['Café da manhã','Aveia, leite ou bebida vegetal e banana'],['Almoço','Arroz, feijão, tofu e legumes'],['Lanche','Iogurte ou alternativa vegetal e frutas'],['Jantar','Lentilha, quinoa e vegetais']],perder:[['Café da manhã','Frutas e aveia'],['Almoço','Grão-de-bico, arroz integral e salada'],['Lanche','Iogurte ou alternativa vegetal'],['Jantar','Tofu, verduras e legumes']],saude:[['Café da manhã','Fruta e aveia'],['Almoço','Arroz, feijão e vegetais'],['Lanche','Frutas e sementes'],['Jantar','Lentilha e legumes']]}};$('makeMeal').onclick=()=>{let pref=$('foodPreference').value,goal=data.profile.goal,group=goal==='ganhar'?'ganhar':goal==='perder'?'perder':'saude',notes=$('foodNotes').value.trim(),meals=mealSets[pref][group];$('mealResult').innerHTML=`<div class="tag" style="margin-bottom:12px">Objetivo: ${esc($('profileGoal').selectedOptions[0]?.textContent||goal)}</div>${meals.map(([a,b])=>`<div class="meal"><b>${esc(a)}</b>${esc(b)}</div>`).join('')}${notes?`<p class="notice">Observações: ${esc(notes)}</p>`:''}`};
function gpsDistance(a,b){let R=6371e3,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lon-a.lon)*Math.PI/180,x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}let tracking=null;function secFormat(sec){let h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}function kcal(sec,type){let met=type==='Corrida'?8.3:3.5,kg=Number(data.profile.weight||70);return Math.round(met*3.5*kg/200*(sec/60))}function gpsUi(){let sec=tracking?Math.floor((Date.now()-tracking.started)/1000):0,km=tracking?.meters/1000||0;$('gpsKm').textContent=n(km,2);$('gpsTime').textContent=secFormat(sec);$('gpsCal').textContent=kcal(sec,$('trackType').value);$('startGps').disabled=!!tracking;$('stopGps').disabled=!tracking}function gpsStart(){if(!navigator.geolocation){toast('GPS indisponível neste navegador.');return}if(!window.isSecureContext){toast('Localização disponível apenas em ambiente seguro (HTTPS).');return}tracking={started:Date.now(),meters:0,last:null,watch:null,tick:null,type:$('trackType').value};$('gpsStatus').textContent='Solicitando permissão de localização…';tracking.watch=navigator.geolocation.watchPosition(pos=>{if(!tracking)return;const p={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy};if(p.accuracy>60){$('gpsStatus').textContent='Precisão baixa ('+Math.round(p.accuracy)+' m). Aguardando sinal melhor.';return}if(tracking.last){const d=gpsDistance(tracking.last,p),dt=(pos.timestamp-tracking.lastTimestamp)/1000;if(d>=3&&d<100&&dt>0&&d/dt<12)tracking.meters+=d}tracking.last=p;tracking.lastTimestamp=pos.timestamp;$('gpsStatus').textContent='GPS ativo · precisão aproximada '+Math.round(p.accuracy)+' metros';gpsUi()},err=>{$('gpsStatus').textContent='Erro de GPS: '+err.message;if(err.code===1){gpsStop(false);toast('Permissão de localização negada.')}},{enableHighAccuracy:true,maximumAge:0,timeout:15000});tracking.tick=setInterval(gpsUi,1000);gpsUi()}function gpsStop(keep){if(!tracking)return;const t=tracking;const seconds=Math.floor((Date.now()-t.started)/1000);navigator.geolocation.clearWatch(t.watch);clearInterval(t.tick);tracking=null;if(keep&&seconds>=5){data.activities.push({id:uid(),date:now(),type:t.type,seconds,km:t.meters/1000,cal:kcal(seconds,t.type)});save();toast('Atividade salva!')}else if(keep){toast('Atividade muito curta para registrar (mínimo 5 s).')}$('gpsStatus').textContent='Rastreamento finalizado.';gpsUi();renderActivities()}$('startGps').onclick=gpsStart;$('stopGps').onclick=()=>gpsStop(true);function renderActivities(){$('activityList').innerHTML=data.activities.length?data.activities.slice().reverse().map(x=>`<div class="item"><div><b>${esc(x.type)} · ${n(x.km,2)} km</b><small>${new Date(x.date).toLocaleString('pt-BR')} · ${secFormat(x.seconds)} · ~${n(x.cal)} kcal</small></div><button class="btn" data-delactivity="${esc(x.id)}">Excluir</button></div>`).join(''):'Nenhuma atividade registrada.'}$('activityList').onclick=e=>{let id=e.target.closest('[data-delactivity]')?.dataset.delactivity;if(id&&confirm('Excluir atividade?')){data.activities=data.activities.filter(x=>x.id!==id);save();render()}};
$('measureDate').value=today();$('measureForm').onsubmit=e=>{e.preventDefault();let item={id:uid(),date:$('measureDate').value,weight:Number($('measureWeight').value),waist:$('measureWaist').value,arm:$('measureArm').value};data.measures.push(item);data.measures.sort((a,b)=>a.date.localeCompare(b.date));data.profile.weight=item.weight;save();render();toast('Medição registrada!')};function renderMeasures(){let ms=data.measures;$('measureList').innerHTML=ms.length?ms.slice().reverse().map(x=>`<div class="item"><div><strong>${esc(x.date)} · ${n(x.weight,1)} kg</strong><small>Cintura: ${x.waist?n(x.waist,1)+' cm':'—'} · Braço: ${x.arm?n(x.arm,1)+' cm':'—'}</small></div><button class="btn" data-delmeasure="${esc(x.id)}">Excluir</button></div>`).join(''):'Nenhuma medição registrada.';let last=ms.slice(-8),min=Math.min(...last.map(x=>x.weight),0),max=Math.max(...last.map(x=>x.weight),1);if(last.length){min=Math.min(...last.map(x=>x.weight))-2;max=Math.max(...last.map(x=>x.weight))+2}$('measureChart').innerHTML=last.length?last.map(x=>`<div class="bar" title="${esc(x.date)}: ${n(x.weight,1)} kg" style="height:${Math.max(12,((x.weight-min)/(max-min))*100)}%"><small>${esc(x.date.slice(5))}</small></div>`).join(''):'<span class="muted">O gráfico aparece ao registrar medidas.</span>'}$('measureList').onclick=e=>{let id=e.target.closest('[data-delmeasure]')?.dataset.delmeasure;if(id&&confirm('Excluir medição?')){data.measures=data.measures.filter(x=>x.id!==id);save();render()}};

// Fit Music: links do YouTube + áudios locais.
const musicCategories={pesado:'Treino pesado',cardio:'Corrida e cardio',foco:'Foco e concentração',personalizada:'Playlist personalizada'};
let musicCategory='pesado',localTracks=[],activeMusicId=null,activeMusicType=null;
let youtubePlayer=null,youtubeReady=false,youtubeRequest=0,youtubeTick=null,youtubeApiPromise=null;

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
function musicAll(){return [...data.music.map(t=>({...t,kind:t.service||'youtube',category:t.category||'personalizada'})),...localTracks]}
function musicQueue(){return musicAll().filter(t=>t.category===musicCategory)}
function musicStatus(message){$('musicStatus').textContent=message}
function musicTime(secs){if(!Number.isFinite(secs))return '0:00';const t=Math.max(0,Math.floor(secs));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
function stopCurrentMusic(){++youtubeRequest;stopYoutube();musicAudio.pause();musicAudio.removeAttribute('src');musicAudio.load();activeMusicId=null;activeMusicType=null;$('musicToggle').textContent='▶';$('musicNowTitle').textContent='Nenhuma música selecionada';$('musicNowSubtitle').textContent=musicCategories[musicCategory];$('musicPlayerMode').textContent='YouTube';$('musicCurrentTime').textContent='0:00';$('musicTotalTime').textContent='0:00';$('musicSeek').value=0}
function selectMusicCategory(category){if(!musicCategories[category])return;musicCategory=category;$('musicCategory').value=category;document.querySelectorAll('[data-music-category]').forEach(b=>{let on=b.dataset.musicCategory===category;b.classList.toggle('selected',on);b.querySelector('.music-indicator').textContent=on?'◉':'▷'});renderMusic();if(!musicQueue().length)musicStatus('Adicione um link do YouTube para '+musicCategories[category].toLowerCase()+'.');else musicStatus(musicQueue().length+' item(ns) nesta trilha.')}
function playMusicItem(id){
  const t=musicAll().find(item=>item.id===id);
  if(!t){musicStatus('Música não encontrada.');return}
  if(t.kind!=='local'&&!validatedMusicUrl(t.url)){musicStatus('Link inválido. Adicione um link do YouTube.');return}
  musicCategory=t.category;selectMusicCategory(musicCategory);stopCurrentMusic();
  activeMusicId=t.id;activeMusicType=t.kind==='local'?'local':'youtube';
  $('musicNowTitle').textContent=t.name;$('musicNowSubtitle').textContent=musicCategories[t.category];
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
function renderMusic(){let queue=musicQueue();$('musicCount').textContent=queue.length;$('musicList').innerHTML=queue.length?queue.map(t=>`<div class="item"><div class="track-heading"><b>${esc(t.name)}</b><small>${t.kind==='local'?'♫ Áudio local':'▶ YouTube'}</small></div><button type="button" class="btn primary" data-play="${esc(t.id)}" aria-label="Reproduzir ${esc(t.name)}">${t.kind!=='local'?'▶ Ouvir':'▶'}</button><button type="button" class="btn" data-delmusic="${esc(t.id)}" aria-label="Excluir ${esc(t.name)}">✕</button></div>`).join(''):'<p class="notice">Sua trilha está vazia. Cole um link do YouTube acima.</p>'}

$('musicPresets').addEventListener('click',e=>{let b=e.target.closest('[data-music-category]');if(b)selectMusicCategory(b.dataset.musicCategory)});
$('musicCategory').addEventListener('change',e=>selectMusicCategory(e.target.value));
$('musicFiles').addEventListener('change',e=>{let files=Array.from(e.target.files||[]),added=0;for(let f of files){if(!(f.type.startsWith('audio/')||/\.(mp3|m4a|ogg|wav|flac)$/i.test(f.name))){continue}localTracks.push({id:uid(),name:f.name.replace(/\.[^.]+$/,''),category:musicCategory,kind:'local',url:URL.createObjectURL(f)});added++}e.target.value='';renderMusic();musicStatus(added?added+' arquivo(s) adicionado(s).':'Nenhum áudio compatível selecionado.');});
$('musicForm').onsubmit=e=>{e.preventDefault();const url=$('musicUrl').value.trim();if(!validatedMusicUrl(url)){toast('Informe um link válido do YouTube.');return}let track={id:uid(),name:$('musicName').value.trim(),url,category:musicCategory,service:'youtube'};data.music.push(track);save();$('musicForm').reset();renderMusic();toast('Link salvo! Clique em ▶ Ouvir para tocar.')};
$('musicList').addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.play){playMusicItem(b.dataset.play);return}if(b.dataset.delmusic){let id=b.dataset.delmusic;if(!confirm('Excluir esta música da lista?'))return;if(activeMusicId===id)stopCurrentMusic();let local=localTracks.find(x=>x.id===id);if(local){URL.revokeObjectURL(local.url);localTracks=localTracks.filter(x=>x.id!==id)}else{data.music=data.music.filter(x=>x.id!==id);save()}renderMusic();toast('Música removida.')}});
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

function syncProfile(){let p={...initial.profile,...data.profile};for(let k of ['name','age','gender','height','weight','goal','body','water','reminder'])$('profile'+k[0].toUpperCase()+k.slice(1)).value=p[k]??''}$('profileForm').onsubmit=e=>{e.preventDefault();for(let k of ['name','age','gender','height','weight','goal','body','water','reminder'])data.profile[k]=$('profile'+k[0].toUpperCase()+k.slice(1)).value;save();render();toast('Perfil atualizado.')};let reminderTimer=null;async function setNotification(){if(!('Notification' in window)){toast('Notificações indisponíveis neste navegador.');return}const permission=await Notification.requestPermission();data.settings.notify=permission==='granted';save();applyReminders();toast(data.settings.notify?'Notificações de água ativadas.':'Permissão de notificações não concedida.')}function applyReminders(){clearInterval(reminderTimer);$('notifyBtn').textContent=data.settings.notify?'🔔 Avisos: ON':'🔔 Avisos';$('notifyBtn').classList.toggle('selected',!!data.settings.notify);if(data.settings.notify&&'Notification' in window&&Notification.permission==='granted'){const min=Math.max(10,Number(data.profile.reminder)||60);reminderTimer=setInterval(()=>{if(document.visibilityState==='visible')new Notification('Fitness Orbit',{body:'Hora de conferir sua hidratação! 💧'})},min*60000)}}$('notifyBtn').onclick=()=>{if(data.settings.notify){data.settings.notify=false;save();applyReminders();toast('Notificações de água desativadas.')}else setNotification()};$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='fitness-orbit-backup-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('importFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let parsed=JSON.parse(await f.text());if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.workouts)||!Array.isArray(parsed.history)||!Array.isArray(parsed.activities)||!Array.isArray(parsed.measures)||!Array.isArray(parsed.music)||!parsed.profile||!parsed.settings||!parsed.water)throw Error('Formato não reconhecido');if(confirm('Substituir todos os dados atuais pelos dados do backup?')){data=parsed;save();theme();syncProfile();render();toast('Backup importado!')}}catch{toast('Arquivo de backup inválido.')}e.target.value=''};function render(){renderHome();renderWorkouts();renderActivities();renderMeasures();renderMusic();syncProfile();applyReminders()}

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
function matchExercise(line){const lower=String(line).toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');const aliases=[['agachamento','agachamento'],['supino','supino'],['remada','remada'],['desenvolvimento','desenvolvimento'],['flexao','flexao'],['prancha','prancha'],['barra australiana','australiana'],['barra fixa','barra'],['afundo','afundo'],['ponte','ponte'],['caminhada','caminhada'],['trote','corrida'],['corrida','corrida'],['panturrilha','panturrilha'],['elevacao de joelhos','joelhos']];const pair=aliases.find(([phrase])=>lower.includes(phrase));return pair?exerciseLibrary.find(ex=>ex.id===pair[1]):null}
function showExercise(id){
 const ex=exerciseLibrary.find(x=>x.id===id);if(!ex)return;
 const panel=$('exercisePreview');panel.classList.remove('hidden');
 panel.innerHTML=`<div class="row"><div><div class="eyebrow">GUIA DO EXERCÍCIO</div><h3 class="showcase-heading">${esc(ex.name)}</h3><div class="tiny">${esc(ex.types.join(' • '))}</div></div><button type="button" class="btn" id="hideExercise">Fechar ✕</button></div><div class="muscle-scene" style="margin-top:16px"><b>Músculos trabalhados</b><div class="anatomy-pair">${anatomyFigure('front',ex)}${anatomyFigure('back',ex)}</div><div class="muscle-legend"><span>Principal</span><span>Secundário</span></div><p class="tiny">Principal: ${esc(ex.primary.map(x=>muscleNames[x]).join(', '))}</p><p class="tiny">Secundário: ${esc(ex.secondary.map(x=>muscleNames[x]).join(', '))}</p></div><div class="two"><div><h4>Como executar</h4><ol class="steps-list">${ex.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></div><div><h4>Erros comuns</h4><div class="cue-box">${ex.errors.map(x=>'⚠ '+esc(x)).join('<br>')}<p class="tiny">Sugestão: ${esc(ex.dose)}</p></div></div></div><div class="row"><button class="btn primary" type="button" data-add-exercise="${esc(ex.id)}">+ Adicionar ao treino</button></div>`;
 panel.querySelector('#hideExercise').onclick=()=>panel.classList.add('hidden');panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function addExercise(id){const ex=exerciseLibrary.find(x=>x.id===id);if(!ex)return;const form=$('workoutEditor');if(!form.classList.contains('opened')){selectWorkoutType(ex.types[0]);$('workoutExercises').value='';}const area=$('workoutExercises');const line=ex.name+' — '+ex.dose;const current=area.value.trim();area.value=current?current+'\n'+line:line;toast(ex.name+' adicionado ao treino');}
function renderExerciseTiles(){
 const term=$('exerciseSearch').value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),cat=$('exerciseCategory').value;
 const found=exerciseLibrary.filter(x=>(cat==='Todos'||x.types.includes(cat))&&[x.name,...x.primary.map(m=>muscleNames[m]),...x.secondary.map(m=>muscleNames[m])].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(term));
 $('exerciseTiles').innerHTML=found.map(x=>`<article class="exercise-tile"><div class="tile-top"><strong>${esc(x.name)}</strong><span class="tag">${esc(x.types[0])}</span></div><span class="tiny">Músculos: ${esc(x.primary.map(m=>muscleNames[m]).join(' + '))}</span><div class="tile-tools"><button type="button" class="btn" data-show-exercise="${esc(x.id)}">Ver instruções e músculos</button><button type="button" class="btn" data-add-exercise="${esc(x.id)}">+ Treino</button></div></article>`).join('')||'<p class="notice">Nenhum exercício encontrado para este filtro.</p>';
}
function renderWorkoutExerciseButtons(){document.querySelectorAll('[data-exercise-buttons]').forEach(container=>{const id=container.dataset.exerciseButtons,w=data.workouts.find(x=>x.id===id);if(!w)return;const found=[...new Map(w.exercises.split('\n').map(x=>matchExercise(x)).filter(Boolean).map(x=>[x.id,x])).values()];container.innerHTML=found.map(x=>`<button type="button" class="btn" data-show-exercise="${esc(x.id)}">${esc(x.name)} · músculos</button>`).join('')})}
$('exerciseSearch').addEventListener('input',renderExerciseTiles);$('exerciseCategory').addEventListener('change',renderExerciseTiles);
$('treinos').addEventListener('click',event=>{const btn=event.target.closest('button');if(!btn)return;if(btn.dataset.showExercise){showExercise(btn.dataset.showExercise)}if(btn.dataset.addExercise){addExercise(btn.dataset.addExercise)}});
const priorRenderWorkouts=renderWorkouts;renderWorkouts=function(){priorRenderWorkouts();$('workoutList').querySelectorAll('.item').forEach((node,index)=>{const w=data.workouts[index];if(!w)return;const container=document.createElement('div');container.className='exercise-line-actions';container.dataset.exerciseButtons=w.id;node.firstElementChild?.appendChild(container)});renderWorkoutExerciseButtons()};
renderExerciseTiles();

$('dateLabel').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});theme();render();

/* Alien Music KM */
(()=>{const by=id=>document.getElementById(id),open=by('radioOpen'),stop=by('radioStop'),frame=by('radioFrame'),audio=by('radioAudio'),url=by('radioStream'),status=by('radioStatus');const key='fitnessOrbitRadioStream';try{url.value=localStorage.getItem(key)||''}catch(e){}let saved=url.value;function halt(){frame.replaceChildren();frame.hidden=true;audio.pause();audio.removeAttribute('src');audio.load();audio.hidden=true;stop.disabled=true;open.disabled=false}by('radioSave').addEventListener('click',()=>{let v=url.value.trim();if(v){try{if(new URL(v).protocol!=='https:')throw Error()}catch(e){status.textContent='Informe um endereço HTTPS válido.';return}}halt();saved=v;try{localStorage.setItem(key,v)}catch(e){}status.textContent='Endereço atualizado. Pressione Ouvir rádio.'});open.addEventListener('click',()=>{halt();open.disabled=true;stop.disabled=false;if(saved){audio.hidden=false;audio.src=saved;status.textContent='Conectando à rádio…';audio.play().catch(()=>{status.textContent='Não foi possível iniciar automaticamente. Pressione play no áudio ou confira o endereço.'})}else{const f=document.createElement('iframe');f.src='https://alien-music-km.mdn.live/radio-landing/alien-music-km/';f.title='Rádio Alien Music KM';f.allow='autoplay';frame.append(f);frame.hidden=false;status.textContent='Pressione Listen no player da rádio ou acesse a página oficial.'}});stop.addEventListener('click',()=>{halt();status.textContent='Rádio desligada.'});audio.addEventListener('playing',()=>{status.textContent='Rádio em reprodução.'});audio.addEventListener('error',()=>{if(audio.getAttribute('src'))status.textContent='Transmissão indisponível. Confira o endereço ou acesse a página oficial.'})})();