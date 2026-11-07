const layouts = {
  white: {w:7,d:6,wall:0xeae3d8,floor:0xbe9a72,fabric:0xe2cdb7,backdrop:0xf2efe8,lights:2,equipment:'Два импульсных источника, стойки и отражатель.'},
  soft: {w:6,d:5,wall:0xbca590,floor:0x9b7659,fabric:0xb37158,backdrop:0xa97a67,lights:1,equipment:'Постоянный свет, отражатель и фон для портретов.'},
  loft: {w:8.3,d:7,wall:0x9e7a68,floor:0x908781,fabric:0x647873,backdrop:0x65737a,lights:2,equipment:'Два постоянных источника, рабочий стол и свободная зона для команды.'},
};
const rooms = storefronts.kadr.items;
const roomButtons = [...document.querySelectorAll('[data-room]')];
const canvas = document.getElementById('studio-canvas');
const plan = document.getElementById('studio-plan');
const tools = document.getElementById('view-tools');
const help = document.getElementById('view-help');
const surface = document.getElementById('studio-surface');
const modeButtons = [...document.querySelectorAll('[data-view]')];
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
  const left = x + width*.28 - 38.5;
  const right = x + width*.88 - 11.5;
  const floor = '#' + layout.floor.toString(16).padStart(6,'0');
  plan.innerHTML =
    '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + depth + '" rx="4" fill="' + floor + '" stroke="#e7e2d8" stroke-width="3"/>' +
    '<path d="M' + (x+25) + ' ' + y + 'h' + (width-50) + '" stroke="#9de0ff" stroke-width="7"/>' +
    '<rect x="' + left + '" y="' + (y+50) + '" width="77" height="37" rx="4" fill="#50615f"/>' +
    '<rect x="' + right + '" y="' + (y+25) + '" width="23" height="' + (depth-75) + '" rx="2" fill="#eee6d8"/>' +
    '<circle cx="' + (x+width*.61) + '" cy="' + (y+64) + '" r="8" fill="#a64e32"/>' +
    (layout.lights===2 ? '<circle cx="' + (x+width*.61) + '" cy="' + (y+depth-57) + '" r="8" fill="#a64e32"/>' : '') +
    '<text x="260" y="' + (y-10) + '" text-anchor="middle" fill="#d9e5fc" font-size="13">Окна</text>' +
    '<text x="' + (left+39) + '" y="' + (y+73) + '" text-anchor="middle" fill="#fff" font-size="11">Диван</text>' +
    '<text x="' + (right+11) + '" y="' + (y+depth-23) + '" text-anchor="middle" fill="#312e28" font-size="11">Фон</text>' +
    '<text x="' + (right-48) + '" y="' + (y+52) + '" text-anchor="end" fill="#342721" font-size="11">Свет</text>' +
    '<text x="260" y="' + (y+depth+22) + '" text-anchor="middle" fill="#d9e5fc" font-size="13">' + layout.w.toLocaleString('ru-RU') + ' × ' + layout.d.toLocaleString('ru-RU') + ' м</text>';
}
function updateView() {
  const hasModel = Boolean(renderRoom);
  const showModel = mode !== 'plan' && hasModel;
  canvas.hidden = !showModel;
  plan.toggleAttribute('hidden', showModel);
  tools.hidden = !showModel;
  reset.disabled = !showModel;
  for (const button of modeButtons) {
    const view = button.dataset.view;
    if (view === 'reset') continue;
    button.disabled = !hasModel && view !== 'plan';
    button.setAttribute('aria-pressed', String(view === (showModel ? mode : 'plan')));
  }
  if (showModel) help.textContent = mode === 'inside'
    ? 'Потяните, чтобы осмотреться с точки съёмки'
    : 'Потяните за модель или используйте стрелки';
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
  const previousMode=mode;
  mode=button.dataset.view;
  updateView();
  if (mode!=='plan') adjustCamera?.(previousMode===mode?'draw':'reset');
  else if (!renderRoom) help.textContent='План сверху · окно, фон и свет';
});
tools.addEventListener('click',event=>{
  const button=event.target.closest('[data-camera]');
  if (button) adjustCamera?.(button.dataset.camera);
});

