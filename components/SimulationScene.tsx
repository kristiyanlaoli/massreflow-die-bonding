'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { CameraPreset, Parameters, Results, Stage, ViewMode, STAGES, clamp, lerp, smooth, solderCollapse } from '@/lib/simulation';
import { getSceneLayout } from '@/lib/sceneLayout';

type SceneProps = {
  params: Parameters;
  results: Results;
  stage: Stage;
  progress: number;
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  showLabels: boolean;
  sceneLabels?: { leftAssembly: string; leftCross: string; rightAssembly: string; rightCross: string };
};


const PAD=.33, TAPE=.02;
const thick=(p:Parameters)=>.25+p.waferThickness*.0012;
// Representative 5×5 bump array; pitch and vertical gap are enlarged for visibility.
const pitchVisual=(p:Parameters)=>Math.min(p.dieWidth,p.dieHeight)*.19;
const radius=(p:Parameters)=>pitchVisual(p)*Math.min(.98,p.bumpDiameter/p.pitch)*.5;
const rawGap=(p:Parameters)=>Math.max(.15,radius(p)*2);
const finalGap=(p:Parameters,r:Results)=>rawGap(p)*r.standoff/p.bumpDiameter;
const positions=(p:Parameters)=>Array.from({length:25},(_,i)=>[(i%5-2)*pitchVisual(p),(Math.floor(i/5)-2)*pitchVisual(p)] as const);
const displacement=(p:Parameters,v:number)=>v/p.pitch*pitchVisual(p);
function Die({p,faceUp=false,gap,joined=0,fade=false,r}:{p:Parameters;faceUp?:boolean;gap:number;joined?:number;fade?:boolean;r?:Results}){
 const h=thick(p), rad=radius(p), sign=faceUp?1:-1;
 return <group>
 <mesh castShadow receiveShadow><boxGeometry args={[p.dieWidth,h,p.dieHeight]}/><meshPhysicalMaterial color="#315776" metalness={.38} roughness={.33} transparent={fade} opacity={fade ? .18 : 1} depthWrite={!fade}/></mesh>
 <mesh position={[0,sign*(h/2+.007),0]}><boxGeometry args={[p.dieWidth*.94,.014,p.dieHeight*.94]}/><meshStandardMaterial color="#52728a" transparent={fade} opacity={fade ? .2 : 1} depthWrite={!fade}/></mesh>
 {positions(p).map(([x,z],i)=>{
 const missing=!!r&&r.opens>2&&i<Math.round(r.opens*25/100)&&joined>.5;
 const collapse=joined*solderCollapse(p);
 return <group key={i} position={[x,sign*h/2,z]}>
 <mesh position={[0,sign*.018,0]}><cylinderGeometry args={[rad*1.05,rad*1.05,.036,12]}/><meshStandardMaterial color="#d8a561" metalness={.7}/></mesh>
 <mesh position={[0,sign*(missing?gap*.25:gap*.5),0]} scale={[rad*(1+collapse*.14),gap*(missing ? .42 : 1)/2,rad*(1+collapse*.14)]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={missing?'#d6a391':collapse>.85?'#c7d7e3':'#aebbc9'} metalness={.82} roughness={.24}/></mesh>
 </group>})}
 {r&&r.bridge>2&&joined>.5&&[-1,0,1].slice(0,Math.ceil(r.bridge/15)).map((z,i)=><mesh key={i} position={[pitchVisual(p)*.5,sign*(h/2+gap*.5),z*pitchVisual(p)]}><boxGeometry args={[pitchVisual(p)*1.32,gap*.5,rad*1.3]}/><meshStandardMaterial color="#cbd9e2" metalness={.8}/></mesh>)}
 </group>
}
function TapeRing({p}:{p:Parameters}){const l=getSceneLayout(p);return <group><mesh position={[0,TAPE,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[l.tapeRadius,64]}/><meshPhysicalMaterial color="#3c8a95" transparent opacity={.38} side={2} depthWrite={false}/></mesh><mesh position={[0,-.04,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[l.tapeRadius+.14,.18,12,64]}/><meshStandardMaterial color="#a4b4c4" metalness={.83} roughness={.26}/></mesh><mesh position={[0,-.86,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[l.tapeRadius-.3,l.baseRadius,64]}/><meshStandardMaterial color="#27374a" side={2}/></mesh></group>}
function Wafer({p,eject,center}:{p:Parameters;eject:number;center:boolean}){const l=getSceneLayout(p), y=TAPE+thick(p)/2;return <group position={[l.waferX,0,0]}><TapeRing p={p}/>{[-1,0,1].flatMap(x=>[-1,0,1].map(z=>!center&&x===0&&z===0?null:<group key={`${x}-${z}`} position={[x*(p.dieWidth+.42),y,z*(p.dieHeight+.42)]}><Die p={p} faceUp gap={rawGap(p)}/></group>))}<group position={[0,eject,0]}><mesh position={[0,-.76,0]}><boxGeometry args={[p.dieWidth*.62,.12,p.dieHeight*.62]}/><meshStandardMaterial color="#738da1" metalness={.7}/></mesh><mesh position={[-p.dieWidth*.43,-.76,0]}><boxGeometry args={[p.dieWidth*.86,.14,.35]}/><meshStandardMaterial color="#738da1" metalness={.7}/></mesh>{[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={`${x}-${z}`} position={[x*p.dieWidth*.19,-.4,z*p.dieHeight*.19]}><cylinderGeometry args={[.07,.07,.8,16]}/><meshStandardMaterial color="#d4dde7" metalness={.8}/></mesh>))}</group></group>}
function Board({p,flux=0,residue=0}:{p:Parameters;flux?:number;residue?:number}){const l=getSceneLayout(p), rad=radius(p);return <group><mesh position={[0,-.065,0]} castShadow receiveShadow><boxGeometry args={[l.substrateWidth,.62,l.substrateDepth]}/><meshStandardMaterial color="#235b55" roughness={.44}/></mesh><mesh position={[0,-.41,0]}><boxGeometry args={[l.substrateWidth+.8,.09,l.substrateDepth+.7]}/><meshStandardMaterial color="#142336"/></mesh>{positions(p).map(([x,z],i)=><group key={i} position={[x,.275,z]}><mesh><cylinderGeometry args={[rad*1.12,rad*1.12,.11,16]}/><meshStandardMaterial color="#d4a259" metalness={.7} roughness={.3}/></mesh>{i<Math.ceil(flux*25)&&<mesh position={[0,.062,0]}><cylinderGeometry args={[rad*1.12,rad*1.12,.025,16]}/><meshPhysicalMaterial color="#eab552" transparent opacity={.75} roughness={.22}/></mesh>}{residue>0&&i<Math.ceil(residue*25/100)&&<mesh position={[rad*.7,.066,0]}><sphereGeometry args={[rad*.45,10,8]}/><meshStandardMaterial color="#a67a38" transparent opacity={.7}/></mesh>}</group>)}{[-1,1].flatMap(x=>[-1,1].map(z=><group key={`${x}-${z}`} position={[x*(p.dieWidth/2+.25),.25,z*(p.dieHeight/2+.25)]}><mesh><boxGeometry args={[.22,.016,.03]}/><meshBasicMaterial color="#6ae7e6"/></mesh><mesh><boxGeometry args={[.03,.016,.22]}/><meshBasicMaterial color="#6ae7e6"/></mesh></group>))}</group>}
function Head({gap=0,rotation=0}:{gap?:number;rotation?:number}){return <group position={[0,gap,0]} rotation={[0,0,rotation]}><mesh position={[0,.36,0]}><cylinderGeometry args={[.35,.44,.68,24]}/><meshStandardMaterial color="#9eb7cb" metalness={.8} roughness={.25}/></mesh><mesh position={[0,.95,0]}><cylinderGeometry args={[.19,.19,.55,20]}/><meshStandardMaterial color="#c4d6df" metalness={.7}/></mesh><mesh position={[0,.015,0]}><boxGeometry args={[.65,.065,.65]}/><meshStandardMaterial color="#475e72"/></mesh></group>}
function Nozzle({x,y,z,color}:{x:number;y:number;z:number;color:string}){return <group position={[x,y,z]}><mesh position={[0,.85,0]}><cylinderGeometry args={[.24,.30,1.35,20]}/><meshStandardMaterial color="#b1c3d2" metalness={.7}/></mesh><mesh position={[0,.12,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[.24,.58,20]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,-.22,0]}><cylinderGeometry args={[.045,.045,.14,12]}/><meshStandardMaterial color={color}/></mesh></group>}
function Underfill({p,r,progress,cured,transparent=false,section=false}:{p:Parameters;r:Results;progress:number;cured:boolean;transparent?:boolean;section?:boolean}){const f=clamp(progress*r.coverage/100,0,1), w=p.dieWidth*f, g=finalGap(p,r);if(f<=0)return null;return <group position={[displacement(p,p.offsetX),0,section?0:displacement(p,p.offsetY)]}><mesh position={[-p.dieWidth/2+w/2,PAD+g/2,0]}><boxGeometry args={[w,g,section?1.1:p.dieHeight]}/><meshPhysicalMaterial color={cured?'#4882ae':'#409ec9'} opacity={transparent||section ? .36 : .75} transparent roughness={.28} depthWrite={false}/></mesh><mesh position={[-p.dieWidth/2-.06,PAD+g*.23,0]}><boxGeometry args={[.16,g*.46,section?1.1:p.dieHeight+.14]}/><meshPhysicalMaterial color="#409ec9" transparent opacity={.8}/></mesh>{r.voids>5&&f>.45&&[0,1,2].map(i=><mesh key={i} position={[-p.dieWidth/2+w*(.2+i*.28),PAD+g*.5,section ? .56 :(i-1)*p.dieHeight*.25]}><sphereGeometry args={[g*.3,12,10]}/><meshBasicMaterial color="#0e202e"/></mesh>)}</group>}
function Tunnel({p,progress,wide=false}:{p:Parameters;progress:number;wide?:boolean}){const l=getSceneLayout(p),w=wide?(l.substrateWidth+1)*3:l.substrateWidth+1.4;return <group><mesh position={[0,1.6,0]}><boxGeometry args={[w,3.8,l.substrateDepth+1.4]}/><meshPhysicalMaterial color="#f39c53" transparent opacity={.055+Math.sin(Math.PI*progress)*.08} depthWrite={false} side={2}/></mesh>{[-1,1].map(z=><mesh key={z} position={[0,3.15,z*(l.substrateDepth/2+.3)]}><boxGeometry args={[w,.1,.1]}/><meshStandardMaterial color="#f5a45a" emissive="#df6424" emissiveIntensity={.5+Math.sin(progress*Math.PI)}/></mesh>)}<pointLight color="#f49b67" position={[0,2.8,0]} intensity={3*Math.sin(Math.PI*progress)} distance={20}/></group>}
function Ground(){return <group><mesh rotation={[-Math.PI/2,0,0]} position={[0,-1,0]} receiveShadow><planeGeometry args={[180,180]}/><meshStandardMaterial color="#0b1522"/></mesh><gridHelper args={[100,100,'#254054','#192e40']} position={[0,-.99,0]}/></group>}
function Placement({p,r,joined=0,raise=0,flux=0,residue=0,fill=0,cured=false,fade=false}:{p:Parameters;r:Results;joined?:number;raise?:number;flux?:number;residue?:number;fill?:number;cured?:boolean;fade?:boolean}){const gap=lerp(rawGap(p),finalGap(p,r),joined);return <group><Board p={p} flux={flux} residue={residue}/><group position={[displacement(p,p.offsetX),PAD+gap+thick(p)/2+raise,displacement(p,p.offsetY)]}><Die p={p} gap={gap} joined={joined} fade={fade} r={r}/></group>{fill>0&&<Underfill p={p} r={r} progress={fill} cured={cured} transparent={fade}/>}</group>}
function Assembly({p,r,stage,progress:t,viewMode}:{p:Parameters;r:Results;stage:Stage;progress:number;viewMode:ViewMode}){const l=getSceneLayout(p),h=thick(p),g=rawGap(p),fade=viewMode==='transparent'; const px=displacement(p,p.offsetX),pz=displacement(p,p.offsetY); const travel=Math.max(p.dieWidth,p.dieHeight)*.65+3;const st=STAGES.findIndex(s=>s.id===stage); const lift=.24*smooth((t-.18)/.16);const eject=stage==='pickup'?lift*(1-smooth((t-.34)/.16)):0;
 let x=l.waferX,y=TAPE+h/2,z=0,rot=0;
 if(stage==='pickup'){y+=lift+travel*smooth((t-.32)/.25);rot=Math.PI*smooth((t-.57)/.30);x+=Math.max(0,p.dieWidth*.75)*smooth((t-.47)/.13);}
 if(stage==='align'){x=lerp(l.waferX+p.dieWidth*.75,l.substrateX+px,smooth(t));y=lerp(TAPE+h/2+.24+travel,PAD+g+h/2+2.4,smooth(t));z=lerp(0,pz,smooth(t));rot=Math.PI;}
 if(stage==='place'){x=l.substrateX+px;y=PAD+g+h/2+2.4*(1-smooth(t/.78));z=pz;rot=Math.PI;}
 const joint=stage==='reflow'?smooth((t-.48)/.35):1;
 return <group><Ground/>
 {st<=2&&<Wafer p={p} eject={eject} center={stage==='flux'}/>}
 {stage==='flux'&&<group position={[l.substrateX,0,0]}><Board p={p} flux={smooth((t-.08)/.81)*Math.min(1,p.fluxAmount/100)}/>{(()=>{const i=Math.min(24,Math.floor(clamp((t-.08)/.81,0,1)*25));const [x,z]=positions(p)[i];return <Nozzle x={x} z={z} y={.72+1.6*(1-smooth(t/.08)+smooth((t-.9)/.1))} color="#dfaa4e"/>})()}</group>}
 {st>=1&&st<=3&&<><group position={[l.substrateX,0,0]}><Board p={p} flux={Math.min(1,p.fluxAmount/100)}/></group><group position={[x,y,z]} rotation={[0,0,rot]}><Die p={p} faceUp gap={g} fade={fade}/>{stage==='pickup'&&t<.88&&<Head gap={h/2+g+2*(1-smooth(t/.18))}/>}</group>{(stage==='align'||stage==='place'||stage==='pickup'&&t>=.88)&&<group position={[x,y+h/2+(stage==='place'?2*smooth((t-.8)/.2):0),z]}><Head/></group>}{stage==='align'&&<group position={[l.substrateX,.4,0]}><mesh><boxGeometry args={[p.dieWidth+1,.018,.02]}/><meshBasicMaterial color="#60eaff"/></mesh><mesh><boxGeometry args={[.02,.018,p.dieHeight+1]}/><meshBasicMaterial color="#60eaff"/></mesh></group>}</>}
 {stage==='reflow'&&<group position={[l.substrateX,0,0]}><mesh position={[0,-.62,0]}><boxGeometry args={[(l.substrateWidth+1)*3,.26,l.substrateDepth+2]}/><meshStandardMaterial color="#344e60" metalness={.4}/></mesh>{[-1,0,1].map(i=><group key={i} position={[i*(l.substrateWidth+1)+(.42*t),0,0]}><Placement p={p} r={r} joined={joint} flux={(1-joint)*Math.min(1,p.fluxAmount/100)} residue={joint*100} fade={fade}/></group>)}<Tunnel p={p} progress={t} wide/></group>}
 {st>=5&&<group position={[l.substrateX,0,0]}><Placement p={p} r={r} joined={1} residue={stage==='clean'?lerp(100,r.residue,t):r.residue} fill={stage==='underfill'?smooth((t-.15)/.76):st>6?1:0} cured={st>7||stage==='cure'&&t>.95} fade={fade||stage==='underfill'}/>{stage==='clean'&&<><Nozzle x={-p.dieWidth/2-.35} y={1.7} z={lerp(-p.dieHeight/2,p.dieHeight/2,t)} color="#63d4e8"/>{Array.from({length:9},(_,i)=><mesh key={i} position={[-p.dieWidth/2-.35+(i%3)*.14, .4+(i%4)*.19,lerp(-p.dieHeight/2,p.dieHeight/2,t)+Math.sin(i)*.2]}><sphereGeometry args={[.055,8,6]}/><meshBasicMaterial color="#91edff" transparent opacity={.65}/></mesh>)}</>}{stage==='underfill'&&<Nozzle x={-p.dieWidth/2-.18} y={.9+1.4*smooth((t-.82)/.18)} z={lerp(-p.dieHeight/2,p.dieHeight/2,smooth(t/.6))} color="#439acd"/>}{stage==='cure'&&<Tunnel p={p} progress={t}/>}</group>}
 </group>}
function CrossSection({p,r,stage,progress}:{p:Parameters;r:Results;stage:Stage;progress:number}){const g=finalGap(p,r),h=thick(p),w=p.dieWidth,rad=radius(p),st=STAGES.findIndex(s=>s.id===stage);return <group><Ground/><mesh position={[0,-.18,0]}><boxGeometry args={[w+2,.7,1.1]}/><meshStandardMaterial color="#235b55"/></mesh><group position={[displacement(p,p.offsetX),.23+g+h/2,0]}><mesh><boxGeometry args={[w,h,1.1]}/><meshStandardMaterial color="#52728a"/></mesh></group>{[-2,-1,0,1,2].map((i,n)=><group key={i}><mesh position={[i*pitchVisual(p),.20,0]}><boxGeometry args={[rad*2.2,.06,1.1]}/><meshStandardMaterial color="#d4a259" metalness={.7}/></mesh><mesh position={[i*pitchVisual(p)+displacement(p,p.offsetX),.23+g*(r.opens>2&&n===0 ? .75 : .5),0]} scale={[rad*1.12,g*(r.opens>2&&n===0 ? .4 : 1)/2,.54]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#c4d4df" metalness={.7}/></mesh></group>)}{r.bridge>2&&<mesh position={[displacement(p,p.offsetX)+pitchVisual(p)*.5,.23+g*.5,0]}><boxGeometry args={[pitchVisual(p)*1.35,g*.45,1.05]}/><meshStandardMaterial color="#c4d4df" metalness={.7}/></mesh>}{st>=6&&<group position={[0,-.10,0]}><Underfill p={p} r={r} progress={stage==='underfill'?smooth((progress-.15)/.76):1} cured={st>=8} section transparent/></group>}<mesh position={[-w/2-.3,.23+g/2,.57]}><boxGeometry args={[.025,g,.02]}/><meshBasicMaterial color="#68e3f2"/></mesh>{[-1,1].map(s=><mesh key={s} position={[-w/2-.3,.23+g/2+s*g/2,.57]}><boxGeometry args={[.25,.025,.03]}/><meshBasicMaterial color="#68e3f2"/></mesh>)}</group>}
function cameraRegion(p:Parameters,stage:Stage){const l=getSceneLayout(p);if(stage==='align')return {x:l.centerX,w:l.fullWidth,d:l.fullDepth};if(stage==='pickup')return {x:l.waferX,w:2*l.baseRadius,d:2*l.baseRadius};if(stage==='reflow')return {x:l.substrateX,w:3*(l.substrateWidth+1)+1,d:l.substrateDepth+2};return {x:l.substrateX,w:l.substrateWidth+2,d:l.substrateDepth+2};}

/** Refit the camera whenever the die changes size or the viewport is resized. */
function FitCamera({ p, mode, preset, stage }: { p: Parameters; mode: ViewMode; preset: CameraPreset; stage:Stage }) {
  const { camera, size } = useThree();
  const layout = getSceneLayout(p);
  const cross = mode === 'cross';
  const region=cameraRegion(p,stage);
  const target: [number, number, number] = cross ? [0, .10, 0] : [region.x, .9, 0];
  const fov = cross ? 38 : 43;
  const aspect = Math.max(.20, size.width / Math.max(1, size.height));
  const halfWidth = cross ? (Math.max(3, p.dieWidth * 1.4) + 3) / 2 : region.w / 2;
  const halfDepth = cross ? 2 : region.d / 2;
  const verticalTan = Math.tan(fov * Math.PI / 360);
  // Keep both objects visible even when a wide die increases tape diameter.
  const distance = cross
    ? Math.max(10, halfWidth / (verticalTan * aspect) * 1.24)
    : Math.max(stage==='pickup'?23:12, halfWidth / (verticalTan * aspect) * 1.23, halfDepth / verticalTan * 1.12);

  useEffect(() => {
    const orbit: Record<CameraPreset, [number, number, number]> = {
      iso: [.37, .39, .83], top: [0, 1, .001],
      front: [0, .13, 1], side: [1, .16, 0],
    };
    const direction = cross ? [0, .19, 1] : orbit[preset];
    const length = Math.hypot(...direction);
    const scale = distance / length;
    camera.position.set(target[0] + direction[0] * scale, target[1] + direction[1] * scale, target[2] + direction[2] * scale);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, target[0], target[1], target[2], distance, cross, preset]);
  return null;
}

export default function SimulationScene({ params, results, stage, progress, viewMode, cameraPreset, showLabels, sceneLabels }: SceneProps) {
  const cross = viewMode === 'cross';
  const layout = getSceneLayout(params);
  const target: [number, number, number] = cross ? [0, .1, 0] : [cameraRegion(params,stage).x, .9, 0];
  const maxOrbit = Math.max(48, layout.fullWidth * 2.6);
  return <div className="scene-root">
    <Canvas key={`${viewMode}-${cameraPreset}-${stage}`} shadows dpr={[1, 1.75]} camera={{ position: [0, 15, 28], fov: cross ? 38 : 43, near: .08, far: 400 }} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={['#0c1725']} />
      <fog attach="fog" args={['#0c1725', 90, 260]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#b8efff', '#0a1421', 2.25]} />
      <directionalLight position={[5, 14, 9]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={35} shadow-camera-bottom={-35} />
      <directionalLight position={[-9, 7, -6]} color="#4da6cb" intensity={.9} />
      {cross ? <CrossSection p={params} r={results} stage={stage} progress={progress} /> : <Assembly p={params} r={results} stage={stage} progress={progress} viewMode={viewMode} />}
      <OrbitControls makeDefault target={target} minDistance={cross ? 6 : 7} maxDistance={maxOrbit} maxPolarAngle={Math.PI * .91} enableDamping dampingFactor={.08} />
      <FitCamera p={params} mode={viewMode} preset={cameraPreset} stage={stage} />
    </Canvas>
    {showLabels && <>
      <div className="scene-label scene-label-left"><span className="tiny-dot" /> {cross ? (sceneLabels?.leftCross ?? 'SECTION VIEW · JOINT GAP EXAGGERATED') : (sceneLabels?.leftAssembly ?? 'ASSEMBLY · PROCEDURAL 3D')}</div>
      <div className="scene-label scene-label-right">{cross ? (sceneLabels?.rightCross ?? 'SOLDER JOINT / UNDERFILL INSPECTION') : (sceneLabels?.rightAssembly ?? 'DRAG TO ORBIT · SCROLL TO ZOOM')}</div>
    </>}
  </div>;
}
