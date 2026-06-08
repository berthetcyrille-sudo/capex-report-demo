import { useState } from "react";

const CAPEX_DATA = [
  { id:"pac",     label:"Remplacement PAC",                   sub:"CVC · Génie climatique",         type:"DTQ", budget:1200, os_total:980,  facture:740, budgetN1:800,
    os:[{id:"os041",label:"Dépose PAC + désamiantage",               montant:240,facture:240,statut:"solde"},
        {id:"os058",label:"Fourniture et pose PAC + GRS",             montant:740,facture:500,statut:"cours"}]},
  { id:"facade",  label:"Ravalement façades",                 sub:"Enveloppe · Gros œuvre",         type:"DEV", budget:900,  os_total:900,  facture:510, budgetN1:600,
    os:[{id:"os062",label:"Échafaudage + ravalement pierre de taille",montant:900,facture:510,statut:"cours"}]},
  { id:"toiture", label:"Réfection toiture terrasse",         sub:"Enveloppe · Étanchéité",         type:"DTQ", budget:780,  os_total:420,  facture:280, budgetN1:300,
    os:[{id:"os071",label:"Étanchéité bicouche + isolation ITE",     montant:420,facture:280,statut:"cours"}]},
  { id:"ascens",  label:"Remplacement ascenseurs",            sub:"Équipements · Mise aux normes",  type:"DTQ", budget:640,  os_total:390,  facture:190, budgetN1:450,
    os:[{id:"os074",label:"Dépose + fourniture 2 ascenseurs OTIS",   montant:390,facture:190,statut:"cours"}]},
  { id:"elec",    label:"Mise aux normes électriques",        sub:"Équipements · Réglementaire",    type:"DTQ", budget:520,  os_total:330,  facture:100, budgetN1:200,
    os:[{id:"os076",label:"TGBT + câblage divisionnaire RJ45",       montant:330,facture:100,statut:"cours"}]},
  { id:"lobby",   label:"Rénovation hall & parties communes", sub:"Aménagement · Repositionnement", type:"DEV", budget:780,  os_total:220,  facture:50,  budgetN1:900,
    os:[{id:"os079",label:"MOE + études de conception hall",          montant:220,facture:50, statut:"tardif"}]},
];

const TIPS = {
  ne:       "Reporter en N+1 le budget qui n'a pas fait l'objet d'OS : solde budgétaire non couvert par un ordre de service à la date de situation (A − B). Nécessite validation DAF.",
  far:      "Reporter en N+1 le montant des factures à recevoir sur des OS émis (FAR) : montant des OS ouverts diminué des factures déjà comptabilisées (B − C). Ces sommes sont juridiquement engagées.",
  bmf:      "Reporter en N+1 le budget qui n'a pas fait l'objet de facture : Budget N moins les factures déjà comptabilisées (A − C). Inclut les FAR et le solde non engagé par OS.",
  manu:     "Reporter en N+1 un montant saisi manuellement. Utile pour un arbitrage partiel lorsque le report ne correspond pas à l'un des calculs automatiques.",
  conserve: "Saisir le budget complémentaire à conserver en N (hors factures déjà comptabilisées, qui restent en N par définition). Le solde restant sera automatiquement reporté en N+1. Exemple : si le budget est de 1 000 000 €, que 300 000 € sont déjà facturés et que vous saisissez 200 000 € à conserver, alors 500 000 € seront reportés en N+1.",
  reset:    "Annuler toutes les actions de report sur cette ligne et remettre la situation à l'état initial.",
};

const calcFar   = (o) => Math.max(0, o.montant - o.facture);
const calcNe    = (a) => Math.max(0, a.budget - a.os_total);
const calcTfar  = (a) => a.os.reduce((s, o) => s + calcFar(o), 0);
const calcDispo = (a) => calcNe(a) + calcTfar(a);
const calcBmf   = (a) => Math.max(0, a.budget - a.facture); // Budget − Facturé
const fmt = (n) => (n * 1000).toLocaleString("fr-FR", { style:"currency", currency:"EUR", maximumFractionDigits:0 });

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position:"relative", display:"inline-flex", marginLeft:"auto", flexShrink:0 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ fontSize:13, color:"#aaa", cursor:"default" }}>ⓘ</span>
      {show && (
        <div style={{ position:"absolute", right:20, top:0, width:210, background:"#fff", border:"0.5px solid #ccc",
          borderRadius:8, padding:"8px 10px", fontSize:11, color:"#555", lineHeight:1.5, zIndex:9999,
          boxShadow:"0 4px 16px rgba(0,0,0,.12)", whiteSpace:"normal" }}>
          {text}
        </div>
      )}
    </span>
  );
}

function CtxItem({ label, tipKey, onClick, danger, children }) {
  return (
    <>
      <div onClick={onClick}
        style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"7px 12px", cursor:"pointer",
          fontSize:12, position:"relative", color: danger ? "#A32D2D" : "inherit" }}
        onMouseEnter={e => e.currentTarget.style.background = "#f5f5f3"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <div style={{ flex:1, fontWeight:500, lineHeight:1.3 }}>{label}</div>
        <Tooltip text={TIPS[tipKey]} />
      </div>
      {children}
    </>
  );
}

