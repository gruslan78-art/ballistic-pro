const $=id=>document.getElementById(id);
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let gear=load('bp_gear',[{id:1,kind:'Винтовка',name:'Моя винтовка',detail:'Профиль не заполнен'},{id:2,kind:'Оптика',name:'Оптический прицел',detail:'Модель не указана'},{id:3,kind:'Тепловизор',name:'Тепловизионный прицел',detail:'Модель не указана'}]);
let logs=load('bp_logs',[]),points=load('bp_points',[]),unit='deg',pitch=0,roll=0,heading=null;
function render(){ $('gearCount').textContent=gear.length;$('logCount').textContent=logs.length;$('pointCount').textContent=points.length;
$('gearList').innerHTML=gear.map(x=>`<div class="card"><div class="grow"><small>${esc(x.kind)}</small><strong>${esc(x.name)}</strong><span class="muted">${esc(x.detail)}</span></div><button class="delete" data-delgear="${x.id}">УДАЛИТЬ</button></div>`).join('');
$('journalList').innerHTML=logs.length?logs.map((x,i)=>`<div class="card"><div class="grow"><small>ЗАПИСЬ ${logs.length-i}</small><div>${esc(x)}</div></div><button class="delete" data-dellog="${i}">×</button></div>`).join(''):'<div class="empty">Записей пока нет.</div>';
$('plot').innerHTML=points.length?points.map((p,i)=>`<div class="plotrow"><span>${p.d} м</span><div class="track"><div class="bar" style="width:${Math.max(3,p.v/Math.max(1,...points.map(q=>q.v))*100)}%"></div></div><span>${p.v} см</span><button class="delete" data-delpoint="${i}">×</button></div>`).join(''):'<div class="empty">Точки появятся после добавления измерений.</div>';
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function tab(t){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===t));document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab===t));}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>tab(b.dataset.go));
$('addGear').onclick=()=>{let n=$('gearName').value.trim();if(!n)return;gear.unshift({id:Date.now(),kind:$('kind').value,name:n,detail:$('gearDetail').value.trim()||'Без описания'});save('bp_gear',gear);$('gearName').value='';$('gearDetail').value='';render()};
$('addNote').onclick=()=>{let n=$('note').value.trim();if(!n)return;logs.unshift(n);save('bp_logs',logs);$('note').value='';render()};
$('addPoint').onclick=()=>{let d=Number($('pointDistance').value.replace(',','.')),v=Number($('pointValue').value.replace(',','.'));if(!(d>0)||!(v>=0)||!Number.isFinite(d+v))return;points.push({d,v});save('bp_points',points);$('pointDistance').value='';$('pointValue').value='';render()};
$('clearPoints').onclick=()=>{points=[];save('bp_points',points);render()};
document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.delgear){gear=gear.filter(x=>x.id!=b.dataset.delgear);save('bp_gear',gear);render()}if(b.dataset.dellog!==undefined){logs.splice(+b.dataset.dellog,1);save('bp_logs',logs);render()}if(b.dataset.delpoint!==undefined){points.splice(+b.dataset.delpoint,1);save('bp_points',points);render()}});
function angle(v){return unit==='rad'?v*Math.PI/180:unit==='mil'?v*17.7777778:v}
function update(){ $('pitch').textContent=angle(pitch).toFixed(2)+' '+unit;$('roll').textContent=angle(roll).toFixed(2)+' '+unit;$('bubble').style.left=Math.max(6,Math.min(94,50+roll*1.2))+'%';$('bubble').style.top=Math.max(6,Math.min(94,50+pitch*1.2))+'%';$('heading').textContent=heading===null?'нет данных':heading.toFixed(0)+'°'}
document.querySelectorAll('[data-unit]').forEach(b=>b.onclick=()=>{unit=b.dataset.unit;document.querySelectorAll('[data-unit]').forEach(x=>x.classList.toggle('selected',x===b));update()});
async function sensors(){try{if(typeof DeviceOrientationEvent==='undefined')throw Error('Датчики ориентации не поддерживаются этим браузером.');if(typeof DeviceOrientationEvent.requestPermission==='function'){let p=await DeviceOrientationEvent.requestPermission();if(p!=='granted')throw Error('Доступ к датчикам не разрешён.')}window.addEventListener('deviceorientation',e=>{if(e.beta!==null){pitch=e.beta;roll=e.gamma||0;heading=e.webkitCompassHeading??(e.alpha===null?null:(360-e.alpha)%360);update();$('sensorStatus').textContent='Получение данных датчиков активно.'}});$('sensorStatus').textContent='Ожидание показаний датчиков…'}catch(e){$('sensorStatus').textContent=e.message||'Не удалось включить датчики. Откройте страницу по HTTPS.'}}
$('enableSensors').onclick=sensors;render();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
