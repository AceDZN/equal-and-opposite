import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { SceneController, SceneState } from './sceneTypes';

// Every number on the board comes from SceneState. Generated art never supplies math.
const INK = '#29251f';
const PAPER = '#e9dfc6';
const RED = '#b83b29';
const clamp = THREE.MathUtils.clamp;

function paperTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const p = c.getContext('2d')!;
  p.fillStyle = PAPER; p.fillRect(0, 0, 512, 512);
  let s = 2109;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 11000; i++) {
    p.fillStyle = `rgba(64,46,25,${rand() * .055})`;
    p.fillRect(rand() * 512, rand() * 512, .4 + rand() * 1.3, .5 + rand() * 2);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3); return t;
}
function faceTexture(text: string, opts: { negative?: boolean; card?: boolean; subtitle?: string } = {}): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 512; c.height = opts.card ? 640 : 384;
  const p = c.getContext('2d')!; p.fillStyle = opts.negative ? '#e9d9c2' : '#f0e8d4'; p.fillRect(0, 0, c.width, c.height);
  p.strokeStyle = opts.negative ? RED : '#b7a47f'; p.lineWidth = opts.card ? 6 : 3;
  p.strokeRect(19, 19, c.width - 38, c.height - 38);
  p.beginPath(); p.moveTo(30, c.height - 42); p.lineTo(c.width - 30, c.height - 30); p.strokeStyle = '#cebea1'; p.lineWidth = 2; p.stroke();
  p.fillStyle = opts.negative ? RED : INK; p.textAlign = 'center'; p.textBaseline = 'middle'; p.direction = 'ltr';
  p.font = `${opts.card ? 232 : 216}px Georgia, serif`;
  const max = c.width - 70; while (p.measureText(text).width > max) { const m = /([\d.]+)px/.exec(p.font); p.font = `${Number(m![1]) - 4}px Georgia, serif`; }
  p.fillText(text.replace(/-/g, '−'), 256, c.height * (opts.card ? .18 : .5));
  if (opts.card) {
    p.font = '32px Arial, sans-serif'; p.fillStyle = '#89775b'; p.fillText(opts.subtitle || '', 48, 46);
    p.fillStyle = opts.negative ? RED : INK; p.fillRect(230, 516, 52, 4); p.fillRect(230, 532, 52, 4);
    p.font = '20px Arial, sans-serif'; p.fillStyle = '#8b795f'; p.fillText('EQUAL & OPPOSITE', 256, 590);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function labelTexture(text: string, width: number, height: number, rtl = false, count?: number): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 768; c.height = Math.max(128, Math.round(768 * height / width));
  const p = c.getContext('2d')!; p.fillStyle = '#efe6d0'; p.fillRect(0, 0, c.width, c.height);
  p.strokeStyle = '#c5b28f'; p.lineWidth = 2; p.strokeRect(8, 8, c.width - 16, c.height - 16);
  p.fillStyle = INK; p.textAlign = 'center'; p.textBaseline = 'middle'; p.direction = rtl ? 'rtl' : 'ltr';
  let size = c.height * (count === undefined ? .64 : .35);
  const font = () => `${rtl ? '600' : '500'} ${size}px ${rtl ? '"Noto Sans Hebrew", Arial, sans-serif' : 'Georgia, serif'}`;
  p.font = font(); while (p.measureText(text).width > c.width - 48 && size > 12) { size -= 2; p.font = font(); }
  p.fillText(text.replace(/-/g, '−'), c.width / 2, c.height * (count === undefined ? .5 : .3));
  if (count !== undefined) { p.direction = 'ltr'; p.font = `600 ${c.height * .39}px Arial,sans-serif`; p.fillText(String(count), c.width / 2, c.height * .72); }
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
}
function textPlane(text: string, width: number, height: number, negative = false): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: labelTexture(text, width, height), side: THREE.DoubleSide, toneMapped: false, color: negative ? '#bf4936' : '#ffffff' }));
  mesh.rotation.x = -Math.PI / 2; return mesh;
}