function InputRow({ label, onApply, max }) {
  const [raw, setRaw] = useState("");
  const saisi = parseInt(raw.replace(/\s/g, "")) || 0;
  const overMax = max !== undefined && saisi > max;

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const num = parseInt(digits) || 0;
    setRaw(num > 0 ? num.toLocaleString("fr-FR") : "");
  };

  return (
    <div style={{ padding:"4px 12px 8px 12px", flexWrap:"wrap" }} onClick={e => e.stopPropagation()}>
      <label style={{ fontSize:11, color:"#666", display:"block", marginBottom:4 }}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input type="text" inputMode="numeric" value={raw} onChange={handleChange}
          onClick={e => e.stopPropagation()}
          placeholder="ex : 50 000"
          style={{ width:120, fontSize:12, padding:"2px 6px", textAlign:"right", borderRadius:4, outline:"none",
            border: overMax ? "1.5px solid #C0392B" : "0.5px solid #ccc",
            color: overMax ? "#C0392B" : "inherit",
            background: overMax ? "#FEF0EF" : "inherit" }} />
        {overMax && <span style={{ fontSize:11, color:"#C0392B", fontWeight:500 }}>⚠ dépassement</span>}
        <button onClick={e => { e.stopPropagation(); if (!overMax) { onApply(saisi); setRaw(""); } }}
          style={{ fontSize:11, padding:"2px 8px", borderRadius:4, cursor: overMax ? "not-allowed" : "pointer",
            border:"0.5px solid #ccc", background: overMax ? "#eee" : "#f0efe9",
            color: overMax ? "#aaa" : "inherit", opacity: overMax ? 0.6 : 1 }}>OK</button>
      </div>
    </div>
  );
}

function InputRowConserve({ facture, budget, onApply }) {
  const [raw, setRaw] = useState("");  // stocke la saisie brute sans espaces
  const saisi = parseInt(raw.replace(/\s/g, "")) || 0;
  const factureEur = facture * 1000;
  const reporte = Math.max(0, budget * 1000 - factureEur - saisi);
  const fmtE = (n) => n.toLocaleString("fr-FR", { style:"currency", currency:"EUR", maximumFractionDigits:0 });

  const handleChange = (e) => {
    // Enlève tout sauf chiffres, reformate avec séparateurs
    const digits = e.target.value.replace(/\D/g, "");
    const num = parseInt(digits) || 0;
    setRaw(num > 0 ? num.toLocaleString("fr-FR") : "");
  };

  return (
    <div style={{ padding:"6px 12px 10px 12px", background:"#fdfcf8", borderTop:"0.5px solid #f0ede0" }}
      onClick={e => e.stopPropagation()}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, flexWrap:"wrap" }}>
        <label style={{ fontSize:11, color:"#666" }}>Budget complémentaire à conserver en N (€), hors facturé :</label>
        <input type="text" inputMode="numeric" value={raw} onChange={handleChange}
          onClick={e => e.stopPropagation()}
          placeholder="ex : 50 000"
          style={{ width:110, fontSize:12, padding:"2px 6px", border:"0.5px solid #ccc", borderRadius:4, textAlign:"right" }} />
        <button onClick={e => { e.stopPropagation(); onApply(saisi); setRaw(""); }}
          style={{ fontSize:11, padding:"2px 8px", borderRadius:4, border:"0.5px solid #ccc",
            background:"#f0efe9", cursor:"pointer" }}>OK</button>
      </div>
      {/* Récapitulatif dynamique */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, fontSize:11 }}>
        <div style={{ background:"#F0F7F2", borderRadius:6, padding:"6px 8px" }}>
          <div style={{ color:"#3A7A4A", fontWeight:600, marginBottom:2 }}>Déjà facturé</div>
          <div style={{ color:"#1a1a18", fontWeight:500 }}>{fmtE(factureEur)}</div>
          <div style={{ color:"#aaa", fontSize:10 }}>conservé en N (EVEN)</div>
        </div>
        <div style={{ background: saisi > 0 ? "#fff8ee" : "#f7f7f5", borderRadius:6, padding:"6px 8px" }}>
          <div style={{ color:"#c08030", fontWeight:600, marginBottom:2 }}>+ Budget saisi</div>
          <div style={{ color: saisi > 0 ? "#b05000" : "#bbb", fontWeight:500 }}>{saisi > 0 ? fmtE(saisi) : "—"}</div>
          <div style={{ color:"#aaa", fontSize:10 }}>à conserver en N</div>
        </div>
        <div style={{ background: saisi > 0 ? "#fff3e0" : "#f7f7f5", borderRadius:6, padding:"6px 8px", borderTop: saisi > 0 ? "2px solid #e0a040" : "2px solid #eee" }}>
          <div style={{ color:"#b05000", fontWeight:600, marginBottom:2 }}>= Total conservé N</div>
          <div style={{ color: saisi > 0 ? "#b05000" : "#bbb", fontWeight:600 }}>{saisi > 0 ? fmtE(factureEur + saisi) : "—"}</div>
          <div style={{ color:"#aaa", fontSize:10 }}>facturé + saisi</div>
        </div>
        <div style={{ background: saisi > 0 ? "#EAF1FF" : "#f7f7f5", borderRadius:6, padding:"6px 8px", borderTop: saisi > 0 ? "2px solid #4070CC" : "2px solid #eee" }}>
          <div style={{ color:"#185FA5", fontWeight:600, marginBottom:2 }}>→ Report N+1</div>
          <div style={{ color: reporte > 0 ? "#185FA5" : "#bbb", fontWeight:600 }}>{saisi > 0 ? fmtE(reporte) : "—"}</div>
          <div style={{ color:"#aaa", fontSize:10 }}>budget − total conservé</div>
        </div>
      </div>
    </div>
  );
}

