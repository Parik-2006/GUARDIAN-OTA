"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFleet, deployFirmware } from "@/lib/api";
import { useWebSocket } from "@/lib/ws";

const P = {
  bg:      "#0D0B08",
  wall:    "#161210",
  cockpit: "#1D1912",
  dash:    "#252018",
  trim:    "#2E2820",
  ivory:      "#EEE6D3",
  champagne:  "#D8CCBA",
  parchment:  "#BFB29C",
  cashmere:   "rgba(238,230,211,0.52)",
  whisper:    "rgba(238,230,211,0.24)",
  bDim:  "rgba(238,230,211,0.055)",
  bMid:  "rgba(238,230,211,0.10)",
  bHi:   "rgba(200,145,74,0.30)",
  cognac:    "#C8914A",
  cgnDim:    "rgba(200,145,74,0.13)",
  cgnGlow:   "rgba(200,145,74,0.25)",
  platinum:  "#A8A29A",
  copper:    "#B87C3A",
  copDim:    "rgba(184,124,58,0.13)",
  sage:      "#7A9E72",
  sageDim:   "rgba(122,158,114,0.13)",
  burg:      "#9E5A5A",
  burgDim:   "rgba(158,90,90,0.13)",
} as const;

type View = "dashboard" | "terminal" | "updates" | "verification";

interface DeviceState {
  deviceId: string; primary: boolean; otaVersion: string;
  safetyState: string; ecuStates: Record<string, string>;
  lastSeen: string; threatLevel: "LOW"|"MEDIUM"|"HIGH";
  otaProgress: number; signatureOk: boolean; integrityOk: boolean;
  tlsHealthy: boolean; rollbackArmed: boolean;
}
interface NodeVerification {
  id: string; ip: string;
  status: "verifying"|"complete"|"decrypting"|"error"|"downloading";
  progress: number; label: string;
}

function nowStr() { return new Date().toLocaleTimeString("en-US",{hour12:false}); }

function I({ n, f=false, sz=20, col }: { n:string; f?:boolean; sz?:number; col?:string }) {
  return (
    <span style={{
      fontFamily:"'Material Symbols Outlined'",fontWeight:400,fontStyle:"normal",
      fontSize:sz,lineHeight:1,letterSpacing:"normal",textTransform:"none",
      display:"inline-block",whiteSpace:"nowrap",direction:"ltr",
      WebkitFontSmoothing:"antialiased",
      fontVariationSettings:f?"'FILL' 1":"'FILL' 0",
      color:col??P.parchment,verticalAlign:"middle",
    }}>{n}</span>
  );
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return (
    <div
      style={{ background:P.wall, borderRadius:4, border:`1px solid ${P.bDim}`, transition:"border-color 0.22s, background 0.22s", ...style }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=P.bMid;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=P.bDim;}}
    >{children}</div>
  );
}

