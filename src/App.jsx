import { useState, useRef, useEffect } from "react";

// AN(n) est recalculé dynamiquement depuis le state dateSimu dans App

const CAPEX_DATA = [
  { id:"pac",    label:"Remplacement PAC",                   sub:"CVC · Génie climatique",         type:"DTQ",
    dateOuverture:2024,
    historique:[
      {annee:2024, B1:800000,  os_total:200000, facture:180000},
      {annee:2025, B1:950000,  os_total:780000, facture:620000},
    ],
    budget:1200000, os_total:980000, facture:740000,
    B1:1400000, B2:400000,  B3:0,       B4:0,       B5:0,       B6:0,
    os:[{id:"os041",label:"Dépose PAC + désamiantage",               montant:240000,facture:240000,statut:"solde"},
        {id:"os058",label:"Fourniture et pose PAC + GRS",             montant:740000,facture:500000,statut:"cours"}]},
  { id:"etudes", label:"Études préalables — restructuration R+3",    sub:"Maîtrise d'œuvre · Études",      type:"DEV",
    dateOuverture:2026,
    historique:[],
    budget:0,       os_total:0,      facture:0,
    B1:180000,  B2:0,        B3:0,       B4:0,       B5:0,       B6:0,
    os:[]},
  { id:"facade", label:"Ravalement façades",                 sub:"Enveloppe · Gros œuvre",         type:"DEV",
    dateOuverture:2025,
    historique:[
      {annee:2025, B1:1000000, os_total:850000, facture:400000},
    ],
    budget:900000,  os_total:900000, facture:510000,
    B1:1200000, B2:0,        B3:0,       B4:0,       B5:0,       B6:0,
    os:[{id:"os062",label:"Échafaudage + ravalement pierre de taille",montant:900000,facture:510000,statut:"cours"}]},
  { id:"toiture",label:"Réfection toiture terrasse",         sub:"Enveloppe · Étanchéité",         type:"DTQ",
    dateOuverture:2025,
    historique:[
      {annee:2025, B1:600000,  os_total:320000, facture:180000},
    ],
    budget:780000,  os_total:420000, facture:280000,
    B1:600000,  B2:480000,  B3:0,       B4:0,       B5:0,       B6:250000,
    os:[{id:"os071",label:"Étanchéité bicouche + isolation ITE",     montant:420000,facture:280000,statut:"cours"}]},
  { id:"ascens", label:"Remplacement ascenseurs",            sub:"Équipements · Mise aux normes",  type:"DTQ",
    dateOuverture:2024,
    historique:[
      {annee:2024, B1:500000,  os_total:150000, facture:100000},
      {annee:2025, B1:640000,  os_total:300000, facture:150000},
    ],
    budget:640000,  os_total:390000, facture:190000,
    B1:800000,  B2:0,        B3:350000,  B4:0,       B5:0,       B6:0,
    os:[{id:"os074",label:"Dépose + fourniture 2 ascenseurs OTIS",   montant:390000,facture:190000,statut:"cours"}]},
  { id:"elec",   label:"Mise aux normes électriques",        sub:"Équipements · Réglementaire",    type:"DTQ",
    dateOuverture:2026,
    historique:[],
    budget:520000,  os_total:330000, facture:100000,
    B1:500000,  B2:0,        B3:0,       B4:420000,  B5:0,       B6:0,
    os:[{id:"os076",label:"TGBT + câblage divisionnaire RJ45",       montant:330000,facture:100000,statut:"cours"}]},
  { id:"lobby",  label:"Rénovation hall & parties communes", sub:"Aménagement · Repositionnement", type:"DEV",
    dateOuverture:2025,
    historique:[
      {annee:2025, B1:900000,  os_total:180000, facture:30000},
    ],
    budget:780000,  os_total:220000, facture:50000,
    B1:1100000, B2:650000,  B3:300000,  B4:0,       B5:500000,  B6:0,
    os:[{id:"os079",label:"MOE + études de conception hall",          montant:220000,facture:50000, statut:"tardif"}]},
  { id:"toitTerrasse2", label:"Réfection étanchéité parking",       sub:"Enveloppe · Étanchéité",         type:"DTQ",
    dateOuverture:2026,
    historique:[],
    budget:320000,  os_total:180000, facture:90000,
    B1:0,       B2:0,        B3:280000,  B4:0,       B5:0,       B6:0,
    os:[{id:"os081",label:"Étanchéité parking sous-sol niveaux −1 et −2", montant:180000,facture:90000,statut:"cours"}]},
  { id:"sprinkler",label:"Mise à niveau sprinklers",         sub:"Sécurité incendie · Réglementaire",type:"DTQ",
    dateOuverture:2025,
    historique:[
      {annee:2025, B1:400000,  os_total:380000, facture:150000},
    ],
    budget:450000,  os_total:450000, facture:210000,
    B1:0,       B2:0,        B3:0,       B4:0,       B5:0,       B6:0,
    os:[{id:"os082",label:"Remplacement têtes + centrale détection",  montant:450000,facture:210000,statut:"cours"}]},
  { id:"sas",   label:"Création sas d'entrée",               sub:"Aménagement · Valorisation",     type:"DEV",
    dateOuverture:2026,
    historique:[],
    budget:0,       os_total:0,      facture:0,
    B1:650000,  B2:0,        B3:0,       B4:0,       B5:0,       B6:0,
    os:[]},
  { id:"vrd",   label:"Réfection VRD & espaces verts",       sub:"Extérieurs · Entretien",         type:"DTQ",
    dateOuverture:2026,
    historique:[],
    budget:175000,  os_total:80000,  facture:30000,
    B1:0,       B2:320000,   B3:0,       B4:0,       B5:0,       B6:0,
    os:[{id:"os083",label:"Reprise voirie + plantations",             montant:80000, facture:30000, statut:"cours"}]},
  { id:"bms",   label:"Déploiement BMS / GTC",               sub:"Smart building · Efficacité",    type:"DEV",
    dateOuverture:2026,
    historique:[],
    budget:0,       os_total:0,      facture:0,
    B1:890000,  B2:430000,   B3:0,       B4:0,       B5:0,       B6:0,
    os:[]},
  { id:"dpe",   label:"Travaux DPE — isolation combles",     sub:"Performance énergétique · RE2020",type:"DTQ",
    dateOuverture:2026,
    historique:[],
    budget:260000,  os_total:120000, facture:60000,
    B1:0,       B2:0,        B3:0,       B4:380000,  B5:0,       B6:0,
    os:[{id:"os084",label:"Isolation combles + remplacement fenêtres", montant:120000,facture:60000, statut:"cours"}]},
];