function CtxMenu({ a, reports, setReports, toast }) {
  const [open, setOpen] = useState(false);
  const [showManu, setShowManu] = useState(false);
  const [showConserve, setShowConserve] = useState(false);

  const aNE = calcNe(a);
  const tf  = calcTfar(a);
  const tot = calcDispo(a);
  const bmf = calcBmf(a);
  const hasReport = reports[a.id]?.report > 0 || a.os.some(o => reports[o.id]?.report > 0);

  const apply = (type, val) => {
    setOpen(false); setShowManu(false); setShowConserve(false);
    setReports(prev => {
      const next = { ...prev };
      if (type === "ne")       { next[a.id] = { report: aNE, rt: "ne" }; toast(`${a.label} — ${fmt(aNE)} non engagés reportés.`, "warning"); }
      if (type === "far")      { a.os.forEach(o => { if (calcFar(o) > 0) next[o.id] = { report: calcFar(o), rt: "report" }; }); next[a.id] = { ...(next[a.id]||{}), rt: "far" }; toast(`${a.label} — ${fmt(tf)} de FAR reportés.`, "info"); }
      if (type === "bmf")      { next[a.id] = { report: bmf, rt: "bmf" }; toast(`${a.label} — ${fmt(bmf)} (Budget − Facturé) reportés.`, "info"); }
      if (type === "manu")     { if (val <= 0 || val > bmf) { toast(`Montant invalide. Le report ne peut pas dépasser le budget non facturé : ${fmt(bmf)}.`, "err"); return prev; } next[a.id] = { report: val, rt: "manu" }; toast(`${a.label} — ${fmt(val)} saisis.`, "info"); }
      if (type === "conserve") { const r = Math.max(0, a.budget - a.facture - val); if (!r) { toast(`Solde à reporter = 0.`, "warning"); return prev; } next[a.id] = { report: r, rt: "conserve" }; toast(`${a.label} — ${fmt(val)} conservés en N, ${fmt(r)} reportés en N+1.`, "info"); }
      if (type === "reset")    { delete next[a.id]; a.os.forEach(o => delete next[o.id]); toast(`${a.label} — report annulé.`, "info"); }
      return next;
    });
  };

  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ background:"none", border:"0.5px solid #ddd", borderRadius:6, cursor:"pointer",
          padding:"3px 7px", fontSize:12, color:"#888" }}>⋮</button>
      {open && (
        <>
          <div onClick={() => { setOpen(false); setShowManu(false); setShowConserve(false); }}
            style={{ position:"fixed", inset:0, zIndex:9998 }} />
          <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", width:290, background:"#fff",
            border:"0.5px solid #ccc", borderRadius:10, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,.12)" }}>
          <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".07em",
            color:"#999", padding:"8px 12px 4px" }}>{a.label.slice(0,30)}</div>
          <div style={{ fontSize:11, fontWeight:600, color:"#555", padding:"8px 12px 4px 12px", borderTop:"0.5px solid #eee", marginTop:2 }}>
            Reporter en N+1 :
          </div>
          {aNE > 0 && <CtxItem label={`Budget sans OS (${fmt(aNE)})`} tipKey="ne" onClick={() => apply("ne")} />}
          {tf  > 0 && <CtxItem label={`FAR sur OS émis (${fmt(tf)})`} tipKey="far" onClick={() => apply("far")} />}
          {bmf > 0 && <CtxItem label={`Budget non facturé A−C (${fmt(bmf)})`} tipKey="bmf" onClick={() => apply("bmf")} />}
          {tot > 0 && <>
            <CtxItem label="Montant saisi manuellement" tipKey="manu" onClick={() => setShowManu(s => !s)} />
            {showManu && <InputRow label={`Montant à reporter (€) — max ${fmt(bmf)} :`} max={bmf*1000} onApply={v => apply("manu", Math.round(v/1000))} />}
          </>}
          <hr style={{ border:"none", borderTop:"0.5px solid #eee", margin:"4px 0" }} />
          {tot > 0 && <>
            <CtxItem label="Saisir le budget complémentaire à conserver en N et reporter le solde en N+1" tipKey="conserve" onClick={() => setShowConserve(s => !s)} />
            {showConserve && <InputRowConserve facture={a.facture} budget={a.budget} onApply={v => apply("conserve", Math.round(v/1000))} />}
          </>}
          {hasReport && <>
            <hr style={{ border:"none", borderTop:"0.5px solid #eee", margin:"2px 0" }} />
            <CtxItem label="Annuler le report" tipKey="reset" onClick={() => apply("reset")} danger />
          </>}
        </div>
        </>
      )}
    </div>
  );
}