function SideNav({ view, setView, onBack }: { view:View; setView:(v:View)=>void; onBack?:()=>void }) {
  const tabs: {id:View;icon:string;label:string}[] = [
    {id:"dashboard",    icon:"dashboard",        label:"Dashboard"},
    {id:"terminal",     icon:"terminal",          label:"Terminal"},
    {id:"updates",      icon:"system_update_alt", label:"Updates"},
    {id:"verification", icon:"verified_user",     label:"Verification"},
  ];
  return (
    <aside style={{ width:248, flexShrink:0, background:P.wall, borderRight:`1px solid ${P.bDim}`, display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      <div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${P.bDim}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:15 }}>
          <div style={{ width:36,height:36, background:P.cockpit, borderRadius:4, border:`1px solid ${P.bHi}`, display:"flex",alignItems:"center",justifyContent:"center" }}>
            <I n="shield" f sz={19} col={P.cognac} />
          </div>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"0.95rem", color:P.ivory, letterSpacing:"0.08em" }}>NODE_01</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"0.54rem", color:P.cognac, letterSpacing:"0.22em", marginTop:2 }}>CONNECTED · SECURE</div>
          </div>
        </div>
        <button
          style={{ width:"100%", padding:"9px 0", background:P.cgnDim, color:P.cognac, fontWeight:600, fontSize:"0.72rem", borderRadius:3, border:`1px solid ${P.bHi}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, letterSpacing:"0.06em", fontFamily:"'JetBrains Mono',monospace", transition:"all 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.background=P.cgnGlow;e.currentTarget.style.color=P.ivory;}}
          onMouseLeave={e=>{e.currentTarget.style.background=P.cgnDim;e.currentTarget.style.color=P.cognac;}}
        >
          <I n="add" sz={14} col="inherit"/> New Fleet Group
        </button>
      </div>
      <div style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:1 }}>
        {tabs.map(t=>{
          const active = view===t.id;
          return (
            <div key={t.id} onClick={()=>setView(t.id)}
              style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:3,cursor:"pointer",transition:"all 0.18s",color:active?P.ivory:P.cashmere,background:active?P.cockpit:"transparent",borderLeft:`2px solid ${active?P.cognac:"transparent"}`,fontWeight:500,fontSize:"0.84rem" }}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background=P.cockpit;e.currentTarget.style.color=P.champagne;e.currentTarget.style.borderLeftColor=P.bHi;}}}
              onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=P.cashmere;e.currentTarget.style.borderLeftColor="transparent";}}}
            >
              <I n={t.icon} f={active} sz={16} col={active?P.cognac:undefined}/><span>{t.label}</span>
            </div>
          );
        })}
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:3,cursor:"not-allowed",color:P.whisper,fontSize:"0.84rem",opacity:0.4 }}>
          <I n="analytics" sz={16}/><span>Device Logs</span>
        </div>
      </div>
      <div style={{ padding:"8px 8px", borderTop:`1px solid ${P.bDim}`, display:"flex", flexDirection:"column", gap:1 }}>
        {[{icon:"monitor_heart",label:"System Health"},{icon:"menu_book",label:"Documentation"}].map(t=>(
          <div key={t.label}
            style={{ display:"flex",alignItems:"center",gap:9,padding:"7px 12px",borderRadius:3,cursor:"pointer",color:P.whisper,fontSize:"0.74rem",transition:"all 0.18s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=P.cockpit;e.currentTarget.style.color=P.parchment;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=P.whisper;}}
          >
            <I n={t.icon} sz={14}/><span>{t.label}</span>
          </div>
        ))}
        {onBack && (
          <div onClick={onBack}
            style={{ display:"flex",alignItems:"center",gap:9,padding:"7px 12px",borderRadius:3,cursor:"pointer",color:P.whisper,fontSize:"0.74rem",marginTop:4,borderTop:`1px solid ${P.bDim}`,transition:"all 0.18s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=P.cockpit;e.currentTarget.style.color=P.parchment;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=P.whisper;}}
          >
            <I n="arrow_back" sz={14}/><span>Landing Page</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function TopBar({ connected }: { connected:boolean }) {
  const [clock, setClock] = useState("");
  useEffect(()=>{
    setClock(nowStr());
    const id=setInterval(()=>setClock(nowStr()),1000);
    return ()=>clearInterval(id);
  },[]);
  return (
    <header style={{ height:52, background:P.bg, borderBottom:`1px solid ${P.bDim}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0, zIndex:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:26 }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"1rem", letterSpacing:"0.16em", color:P.ivory }}>SENTINEL COMMAND</span>
        <nav style={{ display:"flex", height:52 }}>
          {["Fleet Metrics","Firmware Repo","Crypto Audit"].map((l,i)=>(
            <a key={l} href="#" style={{ height:"100%",display:"flex",alignItems:"center",padding:"0 13px",fontSize:"0.65rem",fontWeight:500,letterSpacing:"0.09em",textTransform:"uppercase",textDecoration:"none",color:i===0?P.cognac:P.whisper,borderBottom:`2px solid ${i===0?P.cognac:"transparent"}`,transition:"all 0.2s",fontFamily:"'JetBrains Mono',monospace" }}
              onMouseEnter={e=>{if(i!==0)(e.currentTarget as HTMLAnchorElement).style.color=P.parchment;}}
              onMouseLeave={e=>{if(i!==0)(e.currentTarget as HTMLAnchorElement).style.color=P.whisper;}}
            >{l}</a>
          ))}
        </nav>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ display:"flex",alignItems:"center",gap:5,padding:"3px 9px",background:P.cockpit,borderRadius:2,border:`1px solid ${P.bDim}` }}>
          <div style={{ width:5,height:5,borderRadius:"50%",background:connected?P.sage:P.copper }}/>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.54rem",color:connected?P.sage:P.copper }}>{connected?"LIVE":"DEMO"}</span>
        </div>
        {clock&&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:P.whisper }}>{clock}</span>}
        <button style={{ padding:"4px 11px",border:`1px solid ${P.bMid}`,background:"transparent",color:P.parchment,fontSize:"0.64rem",fontWeight:600,borderRadius:2,cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",transition:"all 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=P.bHi;e.currentTarget.style.color=P.ivory;e.currentTarget.style.background=P.cockpit;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=P.bMid;e.currentTarget.style.color=P.parchment;e.currentTarget.style.background="transparent";}}
        >Emergency Stop</button>
        <button style={{ padding:"4px 14px",background:P.cgnDim,color:P.cognac,fontSize:"0.64rem",fontWeight:700,borderRadius:2,cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase",border:`1px solid ${P.bHi}`,fontFamily:"'JetBrains Mono',monospace",transition:"all 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.background=P.cgnGlow;e.currentTarget.style.color=P.ivory;}}
          onMouseLeave={e=>{e.currentTarget.style.background=P.cgnDim;e.currentTarget.style.color=P.cognac;}}
        >Deploy Update</button>
        {["rss_feed","settings_input_component","notifications"].map(ic=>(
          <button key={ic} style={{ background:"transparent",border:"none",cursor:"pointer",padding:"4px",borderRadius:2,transition:"all 0.18s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=P.cockpit;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
          ><I n={ic} sz={17}/></button>
        ))}
        <div style={{ width:26,height:26,borderRadius:3,background:P.cockpit,border:`1px solid ${P.bMid}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.18s" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=P.bHi;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=P.bMid;}}
        >
          <I n="person" sz={14} col={P.parchment}/>
        </div>
      </div>
    </header>
  );
}

function DeviceModal({ d, onClose }: { d: DeviceState; onClose: () => void }) {
  const [deploying, setDeploying] = useState(false);
  const handleOTA = async () => {
    setDeploying(true);
    await deployFirmware({
      campaign_id: "evt-man-" + Math.random().toString(36).substring(7),
      firmware_url: "https://your-bucket.s3.amazonaws.com/guardian-ota.bin",
      signature: "manual-override-sig",
      target_devices: [d.deviceId]
    }).catch(console.error);
    setTimeout(() => {setDeploying(false); onClose();}, 1500);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: P.bg, border: `1px solid ${P.bHi}`, padding: 30, width: 680, borderRadius: 6, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 25, borderBottom: `1px solid ${P.bDim}`, paddingBottom: 15 }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", color: P.ivory, fontSize: "1.8rem", marginBottom: 4 }}>Car Settings: <span style={{color:P.cognac, fontFamily:"'JetBrains Mono'"}}>{d.deviceId}</span></h2>
            <div style={{fontFamily:"'JetBrains Mono'", fontSize: "0.6rem", color: P.sage, letterSpacing: "0.1em"}}>{d.threatLevel==="HIGH"?"WARNING: CRITICAL THREAT DETECTED":"SECURE UPLINK ESTABLISHED"}</div>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:P.whisper, cursor:"pointer" }}><I n="close" sz={28}/></button>
        </div>
        <div style={{ display: "flex", gap: 30 }}>
          <div style={{ flex: 1, background: P.dash, padding: 15, borderRadius: 4, border: `1px solid ${P.bDim}` }}>
            <h4 style={{ color: P.champagne, marginBottom: 15, fontFamily: "'JetBrains Mono'", fontSize: "0.75rem", borderBottom: `1px solid ${P.bDim}`, paddingBottom: 8 }}><I n="memory" sz={16} col={P.cognac}/> ECU TELEMETRY</h4>
            {Object.entries(d.ecuStates || {"brake":"green","powertrain":"green","sensor":"green","infotainment":"green"}).map(([ecu, state]) => (
              <div key={ecu} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${P.bDim}`, alignItems: "center" }}>
                <span style={{ color: P.whisper, textTransform: "uppercase", fontSize: "0.75rem", fontFamily: "'JetBrains Mono'" }}>{ecu}</span>
                <span style={{ background: state === "green" ? "rgba(122,158,114,0.15)" : "rgba(158,90,90,0.15)", borderRadius: 3, padding: "3px 8px", fontSize: "0.65rem", color: state === "green" ? P.sage : P.burg, border: `1px solid ${state === "green" ? P.sage : P.burg}`, fontFamily: "'JetBrains Mono'" }}>{String(state).toUpperCase()}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ background: P.cockpit, padding: 15, borderRadius: 4, border: `1px solid ${P.bDim}` }}>
              <h4 style={{ color: P.champagne, marginBottom: 15, fontFamily: "'JetBrains Mono'", fontSize: "0.75rem", borderBottom: `1px solid ${P.bDim}`, paddingBottom: 8 }}><I n="security" sz={16} col={P.copper}/> OTA DIAGNOSTICS</h4>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: "0.75rem" }}>
                <span style={{ color: P.whisper, fontFamily: "'JetBrains Mono'" }}>Active FW:</span> <span style={{ color: P.ivory, fontFamily: "'JetBrains Mono'" }}>{d.otaVersion || "1.0.0"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: "0.75rem" }}>
                <span style={{ color: P.whisper, fontFamily: "'JetBrains Mono'" }}>Last Seen:</span> <span style={{ color: P.ivory, fontFamily: "'JetBrains Mono'" }}>{new Date(d.lastSeen).toLocaleTimeString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: P.whisper, fontFamily: "'JetBrains Mono'" }}>PKI Health:</span> <span style={{ color: P.sage, fontFamily: "'JetBrains Mono'" }}>VALIDATED</span>
              </div>
            </div>
            <button onClick={handleOTA} disabled={deploying} style={{ flex: 1, width: "100%", padding: 15, background: deploying ? P.bg : P.cgnDim, color: P.cognac, border: `1px solid ${P.bHi}`, cursor: "pointer", fontFamily: "'JetBrains Mono'", fontSize: "0.75rem", fontWeight: "bold", borderRadius: 4, transition: "all 0.2s" }} onMouseEnter={e=>{if(!deploying) e.currentTarget.style.color=P.ivory}} onMouseLeave={e=>{if(!deploying) e.currentTarget.style.color=P.cognac}}>
              {deploying ? "TRANSMITTING SIGNED PAYLOAD..." : "FORCE MANUAL OTA DEPLOYMENT"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AvailableDevicesTable({ fleet, onSelect }: { fleet: DeviceState[]; onSelect: (d:DeviceState)=>void }) {
  // Sort robustly handling undefined
  const sorted = [...fleet].sort((a,b) => new Date(b.lastSeen||0).getTime() - new Date(a.lastSeen||0).getTime());
  return (
    <Card style={{ padding: 20, marginTop: 15, overflowY: "auto", maxHeight: 400 }}>
       <div style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 15 }}>
          <I n="directions_car" sz={24} col={P.cognac}/>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", color: P.ivory, fontSize: "1.4rem" }}>Connected Fleet Ledger</h3>
       </div>
       <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
         <thead>
           <tr style={{ borderBottom: `1px solid ${P.bDim}`, color: P.whisper, fontSize: "0.7rem", fontFamily: "'JetBrains Mono'" }}>
             <th style={{ padding: "12px 10px", fontWeight: "normal" }}>MAC ID / ADDRESS</th>
             <th style={{ padding: "12px 10px", fontWeight: "normal" }}>THREAT LEVEL</th>
             <th style={{ padding: "12px 10px", fontWeight: "normal" }}>OTA VERSION</th>
             <th style={{ padding: "12px 10px", fontWeight: "normal" }}>SAFETY STATE</th>
             <th style={{ padding: "12px 10px", fontWeight: "normal", textAlign: "right" }}>ACTION</th>
           </tr>
         </thead>
         <tbody>
           {sorted.map((d, i) => (
             <tr key={i} style={{ borderBottom: `1px solid rgba(238,230,211,0.02)`, color: P.ivory, fontSize: "0.85rem", cursor: "pointer", transition: "background 0.15s" }} onClick={() => onSelect(d)} onMouseEnter={e=>e.currentTarget.style.background=P.dash} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
               <td style={{ padding: "12px 10px", fontFamily: "'JetBrains Mono'", color: P.champagne }}>{d.deviceId}</td>
               <td style={{ padding: "12px 10px", color: d.threatLevel === "HIGH" ? P.burg : P.sage, fontFamily: "'JetBrains Mono'", fontSize: "0.75rem" }}>{d.threatLevel || "LOW"}</td>
               <td style={{ padding: "12px 10px", fontFamily: "'JetBrains Mono'", color: P.platinum }}>{d.otaVersion || "1.0.0"}</td>
               <td style={{ padding: "12px 10px", color: P.platinum }}>{d.safetyState || "SAFE"}</td>
               <td style={{ padding: "12px 10px", textAlign: "right" }}><I n="arrow_forward" col={P.cognac}/></td>
             </tr>
           ))}
           {sorted.length === 0 && (
             <tr><td colSpan={5} style={{ padding: 30, textAlign: "center", color: P.whisper, fontStyle: "italic" }}>Awaiting active nodes... (Did you turn on your ESP32?)</td></tr>
           )}
         </tbody>
       </table>
    </Card>
  );
}

