import { useState } from "react";

const ANNEE_REF = 2026; // Année en cours (engagé/facturé EVEN + B1)
// B1=2026, B2=2027, B3=2028, B4=2029, B5=2030, B6=2031
const AN = (n) => ANNEE_REF + n; // AN(0)=2026 ... AN(5)=2031

const CAPEX_DATA = [
  { id:"pac",    label:"Remplacement PAC",                   sub:"CVC · Génie climatique",         type:"DTQ",
    budget:1200000, os_total:980000, facture:740000,
    B1:1400000, B2:400000,  B3:0,       B4:0,       B5:0,       B6:0,
    os:[{id:"os041",label:"Dépose PAC + désamiantage",               montant:240000,facture:240000,statut:"solde"},
        {id:"os058",label:"Fourniture et pose PAC + GRS",             montant:740000,facture:500000,statut:"cours"}]},
  { id:"facade", label:"Ravalement façades",                 sub:"Enveloppe · Gros œuvre",         type:"DEV",
    budget:900000,  os_total:900000, facture:510000,
    B1:1200000, B2:0,        B3:0,       B4:0,       B5:0,       B6:0,
    os:[{id:"os062",label:"Échafaudage + ravalement pierre de taille",montant:900000,facture:510000,statut:"cours"}]},
  { id:"toiture",label:"Réfection toiture terrasse",         sub:"Enveloppe · Étanchéité",         type:"DTQ",
    budget:780000,  os_total:420000, facture:280000,
    B1:600000,  B2:480000,  B3:0,       B4:0,       B5:0,       B6:250000,
    os:[{id:"os071",label:"Étanchéité bicouche + isolation ITE",     montant:420000,facture:280000,statut:"cours"}]},
  { id:"ascens", label:"Remplacement ascenseurs",            sub:"Équipements · Mise aux normes",  type:"DTQ",
    budget:640000,  os_total:390000, facture:190000,
    B1:800000,  B2:0,        B3:350000,  B4:0,       B5:0,       B6:0,
    os:[{id:"os074",label:"Dépose + fourniture 2 ascenseurs OTIS",   montant:390000,facture:190000,statut:"cours"}]},
  { id:"elec",   label:"Mise aux normes électriques",        sub:"Équipements · Réglementaire",    type:"DTQ",
    budget:520000,  os_total:330000, facture:100000,
    B1:500000,  B2:0,        B3:0,       B4:420000,  B5:0,       B6:0,
    os:[{id:"os076",label:"TGBT + câblage divisionnaire RJ45",       montant:330000,facture:100000,statut:"cours"}]},
  { id:"lobby",  label:"Rénovation hall & parties communes", sub:"Aménagement · Repositionnement", type:"DEV",
    budget:780000,  os_total:220000, facture:50000,
    B1:1100000, B2:650000,  B3:300000,  B4:0,       B5:500000,  B6:0,
    os:[{id:"os079",label:"MOE + études de conception hall",          montant:220000,facture:50000, statut:"tardif"}]},
  { id:"toitTerrasse2", label:"Réfection étanchéité parking",       sub:"Enveloppe · Étanchéité",         type:"DTQ",
    budget:320000,  os_total:180000, facture:90000,
    B1:0,       B2:0,        B3:280000,  B4:0,       B5:0,       B6:0,
    os:[{id:"os081",label:"Étanchéité parking sous-sol niveaux −1 et −2", montant:180000,facture:90000,statut:"cours"}]},
  { id:"sprinkler",label:"Mise à niveau sprinklers",         sub:"Sécurité incendie · Réglementaire",type:"DTQ",
    budget:450000,  os_total:450000, facture:210000,
    B1:0,       B2:0,        B3:0,       B4:0,       B5:0,       B6:0,
    os:[{id:"os082",label:"Remplacement têtes + centrale détection",  montant:450000,facture:210000,statut:"cours"}]},
  { id:"sas",   label:"Création sas d'entrée",               sub:"Aménagement · Valorisation",     type:"DEV",
    budget:0,       os_total:0,      facture:0,
    B1:650000,  B2:0,        B3:0,       B4:0,       B5:0,       B6:0,
    os:[]},
  { id:"vrd",   label:"Réfection VRD & espaces verts",       sub:"Extérieurs · Entretien",         type:"DTQ",
    budget:175000,  os_total:80000,  facture:30000,
    B1:0,       B2:320000,   B3:0,       B4:0,       B5:0,       B6:0,
    os:[{id:"os083",label:"Reprise voirie + plantations",             montant:80000, facture:30000, statut:"cours"}]},
  { id:"bms",   label:"Déploiement BMS / GTC",               sub:"Smart building · Efficacité",    type:"DEV",
    budget:0,       os_total:0,      facture:0,
    B1:890000,  B2:430000,   B3:0,       B4:0,       B5:0,       B6:0,
    os:[]},
  { id:"dpe",   label:"Travaux DPE — isolation combles",     sub:"Performance énergétique · RE2020",type:"DTQ",
    budget:260000,  os_total:120000, facture:60000,
    B1:0,       B2:0,        B3:0,       B4:380000,  B5:0,       B6:0,
    os:[{id:"os084",label:"Isolation combles + remplacement fenêtres", montant:120000,facture:60000, statut:"cours"}]},
];