function OsCtxMenu({ o, reports, setReports, toast }) {
  const [open, setOpen] = useState(false);
  const f = calcFar(o);
  const hasReport = reports[o.id]?.report > 0;

  const apply = (type) => {
    setOpen(false);
    setReports(prev => {
      const next = { ...prev };
      if (type === "far")    { next[o.id] = { report: f, rt: "report" }; toast(`${o.id.toUpperCase()} — ${fmt(f)} reportés.`, "info"); }
      if (type === "tardif") { next[o.id] = { ...(next[o.id]||{}), rt: "tardif" }; toast(`${o.id.toUpperCase()} — démarrage tardif signalé.`, "warning"); }
      if (type === "solde")  { toast(`${o.id.toUpperCase()} — soldé confirmé.`, "success"); }
      if (type === "reset")  { delete next[o.id]; toast(`${o.id.toUpperCase()} — report annulé.`, "info"); }
      return next;
    });
  };

  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{ background:"none", border:"0.5px solid #ddd", borderRadius:6, cursor:"pointer",
          padding:"3px 7px", fontSize:12, color:"#888" }}>⋮</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)}
            style={{ position:"fixed", inset:0, zIndex:9998 }} />
          <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", width:270, background:"#fff",
            border:"0.5px solid #ccc", borderRadius:10, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,.12)" }}>
            <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".07em",
              color:"#999", padding:"8px 12px 4px" }}>{o.id.toUpperCase()}</div>
            {f > 0    && <CtxItem label={`Reporter en N+1 — FAR sur cet OS (${fmt(f)})`} tipKey="far" onClick={() => apply("far")} />}
            {o.statut === "tardif" && <CtxItem label="Signaler démarrage tardif" tipKey="far" onClick={() => apply("tardif")} />}
            {o.statut === "solde"  && <CtxItem label="Confirmer clôture OS" tipKey="far" onClick={() => apply("solde")} />}
            {hasReport && <>
              <hr style={{ border:"none", borderTop:"0.5px solid #eee", margin:"2px 0" }} />
              <CtxItem label="Annuler le report" tipKey="reset" onClick={() => apply("reset")} danger />
            </>}
          </div>
        </>
      )}
    </div>
  );
}

const TH = ({ children, right, width, tip }) => (
  <th style={{ textAlign: right ? "right" : "left", fontSize:11, fontWeight:500, color:"#888",
    padding:"6px 10px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap", width }}>
    {children}
  </th>
);

const TD = ({ children, right, muted, style={} }) => (
  <td style={{ padding:"8px 10px", borderBottom:"0.5px solid #eee", verticalAlign:"middle",
    textAlign: right ? "right" : "left", color: muted ? "#ccc" : "inherit", fontSize:13, ...style }}>
    {children}
  </td>
);

// Calcule le report total d'un actif (propre + OS enfants)
function calcTotalReport(a, reports) {
  const ar = reports[a.id]?.report || 0;
  const osr = a.os.reduce((s, o) => s + (reports[o.id]?.report || 0), 0);
  return ar + osr;
}

