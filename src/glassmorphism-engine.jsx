import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, Check, Sun, Moon, Layers, Wind, Braces, Code, Shuffle, Undo2, Share2, Download, Plus, X, Upload } from "lucide-react";

const hexToRgb = h => { const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return r?[parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)]:[255,255,255]; };
const lum = (r,g,b) => { const c=x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4}; return .2126*c(r)+.7152*c(g)+.0722*c(b); };
const wcag = (fg,bg) => { const [a,b]=[lum(...fg),lum(...bg)]; return (Math.max(a,b)+.05)/(Math.min(a,b)+.05); };
const ri = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const hslHex = (h,s,l) => { s/=100;l/=100;const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,"0")};return `#${f(0)}${f(8)}${f(4)}`; };

const DEF = {blur:16,transparency:20,saturation:150,borderOpacity:30,tint:"#ffffff",radius:16,shadow:22,noise:0};
const PRESETS = [
  {id:"ios",     name:"iOS Frosted",  blur:20,transparency:18,saturation:180,borderOpacity:22,tint:"#ffffff",radius:18,shadow:22,noise:0},
  {id:"material",name:"Material You", blur:12,transparency:22,saturation:130,borderOpacity:32,tint:"#e8d5f5",radius:28,shadow:16,noise:12},
  {id:"cyber",   name:"Cyberpunk",    blur:8, transparency:10,saturation:200,borderOpacity:80,tint:"#00ffcc",radius:4, shadow:44,noise:22},
  {id:"fluent",  name:"Win Fluent",   blur:30,transparency:26,saturation:150,borderOpacity:16,tint:"#f5f5f5",radius:8, shadow:12,noise:16},
  {id:"void",    name:"Dark Void",    blur:18,transparency:8, saturation:120,borderOpacity:42,tint:"#1a0a2e",radius:20,shadow:32,noise:6},
  {id:"aurora",  name:"Aurora",       blur:24,transparency:14,saturation:160,borderOpacity:26,tint:"#80ffea",radius:24,shadow:26,noise:8},
];
const SLIDERS = [
  {key:"blur",         label:"Blur",          min:0, max:40,  unit:"px"},
  {key:"transparency", label:"Transparency",  min:0, max:100, unit:"%"},
  {key:"saturation",   label:"Saturation",    min:0, max:200, unit:"%"},
  {key:"borderOpacity",label:"Border Opacity",min:0, max:100, unit:"%"},
  {key:"radius",       label:"Border Radius", min:0, max:48,  unit:"px"},
  {key:"shadow",       label:"Shadow Depth",  min:0, max:60,  unit:"px"},
  {key:"noise",        label:"Noise Texture", min:0, max:100, unit:"%"},
];
const SWATCHES = ["#ffffff","#c084fc","#67e8f9","#4ade80","#fb923c","#f43f5e","#1a0a2e"];
const SHAPES   = ["card","navbar","modal","button"];