const SEP = "1px solid #d0d8e8"; // séparateur discret entre groupes d'années
  ne:       "Reporter sur 2026 le budget qui n'a pas fait l'objet d'OS : NE = B1 − E. Nécessite validation DAF.",
  far:      "Reporter sur 2026 les Factures À Recevoir sur OS émis : FAR = E − F. Ces sommes sont juridiquement engagées.",
  nf:       "Reporter sur 2026 le budget non facturé : NF = B1 − F. Inclut les FAR et le non engagé.",
  manu:     "Reporter sur 2026 un montant saisi manuellement. Utile pour un arbitrage partiel.",
  conserve: "Saisir le budget complémentaire à conserver en 2026 (hors factures déjà comptabilisées). Le solde restant sera reporté sur 2026.",
  reset:    "Annuler toutes les actions de report sur cette ligne.",
};

const calcFar  = (o) => Math.max(0, o.montant - o.facture);
const calcTfar = (a) => a.os.reduce((s,o) => s+calcFar(o), 0);
const calcNE   = (a) => Math.max(0, a.B1 - a.os_total);           // NE = B1 − E
const calcNF   = (a) => Math.max(0, a.B1 - a.facture);            // NF = B1 − F
const calcBmf  = (a) => Math.max(0, a.budget - a.facture);        // Budget N − Facturé (pour plafond saisie manuelle)
const fmt = (n) => n.toLocaleString("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0});

function calcTotalReport(a, reports) {
  const ar  = reports[a.id]?.report || 0;
  const osr = a.os.reduce((s,o) => s+(reports[o.id]?.report||0), 0);
  return ar + osr;
}

// ─── Tooltip ────────────────────────────────────────────────────────────────
function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position:"relative", display:"inline-flex", marginLeft:"auto", flexShrink:0 }}
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      <span style={{ fontSize:13, color:"#aaa", cursor:"default" }}>ⓘ</span>
      {show && <div style={{ position:"absolute", right:20, top:0, width:210, background:"#fff",
        border:"0.5px solid #ccc", borderRadius:8, padding:"8px 10px", fontSize:11, color:"#555",
        lineHeight:1.5, zIndex:9999, boxShadow:"0 4px 16px rgba(0,0,0,.12)", whiteSpace:"normal" }}>{text}</div>}
    </span>
  );
}

// ─── Menu item ──────────────────────────────────────────────────────────────
function CtxItem({ label, tipKey, onClick, danger, children }) {
  return (
    <>
      <div onClick={onClick}
        style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"7px 12px", cursor:"pointer",
          fontSize:12, position:"relative", color:danger?"#A32D2D":"inherit" }}
        onMouseEnter={e=>e.currentTarget.style.background="#f5f5f3"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{ flex:1, fontWeight:500, lineHeight:1.3 }}>{label}</div>
        <Tooltip text={TIPS[tipKey]} />
      </div>
      {children}
    </>
  );
}

// ─── Input row simple ────────────────────────────────────────────────────────
function InputRow({ label, max, onApply }) {
  const [raw, setRaw] = useState("");
  const saisi = parseInt(raw.replace(/\s/g,""))||0;
  const overMax = max!==undefined && saisi>max;
  const handleChange = e => {
    const digits = e.target.value.replace(/\D/g,"");
    const num = parseInt(digits)||0;
    setRaw(num>0?num.toLocaleString("fr-FR"):"");
  };
  return (
    <div style={{ padding:"4px 12px 8px 12px" }} onClick={e=>e.stopPropagation()}>
      <label style={{ fontSize:11, color:"#666", display:"block", marginBottom:4 }}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input type="text" inputMode="numeric" value={raw} onChange={handleChange}
          onClick={e=>e.stopPropagation()} placeholder="ex : 50 000"
          style={{ width:120, fontSize:12, padding:"2px 6px", textAlign:"right", borderRadius:4, outline:"none",
            border:overMax?"1.5px solid #C0392B":"0.5px solid #ccc",
            color:overMax?"#C0392B":"inherit", background:overMax?"#FEF0EF":"inherit" }} />
        {overMax && <span style={{ fontSize:11, color:"#C0392B", fontWeight:500 }}>⚠ dépassement</span>}
        <button onClick={e=>{e.stopPropagation();if(!overMax){onApply(saisi);setRaw("");}}}
          style={{ fontSize:11, padding:"2px 8px", borderRadius:4, cursor:overMax?"not-allowed":"pointer",
            border:"0.5px solid #ccc", background:overMax?"#eee":"#f0efe9",
            color:overMax?"#aaa":"inherit", opacity:overMax?0.6:1 }}>OK</button>
      </div>
    </div>
  );
}