export default function App() {
  const [expanded, setExpanded] = useState(new Set());
  const [reports, setReports] = useState({});
  const [toastMsg, setToastMsg] = useState(null);
  const [overrides, setOverrides] = useState({}); // { [id]: { revise?: number, n1final?: number } }
  const [editing, setEditing] = useState(null);   // { id, col } — cellule en cours d'édition

  const toast = (msg, type) => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const toggleExpand = (id) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const totalBudget  = CAPEX_DATA.reduce((s,a) => s + a.budget, 0);
  const totalOS      = CAPEX_DATA.reduce((s,a) => s + a.os_total, 0);
  const totalFac     = CAPEX_DATA.reduce((s,a) => s + a.facture, 0);
  const totalFAR     = CAPEX_DATA.reduce((s,a) => s + calcTfar(a), 0);
  const totalNE      = CAPEX_DATA.reduce((s,a) => s + calcNe(a), 0);
  const totalBudN1   = CAPEX_DATA.reduce((s,a) => s + a.budgetN1, 0);
  const totalReport  = CAPEX_DATA.reduce((s,a) => s + calcTotalReport(a, reports), 0);
  const totalBudRevise = CAPEX_DATA.reduce((s,a) => s + (a.budget - calcTotalReport(a, reports)), 0);
  const totalBudN1F    = CAPEX_DATA.reduce((s,a) => s + (overrides[a.id]?.n1final ?? (a.budgetN1 + calcTotalReport(a, reports))), 0);

  const toastColors = {
    info:    "#0C447C|#E6F1FB|#B5D4F4",
    warning: "#633806|#FAEEDA|#FAC775",
    success: "#27500A|#EAF3DE|#C0DD97",
    err:     "#791F1F|#FCEBEB|#F7C1C1",
  };

  const thStyle = { textAlign:"left", fontSize:11, fontWeight:500, color:"#888",
    padding:"6px 10px", borderBottom:"0.5px solid #eee", whiteSpace:"nowrap" };

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding:"1rem 2rem", color:"#1a1a18" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:500 }}>Budget CAPEX — Année N</div>
          <div style={{ fontSize:13, color:"#888", marginTop:2 }}>Situation au 30 septembre N · 6 opérations</div>
        </div>
        <span style={{ fontSize:11, background:"#f0efe9", border:"0.5px solid #ddd", borderRadius:20, padding:"3px 10px", color:"#888" }}>Démo SNK</span>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:"1.25rem" }}>
        {[
          { label:"Budget N voté",           value:"4 820 000 €",                       sub:"construit en N-1",       color:"inherit" },
          { label:"OS ouverts (engagés)",    value:"3 240 000 €",                       sub:"67% du budget",          color:"#185FA5" },
          { label:"Factures comptabilisées", value:"1 870 000 €",                       sub:"58% des OS",             color:"#3B6D11" },
          { label:"Budget N+1 initial",      value:fmt(totalBudN1),                     sub:"hors reports",           color:"#555"    },
          { label:"Budget N+1 avec reports", value:fmt(totalBudN1F),                    sub:`dont ${fmt(totalReport)} reportés`, color: totalReport > 0 ? "#185FA5" : "#aaa" },
        ].map(k => (
          <div key={k.label} style={{ background:"#f7f7f5", borderRadius:8, padding:"1rem" }}>
            <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:18, fontWeight:500, color:k.color }}>{k.value}</div>
            <div style={{ fontSize:11, color:"#aaa", marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toastMsg && (() => {
        const [c,bg,bc] = (toastColors[toastMsg.type]||toastColors.info).split("|");
        return <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 13px", borderRadius:8,
          fontSize:12, marginBottom:12, border:`0.5px solid ${bc}`, background:bg, color:c }}>
          {toastMsg.msg}
        </div>;
      })()}

      {/* Table */}
      <div style={{ background:"#fff", border:"0.5px solid #eee", borderRadius:12 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width:32 }}></th>
              <th style={thStyle}>Opération / OS</th>
              <th style={{ ...thStyle, width:58 }}>Clé</th>
              <th style={{ ...thStyle, textAlign:"right", width:90 }}>
                <span style={{ color:"#bbb", fontSize:10 }}>(A)</span><br/>Budget N
              </th>
              <th style={{ ...thStyle, textAlign:"right", width:90, background:"#F0F7F2", borderLeft:"1px solid #D4EAD8" }}>
                <span style={{ color:"#3A7A4A", fontSize:9, fontWeight:600, letterSpacing:".05em" }}>EVEN</span><br/>
                <span style={{ color:"#3A7A4A", fontSize:10 }}>(B)</span>&nbsp;OS engagés
              </th>
              <th style={{ ...thStyle, textAlign:"right", width:80, background:"#F0F7F2" }}>
                <span style={{ color:"#3A7A4A", fontSize:9, fontWeight:600, letterSpacing:".05em" }}>EVEN</span><br/>
                <span style={{ color:"#3A7A4A", fontSize:10 }}>(C)</span>&nbsp;<span title="Factures comptabilisées" style={{ cursor:"help", borderBottom:"1px dashed #88BB88" }}>Facturé</span>
              </th>
              <th style={{ ...thStyle, textAlign:"right", width:75 }}>
                <span style={{ color:"#bbb", fontSize:10 }}>(D)=B−C</span><br/>
                <span title="Factures à recevoir : montant restant à facturer sur les OS ouverts (OS engagés − factures comptabilisées)" style={{ cursor:"help", borderBottom:"1px dashed #ccc" }}>FAR</span>
              </th>
              <th style={{ ...thStyle, textAlign:"right", width:85 }}>
                <span style={{ color:"#bbb", fontSize:10 }}>(E)=A−B</span><br/>
                <span title="Solde budgétaire non couvert par un OS à la date de situation : budget voté moins total des OS ouverts" style={{ cursor:"help", borderBottom:"1px dashed #ccc" }}>Non engagé</span>
              </th>
              <th style={{ ...thStyle, textAlign:"right", width:100, borderLeft:"1px solid #e0e0e0", background:"#fff8f0" }}>
                <span style={{ color:"#c08030", fontSize:10 }}>(G)=A−C−reports</span><br/>
                <span title="Budget N restant à consommer : Budget voté (A) − Factures comptabilisées (C) − Montant reporté en N+1" style={{ cursor:"help", borderBottom:"1px dashed #e0b060" }}>Budget N révisé</span>
              </th>
              <th style={{ ...thStyle, textAlign:"right", width:110, background:"#f9f9f7" }}>
                <span style={{ color:"#bbb", fontSize:10 }}>(F)</span><br/>Budget N+1 init.
              </th>
              <th style={{ ...thStyle, textAlign:"right", width:120, background:"#f0f5ff" }}>
                <span style={{ color:"#7090CC", fontSize:10 }}>(F) + reports</span><br/>Budget N+1 final
              </th>
              <th style={{ ...thStyle, width:36, background:"#f0f5ff" }}></th>
            </tr>
          </thead>
          <tbody>
            {CAPEX_DATA.map((a, ai) => {
              const aNE     = calcNe(a);
              const tf      = calcTfar(a);
              const rep     = reports[a.id];
              const totalRep = calcTotalReport(a, reports);
              const budN1Final = a.budgetN1 + totalRep;
              const isLast  = ai === CAPEX_DATA.length - 1;
              const hlBg    = rep?.rt === "ne" ? "#fdf3e3" : (rep?.rt==="far"||rep?.rt==="total") ? "#eaf8f3" : (rep?.rt==="manu"||rep?.rt==="conserve") ? "#E8F1FC" : "transparent";

              return [
                <tr key={a.id} style={{ background:hlBg }}>
                  <td style={{ padding:"8px 10px", borderBottom: isLast && !expanded.has(a.id) ? "none" : "0.5px solid #eee", verticalAlign:"middle" }}>
                    <button onClick={() => toggleExpand(a.id)}
                      style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px",
                        color:"#aaa", fontSize:14, transform: expanded.has(a.id) ? "rotate(90deg)" : "none",
                        transition:"transform .15s", display:"inline-flex", alignItems:"center" }}>›</button>
                  </td>
                  <TD><strong>{a.label}</strong><br/><span style={{ color:"#aaa", fontSize:11 }}>{a.sub}</span></TD>
                  <TD>
                    <span style={{ display:"inline-block", fontSize:11, padding:"2px 7px", borderRadius:4, fontWeight:500,
                      background: a.type==="DTQ" ? "#E6F1FB" : "#EEEDFE",
                      color:      a.type==="DTQ" ? "#0C447C" : "#3C3489" }}>{a.type}</span>
                  </TD>
                  <TD right>{fmt(a.budget)}</TD>
                  <TD right style={{ color:"#185FA5", background:"#F0F7F2" }}>{fmt(a.os_total)}</TD>
                  <TD right style={{ background:"#F0F7F2" }}>{fmt(a.facture)}</TD>
                  <TD right>{tf > 0 ? fmt(tf) : <span style={{color:"#ccc"}}>—</span>}</TD>
                  <TD right>{aNE > 0 ? fmt(aNE) : <span style={{color:"#ccc"}}>0 €</span>}</TD>
                  {(() => {
                    const calcVal = rep?.rt === "conserve"
                      ? a.facture + (a.budget - a.facture - totalRep)  // facturé + saisi conservé
                      : a.budget - totalRep;                            // budget − report pour toutes les autres actions
                    const isManual = overrides[a.id]?.revise !== undefined;
                    const isEdit = editing?.id === a.id && editing?.col === "revise";
                    const hasReport = totalRep > 0 || isManual;
                    return (
                      <td style={{ padding:"4px 10px", borderBottom: isLast && !expanded.has(a.id) ? "none" : "0.5px solid #eee",
                        textAlign:"right", verticalAlign:"middle", borderLeft:"1px solid #e8e8e8",
                        background: isManual ? "#fff8ee" : totalRep > 0 ? "#fff3e0" : "#fffcf8",
                        cursor: hasReport ? "pointer" : "default" }}
                        title={hasReport ? "Double-cliquez pour saisir manuellement" : ""}
                        onDoubleClick={() => hasReport && setEditing({ id: a.id, col: "revise" })}>
                        {isEdit ? (
                          <input autoFocus type="number"
                            defaultValue={calcVal}
                            onBlur={e => {
                              const v = parseInt(e.target.value);
                              if (!isNaN(v)) setOverrides(p => ({ ...p, [a.id]: { ...p[a.id], revise: v } }));
                              setEditing(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") e.target.blur();
                              if (e.key === "Escape") setEditing(null);
                            }}
                            style={{ width:70, textAlign:"right", fontSize:12, padding:"2px 4px",
                              border:"1px solid #185FA5", borderRadius:4, outline:"none" }} />
                        ) : hasReport ? (
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:1 }}>
                            <span style={{ color:"#b05000", fontWeight:600 }}>{fmt(calcVal)}</span>
                            {isManual
                              ? <span style={{ fontSize:9, color:"#c08030" }}>✎ saisi manuellement</span>
                              : rep?.rt === "conserve"
                              ? <span style={{ fontSize:10, color:"#c08030" }}>{fmt(a.facture)} + {fmt(a.budget - a.facture - totalRep)}</span>
                              : <span style={{ fontSize:10, color:"#c08030" }}>{fmt(a.budget)} − {fmt(totalRep)}</span>}
                          </div>
                        ) : (
                          <span style={{ color:"#ccc" }}>—</span>
                        )}
                      </td>
                    );
                  })()}
                  {/* Budget N+1 initial */}
                  <TD right style={{ background: hlBg === "transparent" ? "#fafaf8" : hlBg, color:"#555" }}>
                    {fmt(a.budgetN1)}
                  </TD>
                  {/* Budget N+1 final — éditable */}
                  {(() => {
                    const calcVal = a.budgetN1 + totalRep;
                    const val = overrides[a.id]?.n1final ?? calcVal;
                    const isManual = overrides[a.id]?.n1final !== undefined;
                    const isEdit = editing?.id === a.id && editing?.col === "n1final";
                    const rt = reports[a.id]?.rt;
                    const rtLabels = { far:"FAR", ne:"NE", bmf:"B−F", manu:"MANUEL", conserve:"SOLDE" };
                    const rtColors = { far:"#27500A|#EAF3DE", ne:"#854F0B|#FAEEDA", bmf:"#5C3D00|#FEF0D0", manu:"#0C447C|#E6F1FB", conserve:"#0C447C|#E6F1FB" };
                    const [c, bg] = (rtColors[rt] || "#555|#eee").split("|");
                    return (
                      <td style={{ padding:"4px 10px", borderBottom: isLast && !expanded.has(a.id) ? "none" : "0.5px solid #eee",
                        textAlign:"right", verticalAlign:"middle",
                        background: isManual ? "#e8f0ff" : totalRep > 0 ? "#EAF1FF" : "#f4f7ff",
                        cursor:"pointer", fontWeight: (isManual||totalRep>0) ? 600 : 400 }}
                        title="Double-cliquez pour saisir manuellement"
                        onDoubleClick={() => setEditing({ id: a.id, col: "n1final" })}>
                        {isEdit ? (
                          <input autoFocus type="number"
                            defaultValue={val}
                            onBlur={e => {
                              const v = parseInt(e.target.value);
                              if (!isNaN(v)) setOverrides(p => ({ ...p, [a.id]: { ...p[a.id], n1final: v } }));
                              setEditing(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") e.target.blur();
                              if (e.key === "Escape") setEditing(null);
                            }}
                            style={{ width:70, textAlign:"right", fontSize:12, padding:"2px 4px",
                              border:"1px solid #185FA5", borderRadius:4, outline:"none" }} />
                        ) : (
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
                            <span style={{ color: isManual ? "#185FA5" : totalRep > 0 ? "#185FA5" : "#888" }}>{fmt(val)}</span>
                            {isManual
                              ? <span style={{ fontSize:9, color:"#7090CC" }}>✎ saisi manuellement</span>
                              : totalRep > 0 && <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                  <span style={{ fontSize:10, color:"#7090CC" }}>+{fmt(totalRep)}</span>
                                  {rt && rtLabels[rt] && <span style={{ fontSize:9, padding:"1px 4px", borderRadius:3, background:bg, color:c, fontWeight:700 }}>{rtLabels[rt]}</span>}
                                </div>}
                          </div>
                        )}
                      </td>
                    );
                  })()}
                  <td style={{ padding:"8px 6px", borderBottom: isLast && !expanded.has(a.id) ? "none" : "0.5px solid #eee",
                    verticalAlign:"middle", textAlign:"right", background: totalRep > 0 ? "#EAF1FF" : "#f4f7ff" }}>
                    <CtxMenu a={a} reports={reports} setReports={setReports} toast={toast} />
                  </td>
                </tr>,

                ...( expanded.has(a.id) ? a.os.map((o, oi) => {
                  const f = calcFar(o);
                  const oRep = reports[o.id];
                  const oReport = oRep?.report || 0;
                  const isLastOs = oi === a.os.length - 1;
                  const oHlBg = oRep?.rt === "report" ? "#eaf8f3" : oRep?.rt === "tardif" ? "#fdf3e3" : "#f7f7f5";
                  const statBadge = o.statut==="solde"
                    ? { label:"Soldé",    bg:"#EAF3DE", c:"#27500A" }
                    : o.statut==="tardif"
                    ? { label:"Tardif",   bg:"#FAEEDA", c:"#633806" }
                    : { label:"En cours", bg:"#E6F1FB", c:"#185FA5" };
                  const bsep = isLast && isLastOs ? "none" : "0.5px solid #eee";
                  return (
                    <tr key={o.id} style={{ background:oHlBg }}>
                      <td style={{ padding:"6px 10px", borderBottom:bsep }}></td>
                      <td style={{ padding:"6px 10px", borderBottom:bsep, verticalAlign:"middle", fontSize:12 }}>
                        <span style={{ color:"#ccc", marginRight:4 }}>↳</span>
                        <strong>{o.id.toUpperCase()}</strong>
                        <span style={{ display:"inline-block", fontSize:10, padding:"1px 6px", borderRadius:3, marginLeft:6,
                          background:statBadge.bg, color:statBadge.c, fontWeight:600 }}>{statBadge.label}</span>
                        <br/><span style={{ color:"#aaa", fontSize:11 }}>{o.label}</span>
                      </td>
                      <td style={{ borderBottom:bsep }}></td>
                      <td style={{ textAlign:"right", color:"#ccc", fontSize:13, padding:"6px 10px", borderBottom:bsep }}>—</td>
                      <td style={{ textAlign:"right", color:"#185FA5", fontSize:13, padding:"6px 10px", borderBottom:bsep, background:"#F0F7F2" }}>{fmt(o.montant)}</td>
                      <td style={{ textAlign:"right", fontSize:13, padding:"6px 10px", borderBottom:bsep, background:"#F0F7F2" }}>{fmt(o.facture)}</td>
                      <td style={{ textAlign:"right", fontSize:13, padding:"6px 10px", borderBottom:bsep }}>
                        {f > 0 ? <strong>{fmt(f)}</strong> : <span style={{color:"#ccc"}}>—</span>}
                      </td>
                      <td style={{ textAlign:"right", color:"#ccc", fontSize:13, padding:"6px 10px", borderBottom:bsep }}>—</td>
                      <td style={{ textAlign:"right", color:"#ccc", fontSize:13, padding:"6px 10px", borderBottom:bsep, borderLeft:"1px solid #e8e8e8", background:"#fffcf8" }}>—</td>
                      <td style={{ textAlign:"right", color:"#999", fontSize:12, padding:"6px 10px", borderBottom:bsep, background:"#fafaf8" }}>—</td>
                      <td style={{ textAlign:"right", fontSize:12, padding:"6px 10px", borderBottom:bsep, background: oReport > 0 ? "#EAF1FF" : "#f4f7ff" }}>
                        {oReport > 0
                          ? <span style={{ color:"#185FA5", fontWeight:600 }}>+{oReport} k€ reportés</span>
                          : <span style={{ color:"#ccc" }}>—</span>}
                      </td>
                      <td style={{ borderBottom:bsep, background: oReport > 0 ? "#EAF1FF" : "#f4f7ff" }}></td>
                    </tr>
                  );
                }) : [])
              ];
            })}

            {/* Total */}
            <tr style={{ fontWeight:500, background:"#f7f7f5", borderTop:"0.5px solid #ddd" }}>
              <td style={{ padding:"9px 10px", borderBottom:"none" }}></td>
              <td style={{ padding:"9px 10px", borderBottom:"none" }}><strong>Total</strong></td>
              <td style={{ borderBottom:"none" }}></td>
              <td style={{ textAlign:"right", padding:"9px 10px", borderBottom:"none" }}><strong>{fmt(totalBudget)}</strong></td>
              <td style={{ textAlign:"right", padding:"9px 10px", borderBottom:"none", color:"#185FA5", background:"#E8F3EC", borderLeft:"1px solid #D4EAD8" }}><strong>{fmt(totalOS)}</strong></td>
              <td style={{ textAlign:"right", padding:"9px 10px", borderBottom:"none", background:"#E8F3EC" }}><strong>{fmt(totalFac)}</strong></td>
              <td style={{ textAlign:"right", padding:"9px 10px", borderBottom:"none" }}><strong>{fmt(totalFAR)}</strong></td>
              <td style={{ textAlign:"right", padding:"9px 10px", borderBottom:"none" }}><strong>{fmt(totalNE)}</strong></td>
              <td style={{ textAlign:"right", padding:"9px 10px", borderBottom:"none", borderLeft:"1px solid #e0e0e0", background: totalReport > 0 ? "#fff3e0" : "#fffcf8", color: totalReport > 0 ? "#b05000" : "#ccc" }}>
                {totalReport > 0
                  ? <><strong>{fmt(totalBudRevise)}</strong></>
                  : <span>—</span>}
              </td>
              <td style={{ textAlign:"right", padding:"9px 10px", borderBottom:"none", background:"#f9f9f7" }}><strong>{fmt(totalBudN1)}</strong></td>
              <td style={{ textAlign:"right", padding:"9px 10px", borderBottom:"none", background:"#EAF1FF", color:"#185FA5" }}>
                <strong>{fmt(totalBudN1F)}</strong>
                {totalReport > 0 && <div style={{ fontSize:10, fontWeight:400, color:"#7090CC" }}>dont {fmt(totalReport)} reportés</div>}
              </td>
              <td style={{ borderBottom:"none", background:"#EAF1FF" }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:10, fontSize:11, color:"#aaa" }}>
        FAR = Factures à recevoir · Survolez ⓘ sur chaque action pour sa définition &nbsp;·&nbsp;
        <span style={{ display:"inline-block", background:"#F0F7F2", color:"#3A7A4A", borderRadius:3, padding:"1px 6px", fontWeight:600, marginLeft:2 }}>EVEN</span>
        &nbsp;Colonnes B et C : données remontées depuis EVEN
      </div>
    </div>
  );
}