export default function GlassmorphismEngine() {
  const [vals,        setValsRaw]    = useState(DEF);
  const [history,     setHistory]    = useState([]);
  const [dark,        setDark]       = useState(true);
  const [bg,          setBg]         = useState("gradient");
  const [customBg,    setCustomBg]   = useState(null);
  const [tab,         setTab]        = useState("plain");
  const [activePreset,setPreset]     = useState("ios");
  const [copied,      setCopied]     = useState(false);
  const [shape,       setShape]      = useState("card");
  const [compare,     setCompare]    = useState(false);
  const [animated,    setAnimated]   = useState(false);
  const [extraLayers, setExtraLayers]= useState([]);
  const [userPresets, setUserPresets]= useState([]);
  const [editKey,     setEditKey]    = useState(null);
  const [editTmp,     setEditTmp]    = useState("");
  const [shareToast,  setShareToast] = useState(false);
  const [exporting,   setExporting]  = useState(false);

  const valsRef   = useRef(vals);
  const previewRef= useRef(null);
  const bgFileRef = useRef(null);
  valsRef.current = vals;

  const saveHistory = useCallback(() =>
    setHistory(h => [...h.slice(-9), valsRef.current]), []);

  const undo = useCallback(() =>
    setHistory(h => { if(!h.length)return h; setValsRaw(h[h.length-1]); setPreset(null); return h.slice(0,-1); }), []);

  const setVals = useCallback((next) => {
    saveHistory();
    setValsRaw(typeof next==="function"?next(valsRef.current):next);
    setPreset(null);
  }, [saveHistory]);

  useEffect(() => {
    try {
      const h=window.location.hash.slice(1);
      if(h){const d=JSON.parse(atob(h));if(d&&typeof d.blur==="number"){setValsRaw(d);setPreset(null);}}
    } catch {}
  }, []);

  useEffect(() => { try{window.location.hash=btoa(JSON.stringify(vals));}catch{} }, [vals]);

  const share = () => {
    navigator.clipboard?.writeText(window.location.href).catch(()=>{});
    setShareToast(true); setTimeout(()=>setShareToast(false),2500);
  };

  useEffect(() => {
    const h = e => {
      if((e.ctrlKey||e.metaKey)&&e.key==="z"&&!e.shiftKey){e.preventDefault();undo();}
      if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();setUserPresets(p=>[...p,{id:`u${Date.now()}`,name:`Custom ${p.length+1}`,...valsRef.current}]);}
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[undo]);

  const randomize = () => {
    saveHistory();
    setValsRaw({blur:ri(8,30),transparency:ri(8,35),saturation:ri(110,200),borderOpacity:ri(10,65),
      tint:hslHex(ri(0,360),ri(0,35),ri(70,100)),radius:ri(4,40),shadow:ri(8,50),noise:ri(0,25)});
    setPreset(null);
  };

  const exportImg = () => {
    if(!previewRef.current)return;
    setExporting(true);
    const go = () => window.html2canvas(previewRef.current,{scale:2,backgroundColor:null,logging:false})
      .then(c=>{const a=document.createElement("a");a.download="glass-preview.png";a.href=c.toDataURL();a.click();setExporting(false);})
      .catch(()=>setExporting(false));
    if(window.html2canvas){go();return;}
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload=go; s.onerror=()=>setExporting(false);
    document.head.appendChild(s);
  };

  const handleBgUpload = e => {
    const f=e.target.files?.[0]; if(!f)return;
    const r=new FileReader(); r.onload=ev=>{setCustomBg(ev.target.result);setBg("custom");}; r.readAsDataURL(f);
  };

  const commitEdit = (key,min,max) => {
    const n=Math.max(min,Math.min(max,Number(editTmp)));
    if(!isNaN(n)){saveHistory();setValsRaw(v=>({...v,[key]:n}));}
    setEditKey(null);
  };

  const rgb    = hexToRgb(vals.tint);
  const bgA    = (vals.transparency/100).toFixed(2);
  const brdA   = (vals.borderOpacity/100).toFixed(2);
  const rgbStr = `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
  const shH    = Math.round(vals.shadow*.5);

  const bgBase  = dark?[12,6,30]:[230,220,255];
  const blended = bgBase.map((b,i)=>Math.round(b*(1-vals.transparency/100)+rgb[i]*(vals.transparency/100)));
  const ratio   = wcag(dark?[255,255,255]:[30,27,75], blended);
  const isAA    = ratio>=4.5;
  const isAAA   = ratio>=7;

  const accent = "#a78bfa";
  const txtPri = dark?"#fff":"#1e1b4b";
  const txtSec = dark?"rgba(255,255,255,.55)":"rgba(30,27,75,.55)";
  const codeBg = dark?"rgba(0,0,0,.4)":"rgba(0,0,0,.06)";
  const codeFg = dark?"#a78bfa":"#6d28d9";
  const panel  = {
    background:dark?"rgba(255,255,255,.07)":"rgba(255,255,255,.55)",
    backdropFilter:"blur(28px) saturate(200%)", WebkitBackdropFilter:"blur(28px) saturate(200%)",
    border:dark?"1px solid rgba(255,255,255,.13)":"1px solid rgba(255,255,255,.85)",
    borderRadius:"20px",
  };
  const previewStyle = {
    background:`rgba(${rgbStr},${bgA})`,
    backdropFilter:`blur(${vals.blur}px) saturate(${vals.saturation}%)`,
    WebkitBackdropFilter:`blur(${vals.blur}px) saturate(${vals.saturation}%)`,
    border:`1px solid rgba(${rgbStr},${brdA})`,
    borderRadius:`${vals.radius}px`,
    boxShadow:`0 ${shH}px ${vals.shadow}px rgba(0,0,0,.35)`,
    position:"relative", overflow:"hidden",
  };
  const noGlass = {background:dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:`${vals.radius}px`,position:"relative",overflow:"hidden"};

  const animCSS = animated?`\n  animation: glassShimmer 4s infinite ease-in-out;`:"";
  const animKF  = animated?`\n\n@keyframes glassShimmer {\n  0%,100% { filter: brightness(1); }\n  50%     { filter: brightness(1.1) hue-rotate(12deg); }\n}`:"";
  const layerCSS= extraLayers.length?"\n\n/* Stacked layers */\n"+extraLayers.map((l,i)=>{const r2=hexToRgb(l.tint);return `.glass-layer-${i+2} {\n  background: rgba(${r2[0]},${r2[1]},${r2[2]},${(l.transparency/100).toFixed(2)});\n  backdrop-filter: blur(${l.blur}px);\n  border-radius: ${l.radius}px;\n}`;}).join("\n\n"):"";
  const nb  = [0,4,8,12,16,20,24].reduce((a,b)=>Math.abs(b-vals.blur)<Math.abs(a-vals.blur)?b:a);
  const bLbl= {0:"none",4:"sm",8:"md",12:"lg",16:"xl",20:"2xl",24:"3xl"}[nb]??`[${vals.blur}px]`;

  const plainCSS  = `.glass {\n  background: rgba(${rgbStr}, ${bgA});\n  backdrop-filter: blur(${vals.blur}px) saturate(${vals.saturation}%);\n  -webkit-backdrop-filter: blur(${vals.blur}px) saturate(${vals.saturation}%);\n  border: 1px solid rgba(${rgbStr}, ${brdA});\n  border-radius: ${vals.radius}px;\n  box-shadow: 0 ${shH}px ${vals.shadow}px rgba(0,0,0,.35);${animCSS}\n}${animKF}${layerCSS}`;
  const cssVars   = `:root {\n  --g-blur: ${vals.blur}px;\n  --g-sat:  ${vals.saturation}%;\n  --g-bga:  ${bgA};\n  --g-tint: ${rgbStr};\n  --g-brda: ${brdA};\n  --g-r:    ${vals.radius}px;\n  --g-sh:   ${vals.shadow}px;\n}\n\n.glass {\n  background: rgba(var(--g-tint), var(--g-bga));\n  backdrop-filter: blur(var(--g-blur)) saturate(var(--g-sat));\n  -webkit-backdrop-filter: blur(var(--g-blur)) saturate(var(--g-sat));\n  border: 1px solid rgba(var(--g-tint), var(--g-brda));\n  border-radius: var(--g-r);\n  box-shadow: 0 calc(var(--g-sh) * .5) var(--g-sh) rgba(0,0,0,.35);\n}`;
  const twCSS     = `<div class="\n  backdrop-blur-${bLbl}\n  backdrop-saturate-[${vals.saturation}%]\n  bg-[rgba(${rgb[0]},${rgb[1]},${rgb[2]},${bgA})]\n  border\n  border-[rgba(${rgb[0]},${rgb[1]},${rgb[2]},${brdA})]\n  rounded-[${vals.radius}px]\n  shadow-[0_${shH}px_${vals.shadow}px_rgba(0,0,0,0.35)]\n">\n  <!-- your content -->\n</div>`;
  const reactSnip = `const glass = {\n  background: 'rgba(${rgbStr}, ${bgA})',\n  backdropFilter: 'blur(${vals.blur}px) saturate(${vals.saturation}%)',\n  WebkitBackdropFilter: 'blur(${vals.blur}px) saturate(${vals.saturation}%)',\n  border: '1px solid rgba(${rgbStr}, ${brdA})',\n  borderRadius: '${vals.radius}px',\n  boxShadow: '0 ${shH}px ${vals.shadow}px rgba(0,0,0,.35)',\n};\n\nexport const GlassCard = ({ children, style, ...p }) => (\n  <div style={{ ...glass, ...style }} {...p}>\n    {children}\n  </div>\n);`;
  const vueSnip   = `<!-- GlassCard.vue -->\n<template>\n  <div class="glass"><slot /></div>\n</template>\n\n<style scoped>\n.glass {\n  background: rgba(${rgbStr}, ${bgA});\n  backdrop-filter: blur(${vals.blur}px) saturate(${vals.saturation}%);\n  -webkit-backdrop-filter: blur(${vals.blur}px) saturate(${vals.saturation}%);\n  border: 1px solid rgba(${rgbStr}, ${brdA});\n  border-radius: ${vals.radius}px;\n  box-shadow: 0 ${shH}px ${vals.shadow}px rgba(0,0,0,.35);\n}\n</style>`;

  const outMap = {plain:plainCSS,vars:cssVars,tailwind:twCSS,react:reactSnip,vue:vueSnip};
  const handleCopy = () => { navigator.clipboard?.writeText(outMap[tab]).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const ptp = dark?"#fff":"#1e1b4b";
  const pts = dark?"rgba(255,255,255,.6)":"rgba(30,27,75,.6)";
  const rr  = n => Math.min(n,14);
  const noiseEl = vals.noise>0?(
    <div style={{position:"absolute",inset:0,borderRadius:`${vals.radius}px`,pointerEvents:"none",zIndex:1,opacity:vals.noise/100,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,mixBlendMode:"overlay"}}/>
  ):null;

  const shapes = {
    card: <><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div style={{width:38,height:38,borderRadius:rr(vals.radius*.6),background:`rgba(${rgbStr},.28)`,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid rgba(${rgbStr},.35)`}}><Layers size={16} color={ptp}/></div><div><div style={{fontSize:14,fontWeight:700,color:ptp}}>Glass Card</div><div style={{fontSize:11,color:pts}}>live preview</div></div></div><div style={{fontSize:12,color:pts,lineHeight:1.65,marginBottom:16}}>Glassmorphism creates depth through frosted glass. Adjust sliders to craft your perfect style.</div><div style={{display:"flex",gap:8}}><div style={{flex:1,padding:"8px 0",borderRadius:rr(vals.radius*.55),background:`rgba(${rgbStr},.22)`,fontSize:11,fontWeight:600,color:ptp,textAlign:"center"}}>Confirm</div><div style={{flex:1,padding:"8px 0",borderRadius:rr(vals.radius*.55),border:`1px solid rgba(${rgbStr},${brdA})`,fontSize:11,color:pts,textAlign:"center"}}>Cancel</div></div></>,
    navbar: <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:7,background:`rgba(${rgbStr},.3)`}}/><span style={{fontSize:14,fontWeight:700,color:ptp}}>AppName</span></div><div style={{display:"flex",gap:16}}>{["Home","Work","About"].map(t=><span key={t} style={{fontSize:12,color:pts}}>{t}</span>)}</div><div style={{width:30,height:30,borderRadius:"50%",background:`rgba(${rgbStr},.3)`}}/></div>,
    modal: <><div style={{fontSize:16,fontWeight:700,color:ptp,marginBottom:8}}>Confirm Action</div><div style={{fontSize:12,color:pts,lineHeight:1.6,marginBottom:20}}>Are you sure you want to proceed? This action cannot be undone.</div><div style={{display:"flex",gap:8}}><div style={{flex:1,padding:"9px 0",borderRadius:rr(vals.radius*.6),background:"rgba(239,68,68,.3)",border:"1px solid rgba(239,68,68,.5)",fontSize:12,fontWeight:600,color:"#fca5a5",textAlign:"center"}}>Delete</div><div style={{flex:1,padding:"9px 0",borderRadius:rr(vals.radius*.6),background:`rgba(${rgbStr},.2)`,fontSize:12,color:pts,textAlign:"center"}}>Cancel</div></div></>,
    button: <div style={{display:"flex",alignItems:"center",gap:8}}><Layers size={15} color={ptp}/><span style={{fontSize:14,fontWeight:600,color:ptp}}>Glass Button</span></div>,
  };
  const padMap = {card:"24px 28px",navbar:"14px 24px",modal:"28px",button:"14px 32px"};
  const wMap   = {card:"clamp(280px, 55%, 460px)",navbar:"100%",modal:"clamp(280px, 50%, 420px)",button:"auto"};

  return (
    <div style={{minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",overflow:"hidden",position:"relative"}}>
      <style>{`
        @keyframes b1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-60px) scale(1.12)}66%{transform:translate(-25px,25px) scale(.9)}}
        @keyframes b2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,35px) scale(1.18)}66%{transform:translate(25px,-25px) scale(.85)}}
        @keyframes b3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,45px) scale(1.1)}}
        @keyframes b4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-18px,-20px) scale(1.2)}}
        @keyframes marsSun{0%,100%{box-shadow:0 0 50px #ff6b2b,0 0 100px rgba(255,107,43,.3)}50%{box-shadow:0 0 80px #ff8c42,0 0 180px rgba(255,140,66,.5)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes glassShimmer{0%,100%{filter:brightness(1)}50%{filter:brightness(1.1) hue-rotate(12deg)}}
        @keyframes toastPop{0%{opacity:0;transform:translateX(-50%) translateY(10px)}15%,85%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(10px)}}
        .ge-sl{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;outline:none;cursor:pointer;border:none}
        .ge-sl::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.35);cursor:pointer;transition:transform .15s}
        .ge-sl::-webkit-slider-thumb:active{transform:scale(1.22)}
        .ge-sl::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.35);cursor:pointer;border:none}
        .ge-btn{transition:all .18s ease !important}
        .ge-btn:not(:disabled):hover{transform:translateY(-1px) !important;filter:brightness(1.12) !important}
        .ge-btn:disabled{opacity:.35 !important;cursor:not-allowed !important}
        .ge-preset{transition:all .18s ease}
        .ge-preset:hover{transform:translateY(-2px)}
        .ge-tab:hover{background:rgba(167,139,250,.12) !important}
        .ge-swatch{transition:transform .15s ease}
        .ge-swatch:hover{transform:scale(1.18)}
        .ge-val{cursor:text;padding:1px 5px;border-radius:4px;transition:background .15s}
        .ge-val:hover{background:rgba(255,255,255,.14)}
        .ge-toast{position:fixed;bottom:24px;left:50%;background:rgba(12,6,30,.94);color:#fff;padding:10px 22px;border-radius:12px;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;z-index:9999;animation:toastPop 2.5s ease forwards;backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.15);white-space:nowrap}

        /* ── RESPONSIVE ── */
        .ge-grid{display:grid;grid-template-columns:265px 1fr;gap:10px;flex:1}
        .ge-controls{overflow-y:auto;max-height:640px}
        .ge-shortcut{font-size:10px;opacity:.6}
        .ge-preview-canvas{display:flex;justify-content:center;align-items:center;gap:24px;padding:12px 0;flex-wrap:wrap;min-height:140px}

        /* Large screens — wider controls, taller preview */
        @media (min-width:1400px){
          .ge-grid{grid-template-columns:300px 1fr}
          .ge-controls{max-height:740px}
          .ge-preview-canvas{min-height:200px}
        }
        /* Tablets — tighter grid */
        @media (max-width:900px){
          .ge-grid{grid-template-columns:1fr}
          .ge-controls{max-height:none}
        }
        /* Mobile — hide shortcut hints, shrink padding */
        @media (max-width:600px){
          .ge-shortcut{display:none}
          .ge-preview-canvas{gap:14px}
        }
      `}</style>

      {bg==="custom"&&customBg?(
        <div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:`url(${customBg})`,backgroundSize:"cover",backgroundPosition:"center"}}/>
      ):bg==="mars"?(
        <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#120600 0%,#3d1200 18%,#8a3608 42%,#c45518 62%,#d47038 78%,#b84a10 100%)"}}/>
          <div style={{position:"absolute",width:90,height:90,borderRadius:"50%",background:"radial-gradient(circle,#ffe4b5,#ff7c28)",top:"7%",right:"18%",animation:"marsSun 7s infinite ease-in-out"}}/>
          <svg style={{position:"absolute",bottom:0,width:"100%",height:"45%"}} viewBox="0 0 1400 280" preserveAspectRatio="none">
            <path d="M0,280 Q180,110 420,175 Q660,240 840,130 Q1020,20 1200,155 Q1330,225 1400,170 L1400,280Z" fill="#5a1e00"/>
            <path d="M0,280 Q130,190 320,225 Q520,262 720,205 Q920,148 1100,218 Q1270,258 1400,230 L1400,280Z" fill="#7a2c05"/>
            <path d="M0,280 Q90,245 280,262 Q480,278 680,248 Q880,218 1080,255 Q1240,272 1400,252 L1400,280Z" fill="#9a3c0a"/>
          </svg>
        </div>
      ):(
        <div style={{position:"fixed",inset:0,zIndex:0}}>
          <div style={{position:"absolute",inset:0,background:dark?"#0c0616":"#e6deff"}}/>
          <div style={{position:"absolute",width:620,height:620,borderRadius:"50%",background:"radial-gradient(circle,#7c3aed,transparent 70%)",top:"-12%",left:"-8%",opacity:.65,animation:"b1 9s infinite ease-in-out",filter:"blur(50px)"}}/>
          <div style={{position:"absolute",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,#ec4899,transparent 70%)",top:"15%",right:"-12%",opacity:.5,animation:"b2 11s infinite ease-in-out",filter:"blur(50px)"}}/>
          <div style={{position:"absolute",width:480,height:480,borderRadius:"50%",background:"radial-gradient(circle,#06b6d4,transparent 70%)",bottom:"-8%",left:"25%",opacity:.6,animation:"b3 8s infinite ease-in-out",filter:"blur(50px)"}}/>
          <div style={{position:"absolute",width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,#f59e0b,transparent 70%)",bottom:"18%",left:"8%",opacity:.4,animation:"b4 10s infinite ease-in-out",filter:"blur(45px)"}}/>
        </div>
      )}

      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:10,padding:"clamp(8px, 2vw, 14px)",minHeight:"100vh"}}>

        <div style={{...panel,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,animation:"fadeIn .3s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#a78bfa,#60a5fa)",display:"flex",alignItems:"center",justifyContent:"center"}}><Layers size={17} color="#fff"/></div>
            <div><div style={{fontSize:15,fontWeight:700,color:txtPri,letterSpacing:"-.4px"}}>Glassmorphism Engine</div><div style={{fontSize:10,color:txtSec,letterSpacing:".4px"}}>CSS GENERATOR · v3</div></div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <button className="ge-btn" onClick={undo} disabled={!history.length} style={{...panel,border:"none",cursor:"pointer",padding:"7px 12px",color:txtPri,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Undo2 size={13}/> Undo <span className="ge-shortcut">⌘Z</span></button>
            <button className="ge-btn" onClick={randomize} style={{...panel,border:"none",cursor:"pointer",padding:"7px 12px",color:txtPri,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Shuffle size={13}/> Random</button>
            <button className="ge-btn" onClick={share} style={{...panel,border:"none",cursor:"pointer",padding:"7px 12px",color:txtPri,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Share2 size={13}/> Share</button>
            <button className="ge-btn" onClick={exportImg} style={{...panel,border:"none",cursor:"pointer",padding:"7px 12px",color:txtPri,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Download size={13}/> {exporting?"Exporting…":"Export PNG"}</button>
            <button className="ge-btn" onClick={()=>bgFileRef.current?.click()} style={{...panel,border:"none",cursor:"pointer",padding:"7px 12px",color:txtPri,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Upload size={13}/> BG Image</button>
            <input ref={bgFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload}/>
            {bg!=="custom"?(
              <button className="ge-btn" onClick={()=>setBg(b=>b==="gradient"?"mars":"gradient")} style={{...panel,border:"none",cursor:"pointer",padding:"7px 12px",color:txtPri,fontSize:12}}>
                {bg==="gradient"?"🔴 Mars":"🌌 Gradient"}
              </button>
            ):(
              <button className="ge-btn" onClick={()=>{setCustomBg(null);setBg("gradient");}} style={{...panel,border:"none",cursor:"pointer",padding:"7px 12px",color:txtPri,fontSize:12,display:"flex",alignItems:"center",gap:5}}><X size={12}/> Clear BG</button>
            )}
            <button className="ge-btn" onClick={()=>setDark(d=>!d)} style={{...panel,border:"none",cursor:"pointer",padding:"7px 12px",color:txtPri,fontSize:12,display:"flex",alignItems:"center",gap:5}}>
              {dark?<Sun size={13}/>:<Moon size={13}/>}{dark?" Light":" Dark"}
            </button>
          </div>
        </div>

        <div style={{...panel,padding:"13px 18px",animation:"fadeIn .35s ease .05s both"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:txtSec,textTransform:"uppercase",letterSpacing:"1.2px"}}>Presets</div>
            <button onClick={()=>setUserPresets(p=>[...p,{id:`u${Date.now()}`,name:`Custom ${p.length+1}`,...valsRef.current}])} style={{...panel,border:"none",cursor:"pointer",padding:"5px 10px",color:accent,fontSize:11,display:"flex",alignItems:"center",gap:4}}>
              <Plus size={11}/> Save Current <span className="ge-shortcut">⌘S</span>
            </button>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {[...PRESETS,...userPresets].map(p=>{
              const a=activePreset===p.id;
              return (
                <div key={p.id} style={{position:"relative"}}>
                  <button className="ge-preset" onClick={()=>{saveHistory();setValsRaw({blur:p.blur,transparency:p.transparency,saturation:p.saturation,borderOpacity:p.borderOpacity,tint:p.tint,radius:p.radius,shadow:p.shadow,noise:p.noise??0});setPreset(p.id);}}
                    style={{padding:"8px 15px",borderRadius:11,background:a?"rgba(167,139,250,.22)":"rgba(255,255,255,.06)",border:a?`1.5px solid ${accent}`:"1.5px solid rgba(255,255,255,.14)",cursor:"pointer",color:a?accent:txtPri,fontSize:12,fontWeight:a?700:400,backdropFilter:"blur(8px)"}}>
                    {p.name}
                  </button>
                  {p.id.startsWith("u")&&(
                    <button onClick={()=>setUserPresets(pp=>pp.filter(x=>x.id!==p.id))} style={{position:"absolute",top:-5,right:-5,width:16,height:16,borderRadius:"50%",background:"rgba(239,68,68,.9)",border:"none",cursor:"pointer",color:"#fff",fontSize:11,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>×</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="ge-grid">

          <div className="ge-controls" style={{...panel,padding:"16px 18px",display:"flex",flexDirection:"column",gap:13,animation:"fadeIn .4s ease .1s both"}}>
            <div style={{fontSize:10,fontWeight:700,color:txtSec,textTransform:"uppercase",letterSpacing:"1.2px"}}>Controls</div>

            {SLIDERS.map(s=>{
              const pct=((vals[s.key]-s.min)/(s.max-s.min)*100).toFixed(1)+"%";
              const isEd=editKey===s.key;
              return (
                <div key={s.key}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:12,color:txtPri,fontWeight:500}}>{s.label}</span>
                    {isEd?(
                      <input autoFocus type="number" min={s.min} max={s.max} value={editTmp}
                        onChange={e=>setEditTmp(e.target.value)}
                        onBlur={()=>commitEdit(s.key,s.min,s.max)}
                        onKeyDown={e=>{if(e.key==="Enter")commitEdit(s.key,s.min,s.max);if(e.key==="Escape")setEditKey(null);}}
                        style={{width:55,fontSize:11,fontFamily:"ui-monospace,monospace",background:"rgba(255,255,255,.15)",border:`1px solid ${accent}`,borderRadius:5,padding:"2px 6px",color:txtPri,outline:"none",textAlign:"right"}}
                      />
                    ):(
                      <span className="ge-val" onClick={()=>{setEditKey(s.key);setEditTmp(String(vals[s.key]));}} title="Click to type exact value"
                        style={{fontSize:11,color:txtSec,fontFamily:"ui-monospace,monospace"}}>
                        {vals[s.key]}{s.unit}
                      </span>
                    )}
                  </div>
                  <input type="range" className="ge-sl" min={s.min} max={s.max} value={vals[s.key]}
                    onMouseDown={saveHistory}
                    onChange={e=>{setValsRaw(v=>({...v,[s.key]:Number(e.target.value)}));setPreset(null);}}
                    style={{background:`linear-gradient(to right,${accent} 0%,${accent} ${pct},rgba(255,255,255,.15) ${pct},rgba(255,255,255,.15) 100%)`}}
                  />
                </div>
              );
            })}

            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                <span style={{fontSize:12,color:txtPri,fontWeight:500}}>Glass Tint</span>
                <span style={{fontSize:11,color:txtSec,fontFamily:"ui-monospace,monospace"}}>{vals.tint}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                <input type="color" value={vals.tint} onChange={e=>{saveHistory();setValsRaw(v=>({...v,tint:e.target.value}));setPreset(null);}}
                  style={{width:34,height:28,borderRadius:7,border:"1px solid rgba(255,255,255,.2)",cursor:"pointer",background:"none",padding:2,flexShrink:0}}/>
                {SWATCHES.map(c=>(
                  <button key={c} className="ge-swatch" onClick={()=>{saveHistory();setValsRaw(v=>({...v,tint:c}));setPreset(null);}}
                    style={{width:22,height:22,borderRadius:"50%",background:c,border:vals.tint===c?"2.5px solid white":"2.5px solid transparent",cursor:"pointer",boxShadow:"0 2px 6px rgba(0,0,0,.3)",flexShrink:0}}/>
                ))}
              </div>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:6,borderTop:"1px solid rgba(255,255,255,.1)"}}>
              <div><div style={{fontSize:12,color:txtPri,fontWeight:500}}>Shimmer Animation</div><div style={{fontSize:10,color:txtSec,marginTop:2}}>CSS hue-rotate keyframe</div></div>
              <div onClick={()=>setAnimated(a=>!a)} style={{width:42,height:24,borderRadius:12,background:animated?accent:"rgba(255,255,255,.2)",cursor:"pointer",position:"relative",transition:"all .25s",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left:animated?19:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .25s",boxShadow:"0 2px 6px rgba(0,0,0,.3)"}}/>
              </div>
            </div>

            <div style={{borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:12,color:txtPri,fontWeight:500}}>Extra Layers <span style={{fontSize:10,color:txtSec,fontWeight:400}}>({extraLayers.length}/2)</span></div>
                <button onClick={()=>extraLayers.length<2&&setExtraLayers(l=>[...l,{id:Date.now(),blur:8,transparency:15,tint:"#ffffff",radius:12}])}
                  style={{...panel,border:"none",cursor:extraLayers.length>=2?"not-allowed":"pointer",padding:"4px 9px",color:accent,fontSize:11,display:"flex",alignItems:"center",gap:4,opacity:extraLayers.length>=2?.35:1}}>
                  <Plus size={10}/> Add
                </button>
              </div>
              {extraLayers.length===0&&<div style={{fontSize:11,color:txtSec,textAlign:"center",padding:"6px 0",opacity:.7}}>Stack up to 2 additional glass layers</div>}
              {extraLayers.map((l,i)=>(
                <div key={l.id} style={{padding:"10px",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                    <span style={{fontSize:11,fontWeight:700,color:txtSec}}>Layer {i+2}</span>
                    <button onClick={()=>setExtraLayers(ll=>ll.filter(x=>x.id!==l.id))} style={{background:"none",border:"none",cursor:"pointer",color:txtSec,padding:0,display:"flex",alignItems:"center"}}><X size={12}/></button>
                  </div>
                  {[{k:"blur",min:0,max:40,label:"Blur"},{k:"transparency",min:0,max:100,label:"Alpha"},{k:"radius",min:0,max:48,label:"Radius"}].map(({k,min,max,label})=>{
                    const pp=((l[k]-min)/(max-min)*100).toFixed(1)+"%";
                    return (
                      <div key={k} style={{marginBottom:7}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,color:txtSec}}>{label}</span><span style={{fontSize:10,color:txtSec,fontFamily:"monospace"}}>{l[k]}</span></div>
                        <input type="range" className="ge-sl" min={min} max={max} value={l[k]}
                          onChange={e=>setExtraLayers(ll=>ll.map(x=>x.id===l.id?{...x,[k]:Number(e.target.value)}:x))}
                          style={{background:`linear-gradient(to right,${accent} 0%,${accent} ${pp},rgba(255,255,255,.15) ${pp},rgba(255,255,255,.15) 100%)`}}
                        />
                      </div>
                    );
                  })}
                  <div style={{display:"flex",gap:5,marginTop:5}}>
                    {SWATCHES.slice(0,5).map(c=>(
                      <button key={c} onClick={()=>setExtraLayers(ll=>ll.map(x=>x.id===l.id?{...x,tint:c}:x))} style={{width:18,height:18,borderRadius:"50%",background:c,border:l.tint===c?"2px solid white":"2px solid transparent",cursor:"pointer",flexShrink:0,transition:"transform .15s"}}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10}}>

            <div style={{...panel,padding:"16px 18px",animation:"fadeIn .4s ease .12s both"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",gap:3,background:dark?"rgba(0,0,0,.22)":"rgba(0,0,0,.06)",padding:4,borderRadius:10}}>
                  {SHAPES.map(s=>(
                    <button key={s} onClick={()=>setShape(s)} style={{padding:"5px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:shape===s?700:400,background:shape===s?accent:"transparent",color:shape===s?"#fff":txtSec,transition:"all .18s",textTransform:"capitalize"}}>
                      {s}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div title={`Contrast ratio: ${ratio.toFixed(2)}:1`} style={{padding:"4px 10px",borderRadius:20,background:isAAA?"rgba(74,222,128,.16)":isAA?"rgba(251,191,36,.16)":"rgba(239,68,68,.16)",border:`1px solid ${isAAA?"rgba(74,222,128,.4)":isAA?"rgba(251,191,36,.4)":"rgba(239,68,68,.4)"}`,fontSize:10,fontWeight:700,color:isAAA?"#4ade80":isAA?"#fbbf24":"#f87171",cursor:"default"}}>
                    WCAG {isAAA?"AAA ✓":isAA?"AA ✓":"Fail ✗"} — {ratio.toFixed(1)}:1
                  </div>
                  <button onClick={()=>setCompare(c=>!c)} style={{padding:"5px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:compare?700:400,background:compare?accent:"rgba(255,255,255,.08)",color:compare?"#fff":txtSec,transition:"all .18s"}}>
                    ⊢⊣ Compare
                  </button>
                </div>
              </div>

              <div ref={previewRef} className="ge-preview-canvas">
                {compare&&(
                  <div>
                    <div style={{fontSize:9,color:txtSec,textAlign:"center",marginBottom:6,letterSpacing:".6px",fontWeight:700}}>WITHOUT GLASS</div>
                    <div style={{...noGlass,padding:padMap[shape],width:wMap[shape]}}>{shapes[shape]}</div>
                  </div>
                )}
                <div>
                  {compare&&<div style={{fontSize:9,color:txtSec,textAlign:"center",marginBottom:6,letterSpacing:".6px",fontWeight:700}}>WITH GLASS</div>}
                  <div style={{position:"relative",display:"inline-block"}}>
                    <div style={{...previewStyle,padding:padMap[shape],width:wMap[shape],...(animated?{animation:"glassShimmer 4s infinite ease-in-out"}:{})}}>
                      {noiseEl}
                      <div style={{position:"relative",zIndex:2}}>{shapes[shape]}</div>
                    </div>
                    {extraLayers.map((l,i)=>{
                      const r2=hexToRgb(l.tint);
                      return <div key={l.id} style={{position:"absolute",top:`-${(i+1)*5}px`,left:`-${(i+1)*5}px`,right:`-${(i+1)*5}px`,bottom:`-${(i+1)*5}px`,background:`rgba(${r2[0]},${r2[1]},${r2[2]},${Math.min(l.transparency/100*.45,.35).toFixed(2)})`,backdropFilter:`blur(${l.blur}px)`,WebkitBackdropFilter:`blur(${l.blur}px)`,borderRadius:`${l.radius}px`,border:`1px solid rgba(${r2[0]},${r2[1]},${r2[2]},.22)`,zIndex:-(i+1),pointerEvents:"none"}}/>;
                    })}
                  </div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginTop:10}}>
                {[["Blur",`${vals.blur}px`],["Alpha",bgA],["Radius",`${vals.radius}px`],["Shadow",`${vals.shadow}px`],["Layers",`${1+extraLayers.length}`]].map(([k,v])=>(
                  <div key={k} style={{padding:"6px 8px",borderRadius:10,background:dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.05)",textAlign:"center"}}>
                    <div style={{fontSize:9,color:txtSec,marginBottom:2,letterSpacing:".5px"}}>{k.toUpperCase()}</div>
                    <div style={{fontSize:12,fontWeight:700,color:txtPri,fontFamily:"ui-monospace,monospace"}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{...panel,padding:"16px 18px",flex:1,animation:"fadeIn .4s ease .16s both"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",gap:3,background:dark?"rgba(0,0,0,.25)":"rgba(0,0,0,.07)",padding:4,borderRadius:12}}>
                  {[["plain","CSS",Code],["vars","Variables",Braces],["tailwind","Tailwind",Wind],["react","React",Code],["vue","Vue",Code]].map(([t,label,Icon])=>(
                    <button key={t} className="ge-tab" onClick={()=>setTab(t)}
                      style={{padding:"5px 10px",borderRadius:9,border:"none",cursor:"pointer",fontSize:11,fontWeight:tab===t?700:400,background:tab===t?accent:"transparent",color:tab===t?"#fff":txtSec,display:"flex",alignItems:"center",gap:4,transition:"all .18s"}}>
                      <Icon size={10}/>{label}
                    </button>
                  ))}
                </div>
                <button className="ge-btn" onClick={handleCopy} style={{...panel,border:"none",cursor:"pointer",padding:"6px 14px",color:copied?"#4ade80":txtPri,fontSize:12,display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
                  {copied?<Check size={12} color="#4ade80"/>:<Copy size={12}/>}
                  {copied?"Copied!":"Copy"}
                </button>
              </div>
              <pre style={{margin:0,padding:"14px 16px",borderRadius:12,background:codeBg,fontSize:"10.5px",color:codeFg,fontFamily:"ui-monospace,'Cascadia Code','SF Mono',monospace",overflowX:"auto",lineHeight:1.75,whiteSpace:"pre",maxHeight:195,overflowY:"auto"}}>
                {outMap[tab]}
              </pre>
              <div style={{marginTop:8,fontSize:10.5,color:txtSec,lineHeight:1.5}}>
                {tab==="plain"    &&"Drop .glass on any element. Add position:relative; overflow:hidden for noise texture."}
                {tab==="vars"     &&"Paste :root block in global CSS. Override per-component using the cascade."}
                {tab==="tailwind" &&"Requires Tailwind v3.3+ with JIT enabled for arbitrary-value class support."}
                {tab==="react"    &&"Import GlassCard anywhere. Use the style prop to override per-instance."}
                {tab==="vue"      &&"Drop in components/. Use <slot/> to pass any child content into the glass container."}
              </div>
            </div>

          </div>
        </div>
      </div>

      {shareToast&&<div className="ge-toast">🔗 Share link copied — paste it anywhere</div>}
    </div>
  );
}