// ─── Input row "conserver" ───────────────────────────────────────────────────
function InputRowConserve({ facture, budget, onApply }) {
  const [raw, setRaw] = useState("");
  const saisi = parseInt(raw.replace(/\s/g,""))||0;
  const factureEur = facture;
  const reporte = Math.max(0, budget - factureEur - saisi);
  const fmtE = n => n.toLocaleString("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0});
  const handleChange = e => {
    const digits = e.target.value.replace(/\D/g,"");
    const num = parseInt(digits)||0;
    setRaw(num>0?num.toLocaleString("fr-FR"):"");
  };
  return (
    <div style={{ padding:"6px 12px 10px 12px", background:"#fdfcf8", borderTop:"0.5px solid #f0ede0" }}
      onClick={e=>e.stopPropagation()}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, flexWrap:"wrap" }}>
        <label style={{ fontSize:11, color:"#666" }}>Budget complémentaire à conserver (€), hors facturé :</label>
        <input type="text" inputMode="numeric" value={raw} onChange={handleChange}
          onClick={e=>e.stopPropagation()} placeholder="ex : 50 000"
          style={{ width:110, fontSize:12, padding:"2px 6px", border:"0.5px solid #ccc", borderRadius:4, textAlign:"right" }} />
        <button onClick={e=>{e.stopPropagation();onApply(saisi);setRaw("");}}
          style={{ fontSize:11, padding:"2px 8px", borderRadius:4, border:"0.5px solid #ccc", background:"#f0efe9", cursor:"pointer" }}>OK</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, fontSize:11 }}>
        <div style={{ background:"#F0F7F2", borderRadius:6, padding:"6px 8px" }}>
          <div style={{ color:"#3A7A4A", fontWeight:600, marginBottom:2 }}>Déjà facturé</div>
          <div style={{ fontWeight:500 }}>{fmtE(factureEur)}</div>
          <div style={{ color:"#aaa", fontSize:10 }}>conservé (EVEN)</div>
        </div>
        <div style={{ background:saisi>0?"#fff8ee":"#f7f7f5", borderRadius:6, padding:"6px 8px" }}>
          <div style={{ color:"#c08030", fontWeight:600, marginBottom:2 }}>+ Budget saisi</div>
          <div style={{ color:saisi>0?"#b05000":"#bbb", fontWeight:500 }}>{saisi>0?fmtE(saisi):"—"}</div>
          <div style={{ color:"#aaa", fontSize:10 }}>à conserver</div>
        </div>
        <div style={{ background:saisi>0?"#fff3e0":"#f7f7f5", borderRadius:6, padding:"6px 8px", borderTop:saisi>0?"2px solid #e0a040":"2px solid #eee" }}>
          <div style={{ color:"#b05000", fontWeight:600, marginBottom:2 }}>= Total conservé</div>
          <div style={{ color:saisi>0?"#b05000":"#bbb", fontWeight:600 }}>{saisi>0?fmtE(factureEur+saisi):"—"}</div>
          <div style={{ color:"#aaa", fontSize:10 }}>facturé + saisi</div>
        </div>
        <div style={{ background:saisi>0?"#EAF1FF":"#f7f7f5", borderRadius:6, padding:"6px 8px", borderTop:saisi>0?"2px solid #4070CC":"2px solid #eee" }}>
          <div style={{ color:"#185FA5", fontWeight:600, marginBottom:2 }}>→ Report {AN(0)}</div>
          <div style={{ color:reporte>0?"#185FA5":"#bbb", fontWeight:600 }}>{saisi>0?fmtE(reporte):"—"}</div>
          <div style={{ color:"#aaa", fontSize:10 }}>budget − total conservé</div>
        </div>
      </div>
    </div>
  );
}

// ─── Menu contextuel actif ───────────────────────────────────────────────────
function CtxMenu({ a, reports, setReports, toast }) {
  const [open, setOpen]               = useState(false);
  const [showManu, setShowManu]       = useState(false);
  const [showConserve, setShowConserve] = useState(false);

  const ne  = calcNE(a);
  const far = calcTfar(a);
  const nf  = calcNF(a);
  const bmf = calcBmf(a); // plafond saisie manuelle
  const hasReport = reports[a.id]?.report>0 || a.os.some(o=>reports[o.id]?.report>0);

  const apply = (type, val) => {
    setOpen(false); setShowManu(false); setShowConserve(false);
    setReports(prev => {
      const next = {...prev};
      if (type==="ne")      { next[a.id]={report:ne, rt:"ne"};   toast(`${a.label} — ${fmt(ne)} (non engagé) reportés.`,"warning"); }
      if (type==="far")     { a.os.forEach(o=>{if(calcFar(o)>0)next[o.id]={report:calcFar(o),rt:"report"};}); next[a.id]={...(next[a.id]||{}),rt:"far"}; toast(`${a.label} — ${fmt(far)} de FAR reportés.`,"info"); }
      if (type==="nf")      { next[a.id]={report:nf, rt:"nf"};   toast(`${a.label} — ${fmt(nf)} (budget non facturé) reportés.`,"info"); }
      if (type==="manu")    { if(val<=0||val>bmf){toast(`Montant invalide. Max : ${fmt(bmf)}.`,"err");return prev;} next[a.id]={report:val,rt:"manu"}; toast(`${a.label} — ${fmt(val)} saisis.`,"info"); }
      if (type==="conserve"){ const r=Math.max(0,a.budget-a.facture-val); if(!r){toast(`Solde = 0.`,"warning");return prev;} next[a.id]={report:r,rt:"conserve"}; toast(`${a.label} — ${fmt(val)} conservés, ${fmt(r)} reportés.`,"info"); }
      if (type==="reset")   { delete next[a.id]; a.os.forEach(o=>delete next[o.id]); toast(`${a.label} — report annulé.`,"info"); }
      return next;
    });
  };

  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      <button onClick={e=>{e.stopPropagation();setOpen(o=>!o);}}
        style={{ background:"none", border:"0.5px solid #ddd", borderRadius:6, cursor:"pointer",
          padding:"3px 7px", fontSize:12, color:"#888" }}>⋮</button>
      {open && (
        <>
          <div onClick={()=>{setOpen(false);setShowManu(false);setShowConserve(false);}}
            style={{ position:"fixed", inset:0, zIndex:9998 }} />
          <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", width:300, background:"#fff",
            border:"0.5px solid #ccc", borderRadius:10, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,.12)" }}>
            <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".07em",
              color:"#999", padding:"8px 12px 4px" }}>{a.label.slice(0,30)}</div>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", padding:"6px 12px 4px", borderTop:"0.5px solid #eee" }}>
              Reporter sur 2026 :
            </div>
            {ne>0  && <CtxItem label={`Budget sans OS — NE (${fmt(ne)})`}            tipKey="ne"  onClick={()=>apply("ne")} />}
            {far>0 && <CtxItem label={`FAR sur OS émis — E−F (${fmt(far)})`}         tipKey="far" onClick={()=>apply("far")} />}
            {nf>0  && <CtxItem label={`Budget non facturé — NF=B1−F (${fmt(nf)})`}   tipKey="nf"  onClick={()=>apply("nf")} />}
            {bmf>0 && <>
              <CtxItem label="Montant saisi manuellement" tipKey="manu" onClick={()=>setShowManu(s=>!s)} />
              {showManu && <InputRow label={`Montant à reporter (€) — max ${fmt(bmf)} :`} max={bmf} onApply={v=>apply("manu",v)} />}
            </>}
            <hr style={{ border:"none", borderTop:"0.5px solid #eee", margin:"2px 0" }} />
            {bmf>0 && <>
              <CtxItem label="Saisir le budget complémentaire à conserver et reporter le solde" tipKey="conserve" onClick={()=>setShowConserve(s=>!s)} />
              {showConserve && <InputRowConserve facture={a.facture} budget={a.budget} onApply={v=>apply("conserve",v)} />}
            </>}
            {hasReport && <>
              <hr style={{ border:"none", borderTop:"0.5px solid #eee", margin:"2px 0" }} />
              <CtxItem label="Annuler le report" tipKey="reset" onClick={()=>apply("reset")} danger />
            </>}
          </div>
        </>
      )}
    </div>
  );
}