const TIPS = {
  full:     "Reporter l'intégralité du budget 2026 sur 2027. Disponible uniquement si aucun OS n'a été ouvert sur cette opération.",
  ne:       "Reporter sur 2027 le budget sans OS : solde budgétaire non couvert par un ordre de service (NE = B1 − E).",
  far:      "Reporter sur 2027 les Factures À Recevoir sur OS émis : FAR = E − F. Ces sommes sont juridiquement engagées.",
  nf:       "Reporter sur 2027 le budget non facturé : NF = B1 − F. Inclut les FAR et le solde non engagé.",
  manu:     "Reporter sur 2027 un montant saisi manuellement. Utile pour un arbitrage partiel.",
  conserve: "Saisir le budget complémentaire à conserver en 2026 (hors factures déjà comptabilisées). Le solde restant sera reporté sur 2027.",
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
function InputRowConserve({ facture, budget, onApply, AN }) {
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
function CtxMenu({ a, reports, setReports, setOverrides, toast, AN, disabled }) {
  const [open, setOpen]               = useState(false);
  const [showManu, setShowManu]       = useState(false);
  const [showConserve, setShowConserve] = useState(false);

  const ne  = calcNE(a);
  const far = calcTfar(a);
  const nf  = calcNF(a);
  const bmf = calcBmf(a); // plafond saisie manuelle
  const hasReport = reports[a.id]?.report>0 || a.os.some(o=>reports[o.id]?.report>0) || false;

  const apply = (type, val) => {
    setOpen(false); setShowManu(false); setShowConserve(false);

    // Validation préalable
    if (type==="manu" && (val<=0||val>bmf)) { toast(`Montant invalide. Max : ${fmt(bmf)}.`,"err"); return; }
    if (type==="conserve") { const r=Math.max(0,a.budget-a.facture-val); if(!r){ toast(`Solde = 0.`,"warning"); return; } }

    // Effacer les overrides B1rev et B2rev pour laisser les formules automatiques reprendre
    setOverrides(prev => {
      const next = {...prev};
      if (!next[a.id]) return next;
      const cleaned = {...next[a.id]};
      delete cleaned.B1rev;
      delete cleaned.B2rev;
      if (Object.keys(cleaned).length) next[a.id] = cleaned;
      else delete next[a.id];
      return next;
    });

    // Appliquer le report
    setReports(prev => {
      const next = {...prev};
      if (type==="full")     { next[a.id]={report:a.B1, rt:"full"}; }
      if (type==="ne")      { next[a.id]={report:ne, rt:"ne"}; }
      if (type==="far")     { a.os.forEach(o=>{if(calcFar(o)>0)next[o.id]={report:calcFar(o),rt:"report"};}); next[a.id]={...(next[a.id]||{}),rt:"far"}; }
      if (type==="nf")      { next[a.id]={report:nf, rt:"nf"}; }
      if (type==="manu")    { next[a.id]={report:val,rt:"manu"}; }
      if (type==="conserve"){ const r=Math.max(0,a.budget-a.facture-val); next[a.id]={report:r,rt:"conserve"}; }
      if (type==="reset")   { delete next[a.id]; a.os.forEach(o=>delete next[o.id]); }
      return next;
    });

    // Toasts hors updater
    if (type==="full")     toast(`${a.label} — budget complet ${fmt(a.B1)} reporté sur ${AN(1)}.`,"info");
    if (type==="ne")       toast(`${a.label} — ${fmt(ne)} (non engagé) reportés.`,"warning");
    if (type==="far")      toast(`${a.label} — ${fmt(far)} de FAR reportés.`,"info");
    if (type==="nf")       toast(`${a.label} — ${fmt(nf)} reportés.`,"info");
    if (type==="manu")     toast(`${a.label} — ${fmt(val)} saisis.`,"info");
    if (type==="conserve") { const r=Math.max(0,a.budget-a.facture-val); toast(`${a.label} — ${fmt(val)} conservés, ${fmt(r)} reportés.`,"info"); }
    if (type==="reset")    toast(`${a.label} — report annulé.`,"info");
  };

  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      <button onClick={e=>{e.stopPropagation();if(!disabled)setOpen(o=>!o);}}
        style={{ background:"none", border:"0.5px solid #ddd", borderRadius:6, cursor:disabled?"default":"pointer",
          padding:"3px 7px", fontSize:12, color: disabled?"#ccc":"#888", opacity: disabled?0.4:1 }}>⋮</button>
      {open && (
        <>
          <div onClick={()=>{setOpen(false);setShowManu(false);setShowConserve(false);}}
            style={{ position:"fixed", inset:0, zIndex:9998 }} />
          <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", width:300, background:"#fff",
            border:"0.5px solid #ccc", borderRadius:10, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,.12)" }}>
            <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".07em",
              color:"#999", padding:"8px 12px 4px" }}>{a.label.slice(0,30)}</div>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", padding:"6px 12px 4px", borderTop:"0.5px solid #eee" }}>
              Reporter sur {AN(1)} :
            </div>
            {/* Report complet — grisé si OS ouverts */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"7px 12px",
              fontSize:12, opacity: a.os_total>0 ? 0.4 : 1,
              cursor: a.os_total>0 ? "not-allowed" : "pointer",
              color: a.os_total>0 ? "#999" : "inherit" }}
              onClick={()=>{ if(a.os_total===0) apply("full"); }}
              onMouseEnter={e=>{ if(a.os_total===0) e.currentTarget.style.background="#f5f5f3"; }}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ flex:1, fontWeight:500, lineHeight:1.3 }}>
                Report complet du budget {AN(0)} sur {AN(1)} ({fmt(a.B1)})
                {a.os_total>0 && <div style={{fontSize:10,color:"#bbb",fontWeight:400}}>Non disponible — OS ouverts sur cette opération</div>}
              </div>
              <Tooltip text={TIPS["full"]} />
            </div>
            <hr style={{ border:"none", borderTop:"0.5px solid #eee", margin:"2px 0" }} />
            {a.os_total === 0 ? <>
              {/* Pas d'OS — seulement saisie manuelle en complément */}
              {bmf>0 && <>
                <CtxItem label="Montant saisi manuellement" tipKey="manu" onClick={()=>setShowManu(s=>!s)} />
                {showManu && <InputRow label={`Montant à reporter (€) — max ${fmt(bmf)} :`} max={bmf} onApply={v=>apply("manu",v)} />}
              </>}
            </> : <>
              {/* OS ouverts — actions détaillées */}
              {ne>0  && <CtxItem label={`Budget sans OS — NE (${fmt(ne)})`}           tipKey="ne"  onClick={()=>apply("ne")} />}
              {far>0 && <CtxItem label={`FAR sur OS émis — E−F (${fmt(far)})`}        tipKey="far" onClick={()=>apply("far")} />}
              {nf>0  && <CtxItem label={`Budget non facturé — NF=B1−F (${fmt(nf)})`}  tipKey="nf"  onClick={()=>apply("nf")} />}
              {bmf>0 && <>
                <CtxItem label="Montant saisi manuellement" tipKey="manu" onClick={()=>setShowManu(s=>!s)} />
                {showManu && <InputRow label={`Montant à reporter (€) — max ${fmt(bmf)} :`} max={bmf} onApply={v=>apply("manu",v)} />}
              </>}
              <hr style={{ border:"none", borderTop:"0.5px solid #eee", margin:"2px 0" }} />
              {bmf>0 && <>
                <CtxItem label="Saisir le budget complémentaire à conserver et reporter le solde" tipKey="conserve" onClick={()=>setShowConserve(s=>!s)} />
                {showConserve && <InputRowConserve facture={a.facture} budget={a.budget} onApply={v=>apply("conserve",v)} AN={AN} />}
              </>}
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

function EditCell({id, col, initVal, bbot, editing, overrides, setEditing, setOverrides, reviseValide}) {
  const isEdit      = editing?.id===id && editing?.col===col;
  const hasOverride = overrides[id]?.[col] !== undefined;
  const val         = hasOverride ? overrides[id][col] : null;
  return (
    <td style={{ padding:"4px 8px", borderBottom:bbot, textAlign:"right", verticalAlign:"middle",
      background: hasOverride ? "#fffbe0" : "#fafaf8",
      cursor: reviseValide ? "default" : "pointer", fontSize:13 }}
      title={reviseValide ? "Révisé validé — non modifiable" : "Double-cliquez pour modifier"}
      onDoubleClick={()=>{ if(!reviseValide) setEditing({id,col}); }}>
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
}

const thG = { // style groupe entête
  fontSize:11, fontWeight:600, textAlign:"center", padding:"4px 8px",
  borderBottom:"0.5px solid #eee", borderLeft:"1px solid #ddd", color:"#555"
};

// ─── App ─────────────────────────────────────────────────────────────────────
function ArbitrageModal({ lignes, AN, fmt, onIgnore, onClose, onApply }) {
  const [checked, setChecked] = useState(new Set(lignes.map(l=>l.id+l.annee)));
  const toggle = (key) => setChecked(prev=>{const n=new Set(prev);n.has(key)?n.delete(key):n.add(key);return n;});
  const byYear = {};
  lignes.forEach(l=>{if(!byYear[l.annee])byYear[l.annee]=[];byYear[l.annee].push(l);});
  return (
    <div style={{position:"fixed",inset:0,zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)"}}>
      <div style={{background:"#fff",borderRadius:12,padding:"28px 32px",maxWidth:560,width:"90vw",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#aaa",lineHeight:1}}>✕</button>
        <div style={{fontSize:20,marginBottom:6}}>⚠️ Budgets non arbitrés</div>
        <div style={{fontSize:13,color:"#555",marginBottom:16,lineHeight:1.6}}>
          Les opérations suivantes ont un budget validé pour des années futures mais aucune décision de report ou de révision n'a été prise.<br/>
          <strong>Souhaitez-vous les reprendre au niveau du validé ?</strong>
        </div>
        <div style={{maxHeight:300,overflowY:"auto",marginBottom:20}}>
          {Object.entries(byYear).map(([yr,ligs])=>(
            <div key={yr} style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"#185FA5",marginBottom:6,padding:"2px 0",borderBottom:"0.5px solid #eee"}}>{yr}</div>
              {ligs.map(l=>{
                const key=l.id+l.annee;
                return (
                  <div key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 4px",borderRadius:6,
                    background:checked.has(key)?"#f0f5ff":"transparent",marginBottom:2}}>
                    <input type="checkbox" checked={checked.has(key)} onChange={()=>toggle(key)}
                      style={{width:15,height:15,cursor:"pointer",accentColor:"#185FA5"}} />
                    <span style={{flex:1,fontSize:13,color:"#333"}}>{l.label}</span>
                    <span style={{fontSize:12,fontWeight:600,color:"#185FA5"}}>{fmt(l.montant)}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
          <button onClick={onIgnore}
            style={{padding:"7px 14px",borderRadius:8,border:"1px solid #ddd",background:"#f5f5f5",cursor:"pointer",fontSize:12}}>
            Ignorer et valider quand même
          </button>
          <button onClick={()=>onApply(lignes.filter(l=>checked.has(l.id+l.annee)))}
            style={{padding:"7px 14px",borderRadius:8,border:"1px solid #185FA5",background:"#E6F1FB",color:"#0C447C",cursor:"pointer",fontSize:12,fontWeight:600}}>
            Reprendre les cochées
          </button>
          <button onClick={()=>onApply(lignes)}
            style={{padding:"7px 14px",borderRadius:8,border:"none",background:"#185FA5",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>
            Reprendre toutes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [expanded, setExpanded]   = useState(new Set());
  const [expandedHisto, setExpandedHisto] = useState(new Set());
  const [reports,  setReports]    = useState({});
  const [toastMsg, setToastMsg]   = useState(null);
  const [overrides,setOverrides]  = useState({});
  const [editing,  setEditing]    = useState(null);
  const [comments, setComments]   = useState({});
  const [confirmModal, setConfirmModal] = useState(null);
  const [arbitrageModal, setArbitrageModal] = useState(null); // {lignes: [{id, label, Bx}], year, col}
  const [dateSimu, setDateSimu]   = useState("2026-09-30");
  const [capexData, setCapexData] = useState(CAPEX_DATA); // données modifiables
  const [reviseValide, setReviseValide] = useState(false); // révisé figé ?
  const theadRef = useRef(null);

  useEffect(() => {
    const applySticky = () => {
      if (!theadRef.current) return;
      const rows = theadRef.current.querySelectorAll("tr");
      let top = 0;
      rows.forEach(row => {
        row.querySelectorAll("th").forEach(th => {
          th.style.position = "sticky";
          th.style.top = top + "px";
          th.style.zIndex = "20";
          th.style.background = th.style.background || "inherit";
        });
        top += row.getBoundingClientRect().height;
      });
    };
    const raf = requestAnimationFrame(applySticky);
    window.addEventListener("resize", applySticky);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", applySticky); };
  });

  const anneeRef = new Date(dateSimu).getFullYear() || 2026;
  const AN = (n) => anneeRef + n;

  // Coefficient d'avancement dans l'année (0 = 1er jan, 1 = 31 déc)
  const simDate   = new Date(dateSimu);
  const simMois   = simDate.getMonth(); // 0-11
  const simJour   = simDate.getDate();
  const avancement = Math.min(1, Math.max(0, (simMois * 30 + simJour) / 365));

  // Données simulées : E et F évoluent avec l'avancement si on est dans l'année courante
  const simData = capexData.map(a => ({
    ...a,
    os_total: Math.round(a.os_total * (avancement < 0.05 ? 0.05 : avancement) / 1) ,
    facture:  Math.round(a.facture  * (avancement < 0.05 ? 0.05 : avancement) / 1),
    os: a.os.map(o => ({
      ...o,
      montant: Math.round(o.montant * (avancement < 0.05 ? 0.05 : avancement)),
      facture: Math.round(o.facture  * (avancement < 0.05 ? 0.05 : avancement)),
    }))
  }));

  const toast = (msg,type) => { setToastMsg({msg,type}); setTimeout(()=>setToastMsg(null),4000); };
  const toggleExpand = id => setExpanded(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  // Totaux
  const totBudget  = capexData.reduce((s,a)=>s+a.budget,0);
  const totOS      = simData.reduce((s,a)=>s+a.os_total,0);
  const totFac     = simData.reduce((s,a)=>s+a.facture,0);
  const totFAR     = simData.reduce((s,a)=>s+calcTfar(a),0);
  const totNE      = simData.reduce((s,a)=>s+calcNE(a),0);
  const totNF      = simData.reduce((s,a)=>s+calcNF(a),0);
  const totReport  = capexData.reduce((s,a)=>s+calcTotalReport(a,reports),0);
  const totB1init  = capexData.reduce((s,a)=>s+a.B1,0);
  const totB1rev   = capexData.reduce((s,a)=>{
    const rep=calcTotalReport(a,reports); const ovr=overrides[a.id]?.B1rev;
    if(ovr!==undefined) return s+ovr;
    if(rep>0) return s+(a.B1-rep);
    return s; // pas de révision → ne contribue pas au total révisé
  },0);
  const totB2init  = capexData.reduce((s,a)=>s+a.B2,0);
  const totB2rev   = capexData.reduce((s,a)=>{
    const rep=calcTotalReport(a,reports); const ovr=overrides[a.id]?.B2rev;
    if(ovr!==undefined && ovr!==a.B2) return s+ovr; // override manuel réel
    if(rep>0) return s+(a.B2+rep); // report actif
    return s; // pas de révision → ne contribue pas au total révisé
  },0);
  const totB3init  = capexData.reduce((s,a)=>s+a.B3,0);
  const totB3rev   = capexData.reduce((s,a)=>overrides[a.id]?.B3rev!==undefined&&overrides[a.id].B3rev!==a.B3 ? s+overrides[a.id].B3rev : s, 0);
  const totB4init  = capexData.reduce((s,a)=>s+a.B4,0);
  const totB4rev   = capexData.reduce((s,a)=>overrides[a.id]?.B4rev!==undefined&&overrides[a.id].B4rev!==a.B4 ? s+overrides[a.id].B4rev : s, 0);
  const totB5init  = capexData.reduce((s,a)=>s+a.B5,0);
  const totB5rev   = capexData.reduce((s,a)=>overrides[a.id]?.B5rev!==undefined&&overrides[a.id].B5rev!==a.B5 ? s+overrides[a.id].B5rev : s, 0);
  const totB6init  = capexData.reduce((s,a)=>s+a.B6,0);
  const totB6rev   = capexData.reduce((s,a)=>overrides[a.id]?.B6rev!==undefined&&overrides[a.id].B6rev!==a.B6 ? s+overrides[a.id].B6rev : s, 0);
  const totInitial = totB1init+totB2init+totB3init+totB4init+totB5init+totB6init;
  // Total révisé = initial des lignes non révisées + révisé des lignes révisées
  const totRevise  = totB1rev+totB2rev+totB3rev+totB4rev+totB5rev+totB6rev;
  const hasAnyRev  = totReport>0 || capexData.some(a=>overrides[a.id] && Object.keys(overrides[a.id]).some(k=>k.endsWith("rev")));

  const toastColors = { info:"#0C447C|#E6F1FB|#B5D4F4", warning:"#633806|#FAEEDA|#FAC775", success:"#27500A|#EAF3DE|#C0DD97", err:"#791F1F|#FCEBEB|#F7C1C1" };
  const thS = { fontSize:11, fontWeight:500, color:"#888", padding:"3px 8px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap", lineHeight:"1.2" };

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding:"1rem 2rem", color:"#1a1a18" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:500 }}>Suivi budgétaire des opérations CAPEX</div>
          <div style={{ fontSize:13, color:"#888", marginTop:2 }}>
            Situation au {new Date(dateSimu).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})} · 12 opérations · Budget construit fin {AN(0)-1}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f5f5f0", border:"0.5px solid #ddd", borderRadius:8, padding:"6px 12px" }}>
            <span style={{ fontSize:12, color:"#888", whiteSpace:"nowrap" }}>📅 Date de simulation</span>
            <input type="date" value={dateSimu} onChange={e=>{
                if(e.target.value) {
                  setDateSimu(e.target.value);
                  // Reset reports et overrides si l'année change
                  const newYear = new Date(e.target.value).getFullYear();
                  if(newYear !== anneeRef) {
                    setReports({});
                    setOverrides({});
                    toast(`Année de simulation basculée sur ${newYear} — données réinitialisées.`,"info");
                  }
                }
              }}
              style={{ fontSize:13, border:"none", background:"transparent", cursor:"pointer", outline:"none", color:"#333" }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            {/* Bouton Valider le révisé */}
            <button
              onClick={()=>{
                if(reviseValide){ toast("Le révisé est déjà validé.","warning"); return; }
                // Chercher les lignes avec budget futur non arbitré pour chaque année
                const nonArbitrees = [];
                for(let i=1;i<=5;i++){
                  const bKey = `B${i+1}`;
                  const bRevKey = `B${i+1}rev`;
                  capexData.forEach(a=>{
                    if(a[bKey]>0){
                      const ovr = overrides[a.id]?.[bRevKey];
                      const rep = i===1 ? calcTotalReport(a,reports) : 0;
                      // Considéré arbitré si : override présent (quelle que soit la valeur) OU report actif sur N+1
                      const hasRev = ovr !== undefined || rep > 0;
                      if(!hasRev) nonArbitrees.push({id:a.id, label:a.label, annee:AN(i), bKey, bRevKey, montant:a[bKey]});
                    }
                  });
                }
                if(nonArbitrees.length>0){
                  setArbitrageModal({lignes:nonArbitrees});
                } else {
                  setConfirmModal({
                    msg:`Valider le révisé ${AN(0)} ? Les colonnes Révisé seront figées.`,
                    onConfirm:()=>{ setReviseValide(true); toast(`Révisé ${AN(0)} validé et figé.`,"success"); }
                  });
                }
              }}
              style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
                border: reviseValide?"1px solid #3A7A4A":"1px solid #185FA5",
                background: reviseValide?"#EAF3DE":"#E6F1FB",
                color: reviseValide?"#27500A":"#0C447C"}}>
              {reviseValide ? "✓ Révisé validé" : `Valider le révisé ${AN(0)}`}
            </button>

            {/* Bouton Clôturer l'exercice */}
            <button
              onClick={()=>{
                if(!reviseValide){ toast("Veuillez d'abord valider le révisé avant de clôturer l'exercice.","err"); return; }
                setConfirmModal({
                  msg:`Clôturer l'exercice ${AN(0)} et basculer en ${AN(1)} ?\n\n• Le révisé ${AN(1)} deviendra le budget validé ${AN(1)}\n• E et F seront remis à 0\n• L'historique ${AN(0)} sera archivé`,
                  onConfirm:()=>{
                    setCapexData(prev => prev.map(a => {
                      const rep = calcTotalReport(a, reports);
                      // B2' = override si différent du validé, sinon B2 + report si report actif
                      const getB = (n) => {
                        const ovr = overrides[a.id]?.[`B${n}rev`];
                        const init = a[`B${n}`];
                        // Si override = valeur initiale (set par ↺), on ignore et applique la formule
                        if (ovr !== undefined && ovr !== init) return ovr;
                        if (n === 2 && rep > 0) return init + rep;
                        return init;
                      };
                      const newB1 = getB(2);
                      const newB2 = getB(3);
                      const newB3 = getB(4);
                      const newB4 = getB(5);
                      const newB5 = getB(6);
                      const newB6 = 0;
                      // Archiver l'année en cours dans l'historique
                      const newHisto = [...(a.historique||[]), {
                        annee: AN(0),
                        B1: a.B1,
                        os_total: a.os_total,
                        facture: a.facture,
                      }];
                      return {
                        ...a,
                        historique: newHisto,
                        budget: 0,      // E et F remis à 0
                        os_total: 0,
                        facture: 0,
                        B1: newB1,
                        B2: newB2,
                        B3: newB3,
                        B4: newB4,
                        B5: newB5,
                        B6: newB6,
                        os: a.os.map(o=>({...o, montant:0, facture:0, statut:"cours"})),
                      };
                    }));
                    // Basculer l'année
                    const newDate = `${AN(1)}-01-01`;
                    setDateSimu(newDate);
                    // Reset states
                    setReports({});
                    setOverrides({});
                    setReviseValide(false);
                    setExpanded(new Set());
                    toast(`Exercice ${AN(0)} clôturé — bienvenue en ${AN(1)} !`,"success");
                  }
                });
              }}
              style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
                border:"1px solid #8a4020",background:"#fff3e8",color:"#8a4020",
                opacity: reviseValide ? 1 : 0.5}}>
              Clôturer l'exercice {AN(0)} →
            </button>
          </div>
          <span style={{ fontSize:11, background:"#f0efe9", border:"0.5px solid #ddd", borderRadius:20, padding:"3px 10px", color:"#888" }}>Démo SNK</span>
        </div>
      </div>

      {arbitrageModal && <ArbitrageModal
        lignes={arbitrageModal.lignes}
        AN={AN}
        fmt={fmt}
        onClose={()=>setArbitrageModal(null)}
        onIgnore={()=>{setArbitrageModal(null);setReviseValide(true);toast(`Révisé ${AN(0)} validé et figé.`,"success");}}
        onApply={(lignes)=>{
          setOverrides(prev=>{
            const next={...prev};
            lignes.forEach(l=>{next[l.id]={...(next[l.id]||{}),[l.bRevKey]:l.montant};});
            return next;
          });
          setArbitrageModal(null);
          setReviseValide(true);
          toast(`Révisé ${AN(0)} validé et figé.`,"success");
        }}
      />}

      {confirmModal && (
        <div style={{position:"fixed",inset:0,zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.35)"}}>
          <div style={{background:"#fff",borderRadius:12,padding:"28px 32px",maxWidth:420,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:14,color:"#333",lineHeight:1.6,marginBottom:24}}>{confirmModal.msg}</div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button onClick={()=>setConfirmModal(null)}
                style={{padding:"8px 24px",borderRadius:8,border:"1px solid #ddd",background:"#f5f5f5",cursor:"pointer",fontSize:13}}>Annuler</button>
              <button onClick={()=>{confirmModal.onConfirm();setConfirmModal(null);}}
                style={{padding:"8px 24px",borderRadius:8,border:"none",background:"#185FA5",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>OK</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (() => {
        const [c,bg,bc]=(toastColors[toastMsg.type]||toastColors.info).split("|");
        return <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",borderRadius:8,fontSize:12,marginBottom:12,border:`0.5px solid ${bc}`,background:bg,color:c}}>{toastMsg.msg}</div>;
      })()}

      <style>{`
        .capex-table { border-collapse: separate; border-spacing: 0; }
        .capex-table td, .capex-table th { border-bottom: 0.5px solid #eee; }
        .capex-table tbody tr.capex-sticky-total td { position: sticky; bottom: 0; z-index: 9; }
      `}</style>
      <div style={{ background:"#fff", border:"0.5px solid #eee", borderRadius:12, overflowX:"auto", overflowY:"auto", maxHeight:"75vh" }}>
        <table className="capex-table" style={{ width:"100%", fontSize:13, minWidth:1800 }}>
          <thead ref={theadRef}>
            {/* Ligne 1 : groupes année */}
            <tr style={{ background:"#2a5a8a", color:"#fff", textAlign:"center" }}>
              <th colSpan={3} style={{ ...thG, color:"#fff", background:"#1a1a18", borderLeft:"none", textAlign:"left", paddingLeft:12 }}>Identification</th>
              <th colSpan={2} style={{ ...thG, color:"#fff", background:"#2a2a26", borderLeft:"1px solid #444", borderRight:"1px solid #444" }}>Total {AN(0)}→{AN(5)}</th>
              <th colSpan={7} style={{ ...thG, color:"#fff", background:"#2a5a8a", borderLeft:"1px solid #d0d8e8" }}>{AN(0)}</th>
              {[1,2,3,4,5].map(i => (
                <th key={i} colSpan={2} style={{ ...thG, color:"#fff", background:"#1e3a5a", borderLeft:"1px solid #d0d8e8" }}>{AN(i)}</th>
              ))}
              <th style={{ ...thG, color:"#fff", background:"#1a1a18", borderLeft:"1px solid #e0e0e0" }}>Commentaire</th>
            </tr>
            {/* Ligne 2 : sous-groupes */}
            <tr style={{ background:"#e8eff8", textAlign:"center" }}>
              <th colSpan={3} style={{ ...thG, color:"#555", background:"#f0f0ee", borderLeft:"none" }}></th>
              <th colSpan={2} style={{ ...thG, color:"#555", background:"#f0f0e4", borderLeft:"1px solid #444", borderRight:"1px solid #444", fontSize:11 }}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,flexWrap:"wrap"}}>
                  <span>Budget pluriannuel</span>
                  <button
                    onClick={()=>{
                      if(reviseValide){ toast("Le révisé est validé — actions bloquées.","warning"); return; }
                      setConfirmModal({
                        msg:`Remettre tous les budgets révisés (${AN(2)}→${AN(5)}) au niveau du budget validé pour toutes les lignes ?`,
                        onConfirm:()=>{
                          setOverrides(prev=>{
                            const next = {...prev};
                            for(const a of capexData){
                              for(let j=2;j<=5;j++){
                                const bRevKey=`B${j+1}rev`;
                                next[a.id]={...(next[a.id]||{}),[bRevKey]:a[`B${j+1}`]};
                              }
                            }
                            return {...next};
                          });
                          toast(`Tous les budgets révisés ${AN(2)}→${AN(5)} remis au niveau du validé.`,"success");
                        }
                      });
                    }}
                    style={{fontSize:9,padding:"1px 6px",borderRadius:5,
                      border: reviseValide?"1px solid #ccc":"1px solid #aabbd0",
                      background: reviseValide?"#f5f5f5":"#f0f5ff",
                      color: reviseValide?"#ccc":"#2a5a8a",
                      cursor: reviseValide?"default":"pointer",
                      fontWeight:600,whiteSpace:"nowrap",opacity:reviseValide?0.5:1}}>
                    ↺ Tout au validé
                  </button>
                </div>
              </th>
              <th colSpan={2} style={{ ...thG, color:"#555", background:"#e8eff8", borderLeft:"1px solid #d0d8e8", fontSize:11 }}>Budget</th>
              <th colSpan={2} style={{ ...thG, color:"#3A7A4A", background:"#e0f0e8", borderLeft:"1px solid #b0d8b8", fontSize:11 }}>Engagé / Facturé {AN(0)} (EVEN)</th>
              <th colSpan={3} style={{ ...thG, color:"#8a4020", background:"#f8e8d8", borderLeft:"1px solid #d8b898", fontSize:11 }}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span>Reports possibles sur {AN(0)}</span>
                  <button
                    onClick={()=>{
                      if(reviseValide){ toast("Le révisé est validé — actions de report bloquées.","warning"); return; }
                      setConfirmModal({
                      msg:`Appliquer sur toutes les lignes le report du Budget non facturé (B1 − Facturé) sur ${AN(1)} ? Cette action écrasera les reports existants.`,
                      onConfirm:()=>{
                        setReports(prev=>{
                          const next={...prev};
                          capexData.forEach(a=>{
                            const nf=calcNF(a);
                            if(nf>0) next[a.id]={report:nf,rt:"nf"};
                          });
                          return next;
                        });
                        setOverrides(prev=>{
                          const next={...prev};
                          capexData.forEach(a=>{
                            if(next[a.id]?.B1rev!==undefined){
                              const {B1rev,...rest}=next[a.id];
                              if(Object.keys(rest).length) next[a.id]=rest;
                              else delete next[a.id];
                            }
                          });
                          return next;
                        });
                      }
                    });}}                    style={{fontSize:10,padding:"2px 8px",borderRadius:6,
                      border: reviseValide?"1px solid #ccc":"1px solid #c08050",
                      background: reviseValide?"#f5f5f5":"#fff3e8",
                      color: reviseValide?"#ccc":"#8a4020",
                      cursor: reviseValide?"default":"pointer",fontWeight:600,whiteSpace:"nowrap",
                      opacity: reviseValide?0.5:1}}>
                    ⚡ Tout reporter B1−F
                  </button>
                </div>
              </th>
              {/* Bouton global ↺ dans le header Budget pluriannuel */}
              {[1,2,3,4,5].map(i => {
                const col = `B${i+1}rev`;
                const yr = AN(i);
                const handleReset = () => {
                  if(reviseValide){ toast("Le révisé est validé — actions bloquées.","warning"); return; }
                  const targetYr = AN(i);
                  const bKey = `B${i+1}`;
                  const bRevKey = `B${i+1}rev`;
                  setConfirmModal({
                    msg:`Remettre le budget révisé ${targetYr} au niveau du budget validé pour toutes les lignes ?`,
                    onConfirm:()=>{
                      setOverrides(prev => {
                        const next = {...prev};
                        for (const a of capexData) {
                          const val = a[bKey]; // nombre ex: 400000
                          next[a.id] = { ...(next[a.id] || {}), [bRevKey]: val };
                        }
                        return {...next}; // forcer nouvelle référence
                      });
                      toast(`Budget révisé ${targetYr} remis au niveau du validé.`, "success");
                    }
                  });
                };
                return (
                  <th key={i} colSpan={2} style={{ ...thG, color:"#555", background:"#e8eff8", borderLeft:"1px solid #d0d8e8", fontSize:11 }}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <span>Budget</span>
                      <button onClick={handleReset}
                        style={{fontSize:9,padding:"1px 6px",borderRadius:5,
                          border: reviseValide?"1px solid #ccc":"1px solid #aabbd0",
                          background: reviseValide?"#f5f5f5":"#f0f5ff",
                          color: reviseValide?"#ccc":"#2a5a8a",
                          cursor: reviseValide?"default":"pointer",
                          fontWeight:600,whiteSpace:"nowrap",opacity:reviseValide?0.5:1}}>
                        ↺ Validé
                      </button>
                    </div>
                  </th>
                );
              })}
              <th style={{ ...thG, color:"#555", background:"#f0f0ee", borderLeft:"1px solid #e0e0e0" }}></th>
            </tr>
            {/* Ligne 3 : colonnes */}
            <tr style={{ background:"#f5f5f0" }}>
              <th style={{ ...thS, width:32 }}></th>
              <th style={{ ...thS, minWidth:180 }}>Opération / OS</th>
              <th style={{ ...thS, width:58 }}>Clé</th>
              {/* Total pluriannuel */}
              <th style={{ ...thS, textAlign:"right", width:110, borderLeft:"1px solid #444" }}>
                <span style={{ color:"#bbb", fontSize:10 }}>B1+…+B6</span><br/>Validé
              </th>
              <th style={{ ...thS, textAlign:"right", width:110, background:"#fffbe0", borderRight:"1px solid #444" }}>
                <span style={{ color:"#c08030", fontSize:10 }}>B1'+…+B6'</span><br/><span style={{color:"#c08030"}}>Révisé</span>
              </th>
              {/* 2026 — Budget */}
              <th style={{ ...thS, textAlign:"right", width:100, borderLeft:"1px solid #d0d8e8" }}>
                <span style={{ color:"#bbb", fontSize:10 }}>B1</span><br/>Validé
              </th>
              <th style={{ ...thS, textAlign:"right", width:110, background:"#fffbe0" }}>
                <span style={{ color:"#c08030", fontSize:10 }}>B1'=B1−report</span><br/><span style={{color:"#c08030"}}>Révisé</span>
                <div style={{fontSize:9,color:"#bbb",fontWeight:400}}>✎ double-clic</div>
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
                      <div style={{fontSize:9,color:"#bbb",fontWeight:400}}>✎ double-clic</div>
                    </th>
                  </>
                );
              })}
              <th style={{ ...thS, width:200, borderLeft:"1px solid #e0e0e0" }}>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {simData.map((a, ai) => {
              const totalRep = calcTotalReport(a, reports);
              const rep      = reports[a.id];
              const ne       = calcNE(a);
              const far      = calcTfar(a);
              const nf       = calcNF(a);
              const B1rev    = overrides[a.id]?.B1rev ?? (totalRep > 0 ? a.B1 - totalRep : null);
              const B2rev    = overrides[a.id]?.B2rev ?? (totalRep > 0 ? a.B2 + totalRep : null);
              const B3rev    = overrides[a.id]?.B3rev ?? null;
              const B4rev    = overrides[a.id]?.B4rev ?? null;
              const B5rev    = overrides[a.id]?.B5rev ?? null;
              const B6rev    = overrides[a.id]?.B6rev ?? null;
              const totalInit = a.B1+a.B2+a.B3+a.B4+a.B5+a.B6;
              const totalRev  = (B1rev??a.B1) + (B2rev??a.B2) + (overrides[a.id]?.B3rev??a.B3) + (overrides[a.id]?.B4rev??a.B4) + (overrides[a.id]?.B5rev??a.B5) + (overrides[a.id]?.B6rev??a.B6);
              const hasRowRev = calcTotalReport(a,reports)>0 || (overrides[a.id] && Object.keys(overrides[a.id]).some(k=>k.endsWith("rev")));
              const isLast   = ai===simData.length-1;
              const bbot     = isLast&&!expanded.has(a.id)?"none":"0.5px solid #eee";
              const rt = rep?.rt;
              const rtLabels = {far:"FAR",ne:"NE",nf:"NF",manu:"MANUEL",conserve:"SOLDE",full:"COMPLET"};
              const rtColors = {far:"#27500A|#EAF3DE",ne:"#854F0B|#FAEEDA",nf:"#5C3D00|#FEF0D0",manu:"#0C447C|#E6F1FB",conserve:"#0C447C|#E6F1FB",full:"#3a0a6e|#ede0ff"};
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
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:4}}>
                      <div>
                        <strong>{a.label}</strong><br/>
                        <span style={{color:"#aaa",fontSize:11}}>{a.sub}</span><br/>
                        <span style={{color:"#bbb",fontSize:10}}>depuis {a.dateOuverture}</span>
                      </div>
                      {a.historique?.length > 0 && (
                        <button onClick={()=>setExpandedHisto(prev=>{const n=new Set(prev);n.has(a.id)?n.delete(a.id):n.add(a.id);return n;})}
                          style={{background:"none",border:"0.5px solid #c0c8e0",borderRadius:4,cursor:"pointer",
                            padding:"1px 5px",fontSize:10,color:"#7090CC",whiteSpace:"nowrap",flexShrink:0,marginTop:2}}>
                          {expandedHisto.has(a.id)?"▲ Histo":"▼ Histo"} ({a.historique.length})
                        </button>
                      )}
                    </div>
                  </TD>
                  {/* Clé */}
                  <TD style={{borderBottom:bbot}}>
                    <span style={{display:"inline-block",fontSize:11,padding:"2px 6px",borderRadius:4,fontWeight:500,
                      background:a.type==="DTQ"?"#E6F1FB":"#EEEDFE",color:a.type==="DTQ"?"#0C447C":"#3C3489"}}>{a.type}</span>
                  </TD>
                  {/* Total validé */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #444",color:"#555",fontWeight:500}}>
                    {fmt(totalInit)}
                  </td>
                  {/* Total révisé */}
                  <td style={{textAlign:"right",padding:"4px 10px",borderBottom:bbot,borderRight:"1px solid #444",
                    background: hasRowRev ? "#fffbe0" : "#fafaf8",
                    color: hasRowRev ? "#b05000" : "#ccc", fontWeight: hasRowRev ? 600 : 400}}>
                    {hasRowRev ? fmt(totalRev) : <span style={{color:"#ccc"}}>—</span>}
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
                    const f = a.facture;
                    const farVal = calcTfar(a);
                    const neVal  = calcNE(a);
                    // Détail de composition selon l'action
                    const detail = () => {
                      if (hasOverride) return <span style={{fontSize:9,color:"#c08030"}}>✎ saisi manuellement</span>;
                      if (rt==="full")     return <span style={{fontSize:10,color:"#7090CC"}}>Budget complet reporté sur {AN(1)}</span>;
                      if (rt==="far")     return <span style={{fontSize:10,color:"#7090CC"}}>Facturé {fmt(f)} + Non engagé {fmt(neVal)}</span>;
                      if (rt==="ne")      return <span style={{fontSize:10,color:"#7090CC"}}>Facturé {fmt(f)} + FAR {fmt(farVal)}</span>;
                      if (rt==="manu")    return <span style={{fontSize:10,color:"#7090CC"}}>Facturé {fmt(f)} + reste {fmt(B1rev-f)}</span>;
                      if (rt==="conserve"){ const conserve=B1rev-f; return <span style={{fontSize:10,color:"#7090CC"}}>Facturé {fmt(f)} + conservé {fmt(conserve)}</span>; }
                      return null;
                    };
                    return (
                      <td style={{textAlign:"right",padding:"4px 10px",borderBottom:bbot,
                        background: isActive ? "#fffbe0" : "#fffef5",
                        cursor: reviseValide ? "default" : "pointer", fontWeight: isActive ? 600 : 400 }}
                        title={reviseValide ? "Révisé validé — non modifiable" : "Double-cliquez pour modifier — valeur de départ = Budget validé"}
                        onDoubleClick={()=>{ if(!reviseValide) setEditing({id:a.id,col:"B1rev"}); }}>
                        {isB1RevEdit
                          ? <input autoFocus type="number" defaultValue={displayVal ?? a.B1}
                              onBlur={e=>{
                                const v=parseFloat(e.target.value);
                                if(!isNaN(v)){
                                  const totalInitRow = a.B1+a.B2+a.B3+a.B4+a.B5+a.B6;
                                  const newTotalRev  = v + (overrides[a.id]?.B2rev??a.B2) + (overrides[a.id]?.B3rev??a.B3) + (overrides[a.id]?.B4rev??a.B4) + (overrides[a.id]?.B5rev??a.B5) + (overrides[a.id]?.B6rev??a.B6);
                                  if(newTotalRev > totalInitRow){
                                    setEditing(null);
                                    setConfirmModal({
                                      msg:`Le total du budget révisé (${fmt(newTotalRev)}) est supérieur au budget initial (${fmt(totalInitRow)}) ; confirmez-vous la saisie ?`,
                                      onConfirm:()=>setOverrides(p=>({...p,[a.id]:{...p[a.id],B1rev:v}}))
                                    });
                                  } else {
                                    setOverrides(p=>({...p,[a.id]:{...p[a.id],B1rev:v}}));
                                    setEditing(null);
                                  }
                                } else { setEditing(null); }
                              }}
                              onKeyDown={e=>{if(e.key==="Enter")e.target.blur();if(e.key==="Escape")setEditing(null);}}
                              style={{width:72,textAlign:"right",fontSize:12,padding:"2px 4px",border:"1px solid #185FA5",borderRadius:4,outline:"none"}} />
                          : isActive
                            ? <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:4}}
                                onMouseEnter={e=>e.currentTarget.querySelector(".capex-tip")?.style&&(e.currentTarget.querySelector(".capex-tip").style.display="block")}
                                onMouseLeave={e=>e.currentTarget.querySelector(".capex-tip")?.style&&(e.currentTarget.querySelector(".capex-tip").style.display="none")}>
                                <span style={{color:"#b05000",fontWeight:600}}>{fmt(displayVal)}</span>
                                {detail() && <>
                                  <span style={{fontSize:11,color:"#c08030",cursor:"default"}}>ⓘ</span>
                                  <div className="capex-tip" style={{display:"none",position:"absolute",right:"calc(100% + 6px)",top:"50%",transform:"translateY(-50%)",
                                    width:220,background:"#fff",border:"0.5px solid #ddd",borderRadius:8,padding:"8px 10px",
                                    fontSize:11,color:"#555",lineHeight:1.5,zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,.1)",whiteSpace:"normal",textAlign:"left"}}>
                                    {detail()}
                                  </div>
                                </>}
                              </div>
                            : <span style={{color:"#ccc",fontSize:11}}>= {fmt(a.B1)}</span>}
                      </td>
                    );
                  })()}
                  {/* OS engagés */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #b0d8b8",background:"#F0F7F2",color:"#185FA5"}}>
                    {fmt(a.os_total)}
                  </td>
                  {/* Facturé */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,background:"#F0F7F2"}}>
                    {fmt(a.facture)}
                  </td>
                  {/* FAR */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #d8b898",background:"#fdf5ee"}}>
                    {far>0?fmt(far):<span style={{color:"#ccc"}}>—</span>}
                  </td>
                  {/* Non engagé */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,background:"#fdf5ee"}}>
                    {ne>0?fmt(ne):<span style={{color:"#ccc"}}>0 €</span>}
                  </td>
                  {/* Non facturé + menu ⋮ */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,verticalAlign:"middle"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}}>
                      <span>{nf>0?fmt(nf):<span style={{color:"#ccc"}}>—</span>}</span>
                      <CtxMenu a={a} reports={reports} setReports={setReports} setOverrides={setOverrides} toast={toast} AN={AN} disabled={reviseValide} />
                    </div>
                  </td>
                  {/* B2 à B5 initial + révisé */}
                  {[["B2","B2rev"],["B3","B3rev"],["B4","B4rev"],["B5","B5rev"],["B6","B6rev"]].map(([init,col],i)=>{
                    const autoVal = col==="B2rev" && totalRep>0 ? a[init]+totalRep : null;
                    const hasOvr  = overrides[a.id]?.[col] !== undefined;
                    const dispVal = hasOvr ? overrides[a.id][col] : autoVal;
                    const isEdit  = editing?.id===a.id && editing?.col===col;
                    return (
                      <>
                        <td key={init} style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #ddd",color:"#888"}}>
                          {a[init]>0?fmt(a[init]):<span style={{color:"#ccc"}}>—</span>}
                        </td>
                        <td key={col} style={{padding:"4px 8px",borderBottom:bbot,textAlign:"right",verticalAlign:"middle",
                          background:dispVal!==null?"#fffbe0":"#fffef5",
                          cursor: reviseValide ? "default" : "text", fontSize:13}}
                          title={reviseValide ? "Révisé validé — non modifiable" : "Double-cliquez pour modifier — valeur de départ = Budget validé"}
                          onDoubleClick={()=>{ if(!reviseValide) setEditing({id:a.id,col}); }}>
                          {isEdit
                            ? <input autoFocus type="number" defaultValue={dispVal??a[init]}
                                onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){const tot0=a.B1+a.B2+a.B3+a.B4+a.B5+a.B6;const cur=overrides[a.id]||{};const nr=(cur.B1rev??a.B1)+(col==="B2rev"?v:(cur.B2rev??a.B2))+(col==="B3rev"?v:(cur.B3rev??a.B3))+(col==="B4rev"?v:(cur.B4rev??a.B4))+(col==="B5rev"?v:(cur.B5rev??a.B5))+(col==="B6rev"?v:(cur.B6rev??a.B6));if(nr>tot0){setEditing(null);setConfirmModal({msg:`Le total du budget révisé (${fmt(nr)}) est supérieur au budget initial (${fmt(tot0)}) ; confirmez-vous la saisie ?`,onConfirm:()=>setOverrides(p=>({...p,[a.id]:{...p[a.id],[col]:v}}))});}else{setOverrides(p=>({...p,[a.id]:{...p[a.id],[col]:v}}));setEditing(null);}}else setEditing(null);}}
                                onKeyDown={e=>{if(e.key==="Enter")e.target.blur();if(e.key==="Escape")setEditing(null);}}
                                style={{width:72,textAlign:"right",fontSize:12,padding:"2px 4px",border:"1px solid #185FA5",borderRadius:4,outline:"none"}} />
                            : dispVal!==null
                              ? <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:4}}
                                  onMouseEnter={e=>e.currentTarget.querySelector(".capex-tip")?.style&&(e.currentTarget.querySelector(".capex-tip").style.display="block")}
                                  onMouseLeave={e=>e.currentTarget.querySelector(".capex-tip")?.style&&(e.currentTarget.querySelector(".capex-tip").style.display="none")}>
                                  <span style={{color:"#b05000",fontWeight:600}}>{fmt(dispVal)}</span>
                                  {!hasOvr && col==="B2rev" && totalRep>0 && <>
                                    <span style={{fontSize:11,color:"#c08030",cursor:"default"}}>ⓘ</span>
                                    <div className="capex-tip" style={{display:"none",position:"absolute",right:"calc(100% + 6px)",top:"50%",transform:"translateY(-50%)",
                                      width:200,background:"#fff",border:"0.5px solid #ddd",borderRadius:8,padding:"8px 10px",
                                      fontSize:11,color:"#555",lineHeight:1.5,zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,.1)",whiteSpace:"normal",textAlign:"left"}}>
                                      Budget validé {fmt(a[init])} + report {fmt(totalRep)}
                                    </div>
                                  </>}
                                  {hasOvr && <span style={{fontSize:9,color:"#c08030"}}>✎</span>}
                                </div>
                              : <span style={{color:"#ccc",fontSize:11}}>= {a[init]>0?fmt(a[init]):"—"}</span>}
                        </td>
                      </>
                    );
                  })}
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
                      {/* chevron */}
                      <td style={{padding:"6px 10px",borderBottom:bsep}}></td>
                      {/* Opération */}
                      <td style={{padding:"6px 10px",borderBottom:bsep,fontSize:12}}>
                        <span style={{color:"#ccc",marginRight:4}}>↳</span>
                        <strong>{o.id.toUpperCase()}</strong>
                        <span style={{display:"inline-block",fontSize:10,padding:"1px 6px",borderRadius:3,marginLeft:6,
                          background:statBadge.bg,color:statBadge.c,fontWeight:600}}>{statBadge.l}</span>
                        <br/><span style={{color:"#aaa",fontSize:11}}>{o.label}</span>
                      </td>
                      {/* Clé */}
                      <td style={{padding:"6px 10px",borderBottom:bsep}}></td>
                      {/* Total validé/révisé — vide pour OS */}
                      {td(null,{borderLeft:"1px solid #444"})}
                      {td(null,{background:"#fafaf8",borderRight:"1px solid #444"})}
                      {/* B1 Validé */}
                      {td(null,{borderLeft:"1px solid #ddd"})}
                      {/* B1 Révisé — affiche le report si OS a un report */}
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,background:"#fafaf8"}}>
                        {oRep?.report>0?<span style={{color:"#185FA5",fontWeight:600}}>+{fmt(oRep.report)}</span>:<span style={{color:"#ccc"}}>—</span>}
                      </td>
                      {/* E OS engagés */}
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,background:"#F0F7F2",borderLeft:"1px solid #b0d8b8",color:"#185FA5",fontSize:12}}>{fmt(o.montant)}</td>
                      {/* F Facturé */}
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,background:"#F0F7F2",fontSize:12}}>{fmt(o.facture)}</td>
                      {/* FAR */}
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,borderLeft:"1px solid #d8b898",background:"#fdf5ee",fontSize:12}}>
                        {f>0?<strong style={{color:"inherit"}}>{fmt(f)}</strong>:<span style={{color:"#ccc"}}>—</span>}
                      </td>
                      {/* NE */}
                      {td(null,{background:"#fdf5ee"})}
                      {/* NF */}
                      {td(null,{background:"#fdf5ee"})}
                      {/* B2→B6 Validé + Révisé */}
                      {["B2","B3","B4","B5","B6"].map(b=><>{td(null,{borderLeft:"1px solid #ddd"})}{td(null,{background:"#fafaf8"})}</>)}
                      {/* Commentaire */}
                      <td style={{borderBottom:bsep,borderLeft:"1px solid #ddd"}}></td>
                    </tr>
                  );
                }) : []),

                // Lignes historique
                ...(expandedHisto.has(a.id) && a.historique?.length > 0 ? a.historique.map((h, hi) => {
                  const isLastH = hi === a.historique.length - 1;
                  const bsepH = isLast && !expanded.has(a.id) && isLastH ? "none" : "0.5px solid #eee";
                  const nbCols = 16; // B2→B6 = 10 + commentaire + 5 autres
                  return (
                    <tr key={`histo-${a.id}-${h.annee}`} style={{background:"#f0f0f8"}}>
                      <td style={{padding:"5px 6px",borderBottom:bsepH}}></td>
                      <td style={{padding:"5px 10px",borderBottom:bsepH,fontSize:11,color:"#666"}}>
                        <span style={{color:"#aaa",marginRight:4}}>📅</span>
                        <strong style={{color:"#185FA5"}}>{h.annee}</strong>
                        <span style={{color:"#aaa",fontSize:10,marginLeft:6}}>historique</span>
                      </td>
                      <td style={{padding:"5px 6px",borderBottom:bsepH}}></td>
                      {/* Total validé historique */}
                      <td style={{textAlign:"right",padding:"5px 10px",borderBottom:bsepH,borderLeft:"1px solid #444",color:"#555",fontSize:11}}>{fmt(h.B1)}</td>
                      <td style={{textAlign:"right",padding:"5px 10px",borderBottom:bsepH,color:"#aaa",fontSize:11}}>—</td>
                      {/* B1 validé */}
                      <td style={{textAlign:"right",padding:"5px 10px",borderBottom:bsepH,borderLeft:"1px solid #ddd",color:"#555",fontSize:11}}>{fmt(h.B1)}</td>
                      <td style={{textAlign:"right",padding:"5px 10px",borderBottom:bsepH,color:"#aaa",fontSize:11}}>—</td>
                      {/* E et F historiques */}
                      <td style={{textAlign:"right",padding:"5px 10px",borderBottom:bsepH,borderLeft:"1px solid #b0d8b8",background:"#F0F7F2",color:"#185FA5",fontSize:11}}>{fmt(h.os_total)}</td>
                      <td style={{textAlign:"right",padding:"5px 10px",borderBottom:bsepH,background:"#F0F7F2",fontSize:11}}>{fmt(h.facture)}</td>
                      {/* FAR, NE, NF vides */}
                      <td style={{padding:"5px 10px",borderBottom:bsepH,background:"#fdf5ee",borderLeft:"1px solid #d8b898"}}></td>
                      <td style={{padding:"5px 10px",borderBottom:bsepH,background:"#fdf5ee"}}></td>
                      <td style={{padding:"5px 10px",borderBottom:bsepH,background:"#fdf5ee"}}></td>
                      {/* B2→B6 vides */}
                      {[0,1,2,3,4].map(i=><><td key={`h${i}a`} style={{borderBottom:bsepH,borderLeft:"1px solid #ddd"}}></td><td key={`h${i}b`} style={{borderBottom:bsepH}}></td></>)}
                      <td style={{borderBottom:bsepH,borderLeft:"1px solid #ddd"}}></td>
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
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #444",background:"#1e2a38",color:"#fff",fontWeight:600}}>{fmt(totInitial)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd",fontWeight:600,borderRight:"1px solid #444"}}>
                {hasAnyRev?fmt(totRevise):<span style={{color:"#666"}}>—</span>}
              </td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38",color:"#fff"}}>{fmt(totB1init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>
                {hasAnyRev?fmt(totB1rev):<span style={{color:"#666"}}>—</span>}
              </td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #2a4a2a",background:"#1a3020",color:"#7ecfaa"}}>{fmt(totOS)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#1a3020",color:"#7ecfaa"}}>{fmt(totFac)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a1808"}}>{fmt(totFAR)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a1808"}}>{fmt(totNE)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a1808"}}>{fmt(totNF)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB2init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{totB2rev>0?fmt(totB2rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB3init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{totB3rev>0?fmt(totB3rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB4init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{totB4rev>0?fmt(totB4rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB5init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{totB5rev>0?fmt(totB5rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",borderLeft:"1px solid #d0d8e8",background:"#1e2a38"}}>{fmt(totB6init)}</td>
              <td style={{textAlign:"right",padding:"9px 10px",borderBottom:"none",background:"#2a2800",color:"#ffd"}}>{totB6rev>0?fmt(totB6rev):<span style={{color:"#666"}}>—</span>}</td>
              <td style={{borderBottom:"none",borderLeft:"1px solid #e0e0e0",background:"#1a1a18"}}></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