function disposeObject(group: THREE.Object3D) {
  group.traverse(o => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    if (m.material) for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      const x = mat as THREE.MeshStandardMaterial;
      for (const t of [x.map, x.normalMap, x.roughnessMap, x.metalnessMap, x.aoMap, x.emissiveMap]) t?.dispose();
      mat.dispose();
    }
  });
}
function numberValue(s: string) { const [a, b = '1'] = s.split('/'); return Number(a) / Number(b); }
function runeLabel(value: string, isX: boolean): string {
  if (!isX) return value;
  if (value === '1') return 'x';
  if (value === '-1') return '−x';
  return value.includes('/') ? `(${value})x` : `${value}x`;
}
function foldedRune(value: string, isX: boolean): THREE.Group {
  const negative = numberValue(value) < 0;
  const g = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: negative ? '#d7b9a2' : '#e6d8b8', roughness: 1, side: THREE.DoubleSide });
  const w = isX ? .88 : .63;
  const shape = new THREE.BufferGeometry();
  shape.setAttribute('position', new THREE.Float32BufferAttribute([
    -w, 0, .52, w, 0, .52, w, 0, -.52, -w, 0, -.52, 0, isX ? 1.55 : .52, -.04,
  ], 3));
  shape.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]); shape.computeVertexNormals();
  const folded = new THREE.Mesh(shape, material); folded.castShadow = folded.receiveShadow = true; g.add(folded);
  const plaque = textPlane(runeLabel(value, isX), isX ? 1.26 : 1.02, .72, negative);
  plaque.position.set(0, isX ? 1.04 : .36, .30); plaque.rotation.x = -Math.PI * .31; plaque.castShadow = true; g.add(plaque);
  const seam = new THREE.LineSegments(new THREE.EdgesGeometry(shape, 15), new THREE.LineBasicMaterial({ color: negative ? RED : '#aa9470', transparent: true, opacity: .55 })); g.add(seam);
  return g;
}

function chargeTexture(value: string): THREE.CanvasTexture {
  const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d')!;
  const negative=numberValue(value)<0;p.fillStyle='#e8d9bb';p.beginPath();p.arc(128,128,124,0,Math.PI*2);p.fill();
  p.strokeStyle=negative?RED:INK;p.lineWidth=4;p.beginPath();p.ellipse(128,128,105,101,.06,0,Math.PI*1.86);p.stroke();
  p.lineWidth=1.5;p.beginPath();p.ellipse(128,128,114,112,-.04,.2,Math.PI*1.95);p.stroke();
  p.fillStyle=negative?RED:INK;p.font='bold 94px Georgia,serif';p.textAlign='center';p.textBaseline='middle';p.direction='ltr';
  const label=numberValue(value)>0?'+'+value:value.replace('-','−');while(p.measureText(label).width>190){const n=Number(/([\d.]+)px/.exec(p.font)![1]);p.font=`bold ${n-3}px Georgia,serif`;}
  p.fillText(label,128,132);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function inkCharge(value:string, radius = .7):THREE.Group {
  const g=new THREE.Group();const r=radius;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.99,.15,36),new THREE.MeshStandardMaterial({color:'#cbb48c',roughness:1}));body.position.y=.075;body.castShadow=true;body.receiveShadow=true;g.add(body);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(r*1.98,r*1.98),new THREE.MeshBasicMaterial({map:chargeTexture(value),transparent:true,toneMapped:false}));face.rotation.x=-Math.PI/2;face.position.y=.153;g.add(face);return g;
}
function woodTexture():THREE.CanvasTexture {
 const c=document.createElement('canvas');c.width=512;c.height=256;const p=c.getContext('2d')!;p.fillStyle='#61412b';p.fillRect(0,0,512,256);
 for(let i=0;i<300;i++){const y=(i*37.73)%256;p.strokeStyle=`rgba(${i%2?'12,7,3':'174,122,68'},${.025+(i%9)*.007})`;p.lineWidth=.5+i%3;p.beginPath();p.moveTo(0,y);p.bezierCurveTo(180,y+Math.sin(i)*12,340,y-5,512,y+3);p.stroke();}
 for(let y=0;y<256;y+=64){p.fillStyle='#3e2b1d';p.fillRect(0,y,512,2);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,3);return t;
}

