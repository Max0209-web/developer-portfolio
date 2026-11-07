const layouts = {
  white: {w:7,d:6,wall:0xf2ede2,floor:0xcdb79e,fabric:0xaeb8b4,backdrop:0xfff9ec,lights:2,equipment:'Два импульсных источника, стойки и отражатель.'},
  soft: {w:6,d:5,wall:0xdac9b3,floor:0xaf876a,fabric:0xc98568,backdrop:0xb69a85,lights:1,equipment:'Постоянный свет, отражатель и фон для портретов.'},
  loft: {w:8.3,d:7,wall:0xa18c7d,floor:0x9a7763,fabric:0x637572,backdrop:0x7e8c98,lights:2,equipment:'Два постоянных источника, рабочий стол и свободная зона для команды.'},
};
const rooms = storefronts.kadr.items;
const roomButtons = [...document.querySelectorAll('[data-room]')];
const canvas = document.getElementById('studio-canvas');
const plan = document.getElementById('studio-plan');
const tools = document.getElementById('view-tools');
const help = document.getElementById('view-help');
const surface = document.getElementById('studio-surface');
const modeButtons = [...document.querySelectorAll('[data-view]')];
const orbit = modeButtons.find(button => button.dataset.view === 'orbit');
const reset = modeButtons.find(button => button.dataset.view === 'reset');
const rub = new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0});
let room = rooms[0];
let mode = 'orbit';
let renderRoom;
let adjustCamera;

function drawPlan(layout) {
  const width = layout.w * 39;
  const depth = layout.d * 39;
  const x = (520 - width) / 2;
  const y = (350 - depth) / 2;
  const left = x + 16;
  const right = x + width - 44;
  const floor = '#' + layout.floor.toString(16).padStart(6,'0');
  plan.innerHTML =
    '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + depth + '" rx="4" fill="' + floor + '" stroke="#e7e2d8" stroke-width="3"/>' +
    '<path d="M' + (x+25) + ' ' + y + 'h' + (width-50) + '" stroke="#9de0ff" stroke-width="7"/>' +
    '<rect x="' + left + '" y="' + (y+50) + '" width="77" height="37" rx="4" fill="#50615f"/>' +
    '<rect x="' + right + '" y="' + (y+25) + '" width="23" height="' + (depth-75) + '" rx="2" fill="#eee6d8"/>' +
    '<circle cx="' + (right-28) + '" cy="' + (y+64) + '" r="8" fill="#a64e32"/>' +
    (layout.lights===2 ? '<circle cx="' + (right-28) + '" cy="' + (y+depth-57) + '" r="8" fill="#a64e32"/>' : '') +
    '<text x="260" y="' + (y-10) + '" text-anchor="middle" fill="#d9e5fc" font-size="13">Окна</text>' +
    '<text x="' + (left+39) + '" y="' + (y+73) + '" text-anchor="middle" fill="#fff" font-size="11">Диван</text>' +
    '<text x="' + (right+11) + '" y="' + (y+depth-23) + '" text-anchor="middle" fill="#312e28" font-size="11">Фон</text>' +
    '<text x="' + (right-48) + '" y="' + (y+52) + '" text-anchor="end" fill="#342721" font-size="11">Свет</text>' +
    '<text x="260" y="' + (y+depth+22) + '" text-anchor="middle" fill="#d9e5fc" font-size="13">' + layout.w.toLocaleString('ru-RU') + ' × ' + layout.d.toLocaleString('ru-RU') + ' м</text>';
}
function updateView() {
  const hasModel = Boolean(renderRoom);
  const showOrbit = mode === 'orbit' && hasModel;
  canvas.hidden = !showOrbit;
  plan.toggleAttribute('hidden', showOrbit);
  tools.hidden = !showOrbit;
  orbit.disabled = !hasModel;
  reset.disabled = !showOrbit;
  orbit.setAttribute('aria-pressed', String(showOrbit));
  modeButtons.find(button => button.dataset.view === 'plan').setAttribute('aria-pressed', String(!showOrbit));
  if (showOrbit) help.textContent = 'Потяните за модель или используйте стрелки';
  else if (hasModel) help.textContent = 'План сверху · окно, фон и свет';
}
function selectRoom(id) {
  room = rooms.find(entry => entry.id === id);
  const layout = layouts[id];
  const active = roomButtons.find(button => button.dataset.room === id);
  for (const button of roomButtons) button.setAttribute('aria-pressed',String(button===active));
  document.getElementById('view-room').textContent = active.textContent.trim().replace(/\s+/, ' / ').toUpperCase();
  document.getElementById('room-price').textContent = rub.format(room.price) + ' / ч';
  document.getElementById('room-detail').textContent = room.detail;
  document.getElementById('room-equipment').textContent = layout.equipment;
  document.getElementById('studio-book').dataset.item = id;
  drawPlan(layout);
  renderRoom?.(id,layout);
}
for (const button of roomButtons) button.addEventListener('click',()=>selectRoom(button.dataset.room));
for (const button of modeButtons) button.addEventListener('click',()=>{
  if (button.dataset.view==='reset') { adjustCamera?.('reset'); return; }
  mode=button.dataset.view;
  updateView();
  if (mode==='orbit') adjustCamera?.('draw');
  else if (!renderRoom) help.textContent='План сверху · окно, фон и свет';
});
tools.addEventListener('click',event=>{
  const button=event.target.closest('[data-camera]');
  if (button) adjustCamera?.(button.dataset.camera);
});