const TD = ({children, right, style={}}) => (
  <td style={{ padding:"8px 10px", borderBottom:"0.5px solid #eee", verticalAlign:"middle",
    textAlign:right?"right":"left", fontSize:13, ...style }}>{children}</td>
);

const thG = { // style groupe entête
  fontSize:11, fontWeight:600, textAlign:"center", padding:"4px 8px",
  borderBottom:"0.5px solid #eee", borderLeft:"1px solid #ddd", color:"#555"
};

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [expanded, setExpanded]   = useState(new Set());
  const [reports,  setReports]    = useState({});
  const [toastMsg, setToastMsg]   = useState(null);
  const [overrides,setOverrides]  = useState({});
  const [editing,  setEditing]    = useState(null);
  const [comments, setComments]   = useState({});

  const toast = (msg,type) => { setToastMsg({msg,type}); setTimeout(()=>setToastMsg(null),4000); };
  const toggleExpand = id => setExpanded(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  // Totaux
  const totBudget  = CAPEX_DATA.reduce((s,a)=>s+a.budget,0);
  const totOS      = CAPEX_DATA.reduce((s,a)=>s+a.os_total,0);
  const totFac     = CAPEX_DATA.reduce((s,a)=>s+a.facture,0);
  const totFAR     = CAPEX_DATA.reduce((s,a)=>s+calcTfar(a),0);
  const totNE      = CAPEX_DATA.reduce((s,a)=>s+calcNE(a),0);
  const totNF      = CAPEX_DATA.reduce((s,a)=>s+calcNF(a),0);
  const totReport  = CAPEX_DATA.reduce((s,a)=>s+calcTotalReport(a,reports),0);
  const totB1init  = CAPEX_DATA.reduce((s,a)=>s+a.B1,0);
  const totB1rev   = CAPEX_DATA.reduce((s,a)=>s+(overrides[a.id]?.B1rev ?? (a.B1+calcTotalReport(a,reports))),0);
  const totB2init  = CAPEX_DATA.reduce((s,a)=>s+a.B2,0);
  const totB2rev   = CAPEX_DATA.reduce((s,a)=>s+(overrides[a.id]?.B2rev ?? 0),0);
  const totB3init  = CAPEX_DATA.reduce((s,a)=>s+a.B3,0);
  const totB3rev   = CAPEX_DATA.reduce((s,a)=>s+(overrides[a.id]?.B3rev ?? 0),0);
  const totB4init  = CAPEX_DATA.reduce((s,a)=>s+a.B4,0);
  const totB4rev   = CAPEX_DATA.reduce((s,a)=>s+(overrides[a.id]?.B4rev ?? 0),0);
  const totB5init  = CAPEX_DATA.reduce((s,a)=>s+a.B5,0);
  const totB5rev   = CAPEX_DATA.reduce((s,a)=>s+(overrides[a.id]?.B5rev ?? 0),0);
  const hasB2rev   = CAPEX_DATA.some(a=>overrides[a.id]?.B2rev!==undefined);
  const hasB3rev   = CAPEX_DATA.some(a=>overrides[a.id]?.B3rev!==undefined);
  const hasB4rev   = CAPEX_DATA.some(a=>overrides[a.id]?.B4rev!==undefined);
  const hasB5rev   = CAPEX_DATA.some(a=>overrides[a.id]?.B5rev!==undefined);
  const totB6init  = CAPEX_DATA.reduce((s,a)=>s+a.B6,0);
  const totB6rev   = CAPEX_DATA.reduce((s,a)=>s+(overrides[a.id]?.B6rev ?? 0),0);
  const hasB6rev   = CAPEX_DATA.some(a=>overrides[a.id]?.B6rev!==undefined);
  const totInitial = totB1init+totB2init+totB3init+totB4init+totB5init+totB6init;
  const totRevise  = totB1rev +totB2rev +totB3rev +totB4rev +totB5rev +totB6rev;

  const toastColors = { info:"#0C447C|#E6F1FB|#B5D4F4", warning:"#633806|#FAEEDA|#FAC775", success:"#27500A|#EAF3DE|#C0DD97", err:"#791F1F|#FCEBEB|#F7C1C1" };
  const thS = { fontSize:11, fontWeight:500, color:"#888", padding:"6px 10px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap" };

  // Cellule éditable (révisé N+2..N+5)
  const EditCell = ({id, col, initVal, bbot}) => {
    const isEdit     = editing?.id===id && editing?.col===col;
    const hasOverride = overrides[id]?.[col] !== undefined;
    const val        = hasOverride ? overrides[id][col] : null;
    return (
      <td style={{ padding:"4px 8px", borderBottom:bbot, textAlign:"right", verticalAlign:"middle",
        background: hasOverride ? "#fffbe0" : "#fafaf8", cursor:"pointer", fontSize:13 }}
        title="Double-cliquez pour modifier"
        onDoubleClick={()=>setEditing({id,col})}>
        {isEdit
          ? <input autoFocus type="number" defaultValue={hasOverride ? val : initVal}
              onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v))setOverrides(p=>({...p,[id]:{...p[id],[col]:v}}));setEditing(null);}}
              onKeyDown={e=>{if(e.key==="Enter")e.target.blur();if(e.key==="Escape")setEditing(null);}}
              style={{width:72,textAlign:"right",fontSize:12,padding:"2px 4px",border:"1px solid #185FA5",borderRadius:4,outline:"none"}} />
          : hasOverride
            ? <span style={{ color:"#b05000", fontWeight:600 }}>
                {val>0 ? fmt(val) : <span style={{color:"#ccc"}}>—</span>}
                <span style={{fontSize:9,color:"#c08030",display:"block"}}>✎</span>
              </span>
            : <span style={{color:"#ccc"}}>—</span>}
      </td>
    );
  };

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding:"1rem 2rem", color:"#1a1a18" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:500 }}>Suivi budgétaire des opérations CAPEX</div>
          <div style={{ fontSize:13, color:"#888", marginTop:2 }}>Situation au 30 septembre {AN(0)} · 12 opérations · Budget construit fin {AN(0)-1}</div>
        </div>
        <span style={{ fontSize:11, background:"#f0efe9", border:"0.5px solid #ddd", borderRadius:20, padding:"3px 10px", color:"#888" }}>Démo SNK</span>
      </div>

      {toastMsg && (() => {
        const [c,bg,bc]=(toastColors[toastMsg.type]||toastColors.info).split("|");
        return <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",borderRadius:8,fontSize:12,marginBottom:12,border:`0.5px solid ${bc}`,background:bg,color:c}}>{toastMsg.msg}</div>;
      })()}

      <style>{`
        .capex-table thead th { position: sticky; z-index: 10; }
        .capex-table thead tr:nth-child(1) th { top: 0; }
        .capex-table thead tr:nth-child(2) th { top: 36px; }
        .capex-table thead tr:nth-child(3) th { top: 72px; }
        .capex-table tfoot tr td, .capex-table tbody tr.capex-sticky-total td { position: sticky; bottom: 0; z-index: 9; }
      `}</style>
      <div style={{ background:"#fff", border:"0.5px solid #eee", borderRadius:12, overflowX:"auto", overflowY:"auto", maxHeight:"75vh" }}>
        <table className="capex-table" style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:1800 }}>
          <thead>
            {/* Ligne 1 : groupes année */}
            <tr style={{ background:"#2a5a8a", color:"#fff", textAlign:"center" }}>
              <th colSpan={3} style={{ ...thG, color:"#fff", background:"#1a1a18", borderLeft:"none", textAlign:"left", paddingLeft:12 }}>Identification</th>
              <th colSpan={7} style={{ ...thG, color:"#fff", background:"#2a5a8a", borderLeft:"1px solid #d0d8e8" }}>{AN(0)}</th>
              {[1,2,3,4,5].map(i => (
                <th key={i} colSpan={2} style={{ ...thG, color:"#fff", background:"#1e3a5a", borderLeft:"1px solid #d0d8e8" }}>{AN(i)}</th>
              ))}
              <th style={{ ...thG, color:"#fff", background:"#1a1a18", borderLeft:"1px solid #e0e0e0" }}>Commentaire</th>
            </tr>
            {/* Ligne 2 : sous-groupes */}
            <tr style={{ background:"#e8eff8", textAlign:"center" }}>
              <th colSpan={3} style={{ ...thG, color:"#555", background:"#f0f0ee", borderLeft:"none" }}></th>
              <th colSpan={2} style={{ ...thG, color:"#555", background:"#e8eff8", borderLeft:"1px solid #d0d8e8", fontSize:11 }}>Budget</th>
              <th colSpan={2} style={{ ...thG, color:"#3A7A4A", background:"#e0f0e8", borderLeft:"1px solid #b0d8b8", fontSize:11 }}>Engagé / Facturé (EVEN)</th>
              <th colSpan={3} style={{ ...thG, color:"#8a4020", background:"#f8e8d8", borderLeft:"1px solid #d8b898", fontSize:11 }}>Reports possibles sur {AN(0)}</th>
              {[1,2,3,4,5].map(i => (
                <th key={i} colSpan={2} style={{ ...thG, color:"#555", background:"#e8eff8", borderLeft:"1px solid #d0d8e8", fontSize:11 }}>Budget</th>
              ))}
              <th style={{ ...thG, color:"#555", background:"#f0f0ee", borderLeft:"1px solid #e0e0e0" }}></th>
            </tr>
            {/* Ligne 3 : colonnes */}
            <tr style={{ background:"#f5f5f0" }}>
              <th style={{ ...thS, width:32 }}></th>
              <th style={{ ...thS, minWidth:180 }}>Opération / OS</th>
              <th style={{ ...thS, width:58 }}>Clé</th>
              {/* 2026 — Budget */}
              <th style={{ ...thS, textAlign:"right", width:100, borderLeft:"1px solid #d0d8e8" }}>
                <span style={{ color:"#bbb", fontSize:10 }}>B1</span><br/>Validé
              </th>
              <th style={{ ...thS, textAlign:"right", width:110, background:"#fffbe0" }}>
                <span style={{ color:"#c08030", fontSize:10 }}>B1'=B1+report</span><br/><span style={{color:"#c08030"}}>Révisé</span>
              </th>
              {/* 2026 — Engagé/Facturé */}
              <th style={{ ...thS, textAlign:"right", width:95, borderLeft:"1px solid #b0d8b8", background:"#F0F7F2" }}>
                <span style={{ color:"#3A7A4A", fontSize:9, fontWeight:600 }}>E</span><br/>OS engagés
              </th>
              <th style={{ ...thS, textAlign:"right", width:85, background:"#F0F7F2" }}>
                <span style={{ color:"#3A7A4A", fontSize:9, fontWeight:600 }}>F</span><br/>
                <span title="Factures comptabilisées" style={{cursor:"help",borderBottom:"1px dashed #88BB88"}}>Facturé</span>
              </th>
              {/* 2026 — Reports */}
              <th style={{ ...thS, textAlign:"right", width:85, borderLeft:"1px solid #d8b898", background:"#fdf5ee" }}>
                <span style={{ color:"#8a4020", fontSize:10 }}>FAR=E−F</span><br/>
                <span title="Factures à recevoir : OS engagés − Facturé" style={{cursor:"help",borderBottom:"1px dashed #d09878"}}>FAR</span>
              </th>
              <th style={{ ...thS, textAlign:"right", width:85, background:"#fdf5ee" }}>
                <span style={{ color:"#8a4020", fontSize:10 }}>NE=B1−E</span><br/>
                <span title="Budget 2026 non couvert par un OS" style={{cursor:"help",borderBottom:"1px dashed #d09878"}}>Non engagé</span>
              </th>
              <th style={{ ...thS, textAlign:"right", width:85, background:"#fdf5ee" }}>
                <span style={{ color:"#8a4020", fontSize:10 }}>NF=B1−F</span><br/>
                <span title="Budget 2026 non encore facturé" style={{cursor:"help",borderBottom:"1px dashed #d09878"}}>Non facturé</span>
              </th>
              {/* 2027 à 2031 */}
              {[1,2,3,4,5].map((i) => {
                const b = `B${i+1}`;
                return (
                  <>
                    <th key={b+"i"} style={{ ...thS, textAlign:"right", width:100, borderLeft:"1px solid #d0d8e8" }}>
                      <span style={{color:"#bbb",fontSize:10}}>{b}</span><br/>Validé
                    </th>
                    <th key={b+"r"} style={{ ...thS, textAlign:"right", width:100, background:"#fffbe0" }}>
                      <span style={{color:"#c08030",fontSize:10}}>{b}' ✎</span><br/><span style={{color:"#c08030"}}>Révisé</span>
                    </th>
                  </>
                );
              })}
              <th style={{ ...thS, width:200, borderLeft:"1px solid #e0e0e0" }}>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {CAPEX_DATA.map((a, ai) => {
              const totalRep = calcTotalReport(a, reports);
              const rep      = reports[a.id];
              const ne       = calcNE(a);
              const far      = calcTfar(a);
              const nf       = calcNF(a);
              const B1rev    = overrides[a.id]?.B1rev ?? (a.B1 + totalRep);
              const B2rev    = overrides[a.id]?.B2rev ?? a.B2;
              const B3rev    = overrides[a.id]?.B3rev ?? a.B3;
              const B4rev    = overrides[a.id]?.B4rev ?? a.B4;
              const B5rev    = overrides[a.id]?.B5rev ?? a.B5;
              const B6rev    = overrides[a.id]?.B6rev ?? a.B6;
              const totalInit = a.B1+a.B2+a.B3+a.B4+a.B5+a.B6;
              const totalRev  = B1rev+B2rev+B3rev+B4rev+B5rev+B6rev;
              const isLast   = ai===CAPEX_DATA.length-1;
              const bbot     = isLast&&!expanded.has(a.id)?"none":"0.5px solid #eee";
              const rt = rep?.rt;
              const rtLabels = {far:"FAR",ne:"NE",nf:"NF",manu:"MANUEL",conserve:"SOLDE"};
              const rtColors = {far:"#27500A|#EAF3DE",ne:"#854F0B|#FAEEDA",nf:"#5C3D00|#FEF0D0",manu:"#0C447C|#E6F1FB",conserve:"#0C447C|#E6F1FB"};
              const [rtC,rtBg] = (rtColors[rt]||"#555|#eee").split("|");
              const isB1RevEdit = editing?.id===a.id && editing?.col==="B1rev";

              return [
                <tr key={a.id}>
                  {/* Chevron */}
                  <td style={{padding:"8px 6px",borderBottom:bbot,verticalAlign:"middle"}}>
                    <button onClick={()=>toggleExpand(a.id)}
                      style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",
                        color:"#aaa",fontSize:14,transform:expanded.has(a.id)?"rotate(90deg)":"none",
                        transition:"transform .15s",display:"inline-flex",alignItems:"center"}}>›</button>
                  </td>
                  {/* Label */}
                  <TD style={{borderBottom:bbot}}>
                    <strong>{a.label}</strong><br/><span style={{color:"#aaa",fontSize:11}}>{a.sub}</span>
                  </TD>
                  {/* Clé */}
                  <TD style={{borderBottom:bbot}}>
                    <span style={{display:"inline-block",fontSize:11,padding:"2px 6px",borderRadius:4,fontWeight:500,
                      background:a.type==="DTQ"?"#E6F1FB":"#EEEDFE",color:a.type==="DTQ"?"#0C447C":"#3C3489"}}>{a.type}</span>
                  </TD>
                  {/* Budget total initial */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #ddd",color:"#555"}}>
                    {fmt(totalInit)}
                  </td>
                  {/* Budget total révisé */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,background:totalRep>0?"#fffbe0":"#fafaf8",
                    fontWeight:totalRep>0?600:400,color:totalRep>0?"#b05000":"#888"}}>
                    {totalRep>0 ? fmt(totalRev) : <span style={{color:"#ccc"}}>—</span>}
                  </td>
                  {/* B1 initial */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #ddd",color:"#555"}}>
                    {fmt(a.B1)}
                  </td>
                  {/* B1 révisé — toujours éditable */}
                  {(() => {
                    const hasOverride = overrides[a.id]?.B1rev !== undefined;
                    const displayVal  = hasOverride ? overrides[a.id].B1rev : (totalRep > 0 ? B1rev : null);
                    const isActive    = totalRep > 0 || hasOverride;
                    return (
                      <td style={{textAlign:"right",padding:"4px 10px",borderBottom:bbot,
                        background: isActive ? "#fffbe0" : "#fafaf8",
                        cursor:"pointer", fontWeight: isActive ? 600 : 400 }}
                        title="Double-cliquez pour modifier"
                        onDoubleClick={()=>setEditing({id:a.id,col:"B1rev"})}>
                        {isB1RevEdit
                          ? <input autoFocus type="number" defaultValue={displayVal ?? a.B1}
                              onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v))setOverrides(p=>({...p,[a.id]:{...p[a.id],B1rev:v}}));setEditing(null);}}
                              onKeyDown={e=>{if(e.key==="Enter")e.target.blur();if(e.key==="Escape")setEditing(null);}}
                              style={{width:72,textAlign:"right",fontSize:12,padding:"2px 4px",border:"1px solid #185FA5",borderRadius:4,outline:"none"}} />
                          : isActive
                            ? <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                                <span style={{color: hasOverride ? "#b05000" : "#b05000"}}>{fmt(displayVal)}</span>
                                {hasOverride
                                  ? <span style={{fontSize:9,color:"#c08030"}}>✎ saisi manuellement</span>
                                  : <div style={{display:"flex",alignItems:"center",gap:4}}>
                                      <span style={{fontSize:10,color:"#7090CC"}}>base {fmt(a.B1)} +{fmt(totalRep)}</span>
                                      {rt&&rtLabels[rt]&&<span style={{fontSize:9,padding:"1px 4px",borderRadius:3,background:rtBg,color:rtC,fontWeight:700}}>{rtLabels[rt]}</span>}
                                    </div>}
                              </div>
                            : <span style={{color:"#ccc"}}>—</span>}
                      </td>
                    );
                  })()}
                  {/* OS engagés */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #ddd",background:"#F0F7F2",color:"#185FA5"}}>
                    {fmt(a.os_total)}
                  </td>
                  {/* Facturé */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,background:"#F0F7F2"}}>
                    {fmt(a.facture)}
                  </td>
                  {/* FAR */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #ddd"}}>
                    {far>0?fmt(far):<span style={{color:"#ccc"}}>—</span>}
                  </td>
                  {/* Non engagé */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot}}>
                    {ne>0?fmt(ne):<span style={{color:"#ccc"}}>0 €</span>}
                  </td>
                  {/* Non facturé + menu ⋮ */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,verticalAlign:"middle"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}}>
                      <span>{nf>0?fmt(nf):<span style={{color:"#ccc"}}>—</span>}</span>
                      <CtxMenu a={a} reports={reports} setReports={setReports} toast={toast} />
                    </div>
                  </td>
                  {/* B2 à B5 initial + révisé */}
                  {[["B2","B2rev"],["B3","B3rev"],["B4","B4rev"],["B5","B5rev"],["B6","B6rev"]].map(([init,col])=>(
                    <>
                      <td key={init} style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #ddd",color:"#888"}}>
                        {a[init]>0?fmt(a[init]):<span style={{color:"#ccc"}}>—</span>}
                      </td>
                      <EditCell key={col} id={a.id} col={col} initVal={a[init]} bbot={bbot} />
                    </>
                  ))}
                  {/* Commentaire */}
                  <td style={{padding:"4px 8px",borderBottom:bbot,borderLeft:"1px solid #ddd",verticalAlign:"middle"}}>
                    <textarea
                      value={comments[a.id]||""}
                      onChange={e=>setComments(p=>({...p,[a.id]:e.target.value}))}
                      placeholder="Ajouter un commentaire…"
                      rows={2}
                      style={{width:"100%",fontSize:11,padding:"4px 6px",border:"0.5px solid #ddd",borderRadius:4,
                        resize:"vertical",fontFamily:"inherit",color:"#555",background:"#fafaf8",outline:"none",
                        minWidth:160}} />
                  </td>
                </tr>,

                ...(expanded.has(a.id) ? a.os.map((o,oi)=>{
                  const f = calcFar(o);
                  const oRep = reports[o.id];
                  const statBadge = o.statut==="solde"?{l:"Soldé",bg:"#EAF3DE",c:"#27500A"}:o.statut==="tardif"?{l:"Tardif",bg:"#FAEEDA",c:"#633806"}:{l:"En cours",bg:"#E6F1FB",c:"#185FA5"};
                  const bsep = isLast&&oi===a.os.length-1?"none":"0.5px solid #eee";
                  const td = (v,extra={}) => <td style={{padding:"6px 10px",borderBottom:bsep,textAlign:"right",fontSize:12,color:"#ccc",...extra}}>{v||"—"}</td>;
                  return (
                    <tr key={o.id} style={{background:"#f7f7f5"}}>
                      <td style={{padding:"6px 10px",borderBottom:bsep}}></td>
                      <td style={{padding:"6px 10px",borderBottom:bsep,fontSize:12}}>
                        <span style={{color:"#ccc",marginRight:4}}>↳</span>
                        <strong>{o.id.toUpperCase()}</strong>
                        <span style={{display:"inline-block",fontSize:10,padding:"1px 6px",borderRadius:3,marginLeft:6,
                          background:statBadge.bg,color:statBadge.c,fontWeight:600}}>{statBadge.l}</span>
                        <br/><span style={{color:"#aaa",fontSize:11}}>{o.label}</span>
                      </td>
                      <td style={{padding:"6px 10px",borderBottom:bsep}}></td>
                      {td(null,{borderLeft:"1px solid #ddd"})}
                      {td(null,{background:"#fafaf8"})}
                      {td(null,{borderLeft:"1px solid #ddd"})}
                      {td(oRep?.report>0?<span style={{color:"#185FA5",fontWeight:600}}>+{fmt(oRep.report)}</span>:null,{background:"#fafaf8"})}
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,background:"#F0F7F2",borderLeft:"1px solid #ddd",color:"#185FA5",fontSize:12}}>{fmt(o.montant)}</td>
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,background:"#F0F7F2",fontSize:12}}>{fmt(o.facture)}</td>
                      {td(null,{background:"#F0F7F2"})}
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,borderLeft:"1px solid #ddd",fontSize:12}}>
                        {f>0?<strong style={{color:"inherit"}}>{fmt(f)}</strong>:"—"}
                      </td>
                      {td(null)}{td(null)}
                      {["B2","B3","B4","B5","B6"].map(b=><>{td(null,{borderLeft:"1px solid #ddd"})}{td(null,{background:"#fafaf8"})}</>)}
                      <td style={{borderBottom:bsep,borderLeft:"1px solid #ddd"}}></td>
                    </tr>
                  );
                }) : [])
              ];
            })}

            {/* Ligne total — flottante */}
            <tr className="capex-sticky-total" style={{fontWeight:500, color:"#fff", borderTop:"1px solid #555", boxShadow:"0 -2px 8px rgba(0,0,0,0.25)"}}>
              <td style={{borderBottom:"none",padding:"9px 6px", background:"#1a1a18"}}></td>
              <td style={{padding:"9px 10px",borderBottom:"none",fontWeight:700,fontSize:14, background:"#1a1a18"}}>Total</td>
              <td style={{borderBottom:"none",padding:"9px 6px", background:"#1a1a18"}}></td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8", background:"#1e2a38"}}>{fmt(totInitial)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>
                {totReport>0?fmt(totRevise):<span style={{color:"#666"}}>—</span>}
              </td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #2a4a2a",background:"#1a3020",color:"#7ecfaa"}}>{fmt(totB1init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>
                {totReport>0?<>{fmt(totB1rev)}<div style={{fontSize:10,fontWeight:400,color:"#aa9"}}>+{fmt(totReport)} reportés</div></>:<span style={{color:"#666"}}>—</span>}
              </td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #2a4a2a",background:"#1a3020",color:"#7ecfaa"}}>{fmt(totOS)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#1a3020",color:"#7ecfaa"}}>{fmt(totFac)}</td>
              <td style={{borderBottom:"none",background:"#2a1808"}}></td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a1808"}}>{fmt(totFAR)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a1808"}}>{fmt(totNE)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a1808"}}>{fmt(totNF)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB2init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{hasB2rev?fmt(totB2rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB3init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{hasB3rev?fmt(totB3rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB4init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{hasB4rev?fmt(totB4rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB5init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{hasB5rev?fmt(totB5rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB6init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{hasB6rev?fmt(totB6rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{borderBottom:"none",borderLeft:"1px solid #e0e0e0",background:"#1a1a18"}}></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