export function createScene(canvas: HTMLCanvasElement, onSelect: (index: number) => void): SceneController {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .96;
  const world = new THREE.Scene(); world.background = new THREE.Color('#e9e2d2');
  world.fog = new THREE.Fog('#e9e2d2', 90, 160);
  const camera = new THREE.PerspectiveCamera(39, 1, .1, 180);
  let azimuth = 0, distance = 25, elapsed = 0, modelLoaded = false, modelError = '', disposed = false;
  const cameraTarget = new THREE.Vector3(0, .25, .7);
  let effectiveDistance = 25, lastLayoutEquation = '', duelistBaseY = 0;
  const boardWorldBounds = new THREE.Box3(new THREE.Vector3(-8.45, -.08, -3.1), new THREE.Vector3(8.45, 2.25, 3.0));
  world.add(new THREE.AmbientLight('#e9d9b5', .85));
  const hemi = new THREE.HemisphereLight('#f6ecd5', '#3a3024', .95); world.add(hemi);
  const key = new THREE.DirectionalLight('#ffe6bb', 2.4); key.position.set(-6, 13, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -14; key.shadow.camera.right = 14; key.shadow.camera.top = 12; key.shadow.camera.bottom = -12; key.shadow.camera.near = .5; key.shadow.camera.far = 40; key.shadow.normalBias = .035; key.shadow.bias = -.00015; world.add(key);
  const rim = new THREE.DirectionalLight('#f7e5ca', 1.3); rim.position.set(7, 5, -7); world.add(rim);
  const paper = paperTexture(); const wood=woodTexture();
  const table = new THREE.Mesh(new THREE.BoxGeometry(26.4, .52, 31), new THREE.MeshStandardMaterial({ map: wood, roughness: .94 })); table.position.set(0,-.3,7.8); table.receiveShadow = true; table.castShadow = true; world.add(table);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(19.95, 10.8), new THREE.MeshStandardMaterial({ map: paper, roughness: 1 })); top.rotation.x = -Math.PI / 2; top.position.set(0,-.026,-.8); top.receiveShadow = true; world.add(top);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshStandardMaterial({ color: '#d9cfb9', roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.72; floor.receiveShadow = true; world.add(floor);
  // A sewn center crease divides the expressions without implying transport.
  const crease = new THREE.Mesh(new THREE.BoxGeometry(.025, .015, 8.7), new THREE.MeshStandardMaterial({ color: '#a79370', roughness: 1 })); crease.position.set(0, -.005, -.7); world.add(crease);
  const border = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-9.3,.005,-5.8),new THREE.Vector3(9.3,.005,-5.8),new THREE.Vector3(9.3,.005,4.0),new THREE.Vector3(-9.3,.005,4.0)]),new THREE.LineBasicMaterial({ color: '#b49d76', transparent: true, opacity: .65 })); world.add(border);
  const equal = new THREE.Group();
  for (const z of [-.24, .24]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(.95,.10,.12),new THREE.MeshStandardMaterial({color: INK,roughness:1})); bar.position.set(0,.08,z);bar.castShadow=true;equal.add(bar); } equal.position.z=.1; world.add(equal);
  // A physical vermilion maker's seal, separate from numerical labels.
  const seal = new THREE.Mesh(new THREE.BoxGeometry(.75,.08,.75),new THREE.MeshStandardMaterial({color:RED,roughness:1}));seal.position.set(8.5,.01,-5.15);seal.rotation.y=.12;seal.castShadow=true;world.add(seal);
  const sealMark = textPlane('=', .46, .40);sealMark.position.set(8.5,.058,-5.15);world.add(sealMark);
  // Quiet library context, built locally; these props never encode a value.
  for(const sign of [-1,1]){
    for(let i=0;i<3;i++){const book=new THREE.Mesh(new THREE.BoxGeometry(2.2,.25,.95),new THREE.MeshStandardMaterial({color:i%2?'#54462e':'#8c6744',roughness:1}));book.position.set(sign*8.2,.09+i*.26,-5.6);book.rotation.y=sign*(.1+i*.025);book.castShadow=true;world.add(book);}
    const lantern=new THREE.Group();lantern.position.set(sign*7.9,1.1,-7.1);
    const glow=new THREE.Mesh(new THREE.BoxGeometry(.85,1.7,.85),new THREE.MeshStandardMaterial({color:'#e6c483',emissive:'#e6a950',emissiveIntensity:.8,roughness:1}));lantern.add(glow);
    const frameMat=new THREE.MeshStandardMaterial({color:'#4a3221',roughness:1});
    for(const x of [-.46,.46])for(const z of [-.46,.46]){const pole=new THREE.Mesh(new THREE.BoxGeometry(.07,1.9,.07),frameMat);pole.position.set(x,0,z);lantern.add(pole);}
    for(const y of [-.92,.92]){const lid=new THREE.Mesh(new THREE.BoxGeometry(1.08,.09,1.08),frameMat);lid.position.y=y;lantern.add(lid);}
    world.add(lantern);const warm=new THREE.PointLight('#ffbc67',8,6,2);warm.position.copy(lantern.position);world.add(warm);
  }
  const duelist = new THREE.Group(); duelist.position.set(0,0,-6.3); world.add(duelist);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.13,1.2,.16,7),new THREE.MeshStandardMaterial({color:'#b4a07c',roughness:1}));pedestal.position.y=.02;pedestal.castShadow=true;pedestal.receiveShadow=true;duelist.add(pedestal);
  const loader = new GLTFLoader();
  loader.load(new URL('models/ink-duelist.glb', document.baseURI).href, gltf => {
    if(disposed) {disposeObject(gltf.scene);return;}
    const model=gltf.scene; const bounds=new THREE.Box3().setFromObject(model); const size=bounds.getSize(new THREE.Vector3()); const center=bounds.getCenter(new THREE.Vector3());
    const scale=9.8/Math.max(size.y,.01); model.scale.set(scale*1.35,scale,scale);model.position.set(-center.x*scale*1.35,.11-bounds.min.y*scale-3,-center.z*scale);model.rotation.y=.08;
    model.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.castShadow=true;m.receiveShadow=true;for(const mat of Array.isArray(m.material)?m.material:[m.material]){const p=mat as THREE.MeshStandardMaterial;if(p.isMeshStandardMaterial){p.roughness=Math.max(.7,p.roughness);p.metalness=0;}}}});
    duelist.add(model);modelLoaded=true;
  },undefined, e=>{modelError=e instanceof Error?e.message:'Local model not yet available';});
  let formation=new THREE.Group();world.add(formation);let oldFormation:THREE.Group|null=null;
  const hands = new THREE.Group();world.add(hands);let cardGroups:THREE.Group[]=[];
  const operationGroup=new THREE.Group();world.add(operationGroup);
  const rings:THREE.Mesh[]=[];
  for(const x of [-4.5,4.5]) { const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.59,64),new THREE.MeshBasicMaterial({color:RED,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.02,.1);operationGroup.add(ring);rings.push(ring); }
  let opLabel:THREE.Mesh|null=null;
  let current:SceneState={equation:{aL:'1',bL:'3',aR:'0',bR:'8'},hand:[],selected:null,phase:'ready',motion:1,reducedMotion:false,paused:false,duel:0,round:0,lastOperation:''};
  const piles=new THREE.Group();world.add(piles);
  let eqKey='',handKey='',pileKey='',insetsKey='',opKey='',hover:number|null=null;
  let formationLabels: THREE.Mesh[] = [], pileLabels: THREE.Mesh[] = [];
  let lastLayout = { math: { left: 20, top: 200, right: 1000, bottom: 500 }, handTop: 600, dockTop: 750, cardHeight: 200 }; const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();
  function buildFormation(s:SceneState) {
    if(oldFormation){world.remove(oldFormation);disposeObject(oldFormation);}
    oldFormation=formation;formation=new THREE.Group();world.add(formation);formationLabels=[];
    for(const [side, a, b] of [[-1,s.equation.aL,s.equation.bL],[1,s.equation.aR,s.equation.bR]] as [number,string,string][]) {
      const center=side*4.65;
      const board=new THREE.Mesh(new THREE.BoxGeometry(7.35,.065,5.35),new THREE.MeshStandardMaterial({color:'#e2d3b4',roughness:1}));board.position.set(center,-.025,.25);board.receiveShadow=true;formation.add(board);
      const hasX=numberValue(a)!==0,hasB=numberValue(b)!==0;
      if(!hasX&&!hasB){const zero=textPlane('0',1.5,1.1);zero.position.set(center,.45,.2);formation.add(zero);formationLabels.push(zero);}
      if(hasX){
        const n=numberValue(a),values=Number.isInteger(n)&&Math.abs(n)<=4?Array.from({length:Math.abs(n)},()=>n<0?'-1':'1'):[a];
        const laneWidth=hasB?3.05:6.25, base=center+(hasB?-1.88:0), scale=Math.min(1.2,laneWidth/(values.length*1.94));
        values.forEach((value,i)=>{const piece=foldedRune(value,true);piece.scale.setScalar(scale);piece.position.set(base+(i-(values.length-1)/2)*(scale*1.94),.07,.4);formation.add(piece);});
      }
      if(hasB){
        const n=numberValue(b),values=Number.isInteger(n)&&Math.abs(n)<=12?Array.from({length:Math.abs(n)},()=>n<0?'-1':'1'):[b];
        const cols=Math.min(values.length,hasX?(values.length<=4?2:3):4),rows=Math.ceil(values.length/cols),base=center+(hasX?1.88:0);
        const radius=hasX&&cols===3?.48:hasX?.62:.68,spacing=radius*2+.12;
        values.forEach((value,i)=>{const piece=inkCharge(value,values.length===1?.78:radius);const row=Math.floor(i/cols),inRow=Math.min(cols,values.length-row*cols);piece.position.set(base+(i%cols-(inRow-1)/2)*spacing,.07,(row-(rows-1)/2)*spacing+.3);formation.add(piece);});
      }
      const expr = `${a==='0'?'':runeLabel(a,true)}${b==='0'?'':a==='0'?b:numberValue(b)<0?' − '+b.slice(1):' + '+b}` || '0';
      const inscription=textPlane(expr,4.65,.68);inscription.position.set(center,.25,-2.6);formation.add(inscription);formationLabels.push(inscription);
    }
    if(s.reducedMotion||s.phase==='ready'||s.phase==='won'||s.phase==='lost'){world.remove(oldFormation);disposeObject(oldFormation);oldFormation=null;}
  }
  function buildCards(s:SceneState) {
    for(const child of [...hands.children]){hands.remove(child);disposeObject(child);}cardGroups=[];hover=null;
    s.hand.forEach((card,i)=>{
      const group=new THREE.Group();group.userData.index=i;
      const body=new THREE.Mesh(new THREE.BoxGeometry(2.7,3.8,.065),new THREE.MeshStandardMaterial({color:'#ddc9a4',roughness:1}));body.castShadow=true;body.receiveShadow=true;body.userData.cardIndex=i;group.add(body);
      const face=new THREE.Mesh(new THREE.PlaneGeometry(2.65,3.75),new THREE.MeshBasicMaterial({map:faceTexture(card.label,{card:true,negative:/[−-]/.test(card.label),subtitle:String(i+1)}),toneMapped:false}));face.position.z=.036;face.userData.cardIndex=i;group.add(face);
      const corner=new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([1.04,1.87,.039,1.33,1.56,.039,1.33,1.87,.22],3)),new THREE.MeshStandardMaterial({color:'#fff1d4',side:THREE.DoubleSide,roughness:1}));corner.geometry.computeVertexNormals();corner.userData.cardIndex=i;group.add(corner);
      const edge=new THREE.Mesh(new THREE.BoxGeometry(2.86,3.98,.035),new THREE.MeshBasicMaterial({color:'#e0422a',toneMapped:false}));edge.position.z=-.045;edge.name='selectionEdge';edge.visible=s.selected===i;edge.userData.cardIndex=i;group.add(edge);
      const offset=i-(s.hand.length-1)/2;group.position.set(offset*2.1,0,-Math.abs(offset)*.04);group.rotation.set(0,-offset*.025,-offset*.045);group.userData.fanTilt=-offset*.045;hands.add(group);cardGroups.push(group);
    });
  }

  function buildPiles(s:SceneState){
    for(const child of [...piles.children]){piles.remove(child);disposeObject(child);}pileLabels=[];
    for(const [x,list,name] of [[-8.1,s.deck||[],'שליפה'],[8.1,s.discard||[],'משומשים']] as [number,{id:string;label:string}[],string][]){
      list.forEach((card,i)=>{const body=new THREE.Mesh(new THREE.BoxGeometry(1.75,.055,2.36),new THREE.MeshStandardMaterial({color:'#b9a17c',roughness:1}));body.position.set(x,.03+i*.057,5.35);body.rotation.y=(i%2?.022:-.018);body.castShadow=true;body.receiveShadow=true;piles.add(body);});
      const label=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.92),new THREE.MeshBasicMaterial({map:labelTexture(name,2.4,.92,true,list.length),toneMapped:false,side:THREE.DoubleSide}));label.position.set(x,.4,3.8);piles.add(label);pileLabels.push(label);
      const card=x<0?list[0]:list[list.length-1];if(card){const face=textPlane(card.label,1.7,2.3);face.position.set(x,.065+list.length*.057,5.35);piles.add(face);}
    }
  }
  function setState(s:SceneState){
    const nextEq=JSON.stringify(s.equation);if(nextEq!==eqKey){eqKey=nextEq;buildFormation(s);}
    const nextHand=JSON.stringify(s.hand);if(nextHand!==handKey){handKey=nextHand;buildCards(s);}
    const nextPiles=JSON.stringify([s.deck,s.discard]);if(nextPiles!==pileKey){pileKey=nextPiles;buildPiles(s);}
    if(s.lastOperation!==opKey){opKey=s.lastOperation;if(opLabel){operationGroup.remove(opLabel);disposeObject(opLabel);}opLabel=s.lastOperation?textPlane(s.lastOperation,2.0,.9):null;if(opLabel){opLabel.position.set(0,1.0,1.25);operationGroup.add(opLabel);}}
    const nextInsets=JSON.stringify(s.viewportInsets); const geometryChanged=current.hand.length!==s.hand.length||nextInsets!==insetsKey;
    current=s;insetsKey=nextInsets;if(s.phase!=='ready'||s.paused){hover=null;canvas.style.cursor='default';}if(geometryChanged||nextEq!==lastLayoutEquation)updateCamera();lastLayoutEquation=nextEq;
  }
  function objectVisible(o:THREE.Object3D):boolean { for(let p:THREE.Object3D|null=o;p;p=p.parent)if(!p.visible)return false;return true; }
  function hitAt(x:number,y:number):number|null {
    const box=canvas.getBoundingClientRect();pointer.set((x-box.left)/box.width*2-1,-(y-box.top)/box.height*2+1);world.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
    const hit=ray.intersectObjects(hands.children,true).find(h=>objectVisible(h.object)&&Number.isInteger(h.object.userData.cardIndex));if(!hit)return null;
    const cover=ray.intersectObjects([table,top,formation,piles],true).find(h=>objectVisible(h.object));if(cover&&cover.distance<hit.distance-.002)return null;return hit.object.userData.cardIndex;
  }
  function getHit(event:PointerEvent){return hitAt(event.clientX,event.clientY);}

  const move=(e:PointerEvent)=>{hover=getHit(e);canvas.style.cursor=hover!==null&&current.phase==='ready'&&!current.paused?'pointer':'default';};
  const leave=()=>{hover=null;canvas.style.cursor='default';};
  const down=(e:PointerEvent)=>{if(e.button!==0||current.phase!=='ready'||current.paused)return;const index=getHit(e);if(index!==null)onSelect(index);};
  const up=(e:PointerEvent)=>{if(e.pointerType!=='mouse')leave();};
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',leave);
  function projectBox(box:THREE.Box3){
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);const sx=(p.x*.5+.5)*canvas.clientWidth,sy=(-p.y*.5+.5)*canvas.clientHeight;left=Math.min(left,sx);right=Math.max(right,sx);top=Math.min(top,sy);bottom=Math.max(bottom,sy);}
    return{left,top,right,bottom,width:right-left,height:bottom-top};
  }
  function characterWorldBounds(part:'head'|'body'){
    const q=duelist.scale.x,x=duelist.position.x,y=duelist.position.y,z=duelist.position.z;
    return part==='head'?new THREE.Box3(new THREE.Vector3(x-1.1*q,y+4*q,z-.95*q),new THREE.Vector3(x+1.1*q,y+6.95*q,z+1.5*q)):
      new THREE.Box3(new THREE.Vector3(x-3.8*q,y,z-2.5*q),new THREE.Vector3(x+3.8*q,y+7*q,z+2.5*q));
  }
  function updateCamera(){
    const w=canvas.clientWidth||window.innerWidth,h=canvas.clientHeight||window.innerHeight;
    const fallback={top:h<500?94:w<650?260:Math.max(190,h*.29),bottom:h<500?105:w<650?210:168,left:Math.min(24,w*.04),right:Math.min(24,w*.04)};
    const ins:NonNullable<SceneState['viewportInsets']>=current.viewportInsets||fallback,dockTop=h-ins.bottom;
    const handWidth=Math.max(2.7,(current.hand.length-1)*2.1+2.7),usableWidth=Math.max(160,w-ins.left-ins.right);
    const cardHeight=Math.max(70,Math.min(280,(dockTop-ins.top)*.5,usableWidth*.86*3.8/handWidth));
    const handTop=dockTop-cardHeight*.36;
    const safe={left:ins.left+10,right:w-ins.right-10,top:ins.top+8,bottom:Math.max(ins.top+48,handTop-18)};
    lastLayout={math:safe,handTop,dockTop,cardHeight};
    camera.clearViewOffset();cameraTarget.set(0,.6,0);
    const direction=new THREE.Vector3(Math.sin(azimuth)*.7,.48,Math.cos(azimuth)*.88).normalize();
    function place(d:number){camera.position.copy(cameraTarget).addScaledVector(direction,d);camera.lookAt(cameraTarget);camera.updateMatrixWorld(true);}
    let low=12,high=160;
    for(let i=0;i<17;i++){const d=(low+high)/2;place(d);const r=projectBox(boardWorldBounds);if(r.width>safe.right-safe.left||r.height>safe.bottom-safe.top)low=d;else high=d;}
    effectiveDistance=high*(1+(distance-18.5)/11*.25);place(effectiveDistance);
    const bounds=projectBox(boardWorldBounds),ox=(bounds.left+bounds.right)/2-(safe.left+safe.right)/2,oy=(bounds.top+bounds.bottom)/2-(safe.top+safe.bottom)/2;
    camera.setViewOffset(w,h,ox,oy,w,h);camera.updateProjectionMatrix();
    // The hand stays in the player's foreground while the mathematical board orbits.
    const nominalDepth=3.8*h/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*cardHeight);
    const depth=Math.min(nominalDepth,effectiveDistance*.42);hands.scale.setScalar(depth/nominalDepth);
    const centerNdc=new THREE.Vector3((w/2)/w*2-1,-((dockTop+cardHeight*.18)/h)*2+1,.5).unproject(camera);
    const directionToHand=centerNdc.sub(camera.position).normalize(),forward=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    hands.position.copy(camera.position).addScaledVector(directionToHand,depth/directionToHand.dot(forward));hands.quaternion.copy(camera.quaternion);
    for(const label of [...formationLabels,...pileLabels])label.quaternion.copy(camera.quaternion);
    world.updateMatrixWorld(true);
    // Keep local Hebrew pile captions readable even when the mathematical board zooms out.
    for(const label of pileLabels){label.scale.setScalar(1);label.updateMatrixWorld(true);const bounds=projectBox(new THREE.Box3().setFromObject(label));label.scale.setScalar(Math.min(3,(w<650?66:h<500?70:96)/Math.max(bounds.width,1)));}
    // Reserve a separate upper-left space for the opponent instead of putting UI on its body.
    duelistBaseY=0;duelist.position.set(0,0,-6.3);duelist.scale.setScalar(1);
    const formulaTop=ins.formulaTop??Math.max(76,ins.top-112),formulaBottom=ins.top-12;
    if(w>=650){
      const left=w<900?Math.min(165,w*.2):Math.max(175,w*.14),right=(ins.formulaLeft??w*.5-Math.min(155,w*.18))-16;
      const available=Math.max(58,right-left),width=projectBox(characterWorldBounds('body')).width;
      duelist.scale.setScalar(Math.min(1,available*.92/Math.max(width,1)));
      function centerFigure(){duelist.position.z=-6.3;const span=projectBox(characterWorldBounds('body')).width,target=clamp(w*.3,left+span/2,right-span/2);let lo=-70,hi=70;
        for(let i=0;i<18;i++){duelist.position.x=(lo+hi)/2;const q=projectBox(characterWorldBounds('body'));if((q.left+q.right)/2<target)lo=duelist.position.x;else hi=duelist.position.x;}duelist.position.x=(lo+hi)/2;
        if(duelist.position.x < -10.4){
          // Keep the opponent on the wooden table when orbit exposes its left edge.
          duelist.position.x=-10.4;duelist.scale.setScalar(Math.min(.6,duelist.scale.x));let near=-6.3,far=4;
          for(let i=0;i<18;i++){duelist.position.z=(near+far)/2;const q=projectBox(characterWorldBounds('body'));if((q.left+q.right)/2>target)near=duelist.position.z;else far=duelist.position.z;}duelist.position.z=(near+far)/2;
        }
      }
      centerFigure();let bounds=projectBox(characterWorldBounds('body'));
      if(bounds.width>available*.96){duelist.scale.multiplyScalar(available*.94/bounds.width);centerFigure();}
      const headerBottom=h<500?53:80;
      if(projectBox(characterWorldBounds('head')).top<headerBottom){let lo=0,hi=30;for(let i=0;i<16;i++){const m=(lo+hi)/2;duelist.position.y=-m;if(projectBox(characterWorldBounds('head')).top<headerBottom)lo=m;else hi=m;}duelistBaseY=-hi;}
    }else {
      const head=projectBox(characterWorldBounds('head'));
      if(head.bottom>formulaTop-8&&head.top<formulaBottom+8){let lo=0,hi=32;for(let i=0;i<16;i++){const m=(lo+hi)/2;duelist.position.y=-m;if(projectBox(characterWorldBounds('head')).top<formulaBottom+10)lo=m;else hi=m;}duelistBaseY=-hi;}
    }
    duelist.position.y=duelistBaseY;world.updateMatrixWorld(true);
  }
  function resize(){const w=canvas.clientWidth||window.innerWidth,h=canvas.clientHeight||window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();updateCamera();}
  function tick(dt:number){
    if(!current.paused)elapsed+=dt;
    const animated=!current.reducedMotion&&!current.paused;
    const transition=current.phase==='player'||current.phase==='opponent';const p=current.reducedMotion?1:current.motion;
    if(oldFormation){oldFormation.scale.y=Math.max(.015,1-p*3.5);oldFormation.position.y=p*.7;oldFormation.rotation.y=p*.035;oldFormation.visible=p<.42;if(p>.7){world.remove(oldFormation);disposeObject(oldFormation);oldFormation=null;}}
    formation.scale.y=transition?clamp((p-.15)/.65,.015,1):1;formation.position.y=transition?Math.sin(p*Math.PI)*.24:0;
    for(const ring of rings){ring.scale.setScalar(transition?1+p*5:1);(ring.material as THREE.MeshBasicMaterial).opacity=transition?Math.sin(p*Math.PI)*.55:0;}
    if(opLabel){opLabel.visible=transition;opLabel.quaternion.copy(camera.quaternion);}
    equal.rotation.y=animated&&transition?Math.sin(p*Math.PI)*.08:0;
    duelist.rotation.y=animated?Math.sin(elapsed*.48)*.045:0;
    duelist.position.y=duelistBaseY+(animated?Math.sin(elapsed*.8)*.022:0);
    cardGroups.forEach((g,i)=>{const selected=current.selected===i,target=selected?.18:hover===i?.1:0;const edge=g.getObjectByName('selectionEdge');if(edge)edge.visible=selected;g.position.y+=(target-g.position.y)*(current.reducedMotion?1:Math.min(1,dt*12));g.position.z=selected?.14:-Math.abs(i-(cardGroups.length-1)/2)*.04;g.rotation.z+=((selected?-.02:0)+g.userData.fanTilt-g.rotation.z)*Math.min(1,dt*10);});
    for(const label of [...formationLabels,...pileLabels])label.quaternion.copy(camera.quaternion);

    renderer.render(world,camera);
  }
  resize();
  void document.fonts.ready.then(()=>{if(!disposed){buildPiles(current);updateCamera();}});
  return {setState,tick,resize,setCamera(action){if(action==='reset'){azimuth=0;distance=25;}else if(action==='left')azimuth=clamp(azimuth-.12,-.42,.42);else if(action==='right')azimuth=clamp(azimuth+.12,-.42,.42);else if(action==='in')distance=clamp(distance-1.5,18.5,29.5);else distance=clamp(distance+1.5,18.5,29.5);updateCamera();},stats(){
    const r=canvas.getBoundingClientRect();world.updateMatrixWorld(true);
    const screens=cardGroups.map((g,index)=>{let point:{x:number;y:number;visible:boolean}|null=null;
      for(const localY of [1.2,1.45,.9,.5,0]){const p=g.localToWorld(new THREE.Vector3(0,localY,.055)).project(camera),x=r.left+(p.x*.5+.5)*r.width,y=r.top+(-p.y*.5+.5)*r.height;const visible=p.z>-1&&p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1&&document.elementFromPoint(x,y)===canvas&&hitAt(x,y)===index;point={x,y,visible};if(visible)break;}
      const bounds=projectBox(new THREE.Box3().setFromObject(g));return{id:current.hand[index]?.id,index,slot:index,...point,bounds};});
    return{modelLoaded,modelError,camera:{azimuth,distance,effectiveDistance},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,coordinateSystem:'Y up; left expression X<0, right expression X>0; physical hand follows player camera',physicalCards:cardGroups.length,cardScreens:screens,formationBounds:projectBox(boardWorldBounds),layout:lastLayout,characterYOffset:duelistBaseY,characterFaceBounds:projectBox(characterWorldBounds('head')),characterBounds:projectBox(characterWorldBounds('body')),pileLabels:['שליפה','משומשים']};
  },dispose(){disposed=true;canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',leave);disposeObject(world);paper.dispose();wood.dispose();renderer.dispose();}};
}
