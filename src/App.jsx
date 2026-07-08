import { useState, useRef, useEffect } from "react";
import React from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// SUIVI BUDGÉTAIRE CAPEX — Démo SNK / Soneka
// ═══════════════════════════════════════════════════════════════════════════════
// Architecture :
//   • CAPEX_DATA   — données initiales (constante, jamais mutée directement)
//   • capexData    — state dérivé de CAPEX_DATA, modifiable (clôture, ajout de ligne)
//   • simData      — capexData avec E et F simulés selon la date courante (lecture seule)
//   • reports      — {id: {report, rt}} — montants et types de reports décidés par l'user
//   • overrides    — {id: {B1rev, B2rev...}} — saisies manuelles sur les colonnes Révisé
//   • reviseValide — boolean — fige toutes les colonnes Révisé (validation globale)
//   • validatedLines — Set d'ids — fige ligne par ligne (lignes custom uniquement)
//
// Années : AN(0) = année courante, AN(1) = N+1 ... AN(5) = N+5
//          Toutes calculées dynamiquement depuis dateSimu.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Données initiales ───────────────────────────────────────────────────────
// Structure d'une opération CAPEX :
//   id, label, sub, type (DTQ=Détérioration/Qualité | DEV=Développement/Valorisation)
//   dateOuverture : année d'ouverture du budget
//   historique    : [{annee, B1, os_total, facture}] — archives des exercices passés
//   budget        : montant EVEN de l'année (engagements constatés côté comptabilité)
//   os_total      : total des OS engagés sur l'année courante
//   facture       : total facturé comptabilisé
//   B1..B6        : budgets validés pluriannuels (B1=année courante, B2=N+1...)
//   os            : [{id, label, montant, facture, statut}] — ordres de service ouverts
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
    budget:0,       os_total:0,      facture:0,
    B1:0,       B2:0,        B3:280000,  B4:0,       B5:0,       B6:0,
    os:[]},
  { id:"sas",   label:"Création sas d'entrée",               sub:"Aménagement · Valorisation",     type:"DEV",
    dateOuverture:2026,
    historique:[],
    budget:650000,  os_total:0,      facture:0,
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

// ─── Textes d'aide pour les infobulles du menu de report ─────────────────────
const TIPS = {
  full:     "Reporter l'intégralité du budget 2026 sur 2027. Disponible uniquement si aucun OS n'a été ouvert sur cette opération.",
  ne:       "Reporter sur 2027 le budget sans OS : solde budgétaire non couvert par un ordre de service (NE = B1 − E).",
  far:      "Reporter sur 2027 les Factures À Recevoir sur OS émis : FAR = E − F. Ces sommes sont juridiquement engagées.",
  nf:       "Reporter sur 2027 le budget non facturé : NF = B1 − F. Inclut les FAR et le solde non engagé.",
  manu:     "Reporter sur 2027 un montant saisi manuellement. Utile pour un arbitrage partiel.",
  conserve: "Saisir le budget complémentaire à conserver en 2026 (hors factures déjà comptabilisées). Le solde restant sera reporté sur 2027.",
  reset:    "Annuler toutes les actions de report sur cette ligne.",
};

// ─── Fonctions de calcul ──────────────────────────────────────────────────────
// FAR par OS  : Factures À Recevoir = montant engagé − facturé (juridiquement dû)
const calcFar  = (o) => Math.max(0, o.montant - o.facture);
// FAR total   : somme des FAR sur tous les OS d'une opération
const calcTfar = (a) => a.os.reduce((s,o) => s+calcFar(o), 0);
// NE          : Non Engagé = B1 − E (budget sans OS ouvert)
const calcNE   = (a) => Math.max(0, a.B1 - a.os_total);
// NF          : Non Facturé = B1 − F (budget non encore comptabilisé, inclut FAR + NE)
const calcNF   = (a) => Math.max(0, a.B1 - a.facture);
// Plafond saisie manuelle = NF (on ne peut pas reporter plus que le non facturé)
const calcBmf  = (a) => Math.max(0, a.B1 - a.facture);
// Formateur monétaire français
const fmt = (n) => n.toLocaleString("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0});

// Calcule le montant total reporté sur une opération (ligne + OS).
// Utilisé pour dériver B1' (réduit) et B2' (augmenté) automatiquement.
function calcTotalReport(a, reports) {
  const ar  = reports[a.id]?.report || 0;
  const osr = a.os.reduce((s,o) => s+(reports[o.id]?.report||0), 0);
  return ar + osr;
}

// Alias identique — conservé pour clarté sémantique dans les calculs B2'
function calcTotalReportB2(a, reports) {
  return calcTotalReport(a, reports);
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
      if (type==="far")     { a.os.forEach(o=>{if(calcFar(o)>0) next[o.id]={report:calcFar(o),rt:"far"};}); if(next[a.id]?.rt==="far") delete next[a.id]; }
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
        style={{ fontSize:9, padding:"1px 5px", borderRadius:4,
          border: disabled?"0.5px solid #ddd":"0.5px solid #d8b898",
          background: disabled?"#f5f5f5":"#fff3e8",
          color: disabled?"#ccc":"#8a4020",
          cursor:disabled?"default":"pointer", fontWeight:600,
          opacity: disabled?0.5:1, whiteSpace:"nowrap" }}
        title={`Report partiel sur ${AN(1)} — saisir manuellement le montant à reporter ou à conserver`}>→ {AN(0)}/{AN(1)}</button>
      {open && (
        <>
          <div onClick={()=>{setOpen(false);setShowManu(false);setShowConserve(false);}}
            style={{ position:"fixed", inset:0, zIndex:9998 }} />
          <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", width:300, background:"#fff",
            border:"0.5px solid #ccc", borderRadius:10, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,.12)" }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", padding:"8px 12px 4px", borderTop:"0.5px solid #eee" }}>
              Report partiel sur {AN(1)} :
            </div>
            {a.os_total === 0 ? <>
              {bmf>0 && <>
                <CtxItem label={`Je saisis le montant à reporter`} tipKey="manu" onClick={()=>setShowManu(s=>!s)} />
                {showManu && <InputRow label={`Montant à reporter sur ${AN(1)} (€) — max ${fmt(bmf)} :`} max={bmf} onApply={v=>apply("manu",v)} />}
              </>}
            </> : <>
              {bmf>0 && <>
                <CtxItem label={`Je saisis le montant à reporter`} tipKey="manu" onClick={()=>setShowManu(s=>!s)} />
                {showManu && <InputRow label={`Montant à reporter sur ${AN(1)} (€) — max ${fmt(bmf)} :`} max={bmf} onApply={v=>apply("manu",v)} />}
              </>}
              {bmf>0 && <>
                <CtxItem label={`Je saisis ce que je conserve en ${AN(0)}, le solde part en ${AN(1)}`} tipKey="conserve" onClick={()=>setShowConserve(s=>!s)} />
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

// ─── Bouton fantôme (Ghost) ───────────────────────────────────────────────────
// Rôle ESTHÉTIQUE UNIQUEMENT : force toutes les cellules du tableau à avoir
// la même hauteur, quelle que soit la présence ou non de boutons d'action.
// Invisible (texte, fond et bordure de la même couleur que la cellule),
// non cliquable (pointerEvents:"none"), non sélectionnable (userSelect:"none").
// Chaque cellule sans bouton reçoit autant de Ghost que la cellule la plus haute
// de sa ligne en a de boutons réels — actuellement 2 (→ 2027 + → 2026/2027).
// Sans ces Ghost, les montants des différentes colonnes ne seraient pas alignés
// horizontalement car les cellules NE/NF ont 2 niveaux de boutons sous le montant.
const Ghost = ({bg}) => <span style={{display:"block",fontSize:9,padding:"1px 6px",borderRadius:4,border:`0.5px solid ${bg}`,background:bg,color:bg,userSelect:"none",pointerEvents:"none",marginTop:3}}>·</span>;

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
function AddLineModal({ AN, onClose, onAdd }) {
  const [label, setLabel] = useState("");
  const [sub,   setSub]   = useState("");
  const [type,  setType]  = useState("DTQ");
  const [montant, setMontant] = useState("");
  const handleAdd = () => {
    if(!label.trim()){ alert("Le libellé est obligatoire."); return; }
    onAdd({
      id: "custom_" + Date.now(),
      label: label.trim(), sub: sub.trim(), type,
      dateOuverture: AN(0),
      historique: [],
      budget:0, os_total:0, facture:0,
      B1:0, B2:0, B3:0, B4:0, B5:0, B6:0,
      os:[],
      _montantHT: parseFloat(montant)||0,
    });
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)"}}>
      <div style={{background:"#fff",borderRadius:12,padding:"28px 32px",maxWidth:420,width:"90vw",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#aaa"}}>✕</button>
        <div style={{fontSize:18,fontWeight:600,marginBottom:16}}>+ Nouvelle opération CAPEX</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <label style={{fontSize:11,color:"#888"}}>Libellé *</label>
            <input autoFocus value={label} onChange={e=>setLabel(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleAdd()}
              placeholder="ex: Remplacement chaudière"
              style={{width:"100%",padding:"6px 10px",borderRadius:6,border:"1px solid #ddd",fontSize:13,boxSizing:"border-box",marginTop:3}} />
          </div>
          <div>
            <label style={{fontSize:11,color:"#888"}}>Sous-titre <span style={{color:"#bbb"}}>(optionnel)</span></label>
            <input value={sub} onChange={e=>setSub(e.target.value)}
              placeholder="ex: CVC · Génie climatique"
              style={{width:"100%",padding:"6px 10px",borderRadius:6,border:"1px solid #ddd",fontSize:13,boxSizing:"border-box",marginTop:3}} />
          </div>
          <div>
            <label style={{fontSize:11,color:"#888",display:"block",marginBottom:6}}>Type</label>
            <div style={{display:"flex",gap:10}}>
              {["DTQ","DEV"].map(t=>(
                <button key={t} onClick={()=>setType(t)}
                  style={{flex:1,padding:"8px",borderRadius:6,cursor:"pointer",fontWeight:600,fontSize:13,
                    border: type===t?"2px solid #185FA5":"1px solid #ddd",
                    background: type===t?"#E6F1FB":"#f5f5f5",
                    color: type===t?"#0C447C":"#555"}}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{fontSize:11,color:"#aaa",fontStyle:"italic"}}>Les budgets pluriannuels pourront être saisis directement dans le tableau.</div>
          <div>
            <label style={{fontSize:11,color:"#888"}}>Montant HT <span style={{color:"#bbb"}}>(budget de l'année en cours — remplit B1' Révisé)</span></label>
            <input type="number" value={montant} onChange={e=>setMontant(e.target.value)}
              placeholder="ex: 150000"
              style={{width:"100%",padding:"6px 10px",borderRadius:6,border:"1px solid #ddd",fontSize:13,boxSizing:"border-box",marginTop:3}} />
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
          <button onClick={onClose}
            style={{padding:"7px 16px",borderRadius:8,border:"1px solid #ddd",background:"#f5f5f5",cursor:"pointer",fontSize:12}}>
            Annuler
          </button>
          <button onClick={handleAdd}
            style={{padding:"7px 16px",borderRadius:8,border:"none",background:"#185FA5",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

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
  // ─── States ─────────────────────────────────────────────────────────────────
  const [expanded, setExpanded]   = useState(new Set());         // ids des lignes expandées (OS visibles)
  const [expandedHisto, setExpandedHisto] = useState(new Set()); // ids des lignes avec historique visible
  const [reports,  setReports]    = useState({});                 // reports décidés : {id: {report, rt}}
  const [toastMsg, setToastMsg]   = useState(null);              // message toast temporaire
  const [overrides,setOverrides]  = useState({});                 // saisies manuelles Révisé : {id: {B1rev...}}
  const [editing,  setEditing]    = useState(null);              // cellule en cours d'édition : {id, col}
  const [comments, setComments]   = useState({});                 // commentaires libres par opération
  const [confirmModal, setConfirmModal] = useState(null);         // modale de confirmation générique
  const [arbitrageModal, setArbitrageModal] = useState(null);     // modale budgets non arbitrés à la validation
  const [dateSimu, setDateSimu]   = useState("2026-09-30");      // date pilotant AN(0) et la simulation E/F
  const [capexData, setCapexData] = useState(CAPEX_DATA);        // données modifiables (clôture, lignes ajoutées)
  const [reviseValide, setReviseValide] = useState(false);        // true = toutes les colonnes Révisé figées
  const [validatedLines, setValidatedLines] = useState(new Set()); // ids des lignes custom validées individuellement
  const [addLineModal, setAddLineModal] = useState(false);        // affichage modale ajout d'opération
  const theadRef = useRef(null); // référence thead pour sticky headers

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
  // ─── Simulation temporelle ────────────────────────────────────────────────────
  // E et F progressent selon une courbe logarithmique au fil de l'année :
  // rapide en début d'année, asymptotique vers le budget sans jamais l'atteindre.
  // E (OS engagés) progresse plus vite que F (facturé) car on engage avant de facturer.
  // Au 1er janvier : E = F = 0 (reset de début d'exercice).
  // Les lignes sans OS ne sont pas simulées (E et F restent à 0).
  const simDate  = new Date(dateSimu);
  const simMois  = simDate.getMonth(); // 0-11
  const simJour  = simDate.getDate();
  const t = Math.min(0.999, Math.max(0.01, (simMois * 30 + simJour) / 365));
  const isJan1 = simMois === 0 && simJour === 1;
  // Courbe logarithmique : progression rapide en début, ralentit vers la fin
  // coeff entre 0.05 (jan) et ~0.85 (déc) — jamais 1 pour ne pas atteindre le budgété
  const coeff = (e, f) => {
    // E progresse plus vite que F (engagement avant facturation)
    const eCoeff = Math.min(0.92, 0.05 + 0.87 * Math.log(1 + t * 9) / Math.log(10));
    const fCoeff = Math.min(0.82, 0.03 + 0.79 * Math.log(1 + t * 7) / Math.log(10));
    return { e: eCoeff, f: fCoeff };
  };

  // Données simulées : E et F évoluent avec la courbe logarithmique
  const simData = capexData.map(a => {
    if(isJan1) return {...a, os_total:0, facture:0, os:a.os.map(o=>({...o,montant:0,facture:0}))};
    // Ne simuler E et F que si la ligne a des OS ouverts
    if(a.os.length === 0) return {...a, os_total:0, facture:0};
    const {e: ec, f: fc} = coeff(a.os_total, a.facture);
    // Valeurs max = B1 (budget de l'année), plancher = valeurs initiales au 1er jan
    const eMax = a.B1;
    const fMax = Math.round(a.B1 * 0.75); // F plafonne à 75% du budget (toujours du FAR)
    return {
      ...a,
      os_total: Math.round(Math.max(a.os_total * 0.05, Math.min(eMax * ec, eMax * 0.92))),
      facture:  Math.round(Math.max(a.facture  * 0.03, Math.min(fMax * fc, fMax * 0.82))),
      os: a.os.map(o => {
        const {e: oec, f: ofc} = coeff(o.montant, o.facture);
        return {
          ...o,
          montant: Math.round(Math.max(o.montant * 0.05, Math.min(o.montant * oec / 0.5 * ec, o.montant * 0.95))),
          facture: Math.round(Math.max(o.facture  * 0.03, Math.min(o.facture  * ofc / 0.5 * fc, o.facture  * 0.88))),
        };
      })
    };
  });

  const toast = (msg,type) => { setToastMsg({msg,type}); setTimeout(()=>setToastMsg(null),4000); };
  const toggleExpand = id => setExpanded(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  // ─── Totaux ───────────────────────────────────────────────────────────────────
  // Les totaux "rev" n'agrègent que les lignes ayant fait l'objet d'une révision
  // explicite (report ou saisie manuelle). Les lignes non arbitrées n'y contribuent
  // pas, même si leur budget validé est non nul — c'est voulu pour que l'utilisateur
  // voit clairement ce qu'il a décidé vs ce qui reste à arbitrer.
  // La modale "⚠️ Budgets non arbitrés" (à la validation) joue le rôle de filet.
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
    const rep=calcTotalReportB2(a,reports); const ovr=overrides[a.id]?.B2rev;
    if(ovr!==undefined) return s+ovr;
    if(rep>0) return s+(a.B2+rep);
    return s;
  },0);
  const totB3init  = capexData.reduce((s,a)=>s+a.B3,0);
  const totB3rev   = capexData.reduce((s,a)=>overrides[a.id]?.B3rev!==undefined ? s+overrides[a.id].B3rev : s, 0);
  const totB4init  = capexData.reduce((s,a)=>s+a.B4,0);
  const totB4rev   = capexData.reduce((s,a)=>overrides[a.id]?.B4rev!==undefined ? s+overrides[a.id].B4rev : s, 0);
  const totB5init  = capexData.reduce((s,a)=>s+a.B5,0);
  const totB5rev   = capexData.reduce((s,a)=>overrides[a.id]?.B5rev!==undefined ? s+overrides[a.id].B5rev : s, 0);
  const totB6init  = capexData.reduce((s,a)=>s+a.B6,0);
  const totB6rev   = capexData.reduce((s,a)=>overrides[a.id]?.B6rev!==undefined ? s+overrides[a.id].B6rev : s, 0);
  const totInitial = totB1init+totB2init+totB3init+totB4init+totB5init+totB6init;
  // Total révisé = initial des lignes non révisées + révisé des lignes révisées
  const totRevise  = totB1rev+totB2rev+totB3rev+totB4rev+totB5rev+totB6rev;
  const hasAnyRev  = totReport>0 || capexData.some(a=>a.os.some(o=>reports[o.id]?.rt==="far")) || capexData.some(a=>overrides[a.id] && Object.keys(overrides[a.id]).some(k=>k.endsWith("rev")));

  const toastColors = { info:"#0C447C|#E6F1FB|#B5D4F4", warning:"#633806|#FAEEDA|#FAC775", success:"#27500A|#EAF3DE|#C0DD97", err:"#791F1F|#FCEBEB|#F7C1C1" };
  const thS = { fontSize:11, fontWeight:500, color:"#888", padding:"3px 8px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap", lineHeight:"1.2", background:"#f5f5f0" };

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
                      const repB2 = calcTotalReportB2(a, reports);
                      const getB = (n) => {
                        const ovr = overrides[a.id]?.[`B${n}rev`];
                        const init = a[`B${n}`];
                        if (ovr !== undefined && ovr !== init) return ovr;
                        if (n === 2 && repB2 > 0) return init + repB2;
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
                    setValidatedLines(new Set());
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

      {addLineModal && <AddLineModal
        AN={AN}
        onClose={()=>setAddLineModal(false)}
        onAdd={(newLine)=>{
          const {_montantHT, ...line} = newLine;
          setCapexData(prev=>[...prev, line]);
          if(_montantHT > 0){
            setOverrides(prev=>({...prev, [line.id]:{...prev[line.id], B1rev:_montantHT}}));
          }
          setAddLineModal(false);
          toast(`"${line.label}" ajoutée au plan CAPEX.`,"success");
        }}
      />}

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
        .capex-table tbody tr.data-row td { height: 56px; vertical-align: middle; }
        .capex-table tbody tr.capex-sticky-total td { position: sticky; bottom: 0; z-index: 9; }
      `}</style>
      <div style={{ background:"#fff", border:"0.5px solid #eee", borderRadius:12, overflowX:"auto", overflowY:"auto", maxHeight:"75vh" }}>
        <table className="capex-table" style={{ width:"100%", fontSize:13, minWidth:1800 }}>
          <thead ref={theadRef}>
            {/* Ligne 1 : groupes année */}
            <tr style={{ background:"#2a5a8a", color:"#fff", textAlign:"center" }}>
              <th colSpan={3} style={{ ...thG, color:"#fff", background:"#1a1a18", borderLeft:"none", textAlign:"left", paddingLeft:12, position:"sticky", left:0, zIndex:31, boxShadow:"3px 0 8px rgba(0,0,0,0.15)" }}>Identification</th>
              <th colSpan={2} style={{ ...thG, color:"#fff", background:"#2a2a26", borderLeft:"1px solid #444", borderRight:"1px solid #444" }}>Total {AN(0)}→{AN(5)}</th>
              <th colSpan={7} style={{ ...thG, color:"#fff", background:"#2a5a8a", borderLeft:"1px solid #d0d8e8" }}>{AN(0)}</th>
              {[1,2,3,4,5].map(i => (
                <th key={i} colSpan={2} style={{ ...thG, color:"#fff", background:"#1e3a5a", borderLeft:"1px solid #d0d8e8" }}>{AN(i)}</th>
              ))}
              <th style={{ ...thG, color:"#fff", background:"#1a1a18", borderLeft:"1px solid #e0e0e0" }}>Commentaire</th>
            </tr>
            {/* Ligne 2 : sous-groupes */}
            <tr style={{ background:"#e8eff8", textAlign:"center" }}>
              <th colSpan={3} style={{ ...thG, color:"#555", background:"#f0f0ee", borderLeft:"none", position:"sticky", left:0, zIndex:31, boxShadow:"3px 0 8px rgba(0,0,0,0.08)" }}></th>
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
                      fontWeight:600,whiteSpace:"nowrap",opacity:reviseValide?0.5:1}}
                    title={`Remet les budgets révisés de ${AN(2)} à ${AN(5)} au niveau du budget validé pour toutes les lignes. Ne touche pas à ${AN(1)} (géré par les actions de report).`}>
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
                    });}}                    style={{fontSize:9,padding:"1px 6px",borderRadius:5,
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
                          fontWeight:600,whiteSpace:"nowrap",opacity:reviseValide?0.5:1}}
                        title={`Remet le budget révisé ${AN(i)} au niveau du budget validé pour toutes les lignes.`}>
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
              <th colSpan={3} style={{ ...thS, position:"sticky", left:0, zIndex:31, background:"#f5f5f0", boxShadow:"3px 0 8px rgba(0,0,0,0.08)", padding:0, minWidth:270, width:270 }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 8px"}}>
                  <span>Opération / OS</span>
                  <span>Clé</span>
                </div>
              </th>
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
              // totalRep = report sur la ligne (hors OS) + reports FAR sur chaque OS
              const lineRep    = reports[a.id]?.report || 0;
              const farOSTotal = a.os.reduce((s,o)=>s+(reports[o.id]?.report||0), 0);
              const totalRep   = lineRep + farOSTotal;
              const totalRepB2 = totalRep;
              const rep      = reports[a.id];
              // Si pas de report sur a.id mais des reports sur les OS → FAR
              const rt = rep?.rt ?? (a.os.some(o=>reports[o.id]?.rt==="far") ? "far" : null);
              const hasFarOS = a.os.some(o=>reports[o.id]?.rt==="far");
              const ne       = calcNE(a);
              const far      = calcTfar(a);
              const nf       = calcNF(a);
              const B1rev    = overrides[a.id]?.B1rev ?? (totalRep > 0 ? a.B1 - totalRep : null);
              const B2rev    = overrides[a.id]?.B2rev ?? (totalRepB2 > 0 ? a.B2 + totalRepB2 : null);
              const B3rev    = overrides[a.id]?.B3rev ?? null;
              const B4rev    = overrides[a.id]?.B4rev ?? null;
              const B5rev    = overrides[a.id]?.B5rev ?? null;
              const B6rev    = overrides[a.id]?.B6rev ?? null;
              const totalInit = a.B1+a.B2+a.B3+a.B4+a.B5+a.B6;
              const totalRev  = (B1rev!==null?B1rev:0) + (B2rev!==null?B2rev:0) +
                                (overrides[a.id]?.B3rev??0) + (overrides[a.id]?.B4rev??0) +
                                (overrides[a.id]?.B5rev??0) + (overrides[a.id]?.B6rev??0);
              const hasRowRev = calcTotalReport(a,reports)>0 || calcTotalReportB2(a,reports)>0 || (overrides[a.id] && Object.keys(overrides[a.id]).some(k=>k.endsWith("rev")));
              const isLineValidated = validatedLines.has(a.id);
              const isBlocked = reviseValide || isLineValidated;
              const isLast   = ai===simData.length-1;
              const bbot     = isLast&&!expanded.has(a.id)?"none":"0.5px solid #eee";
              const rtLabels = {far:"FAR",ne:"NE",nf:"NF",manu:"MANUEL",conserve:"SOLDE",full:"COMPLET"};
              const rtColors = {far:"#27500A|#EAF3DE",ne:"#854F0B|#FAEEDA",nf:"#5C3D00|#FEF0D0",manu:"#0C447C|#E6F1FB",conserve:"#0C447C|#E6F1FB",full:"#3a0a6e|#ede0ff"};
              const [rtC,rtBg] = (rtColors[rt]||"#555|#eee").split("|");
              const isB1RevEdit = editing?.id===a.id && editing?.col==="B1rev";

              return [
                <tr key={a.id} className="data-row">
                  {/* Identification — figée au scroll horizontal */}
                  <td colSpan={3} style={{padding:"8px 10px",borderBottom:bbot,verticalAlign:"middle",background:"#fff",minWidth:320,width:320,
                    position:"sticky",left:0,zIndex:11,boxShadow:"3px 0 8px rgba(0,0,0,0.08)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button onClick={()=>toggleExpand(a.id)}
                        style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",flexShrink:0,
                          color:"#aaa",fontSize:14,transform:expanded.has(a.id)?"rotate(90deg)":"none",
                          transition:"transform .15s",display:"inline-flex",alignItems:"center"}}>›</button>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:4}}>
                          <div>
                            <strong>{a.label}</strong><br/>
                            <span style={{color:"#aaa",fontSize:11,whiteSpace:"nowrap"}}>{a.sub}</span><br/>
                            <span style={{display:"inline-block",fontSize:10,padding:"1px 6px",borderRadius:4,fontWeight:500,
                              background:"#f0f0ee",color:"#888",border:"0.5px solid #ddd",marginTop:2}}>
                              depuis {a.dateOuverture}
                            </span>
                          </div>
                          {a.historique?.length > 0 && (
                            <button onClick={()=>setExpandedHisto(prev=>{const n=new Set(prev);n.has(a.id)?n.delete(a.id):n.add(a.id);return n;})}
                              style={{background:"none",border:"0.5px solid #c0c8e0",borderRadius:4,cursor:"pointer",
                                padding:"1px 5px",fontSize:10,color:"#7090CC",whiteSpace:"nowrap",flexShrink:0,marginTop:2}}>
                              {expandedHisto.has(a.id)?"▲ Histo":"▼ Histo"} ({a.historique.length})
                            </button>
                          )}
                        </div>
                      </div>
                      <span style={{display:"inline-block",fontSize:11,padding:"2px 6px",borderRadius:4,fontWeight:500,flexShrink:0,
                        background:a.type==="DTQ"?"#E6F1FB":"#EEEDFE",color:a.type==="DTQ"?"#0C447C":"#3C3489"}}>{a.type}</span>
                    </div>
                  </td>
                  {/* Total validé */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #444",color:"#555",fontWeight:500}}>
                    {fmt(totalInit)}<Ghost bg="#ffffff" /><Ghost bg="#ffffff" />
                  </td>
                  {/* Total révisé */}
                  <td style={{textAlign:"right",padding:"4px 10px",borderBottom:bbot,borderRight:"1px solid #444",
                    background: hasRowRev ? "#fffbe0" : "#fafaf8",
                    color: hasRowRev ? "#b05000" : "#ccc", fontWeight: hasRowRev ? 600 : 400}}>
                    {hasRowRev ? fmt(totalRev) : <span style={{color:"#ccc"}}>—</span>}<Ghost bg={hasRowRev?"#fffbe0":"#fafaf8"} /><Ghost bg={hasRowRev?"#fffbe0":"#fafaf8"} />
                  </td>
                  {/* B1 initial */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #ddd",color:"#555"}}>
                    {fmt(a.B1)}<Ghost bg="#ffffff" /><Ghost bg="#ffffff" />
                  </td>
                  {/* B1 révisé — toujours éditable */}
                  {(() => {
                    const hasOverride = overrides[a.id]?.B1rev !== undefined;
                    const displayVal  = hasOverride ? overrides[a.id].B1rev : (totalRep > 0 ? B1rev : null);
                    const isActive    = totalRep > 0 || hasOverride;
                    const f = a.facture;
                    const farVal = calcTfar(a);
                    const neVal  = calcNE(a);
                    if(ai===0) console.log("DEBUG PAC:", {totalRep, lineRep, farOSTotal, B1rev, isActive, displayVal, reportsKeys: Object.keys(reports)});
                    // Détail de composition selon l'action
                    const detail = () => {
                      if (hasOverride) return <span style={{fontSize:9,color:"#c08030"}}>✎ saisi manuellement</span>;
                      if (rt==="full")     return <span style={{fontSize:10,color:"#7090CC"}}>Budget complet reporté sur {AN(1)}</span>;
                      if (rt==="far")     { const farOS=a.os.filter(o=>reports[o.id]?.rt==="far"); return <span style={{fontSize:10,color:"#7090CC"}}>FAR reportés sur {farOS.length} OS · {fmt(farOS.reduce((s,o)=>s+reports[o.id].report,0))}</span>; }
                      if (rt==="nf")      return <span style={{fontSize:10,color:"#7090CC"}}>Facturé {fmt(f)}</span>;
                      if (rt==="ne")      return <span style={{fontSize:10,color:"#7090CC"}}>Facturé {fmt(f)} + FAR {fmt(farVal)}</span>;
                      if (rt==="manu")    return <span style={{fontSize:10,color:"#7090CC"}}>Facturé {fmt(f)} + reste {fmt(B1rev-f)}</span>;
                      if (rt==="conserve"){ const conserve=B1rev-f; return <span style={{fontSize:10,color:"#7090CC"}}>Facturé {fmt(f)} + conservé {fmt(conserve)}</span>; }
                      return null;
                    };
                    return (
                      <td style={{textAlign:"right",padding:"4px 10px",borderBottom:bbot,
                        background: isActive ? "#fffbe0" : "#fffef5",
                        cursor: isBlocked ? "default" : "pointer", fontWeight: isActive ? 600 : 400 }}
                        title={isBlocked ? "Révisé validé — non modifiable" : "Double-cliquez pour modifier — valeur de départ = Budget validé"}
                        onDoubleClick={()=>{ if(!isBlocked) setEditing({id:a.id,col:"B1rev"}); }}>
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
                            ? <div style={{display:"inline-flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                                <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
                                  <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:4}}
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
                                  {a.id.startsWith("custom_") && (
                                    validatedLines.has(a.id)
                                      ? <span title="Budget validé" style={{fontSize:10,color:"#27500A",background:"#EAF3DE",border:"0.5px solid #c0dd97",borderRadius:4,padding:"1px 5px",flexShrink:0}}>✓ validé</span>
                                      : <button onClick={()=>setConfirmModal({
                                            msg:`Valider le budget de "${a.label}" à ${fmt(displayVal)} ? Ce montant sera transféré en budget validé et la ligne sera figée.`,
                                            onConfirm:()=>{
                                              setCapexData(prev=>prev.map(x=>x.id===a.id ? {...x, B1: displayVal} : x));
                                              setOverrides(prev=>{
                                                const next={...prev};
                                                if(next[a.id]?.B1rev!==undefined){
                                                  const {B1rev,...rest}=next[a.id];
                                                  if(Object.keys(rest).length) next[a.id]=rest;
                                                  else delete next[a.id];
                                                }
                                                return next;
                                              });
                                              setValidatedLines(prev=>new Set([...prev,a.id]));
                                              toast(`"${a.label}" — ${fmt(displayVal)} transféré en budget validé.`,"success");
                                            }
                                          })}
                                          title="Valider et transférer en budget validé"
                                          style={{fontSize:10,padding:"1px 6px",borderRadius:4,border:"0.5px solid #3A7A4A",
                                            background:"#EAF3DE",color:"#27500A",cursor:"pointer",fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>
                                          ✓ Valider
                                        </button>
                                  )}
                                </div>
                                <Ghost bg="#fffbe0" /><Ghost bg="#fffbe0" />
                              </div>
                            : <><span style={{color:"#ccc",fontSize:11}}>—</span><Ghost bg="#fffef5" /><Ghost bg="#fffef5" /></>}
                      </td>
                    );
                  })()}
                  {/* OS engagés */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #b0d8b8",background:"#F0F7F2",color:"#185FA5"}}>
                    {fmt(a.os_total)}<Ghost bg="#F0F7F2" /><Ghost bg="#F0F7F2" />
                  </td>
                  {/* Facturé */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,background:"#F0F7F2"}}>
                    {fmt(a.facture)}<Ghost bg="#F0F7F2" /><Ghost bg="#F0F7F2" />
                  </td>
                  {/* FAR */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,borderLeft:"1px solid #d8b898",background:"#fdf5ee",verticalAlign:"middle"}}>
                    {far>0?fmt(far):<span style={{color:"#ccc"}}>—</span>}<Ghost bg="#fdf5ee" /><Ghost bg="#fdf5ee" />
                  </td>
                  {/* Non engagé */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,background:"#fdf5ee",verticalAlign:"middle"}}>
                    <div style={{display:"inline-flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                      {ne>0?fmt(ne):<span style={{color:"#ccc"}}>0 €</span>}
                      {!isBlocked && ne>0 && reports[a.id]?.rt==="ne" && <span style={{fontSize:9,color:"#27500A",background:"#EAF3DE",border:"0.5px solid #c0dd97",borderRadius:4,padding:"1px 6px",cursor:"pointer"}} onClick={()=>setReports(prev=>{const next={...prev};delete next[a.id];return next;})}>→ {AN(1)} ✕</span>}
                      {!isBlocked && ne>0 && reports[a.id]?.rt!=="ne" && <button onClick={()=>{setReports(prev=>({...prev,[a.id]:{report:ne,rt:"ne"}}));setOverrides(prev=>{const next={...prev};if(next[a.id]?.B1rev!==undefined){const {B1rev,...rest}=next[a.id];if(Object.keys(rest).length)next[a.id]=rest;else delete next[a.id];}return next;});}} title={`Reporter le budget non engagé (NE = B1 − E) sur ${AN(1)} : ${fmt(ne)}\nB1' sera réduit d'autant, B2' augmentera en conséquence.`} style={{fontSize:9,padding:"1px 6px",borderRadius:4,border:"0.5px solid #d8b898",background:"#fff3e8",color:"#8a4020",cursor:"pointer",fontWeight:600}}>→ {AN(1)}</button>}
                      {(isBlocked || !ne) && <Ghost bg="#fdf5ee" />}
                      <Ghost bg="#fdf5ee" />
                    </div>
                  </td>
                  {/* Non facturé + 2026←→2027 */}
                  <td style={{textAlign:"right",padding:"8px 10px",borderBottom:bbot,verticalAlign:"middle"}}>
                    <div style={{display:"inline-flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                      {nf>0?fmt(nf):<span style={{color:"#ccc"}}>—</span>}
                      {!isBlocked && nf>0 && reports[a.id]?.rt==="nf" && <span style={{fontSize:9,color:"#27500A",background:"#EAF3DE",border:"0.5px solid #c0dd97",borderRadius:4,padding:"1px 6px",cursor:"pointer"}} onClick={()=>setReports(prev=>{const next={...prev};delete next[a.id];return next;})}>→ {AN(1)} ✕</span>}
                      {!isBlocked && nf>0 && reports[a.id]?.rt!=="nf" && <button onClick={()=>{setReports(prev=>({...prev,[a.id]:{report:nf,rt:"nf"}}));setOverrides(prev=>{const next={...prev};if(next[a.id]?.B1rev!==undefined){const {B1rev,...rest}=next[a.id];if(Object.keys(rest).length)next[a.id]=rest;else delete next[a.id];}return next;});}} title={`Reporter tout le budget non facturé (NF = B1 − F) sur ${AN(1)} : ${fmt(nf)}\nB1' sera réduit d'autant, B2' augmentera en conséquence.`} style={{fontSize:9,padding:"1px 6px",borderRadius:4,border:"0.5px solid #d8b898",background:"#fff3e8",color:"#8a4020",cursor:"pointer",fontWeight:600}}>→ {AN(1)}</button>}
                      {(isBlocked || !nf) && <Ghost bg="#ffffff" />}
                      {!isBlocked && <CtxMenu a={a} reports={reports} setReports={setReports} setOverrides={setOverrides} toast={toast} AN={AN} disabled={reviseValide||validatedLines.has(a.id)} />}
                      {isBlocked && <Ghost bg="#ffffff" />}
                    </div>
                  </td>
                  {/* B2 à B5 initial + révisé */}
                  {[["B2","B2rev"],["B3","B3rev"],["B4","B4rev"],["B5","B5rev"],["B6","B6rev"]].map(([init,col],i)=>{
                    const autoVal = col==="B2rev" && totalRepB2>0 ? a[init]+totalRepB2 : null;
                    const hasOvr  = overrides[a.id]?.[col] !== undefined;
                    const dispVal = hasOvr ? overrides[a.id][col] : autoVal;
                    const isEdit  = editing?.id===a.id && editing?.col===col;
                    return (
                      <>
                        <td key={init} style={{textAlign:"right",padding:"8px 10px",borderBottom:"none",borderLeft:"1px solid #ddd",color:"#888"}}>
                          {a[init]>0?fmt(a[init]):<span style={{color:"#ccc"}}>—</span>}<Ghost bg="#ffffff" /><Ghost bg="#ffffff" />
                        </td>
                        <td key={col} style={{padding:"4px 8px",borderBottom:"none",textAlign:"right",verticalAlign:"middle",
                          background:dispVal!==null?"#fffbe0":"#fffef5",
                          cursor: isBlocked ? "default" : "text", fontSize:13}}
                          title={isBlocked ? "Révisé validé — non modifiable" : "Double-cliquez pour modifier — valeur de départ = Budget validé"}
                          onDoubleClick={()=>{ if(!isBlocked) setEditing({id:a.id,col}); }}>
                          {isEdit
                            ? <input autoFocus type="number" defaultValue={dispVal??a[init]}
                                onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){const tot0=a.B1+a.B2+a.B3+a.B4+a.B5+a.B6;const cur=overrides[a.id]||{};const nr=(cur.B1rev??a.B1)+(col==="B2rev"?v:(cur.B2rev??a.B2))+(col==="B3rev"?v:(cur.B3rev??a.B3))+(col==="B4rev"?v:(cur.B4rev??a.B4))+(col==="B5rev"?v:(cur.B5rev??a.B5))+(col==="B6rev"?v:(cur.B6rev??a.B6));if(nr>tot0){setEditing(null);setConfirmModal({msg:`Le total du budget révisé (${fmt(nr)}) est supérieur au budget initial (${fmt(tot0)}) ; confirmez-vous la saisie ?`,onConfirm:()=>setOverrides(p=>({...p,[a.id]:{...p[a.id],[col]:v}}))});}else{setOverrides(p=>({...p,[a.id]:{...p[a.id],[col]:v}}));setEditing(null);}}else setEditing(null);}}
                                onKeyDown={e=>{if(e.key==="Enter")e.target.blur();if(e.key==="Escape")setEditing(null);}}
                                style={{width:72,textAlign:"right",fontSize:12,padding:"2px 4px",border:"1px solid #185FA5",borderRadius:4,outline:"none"}} />
                            : dispVal!==null
                              ? <div style={{display:"inline-flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                                  <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:4}}
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
                                  <Ghost bg="#fffbe0" /><Ghost bg="#fffbe0" />
                                </div>
                              : <><span style={{color:"#ccc",fontSize:11}}>—</span><Ghost bg="#fffef5" /><Ghost bg="#fffef5" /></>}
                        </td>
                      </>
                    );
                  })}
                  {/* Commentaire + suppression pour lignes custom */}
                  <td style={{padding:"4px 8px",borderBottom:"none",borderLeft:"1px solid #ddd",verticalAlign:"middle"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:4}}>
                      <textarea
                        value={comments[a.id]||""}
                        onChange={e=>setComments(p=>({...p,[a.id]:e.target.value}))}
                        placeholder="Ajouter un commentaire…"
                        rows={2}
                        style={{flex:1,fontSize:11,padding:"4px 6px",border:"0.5px solid #ddd",borderRadius:4,
                          resize:"vertical",fontFamily:"inherit",color:"#555",background:"#fafaf8",outline:"none",
                          minWidth:140}} />
                      {a.id.startsWith("custom_") && (
                        <button onClick={()=>setConfirmModal({
                          msg:`Supprimer "${a.label}" ? Cette action est irréversible.`,
                          onConfirm:()=>{
                            setCapexData(prev=>prev.filter(x=>x.id!==a.id));
                            toast(`"${a.label}" supprimée.`,"info");
                          }
                        })}
                          title="Supprimer cette ligne"
                          style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#ccc",padding:"2px",flexShrink:0}}
                          onMouseEnter={e=>e.target.style.color="#c04040"}
                          onMouseLeave={e=>e.target.style.color="#ccc"}>🗑</button>
                      )}
                    </div>
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
                      <td colSpan={3} style={{padding:"6px 10px",borderBottom:bsep,fontSize:12,background:"#f7f7f5",minWidth:320,width:320,
                        position:"sticky",left:0,zIndex:11,boxShadow:"3px 0 8px rgba(0,0,0,0.06)"}}>
                        <span style={{color:"#ccc",marginRight:4}}>↳</span>
                        <strong>{o.id.toUpperCase()}</strong>
                        <span style={{display:"inline-block",fontSize:10,padding:"1px 6px",borderRadius:3,marginLeft:6,
                          background:statBadge.bg,color:statBadge.c,fontWeight:600}}>{statBadge.l}</span>
                        <br/><span style={{color:"#aaa",fontSize:11}}>{o.label}</span>
                      </td>
                      {/* Total validé/révisé — vide pour OS */}
                      {td(null,{borderLeft:"1px solid #444"})}
                      {td(null,{background:"#fafaf8",borderRight:"1px solid #444"})}
                      {/* B1 Validé */}
                      {td(null,{borderLeft:"1px solid #ddd"})}
                      {/* B1 Révisé — affiche le report sauf si FAR (FAR va en B2') */}
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,background:"#fafaf8"}}>
                        {oRep?.report>0 && oRep?.rt!=="far"
                          ? <span style={{color:"#185FA5",fontWeight:600}}>+{fmt(oRep.report)}</span>
                          : <span style={{color:"#ccc"}}>—</span>}
                      </td>
                      {/* E OS engagés */}
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,background:"#F0F7F2",borderLeft:"1px solid #b0d8b8",color:"#185FA5",fontSize:12}}>{fmt(o.montant)}</td>
                      {/* F Facturé */}
                      <td style={{textAlign:"right",padding:"6px 10px",borderBottom:bsep,background:"#F0F7F2",fontSize:12}}>{fmt(o.facture)}</td>
                      {/* FAR */}
                      <td style={{textAlign:"right",padding:"6px 8px",borderBottom:bsep,borderLeft:"1px solid #d8b898",background:"#fdf5ee",fontSize:12,verticalAlign:"middle"}}>
                        {f>0
                          ? <div style={{display:"inline-flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                              <strong>{fmt(f)}</strong>
                              {!reviseValide && (reports[o.id]?.rt==="far"
                                ? <span style={{fontSize:9,color:"#27500A",background:"#EAF3DE",border:"0.5px solid #c0dd97",borderRadius:4,padding:"1px 6px",cursor:"pointer"}}
                                    onClick={()=>setReports(prev=>{const next={...prev};delete next[o.id];return next;})}>→ {AN(1)} ✕</span>
                                : <button onClick={()=>setReports(prev=>({...prev,[o.id]:{report:f,rt:"far"}}))}
                                    title={`Reporter les Factures À Recevoir de cet OS sur ${AN(1)} : ${fmt(f)}\nFAR = Engagé − Facturé. B2' augmentera d'autant.`}
                                    style={{fontSize:9,padding:"1px 6px",borderRadius:4,border:"0.5px solid #d8b898",background:"#fff3e8",color:"#8a4020",cursor:"pointer",fontWeight:600}}>→ {AN(1)}</button>
                              )}
                            </div>
                          : <span style={{color:"#ccc"}}>—</span>}
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
                      <td colSpan={3} style={{padding:"5px 10px",borderBottom:bsepH,fontSize:11,color:"#666",minWidth:320,width:320,
                        background:"#f0f0f8",position:"sticky",left:0,zIndex:11,boxShadow:"3px 0 8px rgba(0,0,0,0.06)"}}>
                        <span style={{color:"#aaa",marginRight:4}}>📅</span>
                        <strong style={{color:"#185FA5"}}>{h.annee}</strong>
                        <span style={{color:"#aaa",fontSize:10,marginLeft:6}}>historique</span>
                      </td>
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
              <td colSpan={3} style={{padding:"9px 10px",borderBottom:"none",fontWeight:700,fontSize:14,background:"#1a1a18",minWidth:320,width:320,
                position:"sticky",left:0,zIndex:20,boxShadow:"3px 0 8px rgba(0,0,0,0.2)"}}>Total</td>
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

      {/* FAB — bouton flottant d'ajout d'opération, toujours visible même au scroll */}
      <button
        onClick={()=>setAddLineModal(true)}
        title="Ajouter une opération CAPEX"
        style={{
          position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:999,
          width:52, height:52, borderRadius:"50%",
          background:"#185FA5", color:"#fff",
          border:"none", cursor:"pointer",
          fontSize:26, fontWeight:300, lineHeight:1,
          boxShadow:"0 4px 16px rgba(24,95,165,0.35)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateX(-50%) scale(1.1)";e.currentTarget.style.boxShadow="0 6px 20px rgba(24,95,165,0.45)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="translateX(-50%) scale(1)";e.currentTarget.style.boxShadow="0 4px 16px rgba(24,95,165,0.35)";}}
      >+</button>

    </div>
  );
}
