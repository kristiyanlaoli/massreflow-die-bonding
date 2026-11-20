export type Stage='flux'|'pickup'|'align'|'place'|'reflow'|'clean'|'underfill'|'cure'|'inspect';
export type Locale='en'|'id'|'zhTW';
export type ViewMode='assembly'|'transparent'|'cross';
export type CameraPreset='iso'|'top'|'front'|'side';
export type Parameters={dieWidth:number;dieHeight:number;waferThickness:number;bumpDiameter:number;pitch:number;fluxAmount:number;force:number;offsetX:number;offsetY:number;peakTemp:number;tal:number;cleaning:number;underfillVolume:number;viscosity:number;cureTemp:number;cureTime:number};
export const DEFAULT_PARAMS:Parameters={dieWidth:4,dieHeight:4,waferThickness:150,bumpDiameter:100,pitch:200,fluxAmount:100,force:1,offsetX:5,offsetY:-3,peakTemp:245,tal:60,cleaning:98,underfillVolume:100,viscosity:1.5,cureTemp:150,cureTime:60};
export const STAGES:{id:Stage;duration:number;name:string;short:string}[]=[
{id:'flux',duration:6,name:'Flux coating',short:'Flux'},{id:'pickup',duration:7,name:'Die pick-up & flip',short:'Flip'},{id:'align',duration:4,name:'Optical alignment',short:'Align'},{id:'place',duration:5,name:'Chip placement',short:'Place'},{id:'reflow',duration:10,name:'Mass reflow',short:'Reflow'},{id:'clean',duration:5,name:'Flux cleaning',short:'Clean'},{id:'underfill',duration:8,name:'Capillary underfill',short:'Fill'},{id:'cure',duration:6,name:'Underfill curing',short:'Cure'},{id:'inspect',duration:4,name:'Final inspection',short:'Inspect'}];
export const PRESETS:{key:string;name:string;description:string;overrides:Partial<Parameters>}[]=[
{key:'ideal',name:'Nominal process',description:'Balanced flip chip process',overrides:{}},{key:'low',name:'Cold reflow / opens',description:'Insufficient thermal exposure',overrides:{peakTemp:210,tal:15}},{key:'high',name:'Solder bridging',description:'Large bumps and tight pitch',overrides:{bumpDiameter:150,pitch:160,force:3}},{key:'misalign',name:'Misalignment',description:'Large X/Y errors',overrides:{offsetX:150,offsetY:-130}},{key:'tilt',name:'Flux residue',description:'Insufficient cleaning',overrides:{cleaning:40}},{key:'void',name:'Underfill voids',description:'High viscosity and low volume',overrides:{viscosity:8,underfillVolume:55}},{key:'cure',name:'Incomplete cure',description:'Insufficient underfill cure',overrides:{cureTemp:105,cureTime:20}}];
export const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*clamp(t,0,1);
export const smooth=(t:number)=>{const s=clamp(t,0,1);return s*s*(3-2*s)};
// Normalized accelerated cycle. For a peak above liquidus, the model allocates
// TAL/(180+TAL) of the cycle to the segment above 217 °C.
export function reflowTemperature(p:Parameters,t:number){
 const liquidus=217, peak=p.peakTemp, a=.48;
 if(peak<=liquidus)return t<.28?lerp(25,150,t/.28):t<.66?lerp(150,peak,(t-.28)/.38):lerp(peak,40,(t-.66)/.34);
 const b=a+p.tal/(180+p.tal), mid=(a+b)/2;
 return t<.25?lerp(25,150,t/.25):t<a?lerp(150,liquidus,(t-.25)/(a-.25)):t<mid?lerp(liquidus,peak,(t-a)/(mid-a)):t<b?lerp(peak,liquidus,(t-mid)/(b-mid)):lerp(liquidus,40,(t-b)/(1-b));
}
export function solderCollapse(p:Parameters){return clamp((p.peakTemp-217)/18,0,1)*clamp(p.tal/45,0,1)}
export function getCureFraction(p:Parameters,t:number){return clamp(t*clamp((p.cureTemp-100)/50,0,1.5)*p.cureTime/60,0,1)}
export function temperatureAt(p:Parameters,t:number){return Math.round(lerp(25,p.cureTemp,smooth(t/.65)))}
export type Results={standoff:number;coverage:number;voids:number;bridge:number;opens:number;placementError:number;residue:number;damage:'Low'|'Elevated'|'High';delamination:'Low'|'Elevated'|'High';status:'PASS'|'FAIL';issues:{code:string;title:string;detail:string}[]};
/** Illustrative heuristic for SAC-type solder and cleaned capillary underfill, not a validated process model. */
export function computeResults(p:Parameters,cure=1,locale:Locale='en'):Results{
 const placementError=Math.hypot(p.offsetX,p.offsetY), ratio=p.bumpDiameter/p.pitch;
 const cold=clamp(Math.max(0,235-p.peakTemp)/25+Math.max(0,45-p.tal)/45,0,2);
 const hot=clamp(Math.max(0,p.peakTemp-255)/20+Math.max(0,p.tal-90)/60,0,2);
 const fluxDef=Math.max(0,75-p.fluxAmount)/75;
 const opens=clamp(cold*22+fluxDef*12+Math.max(0,placementError-p.bumpDiameter*.25)*.2,0,100);
 const bridge=clamp(Math.max(0,ratio-.67)*100+Math.max(0,p.force-2)*3+Math.max(0,placementError-p.pitch*.3)*.10,0,100);
 const standoff=p.bumpDiameter*lerp(1,clamp(.73-Math.max(0,p.force-1)*.055-Math.max(0,ratio-.65)*.2,.35,.86),solderCollapse(p));
 const residue=clamp(100-p.cleaning+Math.max(0,p.fluxAmount-120)*.15,0,100);
 const coverage=clamp(99-Math.max(0,95-p.underfillVolume)*.72-Math.max(0,p.viscosity-2)*3-residue*.15,0,100);
 const voids=clamp(.6+(100-coverage)*.28+residue*.08+Math.max(0,p.underfillVolume-135)*.08,0,100);
 const damage:Results['damage']=hot>.5||p.force/(p.dieWidth*p.dieHeight)>.55?'High':hot>0?'Elevated':'Low';
 const delamination:Results['delamination']=cure<.85||voids>10||residue>20?'High':cure<.95||voids>5?'Elevated':'Low';
 const issues:Results['issues']=[];const add=(code:string,condition:boolean,value:string,text:[string,string][])=>{if(condition){const [title,detail]=text[locale==='en'?0:locale==='id'?1:2];issues.push({code,title,detail:value+' · '+detail})}};
 add('opens',opens>2,`${opens.toFixed(1)}% / ≤2%`,[['Open joint risk','Check flux coverage, reflow temperature and time above liquidus.'],['Risiko sambungan terbuka','Periksa flux, suhu reflow, dan waktu di atas liquidus.'],['開路風險','請檢查助焊劑、回焊溫度及液相線以上時間。']]);
 add('bridge',bridge>2,`${bridge.toFixed(1)}% / ≤2%`,[['Solder bridging risk','Increase pitch or reduce bump diameter and placement force.'],['Risiko jembatan solder','Perbesar pitch atau kurangi diameter bump dan gaya penempatan.'],['焊料橋接風險','請增加凸塊間距或降低凸塊直徑及貼裝力。']]);
 add('placement',placementError>p.pitch*.25,`${placementError.toFixed(1)} µm / ≤${(p.pitch*.25).toFixed(1)} µm`,[['Die misalignment','Correct X/Y placement offsets.'],['Die tidak sejajar','Koreksi offset X/Y.'],['晶粒對位偏移','請修正 X/Y 偏移。']]);
 add('residue',residue>10,`${residue.toFixed(1)}% / ≤10%`,[['Excessive flux residue','Improve the compatible cleaning process.'],['Residu flux berlebih','Perbaiki proses pembersihan yang kompatibel.'],['助焊劑殘留過多','請改善相容的清洗製程。']]);
 add('coverage',coverage<95,`${coverage.toFixed(1)}% / ≥95%`,[['Incomplete underfill','Review dispense volume and viscosity.'],['Underfill tidak penuh','Periksa volume dan viskositas underfill.'],['底部填膠不足','請檢查點膠量及黏度。']]);
 add('voids',voids>5,`${voids.toFixed(1)}% / ≤5%`,[['Underfill void risk','Improve flow and flux cleaning.'],['Risiko rongga underfill','Perbaiki aliran dan pembersihan flux.'],['底部填膠空洞風險','請改善流動及助焊劑清洗。']]);
 add('damage',damage==='High',`${p.peakTemp} °C · ${p.tal} s`,[['Thermomechanical damage risk','Review peak temperature, dwell and placement force.'],['Risiko kerusakan termomekanik','Periksa suhu puncak, waktu dan gaya.'],['熱機械損傷風險','請檢查峰值溫度、時間及貼裝力。']]);
 add('cure',cure<.95,`${(cure*100).toFixed(0)}% / ≥95%`,[['Incomplete underfill cure','Check the underfill supplier recipe.'],['Curing underfill kurang','Periksa resep curing material.'],['底部填膠固化不足','請檢查材料供應商的固化條件。']]);
 return {standoff,coverage,voids,bridge,opens,placementError,residue,damage,delamination,status:issues.length?'FAIL':'PASS',issues};
}
