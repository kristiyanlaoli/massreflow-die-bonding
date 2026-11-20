'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import LanguageFlag from '@/components/LanguageFlag';
import {
  Activity, AlertTriangle, Check, CheckCircle2, ChevronDown,
  CircleHelp, ClipboardList, Clock3, Cpu, Crosshair, Droplets,
  Eye, Gauge, Layers, Maximize2, Move3D, Pause, Play, RotateCcw,
  ScanLine, Settings2, SkipBack, SkipForward, SlidersHorizontal,
  Thermometer, Timer, WandSparkles, XCircle, Zap
} from 'lucide-react';
import {
  CameraPreset, clamp, computeResults, DEFAULT_PARAMS, getCureFraction,
  Parameters, PRESETS, Results, STAGES, Stage, temperatureAt, reflowTemperature, ViewMode, Locale
} from '@/lib/simulation';

const SimulationScene = dynamic(() => import('@/components/SimulationScene'), {
  ssr: false,
  loading: () => <div className="scene-loading">Preparing 3D process viewport…</div>,
});

const durations = STAGES.map(s => s.duration);
const elapsedStarts = durations.map((_, i) => durations.slice(0, i).reduce((a, b) => a + b, 0));
const totalDuration = durations.reduce((a, b) => a + b, 0);

function locatePlayhead(t: number): { index: number; progress: number } {
  if (t >= totalDuration) return { index: STAGES.length - 1, progress: 1 };
  for (let i = durations.length - 1; i >= 0; i--) {
    if (t >= elapsedStarts[i]) return { index: i, progress: clamp((t - elapsedStarts[i]) / durations[i], 0, 1) };
  }
  return { index: 0, progress: 0 };
}

function formatNumber(v: number, digits = 1) { return Number(v.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits }); }

function RangeField({ label, value, onChange, min, max, step = 1, unit, hint }: {
  label: string; value: number; onChange: (n: number) => void; min: number; max: number;
  step?: number; unit: string; hint?: string;
}) {
  const pct = clamp((value - min) / (max - min) * 100, 0, 100);
  return <label className="range-field">
    <span className="range-title"><span>{label}{hint && <span className="field-hint" title={hint}><CircleHelp size={12}/></span>}</span><b>{formatNumber(value, step < 1 ? 2 : 1)} <small>{unit}</small></b></span>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ '--percent': `${pct}%` } as React.CSSProperties}/>
    <span className="range-limits"><span>{min}</span><span>{max}</span></span>
  </label>;
}

