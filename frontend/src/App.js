import { useState, useEffect, useRef } from "react";

/* ── inject fonts + global CSS ── */
(function () {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Clash+Display:wght@500;600;700&family=Cabinet+Grotesk:wght@300;400;500;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #03050f; }
    :root {
      --gold: #f5c842; --gold2: #ff9f43; --blue: #4fc3f7;
      --green: #43e97b; --red: #ff6b6b; --purple: #a78bfa;
      --dark: #03050f; --card: rgba(8,14,35,0.85);
      --border: rgba(245,200,66,0.2); --text: #eef2ff;
      --muted: rgba(210,225,255,0.38);
    }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(245,200,66,0.45)} 50%{box-shadow:0 0 0 14px rgba(245,200,66,0)} }
    @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes spin     { from{transform:rotate(0)} to{transform:rotate(360deg)} }
    @keyframes popIn    { 0%{opacity:0;transform:scale(0.8)} 100%{opacity:1;transform:scale(1)} }
    @keyframes ringOut  { 0%{transform:scale(0.9);opacity:0.8} 100%{transform:scale(2.1);opacity:0} }
    @keyframes aurora   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(4%,6%) scale(1.1)} }
    @keyframes planeGo  { 0%{left:-120px;opacity:1} 85%{opacity:1} 100%{left:calc(100vw + 120px);opacity:0} }
    @keyframes floatPlane { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
    @keyframes countUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes barGrow  { from{width:0} to{width:var(--bar-w)} }
    @keyframes metricIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
    @keyframes badgePop { 0%{opacity:0;transform:scale(0.7) translateY(6px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes copyFlash { 0%{background:rgba(67,233,123,0.35)} 100%{background:rgba(67,233,123,0.07)} }
    select option { background:#080e23; color:#eef2ff; }
    input[type=date]::-webkit-calendar-picker-indicator,
    input[type=time]::-webkit-calendar-picker-indicator { filter:invert(0.65); cursor:pointer; }
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
    input::placeholder { color: var(--muted); }
    .tab-btn { transition: all 0.2s ease; }
    .tab-btn:hover { opacity: 0.85; }
  `;
  document.head.appendChild(s);
})();

/* ── ML Model Data ── */
const ML_MODELS = [
  {
    name:"Random Forest", shortName:"RF", emoji:"🌲", color:"#43e97b",
    trainScore:0.9512, r2:0.8082, mae:1186.49, mse:3734348.37, rmse:1932.45, mape:13.30,
    isBest:true,
    bestParams:{ n_estimators:760, max_depth:13, min_samples_split:5, max_features:"auto" },
    tuned_r2:0.8215,
  },
  {
    name:"Decision Tree", shortName:"DT", emoji:"🌿", color:"#a78bfa",
    trainScore:0.9666, r2:0.6996, mae:1368.74, mse:5847289.91, rmse:2418.12, mape:15.21,
    isBest:false, bestParams:null, tuned_r2:null,
  },
];

/* ── Route data ── */
const ROUTE_DATA = {
  "Delhi-Cochin":         { duration:180, stops:1 },
  "Delhi-Banglore":       { duration:150, stops:0 },
  "Delhi-Kolkata":        { duration:120, stops:0 },
  "Delhi-Hyderabad":      { duration:130, stops:0 },
  "Mumbai-Cochin":        { duration:110, stops:0 },
  "Mumbai-Banglore":      { duration:100, stops:0 },
  "Mumbai-Kolkata":       { duration:150, stops:1 },
  "Mumbai-Hyderabad":     { duration:90,  stops:0 },
  "Mumbai-Delhi":         { duration:120, stops:0 },
  "Banglore-Cochin":      { duration:80,  stops:0 },
  "Banglore-Delhi":       { duration:150, stops:0 },
  "Banglore-Kolkata":     { duration:160, stops:1 },
  "Banglore-Hyderabad":   { duration:75,  stops:0 },
  "Kolkata-Cochin":       { duration:200, stops:1 },
  "Kolkata-Banglore":     { duration:160, stops:1 },
  "Kolkata-Delhi":        { duration:120, stops:0 },
  "Kolkata-Hyderabad":    { duration:130, stops:0 },
  "Chennai-Cochin":       { duration:70,  stops:0 },
  "Chennai-Delhi":        { duration:160, stops:0 },
  "Chennai-Banglore":     { duration:60,  stops:0 },
  "Chennai-Kolkata":      { duration:150, stops:1 },
  "Chennai-Hyderabad":    { duration:80,  stops:0 },
};

/* ── Price history (12 months, simulated) ── */
const PRICE_HISTORY = {
  "Delhi-Cochin":         [4200,4500,5100,6200,5800,4900,4600,5200,6100,7200,6800,5500],
  "Delhi-Banglore":       [3800,4000,4600,5500,5200,4400,4100,4800,5600,6500,6100,5000],
  "Delhi-Kolkata":        [3200,3500,4000,4800,4500,3800,3600,4100,4900,5700,5400,4300],
  "Delhi-Hyderabad":      [3500,3700,4200,5100,4800,4000,3800,4300,5100,6000,5700,4600],
  "Mumbai-Cochin":        [3900,4200,4800,5700,5400,4600,4300,4900,5700,6700,6300,5200],
  "Mumbai-Banglore":      [2800,3100,3600,4400,4200,3500,3300,3800,4500,5300,5000,3900],
  "Mumbai-Kolkata":       [4100,4400,5000,5900,5600,4800,4500,5100,5900,6900,6500,5400],
  "Mumbai-Hyderabad":     [2500,2800,3200,3900,3700,3100,2900,3300,3900,4600,4400,3500],
  "Mumbai-Delhi":         [3300,3600,4100,4900,4700,3900,3700,4200,5000,5800,5500,4400],
  "Banglore-Cochin":      [2200,2400,2800,3400,3200,2700,2500,2900,3400,4000,3800,3000],
  "Banglore-Delhi":       [3800,4100,4700,5600,5300,4500,4200,4800,5600,6500,6200,5000],
  "Banglore-Kolkata":     [4300,4600,5200,6200,5900,5000,4700,5300,6200,7200,6800,5500],
  "Banglore-Hyderabad":   [1800,2000,2300,2800,2700,2200,2100,2400,2800,3300,3100,2500],
  "Kolkata-Cochin":       [4800,5100,5800,6900,6500,5600,5200,5900,6800,7900,7500,6100],
  "Kolkata-Delhi":        [3200,3500,4000,4800,4600,3800,3600,4100,4900,5700,5400,4300],
  "Kolkata-Banglore":     [4300,4600,5300,6300,6000,5100,4800,5400,6300,7300,6900,5600],
  "Kolkata-Hyderabad":    [3600,3900,4400,5300,5000,4300,4000,4600,5400,6300,5900,4800],
  "Chennai-Cochin":       [1900,2100,2400,2900,2800,2300,2100,2500,2900,3400,3200,2600],
  "Chennai-Delhi":        [4100,4400,5000,5900,5600,4800,4500,5100,5900,6900,6500,5300],
  "Chennai-Banglore":     [1600,1800,2100,2500,2400,2000,1800,2100,2500,2900,2800,2200],
  "Chennai-Kolkata":      [4400,4700,5300,6300,6000,5100,4800,5400,6300,7300,6900,5600],
  "Chennai-Hyderabad":    [2100,2300,2700,3200,3000,2600,2400,2700,3200,3700,3500,2800],
};

const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const AIRLINES = ["IndiGo","Air India","Jet Airways","SpiceJet","Vistara","GoAir","Air Asia"];
const SRCS     = ["Delhi","Mumbai","Banglore","Kolkata","Chennai"];
const DSTS     = ["Cochin","Delhi","Banglore","Kolkata","Hyderabad"];

const AIRLINE_COLORS = {
  "IndiGo":"#4fc3f7","Air India":"#ff9f43","Jet Airways":"#a78bfa",
  "SpiceJet":"#ff6b6b","Vistara":"#43e97b","GoAir":"#f5c842","Air Asia":"#fc5c7d",
};

/* ── Price insight helper ── */
function getPriceInsight(price, routeKey) {
  const hist = PRICE_HISTORY[routeKey];
  if (!hist) return null;
  const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
  const min = Math.min(...hist);
  const max = Math.max(...hist);
  if (price <= min + (avg - min) * 0.4)
    return { label:"Great Deal", emoji:"🟢", color:"#43e97b", bg:"rgba(67,233,123,0.08)", border:"rgba(67,233,123,0.3)", desc:`₹${Math.round(avg - price).toLocaleString("en-IN")} below average` };
  if (price <= avg * 1.05)
    return { label:"Fair Price", emoji:"🟡", color:"#f5c842", bg:"rgba(245,200,66,0.08)", border:"rgba(245,200,66,0.3)", desc:"Close to average for this route" };
  if (price <= max * 0.9)
    return { label:"Slightly High", emoji:"🟠", color:"#ff9f43", bg:"rgba(255,159,67,0.08)", border:"rgba(255,159,67,0.3)", desc:`₹${Math.round(price - avg).toLocaleString("en-IN")} above average` };
  return { label:"Expensive", emoji:"🔴", color:"#ff6b6b", bg:"rgba(255,107,107,0.08)", border:"rgba(255,107,107,0.3)", desc:"Peak pricing period" };
}

/* ── Stars ── */
function Stars() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext("2d");
    let raf;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 200 }, () => ({
      x:Math.random(), y:Math.random(),
      r:Math.random()*1.3+0.2,
      phase:Math.random()*Math.PI*2,
      speed:Math.random()*0.008+0.003,
    }));
    const tick = () => {
      ctx.clearRect(0,0,c.width,c.height);
      stars.forEach(s => {
        s.phase += s.speed;
        const a = 0.25+0.75*Math.abs(Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x*c.width, s.y*c.height, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(200,218,255,${a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

/* ── Aurora ── */
function Aurora() {
  const blobs = [
    { c:"rgba(79,195,247,0.11)",  x:"-10%", y:"-15%", w:"65vw", d:"0s",   dur:"20s" },
    { c:"rgba(245,200,66,0.08)",  x:"50%",  y:"30%",  w:"55vw", d:"-8s",  dur:"25s" },
    { c:"rgba(110,60,200,0.09)",  x:"15%",  y:"55%",  w:"60vw", d:"-15s", dur:"22s" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
      {blobs.map((b,i) => (
        <div key={i} style={{
          position:"absolute", left:b.x, top:b.y,
          width:b.w, height:b.w, borderRadius:"50%",
          background:`radial-gradient(ellipse, ${b.c} 0%, transparent 70%)`,
          animation:`aurora ${b.dur} ease-in-out infinite`,
          animationDelay:b.d,
        }}/>
      ))}
    </div>
  );
}

/* ── Flying Plane ── */
function FlyingPlane({ go }) {
  const [visible, setVisible] = useState(false);
  const key = useRef(0);
  useEffect(() => {
    if (!go) return;
    key.current++;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [go]);
  if (!visible) return null;
  return (
    <div key={key.current} style={{
      position:"fixed", top:"16%", zIndex:60, pointerEvents:"none",
      fontSize:"40px",
      filter:"drop-shadow(0 0 20px rgba(245,200,66,1))",
      animation:`planeGo 2.8s cubic-bezier(0.4,0,0.6,1) forwards, floatPlane 1.5s ease-in-out infinite`,
    }}>✈</div>
  );
}

/* ── Field ── */
function Field({ label, delay="0s", children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{
      background: focused ? "rgba(245,200,66,0.07)" : "rgba(255,255,255,0.03)",
      border:`1px solid ${focused ? "rgba(245,200,66,0.6)" : "rgba(255,255,255,0.08)"}`,
      borderRadius:"14px", padding:"13px 15px",
      transition:"all 0.22s ease",
      boxShadow: focused ? "0 0 0 3px rgba(245,200,66,0.12)" : "none",
      animation:`fadeUp 0.5s ease both`, animationDelay:delay,
    }}>
      <label style={{
        fontSize:"9px", textTransform:"uppercase", letterSpacing:"1.5px",
        color: focused ? "var(--gold)" : "var(--muted)",
        fontWeight:600, display:"block", marginBottom:"5px", transition:"color 0.2s",
      }}>{label}</label>
      {children}
    </div>
  );
}

const iBase = {
  background:"transparent", border:"none", outline:"none",
  fontFamily:"'Cabinet Grotesk', sans-serif",
  fontSize:"15px", fontWeight:500, color:"var(--text)",
  width:"100%", appearance:"none", cursor:"pointer",
};

/* ── Counter ── */
function Counter({ target }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const dur = 1300;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts-start)/dur, 1);
      const ease = 1-Math.pow(1-p, 4);
      setVal(Math.round(ease*target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <>{val.toLocaleString("en-IN")}</>;
}

/* ── AnimNum ── */
function AnimNum({ target, decimals=0, prefix="", suffix="" }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const dur = 900;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts-start)/dur, 1);
      const ease = 1-Math.pow(1-p, 3);
      setVal(+(ease*target).toFixed(decimals));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <>{prefix}{typeof val==="number" ? val.toLocaleString("en-IN",{minimumFractionDigits:decimals,maximumFractionDigits:decimals}) : val}{suffix}</>;
}

/* ── Bar ── */
function Bar({ value, max, color, animated }) {
  const pct = Math.min((value/max)*100, 100);
  return (
    <div style={{ height:"5px", background:"rgba(255,255,255,0.07)", borderRadius:"3px", overflow:"hidden", flex:1 }}>
      <div style={{
        height:"100%", width:animated ? `${pct}%` : "0%",
        background:color, borderRadius:"3px",
        transition:"width 1s cubic-bezier(0.4,0,0.2,1)",
        boxShadow:`0 0 6px ${color}80`,
      }}/>
    </div>
  );
}

/* ── Model Metrics Panel ── */
function ModelMetricsPanel({ visible }) {
  const [animated, setAnimated] = useState(false);
  const [activeModel, setActiveModel] = useState(0);

  useEffect(() => {
    if (visible) { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }
    else setAnimated(false);
  }, [visible]);

  const model = ML_MODELS[activeModel];

  return (
    <div style={{
      marginTop:"20px", background:"rgba(8,14,35,0.7)",
      border:"1px solid rgba(79,195,247,0.2)", borderRadius:"20px", overflow:"hidden",
      animation:visible ? "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
    }}>
      <div style={{
        padding:"14px 18px 10px", background:"rgba(79,195,247,0.06)",
        borderBottom:"1px solid rgba(79,195,247,0.15)",
        display:"flex", alignItems:"center", gap:"10px",
      }}>
        <span style={{ fontSize:"15px" }}>📊</span>
        <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--blue)" }}>
          Model Performance Metrics
        </span>
        <div style={{ marginLeft:"auto", fontSize:"9px", color:"var(--muted)", letterSpacing:"0.8px", textTransform:"uppercase" }}>
          From Training Notebook
        </div>
      </div>

      {/* Model tabs */}
      <div style={{ display:"flex", gap:"8px", padding:"12px 18px 0" }}>
        {ML_MODELS.map((m,i) => (
          <button key={i} className="tab-btn" onClick={() => setActiveModel(i)} style={{
            background: activeModel===i ? `rgba(${m.color==="#43e97b"?"67,233,123":"167,139,250"},0.15)` : "rgba(255,255,255,0.04)",
            border:`1px solid ${activeModel===i ? m.color+"60" : "rgba(255,255,255,0.08)"}`,
            borderRadius:"10px", padding:"6px 14px",
            color: activeModel===i ? m.color : "var(--muted)",
            fontSize:"12px", fontWeight:600, cursor:"pointer",
            fontFamily:"'Cabinet Grotesk', sans-serif",
            display:"flex", alignItems:"center", gap:"6px",
          }}>
            <span>{m.emoji}</span>{m.name}
            {m.isBest && <span style={{
              fontSize:"8px", background:"#43e97b22", color:"#43e97b",
              border:"1px solid #43e97b44", borderRadius:"4px", padding:"1px 4px",
            }}>BEST</span>}
          </button>
        ))}
      </div>

      <div style={{ padding:"14px 18px 18px" }}>
        {/* Score cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"14px" }}>
          {[
            { label:"R² Score", value:model.r2, decimals:4, color:model.color, icon:"🎯", note:"higher = better" },
            { label:"RMSE",     value:model.rmse, decimals:2, color:"#f5c842", icon:"📉", note:"₹ error (lower = better)", prefix:"₹" },
            { label:"MAE",      value:model.mae,  decimals:2, color:"#ff9f43", icon:"📐", note:"mean abs error", prefix:"₹" },
          ].map((m,i) => (
            <div key={i} style={{
              background:"rgba(255,255,255,0.03)", border:`1px solid ${m.color}25`,
              borderRadius:"14px", padding:"12px 12px 10px",
              animation:animated ? `metricIn 0.4s ease both` : "none",
              animationDelay:`${i*0.08}s`,
            }}>
              <div style={{ fontSize:"16px", marginBottom:"4px" }}>{m.icon}</div>
              <div style={{ fontSize:"18px", fontWeight:700, color:m.color, fontFamily:"'Clash Display', sans-serif", letterSpacing:"-0.5px" }}>
                {animated ? <AnimNum target={m.value} decimals={m.decimals} prefix={m.prefix||""}/> : "—"}
              </div>
              <div style={{ fontSize:"9px", color:"var(--muted)", marginTop:"2px", fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase" }}>{m.label}</div>
              <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.2)", marginTop:"1px" }}>{m.note}</div>
            </div>
          ))}
        </div>

        {/* MAPE + Train */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
          {[
            { label:"MAPE",        value:model.mape,           suffix:"%",  color:"#60a5fa", note:"mean abs % error" },
            { label:"Train Score", value:model.trainScore*100, suffix:"%",  color:model.color, note:"fit on training data" },
          ].map((m,i) => (
            <div key={i} style={{
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:"12px", padding:"10px 14px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              animation:animated ? `metricIn 0.4s ease both` : "none",
              animationDelay:`${(i+3)*0.08}s`,
            }}>
              <div>
                <div style={{ fontSize:"9px", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", fontWeight:600 }}>{m.label}</div>
                <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.18)", marginTop:"1px" }}>{m.note}</div>
              </div>
              <div style={{ fontSize:"20px", fontWeight:700, color:m.color, fontFamily:"'Clash Display', sans-serif" }}>
                {animated ? <AnimNum target={m.value} decimals={2} suffix={m.suffix}/> : "—"}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison bars */}
        <div style={{
          background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:"14px", padding:"14px",
          animation:animated ? "metricIn 0.5s ease 0.5s both" : "none",
        }}>
          <div style={{ fontSize:"9px", textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--muted)", fontWeight:600, marginBottom:"12px" }}>
            Model Comparison
          </div>
          {[
            { label:"R² Score",     key:"r2",   max:1,  fmt:v => v.toFixed(4) },
            { label:"RMSE (÷100)", key:"rmse", max:30, fmt:v => `₹${v.toFixed(0)}` },
            { label:"MAE (÷100)",  key:"mae",  max:20, fmt:v => `₹${v.toFixed(0)}` },
          ].map((metric,mi) => (
            <div key={mi} style={{ marginBottom:mi<2?"10px":0 }}>
              <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", letterSpacing:"0.8px", marginBottom:"5px", textTransform:"uppercase" }}>{metric.label}</div>
              {ML_MODELS.map((m,i) => {
                const rawVal = m[metric.key];
                const displayVal = metric.key==="rmse" ? rawVal/100 : metric.key==="mae" ? rawVal/100 : rawVal;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                    <div style={{ width:"22px", fontSize:"13px" }}>{m.emoji}</div>
                    <Bar value={displayVal} max={metric.max} color={m.color} animated={animated}/>
                    <div style={{ fontSize:"10px", color:m.color, fontWeight:700, minWidth:"60px", textAlign:"right" }}>
                      {metric.fmt(rawVal)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Best params */}
        {model.isBest && model.bestParams && (
          <div style={{
            marginTop:"12px", background:"rgba(67,233,123,0.05)",
            border:"1px solid rgba(67,233,123,0.15)", borderRadius:"12px", padding:"12px 14px",
            animation:animated ? "metricIn 0.5s ease 0.7s both" : "none",
          }}>
            <div style={{ fontSize:"9px", color:"#43e97b", letterSpacing:"1.5px", fontWeight:700, textTransform:"uppercase", marginBottom:"8px" }}>
              🔧 Best Hyperparams (RandomizedSearchCV · 3-fold CV)
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {Object.entries(model.bestParams).map(([k,v]) => (
                <div key={k} style={{
                  background:"rgba(67,233,123,0.08)", border:"1px solid rgba(67,233,123,0.2)",
                  borderRadius:"8px", padding:"4px 9px",
                  fontSize:"10px", color:"rgba(255,255,255,0.6)", fontFamily:"monospace",
                }}>
                  <span style={{ color:"#43e97b" }}>{k}</span>: {v}
                </div>
              ))}
              <div style={{
                background:"rgba(67,233,123,0.12)", border:"1px solid rgba(67,233,123,0.3)",
                borderRadius:"8px", padding:"4px 9px",
                fontSize:"10px", fontWeight:700, color:"#43e97b",
              }}>
                Tuned R²: {model.tuned_r2}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop:"10px", fontSize:"9px", color:"rgba(255,255,255,0.18)", textAlign:"center", letterSpacing:"0.5px" }}>
          Metrics from <span style={{ color:"rgba(255,255,255,0.35)" }}>flight_prediction_shan_singh.ipynb</span> · Test split 25%
        </div>
      </div>
    </div>
  );
}

/* ── Price History Chart (FIXED visible bars) ── */
function PriceHistoryChart({ route }) {
  const data = PRICE_HISTORY[route];
  if (!data) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const currentMonth = new Date().getMonth();

  return (
    <div style={{
      marginTop:"20px", background:"rgba(8,14,35,0.7)",
      border:"1px solid rgba(79,195,247,0.2)", borderRadius:"20px", overflow:"hidden",
      animation:"popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <div style={{
        padding:"14px 18px 10px", background:"rgba(79,195,247,0.06)",
        borderBottom:"1px solid rgba(79,195,247,0.15)",
        display:"flex", alignItems:"center", gap:"10px",
      }}>
        <span style={{ fontSize:"15px" }}>📈</span>
        <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--blue)" }}>
          Price Trend — {route.replace("-"," → ")}
        </span>
        <div style={{ marginLeft:"auto", fontSize:"9px", color:"var(--muted)", letterSpacing:"0.8px", textTransform:"uppercase" }}>
          Simulated Historical Data
        </div>
      </div>

      <div style={{ padding:"16px 18px 18px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:"4px", height:"130px", marginBottom:"8px", paddingTop:"24px" }}>
          {data.map((val, i) => {
            const heightPct = ((val - min) / (max - min)) * 75 + 25;
            const isCurrent = i === currentMonth;
            const isHigh    = val === max;
            const isLow     = val === min;
            const barColor  = isCurrent
              ? "linear-gradient(180deg,#f5c842,#ff9f43)"
              : isHigh ? "#ff6b6b"
              : isLow  ? "#43e97b"
              : "#4fc3f7";
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end", position:"relative" }}>
                {(isCurrent || isHigh || isLow) && (
                  <div style={{
                    position:"absolute", top:0,
                    fontSize:"8px", fontWeight:700, whiteSpace:"nowrap",
                    color: isCurrent ? "#f5c842" : isHigh ? "#ff6b6b" : "#43e97b",
                  }}>₹{(val/1000).toFixed(1)}k</div>
                )}
                <div style={{
                  width:"100%",
                  height:`${heightPct}%`,
                  background: barColor,
                  borderRadius:"3px 3px 0 0",
                  boxShadow: isCurrent ? "0 0 10px rgba(245,200,66,0.6)" : isHigh ? "0 0 8px rgba(255,107,107,0.4)" : isLow ? "0 0 8px rgba(67,233,123,0.4)" : "0 0 6px rgba(79,195,247,0.3)",
                  transition:"height 0.8s ease",
                }}/>
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:"4px" }}>
          {MONTHS.map((m,i) => (
            <div key={i} style={{
              flex:1, textAlign:"center",
              fontSize:"8px",
              color: i===currentMonth ? "#f5c842" : "var(--muted)",
              fontWeight: i===currentMonth ? 700 : 400,
            }}>{m}</div>
          ))}
        </div>

        <div style={{ display:"flex", gap:"16px", marginTop:"12px", fontSize:"9px", color:"var(--muted)", flexWrap:"wrap" }}>
          {[
            { color:"#f5c842", label:"Current month" },
            { color:"#43e97b", label:`Cheapest (₹${min.toLocaleString("en-IN")})` },
            { color:"#ff6b6b", label:`Priciest (₹${max.toLocaleString("en-IN")})` },
            { color:"#4fc3f7", label:"Other months" },
          ].map(({ color, label }) => (
            <span key={label} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
              <span style={{ width:"8px", height:"8px", background:color, borderRadius:"2px", display:"inline-block", flexShrink:0 }}/>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Airline Comparison Panel ── */
function AirlineComparisonPanel({ source, destination, journeyDate, departureTime }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const routeKey  = `${source}-${destination}`;
  const routeInfo = ROUTE_DATA[routeKey] || { duration:120, stops:1 };

  useEffect(() => {
    if (!source || !destination || !journeyDate || !departureTime) return;
    fetchAll();
  }, [source, destination, journeyDate, departureTime]);

  const fetchAll = async () => {
    setLoading(true); setResults([]); setDone(false);
    const promises = AIRLINES.map(async airline => {
      try {
        const res = await fetch("https://aeroprice-backend-uro9.onrender.com/predict", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ airline, source, destination, stops:routeInfo.stops, duration:routeInfo.duration, journey_date:journeyDate, departure_time:departureTime }),
        });
        const data = await res.json();
        if (res.ok && data.predicted_price != null) return { airline, price:Math.round(data.predicted_price) };
        return null;
      } catch { return null; }
    });
    const all = (await Promise.all(promises)).filter(Boolean);
    all.sort((a,b) => a.price - b.price);
    setResults(all); setLoading(false); setDone(true);
  };

  const minPrice = results[0]?.price || 0;
  const maxPrice = results[results.length-1]?.price || 1;

  return (
    <div style={{
      marginTop:"20px", background:"rgba(8,14,35,0.7)",
      border:"1px solid rgba(245,200,66,0.2)", borderRadius:"20px", overflow:"hidden",
      animation:"popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <div style={{
        padding:"14px 18px 10px", background:"rgba(245,200,66,0.06)",
        borderBottom:"1px solid rgba(245,200,66,0.15)",
        display:"flex", alignItems:"center", gap:"10px",
      }}>
        <span style={{ fontSize:"15px" }}>✈</span>
        <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--gold)" }}>
          All Airlines — {source} → {destination}
        </span>
        {loading && (
          <div style={{
            marginLeft:"auto", width:"14px", height:"14px",
            border:"2px solid rgba(245,200,66,0.3)", borderTopColor:"var(--gold)",
            borderRadius:"50%", animation:"spin 0.7s linear infinite",
          }}/>
        )}
      </div>

      <div style={{ padding:"14px 18px 18px" }}>
        {loading && results.length===0 && (
          <div style={{ textAlign:"center", color:"var(--muted)", fontSize:"12px", padding:"20px" }}>
            Fetching prices for all airlines...
          </div>
        )}
        {results.map((r,i) => {
          const pct = ((r.price-minPrice)/(maxPrice-minPrice||1))*70+30;
          const isBest = i===0;
          const color = AIRLINE_COLORS[r.airline] || "var(--blue)";
          return (
            <div key={r.airline} style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"10px", animation:`fadeUp 0.4s ease both`, animationDelay:`${i*0.07}s` }}>
              <div style={{ width:"20px", textAlign:"center", fontSize:"10px", fontWeight:700, color:isBest?"var(--gold)":"var(--muted)" }}>#{i+1}</div>
              <div style={{ width:"90px", fontSize:"11px", fontWeight:600, color:isBest?"var(--gold)":"var(--text)", display:"flex", alignItems:"center", gap:"5px" }}>
                {r.airline}
                {isBest && <span style={{ fontSize:"7px", background:"rgba(245,200,66,0.2)", color:"var(--gold)", border:"1px solid rgba(245,200,66,0.4)", borderRadius:"4px", padding:"1px 4px" }}>BEST</span>}
              </div>
              <div style={{ flex:1, height:"6px", background:"rgba(255,255,255,0.06)", borderRadius:"3px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:isBest?"linear-gradient(90deg,var(--gold),var(--gold2))":color, borderRadius:"3px", transition:"width 0.8s ease", boxShadow:isBest?"0 0 8px rgba(245,200,66,0.5)":"none" }}/>
              </div>
              <div style={{ fontSize:"13px", fontWeight:700, color:isBest?"var(--gold)":color, minWidth:"70px", textAlign:"right", fontFamily:"'Clash Display', sans-serif" }}>
                ₹{r.price.toLocaleString("en-IN")}
              </div>
            </div>
          );
        })}
        {done && results.length>0 && (
          <div style={{ marginTop:"10px", padding:"10px 14px", background:"rgba(67,233,123,0.06)", border:"1px solid rgba(67,233,123,0.2)", borderRadius:"12px", fontSize:"11px", color:"#43e97b" }}>
            💡 Book with <strong>{results[0].airline}</strong> to save ₹{(results[results.length-1].price-results[0].price).toLocaleString("en-IN")} vs most expensive
          </div>
        )}
        {done && results.length===0 && (
          <div style={{ textAlign:"center", color:"var(--muted)", fontSize:"12px", padding:"20px" }}>
            Could not fetch prices. Check if backend is running.
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const [form, setForm] = useState({ source:"", destination:"", journey_date:"", departure_time:"" });
  const [price, setPrice]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [fly, setFly]           = useState(0);
  const [rings, setRings]       = useState(false);
  const [showMetrics, setShowMetrics]   = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const [showCompare, setShowCompare]   = useState(false);
  const [compareKey, setCompareKey]     = useState(0);
  const [copied, setCopied]     = useState(false);

  const set  = k => e => setForm(f => ({ ...f, [k]:e.target.value }));
  const swap = () => setForm(f => {
    const srcDsts = DSTS.includes(f.source)      ? f.source      : "";
    const dstSrcs = SRCS.includes(f.destination) ? f.destination : "";
    return { ...f, source:dstSrcs, destination:srcDsts };
  });

  const routeKey  = form.source && form.destination ? `${form.source}-${form.destination}` : null;
  const routeInfo = routeKey ? (ROUTE_DATA[routeKey] || { duration:120, stops:1 }) : null;
  const insight   = price != null && routeKey ? getPriceInsight(price, routeKey) : null;

  const predict = async () => {
    setError(""); setPrice(null);
    const { source, destination, journey_date, departure_time } = form;
    if (!source || !destination || !journey_date || !departure_time)
      return setError("Please fill in all fields.");
    if (source === destination)
      return setError("Source and destination can't be the same.");
    if (!routeInfo)
      return setError("Route not available in our system.");
    setLoading(true);
    setFly(n => n+1);
    try {
      const res = await fetch("https://aeroprice-backend-uro9.onrender.com/predict", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          airline:"IndiGo", source, destination,
          stops:routeInfo.stops, duration:routeInfo.duration,
          journey_date, departure_time,
        }),
      });
      const data = await res.json();
      if (res.ok && data.predicted_price != null) {
        setPrice(data.predicted_price);
        setRings(true);
        setTimeout(() => setRings(false), 2000);
      } else setError("Prediction failed. Check backend response.");
    } catch { setError("Cannot reach backend — is your backend running?"); }
    setLoading(false);
  };

  /* ── Shareable link copy ── */
  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?from=${form.source}&to=${form.destination}&price=${Math.round(price)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{
      minHeight:"100vh", background:"var(--dark)", display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"'Cabinet Grotesk', sans-serif", padding:"24px 16px",
      position:"relative",
    }}>
      <Stars/>
      <Aurora/>
      <FlyingPlane go={fly}/>

      <div style={{
        position:"absolute", width:"520px", height:"520px", borderRadius:"50%",
        background:"radial-gradient(ellipse, rgba(245,200,66,0.06) 0%, transparent 70%)",
        pointerEvents:"none", zIndex:1,
      }}/>

      {/* ── Card ── */}
      <div style={{
        position:"relative", zIndex:10, width:"100%", maxWidth:"520px",
        background:"var(--card)",
        backdropFilter:"blur(30px) saturate(1.5)",
        WebkitBackdropFilter:"blur(30px) saturate(1.5)",
        border:"1px solid var(--border)", borderRadius:"28px",
        boxShadow:"0 30px 90px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)",
        overflow:"hidden", animation:"fadeUp 0.7s ease both",
      }}>
        {/* shimmer bar */}
        <div style={{
          height:"2px",
          background:"linear-gradient(90deg, transparent, var(--gold), var(--gold2), var(--blue), transparent)",
          backgroundSize:"200% auto", animation:"shimmer 2.5s linear infinite",
        }}/>

        {/* Header */}
        <div style={{
          padding:"26px 28px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", gap:"15px",
        }}>
          <div style={{
            width:"50px", height:"50px", borderRadius:"14px", flexShrink:0,
            background:"linear-gradient(135deg, var(--gold), var(--gold2))",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"24px", boxShadow:"0 8px 24px rgba(245,200,66,0.4)",
            animation:"pulse 2.5s ease-in-out infinite",
          }}>✈</div>
          <div style={{ flex:1 }}>
            <h1 style={{ fontFamily:"'Clash Display', sans-serif", fontSize:"21px", fontWeight:700, color:"var(--text)", letterSpacing:"-0.4px", lineHeight:1.15 }}>
              Aeroprice
            </h1>
            <p style={{ fontSize:"10px", color:"var(--muted)", marginTop:"3px", textTransform:"uppercase", letterSpacing:"1px" }}>
              ML-powered fare estimation
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px" }}>
            <div style={{
              display:"flex", alignItems:"center", gap:"6px",
              background:"rgba(79,195,247,0.1)", border:"1px solid rgba(79,195,247,0.25)",
              borderRadius:"20px", padding:"5px 11px",
            }}>
              <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#4fc3f7", boxShadow:"0 0 6px #4fc3f7", display:"block", animation:"pulse 1.6s ease-in-out infinite" }}/>
              <span style={{ fontSize:"10px", color:"#4fc3f7", fontWeight:600, letterSpacing:"0.8px", textTransform:"uppercase" }}>Live</span>
            </div>
            {/* Metrics toggle */}
            <button className="tab-btn" onClick={() => setShowMetrics(v => !v)} style={{
              background: showMetrics ? "rgba(79,195,247,0.15)" : "rgba(255,255,255,0.04)",
              border:`1px solid ${showMetrics ? "rgba(79,195,247,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius:"20px", padding:"4px 10px",
              color: showMetrics ? "#4fc3f7" : "var(--muted)",
              fontSize:"9px", fontWeight:700, cursor:"pointer",
              fontFamily:"'Cabinet Grotesk', sans-serif",
              letterSpacing:"1px", textTransform:"uppercase",
            }}>
              {showMetrics ? "▲ Hide" : "📊 Metrics"}
            </button>
          </div>
        </div>

        <div style={{ padding:"22px 28px 28px" }}>

          {/* Route selector */}
          <div style={{
            background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:"18px", padding:"18px 20px",
            display:"grid", gridTemplateColumns:"1fr 46px 1fr",
            alignItems:"center", gap:"10px", marginBottom:"14px",
            animation:"fadeUp 0.5s ease both", animationDelay:"0.1s",
          }}>
            <div>
              <span style={{ fontSize:"9px", textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--muted)", fontWeight:600, display:"block", marginBottom:"5px" }}>From</span>
              <select style={{ ...iBase, fontSize:"19px", fontWeight:700, fontFamily:"'Clash Display', sans-serif" }}
                value={form.source} onChange={set("source")}>
                <option value="">City</option>
                {SRCS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={swap}
              onMouseEnter={e => e.currentTarget.style.transform="rotate(180deg) scale(1.12)"}
              onMouseLeave={e => e.currentTarget.style.transform="rotate(0deg) scale(1)"}
              style={{
                width:"42px", height:"42px", borderRadius:"50%",
                background:"linear-gradient(135deg, var(--gold), var(--gold2))",
                border:"none", cursor:"pointer", fontSize:"16px",
                color:"#08091a", display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 16px rgba(245,200,66,0.4)", justifySelf:"center",
                transition:"transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }}>⇄</button>
            <div style={{ textAlign:"right" }}>
              <span style={{ fontSize:"9px", textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--muted)", fontWeight:600, display:"block", marginBottom:"5px" }}>To</span>
              <select style={{ ...iBase, fontSize:"19px", fontWeight:700, fontFamily:"'Clash Display', sans-serif", textAlign:"right" }}
                value={form.destination} onChange={set("destination")}>
                <option value="">City</option>
                {DSTS.filter(d => d !== form.source).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Route info badges */}
          {routeInfo && form.source && form.destination && (
            <div style={{ display:"flex", gap:"8px", marginBottom:"14px", animation:"fadeUp 0.4s ease both" }}>
              <div style={{ background:"rgba(79,195,247,0.08)", border:"1px solid rgba(79,195,247,0.2)", borderRadius:"10px", padding:"6px 12px", fontSize:"10px", color:"var(--blue)" }}>
                ⏱ ~{routeInfo.duration} min
              </div>
              <div style={{ background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:"10px", padding:"6px 12px", fontSize:"10px", color:"var(--purple)" }}>
                🛑 {routeInfo.stops===0 ? "Non-stop" : `${routeInfo.stops} stop`}
              </div>
            </div>
          )}

          {/* Date + Time */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"20px" }}>
            <Field label="Journey Date" delay="0.2s">
              <input style={{ ...iBase, color:"var(--text)" }} type="date"
                value={form.journey_date} onChange={set("journey_date")}/>
            </Field>
            <Field label="Departure Time" delay="0.25s">
              <input style={{ ...iBase, color:"var(--text)" }} type="time"
                value={form.departure_time} onChange={set("departure_time")}/>
            </Field>
          </div>

          {error && (
            <div style={{
              background:"rgba(255,80,80,0.1)", border:"1px solid rgba(255,80,80,0.3)",
              borderRadius:"12px", padding:"11px 15px", marginBottom:"16px",
              fontSize:"13px", color:"#ff8a8a", animation:"fadeUp 0.3s ease",
            }}>{error}</div>
          )}

          {/* Predict button */}
          <button
            onClick={!loading ? predict : undefined}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 14px 38px rgba(245,200,66,0.55)"; }}}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(245,200,66,0.35)"; }}
            style={{
              width:"100%", padding:"18px",
              background: loading ? "rgba(245,200,66,0.2)" : "linear-gradient(135deg, var(--gold) 0%, var(--gold2) 100%)",
              border:"none", borderRadius:"16px",
              fontFamily:"'Clash Display', sans-serif", fontSize:"17px", fontWeight:700,
              color: loading ? "rgba(10,15,30,0.45)" : "#08091a",
              cursor: loading ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
              boxShadow:"0 8px 28px rgba(245,200,66,0.35)", transition:"all 0.25s ease",
              position:"relative", overflow:"hidden",
              animation:"fadeUp 0.5s ease both", animationDelay:"0.3s",
            }}>
            {loading && (
              <div style={{
                position:"absolute", inset:0,
                background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                backgroundSize:"200% auto", animation:"shimmer 1s linear infinite",
              }}/>
            )}
            {loading
              ? <><span style={{ width:"18px", height:"18px", border:"2.5px solid rgba(8,9,26,0.3)", borderTopColor:"#08091a", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }}/> Calculating…</>
              : "Predict My Fare →"}
          </button>

          {/* Action buttons row */}
          {form.source && form.destination && (
            <div style={{ display:"flex", gap:"10px", marginTop:"12px" }}>
              <button className="tab-btn" onClick={() => setShowHistory(v => !v)} style={{
                flex:1, padding:"10px",
                background: showHistory ? "rgba(79,195,247,0.15)" : "rgba(255,255,255,0.04)",
                border:`1px solid ${showHistory ? "rgba(79,195,247,0.4)" : "rgba(255,255,255,0.1)"}`,
                borderRadius:"12px", color: showHistory ? "#4fc3f7" : "var(--muted)",
                fontSize:"11px", fontWeight:700, cursor:"pointer",
                fontFamily:"'Cabinet Grotesk', sans-serif", letterSpacing:"0.8px", textTransform:"uppercase",
              }}>📈 Price History</button>
              <button className="tab-btn" onClick={() => {
                setShowCompare(v => !v);
                if (!showCompare && form.journey_date && form.departure_time) setCompareKey(k => k+1);
              }} style={{
                flex:1, padding:"10px",
                background: showCompare ? "rgba(245,200,66,0.15)" : "rgba(255,255,255,0.04)",
                border:`1px solid ${showCompare ? "rgba(245,200,66,0.4)" : "rgba(255,255,255,0.1)"}`,
                borderRadius:"12px", color: showCompare ? "var(--gold)" : "var(--muted)",
                fontSize:"11px", fontWeight:700, cursor:"pointer",
                fontFamily:"'Cabinet Grotesk', sans-serif", letterSpacing:"0.8px", textTransform:"uppercase",
              }}>✈ Compare All</button>
            </div>
          )}

          {/* ── Result card ── */}
          {price != null && (
            <div style={{
              marginTop:"20px", borderRadius:"20px",
              border:"1px solid rgba(245,200,66,0.3)",
              overflow:"hidden", position:"relative",
              animation:"popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
            }}>
              {rings && [0,1,2].map(i => (
                <div key={i} style={{
                  position:"absolute", inset:0, borderRadius:"20px",
                  border:"2px solid rgba(245,200,66,0.65)",
                  animation:`ringOut 1s ease-out ${i*0.22}s both`,
                  pointerEvents:"none",
                }}/>
              ))}
              <div style={{
                background:"linear-gradient(135deg, rgba(245,200,66,0.13), rgba(255,159,67,0.07))",
                padding:"24px 22px 20px", textAlign:"center",
              }}>
                <p style={{ fontSize:"9px", textTransform:"uppercase", letterSpacing:"2px", color:"var(--gold)", fontWeight:600, marginBottom:"8px" }}>
                  Predicted Fare
                </p>
                <p style={{
                  fontFamily:"'Clash Display', sans-serif", fontSize:"52px", fontWeight:700,
                  background:"linear-gradient(135deg, var(--gold), var(--gold2))",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  letterSpacing:"-2px", lineHeight:1, animation:"countUp 0.5s ease both",
                }}>
                  ₹<Counter target={Math.round(price)}/>
                </p>
                <p style={{ fontSize:"11px", color:"var(--muted)", marginTop:"8px" }}>
                  Estimate only · Based on historical data
                </p>

                {/* ── Price Insight Badge ── */}
                {insight && (
                  <div style={{
                    margin:"12px auto 0", display:"inline-flex", alignItems:"center", gap:"8px",
                    background:insight.bg, border:`1px solid ${insight.border}`,
                    borderRadius:"12px", padding:"9px 16px",
                    animation:"badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both",
                  }}>
                    <span style={{ fontSize:"16px" }}>{insight.emoji}</span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:"12px", fontWeight:700, color:insight.color, letterSpacing:"0.3px" }}>
                        {insight.label}
                      </div>
                      <div style={{ fontSize:"9px", color:"var(--muted)", marginTop:"1px" }}>
                        {insight.desc}
                      </div>
                    </div>
                  </div>
                )}

                {/* Model accuracy note */}
                <div style={{
                  margin:"12px auto 0", background:"rgba(67,233,123,0.07)",
                  border:"1px solid rgba(67,233,123,0.2)", borderRadius:"10px", padding:"8px 14px",
                  display:"inline-block", fontSize:"10px", color:"#43e97b",
                }}>
                  🌲 Random Forest · R² <strong>0.8082</strong> · RMSE <strong>₹1,932</strong>
                </div>

                {/* Info chips */}
                <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap", marginTop:"14px" }}>
                  {[
                    { l:"Route",    v:`${form.source} → ${form.destination}` },
                    { l:"Duration", v:`~${routeInfo?.duration} min` },
                    { l:"Stops",    v:routeInfo?.stops===0 ? "Non-stop" : `${routeInfo?.stops} stop` },
                  ].map(chip => (
                    <div key={chip.l} style={{
                      background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:"20px", padding:"5px 12px", fontSize:"11px", color:"var(--muted)",
                    }}>
                      <span style={{ color:"var(--gold)", marginRight:"4px" }}>{chip.l}:</span>{chip.v}
                    </div>
                  ))}
                </div>

                {/* ── Shareable link button ── */}
                <button
                  onClick={copyLink}
                  style={{
                    marginTop:"14px", display:"inline-flex", alignItems:"center", gap:"7px",
                    background: copied ? "rgba(67,233,123,0.15)" : "rgba(255,255,255,0.06)",
                    border:`1px solid ${copied ? "rgba(67,233,123,0.4)" : "rgba(255,255,255,0.12)"}`,
                    borderRadius:"10px", padding:"8px 16px",
                    color: copied ? "#43e97b" : "var(--muted)",
                    fontSize:"11px", fontWeight:600, cursor:"pointer",
                    fontFamily:"'Cabinet Grotesk', sans-serif",
                    transition:"all 0.2s ease",
                    animation: copied ? "copyFlash 0.4s ease" : "none",
                  }}>
                  {copied ? "✅ Link Copied!" : "🔗 Copy Shareable Link"}
                </button>
              </div>
            </div>
          )}

          {/* Price History */}
          {showHistory && routeKey && PRICE_HISTORY[routeKey] && (
            <PriceHistoryChart route={routeKey}/>
          )}

          {/* Airline Comparison */}
          {showCompare && form.source && form.destination && form.journey_date && form.departure_time && (
            <AirlineComparisonPanel
              key={compareKey}
              source={form.source}
              destination={form.destination}
              journeyDate={form.journey_date}
              departureTime={form.departure_time}
            />
          )}

          {/* ML Metrics Panel */}
          {showMetrics && <ModelMetricsPanel visible={showMetrics}/>}

        </div>
      </div>

      <p style={{
        position:"relative", zIndex:10, marginTop:"16px",
        fontSize:"11px", color:"rgba(255,255,255,0.15)",
        letterSpacing:"0.4px", textAlign:"center",
      }}>Powered by Random Forest ML · aeroprice-backend-uro9.onrender.com</p>
    </div>
  );
}