function DashboardView({ fleet }: { fleet:DeviceState[] }) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceState | null>(null);
  const high = fleet.filter(d=>d.threatLevel==="HIGH").length;
  const safe = fleet.filter(d=>d.safetyState==="SAFE").length;
  const feed = [
    {type:"FW_PUSH_SUCCESS",col:P.cognac, msg:"Payload v2.4.1 delivered to NODE_77.",      sub:"HASH: a8f4...9c2e",time:"JUST NOW"},
    {type:"CRYPTO_VERIFIED", col:P.sage,   msg:"Bootloader signature valid on Cluster Beta.",sub:"ID: CLSTR-B-09",  time:"2M AGO"},
    {type:"SYS_PING",        col:P.platinum,msg:"Routine health check completed globally.",  sub:"LATENCY: 42ms avg",time:"15M AGO"},
    {type:"FW_PUSH_SUCCESS", col:P.cognac, msg:"Payload v2.4.0 delivered to NODE_12.",      sub:"HASH: f3b1...8d4a",time:"1H AGO"},
    {type:"ROLLBACK_EVENT",  col:P.burg,   msg:"NODE_44 auto-rolled back to v1.8.5.",        sub:"HEALTH_CHECK_FAIL",time:"3H AGO"},
  ];
  const kpis = [
    {label:"Update Success Rate",val:"98.2%",  sub:"+1.4% Δ",      icon:"check_circle", subCol:P.sage,    col:P.cognac,  hi:false},
    {label:"Total Devices",      val:String(fleet.length||412),sub:`ONLINE: ${safe||409}  |  OFFLINE: ${Math.max(0,(fleet.length||412)-safe)||3}`,icon:"router",subCol:P.whisper,col:P.champagne,hi:false},
    {label:"Active Deployments", val:"3",       sub:"V2.4.1 STAGED", icon:"rocket_launch",subCol:P.whisper, col:P.champagne,hi:false},
    {label:"Fleet Health",       val:high>2?"DEGRADED":"Secure",sub:"No critical vulnerabilities.",icon:"shield",subCol:P.whisper,col:P.sage,hi:true},
  ];
  const geoPoints = [
    {x:31,y:37,label:"US-EAST",    count:142,delay:0},
    {x:17,y:46,label:"US-WEST",    count:98, delay:0.8},
    {x:51,y:29,label:"EU-CENTRAL", count:88, delay:1.4},
    {x:66,y:51,label:"APAC",       count:84, delay:0.4},
  ];
  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
      <div style={{ marginBottom:22 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"2.4rem",fontWeight:400,letterSpacing:"-0.01em",color:P.ivory,lineHeight:1 }}>Fleet Overview</h2>
        <p style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.65rem",color:P.whisper,marginTop:7,display:"flex",alignItems:"center",gap:7 }}>
          <span style={{ width:5,height:5,borderRadius:"50%",background:P.sage,display:"inline-block" }}/>
          SYSTEM.STATE = NOMINAL_OPERATION
        </p>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:12 }}>
        {kpis.map((k,i)=>(
          <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
            style={{ background:P.wall,borderRadius:4,border:k.hi?`1px solid ${P.bHi}`:`1px solid ${P.bDim}`,borderLeft:k.hi?`3px solid ${P.cognac}`:undefined,padding:"16px 17px",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:124,cursor:"default",transition:"all 0.22s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=P.cockpit;e.currentTarget.style.borderColor=P.bMid;}}
            onMouseLeave={e=>{e.currentTarget.style.background=P.wall;e.currentTarget.style.borderColor=k.hi?P.bHi:P.bDim;}}
          >
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"start" }}>
              <span style={{ fontSize:"0.58rem",color:P.whisper,textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:600,fontFamily:"'JetBrains Mono',monospace" }}>{k.label}</span>
              <I n={k.icon} f={k.hi} sz={17} col={k.hi?P.cognac:P.platinum}/>
            </div>
            <div>
              <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:k.hi?"1.6rem":"2.3rem",fontWeight:k.hi?700:400,color:k.col,letterSpacing:k.hi?"0.06em":"-0.01em",textTransform:k.hi?"uppercase":undefined }}>{k.val}</span>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.61rem",color:k.subCol,marginTop:4,display:"flex",alignItems:"center",gap:4 }}>
                {i===0&&<I n="trending_up" sz={11} col={P.sage}/>}{k.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 300px",gap:9,marginBottom:12 }}>
        <Card style={{ display:"flex",flexDirection:"column",overflow:"hidden",height:385 }}>
          <div style={{ height:35,borderBottom:`1px solid ${P.bDim}`,display:"flex",alignItems:"center",padding:"0 14px",justifyContent:"space-between",flexShrink:0 }}>
            <div style={{ display:"flex",gap:20 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.57rem",color:P.cognac,borderBottom:`1px solid ${P.cognac}`,paddingBottom:2 }}>GEO_DISTRIBUTION.MAP</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.57rem",color:P.whisper,cursor:"pointer",transition:"color 0.18s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color=P.parchment;}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color=P.whisper;}}
              >NETWORK_TOPOLOGY</span>
            </div>
            <div style={{ display:"flex",gap:4 }}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:P.dash}}/>)}</div>
          </div>
          <div style={{ flex:1,background:"#0A0806",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 60% at 50% 50%, rgba(200,145,74,0.022) 0%, transparent 70%)" }}/>
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top, #0A0806 0%, transparent 35%)" }}/>
            <svg viewBox="0 0 800 380" style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.07 }}>
              <ellipse cx="400" cy="190" rx="360" ry="160" fill="none" stroke={P.parchment} strokeWidth="0.6"/>
              <path d="M60,190 Q200,80 340,160 Q440,60 560,140 Q660,80 750,170" fill="none" stroke={P.parchment} strokeWidth="0.5"/>
              <path d="M40,260 Q200,210 360,245 Q500,210 640,255 Q720,240 780,260" fill="none" stroke={P.parchment} strokeWidth="0.3"/>
              <line x1="400" y1="30" x2="400" y2="360" stroke={P.parchment} strokeWidth="0.25" strokeDasharray="5 5"/>
              <line x1="40" y1="190" x2="760" y2="190" stroke={P.parchment} strokeWidth="0.25" strokeDasharray="5 5"/>
            </svg>
            <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}>
              {[[31,37,51,29],[31,37,17,46],[51,29,66,51]].map(([x1,y1,x2,y2],i)=>(
                <line key={i} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="rgba(200,145,74,0.12)" strokeWidth="0.8" strokeDasharray="4 5"/>
              ))}
            </svg>
            {geoPoints.map(g=>(
              <div key={g.label} style={{ position:"absolute",left:`${g.x}%`,top:`${g.y}%`,transform:"translate(-50%,-50%)" }}>
                <div style={{ width:7,height:7,borderRadius:"50%",background:P.cognac,animation:"gpulse 2.5s ease-in-out infinite",animationDelay:`${g.delay}s` }}/>
                <div style={{ position:"absolute",bottom:13,left:"50%",transform:"translateX(-50%)",background:"rgba(22,18,16,0.92)",border:`1px solid ${P.bMid}`,borderRadius:3,padding:"6px 10px",width:128,whiteSpace:"nowrap" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",color:P.whisper,marginBottom:3 }}>{g.label}</div>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"end" }}>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:600,color:P.ivory,lineHeight:1 }}>{g.count}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",color:P.sage }}>● ONLINE</span>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ position:"absolute",bottom:11,right:14,fontFamily:"'JetBrains Mono',monospace",fontSize:"0.53rem",color:P.whisper,textAlign:"right",lineHeight:1.7 }}>
              LAT: 37.7749 N<br/>LNG: 122.4194 W<br/>
              <span style={{ color:P.cognac,animation:"scanBlink 1.2s step-end infinite" }}>SCANNING...</span>
            </div>
          </div>
        </Card>
        <Card style={{ display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ padding:"11px 15px",borderBottom:`1px solid ${P.bDim}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:"0.95rem",letterSpacing:"0.05em",color:P.ivory }}>Recent Activity</h3>
            <button style={{ fontSize:"0.56rem",fontFamily:"'JetBrains Mono',monospace",color:P.cognac,background:"transparent",border:"none",cursor:"pointer",transition:"color 0.18s" }}
              onMouseEnter={e=>{e.currentTarget.style.color=P.champagne;}}
              onMouseLeave={e=>{e.currentTarget.style.color=P.cognac;}}
            >VIEW_ALL</button>
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:"8px 9px",display:"flex",flexDirection:"column",gap:5 }}>
            {feed.map((a,i)=>(
              <motion.div key={i} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:i*0.07}}
                style={{ padding:"9px 11px",background:P.cockpit,borderRadius:3,borderLeft:`2px solid ${a.col}`,cursor:"pointer",transition:"all 0.18s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=P.dash;}}
                onMouseLeave={e=>{e.currentTarget.style.background=P.cockpit;}}
              >
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",background:`${a.col}15`,color:a.col,padding:"1px 6px",borderRadius:2,border:`1px solid ${a.col}25` }}>{a.type}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.53rem",color:P.whisper }}>{a.time}</span>
                </div>
                <p style={{ fontSize:"0.75rem",color:P.champagne,marginBottom:2 }}>{a.msg}</p>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.52rem",color:P.whisper }}>{a.sub}</div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9 }}>
        {[
          {label:"Avg OTA Duration",   val:"4.2s",        sub:"Down 0.8s from last epoch",icon:"timer",   col:P.cognac},
          {label:"Signature Failures", val:String(high||0),sub:"Last 24 hours",            icon:"gpp_bad", col:high>0?P.burg:P.sage},
          {label:"Rollback Events",    val:"1",            sub:"NODE_44 · 3h ago",          icon:"undo",    col:P.copper},
        ].map((s)=>(
          <div key={s.label}
            style={{ background:P.wall,borderRadius:4,border:`1px solid ${P.bDim}`,padding:"13px 15px",display:"flex",alignItems:"center",gap:13,cursor:"default",transition:"all 0.22s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=P.cockpit;e.currentTarget.style.borderColor=P.bMid;}}
            onMouseLeave={e=>{e.currentTarget.style.background=P.wall;e.currentTarget.style.borderColor=P.bDim;}}
          >
            <div style={{ width:33,height:33,borderRadius:4,background:`${s.col}14`,border:`1px solid ${s.col}28`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.22s" }}>
              <I n={s.icon} sz={16} col={s.col}/>
            </div>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:600,color:s.col }}>{s.val}</div>
              <div style={{ fontSize:"0.7rem",color:P.champagne }}>{s.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.53rem",color:P.whisper }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <AvailableDevicesTable fleet={fleet} onSelect={setSelectedDevice} />
      <AnimatePresence>
        {selectedDevice && <DeviceModal d={selectedDevice} onClose={() => setSelectedDevice(null)} />}
      </AnimatePresence>
      <style>{`
        @keyframes gpulse{0%,100%{transform:scale(1);opacity:0.9;}50%{transform:scale(2.0);opacity:0.18;}}
        @keyframes scanBlink{0%,100%{opacity:1;}50%{opacity:0.1;}}
      `}</style>
    </div>
  );
}

function TerminalView() {
  type Line={type:"cmd"|"out"|"ok"|"err"|"info";text:string};
  const [lines,setLines]=useState<Line[]>([
    {type:"info",text:"GUARDIAN-OTA Command Interface v4.1.0 — Initialized"},
    {type:"info",text:"Cryptographic modules loaded... OK"},
    {type:"info",text:"Establishing secure channel to Fleet Registry... OK"},
    {type:"ok",text:"Authentication token verified. Access granted."},
    {type:"cmd",text:"guard-ota --sign firmware.bin"},
    {type:"info",text:"[INFO] Reading target binary 'firmware.bin' (4.2 MB)"},
    {type:"info",text:"[INFO] Computing SHA-256 hash..."},
    {type:"ok",text:"Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
    {type:"info",text:"[INFO] Applying ECDSA-P384 signature using key alias 'fleet-prod-01'"},
    {type:"ok",text:"[SUCCESS] Payload signed. Created 'firmware.signed.bin'"},
    {type:"cmd",text:"guard-ota --deploy --target NODE_01 --payload firmware.signed.bin"},
    {type:"info",text:"[INFO] Initiating deployment for target: NODE_01"},
    {type:"info",text:"[INFO] Handshake initiated (TLS 1.3)..."},
    {type:"ok",text:"[OK] Mutual authentication verified."},
    {type:"info",text:"[INFO] Transferring payload chunks [======>     ] 60%"},
    {type:"info",text:"[INFO] Transferring payload chunks [==========] 100%"},
    {type:"info",text:"[INFO] Verifying checksum on remote device..."},
    {type:"ok",text:"[SUCCESS] Deployment committed. NODE_01 rebooting."},
  ]);
  const [input,setInput]=useState("");
  const [tv,setTv]=useState(true);
  const [ad,setAd]=useState(false);
  const endRef=useRef<HTMLDivElement>(null);
  const history=[
    {cmd:"guard-ota --deploy --target...",time:"Just now"},
    {cmd:"guard-ota --sign firmware.bin",time:"2m ago"},
    {cmd:"ping fleet-registry.internal",time:"15m ago"},
    {cmd:"sysctl restart netd",time:"1h ago",err:true},
    {cmd:"tail -f /var/log/auth.log",time:"2h ago"},
    {cmd:"cat /etc/guardian/config.yaml",time:"Yesterday"},
  ];
  const lCol=(t:string)=>({ok:P.sage,err:P.burg,info:P.platinum}[t]||P.champagne);
  const submit=(e:React.KeyboardEvent<HTMLInputElement>)=>{
    if(e.key!=="Enter"||!input.trim()) return;
    setLines(p=>[...p,{type:"cmd",text:input},{type:"ok",text:`[OK] Command processed: ${input}`}]);
    setInput("");
    setTimeout(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),50);
  };
  useEffect(()=>{endRef.current?.scrollIntoView();},[lines]);
  return (
    <div style={{ display:"grid",gridTemplateColumns:"1fr 300px",gap:9,padding:15,flex:1,overflow:"hidden" }}>
      <div style={{ background:"#090705",borderRadius:4,border:`1px solid ${P.bDim}`,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ height:34,background:P.cockpit,borderBottom:`1px solid ${P.bDim}`,display:"flex",alignItems:"center",padding:"0 12px",justifyContent:"space-between",flexShrink:0,position:"relative" }}>
          <div style={{ position:"absolute",left:0,top:0,bottom:0,width:2,background:P.cognac }}/>
          <div style={{ display:"flex",alignItems:"center",gap:7,paddingLeft:7 }}>
            <I n="terminal" sz={13} col={P.cognac}/>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.63rem",fontWeight:600,letterSpacing:"0.12em",color:P.ivory }}>GUARDIAN-OTA TERMINAL v4.1</span>
          </div>
          <div style={{ display:"flex",gap:4 }}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:P.dash,border:`1px solid ${P.bDim}`}}/>)}</div>
        </div>
        <div style={{ flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:11,lineHeight:1.75,overflowY:"auto",padding:"13px 14px",display:"flex",flexDirection:"column" }}>
          {lines.map((l,i)=>(
            <div key={i} style={{marginBottom:2}}>
              {l.type==="cmd"
                ?<div style={{display:"flex",gap:8}}>
                  <span style={{color:P.cognac,fontWeight:500,flexShrink:0}}>root@sentinel:/opt/ota$</span>
                  <span style={{color:P.ivory}}>{l.text}</span>
                </div>
                :<div style={{paddingLeft:l.type==="info"?14:0,color:lCol(l.type),borderLeft:l.type==="info"?`1px solid ${P.bDim}`:"none"}}>{l.text}</div>}
            </div>
          ))}
          <div style={{ margin:"13px 0",background:P.cockpit,padding:12,borderRadius:3,borderLeft:`2px solid ${P.cognac}`,display:"flex",gap:10,alignItems:"start",maxWidth:480 }}>
            <I n="info" sz={16} col={P.cognac}/>
            <div>
              <h4 style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:P.cognac,fontSize:"0.85rem",letterSpacing:"0.06em",marginBottom:3 }}>System Notice</h4>
              <p style={{ fontSize:"0.7rem",color:P.cashmere,lineHeight:1.6 }}>Network protocol upgrade scheduled for 03:00 UTC. Expect brief disruption in remote terminal connectivity.</p>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:7,marginTop:8 }}>
            <span style={{color:P.cognac,fontWeight:500,flexShrink:0}}>root@sentinel:/opt/ota$</span>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={submit}
              style={{ flex:1,background:"transparent",border:"none",outline:"none",color:P.ivory,fontFamily:"'JetBrains Mono',monospace",fontSize:11,caretColor:P.cognac }} autoFocus/>
            <span style={{ display:"inline-block",width:7,height:"1em",background:P.cognac,animation:"tblink 1s step-end infinite",verticalAlign:"middle" }}/>
          </div>
          <div ref={endRef}/>
        </div>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:9,overflow:"hidden" }}>
        <Card style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ padding:"11px 15px",borderBottom:`1px solid ${P.bDim}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"0.9rem",fontWeight:600,display:"flex",alignItems:"center",gap:5,color:P.ivory }}>
              <I n="history" sz={15} col={P.cognac}/> Command History
            </h3>
            <button style={{ fontSize:"0.56rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:P.whisper,background:"transparent",border:"none",cursor:"pointer",transition:"color 0.18s" }}
              onMouseEnter={e=>{e.currentTarget.style.color=P.burg;}}
              onMouseLeave={e=>{e.currentTarget.style.color=P.whisper;}}
            >Clear</button>
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:6 }}>
            {history.map((h,i)=>(
              <div key={i}
                style={{ padding:"8px 10px",borderRadius:2,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.16s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=P.cockpit;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
              >
                <code style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.64rem",color:h.err?P.burg:P.champagne }}>{h.cmd}</code>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.53rem",color:P.whisper,flexShrink:0,marginLeft:8 }}>{h.time}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ flexShrink:0 }}>
          <div style={{ padding:"11px 15px",borderBottom:`1px solid ${P.bDim}` }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"0.9rem",fontWeight:600,display:"flex",alignItems:"center",gap:5,color:P.ivory }}>
              <I n="tune" sz={15} col={P.platinum}/> Session Config
            </h3>
          </div>
          <div style={{ padding:"14px 15px",display:"flex",flexDirection:"column",gap:13 }}>
            {[["Verbose Logging","DEBUG level outputs",tv,setTv],["Auto-Deploy Signatures","Skip confirmation",ad,setAd]].map(([label,sub,val,setter]:any)=>(
              <div key={String(label)} style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontSize:"0.82rem",fontWeight:500,color:P.champagne }}>{label}</p>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:P.whisper,marginTop:2 }}>{sub}</p>
                </div>
                <div onClick={()=>setter(!val)} style={{ width:38,height:19,borderRadius:10,background:val?P.cgnDim:P.dash,border:`1px solid ${val?P.bHi:P.bDim}`,position:"relative",cursor:"pointer",transition:"all 0.25s",padding:"0 2px",display:"flex",alignItems:"center" }}>
                  <div style={{ width:15,height:15,borderRadius:"50%",background:val?P.cognac:P.parchment,transform:val?"translateX(18px)":"translateX(0)",transition:"transform 0.25s" }}/>
                </div>
              </div>
            ))}
            <div>
              <label style={{ display:"block",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:P.whisper,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.12em" }}>Baud Rate / Uplink</label>
              <select style={{ width:"100%",appearance:"none",background:P.cockpit,border:"none",borderBottom:`1px solid ${P.bMid}`,color:P.champagne,fontSize:"0.8rem",padding:"8px 10px",borderRadius:"2px 2px 0 0",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",outline:"none" }}>
                <option>115200 bps (Standard)</option><option>9600 bps (Failsafe)</option><option>Unlimited (LAN)</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
      <style>{`@keyframes tblink{0%,100%{opacity:1;}50%{opacity:0;}}`}</style>
    </div>
  );
}

function UpdatesView() {
  const [strategy,setStrategy]=useState<"phased"|"immediate">("phased");
  const [canary,setCanary]=useState(10);
  const rows=[
    {ver:"v2.4.1-stable",           target:"ESP32-WROOM",hash:"e3b0c442...b855",date:"Oct 24, 2023",status:"VERIFIED"},
    {ver:"v2.4.0-rc2",              target:"ESP32-WROOM",hash:"8d969eef...6c92",date:"Oct 18, 2023",status:"ARCHIVED"},
    {ver:"v1.8.5-patch",            target:"nRF52840",   hash:"f2ca1bb6...0a22",date:"Sep 12, 2023",status:"VERIFIED"},
    {ver:"v2.5.0-beta (Untrusted)", target:"ESP32-S3",   hash:"Mismatch",        date:"Just now",   status:"FAILED"},
    {ver:"v1.7.2-lts",              target:"STM32F4",    hash:"a3f1c88d...1d02",date:"Aug 5, 2023", status:"ARCHIVED"},
  ];
  const sc=(s:string)=>({VERIFIED:P.sage,ARCHIVED:P.platinum,FAILED:P.burg}[s]||P.platinum);
  const si=(s:string)=>({VERIFIED:"verified",ARCHIVED:"archive",FAILED:"warning"}[s]||"help");
  return (
    <div style={{ display:"grid",gridTemplateColumns:"1fr 325px",gap:9,padding:15,flex:1,overflow:"hidden" }}>
      <Card style={{ display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ padding:"14px 20px",borderBottom:`1px solid ${P.bDim}`,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
            <I n="inventory_2" sz={18} col={P.cognac}/>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:"1.05rem",color:P.ivory }}>Firmware Repository</h2>
          </div>
          <p style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:P.whisper }}>Signed artifacts · ESP32 Fleet Alpha · nRF52840 Cluster Beta</p>
        </div>
        <div style={{ padding:"7px 12px",display:"flex",gap:5,borderBottom:`1px solid ${P.bDim}`,flexShrink:0 }}>
          {["ALL","VERIFIED","FAILED","ARCHIVED"].map((f,i)=>(
            <button key={f}
              style={{ padding:"2px 9px",borderRadius:2,fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",letterSpacing:"0.08em",cursor:"pointer",background:i===0?P.cgnDim:"transparent",color:i===0?P.cognac:P.whisper,border:i===0?`1px solid ${P.bHi}`:"1px solid transparent",transition:"all 0.18s" }}
              onMouseEnter={e=>{if(i!==0){e.currentTarget.style.color=P.parchment;e.currentTarget.style.background=P.cockpit;}}}
              onMouseLeave={e=>{if(i!==0){e.currentTarget.style.color=P.whisper;e.currentTarget.style.background="transparent";}}}
            >{f}</button>
          ))}
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {["VERSION","TARGET","CHECKSUM (SHA-256)","DATE","STATUS"].map((h,i)=>(
                  <th key={h} style={{ padding:"9px 18px",textAlign:i===4?"right":"left",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",fontWeight:400,color:P.whisper,letterSpacing:"0.1em",textTransform:"uppercase",position:"sticky",top:0,background:P.wall }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <motion.tr key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.05}}
                  style={{ cursor:"pointer",transition:"background 0.16s" }}
                  onMouseEnter={e=>{Array.from(e.currentTarget.children).forEach((td:any)=>td.style.background=P.cockpit);}}
                  onMouseLeave={e=>{Array.from(e.currentTarget.children).forEach((td:any)=>td.style.background="");}}
                >
                  <td style={{ padding:"12px 18px",fontWeight:500,color:r.status==="FAILED"?P.burg:P.ivory,fontSize:"0.84rem",borderBottom:`1px solid ${P.bDim}` }}>{r.ver}</td>
                  <td style={{ padding:"12px 18px",borderBottom:`1px solid ${P.bDim}` }}>
                    <span style={{ display:"inline-flex",padding:"2px 7px",borderRadius:2,background:P.dash,color:P.champagne,fontFamily:"'JetBrains Mono',monospace",fontSize:"0.63rem" }}>{r.target}</span>
                  </td>
                  <td style={{ padding:"12px 18px",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.63rem",color:r.status==="FAILED"?P.burg:P.whisper,borderBottom:`1px solid ${P.bDim}` }}>{r.hash}</td>
                  <td style={{ padding:"12px 18px",color:P.cashmere,fontSize:"0.84rem",borderBottom:`1px solid ${P.bDim}` }}>{r.date}</td>
                  <td style={{ padding:"12px 18px",textAlign:"right",borderBottom:`1px solid ${P.bDim}` }}>
                    <span style={{ display:"inline-flex",alignItems:"center",gap:4,color:sc(r.status),fontFamily:"'JetBrains Mono',monospace",fontSize:"0.63rem",fontWeight:500 }}>
                      <I n={si(r.status)} sz={13} col={sc(r.status)}/>{r.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div style={{ background:P.cockpit,borderRadius:4,border:`1px solid ${P.bDim}`,padding:19,display:"flex",flexDirection:"column",overflowY:"auto",transition:"border-color 0.22s" }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=P.bMid;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=P.bDim;}}
      >
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:19 }}>
          <I n="rocket_launch" sz={22} col={P.cognac}/>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:"1.05rem",color:P.ivory }}>Deployment Config</h3>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:15,flex:1 }}>
          {[["TARGET PAYLOAD",["v2.4.1-stable (ESP32)","v1.8.5-patch (nRF52840)"]],["TARGET FLEET / CHIPSET",["Production — ESP32-WROOM","Staging — ESP32-WROOM","Alpha Testers — All"]]].map(([label,opts]:any)=>(
            <div key={label}>
              <label style={{ display:"block",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:P.whisper,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:5 }}>{label}</label>
              <select style={{ width:"100%",appearance:"none",background:P.dash,border:"none",borderBottom:`1px solid ${P.bMid}`,color:P.ivory,fontSize:"0.84rem",padding:"9px 10px",borderRadius:"2px 2px 0 0",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",outline:"none" }}>
                {opts.map((o:string)=><option key={o}>{o}</option>)}
              </select>
              {String(label).includes("FLEET")&&(
                <div style={{ display:"flex",justifyContent:"space-between",marginTop:4 }}>
                  <span style={{ fontSize:"0.7rem",color:P.whisper }}>Estimated scope:</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.7rem",color:P.cognac }}>12,450 devices</span>
                </div>
              )}
            </div>
          ))}
          <div>
            <label style={{ display:"block",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:P.whisper,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:9 }}>ROLLOUT STRATEGY</label>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["phased","Phased (10%)","cog"],["immediate","Immediate (100%)","burg"]].map(([val,label,t])=>(
                <label key={val} style={{ cursor:"pointer" }}>
                  <input type="radio" name="strat" style={{display:"none"}} checked={strategy===val} onChange={()=>{setStrategy(val as any);setCanary(val==="phased"?10:100);}}/>
                  <div style={{ padding:"8px 10px",borderRadius:2,textAlign:"center",fontSize:"0.84rem",cursor:"pointer",transition:"all 0.18s",border:`1px solid ${strategy===val?(t==="cog"?P.bHi:"rgba(158,90,90,0.4)"):P.bDim}`,color:strategy===val?(t==="cog"?P.cognac:P.burg):P.cashmere,background:strategy===val?(t==="cog"?P.cgnDim:P.burgDim):"transparent" }}>{label}</div>
                </label>
              ))}
            </div>
            <div style={{ marginTop:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:P.whisper }}>Canary %</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:P.cognac }}>{canary}%</span>
              </div>
              <input type="range" min={1} max={100} value={canary} onChange={e=>setCanary(Number(e.target.value))} style={{ width:"100%",accentColor:P.cognac,cursor:"pointer" }}/>
            </div>
          </div>
          <div style={{ background:P.dash,border:`1px solid ${P.bDim}`,padding:"9px 12px",borderRadius:2,display:"flex",gap:8,alignItems:"start" }}>
            <I n="info" sz={14} col={P.platinum}/>
            <p style={{ fontSize:"0.68rem",color:P.whisper,lineHeight:1.6 }}>Ensure firmware signatures match the root CA deployed on the selected chipset. Unsigned binaries will be rejected.</p>
          </div>
          <button
            style={{ width:"100%",background:P.cgnDim,color:P.cognac,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"1rem",padding:"12px 0",borderRadius:3,border:`1px solid ${P.bHi}`,cursor:"pointer",letterSpacing:"0.08em",display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"all 0.22s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=P.cgnGlow;e.currentTarget.style.color=P.ivory;}}
            onMouseLeave={e=>{e.currentTarget.style.background=P.cgnDim;e.currentTarget.style.color=P.cognac;}}
          >
            Initialize OTA Push <I n="send" sz={17} col="inherit"/>
          </button>
        </div>
      </div>
    </div>
  );
}

function VerificationView() {
  const [nodes,setNodes]=useState<NodeVerification[]>([
    {id:"ESP32-A142",ip:"192.168.1.42",status:"verifying",  progress:85, label:"VERIFYING HASH..."},
    {id:"ESP32-B091",ip:"192.168.1.91",status:"complete",   progress:100,label:"SECURE REBOOT"},
    {id:"ESP32-C330",ip:"192.168.2.30",status:"decrypting", progress:42, label:"AES DECRYPTION"},
    {id:"ESP32-D005",ip:"192.168.1.05",status:"error",      progress:100,label:"HASH MISMATCH ERROR"},
    {id:"ESP32-E112",ip:"192.168.3.12",status:"downloading",progress:12, label:"DOWNLOADING PAYLOAD"},
  ]);
  useEffect(()=>{
    const iv=setInterval(()=>{
      setNodes(p=>p.map(n=>{
        if(n.status==="verifying"   &&n.progress<99)return{...n,progress:Math.min(99,n.progress+0.8)};
        if(n.status==="downloading" &&n.progress<94)return{...n,progress:Math.min(94,n.progress+1.5)};
        if(n.status==="decrypting"  &&n.progress<88)return{...n,progress:Math.min(88,n.progress+0.4)};
        return n;
      }));
    },350);
    return ()=>clearInterval(iv);
  },[]);
  const nc=(s:string)=>({complete:P.sage,verifying:P.cognac,decrypting:P.champagne,error:P.burg,downloading:P.platinum}[s]||P.platinum);
  const bg=(s:string)=>({complete:P.sage,verifying:P.cognac,decrypting:P.copper,error:P.burg,downloading:P.dash}[s]||P.dash);
  const cryptoLog=[
    {ts:"14:02:41.002",node:"SYS",              text:"Initiating OTA Payload verification...",         col:P.cognac},
    {ts:"14:02:41.045",node:"KEY",              text:"Fetching public key from secure enclave... OK",  col:P.platinum},
    {ts:"14:02:42.110",node:"NODE [ESP32-B091]",text:"Decryption complete. Generating SHA-256...",     col:P.cognac},
    {ts:"",node:"",                             text:"Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",col:P.whisper,indent:true},
    {ts:"14:02:42.301",node:"NODE [ESP32-B091]",text:"Signature verification... MATCH (SECURE)",       col:P.sage},
    {ts:"14:02:43.055",node:"NODE [ESP32-A142]",text:"Payload received (1.2MB).",                      col:P.cognac},
    {ts:"14:02:43.102",node:"NODE [ESP32-A142]",text:"Initializing AES-GCM engine... OK",              col:P.cognac},
    {ts:"14:02:43.882",node:"NODE [ESP32-A142]",text:"Decrypting block [0x00 - 0xFF]...",              col:P.cognac},
    {ts:"14:02:44.201",node:"NODE [ESP32-D005]",text:"FATAL_ERROR — Hash mismatch detected.",          col:P.burg},
    {ts:"",node:"",                             text:"Action: Aborting OTA. Locking bootloader.",      col:P.burg,indent:true},
    {ts:"14:02:45.001",node:"NODE [ESP32-C330]",text:"Beginning decryption stream...",                  col:P.cognac},
  ];
  const aes=["B0","B1","B2","B3","B4","B5","B6","B7"];
  return (
    <div style={{ display:"grid",gridTemplateColumns:"1fr 345px",gap:9,padding:15,flex:1,overflow:"hidden" }}>
      <div style={{ display:"flex",flexDirection:"column",gap:9,overflow:"hidden" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"end" }}>
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:600,display:"flex",alignItems:"center",gap:8,color:P.ivory,marginBottom:3 }}>
              <I n="satellite_alt" f sz={22} col={P.cognac}/> OTA Verification Panel
            </h1>
            <p style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.57rem",color:P.whisper,letterSpacing:"0.14em",textTransform:"uppercase" }}>Target: ESP32_Fleet_Alpha // Mission Control View</p>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6,background:P.cockpit,padding:"5px 12px",borderRadius:2,border:`1px solid ${P.bDim}` }}>
            <div style={{ width:5,height:5,borderRadius:"50%",background:P.sage,animation:"gpulse 2.5s ease-in-out infinite" }}/>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.57rem",color:P.sage,letterSpacing:"0.14em",textTransform:"uppercase" }}>Live Telemetry Active</span>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,flexShrink:0 }}>
          {[
            {label:"Nodes in Flight",val:"1,204",sub:"/ 1,250",    pct:96,  icon:"router",   col:P.cognac},
            {label:"Hash Integrity", val:"99.8%",sub:"SHA-256",    pct:99.8,icon:"verified", col:P.sage},
            {label:"Decryption Rate",val:"45",   sub:"AES-256 n/s",pct:72,  icon:"key",     col:P.copper},
          ].map(s=>(
            <div key={s.label}
              style={{ background:P.wall,border:`1px solid ${P.bDim}`,borderRadius:4,padding:13,position:"relative",overflow:"hidden",transition:"all 0.22s",cursor:"default" }}
              onMouseEnter={e=>{e.currentTarget.style.background=P.cockpit;e.currentTarget.style.borderColor=P.bMid;}}
              onMouseLeave={e=>{e.currentTarget.style.background=P.wall;e.currentTarget.style.borderColor=P.bDim;}}
            >
              <div style={{ position:"absolute",top:0,left:0,right:0,height:1,background:s.col,opacity:0.4 }}/>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:P.whisper,textTransform:"uppercase",letterSpacing:"0.14em" }}>{s.label}</span>
                <I n={s.icon} sz={16} col={s.col}/>
              </div>
              <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:7 }}>
                <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:600,color:s.col }}>{s.val}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:P.whisper }}>{s.sub}</span>
              </div>
              <div style={{ background:P.dash,borderRadius:2,height:2,overflow:"hidden" }}>
                <motion.div initial={{width:0}} animate={{width:`${s.pct}%`}} transition={{duration:1,delay:0.3}}
                  style={{ height:"100%",background:s.col,borderRadius:2 }}/>
              </div>
            </div>
          ))}
        </div>
        <Card style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ padding:"11px 15px",borderBottom:`1px solid ${P.bDim}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:"0.95rem",display:"flex",alignItems:"center",gap:5,color:P.ivory }}>
              <I n="data_table" sz={16} col={P.cognac}/> Deployment Telemetry
            </h2>
            <div style={{ display:"flex",gap:5 }}>
              {["Filter: Active","Sort: Status"].map(t=>(
                <span key={t} style={{ padding:"2px 7px",background:P.cockpit,border:`1px solid ${P.bDim}`,fontFamily:"'JetBrains Mono',monospace",fontSize:"0.52rem",color:P.whisper,borderRadius:2,textTransform:"uppercase",letterSpacing:"0.08em" }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:8 }}>
            <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
              {nodes.map(n=>(
                <motion.div key={n.id} layout
                  style={{ padding:"11px 12px",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"space-between",background:n.status==="error"?"rgba(158,90,90,0.07)":P.cockpit,border:n.status==="error"?`1px solid rgba(158,90,90,0.22)`:`1px solid transparent`,borderLeft:n.status==="error"?`3px solid ${P.burg}`:"3px solid transparent",transition:"all 0.18s",cursor:"default" }}
                  onMouseEnter={e=>{if(n.status!=="error")e.currentTarget.style.background=P.dash;}}
                  onMouseLeave={e=>{if(n.status!=="error")e.currentTarget.style.background=P.cockpit;}}
                >
                  <div style={{ display:"flex",alignItems:"center",gap:10,width:"30%" }}>
                    <div style={{ width:30,height:30,background:P.dash,border:`1px solid ${nc(n.status)}28`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <I n="memory" sz={14} col={nc(n.status)}/>
                    </div>
                    <div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.75rem",fontWeight:600,color:nc(n.status) }}>{n.id}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.52rem",color:P.whisper,marginTop:2 }}>IP: {n.ip}</div>
                    </div>
                  </div>
                  <div style={{ flex:1,padding:"0 16px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.6rem",marginBottom:4 }}>
                      <span style={{ fontWeight:600,color:nc(n.status) }}>{n.label}</span>
                      <span style={{ color:P.whisper }}>{n.status==="error"?"FAIL":`${Math.round(n.progress)}%`}</span>
                    </div>
                    <div style={{ background:P.dash,borderRadius:2,height:4,overflow:"hidden" }}>
                      <motion.div animate={{width:`${n.progress}%`}} transition={{duration:0.5}}
                        style={{ height:"100%",background:bg(n.status),borderRadius:2 }}/>
                    </div>
                  </div>
                  <div style={{ width:74,textAlign:"right",flexShrink:0 }}>
                    {n.status==="complete"   &&<I n="gpp_good" f sz={20} col={P.sage}/>}
                    {n.status==="error"      &&<I n="warning" sz={20} col={P.burg}/>}
                    {n.status==="verifying"  &&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:P.cognac,animation:"scanBlink 1.5s step-end infinite" }}>Processing</span>}
                    {n.status==="decrypting" &&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:P.copper }}>Active</span>}
                    {n.status==="downloading"&&<span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:P.platinum }}>Transfer</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
        <Card style={{ padding:"12px 15px",display:"flex",alignItems:"center",gap:20,flexShrink:0 }}>
          <div style={{ flexShrink:0 }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:P.ivory,marginBottom:2 }}>AES-256 Engine</h3>
            <p style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:P.sage }}>STATUS: OPTIMAL</p>
          </div>
          <div style={{ flex:1,display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4 }}>
            {aes.map((b,i)=>(
              <div key={b}
                style={{ height:28,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",cursor:"default",transition:"all 0.2s",...(i<3?{border:`1px solid rgba(122,158,114,0.38)`,background:"rgba(122,158,114,0.1)"}:i===3?{border:`1px solid ${P.bHi}`,background:P.cgnDim}:{border:`1px solid ${P.bDim}`,background:P.cockpit}) }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=P.bHi;e.currentTarget.style.background=P.cgnDim;}}
                onMouseLeave={e=>{
                  e.currentTarget.style.borderColor=i<3?"rgba(122,158,114,0.38)":i===3?P.bHi:P.bDim;
                  e.currentTarget.style.background=i<3?"rgba(122,158,114,0.1)":i===3?P.cgnDim:P.cockpit;
                }}
              >
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:i<3?P.sage:i===3?P.cognac:P.whisper }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ flexShrink:0,textAlign:"right" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.54rem",color:P.whisper,textTransform:"uppercase" }}>Key Slot: <span style={{ color:P.cognac }}>0x4F</span></div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.54rem",color:P.whisper,textTransform:"uppercase",marginTop:3 }}>IV: <span style={{ color:P.ivory }}>GENERATED</span></div>
          </div>
        </Card>
      </div>
      <div style={{ background:"#090705",border:`1px solid ${P.bDim}`,borderRadius:4,display:"flex",flexDirection:"column",overflow:"hidden",transition:"border-color 0.22s" }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=P.bMid;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=P.bDim;}}
      >
        <div style={{ height:34,background:P.cockpit,borderBottom:`1px solid ${P.bDim}`,display:"flex",alignItems:"center",padding:"0 12px",justifyContent:"space-between",flexShrink:0,position:"relative" }}>
          <div style={{ position:"absolute",left:0,top:0,bottom:0,width:2,background:P.cognac }}/>
          <div style={{ display:"flex",alignItems:"center",gap:7,paddingLeft:7 }}>
            <I n="terminal" sz={12} col={P.cognac}/>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.61rem",fontWeight:600,letterSpacing:"0.14em",color:P.ivory }}>CRYPTOGRAPHIC LOG</span>
          </div>
          <div style={{ display:"flex",gap:4 }}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:P.dash,border:`1px solid ${P.bDim}`}}/>)}</div>
        </div>
        <div style={{ flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:11,lineHeight:1.75,overflowY:"auto",padding:"11px 12px",display:"flex",flexDirection:"column",justifyContent:"flex-end" }}>
          {cryptoLog.map((l,i)=>(
            <div key={i} style={{ marginBottom:3,paddingLeft:l.indent?14:0,wordBreak:"break-all" }}>
              {!l.indent&&l.ts&&<span style={{ color:P.trim }}>[{l.ts}]</span>}
              {l.node&&<> <span style={{ color:l.col,fontWeight:l.col===P.burg?700:500 }}>{l.node}:</span></>}
              {" "}<span style={{ color:l.indent?l.col:P.whisper }}>{l.text}</span>
            </div>
          ))}
          <div style={{ marginTop:5 }}>
            <span style={{ color:P.cognac,animation:"tblink 1s step-end infinite" }}>_</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes gpulse{0%,100%{transform:scale(1);opacity:0.9;}50%{transform:scale(2.1);opacity:0.15;}}
        @keyframes scanBlink{0%,100%{opacity:1;}50%{opacity:0.1;}}
        @keyframes tblink{0%,100%{opacity:1;}50%{opacity:0;}}
      `}</style>
    </div>
  );
}