function SelectField<T extends string>({ label, value, onChange, options, hint }: {
  label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hint?: string;
}) {
  return <label className="select-field"><span>{label}{hint && <span className="field-hint" title={hint}><CircleHelp size={12}/></span>}</span>
    <span className="select-wrap"><select value={value} onChange={e => onChange(e.target.value as T)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select><ChevronDown size={14}/></span>
  </label>;
}

function Metric({ label, value, unit, detail, severity }: { label: string; value: number | string; unit?: string; detail?: string; severity?: 'good' | 'warn' | 'bad' }) {
  return <div className="metric">
    <div className="metric-name">{label}<span className={`indicator ${severity || 'neutral'}`}/></div>
    <div className="metric-value">{typeof value === 'number' ? formatNumber(value, 1) : value}<small>{unit}</small></div>
    {detail && <div className="metric-detail">{detail}</div>}
  </div>;
}



type Language = Locale;

const UI_COPY = {
id: {
  isoTitle: "Isometrik",
  topTitle: "Atas",
  frontTitle: "Depan",
  sideTitle: "Samping",
  iso: "ISO",
  top: "ATAS",
  front: "DEPAN",
  side: "SISI",
  waferThickness: "Ketebalan wafer",
  step: "TAHAP",
  die: "Die",
  brandSubtitle: 'Perakitan semikonduktor · Kembaran digital interaktif',
  simOnline: 'SIMULASI ONLINE',
  educationalModel: 'MODEL EDUKATIF',
  workflow: 'ALUR / 01',
  bondingProcess: 'Proses bonding',
  processStages: 'Tahapan proses',
  processScenarios: 'SKENARIO PROSES',
  liveProcessView: 'TAMPILAN PROSES LANGSUNG',
  currentStep: 'STEP SAAT INI',
  stepProgress: 'PROGRES STEP',
  allChecksSatisfied: 'Seluruh pemeriksaan inspeksi lolos',
  failedChecks: (n:number)=> `${n} pemeriksaan inspeksi gagal`,
  sectionView: 'SECTION VIEW',
  assembly: 'Assembly',
  transparent: 'Transparan',
  crossSection: 'Cross-section',
  hideLabels: 'Sembunyikan',
  showLabels: 'Tampilkan',
  labels: 'label',
  processTimeline: 'TIMELINE PROSES',
  simTime: 'WAKTU SIM',
  previousStage: 'Step sebelumnya',
  reset: 'Reset',
  runSimulation: 'Jalankan Simulasi',
  pauseSimulation: 'Jeda Simulasi',
  replaySimulation: 'Ulangi Simulasi',
  nextStage: 'Step berikutnya',
  speed: 'KECEPATAN',
  engineeringExplanation: 'Penjelasan Engineering',
  eventMonitor: 'Monitor Event',
  running: 'BERJALAN',
  ready: 'SIAP',
  systemLog: 'Log sistem',
  equipmentConfiguration: 'KONFIGURASI PERALATAN',
  processControls: 'Kontrol proses',
  process: 'Process',
  dieAndSubstrate: 'DIE & SUBSTRATE',
  dieWidth: 'Lebar die',
  dieLength: 'Panjang die',
  placement: 'PLACEMENT',
  bondingForce: "Gaya bonding",
  xPlacementOffset: 'Offset placement X',
  yPlacementOffset: 'Offset placement Y',
  cureTemperature: 'Suhu curing',
  cureDuration: 'Durasi curing',
  chamberTemp: 'Suhu chamber',
  estimatedCure: 'Estimasi cure',
  modeledOutputs: 'OUTPUT TERHITUNG',
  bondQuality: 'Kualitas bonding',
  metricXYDeviation: 'Deviasi X/Y',
  metricHeuristicOnly: 'Hanya heuristik',
  metricPlacementError: 'PLACEMENT ERROR',
  metricVoids: 'ESTIMATED VOIDS',
  delamination: 'DELAMINATION',
  low: 'Rendah',
  elevated: 'Sedang',
  high: 'Tinggi',
  inspectionVerdict: 'Verdict inspeksi',
  passSuccessful: 'PASS — Bonding berhasil',
  failUnsuccessful: 'FAIL — Bonding gagal',
  passAllParams: 'Semua parameter lolos batas simulasi.',
  failParamCount: (n:number)=> `${n} parameter tidak memenuhi batas simulasi.`,
  projectedAfterFullCure: 'Diproyeksikan setelah full cure. ',
  cureInProgress: 'Curing masih berlangsung. ',
  disclaimer: 'PASS/FAIL dan semua nilai adalah estimasi edukatif—bukan batas kualifikasi industri.',
  languageLabel: 'Bahasa',
  sceneLeftAssembly: 'ASSEMBLY · PROSEDURAL 3D',
  sceneRightAssembly: 'GESER UNTUK ORBIT · SCROLL UNTUK ZOOM',
  logPresetLoaded: (name:string)=> `Preset dimuat · ${name}`,
  logProcessReset: 'Proses direset · Step 01',
  logStage: (n:number, name:string)=> `Step ${String(n).padStart(2,'0')} · ${name}`,
  pasteType: "FLIP CHIP · MASS REFLOW",
  conventionalFaceUp: "Die berbump · Sisi aktif ke bawah",
  asideNotice: "Coba reflow dingin atau solder bridging, lalu periksa sambungan.",
  filmLegend: "Perak: solder · Emas: pad/flux · Biru: underfill · Hijau kebiruan: tape",
  nextBackend: "Berikutnya: enkapsulasi / perakitan akhir",
  bltApprox: "Tinggi celah sambungan ≈",
  crossNote: "Contoh satu baris bump; dimensi sambungan diperbesar.",
  crossSectionDisabled: "Penampang tersedia setelah reflow",
  inspectBonded: "Periksa solder joint dan underfill",
  materialAndCure: "Reflow & underfill",
  dispensing: "ARRAY BUMP & FLUX",
  bumpDiameter: "Diameter bump",
  pitch: "Pitch bump",
  fluxAmount: "Jumlah flux (relatif)",
  reflowRecipe: "RESEP MASS REFLOW",
  peakTemp: "Suhu puncak",
  tal: "Waktu di atas liquidus",
  cleaning: "Efektivitas cleaning",
  underfill: "UNDERFILL KAPILER",
  underfillVolume: "Jumlah underfill (relatif)",
  viscosity: "Viskositas underfill",
  curingRecipe: "CURING UNDERFILL",
  thermalNote: "Contoh solder tipe SAC (liquidus ≈ 217 °C) dan underfill kapiler setelah cleaning. Resep reflow dan curing harus sesuai paduan, substrate, dan pemasok material.",
  liveCuringReadout: "PEMBACAAN TERMAL",
  metricBLT: "TINGGI SAMBUNGAN",
  metricEstimatedFilmGap: "Estimasi celah solder",
  metricCoverage: "CAKUPAN UNDERFILL",
  metricEstimatedDieArea: "Estimasi area terisi",
  metricFillet: "RISIKO BRIDGING",
  metricSqueezeOut: "Indikator heuristik",
  metricOpens: "RISIKO OPEN JOINT",
  metricResidue: "RESIDU FLUX",
  bleedRisk: "RISIKO KERUSAKAN",
  passDetail: "Sambungan, alignment, cleaning, underfill dan curing memenuhi batas edukatif.",
  footerProcess: "FLUX → FLIP → ALIGN → PLACE → REFLOW → CLEAN → FILL → CURE → INSPEKSI",
  footerModel: "MASS REFLOW v1.0 · MODEL EDUKATIF",
  sceneLeftCross: "PENAMPANG · CELAH DIPERBESAR",
  sceneRightCross: "SAMBUNGAN SOLDER / UNDERFILL",
  logInit: "Simulasi siap · Aplikasi flux",
  substrateType: "Substrate laminate organik",
  laminate: "Laminate organik"
},
en: {
  isoTitle: "Isometric view",
  topTitle: "Top view",
  frontTitle: "Front view",
  sideTitle: "Side view",
  iso: "ISO",
  top: "TOP",
  front: "FRONT",
  side: "SIDE",
  waferThickness: "Wafer thickness",
  step: "STEP",
  die: "Die",
  brandSubtitle: 'Semiconductor assembly · Interactive digital twin',
  simOnline: 'SIMULATION ONLINE',
  educationalModel: 'EDUCATIONAL MODEL',
  workflow: 'WORKFLOW / 01',
  bondingProcess: 'Bonding process',
  processStages: 'Process stages',
  processScenarios: 'PROCESS SCENARIOS',
  liveProcessView: 'LIVE PROCESS VIEW',
  currentStep: 'CURRENT STEP',
  stepProgress: 'STEP PROGRESS',
  allChecksSatisfied: 'All inspection checks satisfied',
  failedChecks: (n:number)=> `${n} failed inspection check${n !== 1 ? 's' : ''}`,
  sectionView: 'SECTION VIEW',
  assembly: 'Assembly',
  transparent: 'Transparent',
  crossSection: 'Cross-section',
  hideLabels: 'Hide',
  showLabels: 'Show',
  labels: 'labels',
  processTimeline: 'PROCESS TIMELINE',
  simTime: 'SIM TIME',
  previousStage: 'Previous stage',
  reset: 'Reset',
  runSimulation: 'Run Simulation',
  pauseSimulation: 'Pause Simulation',
  replaySimulation: 'Replay Simulation',
  nextStage: 'Next stage',
  speed: 'SPEED',
  engineeringExplanation: 'Engineering Explanation',
  eventMonitor: 'Event Monitor',
  running: 'RUNNING',
  ready: 'READY',
  systemLog: 'System log',
  equipmentConfiguration: 'EQUIPMENT CONFIGURATION',
  processControls: 'Process controls',
  process: 'Process',
  dieAndSubstrate: 'DIE & SUBSTRATE',
  dieWidth: 'Die width',
  dieLength: 'Die length',
  placement: 'PLACEMENT',
  bondingForce: "Bonding force",
  xPlacementOffset: 'X placement offset',
  yPlacementOffset: 'Y placement offset',
  cureTemperature: 'Cure temperature',
  cureDuration: 'Cure duration',
  chamberTemp: 'Chamber temp.',
  estimatedCure: 'Estimated cure',
  modeledOutputs: 'MODELED OUTPUTS',
  bondQuality: 'Bond quality',
  metricXYDeviation: 'X/Y deviation',
  metricHeuristicOnly: 'Heuristic only',
  metricPlacementError: 'PLACEMENT ERROR',
  metricVoids: 'ESTIMATED VOIDS',
  delamination: 'DELAMINATION',
  low: 'Low',
  elevated: 'Elevated',
  high: 'High',
  inspectionVerdict: 'Inspection verdict',
  passSuccessful: 'PASS — Bonding successful',
  failUnsuccessful: 'FAIL — Bonding unsuccessful',
  passAllParams: 'All parameters satisfy the simulation limits.',
  failParamCount: (n:number)=> `${n} parameter${n !== 1 ? 's' : ''} failed the simulation limits.`,
  projectedAfterFullCure: 'Projected after full cure. ',
  cureInProgress: 'Cure is still in progress. ',
  disclaimer: 'PASS/FAIL and all measurements are educational estimates—not industrial qualification limits.',
  languageLabel: 'Language',
  sceneLeftAssembly: 'ASSEMBLY · PROCEDURAL 3D',
  sceneRightAssembly: 'DRAG TO ORBIT · SCROLL TO ZOOM',
  logPresetLoaded: (name:string)=> `Preset loaded · ${name}`,
  logProcessReset: 'Process reset · Stage 01',
  logStage: (n:number, name:string)=> `Stage ${String(n).padStart(2,'0')} · ${name}`,
  pasteType: "FLIP CHIP · MASS REFLOW",
  conventionalFaceUp: "Bumped die · Active face down",
  asideNotice: "Try cold reflow or solder bridging, then inspect the joints.",
  filmLegend: "Silver: solder · Gold: pads/flux · Blue: underfill · Teal: tape",
  nextBackend: "Next: encapsulation / final assembly",
  bltApprox: "Joint stand-off ≈",
  crossNote: "Representative bump row; joint dimensions exaggerated.",
  crossSectionDisabled: "Cross-section available after reflow",
  inspectBonded: "Inspect solder joints and underfill",
  materialAndCure: "Reflow & underfill",
  dispensing: "BUMP ARRAY & FLUX",
  bumpDiameter: "Bump diameter",
  pitch: "Bump pitch",
  fluxAmount: "Flux amount (relative)",
  reflowRecipe: "MASS REFLOW RECIPE",
  peakTemp: "Peak temperature",
  tal: "Time above liquidus",
  cleaning: "Cleaning effectiveness",
  underfill: "CAPILLARY UNDERFILL",
  underfillVolume: "Underfill amount (relative)",
  viscosity: "Underfill viscosity",
  curingRecipe: "UNDERFILL CURE",
  thermalNote: "Illustrative SAC-type solder (liquidus ≈ 217 °C) and cleaned capillary underfill. Actual reflow and cure recipes depend on the alloy, board and material supplier.",
  liveCuringReadout: "THERMAL READOUT",
  metricBLT: "JOINT STAND-OFF",
  metricEstimatedFilmGap: "Estimated joint gap",
  metricCoverage: "UNDERFILL COVERAGE",
  metricEstimatedDieArea: "Estimated filled area",
  metricFillet: "BRIDGING RISK",
  metricSqueezeOut: "Heuristic indicator",
  metricOpens: "OPEN JOINT RISK",
  metricResidue: "FLUX RESIDUE",
  bleedRisk: "DAMAGE RISK",
  passDetail: "Joint, alignment, cleaning, underfill and cure checks satisfy the educational limits.",
  footerProcess: "FLUX → FLIP → ALIGN → PLACE → REFLOW → CLEAN → FILL → CURE → INSPECT",
  footerModel: "MASS REFLOW v1.0 · EDUCATIONAL MODEL",
  sceneLeftCross: "SECTION · JOINT GAP EXAGGERATED",
  sceneRightCross: "SOLDER JOINT / UNDERFILL",
  logInit: "Simulation ready · Flux coating",
  substrateType: "Organic laminate substrate",
  laminate: "Organic laminate"
},
zhTW: {
  isoTitle: "等角視圖",
  topTitle: "俯視圖",
  frontTitle: "正視圖",
  sideTitle: "側視圖",
  iso: "等角",
  top: "俯視",
  front: "正視",
  side: "側視",
  waferThickness: "晶圓厚度",
  step: "步驟",
  die: "晶粒",
  brandSubtitle: '半導體封裝組裝 · 互動式數位分身',
  simOnline: '模擬上線中',
  educationalModel: '教學模型',
  workflow: '流程 / 01',
  bondingProcess: '鍵合流程',
  processStages: '流程階段',
  processScenarios: '製程情境',
  liveProcessView: '即時製程視圖',
  currentStep: '目前步驟',
  stepProgress: '步驟進度',
  allChecksSatisfied: '所有檢查皆通過',
  failedChecks: (n:number)=> `${n} 項檢查未通過`,
  sectionView: '截面視圖',
  assembly: '組裝',
  transparent: '透明',
  crossSection: '截面',
  hideLabels: '隱藏',
  showLabels: '顯示',
  labels: '標籤',
  processTimeline: '製程時間軸',
  simTime: '模擬時間',
  previousStage: '上一階段',
  reset: '重設',
  runSimulation: '執行模擬',
  pauseSimulation: '暫停模擬',
  replaySimulation: '重新播放',
  nextStage: '下一階段',
  speed: '速度',
  engineeringExplanation: '工程說明',
  eventMonitor: '事件監控',
  running: '執行中',
  ready: '就緒',
  systemLog: '系統紀錄',
  equipmentConfiguration: '設備設定',
  processControls: '流程控制',
  process: '流程',
  dieAndSubstrate: '晶粒與基板',
  dieWidth: '晶粒寬度',
  dieLength: '晶粒長度',
  placement: '貼裝',
  bondingForce: "固晶力",
  xPlacementOffset: 'X 貼裝偏移',
  yPlacementOffset: 'Y 貼裝偏移',
  cureTemperature: '固化溫度',
  cureDuration: '固化時間',
  chamberTemp: '腔體溫度',
  estimatedCure: '估計固化率',
  modeledOutputs: '模擬輸出',
  bondQuality: '鍵合品質',
  metricXYDeviation: 'X/Y 偏差',
  metricHeuristicOnly: '僅為啟發式估算',
  metricPlacementError: '貼裝誤差',
  metricVoids: '估計空洞率',
  delamination: '分層風險',
  low: '低',
  elevated: '中',
  high: '高',
  inspectionVerdict: '檢查結果',
  passSuccessful: 'PASS — 鍵合成功',
  failUnsuccessful: 'FAIL — 鍵合失敗',
  passAllParams: '所有參數皆符合模擬限制。',
  failParamCount: (n:number)=> `${n} 項參數不符合模擬限制。`,
  projectedAfterFullCure: '以下為完全固化後之預估。',
  cureInProgress: '固化仍在進行中。 ',
  disclaimer: 'PASS/FAIL 與所有數值皆為教學估算，並非工業量產品質判定標準。',
  languageLabel: '語言',
  sceneLeftAssembly: '組裝 · 程序化 3D',
  sceneRightAssembly: '拖曳旋轉 · 滾輪縮放',
  logPresetLoaded: (name:string)=> `已載入預設 · ${name}`,
  logProcessReset: '流程已重設 · Step 01',
  logStage: (n:number, name:string)=> `步驟 ${String(n).padStart(2,'0')} · ${name}`,
  pasteType: "覆晶封裝 · 整體回焊",
  conventionalFaceUp: "凸塊晶粒 · 主動面朝下",
  asideNotice: "試試低溫回焊或焊料橋接，再檢查接點。",
  filmLegend: "銀色：焊料 · 金色：焊墊／助焊劑 · 藍色：底部填膠 · 青色：膠帶",
  nextBackend: "下一步：封膠／最終組裝",
  bltApprox: "接點間隙高度 ≈",
  crossNote: "代表性凸塊列；接點尺寸已放大。",
  crossSectionDisabled: "回焊後可檢視截面",
  inspectBonded: "檢查焊點及底部填膠",
  materialAndCure: "回焊與底部填膠",
  dispensing: "凸塊陣列與助焊劑",
  bumpDiameter: "凸塊直徑",
  pitch: "凸塊間距",
  fluxAmount: "助焊劑用量（相對）",
  reflowRecipe: "整體回焊條件",
  peakTemp: "峰值溫度",
  tal: "液相線以上時間",
  cleaning: "清洗效率",
  underfill: "毛細底部填膠",
  underfillVolume: "底部填膠用量（相對）",
  viscosity: "底部填膠黏度",
  curingRecipe: "底部填膠固化",
  thermalNote: "以 SAC 類焊料（液相線約 217 °C）及清洗後毛細填膠為例。實際回焊及固化條件須依焊料、基板和材料供應商規格。",
  liveCuringReadout: "即時溫度與固化",
  metricBLT: "接點間隙高度",
  metricEstimatedFilmGap: "預估接點間隙",
  metricCoverage: "底部填膠覆蓋率",
  metricEstimatedDieArea: "預估填膠面積",
  metricFillet: "橋接風險",
  metricSqueezeOut: "啟發式指標",
  metricOpens: "開路風險",
  metricResidue: "助焊劑殘留",
  bleedRisk: "損傷風險",
  passDetail: "焊點、對位、清洗、底部填膠及固化均符合教學限制。",
  footerProcess: "助焊劑 → 翻晶 → 對位 → 貼裝 → 回焊 → 清洗 → 填膠 → 固化 → 檢查",
  footerModel: "整體回焊 v1.0 · 教學模型",
  sceneLeftCross: "截面 · 接點間隙放大",
  sceneRightCross: "焊點／底部填膠",
  logInit: "模擬就緒 · 塗佈助焊劑",
  substrateType: "有機封裝基板",
  laminate: "有機封裝基板"
}
} as const;
const STAGE_COPY = {"en": {"flux": {"name": "Flux coating", "short": "Flux", "device": "Flux dispensing nozzle", "explanation": "Deposit flux on individual substrate pads before placing the bumped die.", "purpose": "Promote solder wetting by reducing oxidation.", "issue": "Too little flux can cause opens; excess may leave residue."}, "pickup": {"name": "Die pick-up & flip", "short": "Flip", "device": "Ejector pins / flipping collet", "explanation": "Ejector pins assist release from dicing tape. The pick-up tool lifts the bumped die and rotates it 180° before handoff to the placement head.", "purpose": "Orient solder bumps downward, toward substrate pads.", "issue": "Poor handling can damage bumps or the die."}, "align": {"name": "Optical alignment", "short": "Align", "device": "Vision system", "explanation": "The flip-chip head aligns the bump array with the substrate pad array.", "purpose": "Reduce X/Y placement error.", "issue": "Misalignment may produce opens and shorts."}, "place": {"name": "Chip placement", "short": "Place", "device": "Precision placement head", "explanation": "The face-down die is placed onto the flux-coated pads. The tool retracts; solder is not yet reflowed.", "purpose": "Establish contact before batch reflow.", "issue": "Excessive force or offset can damage contacts."}, "reflow": {"name": "Mass reflow", "short": "Reflow", "device": "Conveyor reflow oven", "explanation": "Multiple placed assemblies undergo a shared thermal cycle: preheat, soak, reflow above liquidus and cooling. Solder wets pads and solidifies into joints.", "purpose": "Form electrical and mechanical interconnects without a heated bonding head.", "issue": "A poor profile or tight bump spacing can cause opens or bridges."}, "clean": {"name": "Flux cleaning", "short": "Clean", "device": "Compatible cleaning / rinse station", "explanation": "After cooling, flux residues are removed using a compatible cleaning process. This simulation represents a cleanable flux, not every no-clean process.", "purpose": "Prepare the die gap for capillary underfill.", "issue": "Residue may interfere with underfill and adhesion."}, "underfill": {"name": "Capillary underfill", "short": "Fill", "device": "Edge dispensing nozzle", "explanation": "Underfill is dispensed along one die edge and flows between solder joints by capillary action.", "purpose": "Fill the gap and reinforce the interconnects.", "issue": "Low volume, high viscosity or residues may trap voids."}, "cure": {"name": "Underfill curing", "short": "Cure", "device": "Thermal cure oven", "explanation": "The underfill hardens using a material-specific thermal recipe. This is distinct from solder reflow.", "purpose": "Improve mechanical support and reliability.", "issue": "Incomplete cure increases delamination risk."}, "inspect": {"name": "Final inspection", "short": "Inspect", "device": "Optical / X-ray / acoustic inspection (conceptual)", "explanation": "Inspect representative joint shapes and underfill in cross-section. PASS/FAIL is a modeled estimate, not a measured X-ray or acoustic scan.", "purpose": "Identify potential defects before final assembly.", "issue": "Real qualification requires validated limits and measurement."}}, "id": {"flux": {"name": "Pelapisan flux", "short": "Flux", "device": "Nozzle flux", "explanation": "Flux diaplikasikan pada pad substrate sebelum die berbump ditempatkan.", "purpose": "Membantu pembasahan solder dengan mengurangi oksidasi.", "issue": "Flux kurang dapat menyebabkan open; flux berlebih meninggalkan residu."}, "pickup": {"name": "Pengambilan & flip die", "short": "Flip", "device": "Ejector / collet flip", "explanation": "Ejector membantu pelepasan dari tape. Collet mengangkat die berbump dan memutarnya 180° sebelum diserahkan ke placement head.", "purpose": "Hadapkan bump solder ke pad substrate.", "issue": "Penanganan buruk dapat merusak bump atau die."}, "align": {"name": "Penyelarasan optik", "short": "Align", "device": "Sistem vision", "explanation": "Head menyelaraskan array bump dengan array pad substrate.", "purpose": "Mengurangi kesalahan X/Y.", "issue": "Misalignment dapat menyebabkan open dan short."}, "place": {"name": "Penempatan chip", "short": "Place", "device": "Placement head", "explanation": "Die menghadap ke bawah diletakkan pada pad berflux. Head ditarik; solder belum direflow.", "purpose": "Membentuk kontak sebelum reflow massal.", "issue": "Gaya atau offset berlebih dapat merusak kontak."}, "reflow": {"name": "Mass reflow", "short": "Reflow", "device": "Oven reflow conveyor", "explanation": "Beberapa assembly mengalami siklus termal bersama: preheat, soak, reflow di atas liquidus dan cooling. Solder membasahi pad lalu membeku menjadi sambungan.", "purpose": "Membentuk koneksi listrik dan mekanik tanpa heated bonding head.", "issue": "Profil buruk atau jarak bump sempit dapat menyebabkan open atau bridge."}, "clean": {"name": "Pembersihan flux", "short": "Clean", "device": "Stasiun cleaning", "explanation": "Setelah dingin, residu flux dibersihkan dengan proses kompatibel. Model memakai flux yang dibersihkan, bukan semua proses no-clean.", "purpose": "Menyiapkan celah untuk underfill kapiler.", "issue": "Residu dapat mengganggu aliran dan adhesi."}, "underfill": {"name": "Underfill kapiler", "short": "Isi", "device": "Nozzle underfill", "explanation": "Underfill dikeluarkan di salah satu tepi die dan mengalir di antara solder joint melalui aksi kapiler.", "purpose": "Mengisi celah dan memperkuat sambungan.", "issue": "Volume rendah, viskositas tinggi atau residu dapat menyebabkan void."}, "cure": {"name": "Curing underfill", "short": "Cure", "device": "Oven curing", "explanation": "Underfill mengeras dengan resep termal sesuai material. Ini berbeda dari reflow solder.", "purpose": "Meningkatkan dukungan mekanik dan keandalan.", "issue": "Curing kurang meningkatkan risiko delaminasi."}, "inspect": {"name": "Inspeksi akhir", "short": "Inspeksi", "device": "Optik / X-ray / akustik (konseptual)", "explanation": "Periksa bentuk sambungan dan underfill pada penampang. PASS/FAIL adalah estimasi model, bukan hasil X-ray atau scan akustik.", "purpose": "Identifikasi potensi cacat sebelum final assembly.", "issue": "Kualifikasi nyata membutuhkan batas tervalidasi dan pengukuran."}}, "zhTW": {"flux": {"name": "助焊劑塗佈", "short": "助焊劑", "device": "助焊劑點膠噴嘴", "explanation": "在貼裝凸塊晶粒前，將助焊劑塗佈至基板焊墊。", "purpose": "減少氧化並促進焊料潤濕。", "issue": "助焊劑不足可能開路，過量可能殘留。"}, "pickup": {"name": "取晶與翻晶", "short": "翻晶", "device": "頂針／翻晶吸嘴", "explanation": "頂針輔助晶粒脫離切割膠帶，取晶工具將晶粒翻轉 180° 後交接至貼裝頭。", "purpose": "讓焊料凸塊朝下對準基板焊墊。", "issue": "操作不當可能損傷凸塊或晶粒。"}, "align": {"name": "光學對位", "short": "對位", "device": "視覺對位系統", "explanation": "貼裝頭使凸塊陣列與基板焊墊對準。", "purpose": "降低 X/Y 貼裝誤差。", "issue": "偏移可能造成開路或短路。"}, "place": {"name": "晶粒貼裝", "short": "貼裝", "device": "精密貼裝頭", "explanation": "主動面朝下的晶粒置於塗有助焊劑的焊墊，貼裝頭離開，焊料尚未回焊。", "purpose": "建立整體回焊前的接觸。", "issue": "過大貼裝力或偏移可能損傷接點。"}, "reflow": {"name": "整體回焊", "short": "回焊", "device": "輸送式回焊爐", "explanation": "多個組件共同經歷預熱、均溫、液相線以上回焊及冷卻，焊料潤濕焊墊後凝固成焊點。", "purpose": "不使用加熱貼裝頭即可形成電性及機械互連。", "issue": "溫度曲線不當或間距過小可能開路或橋接。"}, "clean": {"name": "助焊劑清洗", "short": "清洗", "device": "相容清洗設備", "explanation": "冷卻後以相容清洗製程去除殘留助焊劑。本模型採用可清洗助焊劑，並非所有免洗製程。", "purpose": "為毛細底部填膠準備間隙。", "issue": "殘留物可能影響流動及黏著。"}, "underfill": {"name": "毛細底部填膠", "short": "填膠", "device": "邊緣點膠噴嘴", "explanation": "從晶粒一側點膠，利用毛細作用流入焊點之間的間隙。", "purpose": "填滿間隙並強化互連。", "issue": "膠量不足、黏度過高或殘留物可能導致空洞。"}, "cure": {"name": "底部填膠固化", "short": "固化", "device": "熱固化爐", "explanation": "底部填膠依材料適用的熱固化條件硬化，與焊料回焊不同。", "purpose": "提高機械支撐及可靠度。", "issue": "固化不足增加分層風險。"}, "inspect": {"name": "最終檢查", "short": "檢查", "device": "光學／X 光／聲學檢查（概念）", "explanation": "以截面觀察代表性焊點與底部填膠。PASS/FAIL 為模型估算，非實測 X 光或聲學掃描。", "purpose": "在最終組裝前辨識潛在缺陷。", "issue": "量產驗證需要實際量測與經驗證的判定標準。"}}};
const PRESET_COPY = {"en": {"ideal": {"name": "Nominal process", "description": "Balanced flip chip process"}, "low": {"name": "Cold reflow / opens", "description": "Insufficient thermal exposure"}, "high": {"name": "Solder bridging", "description": "Large bumps and tight pitch"}, "misalign": {"name": "Misalignment", "description": "Large X/Y errors"}, "tilt": {"name": "Flux residue", "description": "Insufficient cleaning"}, "void": {"name": "Underfill voids", "description": "High viscosity and low volume"}, "cure": {"name": "Incomplete cure", "description": "Insufficient cure recipe"}}, "id": {"ideal": {"name": "Proses nominal", "description": "Proses flip chip seimbang"}, "low": {"name": "Reflow dingin / open", "description": "Paparan termal kurang"}, "high": {"name": "Solder bridging", "description": "Bump besar dan pitch sempit"}, "misalign": {"name": "Misalignment", "description": "Error X/Y besar"}, "tilt": {"name": "Residu flux", "description": "Cleaning kurang"}, "void": {"name": "Void underfill", "description": "Viskositas tinggi dan volume rendah"}, "cure": {"name": "Curing kurang", "description": "Resep curing kurang"}}, "zhTW": {"ideal": {"name": "標準製程", "description": "平衡覆晶製程"}, "low": {"name": "低溫回焊／開路", "description": "熱曝露不足"}, "high": {"name": "焊料橋接", "description": "凸塊過大或間距過小"}, "misalign": {"name": "對位偏移", "description": "X/Y 偏移過大"}, "tilt": {"name": "助焊劑殘留", "description": "清洗不足"}, "void": {"name": "底部填膠空洞", "description": "高黏度與低膠量"}, "cure": {"name": "固化不足", "description": "固化條件不足"}}};
function riskText(language: Language, value: 'Low' | 'Elevated' | 'High') {
  const t = UI_COPY[language];
  return value === 'Low' ? t.low : value === 'Elevated' ? t.elevated : t.high;
}

function iconForStage(index: number) {
  switch (index) {
    case 0: return <Settings2 size={16}/>;
    case 1: return <Layers size={16}/>;
    case 2: return <ScanLine size={16}/>;
    case 3: return <Move3D size={16}/>;
    case 4: return <Crosshair size={16}/>;
    case 5: return <Move3D size={16}/>;
    case 6: return <Thermometer size={16}/>;
    default: return <ScanLine size={16}/>;
  }
}

export default function Simulator() {
  const [language, setLanguage] = useState<Language>('en');
  const [params, setParams] = useState<Parameters>(DEFAULT_PARAMS);
  const [preset, setPreset] = useState('ideal');
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [panelTab, setPanelTab] = useState<'process' | 'material'>('process');
  const [viewMode, setViewMode] = useState<ViewMode>('assembly');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [showLabels, setShowLabels] = useState(true);
  const [detailPanel, setDetailPanel] = useState<'engineering' | 'events' | null>(null);
  const [eventLog, setEventLog] = useState<{type:'init'|'reset'|'preset'|'stage';key?:string;index?:number}[]>([{type:'init'}]);
  const lastIndex = useRef(0);
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.lang = language === 'zhTW' ? 'zh-TW' : language;
  }, [language]);

  const t = UI_COPY[language];
  const stageDefs = useMemo(() => STAGES.map(s => ({ ...s, ...STAGE_COPY[language][s.id] })), [language]);
  const presetDefs = useMemo(() => PRESETS.map(s => ({ ...s, ...((PRESET_COPY[language] as Record<string,{name:string;description:string}>)[s.key] || { name: s.name, description: s.description }) })), [language]);
  const sceneLabels = useMemo(() => ({ leftAssembly: t.sceneLeftAssembly, leftCross: t.sceneLeftCross, rightAssembly: t.sceneRightAssembly, rightCross: t.sceneRightCross }), [t]);
  const { index: stageIndex, progress } = locatePlayhead(playhead);
  const stage = stageDefs[stageIndex];
  const completed = playhead >= totalDuration;
  const cureFactor = stageIndex < 7 ? 1 : getCureFraction(params, stageIndex > 7 ? 1 : progress);
  const results = useMemo(() => computeResults(params, cureFactor, language), [params, cureFactor, language]);
  const projectedResults = useMemo(() => computeResults(params, getCureFraction(params, 1), language), [params, language]);
  const displayedResults: Results = stageIndex < 7 ? projectedResults : results;
  const currentTemp = stage.id === 'reflow' ? Math.round(reflowTemperature(params,progress)) : stageIndex < 7 ? 25 : stageIndex === 7 ? temperatureAt(params, progress) : params.cureTemp;
  const curePercentage = stageIndex < 7 ? 0 : Math.round(getCureFraction(params, stageIndex === 7 ? progress : 1) * 100);

  function update<K extends keyof Parameters>(key: K, value: Parameters[K]) {
    setParams(old => ({ ...old, [key]: value }));
    setPreset('custom');
  }
  function addLog(message: (typeof eventLog)[number]) { setEventLog(old => [message, ...old].slice(0, 7)); }
  function selectPreset(key: string) {
    const found = PRESETS.find(item => item.key === key);
    const localized = presetDefs.find(item => item.key === key);
    if (!found) return;
    setParams({ ...DEFAULT_PARAMS, ...found.overrides });
    setPreset(key);
    setPlayhead(0);
    setPlaying(false);
    setViewMode('assembly');
    addLog({type:'preset',key});
  }
  function jump(index: number) {
    const i = clamp(index, 0, STAGES.length - 1);
    setPlayhead(elapsedStarts[i]);
    setPlaying(false);
    if (i <= 4) setViewMode('assembly');
  }
  function reset() {
    setPlayhead(0);
    setPlaying(false);
    setViewMode('assembly');
    addLog({type:'reset'});
  }

  useEffect(() => {
    if (!playing) { lastTick.current = null; return; }
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = lastTick.current === null ? 0 : Math.min(.12, (now - lastTick.current) / 1000);
      lastTick.current = now;
      setPlayhead(prev => Math.min(totalDuration, prev + delta * speed));
    }, 33);
    return () => { window.clearInterval(timer); lastTick.current = null; };
  }, [playing, speed]);

  useEffect(() => {
    if (completed && playing) setPlaying(false);
  }, [completed, playing]);


  useEffect(() => {
    if (stageIndex !== lastIndex.current) {
      lastIndex.current = stageIndex;
      setEventLog(old => [{type:'stage' as const,index:stageIndex}, ...old].slice(0, 7));
    }
  }, [stageIndex]);

  const statusClass = displayedResults.status.toLowerCase();
  const statusIcon = displayedResults.status === 'PASS' ? <CheckCircle2 size={17}/> : <XCircle size={17}/>;

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-group"><div className="brand-symbol"><Cpu size={22}/></div>
        <div><div className="brand-title">FLIP CHIP <span>LAB</span></div><div className="brand-subtitle">{t.brandSubtitle}</div></div>
      </div>
      <div className="topbar-middle"><span className="live-pill"><span/> {t.simOnline}</span><span className="divider-dot">/</span><span>{t.pasteType}</span></div>
      <div className="topbar-right"><div className="lang-switch" role="group" aria-label={t.languageLabel}>
        {([{ code: 'en', name: 'English' }, { code: 'id', name: 'Bahasa Indonesia' }, { code: 'zhTW', name: '繁體中文（台灣）' }] as const).map(({ code, name }) =>
          <button key={code} type="button" className={language === code ? 'active' : ''} aria-pressed={language === code} aria-label={name} title={name} onClick={() => setLanguage(code)}><LanguageFlag language={code}/></button>
        )}
      </div><span className="model-pill"><Activity size={14}/> {t.educationalModel}</span></div>
    </header>

    <main className="workspace">
      <aside className="left-panel">
        <div className="aside-top"><span className="eyebrow">{t.workflow}</span><h2>{t.bondingProcess}</h2><p>{t.conventionalFaceUp}</p></div>
        <nav className="stage-list" aria-label={t.processStages}>
          {STAGES.map((step, i) => <button type="button" key={step.id} className={`stage-item ${i === stageIndex ? 'active' : ''} ${i < stageIndex ? 'finished' : ''}`} onClick={() => jump(i)}>
            <span className="stage-line" />
            <span className="stage-icon">{i < stageIndex ? <Check size={15}/> : iconForStage(i)}</span>
            <span className="stage-content"><span className="stage-num">{t.step} {String(i + 1).padStart(2, '0')}</span><strong>{stageDefs[i].short}</strong></span>
            {i === stageIndex && <span className="stage-active-dot" />}
          </button>)}
        </nav>
        <div className="aside-separator" />
        <div className="preset-section"><div className="section-title"><WandSparkles size={15}/> {t.processScenarios}</div>
          <div className="preset-list">{presetDefs.map(s => <button key={s.key} type="button" title={s.description} className={`preset-button ${preset === s.key ? 'selected' : ''}`} onClick={() => selectPreset(s.key)}><span className={`preset-dot ${s.key}`}/><span>{s.name}</span>{preset === s.key && <Check size={13}/>}</button>)}</div>
        </div>
        <div className="aside-notice"><CircleHelp size={18}/><span>{t.asideNotice}</span></div>
      </aside>

      <section className="center-column">
        <div className="viewport-panel">
          <div className="viewport-top">
            <div className="viewport-title"><span className="viewport-title-dot"/><div><span className="eyebrow">{t.liveProcessView}</span><h1>{stage.name}</h1></div></div>
            <div className="camera-select"><button aria-label={t.isoTitle} title={t.isoTitle} className={cameraPreset === 'iso' ? 'current' : ''} onClick={() => { setCameraPreset('iso'); setViewMode('assembly'); }}>{t.iso}</button><button title={t.topTitle} className={cameraPreset === 'top' ? 'current' : ''} onClick={() => { setCameraPreset('top'); setViewMode('assembly'); }}>{t.top}</button><button title={t.frontTitle} className={cameraPreset === 'front' ? 'current' : ''} onClick={() => { setCameraPreset('front'); setViewMode('assembly'); }}>{t.front}</button><button title={t.sideTitle} className={cameraPreset === 'side' ? 'current' : ''} onClick={() => { setCameraPreset('side'); setViewMode('assembly'); }}>{t.side}</button></div>
          </div>
          <div className="viewport-stage"><SimulationScene params={params} results={displayedResults} stage={stage.id as Stage} progress={progress} viewMode={viewMode} cameraPreset={cameraPreset} showLabels={showLabels} sceneLabels={sceneLabels}/>
            <div className="viewport-overlay-left"><div className="floating-stat"><div className="floating-label">{t.currentStep}</div><strong>{String(stageIndex + 1).padStart(2, '0')} <span>/ {String(STAGES.length).padStart(2,'0')}</span></strong></div><div className="floating-stat"><div className="floating-label">{t.stepProgress}</div><strong>{Math.round(progress * 100)}<span> %</span></strong></div></div>
            <div className="viewport-overlay-right"><span className="dimension-chip">{t.die} {formatNumber(params.dieWidth)} × {formatNumber(params.dieHeight)} mm</span><span className="dimension-chip">{t.laminate}</span>{(stage.id==='reflow'||stage.id==='cure')&&<span className="dimension-chip"><Thermometer size={11}/> {currentTemp} °C</span>}</div>
            {stageIndex === 8 && <div className={`viewport-verdict ${statusClass}`} aria-live="polite">
              {statusIcon}<span><strong>{displayedResults.status}</strong><small>{displayedResults.issues.length === 0 ? t.allChecksSatisfied : t.failedChecks(displayedResults.issues.length)}</small>{displayedResults.issues.length>0&&<small>{displayedResults.issues.map(i=>i.title).join(' · ')}</small>}</span>
            </div>}
            {viewMode === 'cross' && <div className="cross-caption"><span>{t.sectionView}</span><b>{t.bltApprox} {formatNumber(displayedResults.standoff)} µm</b><small>{t.crossNote}</small></div>}
          </div>
          <div className="film-legend">{t.filmLegend}{stageIndex===8&&<span> · {t.nextBackend}</span>}</div><div className="viewport-bottom"><div className="view-buttons"><button className={viewMode === 'assembly' ? 'selected' : ''} onClick={() => setViewMode('assembly')}><Layers size={15}/> {t.assembly}</button><button className={viewMode === 'transparent' ? 'selected' : ''} onClick={() => setViewMode('transparent')}><Eye size={15}/> {t.transparent}</button><button disabled={stageIndex < 5} title={stageIndex < 5 ? t.crossSectionDisabled : t.inspectBonded} className={viewMode === 'cross' ? 'selected' : ''} onClick={() => setViewMode('cross')}><ScanLine size={15}/> {t.crossSection}</button></div><button title={showLabels?t.hideLabels:t.showLabels} className="label-toggle" onClick={() => setShowLabels(!showLabels)}><Eye size={14}/> {showLabels ? t.hideLabels : t.showLabels} {t.labels}</button></div>
        </div>

        <div className="playback-panel">
          <div className="playback-bar-top"><span><b>{t.processTimeline}</b><small>{t.step} {String(stageIndex + 1).padStart(2, '0')} / 09 · {stage.short.toUpperCase()}</small></span><span className="timer-text"><Clock3 size={14}/> {formatNumber(playhead, 1)}s / {formatNumber(totalDuration, 1)}s <span>{t.simTime}</span></span></div>
          <input className="timeline-range" aria-label={t.processTimeline} type="range" min="0" max={totalDuration} step="0.01" value={playhead} onChange={e => { const t = Number(e.target.value); setPlayhead(t); setPlaying(false); if (t < elapsedStarts[5]) setViewMode('assembly'); }} style={{ '--percent': `${playhead / totalDuration * 100}%` } as React.CSSProperties}/>
          <div className="timeline-markers">{stageDefs.map((s, i) => <button key={s.id} className={stageIndex === i ? 'current' : ''} onClick={() => jump(i)}>{s.short}</button>)}</div>
          <div className="player-controls"><div className="player-group"><button className="icon-button" title={t.previousStage} aria-label={t.previousStage} onClick={() => jump(stageIndex - 1)} disabled={stageIndex === 0 && progress === 0}><SkipBack size={17}/></button><button className="icon-button" title={t.reset} aria-label={t.reset} onClick={reset}><RotateCcw size={17}/></button><button className="play-btn" onClick={() => { if (completed) {setPlayhead(0);setViewMode('assembly');} setPlaying(!playing || completed); }}>{playing ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor"/>}{playing ? t.pauseSimulation : completed ? t.replaySimulation : t.runSimulation}</button><button className="icon-button" title={t.nextStage} aria-label={t.nextStage} onClick={() => jump(stageIndex + 1)} disabled={stageIndex === 8}><SkipForward size={17}/></button></div><div className="speed-control"><span>{t.speed}</span>{[.5, 1, 2, 4].map(n => <button key={n} className={speed === n ? 'current' : ''} onClick={() => setSpeed(n)}>{n}×</button>)}</div></div>
        </div>

        <div className="detail-tools" onKeyDown={e => { if (e.key === 'Escape') setDetailPanel(null); }}>
          <div className="detail-toolbar" aria-label={t.engineeringExplanation}>
            <button type="button" aria-expanded={detailPanel === 'engineering'} aria-controls="engineering-details" className={detailPanel === 'engineering' ? 'active' : ''} onClick={() => setDetailPanel(old => old === 'engineering' ? null : 'engineering')}><CircleHelp size={14}/> {t.engineeringExplanation} <ChevronDown size={13} className="detail-chevron"/></button>
            <button type="button" aria-expanded={detailPanel === 'events'} aria-controls="event-details" className={detailPanel === 'events' ? 'active' : ''} onClick={() => setDetailPanel(old => old === 'events' ? null : 'events')}><Activity size={14}/> {t.eventMonitor} <span className="detail-count">{eventLog.length}</span><ChevronDown size={13} className="detail-chevron"/></button>
          </div>
          {detailPanel === 'engineering' && <div className="detail-drawer" id="engineering-details"><article className="info-panel"><div className="info-heading"><span className="eyebrow">{t.engineeringExplanation.toUpperCase()}</span><span className="info-step">0{stageIndex + 1}</span></div><h3>{stage.name}</h3><p>{stage.explanation}</p><div className="info-line"><CheckCircle2 size={16}/><span>{stage.purpose}</span></div><div className="info-line caution"><AlertTriangle size={16}/><span>{stage.issue}</span></div><div className="equipment-tag"><Settings2 size={13}/> {stage.device}</div></article></div>}
          {detailPanel === 'events' && <div className="detail-drawer" id="event-details"><article className="log-panel"><div className="info-heading"><span className="eyebrow">{t.eventMonitor.toUpperCase()}</span><span className="log-running"><span/> {playing ? t.running : t.ready}</span></div><h3>{t.systemLog}</h3><div className="log-lines">{eventLog.map((s, i) => <div className="log-entry" key={i}><span>{i === 0 ? '›' : '·'}</span>{s.type==='init'?t.logInit:s.type==='reset'?t.logProcessReset:s.type==='preset'?t.logPresetLoaded(presetDefs.find(p=>p.key===s.key)?.name||''):t.logStage((s.index??0)+1,stageDefs[s.index??0].name)}</div>)}</div></article></div>}
        </div>
      </section>

      <aside className="right-panel"><div className="settings-head"><div><div className="eyebrow">{t.equipmentConfiguration}</div><h2>{t.processControls}</h2></div><SlidersHorizontal size={19}/></div>
        <div className="tabs"><button className={panelTab === 'process' ? 'active' : ''} onClick={() => setPanelTab('process')}>{t.process}</button><button className={panelTab === 'material' ? 'active' : ''} onClick={() => setPanelTab('material')}>{t.materialAndCure}</button></div>
        <div className="settings-scroll">
          {panelTab === 'process' ? <div className="input-stack">
            <div className="settings-section-label"><Layers size={14}/> {t.dieAndSubstrate}</div>
            <div className="double-controls"><RangeField label={t.dieWidth} value={params.dieWidth} onChange={v => update('dieWidth', v)} min={2} max={7} step={.25} unit="mm"/><RangeField label={t.dieLength} value={params.dieHeight} onChange={v => update('dieHeight', v)} min={2} max={7} step={.25} unit="mm"/></div>
<div className="material-card"><p>{t.substrateType}</p></div><RangeField label={t.waferThickness} value={params.waferThickness} onChange={v => update('waferThickness', v)} min={50} max={300} step={10} unit="µm"/><div className="settings-divider"/><div className="settings-section-label"><Layers size={14}/> {t.dispensing}</div><RangeField label={t.bumpDiameter} value={params.bumpDiameter} onChange={v => update('bumpDiameter', v)} min={60} max={160} step={5} unit="µm"/><RangeField label={t.pitch} value={params.pitch} onChange={v => update('pitch', v)} min={160} max={400} step={10} unit="µm"/><RangeField label={t.fluxAmount} value={params.fluxAmount} onChange={v => update('fluxAmount', v)} min={20} max={160} step={5} unit="%"/><div className="settings-divider"/><div className="settings-section-label"><Crosshair size={14}/> {t.placement}</div><RangeField label={t.bondingForce} value={params.force} onChange={v => update('force', v)} min={0.2} max={4} step={0.1} unit="N"/><RangeField label={t.xPlacementOffset} value={params.offsetX} onChange={v => update('offsetX', v)} min={-250} max={250} step={5} unit="µm"/><RangeField label={t.yPlacementOffset} value={params.offsetY} onChange={v => update('offsetY', v)} min={-250} max={250} step={5} unit="µm"/></div> : <div className="input-stack"><div className="settings-divider"/><div className="settings-section-label"><Thermometer size={14}/> {t.reflowRecipe}</div><RangeField label={t.peakTemp} value={params.peakTemp} onChange={v => update('peakTemp', v)} min={190} max={275} step={5} unit="°C"/><RangeField label={t.tal} value={params.tal} onChange={v => update('tal', v)} min={10} max={120} step={5} unit="s"/><RangeField label={t.cleaning} value={params.cleaning} onChange={v => update('cleaning', v)} min={0} max={100} step={1} unit="%"/><div className="settings-divider"/><div className="settings-section-label"><Droplets size={14}/> {t.underfill}</div><RangeField label={t.underfillVolume} value={params.underfillVolume} onChange={v => update('underfillVolume', v)} min={40} max={160} step={5} unit="%"/><RangeField label={t.viscosity} value={params.viscosity} onChange={v => update('viscosity', v)} min={0.5} max={10} step={0.5} unit="Pa·s"/><div className="settings-divider"/><div className="settings-section-label"><Thermometer size={14}/> {t.curingRecipe}</div><RangeField label={t.cureTemperature} value={params.cureTemp} onChange={v => update('cureTemp', v)} min={100} max={220} step={5} unit="°C"/><RangeField label={t.cureDuration} value={params.cureTime} onChange={v => update('cureTime', v)} min={10} max={120} step={5} unit="min"/><div className="material-card"><CircleHelp size={17}/><p>{t.thermalNote}</p></div>
            <div className="settings-divider"/><div className="settings-section-label"><Gauge size={14}/> {t.liveCuringReadout}</div>
            <div className="live-readouts"><div><span>{t.chamberTemp}</span><strong>{currentTemp} °C</strong></div><div><span>{t.estimatedCure}</span><strong>{curePercentage}%</strong></div></div>
            <div className="cure-progress"><span style={{ width: `${curePercentage}%` }}/></div>
          </div>}
        </div>
        <div className="results-panel"><div className="results-heading"><div><span className="eyebrow">{t.modeledOutputs}</span><h2>{t.bondQuality}</h2></div><span className={`status-chip ${statusClass}`}>{statusIcon} {displayedResults.status}</span></div>
          <div className="metrics-grid"><Metric label={t.metricBLT} value={displayedResults.standoff} unit="µm" detail={t.metricEstimatedFilmGap} severity={displayedResults.issues.some(x => x.code === 'opens') ? 'bad' : 'good'}/><Metric label={t.metricCoverage} value={displayedResults.coverage} unit="%" detail={t.metricEstimatedDieArea} severity={displayedResults.issues.some(x => x.code === 'coverage') ? 'bad' : 'good'}/><Metric label={t.metricFillet} value={displayedResults.bridge} unit="%" detail={t.metricSqueezeOut} severity={displayedResults.issues.some(x => x.code === 'bridge') ? 'bad' : 'good'}/><Metric label={t.metricPlacementError} value={displayedResults.placementError} unit="µm" detail={t.metricXYDeviation} severity={displayedResults.issues.some(x => x.code === 'placement') ? 'bad' : 'good'}/><Metric label={t.metricOpens} value={displayedResults.opens} unit="%" detail={t.metricHeuristicOnly} severity={displayedResults.issues.some(x => x.code === 'opens') ? 'bad' : 'good'}/><Metric label={t.metricVoids} value={displayedResults.voids} unit="%" detail={t.metricHeuristicOnly} severity={displayedResults.issues.some(x => x.code === 'voids') ? 'bad' : 'good'}/><Metric label={t.metricResidue} value={displayedResults.residue} unit="%" detail={t.metricHeuristicOnly} severity={displayedResults.issues.some(x=>x.code==='residue')?'bad':'good'}/></div>
          <div className="risk-row"><span>{t.bleedRisk}</span><strong className={displayedResults.damage.toLowerCase()}>{riskText(language, displayedResults.damage)}</strong><span>{t.delamination}</span><strong className={displayedResults.delamination.toLowerCase()}>{riskText(language, displayedResults.delamination)}</strong></div>
          <section className={`inspection-summary ${statusClass}`} aria-label={t.inspectionVerdict} aria-live="polite">
            <div className="inspection-summary-head">{statusIcon}<div><strong>{displayedResults.status === 'PASS' ? t.passSuccessful : t.failUnsuccessful}</strong><span>{displayedResults.issues.length === 0 ? t.passAllParams : t.failParamCount(displayedResults.issues.length)}</span></div></div>
            {displayedResults.issues.length > 0 ? <ul className="issue-list">{displayedResults.issues.map(issue => <li key={issue.code}><strong>{issue.title}</strong><span>{issue.detail}</span></li>)}</ul> : <p className="pass-detail">{t.passDetail}</p>}
          </section>
          <div className="disclaimer">{stageIndex < 7 ? t.projectedAfterFullCure : stageIndex === 7 ? t.cureInProgress : ''}{t.disclaimer}</div>
        </div>
      </aside>
    </main>
    <footer className="app-footer"><span><Zap size={12}/> FLIP CHIP MASS REFLOW LAB</span><span>{t.footerProcess}</span><span>{t.footerModel}</span></footer>
  </div>;
}