selectRoom(room.id);
updateView();

function setup3D(T) {
  const renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.setClearColor(0x000000,0);
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-5,5,5,-5,.1,65);
  const insideCamera = new T.PerspectiveCamera(58,1,.08,45);
  scene.add(new T.HemisphereLight(0xf0f1fa,0x847467,1.35));
  const light = new T.DirectionalLight(0xffe4bc,3.2);
  light.position.set(3,6,-7);
  light.castShadow=true;
  light.shadow.mapSize.set(1536,1536);
  Object.assign(light.shadow.camera,{left:-8,right:8,top:8,bottom:-8});
  light.shadow.normalBias=.018;
  light.shadow.bias=-.00018;
  scene.add(light);
  const fill=new T.DirectionalLight(0xdbe7ff,.66);
  fill.position.set(4,5,8);
  scene.add(fill);
  let model;
  let enclosure;
  let yaw=.57;
  let pitch=.49;
  let zoom=1;
  let roomSpan=7;
  let roomDepth=6;
  const clamp = (value,min,max)=>Math.max(min,Math.min(max,value));

  function surfaceTexture(kind) {
    const sheet=document.createElement('canvas');
    sheet.width=sheet.height=512;
    const ctx=sheet.getContext('2d');
    let seed=7341;
    const random=()=>{
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      return seed/4294967296;
    };
    const image=ctx.createImageData(512,512);
    for(let y=0;y<512;y++) for(let x=0;x<512;x++) {
      let value=222+(random()-.5)*16;
      if(kind==='oak') {
        const row=Math.floor(y/64);
        const seam=(x+row*151)%256;
        const grain=Math.sin(y*.9+Math.sin(x*.026+y*.055)*1.4)+Math.sin(y*.19+Math.sin(x*.018)*2);
        value=224+(row%3)*7+grain*6+(random()-.5)*12;
        if(y%64<2 || seam<2) value-=45;
      }
      if(kind==='brick') {
        const row=Math.floor(y/32);
        const col=Math.floor((x+row%2*32)/64);
        const mortar=y%32<3 || (x+row%2*32)%64<3;
        value=mortar?159:197+(row*11+col*7)%37+(random()-.5)*26;
      }
      if(kind==='linen') value=225+(x%4<2?8:-9)+(y%4<2?7:-10)+(random()-.5)*20;
      if(kind==='plaster') value+=Math.sin(x*.043+y*.022)*6+Math.sin(y*.048-x*.02)*4;
      const pixel=(y*512+x)*4;
      image.data[pixel]=image.data[pixel+1]=image.data[pixel+2]=value;
      image.data[pixel+3]=255;
    }
    ctx.putImageData(image,0,0);
    const texture=new T.CanvasTexture(sheet);
    texture.colorSpace=T.SRGBColorSpace;
    texture.wrapS=texture.wrapT=T.RepeatWrapping;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  const oak=surfaceTexture('oak');
  oak.repeat.set(2,2);
  const plaster=surfaceTexture('plaster');
  const linen=surfaceTexture('linen');
  const brick=surfaceTexture('brick');
  brick.repeat.set(2,1);
  function add(group, geometry, color, x,y,z, options={}) {
    const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.86,...options}));
    mesh.position.set(x,y,z);
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    group.add(mesh);
    return mesh;
  }
  const box=(g,w,h,d,c,x,y,z,options)=>add(g,new T.BoxGeometry(w,h,d),c,x,y,z,options);
  const cylinder=(g,r,h,c,x,y,z)=>add(g,new T.CylinderGeometry(r,r,h,32),c,x,y,z);

  function padded(g,w,h,d,r,color,x,y,z) {
    const shape=new T.Shape();
    shape.moveTo(-w/2+r,-h/2+r);
    shape.lineTo(w/2-r,-h/2+r);
    shape.lineTo(w/2-r,h/2-r);
    shape.lineTo(-w/2+r,h/2-r);
    shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:4,steps:1});
    geo.translate(0,0,-(d-2*r)/2);
    geo.computeVertexNormals();
    return add(g,geo,color,x,y,z,{map:linen});
  }

  function sofa(g,color,x,z) {
    padded(g,2.45,.29,1.02,.09,color,x,.29,z);
    for(const side of [-1,1]) {
      const cushion=padded(g,.96,.56,.27,.09,color,x+side*.48,.75,z-.33);
      cushion.rotation.x=-.15;
      padded(g,.99,.24,.76,.09,color,x+side*.48,.52,z+.055);
      padded(g,.24,.48,1.04,.075,color,x+side*1.1,.54,z);
      const pillow=padded(g,.43,.43,.19,.075,side===1?0xf2dbc2:0x876750,x+side*.72,.79,z-.12);
      pillow.rotation.z=side*.22;
      pillow.rotation.y=side*-.25;
      for(const depth of [-.39,.39]) cylinder(g,.039,.16,0x322b25,x+side*.98,.08,z+depth);
    }
  }

  function rod(g,from,to,r,color) {
    const a=new T.Vector3(...from),b=new T.Vector3(...to);
    const center=a.clone().lerp(b,.5);
    const mesh=cylinder(g,r,a.distanceTo(b),color,center.x,center.y,center.z);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());
  }

  function softbox(g,x,z,angle) {
    const stand=new T.Group();
    stand.position.set(x,0,z);
    stand.rotation.y=angle;
    g.add(stand);
    cylinder(stand,.025,1.57,0x25282d,0,.83,0);
    cylinder(stand,.016,.47,0xb0aaa1,0,1.69,0);
    cylinder(stand,.049,.06,0x22262b,0,1.45,0);
    for(let i=0;i<3;i++) {
      const a=i*Math.PI*2/3;
      rod(stand,[0,.36,0],[Math.sin(a)*.45,.035,Math.cos(a)*.45],.023,0x22262b);
    }
    const shell=add(stand,new T.CylinderGeometry(.48,.18,.3,8,1,false,Math.PI/8),0x25272b,0,1.91,.05);
    shell.rotation.x=Math.PI/2;
    const diffuser=add(stand,new T.CircleGeometry(.47,8,Math.PI/8),0xf4ede0,0,1.91,.205,{emissive:0xffecce,emissiveIntensity:.22,side:T.DoubleSide});
    diffuser.castShadow=false;
  }

  function plant(g,x,z) {
    add(g,new T.CylinderGeometry(.21,.15,.36,32),0xa17454,x,.18,z);
    cylinder(g,.195,.025,0x3d352d,x,.35,z);
    for(let i=0;i<13;i++) {
      const a=i*2.39996;
      const tip=[x+Math.cos(a)*(.23+i*.009),.63+(i%5)*.11,z+Math.sin(a)*(.23+i*.009)];
      rod(g,[x,.34,z],tip,.012,0x55613b);
      const leaf=add(g,new T.SphereGeometry(1,12,8),i%2?0x526849:0x78865a,...tip);
      leaf.scale.set(.10,.025,.23);
      leaf.rotation.set(.45,a,.2);
    }
  }

  function cyclorama(g,x,z,depth,color) {
    const shape=new T.Shape();
    shape.moveTo(-1.35,0);
    shape.lineTo(0,0);
    shape.lineTo(0,2.55);
    shape.lineTo(-.1,2.55);
    shape.lineTo(-.1,.78);
    shape.quadraticCurveTo(-.1,.04,-.84,.04);
    shape.lineTo(-1.35,.04);
    shape.closePath();
    const geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:32});
    const sweep=add(g,geometry,color,x,.006,z-depth/2);
    sweep.castShadow=false;
  }

  function roomGeometry(id,layout) {
    const g=new T.Group();
    const {w,d,wall,floor,fabric,backdrop}=layout;
    const rear=-d/2;
    const loft=id==='loft';
    const soft=id==='soft';
    const height=3.05;
    const trim=loft?0x3d3936:0xeee7db;
    const frame=loft?0x343639:0xbeb8ae;
    box(g,w+.10,.18,d+.10,0x524840,0,-.12,0);
    box(g,w,.035,d,floor,0,-.014,0,{map:loft?plaster:oak});
    box(g,.13,height,d,wall,-w/2,height/2,0,{map:loft?brick:plaster,bumpMap:loft?brick:null,bumpScale:.024});
    box(g,w,.46,.14,wall,0,.23,rear,{map:plaster});
    box(g,w,.37,.14,wall,0,height-.185,rear,{map:plaster});
    box(g,.055,.11,d,trim,-w/2+.08,.055,0);
    box(g,w,.11,.055,trim,0,.055,rear+.08);
    const bay=w/3;
    for(let i=0;i<3;i++) {
      const x=(i-1)*bay;
      const pane=box(g,bay-.20,2.24,.023,0xe7eced,x,1.57,rear-.025,{emissive:0xe2e8eb,emissiveIntensity:.36});
      pane.castShadow=false;
      box(g,bay-.1,.08,.21,trim,x,.46,rear+.01);
      box(g,bay-.13,.043,.11,frame,x,1.40,rear+.025);
      box(g,.043,2.22,.085,frame,x,1.57,rear+.027);
    }
    for(let i=0;i<4;i++) box(g,.17,2.26,.17,wall,(i-1.5)*(w-.17)/3,1.57,rear);
    if(!loft) {
      for(const side of [-1,1]) {
        const x=side*(w/2-.43);
        rod(g,[x-.35,2.74,rear+.14],[x+.35,2.74,rear+.14],.019,frame);
        const curtain=new T.PlaneGeometry(.64,2.66,32,1);
        const vertices=curtain.attributes.position;
        for(let i=0;i<vertices.count;i++) vertices.setZ(i,.075*Math.sin(vertices.getX(i)*53));
        curtain.computeVertexNormals();
        add(g,curtain,soft?0xb59b88:0xe8dfd0,x,1.39,rear+.16,{side:T.DoubleSide,map:linen});
      }
    }
    const loungeX=-w*.22,loungeZ=-d*.16;
    box(g,2.85,.016,2.38,loft?0x6a716d:soft?0xaf8473:0xc5b8a7,loungeX,.011,loungeZ+.8,{map:linen});
    sofa(g,fabric,loungeX,loungeZ);
    cylinder(g,.49,.072,loft?0x624939:0x8f6a50,loungeX,.45,loungeZ+1.31);
    cylinder(g,.24,.41,0x4d4037,loungeX,.215,loungeZ+1.31);
    box(g,.23,.028,.16,0xdad0bc,loungeX+.15,.50,loungeZ+1.32).rotation.y=.32;
    cylinder(g,.069,.116,0xb07b57,loungeX-.18,.54,loungeZ+1.23);
    plant(g,-w*.38,d*.28);
    const screenX=w*.38;
    if(id==='white') cyclorama(g,screenX,-.47,2.92,backdrop);
    else {
      box(g,.085,2.4,2.85,backdrop,screenX,1.20,-.48,{map:plaster});
      for(const offset of [-1.32,1.32]) {
        cylinder(g,.028,2.46,0x323232,screenX+.12,1.23,-.48+offset);
        box(g,.5,.043,.10,0x363431,screenX+.1,.026,-.48+offset);
      }
      if(soft) {
        for(const offset of [-.82,0,.82]) {
          const trimLine=box(g,.026,1.87,.038,0xc5a18c,screenX-.05,1.17,-.48+offset);
          trimLine.castShadow=false;
        }
        const stool=cylinder(g,.27,.11,0x87634d,w*.19,.57,-.52);
        stool.material.map=plaster;
        for(let i=0;i<3;i++) {
          const a=i*Math.PI*2/3;
          rod(g,[w*.19,.55,-.52],[w*.19+Math.cos(a)*.22,.025,-.52+Math.sin(a)*.22],.023,0x524237);
        }
      }
    }
    softbox(g,w*.11,-d*.34,.65);
    if(layout.lights===2) softbox(g,w*.15,d*.30,2.56);
    if(loft) {
      const x=-w*.19,z=d*.32;
      box(g,2.08,.09,.81,0x966f55,x,.77,z,{map:oak});
      for(const dx of [-.91,.91]) for(const dz of [-.33,.33]) box(g,.057,.74,.057,0x2c2b2a,x+dx,.37,z+dz);
      box(g,.48,.31,.046,0x34393c,x,.98,z-.12).rotation.x=-.11;
      box(g,.48,.026,.29,0x34393c,x,.84,z+.018);
    }
    const enclosure=new T.Group();
    enclosure.name='interior-surfaces';
    g.add(enclosure);
    box(enclosure,w,.11,d,0xe0d9d1,0,height+.01,0,{map:plaster,emissive:0xa49c94,emissiveIntensity:.43});
    box(enclosure,.13,height,d,wall,w/2,height/2,0,{map:plaster});
    box(enclosure,w,height,.14,wall,0,height/2,d/2,{map:plaster});
    box(enclosure,w*.64,.055,.062,0x383937,0,height-.072,d*.07);
    for (const x of [-w*.24,0,w*.24]) {
      const fixture=cylinder(enclosure,.055,.16,0x333536,x,height-.175,d*.07);
      fixture.rotation.z=.28;
      const lens=cylinder(enclosure,.048,.02,0xffecd0,x+.021,height-.253,d*.07);
      lens.material.emissive.setHex(0xffe0b7);
      lens.material.emissiveIntensity=.6;
    }
    enclosure.traverse(object=>{object.castShadow=false;});
    return g;
  }

  function draw() {
    if (mode==='plan' || !model || canvas.hidden) return;
    const {width,height}=surface.getBoundingClientRect();
    if (!width || !height) return;
    const aspect=width/height;
    renderer.setSize(width,height,false);
    enclosure.visible=mode==='inside';
    if (mode==='inside') {
      insideCamera.aspect=aspect;
      insideCamera.fov=Math.min(74,Math.max(39,(aspect<1.2?66:58)/zoom));
      insideCamera.updateProjectionMatrix();
      insideCamera.position.set(.05,1.56,roomDepth*.42);
      insideCamera.rotation.set(pitch,yaw,0,'YXZ');
      renderer.render(scene,insideCamera);
      return;
    }
    const extent=(roomSpan*.59)/zoom;
    const vertical=extent*Math.max(1,1/aspect);
    camera.left=-vertical*aspect;
    camera.right=vertical*aspect;
    camera.top=vertical;
    camera.bottom=-vertical;
    camera.updateProjectionMatrix();
    const distance=15;
    camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,1+Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);
    camera.lookAt(0,.9,0);
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
    roomDepth=layout.d;
    light.color.setHex(id==='soft'?0xffd8a5:id==='loft'?0xe3e9ff:0xffe4bc);
    light.intensity=id==='soft'?2.3:3.2;
    model=roomGeometry(id,layout);
    enclosure=model.getObjectByName('interior-surfaces');
    scene.add(model);
    renderer.shadowMap.needsUpdate=true;
    cameraAction('reset');
  }
  function cameraAction(action) {
    if (action==='reset') {
      yaw=mode==='inside'?.15:.57;
      pitch=mode==='inside'?-.085:.49;
      zoom=1;
    }
    if (action==='left') yaw+=mode==='inside'?.25:-.25;
    if (action==='right') yaw+=mode==='inside'?-.25:.25;
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
    pitch=clamp(pitch+(event.clientY-pointer.y)*.007,mode==='inside'?-.68:.18,mode==='inside'?.68:1.28);
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