export default function Dashboard({ onBackToLanding }: { onBackToLanding?:()=>void }) {
  const [view,setView]=useState<View>("dashboard");
  const [fleet,setFleet]=useState<DeviceState[]>([]);
  const [connected,setConnected]=useState(false);
  
  // Real backend integration
  useEffect(()=>{
    fetchFleet().then(f => {
      if(f) setFleet(f);
    }).catch(console.error);
  },[]);

  useWebSocket((process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/events"), (evt) => {
    if (evt.type === "fleet_tick") {
      setFleet(evt.payload as DeviceState[]);
      setConnected(true);
    }
  });
  return (
    <div style={{ display:"flex",height:"100vh",width:"100vw",overflow:"hidden",background:P.bg,color:P.ivory,fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div style={{ position:"fixed",inset:0,background:"radial-gradient(ellipse 55% 45% at 18% 0%, rgba(200,145,74,0.03) 0%, transparent 52%), radial-gradient(ellipse 38% 30% at 82% 100%, rgba(184,124,58,0.02) 0%, transparent 48%)",pointerEvents:"none",zIndex:0 }}/>
      <SideNav view={view} setView={setView} onBack={onBackToLanding}/>
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:1 }}>
        <TopBar connected={connected}/>
        <AnimatePresence mode="wait">
          <motion.div key={view}
            initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}
            exit={{opacity:0,y:-5}} transition={{duration:0.17}}
            style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}
          >
            {view==="dashboard"    &&<DashboardView fleet={fleet}/>}
            {view==="terminal"     &&<TerminalView/>}
            {view==="updates"      &&<UpdatesView/>}
            {view==="verification" &&<VerificationView/>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