selectRoom(room.id);
updateView();

function setup3D(T) {
  const renderer = new T.WebGLRenderer({canvas, antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.setClearColor(0x151d29);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-5,5,5,-5,.1,65);
  scene.add(new T.HemisphereLight(0xfff4e4,0x71839f,2.3));
  const light = new T.DirectionalLight(0xffecd1,2.8);
  light.position.set(2,8,3);
  light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);
  Object.assign(light.shadow.camera,{left:-8,right:8,top:8,bottom:-8});
  light.shadow.normalBias=.04;
  scene.add(light);
  let model;
  let yaw=.68;
  let pitch=.55;
  let zoom=1;
  let roomSpan=7;
  const clamp = (value,min,max)=>Math.max(min,Math.min(max,value));

  function add(group, geometry, color, x,y,z) {
    const mesh = new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.83}));
    mesh.position.set(x,y,z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  const box=(group,w,h,d,color,x,y,z)=>add(group,new T.BoxGeometry(w,h,d),color,x,y,z);
  const cylinder=(group,r,h,color,x,y,z)=>add(group,new T.CylinderGeometry(r,r,h,20),color,x,y,z);

  function sofa(group,color,x,z) {
    box(group,2.25,.31,.92,color,x,.37,z);
    box(group,2.27,.52,.18,color,x,.74,z-.36);
    for (const side of [-1,1]) {
      box(group,.19,.44,.9,color,x+side*1.04,.58,z);
      box(group,.91,.15,.66,color,x+side*.48,.57,z+.04);
      for (const depth of [-.32,.32]) cylinder(group,.045,.23,0x42332b,x+side*.91,.115,z+depth);
    }
  }
  function softbox(group,x,z,angle) {
    const stand = new T.Group();
    stand.position.set(x,0,z);
    stand.rotation.y = angle;
    group.add(stand);
    cylinder(stand,.036,1.77,0x22272c,0,.88,0);
    for (let i=0;i<3;i++) {
      const a=i*Math.PI*2/3;
      const leg=box(stand,.055,.06,.47,0x22272c,Math.sin(a)*.18,.07,Math.cos(a)*.18);
      leg.rotation.y=a;
    }
    box(stand,.72,.51,.21,0x282d34,0,1.81,0);
    const diffuser=box(stand,.64,.43,.04,0xffe2b7,0,1.81,.12);
    diffuser.material.emissive.setHex(0xffcc88);
    diffuser.material.emissiveIntensity=.28;
  }
  function roomGeometry(id,layout) {
    const group = new T.Group();
    const {w,d,wall,floor,fabric,backdrop}=layout;
    box(group,w+.12,.24,d+.12,0x3b4756,0,-.17,0);
    const plank = .35;
    for (let i=0;i<Math.ceil(w/plank);i++) {
      const left=i*plank-w/2;
      const width=Math.min(plank,w/2-left);
      box(group,width-.012,.052,d,new T.Color(floor).multiplyScalar(.9+(i%5)*.035),left+width/2,-.025,0);
    }
    const rear=-d/2;
    box(group,w,.55,.15,wall,0,.275,rear);
    box(group,w,.35,.15,wall,0,2.52,rear);
    for (const x of [-w/2+.2,-w/6,w/6,w/2-.2]) box(group,.24,1.8,.17,wall,x,1.45,rear);
    for (const x of [-w/3,0,w/3]) {
      const pane=box(group,w/3-.28,1.75,.035,0xa7d4f1,x,1.44,rear-.04);
      pane.material.emissive.setHex(0x5697d0);
      pane.material.emissiveIntensity=.33;
      box(group,w/3-.23,.055,.19,0xf3eee6,x,1.34,rear);
    }
    box(group,.15,2.7,d,wall,-w/2,1.35,0);
    box(group,.08,.15,d,0xd2c1af,-w/2+.09,.075,0);
    sofa(group,fabric,-w*.22,-d*.16);
    box(group,2.55,.022,1.65,id==='loft'?0x526275:0xb6aa96,-w*.21,.015,.57);
    cylinder(group,.46,.1,id==='loft'?0x5a4035:0x886a50,-w*.23,.47,.77);
    cylinder(group,.11,.43,0x4d4037,-w*.23,.215,.77);
    const screenX=w*.29;
    box(group,.1,2.15,2.6,backdrop,screenX,1.07,-.68);
    box(group,1.08,.028,2.6,backdrop,screenX-.49,.022,-.68);
    for (const z of [-2, .65]) cylinder(group,.035,2.15,0x2d333a,screenX+.13,1.075,z);
    softbox(group,w*.11,-d*.36,.4);
    if (layout.lights===2) softbox(group,w*.17,d*.32,2.4);
    if (id==='loft') {
      box(group,2.05,.1,1,0x795542,-w*.22,.77,d*.3);
      for (const dx of [-.83,.83]) for (const dz of [-.37,.37]) {
        box(group,.075,.74,.075,0x303842,-w*.22+dx,.37,d*.3+dz);
      }
    } else {
      cylinder(group,.18,.34,0xb17656,-w*.36,.17,d*.31);
      add(group,new T.SphereGeometry(.28,10,8),0x526b50,-w*.36,.49,d*.31);
    }
    return group;
  }
  function draw() {
    if (mode!=='orbit' || !model || canvas.hidden) return;
    const {width,height}=surface.getBoundingClientRect();
    if (!width || !height) return;
    const aspect=width/height;
    const extent=(roomSpan*.66)/zoom;
    const vertical=extent*Math.max(1,1/aspect);
    camera.left=-vertical*aspect;
    camera.right=vertical*aspect;
    camera.top=vertical;
    camera.bottom=-vertical;
    camera.updateProjectionMatrix();
    const distance=15;
    camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,1+Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);
    camera.lookAt(0,.9,0);
    renderer.setSize(width,height,false);
    renderer.render(scene,camera);
  }
  function replaceModel(id,layout) {
    if (model) {
      scene.remove(model);
      model.traverse(object => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        object.material.dispose();
      });
    }
    roomSpan=Math.max(layout.w,layout.d);
    model=roomGeometry(id,layout);
    scene.add(model);
    cameraAction('reset');
  }
  function cameraAction(action) {
    if (action==='reset') { yaw=.68; pitch=.55; zoom=1; }
    if (action==='left') yaw-=.25;
    if (action==='right') yaw+=.25;
    if (action==='zoom-in') zoom=clamp(zoom+.15,.75,1.55);
    if (action==='zoom-out') zoom=clamp(zoom-.15,.75,1.55);
    draw();
  }
  let pointer;
  canvas.addEventListener('pointerdown',event=>{
    if (event.button!==0 || !event.isPrimary) return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if (pointer?.id!==event.pointerId) return;
    yaw-=(event.clientX-pointer.x)*.009;
    pitch=clamp(pitch+(event.clientY-pointer.y)*.007,.18,1.28);
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
    draw();
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(type,()=>{pointer=undefined;});
  }
  new ResizeObserver(draw).observe(surface);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    renderRoom=undefined;
    adjustCamera=undefined;
    updateView();
    help.textContent='3D недоступно. Показан план зала.';
  });
  return {replaceModel,cameraAction};
}

import('./vendor/three.module.min.js').then(three=>{
  const viewer=setup3D(three);
  renderRoom=viewer.replaceModel;
  adjustCamera=viewer.cameraAction;
  updateView();
  selectRoom(room.id);
}).catch(error=>{
  console.warn("Studio 3D preview unavailable:",error);
  renderRoom=undefined;
  adjustCamera=undefined;
  updateView();
  help.textContent='3D недоступно. Показан план зала.';
});
