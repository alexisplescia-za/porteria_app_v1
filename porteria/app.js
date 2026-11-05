const { useState, useEffect, useMemo, useRef, useCallback } = React;
const PROVEEDORES_FULL = [
  "A.G. Pruden & Cia. S.A.(AGP)",
  "AB Vending de Bezni A.",
  "Abl S.A.",
  "Acoustic International Group Sa (Acuflex)",
  "Aguero Lobos Joaquin Antonio (Mar cat)",
  "Aitcg S.R.L",
  "Alaniz Mauricio Daniel",
  "Alarcon Paola Carolina(Mendoza Color)",
  "Alvarez Manuel Alejandro (Green Park)",
  "Anmax Construcciones Srl",
  "Arbol Trade Marketing S.A",
  "Arenas Ascensores SRL",
  "Argental S.A.",
  "Arneg Argentina Sa",
  "Auco Construcciones SRL",
  "Autobat S.A.C.I.",
  "B.G.H. S.A. (Eco Smart)",
  "Barrionuevo Juan Domingo",
  "Barrios Ricardo Rodolfo (electromec\xE1nica Barrios)",
  "Base tres S.R.L",
  "Baterias Rom Srl (Rom)",
  "Benitez Andres Daniel",
  "Berardo S.A.S (Soluciones tecnologicas)",
  "Bertoldi Miguel (Lagrimas y sonrisas)",
  "Bertolotto Srl",
  "Blasco Daniel Eduardo",
  "Bramuglia Gustavo (Motorvial)",
  "Bras Harriott Miguel Federico (BH Maq)",
  "Burgos Adrian Daniel",
  "Campos Alba Soledad (Multiservicios Jujuy S.A)",
  "Campos Gustavo Ignacio Javier (Fornimatic)",
  "Cano Alfredo Cayetano",
  "Carciochi Pablo Enrique",
  "Carlos David Furlan",
  "Casadidio Cintia Soledad (La Industrial)",
  "Casalareina S.A",
  "Castellano Hugo Walter",
  "Castillo Vilma Dorgilia(Full Clean)",
  "Cf Ascensores",
  "Cillo Adrian Roque (soluciones frigorificas)",
  "CLP SRL",
  "Colace Marcela Elizabeth (Metco)",
  "Colormac Srl",
  "Comba Nicolas David (Servicom)",
  "Cooperativa De Trabajo Glew Limita",
  "Coradini Diego Nicolas (Cool Heat Refrig)",
  "D. Weinstock S.R.L.(DW)",
  "Dagatti Oscar Albino",
  "Daimax SA",
  "Damitech Argentina SRL",
  "Ddaj Trade Srl",
  "Del Sur Fumigaciones SRL",
  "Di Paola Maria Valeria(La serrana)",
  "Distalos Sa",
  "Dominguez Cristian Fernando (MAX Ascensores)",
  "Dosp Mendoza Sa",
  "Dumaine S.R.L.",
  "Electricidad Serrano Sa",
  "Electromantenimiento SRL",
  "Electromataderos SRL",
  "Electropelba Sa",
  "Emas S A",
  "Emda Solucion Inteligente S.A",
  "Energia Controlada Srl (Enercon)",
  "Energia Critica Af Srl",
  "Energia Global Srl",
  "Epta Argentina Sa",
  "Equipos Del Chef Sa",
  "Estructuras y Montajes Argentinos SRL (EMA)",
  "Etchegoyen Gustavo Abel",
  "Excell Argentina Srl",
  "Facility Argentina S.R.L",
  "Fernandez Daniel Sergio (Servi Frio)",
  "Ferreteria Industrial Bottero Sa",
  "Ferreteria Industrial Tc Srl",
  "Ferreyra Martin Guido (Sotec)",
  "Formas Argentinas SRL",
  "Francisco Frare S.A.",
  "Froio Jorge Ariel",
  "Galarza Claudio Daniel (AG Controles)",
  "Garcea Maria Victoria (Oliveto)",
  "Garplast S.R.L",
  "Giordano Carlos Andres (Waypack)",
  "Giovagnoli Gerardo Pedro",
  "Girboy Srl",
  "Giro Zero SAS",
  "Global Clima S.R.L.",
  "Godoy Daniel Alberto (GSI)",
  "Gonzalez Hernan Reinaldo",
  "Goyechea Claudio Bruno",
  "Greco Pablo Jesus (GP Servicios generales)",
  "Gruas San Blas S.A.",
  "Grupo Mailex S.R.L.",
  "Guerreiro Alexandra (Rocosec)",
  "Gutis Jorge Daniel",
  "H21 Construccion y logistica",
  "Haponiuk Gustavo Ernesto (Men Servicios)",
  "Hidalgo Lorena Marta",
  "Hidrobombas S.A",
  "Hidroseg S.A.S",
  "Icazatti Esteban (SAP Ascensores y Servicios)",
  "Iluminacion Buenos Aires S.A.(IBA)",
  "Imesa Sa",
  "Indesco S.A",
  "Indubel S.R.L.",
  "Industria Y Ambiente Sa",
  "Industrias Robertone S.R.L.",
  "Ingerpro S.A.",
  "Ingesys S.R.L.",
  "Instalaciones Frassone",
  "Instalmec S R L",
  "International Merchandising Solutions Sa (IMS)",
  "Ionocaptor Dms Srl",
  "Jarusz Roberto Luis",
  "Joaquin Hermida E Hijos Srl",
  "JuanBlangino S.A.",
  "Kunas SRL",
  "L & T Servicios Ambientales Srl",
  "L.M.A Industrial Sa.",
  "La Fortezza Sudamericana S.A.",
  "Llama Figueroa Juan Manuel (Iluminaci\xF3n Industrial)",
  "Llanos Walter Alejandro (Surbat)",
  "M & G Autoelevadores SRL (M y G)",
  "Magallan S.R.L.",
  "Mancilla Cerpa Francisco Ernesto(VSC)",
  "Maquiblas Servicios Integrales",
  "Matafuegos Donny Srl",
  "Mecan SRL",
  "Mehcco S.A.",
  "Mektecnia S R L",
  "Mendez Ruben Dario",
  "Metalurgica FDV SRL",
  "Mil Equipos S.A.",
  "Miloqui Fernando Pablo (Wilo)",
  "Miranda Maria Mercedes (Rodacar)",
  "Modulor Arq Y Construcciones Srl",
  "Mol & Band Sa",
  "Moran Rodrigo Ignacio (RS Soluciones)",
  "Moreno Marta Lucia (Tauro Vidrios)",
  "Morini Srl",
  "Motores Electromecanica Atlas S.A.",
  "Mundo Pesado De Gallese S.R.L.",
  "Najman Fabian Alejandro",
  "Nicolas Ricci S R L",
  "Nova Miron S.A",
  "O P Productos Y Servicios Sa",
  "Ortelli Y Cia Srl",
  "Osorio Rosa Isabel (Vivero Los Pinos)",
  "Oximetal S A C F E I",
  "Padelaco Construcciones",
  "Paneles Y Montajes Srl",
  "Papagno Daniel Carlos",
  "Paparatto Jose Alberto Cayetano (Mipron)",
  "Pauna Sa",
  "Pertile Rolando David",
  "Pinturerias Rex SA",
  "Pisos Norte S.R.L.",
  "Pittaluga Juan Ignacio (SMP)",
  "Plata Ricardo Horacio",
  "Poblet Roberto Omar",
  "Prituluk Julio Alberto",
  "Q Electric S.R.L",
  "Q Z SRL",
  "Quercia Antonio Damian",
  "RCC Construcciones S A",
  "Re-Ingenieria Empresa Constructora",
  "Refrigeracion Lope De Vega S.R.L.",
  "Refrimig S.R.L.",
  "Reld S.A.C.I.F.I.A.",
  "Repmac Sociedad Anonima (Climatizaci\xF3n Lider)",
  "Resistencias Electroargentinas Srl",
  "Rios Melina Soledad (Electro Costa)",
  "Rios Sara Otilia (Refrytec)",
  "Rivero Myriam S Del Valle",
  "Rober Cristian Jose (B.A Instalaciones)",
  "Rodados S.A. (Rosario)",
  "Rossi Adalberto Ruben (Deduplo)",
  "Rossini Luis Adrian (La casa de las heladeras)",
  "Ruedas Hofer SRL",
  "S.T.A. Sistemas Tecnolog Aplicados",
  "Saenz Ariadna Micaela (RS Servicios)",
  "Salbatierra Matias Damian (MS)",
  "Scarpati Hnos S.R.L.",
  "Schifitto Oscar Anibal",
  "Segusur Matafuegos SRL",
  "Sersewitz Ricardo Roberto (Rs construcciones)",
  "Servicios La Rumana Srl",
  "Sh Servicios Sa",
  "Sign Factory SA (Creavis)",
  "Simplia S.A",
  "Siproi S.R.L",
  "Sistemas Electrificados S.R.L",
  "Sistemas Integrados De Control Sa (Sic Transcore)",
  "Socse Latinoamerica Sa",
  "Soluciones de logistica globa SA(SLG)",
  "Solytec Srl",
  "Succi Hernan Raul (Circulo fr\xEDo)",
  "Suner Julio Ruben (Mto el\xE9ctrico)",
  "Systec USH S.A",
  "T.C.L. Sa (Alto Energy)",
  "Tecno H&D S.A (IBEL)",
  "Tecnob Srl",
  "Tecnoge Srl",
  "The Software Factory SRL(Mantech)",
  "TK Elevadores Argentina (TEKNICA Elevaci\xF3n S.A.)",
  "Toyota Material Handling Mercosur C",
  "Trading HC SAS",
  "Trane De Argentina Sa",
  "Transinland S.R.L",
  "Transporte Malvinas S.R.L",
  "Trautner Adolfo Federico",
  "Tres Colores Sociedad An\xF3nima (Del Centro Pinturer\xEDas)",
  "Ultracolor S A",
  "Uraga Ignacio Nicolas (Contra incendio)",
  "V&V Servicios y Mantenimientos S.A",
  "Velazquez Francisco Marcelino (Movi trans)",
  "Velazquez Maximiliano Gabriel",
  "Veroa (Federico Figueroa)",
  "Victor Masson Transportes Cruz del Sur",
  "Villegas Victor Daniel",
  "Woodley Jorge Milton(W Instalaciones)",
  "Xonet Automacion Srl",
  "Zalaya Ernesto Daniel (Electromec)",
  "Zapata Gustavo Adrian (KZ)",
  "4 MAR ARGENTINA S.A",
  "ABEI SAS",
  "ADETRON S.R.L.",
  "AGUAS DE CALDERAS Y CIRCUITOS S A",
  "AGUILERA FAUSTINO CESAR",
  "ALL GROUPS EVENTOS S R L",
  "BEARINGS GROUP S.A.",
  "BORIS HERMANOS SA",
  "BREMEN S.R.L.",
  "BUSTINZA JOSE MARIA",
  "CAMPOS, JUAN MANUEL",
  "CASA TRASORRAS SOCIEDAD ANONIMA",
  "CATANESE SRL",
  "CON-REST S.R.L.",
  "CONTESERVI S.R.L.",
  "DEGIORGIS SILVIA LILIANA",
  "DI GIROLAMO DIEGO GERMAN",
  "DINA FACILITY SERVICES",
  "DISTRITECNICA NORTE SRL",
  "DOLORES GAS SA",
  "DURAPLAS SRL",
  "ELECTROMECANICA BM SRL",
  "ELECTROMILENIO S.R.L.",
  "ELOLA MARCOS ADRIAN",
  "ENERGROUP SOCIEDAD ANONI",
  "EQUIPAIRE OBRAS Y SERVICIOS SRL",
  "EXA TECNOLOGIA SRL",
  "EXTRUBAND S.R.L.",
  "FALABELLA SA",
  "FERCOL LUBRICANTES S R L",
  "FORQUERA LUCAS DANIEL",
  "FRIOLATINA SA",
  "GOLOVCA PAOLO VALENTIN",
  "GRAN LIDER SRL",
  "HECTOR ROLDAN S.A",
  "INDUSTRIAL CONTROLES SRL",
  "INDUSTRIAS ROTOR PUMP SAICIF Y A",
  "INTEROFFICE ARGENTINA SRL",
  "ISLA RICARDO HECTOR",
  "KAVE MOTORS S.R.L.",
  "LAFFITTE LEONARDO HERNAN",
  "LUK DESIGN S.R.L.",
  "LUNAZZI ELIO GABRIEL",
  "LUPART S.A",
  "M D AUTOELEVADORES Y EQUIPOS SRL",
  "MAQUINARIAS PYRAMIZ SRL",
  "MARTINEZ JORGE OSCAR",
  "MAS TRACCION SRL",
  "MASON ALFREDO ANDRES",
  "METALURGICA CODEL S.R.L.",
  "MULTIVAC ARGENTINA S.A.",
  "OJEDA GABRIEL ALBERTO",
  "PABRIC SAS",
  "PERELLO S.A."
].sort();
const stGet = async (k, fb) => {
  try {
    const r = await window.storage.get(k);
    return r ? JSON.parse(r.value) : fb;
  } catch {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fb;
    } catch {
      return fb;
    }
  }
};
const stSet = async (k, v) => {
  try {
    await window.storage.set(k, JSON.stringify(v));
  } catch {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
    }
  }
};
const DEF_CFG = {
  proveedores: [...PROVEEDORES_FULL],
  oficinaTecnica: [
    // Almacén
    "Leandro Boquete",
    "Mat\xEDas C\xE1ceres",
    "Tom\xE1s Gauna",
    "Diego Vattimo",
    "Juan Leguizamon",
    // Oficina Técnica
    "Gabriel Prado",
    "Mauro Blondo",
    "Lucas Ver\xF3n",
    "Maximiliano Canosa",
    // Planificación
    "Luz Arg\xFCello",
    "Alexis Plescia",
    "Lucas Ber\xF3n",
    "Agust\xEDn Ortiz",
    // Coordinación
    "Gonzalo Casagrande",
    "Ian Vaquero",
    "Marcos Labat",
    "Florencia Vivas",
    // Analistas
    "Dami\xE1n Peluso",
    "M\xF3nica Berclaz",
    // Jefatura Central
    "Lucas Concetti",
    "Gustavo Granero"
  ].sort(),
  jefes: [
    // Interior Norte
    "Pablo Ferrari",
    "Fabi\xE1n Prina",
    "Omar Carrizo",
    "Fabi\xE1n Silva",
    "Pablo Ju\xE1rez",
    "Armando Biondi",
    "Germ\xE1n Dell Osso",
    "Carlos Ben\xEDtez",
    // Interior Sur
    "Luis Montenegro",
    "Marcelo Pianezzi",
    "Gabriel Rodr\xEDguez",
    "Lucas Ure\xF1a",
    "Emiliano Rodr\xEDguez",
    "Carlos Herrera",
    "Rodrigo Alan\xEDs",
    "Daniel Ponce",
    // Amba Norte
    "Gonzalo Sol\xEDs",
    "Tom\xE1s D\xEDaz",
    "Luis Debelis",
    "Ram\xF3n Castro",
    "Jorge Pereyra",
    "Carlos Lugo",
    "V\xEDctor Ca\xF1iza",
    "Jorge Coronel",
    // Amba Sur
    "Pablo Marchese",
    "Fabricio Berardo",
    "Diego Portela",
    "Luis Medina",
    "Agust\xEDn Fuda",
    "Marcelo S\xE1nchez",
    "Roberto P\xE1ez",
    "Mart\xEDn Villalba",
    "Sebasti\xE1n Agnetti",
    "Alejandro Florent\xEDn",
    "Adri\xE1n Barella",
    // Express
    "Daniel Triacca",
    "Hugo Morales",
    "Gonzalo Mena",
    "Juan Aloe",
    "Hugo Villalba",
    "Nicol\xE1s Buttaccio",
    "Mat\xEDas D\xE1valos",
    // Express Amba Norte
    "Walter Rueda",
    "Facundo Dieghl"
  ].sort(),
  tecnicos: [
    "Barella Adrian",
    "Batocletti Nestor",
    "Caceres Matias",
    "Cogliano Jose Ezequiel",
    "Colarte Adrian",
    "Coronel Jorge",
    "Fogtman Federico",
    "Fressia Sergio",
    "Gomez German",
    "Juarez Juan",
    "Santillan Rodrigo",
    "Silva Guillermo",
    "Silvera Alejandro",
    "Soto Pablo",
    "Taborda David",
    "Tejerina",
    "Veron Ayrton"
  ].sort(),
  express: [
    "Nelson Marquez",
    "Maximiliano Napolillo",
    "Daniel Barrozo",
    "Alexis Pelegrini",
    "Patricio Mosquera",
    "Joaquin Cuello",
    "Alex Lovera",
    "Joel Nievas",
    "Ramiro Leguizamon",
    "Lucas Sislo",
    "Rub\xE9n Tomasa",
    "Ignacio Portillo",
    "Benigno Acosta",
    "Daniel Ojeda",
    "Luciano Ramallo",
    "Ezequiel Delorenzo",
    "Luis Malier",
    "Luis Vallejos",
    "Martin Menendez",
    "Joaquin Mu\xF1oz",
    "Martin Rosales",
    "Elias Aquino",
    "Leandro Bola\xF1os",
    "Guillermo Pistoia",
    "Alan Fernandez",
    "Cristian Tortoriel",
    "Franco Lerchundi",
    "Gabriel Amaya",
    "Gonzalo Suriano",
    "Magali Mota",
    "Jorge Ledesma",
    "Gustavo Palacios",
    "Leandro Mancilla"
  ].sort(),
  motivosIngreso: ["B\xFAsqueda de material", "Reparaciones", "Retiro de camioneta", "Entrega de mercader\xEDa", "Relevamiento / Inspecci\xF3n", "Instalaci\xF3n / Mantenimiento", "Otro"],
  motivosGenerador: ["Mantenimiento preventivo", "Reparaci\xF3n", "Instalaci\xF3n", "Retiro definitivo", "Prueba t\xE9cnica", "Actualizaci\xF3n"],
  generadores: ["Pa\xF1ol - TRAILER GRANDE", "Pa\xF1ol - TRAILER CHICO", "Pa\xF1ol - ESTATICO", "A1", "A2", "A3"],
  repartos: ["Diego Vattimo", "Juan Leguizamon"],
  gsUrl: ""
};
const BACKEND_URL = "https://crf-central-mantenimiento-api.onrender.com";
const VIEWS = { dashboard: "Dashboard", analytics: "Analytics", nueva: "Nueva Operaci\xF3n", generadores: "Grupos Electr\xF3genos", historial: "Historial", tempranos: "Pendientes de Egreso", admin: "Administraci\xF3n" };
const fmtDate = (d2) => d2 ? new Date(d2).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "\u2014";
const isoToLocal = (d2) => d2 ? new Date(d2).toISOString().slice(0, 16) : "";
const genId = (tipo, n) => `${tipo === "INGRESO" ? "IN" : "EG"}-${String(n).padStart(4, "0")}`;
const nowISO = () => (/* @__PURE__ */ new Date()).toISOString();
const nowLocal = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 16);
const d = {
  card: { background: "var(--bg-card-solid)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "22px 26px" },
  input: { display: "block", width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border-light)", background: "var(--bg-input)", color: "var(--text)", fontSize: "15px" },
  label: { display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" },
  btnPrimary: { padding: "11px 20px", borderRadius: "var(--radius)", border: "none", background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: "15px", cursor: "pointer", transition: "background .12s" },
  btnGhost: { padding: "9px 16px", borderRadius: "var(--radius)", border: "1px solid var(--border-light)", background: "transparent", color: "var(--text-muted)", fontWeight: 500, fontSize: "13px", cursor: "pointer" },
  btnDanger: { padding: "7px 13px", borderRadius: "var(--radius)", border: "none", background: "var(--red-dark)", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer" },
  btnSuccess: { padding: "11px 20px", borderRadius: "var(--radius)", border: "none", background: "var(--green-dark)", color: "#fff", fontWeight: 600, fontSize: "15px", cursor: "pointer" },
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" },
  g3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "18px" },
  g4: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "18px" },
  h3: { margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "var(--text)", letterSpacing: "-.01em" },
  muted: { fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 },
  sec: { marginBottom: "16px" },
  err: { fontSize: "11px", color: "var(--red-t)", fontWeight: 500, marginTop: "4px" },
  toggle: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }
};
function Badge({ tipo, small, egresoTemprano }) {
  const ok = tipo === "INGRESO";
  return /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: "5px", fontSize: small ? "11px" : "13px", fontWeight: 700, padding: small ? "3px 0" : "4px 0", color: ok ? "var(--ok)" : "var(--bad)", whiteSpace: "nowrap" } }, ok ? "INGRESO" : "EGRESO", egresoTemprano && /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10px", color: "var(--warn)", fontWeight: 600 } }, "PTE."));
}
function Toast({ msg, type }) {
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "10px 16px", borderRadius: "var(--radius)", background: "var(--fg)", color: "var(--bg)", fontSize: "13px", fontWeight: 600 } }, msg);
}
function AutoInput({ options = [], value, onChange, placeholder, error }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = React.useRef(null);
  const q = (value || "").toLowerCase().trim();
  const filtered = useMemo(() => {
    if (q.length > 0) return options.filter((o) => o.toLowerCase().includes(q) && o !== value).slice(0, 15);
    return options.slice(0, 10);
  }, [options, q, value]);
  const show = open && focused && filtered.length > 0;
  const updatePos = React.useCallback(() => {
    if (inputRef.current) {
      let el = inputRef.current, top = 0, left = 0;
      const rect = el.getBoundingClientRect();
      top = rect.bottom + window.scrollY + 2;
      left = rect.left + window.scrollX;
      setPos({ top, left, width: rect.width });
    }
  }, []);
  React.useLayoutEffect(() => {
    if (show) updatePos();
  }, [show]);
  React.useEffect(() => {
    if (!show) return;
    const onScroll = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [show, updatePos]);
  const dropStyle = {
    position: "absolute",
    top: pos.top + "px",
    left: pos.left + "px",
    width: pos.width + "px",
    zIndex: 99999,
    background: "var(--bg-input)",
    border: "1px solid var(--border-light)",
    borderRadius: "var(--radius)",
    maxHeight: "260px",
    overflowY: "auto",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
  };
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: inputRef,
      style: { ...d.input, borderColor: error ? "var(--red-dark)" : void 0 },
      value,
      onChange: (e) => {
        onChange(e.target.value);
        setOpen(true);
        updatePos();
      },
      onFocus: () => {
        setFocused(true);
        setOpen(true);
        updatePos();
      },
      onBlur: () => setTimeout(() => setFocused(false), 160),
      placeholder
    }
  ), show && ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { style: dropStyle }, filtered.map((opt) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: opt,
        onMouseDown: () => {
          onChange(opt);
          setOpen(false);
        },
        style: { padding: "9px 13px", cursor: "pointer", fontSize: "13px", color: "var(--text)", borderBottom: "1px solid var(--border)" },
        onMouseEnter: (e) => e.currentTarget.style.background = "var(--bg-hover)",
        onMouseLeave: (e) => e.currentTarget.style.background = "transparent"
      },
      opt
    )), q.length === 0 && options.length > 10 && /* @__PURE__ */ React.createElement("div", { style: { padding: "6px 13px", fontSize: "11px", color: "var(--text-muted)", borderTop: "1px solid var(--border)", textAlign: "center" } }, "Escrib\xED para buscar entre ", options.length, " opciones...")),
    document.body
  ), error && /* @__PURE__ */ React.createElement("span", { style: d.err }, error));
}
function Select({ options = [], value, onChange, placeholder, error, style }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = React.useRef(null);
  const btnRef = React.useRef(null);
  const norm = useMemo(() => options.map((o) => o && typeof o === "object" ? o : { value: o, label: o }), [options]);
  const current = norm.find((o) => String(o.value) === String(value));
  const updatePos = React.useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
    }
  }, []);
  React.useLayoutEffect(() => {
    if (open) updatePos();
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePos();
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target) && !e.target.closest("[data-select-panel]")) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updatePos);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updatePos);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, updatePos]);
  return /* @__PURE__ */ React.createElement("div", { ref: wrapRef, style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      ref: btnRef,
      onClick: () => setOpen((o) => !o),
      style: { ...d.input, ...style, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", cursor: "pointer", textAlign: "left", borderColor: error ? "var(--red-dark)" : open ? "var(--accent)" : void 0, color: current ? "var(--text)" : "var(--text-muted)" }
    },
    /* @__PURE__ */ React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, current ? current.label : placeholder || "Seleccionar..."),
    /* @__PURE__ */ React.createElement("svg", { width: "11", height: "7", viewBox: "0 0 11 7", fill: "none", style: { flexShrink: 0, transition: "transform .15s", transform: open ? "rotate(180deg)" : "none", opacity: 0.65 } }, /* @__PURE__ */ React.createElement("path", { d: "M1 1L5.5 5.5L10 1", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }))
  ), open && ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { "data-select-panel": true, style: { position: "absolute", top: pos.top + "px", left: pos.left + "px", width: pos.width + "px", zIndex: 99999, background: "var(--bg-input)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", maxHeight: "280px", overflowY: "auto", boxShadow: "0 12px 32px rgba(0,0,0,0.55)", padding: "4px" } }, norm.map((o) => {
      const sel = String(o.value) === String(value);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: o.value,
          onMouseDown: () => {
            onChange(o.value);
            setOpen(false);
          },
          style: { padding: "9px 12px", borderRadius: "7px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", color: sel ? "var(--accent)" : "var(--text)", background: sel ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent", fontWeight: sel ? 600 : 400 },
          onMouseEnter: (e) => {
            if (!sel) e.currentTarget.style.background = "var(--bg-hover)";
          },
          onMouseLeave: (e) => {
            if (!sel) e.currentTarget.style.background = "transparent";
          }
        },
        /* @__PURE__ */ React.createElement("span", null, o.label),
        sel && /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", style: { flexShrink: 0 } }, /* @__PURE__ */ React.createElement("path", { d: "M2.5 7.5L5.5 10.5L11.5 3.5", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }))
      );
    })),
    document.body
  ), error && /* @__PURE__ */ React.createElement("span", { style: d.err }, error));
}
function Toggle({ checked, onChange, label, accent }) {
  const col = accent || "var(--accent)";
  return /* @__PURE__ */ React.createElement("label", { style: d.toggle, onClick: () => onChange(!checked) }, /* @__PURE__ */ React.createElement("div", { style: { width: "40px", height: "22px", borderRadius: "11px", background: checked ? col : "var(--border-light)", position: "relative", transition: "background .2s", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "3px", left: checked ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left .2s" } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "13px", color: checked ? "var(--text)" : "var(--text-muted)", fontWeight: checked ? 600 : 400 } }, label));
}
const LOGO_B64 = "data:image/png;base64,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";
function CarrefourLogo({ size = 36 }) {
  return /* @__PURE__ */ React.createElement("img", { src: LOGO_B64, alt: "Carrefour Mantenimiento", style: { height: size + "px", width: "auto", objectFit: "contain" } });
}
function LoginScreen({ onLogin }) {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const go = async () => {
    setErr("");
    setLoading(true);
    try {
      const t = window.porteriaSesion ? await window.porteriaSesion.actualizar() : null;
      if (!t) {
        location.replace("/");
        return;
      }
      const res = await fetch(`${BACKEND_URL}/api/usuarios/me`);
      if (res.status === 403) {
        location.replace("/?sin_acceso=porteria");
        return;
      }
      const data = await res.json().catch(() => ({ ok: false }));
      if (res.ok && data.ok) {
        onLogin({ id: data.usuario.id, user: data.usuario.username, role: data.usuario.rol, name: data.usuario.username });
      } else {
        setErr(res.status === 401 ? "Tu sesi\xF3n venci\xF3. Volv\xE9 al inicio e ingres\xE1 de nuevo." : data.error || "No se pudo verificar tu acceso.");
      }
    } catch {
      setErr("Sin conexi\xF3n al servidor. Puede estar iniciando (tarda unos 30 segundos). Prob\xE1 de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    go();
  }, []);
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-deep)", padding: "20px" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "36px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "16px", display: "flex", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(CarrefourLogo, { size: 40 })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" } }, "Sistema de Control de Acceso \u2014 Porter\xEDa")), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, width: "100%", maxWidth: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: "24px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "32px", marginBottom: "8px" } }, "\u{1F6E1}\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "18px", fontWeight: 700, color: "var(--text)" } }, "Iniciar Sesi\xF3n")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, loading && /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 0" } }, /* @__PURE__ */ React.createElement("span", { className: "cm-loader", role: "status", "aria-label": "Cargando" })), err && /* @__PURE__ */ React.createElement("p", { style: { ...d.err, marginBottom: "16px" } }, err), !loading && err && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: go, style: { ...d.btnPrimary, padding: "10px 18px" } }, "Reintentar"), /* @__PURE__ */ React.createElement("a", { href: "/", style: { padding: "10px 18px", fontSize: "14px", color: "var(--accent)" } }, "Volver al inicio")))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "40px", fontSize: "11px", color: "var(--text-dim)" } }, "desarrollado por alexis plescia en 2026"));
}
const NAV = [{ id: "dashboard", label: "Dashboard", icon: "\u{1F3E0}" }, { id: "analytics", label: "Analytics", icon: "\u{1F4CA}" }, { id: "nueva", label: "Nueva Operaci\xF3n", icon: "\u2795" }, { id: "generadores", label: "Grupos Electr\xF3genos", icon: "\u26A1" }, { id: "historial", label: "Historial", icon: "\u{1F4CB}" }, { id: "tempranos", label: "Pendientes de Egreso", icon: "\u23F1\uFE0F" }];
function Sidebar({ view, setView, user, onLogout, sidebarOpen }) {
  const nb = (item, accentColor) => {
    const active = view === item.id;
    const ac = accentColor || "var(--accent)";
    return /* @__PURE__ */ React.createElement("button", { key: item.id, onClick: () => setView(item.id), style: { display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", borderRadius: "var(--radius)", border: "none", background: active ? `color-mix(in srgb, ${ac} 12%, transparent)` : "transparent", color: active ? ac : "var(--text-muted)", fontWeight: active ? 600 : 400, fontSize: "14px", cursor: "pointer", textAlign: "left", marginBottom: "2px", transition: "all .15s" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "16px", lineHeight: 1, opacity: active ? 1 : 0.75 } }, item.icon), item.label);
  };
  return /* @__PURE__ */ React.createElement("aside", { className: `sidebar${sidebarOpen ? " open" : ""}`, style: { width: "var(--sidebar-w)", minHeight: "100vh", background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "22px 20px 16px", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(CarrefourLogo, { size: 30 }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "7px", letterSpacing: ".04em", fontWeight: 500 } }, "Control de Acceso")), /* @__PURE__ */ React.createElement("nav", { style: { flex: 1, padding: "14px 10px", overflowY: "auto" } }, NAV.map((item) => nb(item)), /* @__PURE__ */ React.createElement("div", { style: { height: "1px", background: "var(--border)", margin: "12px 4px" } }), user.role === "admin" && nb({ id: "admin", icon: "\u2699\uFE0F", label: "Administraci\xF3n" }, "var(--purple)")), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px", borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "34px", height: "34px", borderRadius: "50%", background: "var(--blue-bg)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "var(--accent)", flexShrink: 0 } }, user.name[0]), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "14px", fontWeight: 600, color: "var(--text)" } }, user.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" } }, user.role))), /* @__PURE__ */ React.createElement("button", { onClick: onLogout, style: { ...d.btnGhost, width: "100%", fontSize: "12px", padding: "8px" } }, "Cerrar sesi\xF3n")));
}
function toggleTema() {
  var cur = document.documentElement.getAttribute("data-theme") || "dark";
  var next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("porteria_tema", next); } catch(e) {}
}
function Header({ view, onMenuToggle }) {
  const dt = (/* @__PURE__ */ new Date()).toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return /* @__PURE__ */ React.createElement("header", { className: "port-header" },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "12px" } },
      /* @__PURE__ */ React.createElement("button", { onClick: onMenuToggle, className: "hide-desktop", style: { ...d.btnGhost, padding: "6px 8px", fontSize: "16px" } }, "\u2630"),
      /* @__PURE__ */ React.createElement("div", null,
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: "16px", fontWeight: 700, color: "var(--fg)" } }, VIEWS[view]),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--muted)", textTransform: "capitalize" } }, dt)
      )
    ),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "14px" } },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--muted)" } }, "\u{1F6E1}\uFE0F Porter\xEDa"),
      /* @__PURE__ */ React.createElement("button", { type: "button", className: "theme-toggle", title: "Cambiar tema", onClick: toggleTema })
    )
  );
}
function Dashboard({ registros, setView }) {
  const today = (/* @__PURE__ */ new Date()).toDateString();
  const stats = useMemo(() => {
    const todayR = registros.filter((r) => new Date(r.fechaHora).toDateString() === today);
    const ingH = new Set(todayR.filter((r) => r.tipoOp === "INGRESO").map((r) => r.id)).size;
    const egH = new Set(todayR.filter((r) => r.tipoOp === "EGRESO").map((r) => r.id)).size;
    const genDentro = new Set(registros.filter((r) => r.modulo === "generador" && r.tipoOp === "INGRESO").map((r) => r.id)).size;
    const total = new Set(registros.map((r) => r.id)).size;
    const abiertos = registros.filter((r) => r.tipoOp === "INGRESO").filter((r) => {
      const egIds = new Set(registros.filter((x) => x.tipoOp === "EGRESO" && x.grupoId === r.grupoId).map((x) => x.grupoId));
      return !egIds.has(r.grupoId);
    });
    return { ingH, egH, genDentro, total, abiertos: new Set(abiertos.map((r) => r.grupoId)).size };
  }, [registros, today]);
  const recent = useMemo(() => {
    const seen = /* @__PURE__ */ new Set();
    return [...registros].reverse().filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    }).slice(0, 10);
  }, [registros]);
  const SC = [
    { l: "Ingresos hoy", v: stats.ingH, bg: "var(--green-bg)", c: "var(--green-t)", bd: "var(--green-dark)" },
    { l: "Egresos hoy", v: stats.egH, bg: "var(--red-bg)", c: "var(--red-t)", bd: "var(--red-dark)" },
    { l: "Sin egreso", v: stats.abiertos, bg: "var(--amber-bg)", c: "var(--amber-t)", bd: "var(--amber)" },
    { l: "Generadores activos", v: stats.genDentro, bg: "var(--blue-bg)", c: "var(--blue-t)", bd: "var(--accent)" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "1440px", margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "g4", style: { ...d.g4, marginBottom: "20px" } }, SC.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.l, style: { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderBottom: `3px solid ${s.c}`, borderRadius: "var(--radius-lg)", padding: "1.1rem 1.2rem" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "32px", fontWeight: 800, color: s.c, lineHeight: 1 } }, s.v), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500 } }, s.l)))), /* @__PURE__ */ React.createElement("div", { className: "g3", style: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "14px", marginBottom: "20px" } }, [{ icon: "\u2795", l: "Nueva Operaci\xF3n", desc: "Registrar ingreso o egreso", v: "nueva" }, { icon: "\u26A1", l: "Grupo Electr\xF3geno", desc: "M\xF3dulo generadores", v: "generadores" }, { icon: "\u{1F4CB}", l: "Historial", desc: "Consultar y exportar", v: "historial" }].map((item) => /* @__PURE__ */ React.createElement("button", { key: item.v, onClick: () => setView(item.v), style: { ...d.card, cursor: "pointer", textAlign: "left", border: "1px solid var(--border-light)", transition: "border-color .15s" }, onMouseEnter: (e) => e.currentTarget.style.borderColor = "var(--accent)", onMouseLeave: (e) => e.currentTarget.style.borderColor = "var(--border-light)" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "24px", marginBottom: "8px" } }, item.icon), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "14px", fontWeight: 700, color: "var(--text)" } }, item.l), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" } }, item.desc)))), /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" } }, /* @__PURE__ */ React.createElement("h3", { style: { ...d.h3, margin: 0 } }, "Actividad reciente"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-dim)" } }, recent.length, " operaciones")), recent.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: "var(--text-muted)" } }, "Sin registros. Comenz\xE1 cargando la primera operaci\xF3n.") : recent.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "12px" } }, /* @__PURE__ */ React.createElement(Badge, { tipo: r.tipoOp, small: true, egresoTemprano: r.egresoTemprano }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--text)" } }, r.nombre), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, r.perfil, r.modulo === "generador" ? " \xB7 \u26A1 Generador" : ""))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "var(--accent)" } }, r.id), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, fmtDate(r.fechaHora)))))));
}
function RemitoCard({ rem, idx, onUpd, onDel, estados, canDel }) {
  const u = (f, v) => onUpd({ ...rem, [f]: v });
  const esOtro = rem.estado === "Otro";
  return /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "12px", borderLeft: "2px solid var(--accent)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" } }, "Remito #", idx + 1), canDel && /* @__PURE__ */ React.createElement("button", { onClick: onDel, style: d.btnDanger }, "\u2715 Quitar")), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { ...d.g2, marginBottom: "10px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Nro Remito / OT"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: rem.remito, onChange: (e) => u("remito", e.target.value), placeholder: "Ej: 186757" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Motivo de Ingreso"), /* @__PURE__ */ React.createElement(Select, { options: estados, value: rem.estado, onChange: (v) => u("estado", v) }), esOtro && /* @__PURE__ */ React.createElement("input", { style: { ...d.input, marginTop: "6px" }, value: rem.motivoLibre || "", onChange: (e) => u("motivoLibre", e.target.value), placeholder: "Describ\xED el motivo..." }))), /* @__PURE__ */ React.createElement("div", { style: d.sec }, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Detalle de Material"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: rem.detalle, onChange: (e) => u("detalle", e.target.value), placeholder: "Descripci\xF3n del material" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Observaciones"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: rem.obs, onChange: (e) => u("obs", e.target.value), placeholder: "Observaciones (opcional)" })));
}
function NuevaOp({ registros, cfg, user, addRegistros, nextId, setView }) {
  const [perfil, setPerfil] = useState("Proveedor");
  const [nombre, setNombre] = useState("");
  const [remitos, setRemitos] = useState([{ id: 1, remito: "", detalle: "", estado: "B\xFAsqueda de material", obs: "" }]);
  const [obsOtro, setObsOtro] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const perfiles = ["Proveedor", "T\xE9cnico", "Oficina T\xE9cnica", "Repartos", "Express", "Jefe", "Otro"];
  const getNombres = () => {
    if (perfil === "Proveedor") return cfg.proveedores;
    if (perfil === "T\xE9cnico") return cfg.tecnicos || [];
    if (perfil === "Oficina T\xE9cnica") return cfg.oficinaTecnica;
    if (perfil === "Jefe") return cfg.jefes;
    if (perfil === "Express") return cfg.express || [];
    if (perfil === "Repartos") return cfg.repartos || [];
    return [];
  };
  const addRem = () => setRemitos((p) => [...p, { id: Date.now(), remito: "", detalle: "", estado: "B\xFAsqueda de material", obs: "" }]);
  const updRem = (id, upd) => setRemitos((p) => p.map((r) => r.id === id ? { ...r, ...upd } : r));
  const delRem = (id) => setRemitos((p) => p.filter((r) => r.id !== id));
  const validate = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = "Ingres\xE1 el nombre o empresa";
    remitos.forEach((r, i) => {
      if (!r.remito.trim()) e[`r${i}`] = "Nro de remito requerido";
    });
    setErrors(e);
    return !Object.keys(e).length;
  };
  const reset = () => {
    setNombre("");
    setObsOtro("");
    setErrors({});
    setRemitos([{ id: 1, remito: "", detalle: "", estado: "B\xFAsqueda de material", obs: "" }]);
  };
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const now = nowISO();
    const grupoId = `GRP-${Date.now()}`;
    const base = { grupoId, fechaHora: now, perfil, nombre: nombre.trim(), modulo: "general", usuario: user.name };
    const lote = [];
    if (remitos.length === 0) {
      const id = genId("INGRESO", nextId());
      lote.push({ ...base, id, idOperacion: id, tipoOp: "INGRESO", remito: "N/A", detalle: "N/A", estado: "N/A", obs: "Sin remitos", egresoTemprano: true });
    } else {
      let n = nextId();
      for (const r of remitos) {
        const id = genId("INGRESO", n++);
        lote.push({ ...base, id, idOperacion: id, tipoOp: "INGRESO", remito: r.remito, detalle: r.detalle, estado: r.estado === "Otro" ? r.motivoLibre || "Otro" : r.estado, obs: r.obs || obsOtro || "N/A", egresoTemprano: true });
      }
    }
    await addRegistros(lote);
    setSaving(false);
    reset();
    setView("dashboard");
  };
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "1100px", margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", background: "var(--green-bg)", border: "1px solid var(--green-dark)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "22px" } }, "\u25B6"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "15px", fontWeight: 700, color: "var(--green-t)" } }, "INGRESO Y EGRESO"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--green-t)", opacity: 0.7, marginTop: "2px" } }, 'La persona ingresa ahora. Registr\xE1 el egreso desde "Pendientes de Egreso" cuando se retire.'))), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("div", { className: "g2", style: d.g2 }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Perfil"), /* @__PURE__ */ React.createElement(Select, { options: perfiles, value: perfil, onChange: (v) => {
    setPerfil(v);
    setNombre("");
    setErrors({});
  } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, perfil === "Proveedor" ? "Empresa / Proveedor" : "Nombre"), perfil === "Otro" ? /* @__PURE__ */ React.createElement("input", { style: { ...d.input, borderColor: errors.nombre ? "var(--red-dark)" : void 0 }, value: nombre, onChange: (e) => setNombre(e.target.value), placeholder: "Nombre completo" }) : /* @__PURE__ */ React.createElement(AutoInput, { options: getNombres(), value: nombre, onChange: setNombre, placeholder: "Escribir para buscar...", error: errors.nombre }), perfil === "Otro" && errors.nombre && /* @__PURE__ */ React.createElement("span", { style: d.err }, errors.nombre)))), /* @__PURE__ */ React.createElement(React.Fragment, null, remitos.map((r, i) => /* @__PURE__ */ React.createElement(RemitoCard, { key: r.id, rem: r, idx: i, onUpd: (u) => updRem(r.id, u), onDel: () => delRem(r.id), estados: cfg.motivosIngreso, canDel: remitos.length > 1 })), errors[`r0`] && /* @__PURE__ */ React.createElement("span", { style: { ...d.err, display: "block", marginBottom: "8px" } }, errors["r0"]), /* @__PURE__ */ React.createElement("button", { onClick: addRem, style: { ...d.btnGhost, width: "100%", marginBottom: "16px", padding: "10px", borderStyle: "dashed" } }, "+ Agregar remito")), /* @__PURE__ */ React.createElement("button", { onClick: handleSubmit, disabled: saving, style: { ...d.btnPrimary, width: "100%", padding: "14px", fontSize: "15px", opacity: saving ? 0.6 : 1 } }, saving ? "Guardando..." : "\u{1F4BE} Guardar Registro"));
}
function Generadores({ registros, cfg, user, addRegistros, nextId, setView }) {
  const [tab, setTab] = useState("ingreso");
  const [proveedor, setProveedor] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [modelo, setModelo] = useState("");
  const [motivo, setMotivo] = useState(DEF_CFG.motivosGenerador[0]);
  const [obs, setObs] = useState("");
  const [tienda, setTienda] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const pendientes = useMemo(() => {
    const ingresos = registros.filter((r) => r.modulo === "generador" && r.tipoOp === "INGRESO");
    const gruposEgresados = new Set(registros.filter((r) => r.modulo === "generador" && r.tipoOp === "EGRESO").map((r) => r.grupoId));
    const seen = /* @__PURE__ */ new Set();
    return ingresos.filter((r) => {
      if (gruposEgresados.has(r.grupoId) || seen.has(r.grupoId)) return false;
      seen.add(r.grupoId);
      return true;
    });
  }, [registros]);
  const validate = () => {
    const e = {};
    if (!proveedor.trim()) e.proveedor = "Requerido";
    if (!modelo.trim()) e.modelo = "Requerido";
    setErrors(e);
    return !Object.keys(e).length;
  };
  const handleIngreso = async () => {
    if (!validate()) return;
    setSaving(true);
    const n = nextId();
    const id = genId("INGRESO", n);
    const grupoId = `GRP-${Date.now()}`;
    const base = { id, idOperacion: id, grupoId, fechaHora: nowISO(), perfil: "Grupo Electr\xF3geno", nombre: proveedor.trim(), remito: modelo.trim(), detalle: motivo, estado: "Dentro", obs: `T\xE9cnico: ${tecnico || "N/A"} | Tienda: ${tienda || "N/A"} | ${obs}`, tipoOp: "INGRESO", modulo: "generador", proveedor: proveedor.trim(), tecnico, modelo: modelo.trim(), motivo, tienda: tienda.trim(), usuario: user.name, egresoTemprano: true };
    await addRegistros([base]);
    setSaving(false);
    setProveedor("");
    setTecnico("");
    setModelo("");
    setObs("");
    setTienda("");
    setErrors({});
  };
  const tabBtn = (id, label, color) => ({
    padding: "10px 28px",
    borderRadius: "var(--radius)",
    border: `2px solid ${tab === id ? color : "var(--border)"}`,
    background: tab === id ? color : "transparent",
    color: tab === id ? "#fff" : "var(--text-muted)",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all .15s"
  });
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "1100px", margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--amber-bg)", border: "1px solid var(--amber)", borderRadius: "var(--radius-lg)", padding: "13px 18px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "13px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "26px" } }, "\u26A1"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "14px", fontWeight: 700, color: "var(--amber-t)" } }, "M\xF3dulo: Grupos Electr\xF3genos"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--amber)", opacity: 0.8 } }, pendientes.length, " generador(es) dentro actualmente"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", marginBottom: "20px" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setTab("ingreso"), style: tabBtn("ingreso", "ingreso", "var(--green-dark)") }, "\u25B6 INGRESO"), /* @__PURE__ */ React.createElement("button", { onClick: () => setTab("egreso"), style: tabBtn("egreso", "egreso", "var(--red-dark)") }, "\u25C0 EGRESO")), tab === "ingreso" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", background: "var(--green-bg)", border: "1px solid var(--green-dark)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "22px" } }, "\u25B6"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "15px", fontWeight: 700, color: "var(--green-t)" } }, "INGRESO DE GENERADOR"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--green-t)", opacity: 0.7, marginTop: "2px" } }, "Registr\xE1 el ingreso del equipo. El egreso se registra por separado cuando se retire."))), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("div", { className: "g2", style: { ...d.g2, marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Empresa / Proveedor"), /* @__PURE__ */ React.createElement(AutoInput, { options: cfg.proveedores, value: proveedor, onChange: setProveedor, placeholder: "Buscar proveedor...", error: errors.proveedor })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "T\xE9cnico Responsable"), /* @__PURE__ */ React.createElement(AutoInput, { options: cfg.tecnicos || [], value: tecnico, onChange: setTecnico, placeholder: "Buscar t\xE9cnico..." }))), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { ...d.g2, marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Equipo / Grupo Electr\xF3geno"), /* @__PURE__ */ React.createElement(Select, { options: cfg.generadores || DEF_CFG.generadores, value: modelo, onChange: setModelo, placeholder: "\u2014 Seleccionar equipo \u2014", error: errors.modelo })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Motivo"), /* @__PURE__ */ React.createElement(Select, { options: cfg.motivosGenerador, value: motivo, onChange: setMotivo }))), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { ...d.g2, marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Tienda de la que viene"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: tienda, onChange: (e) => setTienda(e.target.value), placeholder: "Ej: Tienda 42 - Palermo" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Observaciones generales"), /* @__PURE__ */ React.createElement("textarea", { style: { ...d.input, height: "60px", resize: "vertical" }, value: obs, onChange: (e) => setObs(e.target.value), placeholder: "Observaciones adicionales..." })))), /* @__PURE__ */ React.createElement("button", { onClick: handleIngreso, disabled: saving, style: { ...d.btnSuccess, width: "100%", padding: "14px", fontSize: "15px", opacity: saving ? 0.6 : 1 } }, saving ? "Guardando..." : "\u25B6 Registrar Ingreso de Generador")), tab === "egreso" && /* @__PURE__ */ React.createElement(GeEgresosTemprano, { registros, addRegistros, nextId, user, cfg }));
}
function GeEgresosTemprano({ registros, addRegistros, nextId, user, cfg }) {
  const egresados = useMemo(() => {
    const seen = /* @__PURE__ */ new Set();
    return [...registros].filter((r) => r.modulo === "generador" && r.tipoOp === "EGRESO").filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    }).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
  }, [registros]);
  const [proveedor, setProveedor] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [modelo, setModelo] = useState("");
  const [motivo, setMotivo] = useState(DEF_CFG.motivosGenerador[0]);
  const [tienda, setTienda] = useState("");
  const [remito, setRemito] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!proveedor.trim()) e.proveedor = "Requerido";
    if (!modelo.trim()) e.modelo = "Requerido";
    setErrors(e);
    return !Object.keys(e).length;
  };
  const handleEgreso = async () => {
    if (!validate()) return;
    setSaving(true);
    const n = nextId();
    const egId = genId("EGRESO", n);
    const grupoId = `GRP-${Date.now()}`;
    await addRegistros([{ id: egId, idOperacion: egId, grupoId, fechaHora: nowISO(), tipoOp: "EGRESO", perfil: "Grupo Electr\xF3geno", nombre: proveedor.trim(), remito: remito || "N/A", detalle: motivo, estado: "Retirado", obs: `T\xE9cnico: ${tecnico || "N/A"} | Tienda: ${tienda || "N/A"} | ${obs || "Egreso registrado"}`, modulo: "generador", egresoTemprano: false, usuario: user.name, tecnico, motivo, modelo: modelo.trim(), tienda: tienda.trim() }]);
    setSaving(false);
    setProveedor("");
    setTecnico("");
    setModelo("");
    setRemito("");
    setObs("");
    setTienda("");
    setMotivo(DEF_CFG.motivosGenerador[0]);
    setErrors({});
  };
  const rowStyle = { display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr", gap: "12px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" };
  const lbl = { fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" };
  return /* @__PURE__ */ React.createElement("div", { style: { marginTop: "0" } }, /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", background: "var(--red-bg)", border: "1px solid var(--red-dark)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "22px" } }, "\u25C0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "15px", fontWeight: 700, color: "var(--red-t)" } }, "EGRESO DE GENERADOR"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--red-t)", opacity: 0.7, marginTop: "2px" } }, "Complet\xE1 los datos del equipo que se retira."))), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("div", { className: "g2", style: { ...d.g2, marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Empresa / Proveedor"), /* @__PURE__ */ React.createElement(AutoInput, { options: cfg.proveedores, value: proveedor, onChange: setProveedor, placeholder: "Buscar proveedor...", error: errors.proveedor })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "T\xE9cnico Responsable"), /* @__PURE__ */ React.createElement(AutoInput, { options: cfg.tecnicos || [], value: tecnico, onChange: setTecnico, placeholder: "Buscar t\xE9cnico..." }))), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { ...d.g2, marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Equipo / Grupo Electr\xF3geno"), /* @__PURE__ */ React.createElement(Select, { options: cfg.generadores || DEF_CFG.generadores, value: modelo, onChange: setModelo, placeholder: "\u2014 Seleccionar equipo \u2014", error: errors.modelo })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Motivo de Egreso"), /* @__PURE__ */ React.createElement(Select, { options: cfg.motivosGenerador || DEF_CFG.motivosGenerador, value: motivo, onChange: setMotivo }))), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { ...d.g2, marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Tienda a la que se dirige"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: tienda, onChange: (e) => setTienda(e.target.value), placeholder: "Ej: Tienda 42 - Palermo" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Remito / OT (opcional)"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: remito, onChange: (e) => setRemito(e.target.value), placeholder: "Ej: 186757" }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Observaciones generales"), /* @__PURE__ */ React.createElement("textarea", { style: { ...d.input, height: "72px", resize: "vertical" }, value: obs, onChange: (e) => setObs(e.target.value), placeholder: "Observaciones adicionales..." }))), /* @__PURE__ */ React.createElement("button", { onClick: handleEgreso, disabled: saving, style: { ...d.btnDanger, width: "100%", padding: "14px", fontSize: "15px", opacity: saving ? 0.6 : 1, marginBottom: "22px" } }, saving ? "Guardando..." : "\u25C0 Registrar Egreso de Generador"), egresados.length > 0 && /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)" } }), /* @__PURE__ */ React.createElement("h3", { style: { ...d.h3, margin: 0, color: "var(--green-t)" } }, "GENERADORES EGRESADOS"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: "12px", background: "var(--green-bg)", color: "var(--green-t)", padding: "2px 10px", borderRadius: "12px", fontWeight: 700 } }, egresados.length)), /* @__PURE__ */ React.createElement("div", { style: { ...rowStyle, paddingTop: 0, borderBottom: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: lbl }, "Equipo"), /* @__PURE__ */ React.createElement("div", { style: lbl }, "Empresa"), /* @__PURE__ */ React.createElement("div", { style: lbl }, "Tienda destino"), /* @__PURE__ */ React.createElement("div", { style: lbl }, "Fecha")), egresados.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, style: rowStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--text)" } }, r.modelo || r.remito || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)" } }, r.nombre), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)" } }, r.tienda || "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--green-t)", fontWeight: 600 } }, fmtDate(r.fechaHora))))));
}
function Historial({ registros }) {
  const [search, setSearch] = useState("");
  const [fTipo, setFTipo] = useState("TODOS");
  const [fPerfil, setFPerfil] = useState("TODOS");
  const [fFecha, setFFecha] = useState("");
  const [fModulo, setFModulo] = useState("TODOS");
  const perfiles = useMemo(() => ["TODOS", ...new Set(registros.map((r) => r.perfil))], [registros]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...registros].filter((r) => {
      if (fTipo !== "TODOS" && r.tipoOp !== fTipo) return false;
      if (fPerfil !== "TODOS" && r.perfil !== fPerfil) return false;
      if (fModulo !== "TODOS" && (r.modulo || "general") !== fModulo) return false;
      if (fFecha && !r.fechaHora?.startsWith(fFecha)) return false;
      if (q && ![r.nombre, r.remito, r.id, r.detalle, r.estado, r.usuario].some((v) => v?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [registros, search, fTipo, fPerfil, fFecha, fModulo]);
  const exportCSV = () => {
    const H = ["ID", "Fecha", "Tipo Op", "Perfil", "M\xF3dulo", "Nombre/Empresa", "Remito/OT", "Detalle", "Motivo", "Observaciones", "Egreso Temprano", "Usuario"];
    const rows = filtered.map((r) => [r.id, fmtDate(r.fechaHora), r.tipoOp, r.perfil, r.modulo || "general", r.nombre, r.remito, r.detalle, r.estado, r.obs, r.egresoTemprano ? "S\xED" : "No", r.usuario]);
    const csv = [H, ...rows].map((row) => row.map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `porteria_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  const th = { padding: "9px 11px", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border-light)", whiteSpace: "nowrap", background: "var(--bg-sidebar)" };
  const td = { padding: "9px 11px", fontSize: "12px", color: "var(--text)", borderBottom: "1px solid var(--border)" };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "filter-row", style: { ...d.card, marginBottom: "16px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "12px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "B\xFAsqueda"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: search, onChange: (e) => setSearch(e.target.value), placeholder: "ID, nombre, remito..." })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Operaci\xF3n"), /* @__PURE__ */ React.createElement(Select, { options: [{ value: "TODOS", label: "Todos" }, { value: "INGRESO", label: "Ingreso" }, { value: "EGRESO", label: "Egreso" }], value: fTipo, onChange: setFTipo })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "M\xF3dulo"), /* @__PURE__ */ React.createElement(Select, { options: [{ value: "TODOS", label: "Todos" }, { value: "general", label: "General" }, { value: "generador", label: "Generadores" }], value: fModulo, onChange: setFModulo })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Perfil"), /* @__PURE__ */ React.createElement(Select, { options: perfiles, value: fPerfil, onChange: setFPerfil })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Fecha"), /* @__PURE__ */ React.createElement("input", { type: "date", style: d.input, value: fFecha, onChange: (e) => setFFecha(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("span", { style: d.muted }, filtered.length, " registro(s)"), /* @__PURE__ */ React.createElement("button", { onClick: exportCSV, style: d.btnGhost }, "\u{1F4E5} Exportar CSV/Excel")), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, overflowX: "auto", padding: 0, borderRadius: "var(--radius-lg)" } }, filtered.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "52px", color: "var(--text-muted)" } }, "No hay registros con los filtros aplicados") : /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, ["ID", "Fecha", "Op", "Perfil", "Nombre / Empresa", "Remito / OT", "Detalle", "Motivo", "Egreso", "Usuario"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: th }, h)))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, onMouseEnter: (e) => e.currentTarget.style.background = "var(--bg-hover)", onMouseLeave: (e) => e.currentTarget.style.background = "transparent", style: { transition: "background .1s" } }, /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", color: "var(--accent)", fontWeight: 700, whiteSpace: "nowrap" } }, r.id), /* @__PURE__ */ React.createElement("td", { style: { ...td, whiteSpace: "nowrap", fontSize: "11px", color: "var(--text-muted)" } }, fmtDate(r.fechaHora)), /* @__PURE__ */ React.createElement("td", { style: td }, /* @__PURE__ */ React.createElement(Badge, { tipo: r.tipoOp, small: true })), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontSize: "11px", minWidth: "100px" } }, r.perfil), /* @__PURE__ */ React.createElement("td", { style: { ...td, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, r.nombre), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontFamily: "monospace", fontSize: "11px", color: "var(--text-muted)", maxWidth: "70px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, r.remito), /* @__PURE__ */ React.createElement("td", { style: { ...td, maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11px" } }, r.detalle), /* @__PURE__ */ React.createElement("td", { style: { ...td, fontSize: "11px" } }, r.estado), /* @__PURE__ */ React.createElement("td", { style: td }, r.egresoTemprano ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: "9px", background: "var(--amber-bg)", color: "var(--amber-t)", padding: "2px 5px", borderRadius: "4px", fontWeight: 700 } }, "PTE.") : "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...td, color: "var(--text-muted)", fontSize: "11px" } }, r.usuario)))))));
}
function ListEditor({ title, items, onSave }) {
  const [list, setList] = useState([...items].sort());
  const [nItem, setNItem] = useState("");
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const add = () => {
    const v = nItem.trim();
    if (!v || list.includes(v)) return;
    setList((p) => [...p, v].sort());
    setNItem("");
  };
  const del = (i) => setList((p) => p.filter((_, idx) => idx !== i));
  const saveEd = () => {
    if (editVal.trim()) setList((p) => p.map((it, i) => i === editing ? editVal.trim() : it).sort());
    setEditing(null);
  };
  return /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "14px" } }, /* @__PURE__ */ React.createElement("h3", { style: d.h3 }, title, " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" } }, "(", list.length, ")")), /* @__PURE__ */ React.createElement("div", { style: { maxHeight: "260px", overflowY: "auto", marginBottom: "12px" } }, list.length === 0 && /* @__PURE__ */ React.createElement("p", { style: { ...d.muted, fontSize: "12px", textAlign: "center", padding: "16px 0" } }, "Sin elementos. Agreg\xE1 uno."), list.map((item, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid var(--border)" } }, editing === i ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { style: { ...d.input, flex: 1, padding: "6px 10px" }, value: editVal, onChange: (e) => setEditVal(e.target.value), onKeyDown: (e) => {
    if (e.key === "Enter") saveEd();
    if (e.key === "Escape") setEditing(null);
  }, autoFocus: true }), /* @__PURE__ */ React.createElement("button", { onClick: saveEd, style: { ...d.btnPrimary, padding: "5px 12px", fontSize: "12px" } }, "OK"), /* @__PURE__ */ React.createElement("button", { onClick: () => setEditing(null), style: { ...d.btnGhost, padding: "5px 10px", fontSize: "12px" } }, "\u2715")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: "13px", color: "var(--text)" } }, item), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setEditing(i);
    setEditVal(list[i]);
  }, style: { ...d.btnGhost, padding: "4px 9px", fontSize: "11px" } }, "\u270F\uFE0F"), /* @__PURE__ */ React.createElement("button", { onClick: () => del(i), style: { ...d.btnDanger, padding: "4px 9px", fontSize: "11px" } }, "\u2715"))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("input", { style: { ...d.input, flex: 1 }, value: nItem, onChange: (e) => setNItem(e.target.value), onKeyDown: (e) => e.key === "Enter" && add(), placeholder: "Nuevo elemento (Enter para agregar)..." }), /* @__PURE__ */ React.createElement("button", { onClick: add, style: d.btnPrimary }, "+ Agregar")), /* @__PURE__ */ React.createElement("button", { onClick: () => onSave(list), style: { ...d.btnPrimary, width: "100%" } }, "\u{1F4BE} Guardar cambios"));
}
function EgresosTemprano({ registros, addRegistros, nextId, user }) {
  const ingTempranos = useMemo(
    () => registros.filter((r) => r.tipoOp === "INGRESO" && r.modulo !== "generador"),
    [registros]
  );
  const gruposConEgreso = useMemo(() => {
    const ingresoGrupos = new Set(ingTempranos.map((r) => r.grupoId));
    return new Set(registros.filter((r) => r.tipoOp === "EGRESO" && r.grupoId && ingresoGrupos.has(r.grupoId)).map((r) => r.grupoId));
  }, [registros, ingTempranos]);
  const unicos = (lista) => {
    const seen = /* @__PURE__ */ new Set();
    return lista.filter((r) => {
      if (seen.has(r.grupoId)) return false;
      seen.add(r.grupoId);
      return true;
    });
  };
  const abiertos = useMemo(
    () => unicos(ingTempranos.filter((r) => !gruposConEgreso.has(r.grupoId))).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora)),
    [ingTempranos, gruposConEgreso]
  );
  const cerrados = useMemo(
    () => unicos(ingTempranos.filter((r) => gruposConEgreso.has(r.grupoId))).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora)),
    [ingTempranos, gruposConEgreso]
  );
  const [modalIng, setModalIng] = useState(null);
  const [showRemito, setShowRemito] = useState(false);
  const [remitoEg, setRemitoEg] = useState({ remito: "", detalle: "", obs: "" });
  const abrirModal = (ing) => {
    setModalIng(ing);
    setShowRemito(false);
    setRemitoEg({ remito: "", detalle: "", obs: "" });
  };
  const confirmarEgreso = async (conRemito) => {
    const ing = modalIng;
    setModalIng(null);
    const n = nextId();
    const egId = genId("EGRESO", n);
    await addRegistros([{
      id: egId,
      idOperacion: egId,
      grupoId: ing.grupoId,
      fechaHora: nowISO(),
      tipoOp: "EGRESO",
      perfil: ing.perfil,
      nombre: ing.nombre,
      remito: conRemito && remitoEg.remito ? remitoEg.remito : ing.remito,
      detalle: conRemito && remitoEg.detalle ? remitoEg.detalle : ing.detalle,
      estado: ing.estado,
      obs: conRemito && remitoEg.obs ? remitoEg.obs : "Egreso registrado",
      modulo: ing.modulo || "general",
      egresoTemprano: true,
      usuario: user.name
    }]);
  };
  const tiempoDesde = (fechaHora) => {
    const diff = Math.round((/* @__PURE__ */ new Date() - new Date(fechaHora)) / 6e4);
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}min`;
  };
  const egresoDelGrupo = (grupoId) => registros.find((r) => r.tipoOp === "EGRESO" && r.grupoId === grupoId);
  const rowStyle = { display: "grid", gridTemplateColumns: "2fr 1.5fr 110px 150px", gap: "12px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" };
  const labelMuted = { fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" };
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "1120px", margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "22px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "20px", fontWeight: 800, color: "var(--amber-t)" } }, "\u23F1\uFE0F Pendientes de Egreso"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" } }, "Personas dentro del establecimiento \u2014 ", abiertos.length, " pendiente(s) \xB7 ", cerrados.length, " egresado(s)")), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "18px", border: "1px solid var(--amber)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "8px", height: "8px", borderRadius: "50%", background: "var(--amber)", boxShadow: "0 0 6px var(--amber)" } }), /* @__PURE__ */ React.createElement("h3", { style: { ...d.h3, margin: 0, color: "var(--amber-t)" } }, "PENDIENTES DE EGRESO"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: "12px", background: "var(--amber-bg)", color: "var(--amber-t)", padding: "2px 10px", borderRadius: "12px", fontWeight: 700 } }, abiertos.length)), abiertos.length === 0 && /* @__PURE__ */ React.createElement("p", { style: { ...d.muted, textAlign: "center", padding: "16px 0" } }, "No hay personas con egreso pendiente."), abiertos.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { ...rowStyle, paddingTop: 0, borderBottom: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: labelMuted }, "Nombre / Empresa"), /* @__PURE__ */ React.createElement("div", { style: labelMuted }, "Perfil \xB7 M\xF3dulo"), /* @__PURE__ */ React.createElement("div", { style: labelMuted }, "Ingres\xF3 hace"), /* @__PURE__ */ React.createElement("div", { style: labelMuted }, "Acci\xF3n")), abiertos.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.grupoId, style: rowStyle }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "14px", fontWeight: 600, color: "var(--text)" } }, r.nombre), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" } }, fmtDate(r.fechaHora))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", color: "var(--text)" } }, r.perfil), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" } }, r.modulo || "general")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "15px", fontWeight: 700, color: "var(--amber-t)" } }, tiempoDesde(r.fechaHora)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => abrirModal(r),
      style: { padding: "8px 16px", borderRadius: "var(--radius)", border: "1px solid var(--amber)", background: "var(--amber-bg)", color: "var(--amber-t)", fontWeight: 700, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }
    },
    "\u25C0 Registrar Egreso"
  ))))), /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)" } }), /* @__PURE__ */ React.createElement("h3", { style: { ...d.h3, margin: 0, color: "var(--green-t)" } }, "EGRESOS REGISTRADOS"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: "12px", background: "var(--green-bg)", color: "var(--green-t)", padding: "2px 10px", borderRadius: "12px", fontWeight: 700 } }, cerrados.length)), cerrados.length === 0 && /* @__PURE__ */ React.createElement("p", { style: { ...d.muted, textAlign: "center", padding: "16px 0" } }, "A\xFAn no hay egresos registrados hoy."), cerrados.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { ...rowStyle, paddingTop: 0, borderBottom: "2px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: labelMuted }, "Nombre / Empresa"), /* @__PURE__ */ React.createElement("div", { style: labelMuted }, "Perfil \xB7 M\xF3dulo"), /* @__PURE__ */ React.createElement("div", { style: labelMuted }, "Ingreso"), /* @__PURE__ */ React.createElement("div", { style: labelMuted }, "Egreso")), cerrados.map((r) => {
    const eg = egresoDelGrupo(r.grupoId);
    const dur = eg ? Math.round((new Date(eg.fechaHora) - new Date(r.fechaHora)) / 6e4) : null;
    const durStr = dur === null ? "\u2014" : dur < 60 ? `${dur}m` : `${Math.floor(dur / 60)}h ${dur % 60}m`;
    return /* @__PURE__ */ React.createElement("div", { key: r.grupoId, style: rowStyle }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "14px", fontWeight: 600, color: "var(--text)" } }, r.nombre), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" } }, r.perfil)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", color: "var(--text-muted)", textTransform: "capitalize" } }, r.modulo || "general"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)" } }, fmtDate(r.fechaHora)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--green-t)", fontWeight: 600 } }, eg ? fmtDate(eg.fechaHora) : "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Duraci\xF3n: ", durStr)));
  }))), modalIng && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1e3, padding: "20px" } }, /* @__PURE__ */ React.createElement("div", { style: { ...d.card, width: "100%", maxWidth: "460px", border: "1px solid var(--amber)" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "18px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "16px", fontWeight: 700, color: "var(--amber-t)" } }, "\u25C0 Registrar Egreso"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" } }, modalIng.nombre, " \xB7 ", fmtDate(modalIng.fechaHora))), !showRemito ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { fontSize: "14px", color: "var(--text)", marginBottom: "20px", lineHeight: 1.6 } }, "\xBFDesea cargar un remito de egreso?"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setModalIng(null), style: { ...d.btnGhost, flex: 1 } }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { onClick: () => confirmarEgreso(false), style: { ...d.btnPrimary, flex: 1 } }, "Solo egreso"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowRemito(true), style: { ...d.btnSuccess, flex: 1 } }, "+ Remito de egreso"))) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: d.sec }, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Nro Remito / OT (egreso)"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: remitoEg.remito, onChange: (e) => setRemitoEg((p) => ({ ...p, remito: e.target.value })), placeholder: "Ej: 186757" })), /* @__PURE__ */ React.createElement("div", { style: d.sec }, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Detalle de material"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: remitoEg.detalle, onChange: (e) => setRemitoEg((p) => ({ ...p, detalle: e.target.value })), placeholder: "Material retirado..." })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Observaciones"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: remitoEg.obs, onChange: (e) => setRemitoEg((p) => ({ ...p, obs: e.target.value })), placeholder: "Observaciones (opcional)" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowRemito(false), style: { ...d.btnGhost, flex: 1 } }, "Atr\xE1s"), /* @__PURE__ */ React.createElement("button", { onClick: () => confirmarEgreso(true), style: { ...d.btnSuccess, flex: 1 } }, "Guardar Egreso"))))));
}
function Analytics({ registros, setView }) {
  const [rango, setRango] = useState("30");
  const ahora = useMemo(() => /* @__PURE__ */ new Date(), []);
  const hoy = useMemo(() => {
    const d2 = new Date(ahora);
    d2.setHours(0, 0, 0, 0);
    return d2;
  }, [ahora]);
  const ayer = useMemo(() => {
    const d2 = new Date(hoy);
    d2.setDate(d2.getDate() - 1);
    return d2;
  }, [hoy]);
  const filtrados = useMemo(() => {
    if (rango === "todo") return registros;
    const corte = new Date(ahora);
    corte.setDate(corte.getDate() - parseInt(rango, 10));
    return registros.filter((r) => new Date(r.fechaHora) >= corte);
  }, [registros, rango, ahora]);
  const fmtMin = (m) => {
    if (m === null || m === void 0) return "\u2014";
    const h = Math.floor(m / 60);
    const mn = m % 60;
    return h > 0 ? `${h}h${mn > 0 ? " " + mn + "min" : ""}` : mn + "min";
  };
  const ingresoGruposGlobal = useMemo(() => new Set(registros.filter((r) => r.tipoOp === "INGRESO").map((r) => r.grupoId)), [registros]);
  const gruposConEgresoGlobal = useMemo(() => new Set(registros.filter((r) => r.tipoOp === "EGRESO" && r.grupoId && ingresoGruposGlobal.has(r.grupoId)).map((r) => r.grupoId)), [registros, ingresoGruposGlobal]);
  const dentroAhora = useMemo(() => {
    const seen = /* @__PURE__ */ new Set();
    return registros.filter((r) => r.tipoOp === "INGRESO" && r.grupoId && !gruposConEgresoGlobal.has(r.grupoId) && !seen.has(r.grupoId) && seen.add(r.grupoId)).length;
  }, [registros, gruposConEgresoGlobal]);
  const { movHoy, movAyer, pctDiff } = useMemo(() => {
    const mh = registros.filter((r) => new Date(r.fechaHora) >= hoy).length;
    const ma = registros.filter((r) => {
      const f = new Date(r.fechaHora);
      return f >= ayer && f < hoy;
    }).length;
    return { movHoy: mh, movAyer: ma, pctDiff: ma === 0 ? 100 : Math.round((mh - ma) / ma * 100) };
  }, [registros, hoy, ayer]);
  const sinEgreso = useMemo(() => {
    const seen = /* @__PURE__ */ new Set();
    return registros.filter((r) => r.tipoOp === "INGRESO" && r.grupoId && !gruposConEgresoGlobal.has(r.grupoId) && !seen.has(r.grupoId) && seen.add(r.grupoId)).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  }, [registros, gruposConEgresoGlobal]);
  const criticos = useMemo(() => sinEgreso.map((r) => ({ ...r, mins: Math.round((ahora - new Date(r.fechaHora)) / 6e4) })).filter((r) => r.mins >= 240).sort((a, b) => b.mins - a.mins), [sinEgreso, ahora]);
  const permPorPerfil = useMemo(() => {
    const map = {};
    registros.filter((r) => r.tipoOp === "INGRESO" && r.grupoId).forEach((ing) => {
      const eg = registros.find((r) => r.tipoOp === "EGRESO" && r.grupoId === ing.grupoId);
      if (!eg) return;
      const m = (new Date(eg.fechaHora) - new Date(ing.fechaHora)) / 6e4;
      if (m > 0 && m < 1440) {
        const p = ing.perfil || "Otro";
        if (!map[p]) map[p] = [];
        map[p].push(m);
      }
    });
    return Object.entries(map).map(([perfil, arr]) => ({ perfil, avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) })).sort((a, b) => b.avg - a.avg).slice(0, 5);
  }, [registros]);
  const traficoHoy = useMemo(() => {
    const hs = Array.from({ length: 24 }, (_, i) => ({ h: i, hoy: 0, ayer: 0 }));
    registros.filter((r) => r.tipoOp === "INGRESO" && new Date(r.fechaHora) >= hoy).forEach((r) => {
      hs[new Date(r.fechaHora).getHours()].hoy++;
    });
    registros.filter((r) => r.tipoOp === "INGRESO").filter((r) => {
      const f = new Date(r.fechaHora);
      return f >= ayer && f < hoy;
    }).forEach((r) => {
      hs[new Date(r.fechaHora).getHours()].ayer++;
    });
    return hs;
  }, [registros, hoy, ayer]);
  const traficoMax = useMemo(() => Math.max(1, ...traficoHoy.map((h) => Math.max(h.hoy, h.ayer))), [traficoHoy]);
  const picoHoy = useMemo(() => traficoHoy.reduce((a, b) => b.hoy > a.hoy ? b : a, { h: 0, hoy: 0 }), [traficoHoy]);
  const adentroAhora = useMemo(() => {
    const seen = /* @__PURE__ */ new Set();
    return registros.filter((r) => r.tipoOp === "INGRESO" && r.grupoId && !gruposConEgresoGlobal.has(r.grupoId) && !seen.has(r.grupoId) && seen.add(r.grupoId)).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  }, [registros, gruposConEgresoGlobal]);
  const top15 = useMemo(() => {
    const map = {};
    filtrados.filter((r) => r.tipoOp === "INGRESO" && r.nombre && r.grupoId).forEach((ing) => {
      const eg = registros.find((r) => r.tipoOp === "EGRESO" && r.grupoId === ing.grupoId);
      const m = eg ? (new Date(eg.fechaHora) - new Date(ing.fechaHora)) / 6e4 : 0;
      if (!map[ing.nombre]) map[ing.nombre] = { visitas: 0, totalMins: 0, perfil: ing.perfil };
      map[ing.nombre].visitas++;
      if (m > 0 && m < 1440) map[ing.nombre].totalMins += m;
    });
    return Object.entries(map).map(([nombre, v]) => ({ nombre, ...v, avgMins: v.visitas > 0 ? Math.round(v.totalMins / v.visitas) : 0 })).sort((a, b) => b.visitas - a.visitas).slice(0, 15);
  }, [filtrados, registros]);
  const top15max = top15.length ? top15[0].visitas : 1;
  const permPerfilDetalle = useMemo(() => {
    const map = {};
    filtrados.filter((r) => r.tipoOp === "INGRESO" && r.grupoId).forEach((ing) => {
      const eg = registros.find((r) => r.tipoOp === "EGRESO" && r.grupoId === ing.grupoId);
      if (!eg) return;
      const m = (new Date(eg.fechaHora) - new Date(ing.fechaHora)) / 6e4;
      if (m > 0 && m < 1440) {
        const p = ing.perfil || "Otro";
        if (!map[p]) map[p] = [];
        map[p].push(m);
      }
    });
    return Object.entries(map).map(([perfil, arr]) => {
      arr.sort((a, b) => a - b);
      return { perfil, min: Math.round(arr[0]), avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length), max: Math.round(arr[arr.length - 1]), n: arr.length };
    }).sort((a, b) => b.avg - a.avg);
  }, [filtrados, registros]);
  const permMax = useMemo(() => Math.max(1, ...permPerfilDetalle.map((p) => p.max)), [permPerfilDetalle]);
  const franjas = useMemo(() => {
    const f = [
      { label: "Madrugada", sub: "0\u20136h", start: 0, end: 6, cnt: 0, color: "var(--purple)" },
      { label: "Ma\xF1ana", sub: "6\u201312h", start: 6, end: 12, cnt: 0, color: "var(--accent)" },
      { label: "Mediod\xEDa", sub: "12\u201314h", start: 12, end: 14, cnt: 0, color: "var(--amber)" },
      { label: "Tarde", sub: "14\u201318h", start: 14, end: 18, cnt: 0, color: "var(--green)" },
      { label: "Noche", sub: "18\u201324h", start: 18, end: 24, cnt: 0, color: "var(--red)" }
    ];
    filtrados.filter((r) => r.tipoOp === "INGRESO").forEach((r) => {
      const h = new Date(r.fechaHora).getHours();
      const fr = f.find((x) => h >= x.start && h < x.end);
      if (fr) fr.cnt++;
    });
    const mx = Math.max(1, ...f.map((x) => x.cnt));
    return f.map((x) => ({ ...x, pct: Math.round(x.cnt / mx * 100) }));
  }, [filtrados]);
  const rangoOpts = [{ v: "1", l: "Hoy" }, { v: "7", l: "7 d\xEDas" }, { v: "30", l: "30 d\xEDas" }, { v: "todo", l: "Todo" }];
  const kpiCard = (icon, title, value, sub, color = "var(--accent)") => /* @__PURE__ */ React.createElement("div", { style: { ...d.card, display: "flex", flexDirection: "column", gap: "6px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" } }, icon, " ", title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "28px", fontWeight: 800, color, lineHeight: 1 } }, value), sub && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, sub));
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "1440px", margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "20px", fontWeight: 800, color: "var(--text)" } }, "\u{1F4CA} Analytics"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" } }, "M\xE9tricas operativas del sistema de acceso")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px" } }, rangoOpts.map((o) => /* @__PURE__ */ React.createElement("button", { key: o.v, onClick: () => setRango(o.v), style: { padding: "6px 14px", borderRadius: "var(--radius)", border: "1px solid", borderColor: rango === o.v ? "var(--accent)" : "var(--border-light)", background: rango === o.v ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent", color: rango === o.v ? "var(--accent)" : "var(--text-muted)", fontSize: "12px", fontWeight: rango === o.v ? 700 : 400, cursor: "pointer" } }, o.l)))), /* @__PURE__ */ React.createElement("div", { className: "g4", style: { ...d.g4, marginBottom: "18px" } }, kpiCard("\u{1F465}", "Dentro ahora", dentroAhora, "Personas en el establecimiento", "var(--green-t)"), kpiCard(
    "\u{1F504}",
    "Movimientos hoy",
    movHoy,
    /* @__PURE__ */ React.createElement("span", { style: { color: pctDiff >= 0 ? "var(--green-t)" : "var(--red-t)" } }, pctDiff >= 0 ? "\u2191" : "\u2193", " ", Math.abs(pctDiff), "% vs ayer (", movAyer, ")"),
    "var(--blue-t)"
  ), kpiCard("\u23F0", "Pendientes egreso", sinEgreso.length, criticos.length > 0 ? /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red-t)" } }, criticos.length, " cr\xEDtico(s) >4h") : "Sin alertas cr\xEDticas", "var(--amber-t)"), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, display: "flex", flexDirection: "column", gap: "5px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "2px" } }, "\u231B Permanencia por perfil"), permPorPerfil.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)" } }, "Sin datos completos a\xFAn") : permPorPerfil.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.perfil, style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.perfil), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", fontWeight: 700, color: "var(--purple-t)", flexShrink: 0 } }, fmtMin(p.avg)))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "3fr 2fr", gap: "14px", marginBottom: "18px" } }, /* @__PURE__ */ React.createElement("div", { style: { ...d.card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("h3", { style: { ...d.h3, margin: 0 } }, "\u{1F4C8} Ingresos \u2014 Hoy vs Ayer"), picoHoy.hoy > 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-input)", padding: "4px 8px", borderRadius: "6px", flexShrink: 0 } }, "Pico: ", picoHoy.h, "h (", picoHoy.hoy, " ing.)") : /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" } }, "Sin ingresos hoy ni ayer")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: "2px", height: "150px" } }, traficoHoy.map(({ h, hoy: th, ayer: ta }) => /* @__PURE__ */ React.createElement("div", { key: h, title: `${h}h \u2014 Hoy:${th} Ayer:${ta}`, style: { flex: 1, display: "flex", gap: "2px", alignItems: "flex-end", height: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, borderRadius: "3px 3px 0 0", background: th > 0 && th === picoHoy.hoy ? "var(--accent)" : "var(--green-dark)", height: `${Math.max(Math.round(th / traficoMax * 100), th ? 5 : 0)}%`, minHeight: th ? "6px" : "0" } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, borderRadius: "3px 3px 0 0", background: "color-mix(in srgb,var(--text-muted) 40%,transparent)", height: `${Math.max(Math.round(ta / traficoMax * 100), ta ? 5 : 0)}%`, minHeight: ta ? "6px" : "0" } })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "3px", marginTop: "4px" } }, traficoHoy.map(({ h }) => /* @__PURE__ */ React.createElement("div", { key: h, style: { flex: 1, textAlign: "center", fontSize: "9px", color: "var(--text-dim)" } }, h % 4 === 0 ? h : ""))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "14px", marginTop: "8px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "10px", height: "10px", borderRadius: "2px", background: "var(--green-dark)" } }), " Hoy"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "10px", height: "10px", borderRadius: "2px", background: "var(--border)" } }), " Ayer"))), /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("h3", { style: { ...d.h3, margin: 0 } }, "\u{1F7E2} Adentro ahora"), adentroAhora.length > 0 && /* @__PURE__ */ React.createElement("button", { onClick: () => setView("tempranos"), style: { ...d.btnGhost, fontSize: "10px", padding: "3px 8px" } }, "Ver todos")), adentroAhora.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: d.muted }, "Nadie en el establecimiento.") : /* @__PURE__ */ React.createElement("div", { style: { maxHeight: "220px", overflowY: "auto" } }, adentroAhora.map((r) => {
    const mins = Math.round((ahora - new Date(r.fechaHora)) / 6e4);
    const alerta = mins >= 240;
    return /* @__PURE__ */ React.createElement("div", { key: r.grupoId, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, r.nombre), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "var(--text-muted)" } }, r.perfil)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", fontWeight: 700, color: alerta ? "var(--red-t)" : "var(--text-muted)", flexShrink: 0, marginLeft: "8px" } }, alerta ? "\u26A0\uFE0F " : "", fmtMin(mins)));
  })))), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { ...d.g2, marginBottom: "18px" } }, /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("h3", { style: d.h3 }, "\u{1F3C6} Top 15 Visitantes"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "4px 10px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", marginBottom: "4px" } }, ["Visitante", "Visitas", "T. total", "Prom."].map((h) => /* @__PURE__ */ React.createElement("span", { key: h, style: { fontSize: "10px", color: "var(--text-muted)", fontWeight: 700 } }, h))), top15.length === 0 && /* @__PURE__ */ React.createElement("p", { style: d.muted }, "Sin datos para el per\xEDodo."), top15.map((v, i) => /* @__PURE__ */ React.createElement("div", { key: v.nombre, style: { display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "4px 10px", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, i + 1, ". ", v.nombre), /* @__PURE__ */ React.createElement("div", { style: { height: "3px", borderRadius: "2px", background: "var(--bg-input)", marginTop: "3px" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", borderRadius: "2px", background: "var(--accent)", width: `${Math.round(v.visitas / top15max * 100)}%` } }))), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", fontWeight: 700, color: "var(--accent)" } }, v.visitas), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-muted)" } }, v.totalMins > 0 ? fmtMin(Math.round(v.totalMins)) : "\u2014"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-muted)" } }, v.avgMins > 0 ? fmtMin(v.avgMins) : "\u2014")))), /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("h3", { style: d.h3 }, "\u23F1\uFE0F Permanencia por Perfil"), permPerfilDetalle.length === 0 && /* @__PURE__ */ React.createElement("p", { style: d.muted }, "Sin pares ing+eg en el per\xEDodo."), permPerfilDetalle.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.perfil, style: { marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", fontWeight: 600, color: "var(--text)" } }, p.perfil), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10px", color: "var(--text-muted)" } }, "n=", p.n)), /* @__PURE__ */ React.createElement("div", { style: { height: "8px", borderRadius: "4px", background: "var(--bg-input)", position: "relative", marginBottom: "4px" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: `${Math.round(p.min / permMax * 100)}%`, width: `${Math.max(2, Math.round((p.max - p.min) / permMax * 100))}%`, height: "100%", borderRadius: "4px", background: "var(--purple)", opacity: 0.35 } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: `${Math.round(p.avg / permMax * 100)}%`, width: "3px", height: "100%", background: "var(--purple-t)", borderRadius: "2px", transform: "translateX(-50%)" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" } }, /* @__PURE__ */ React.createElement("span", null, fmtMin(p.min)), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--purple-t)", fontWeight: 700 } }, "\u2191 ", fmtMin(p.avg)), /* @__PURE__ */ React.createElement("span", null, fmtMin(p.max))))))), /* @__PURE__ */ React.createElement("div", { className: "g2", style: d.g2 }, /* @__PURE__ */ React.createElement("div", { style: { ...d.card, border: criticos.length > 0 ? "1px solid var(--red-dark)" : void 0 } }, /* @__PURE__ */ React.createElement("h3", { style: { ...d.h3, color: criticos.length > 0 ? "var(--red-t)" : void 0 } }, "\u26A0\uFE0F Alertas \u2014 M\xE1s de 4 horas adentro"), criticos.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: d.muted }, "Sin alertas cr\xEDticas ahora.") : criticos.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: 700, color: "var(--red-t)" } }, r.nombre), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, r.perfil, " \xB7 ", fmtDate(r.fechaHora))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: 800, color: "var(--red-t)", flexShrink: 0, marginLeft: "8px" } }, fmtMin(r.mins))))), /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("h3", { style: d.h3 }, "\u{1F550} Ingresos por Franja Horaria"), franjas.map((f) => /* @__PURE__ */ React.createElement("div", { key: f.label, style: { marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "4px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", color: "var(--text)" } }, f.label, " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10px", color: "var(--text-muted)" } }, f.sub)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", fontWeight: 700, color: f.color } }, f.cnt)), /* @__PURE__ */ React.createElement("div", { style: { height: "8px", borderRadius: "4px", background: "var(--bg-input)" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", borderRadius: "4px", background: f.color, width: `${f.pct}%`, transition: "width .4s" } })))))));
}
function UsuariosAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [newUser, setNewUser] = useState({ username: "", password: "", rol: "porteria" });
  const [newErr, setNewErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const flash = (text, isErr = false) => {
    if (isErr) setErr(text);
    else setMsg(text);
    setTimeout(() => {
      setErr("");
      setMsg("");
    }, 3500);
  };
  const safeJson = async (r) => {
    try {
      return await r.json();
    } catch {
      return { ok: false, error: `El backend no tiene esta funci\xF3n a\xFAn (${r.status}). Actualiz\xE1 el backend en Render.` };
    }
  };
  const loadUsers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BACKEND_URL}/api/usuarios`);
      const data = await safeJson(r);
      if (data.ok) {
        setUsers(data.data.map((u) => ({ ...u, activo: u.activo !== void 0 ? u.activo : true })));
      } else {
        flash("Error al cargar usuarios: " + data.error, true);
      }
    } catch {
      flash("Sin conexi\xF3n al backend", true);
    }
    setLoading(false);
  };
  useEffect(() => {
    loadUsers();
  }, []);
  const crearUsuario = async (e) => {
    e.preventDefault();
    setNewErr("");
    if (!newUser.username.trim() || !newUser.password.trim()) {
      setNewErr("Complet\xE1 usuario y contrase\xF1a");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch(`${BACKEND_URL}/api/usuarios`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
      const data = await safeJson(r);
      if (data.ok) {
        setNewUser({ username: "", password: "", rol: "porteria" });
        flash("Usuario creado correctamente");
        loadUsers();
      } else setNewErr(data.error || "Error al crear usuario");
    } catch {
      setNewErr("Sin conexi\xF3n al backend");
    }
    setCreating(false);
  };
  const guardarEdicion = async (u) => {
    if (!editing.password.trim() && editing.rol === u.rol) {
      setEditing(null);
      return;
    }
    const body = {};
    if (editing.password.trim()) body.password = editing.password.trim();
    if (editing.rol !== u.rol) body.rol = editing.rol;
    try {
      const r = await fetch(`${BACKEND_URL}/api/usuarios/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await safeJson(r);
      if (data.ok) {
        flash("Usuario actualizado");
        setEditing(null);
        loadUsers();
      } else flash(data.error || "Error al actualizar", true);
    } catch {
      flash("Sin conexi\xF3n al backend", true);
    }
  };
  const toggleActivo = async (u) => {
    const esActivo = u.activo === true || u.activo === void 0;
    const endpoint = esActivo ? `${BACKEND_URL}/api/usuarios/${u.id}` : `${BACKEND_URL}/api/usuarios/${u.id}/reactivar`;
    const method = esActivo ? "DELETE" : "PUT";
    try {
      const r = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" } });
      const data = await safeJson(r);
      if (data.ok) {
        flash(esActivo ? "Usuario desactivado" : "Usuario reactivado");
        loadUsers();
      } else flash(data.error || "Error", true);
    } catch {
      flash("Sin conexi\xF3n al backend", true);
    }
  };
  const rolColor = (rol) => rol === "admin" ? "var(--purple-t)" : "var(--blue-t)";
  const rolBg = (rol) => rol === "admin" ? "var(--purple-bg)" : "var(--blue-bg)";
  return /* @__PURE__ */ React.createElement("div", null, msg && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px", background: "var(--green-bg)", border: "1px solid var(--green-dark)", borderRadius: "var(--radius)", color: "var(--green-t)", fontSize: "13px", marginBottom: "14px" } }, msg), err && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red-dark)", borderRadius: "var(--radius)", color: "var(--red-t)", fontSize: "13px", marginBottom: "14px" } }, err), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, marginBottom: "18px" } }, /* @__PURE__ */ React.createElement("h3", { style: d.h3 }, "Crear usuario"), /* @__PURE__ */ React.createElement("form", { onSubmit: crearUsuario }, /* @__PURE__ */ React.createElement("div", { className: "g3", style: { ...d.g3, marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Usuario"), /* @__PURE__ */ React.createElement("input", { style: d.input, value: newUser.username, onChange: (e) => setNewUser((p) => ({ ...p, username: e.target.value })), placeholder: "nombre de usuario" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Contrase\xF1a"), /* @__PURE__ */ React.createElement("input", { style: d.input, type: "password", value: newUser.password, onChange: (e) => setNewUser((p) => ({ ...p, password: e.target.value })), placeholder: "contrase\xF1a" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Rol"), /* @__PURE__ */ React.createElement(Select, { options: [{ value: "porteria", label: "Porter\xEDa" }, { value: "admin", label: "Admin" }], value: newUser.rol, onChange: (v) => setNewUser((p) => ({ ...p, rol: v })) }))), newErr && /* @__PURE__ */ React.createElement("p", { style: { ...d.err, marginBottom: "10px" } }, newErr), /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: creating, style: { ...d.btnPrimary, opacity: creating ? 0.6 : 1 } }, creating ? "Creando..." : "+ Crear usuario"))), /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("h3", { style: d.h3 }, "Usuarios (", users.length, ")"), loading ? /* @__PURE__ */ React.createElement("div", { style: { ...d.muted, textAlign: "center", padding: "20px" } }, /* @__PURE__ */ React.createElement("span", { className: "cm-loader", role: "status", "aria-label": "Cargando" })) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } }, users.map((u) => /* @__PURE__ */ React.createElement("div", { key: u.id, style: { padding: "12px 14px", borderRadius: "var(--radius)", border: `1px solid ${u.activo ? "var(--border-light)" : "var(--border)"}`, background: u.activo ? "var(--bg-hover)" : "var(--bg-deep)", opacity: u.activo ? 1 : 0.55 } }, editing?.id === u.id ? (
    /* Modo edición */
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: "140px" } }, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Nueva contrase\xF1a"), /* @__PURE__ */ React.createElement("input", { style: d.input, type: "password", value: editing.password, onChange: (e) => setEditing((p) => ({ ...p, password: e.target.value })), placeholder: "dejar vac\xEDo = no cambiar" })), /* @__PURE__ */ React.createElement("div", { style: { minWidth: "130px" } }, /* @__PURE__ */ React.createElement("label", { style: d.label }, "Rol"), /* @__PURE__ */ React.createElement(Select, { options: [{ value: "porteria", label: "Porter\xEDa" }, { value: "admin", label: "Admin" }], value: editing.rol, onChange: (v) => setEditing((p) => ({ ...p, rol: v })) })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => guardarEdicion(u), style: d.btnPrimary }, "Guardar"), /* @__PURE__ */ React.createElement("button", { onClick: () => setEditing(null), style: d.btnGhost }, "Cancelar")))
  ) : (
    /* Vista normal */
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: "14px", color: "var(--text)" } }, u.username), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "10px", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: rolBg(u.rol), color: rolColor(u.rol) } }, u.rol), !u.activo && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "6px", fontSize: "11px", color: "var(--red-t)" } }, "DESACTIVADO")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px" } }, u.activo && /* @__PURE__ */ React.createElement("button", { onClick: () => setEditing({ id: u.id, password: "", rol: u.rol }), style: d.btnGhost }, "Editar"), /* @__PURE__ */ React.createElement("button", { onClick: () => toggleActivo(u), style: { ...d.btnDanger, background: u.activo ? "var(--red-dark)" : "var(--green-dark)", color: u.activo ? "#fca5a5" : "var(--green-t)" } }, u.activo ? "Desactivar" : "Reactivar")))
  ))), users.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { ...d.muted, textAlign: "center", padding: "20px" } }, "No hay usuarios"))));
}
function Admin({ cfg, saveCfg, registros, onPurgeDB, onReloadDB, onSyncPendientes }) {
  const [tab, setTab] = useState("usuarios");
  const tabs = [{ id: "usuarios", label: "\u{1F465} Usuarios", key: null }, { id: "proveedores", label: "\u{1F3E2} Proveedores", key: "proveedores" }, { id: "tecnicos", label: "\u{1F529} T\xE9cnicos", key: "tecnicos" }, { id: "oficina", label: "\u{1F527} Oficina T\xE9cnica", key: "oficinaTecnica" }, { id: "jefes", label: "\u{1F454} Jefes / Supervisores", key: "jefes" }, { id: "repartos", label: "\u{1F69A} Repartos", key: "repartos" }, { id: "generadores", label: "\u26A1 Equipos GE", key: "generadores" }, { id: "estados", label: "\u{1F4DD} Motivos de Ingreso", key: "motivosIngreso" }, { id: "motivos", label: "\u{1F527} Motivos GE", key: "motivosGenerador" }, { id: "backend", label: "\u{1F517} Backend", key: null }, { id: "purgar", label: "\u{1F5D1}\uFE0F Base de Datos", key: null }];
  const ct = tabs.find((t) => t.id === tab);
  return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "1100px", margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--purple-bg)", border: "1px solid var(--purple)", borderRadius: "var(--radius-lg)", padding: "13px 18px", marginBottom: "18px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "14px", fontWeight: 700, color: "var(--purple-t)" } }, "\u2699\uFE0F Panel de Administraci\xF3n"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--purple)", marginTop: "2px" } }, "Configur\xE1 los valores din\xE1micos \u2014 los cambios impactan inmediatamente en los formularios")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "18px" } }, tabs.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, onClick: () => setTab(t.id), style: { padding: "7px 13px", borderRadius: "var(--radius)", border: `1px solid ${tab === t.id ? "var(--purple)" : "var(--border-light)"}`, background: tab === t.id ? "var(--purple-bg)" : "transparent", color: tab === t.id ? "var(--purple-t)" : "var(--text-muted)", fontSize: "12px", fontWeight: tab === t.id ? 700 : 500, cursor: "pointer" } }, t.label))), tab === "usuarios" && /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text)", fontSize: "14px", lineHeight: 1.6 } }, "Los usuarios de Porter\xEDa ahora son los de Central Mantenimiento. Para dar o quitar acceso entr\xE1 a ", /* @__PURE__ */ React.createElement("a", { href: "/admin" }, "Administraci\xF3n \u2192 Accesos"), " y tild\xE1 \u201CPorter\xEDa\u201D. Los administradores de Central son administradores de Porter\xEDa.")), ct?.key && /* @__PURE__ */ React.createElement(ListEditor, { key: ct.id, title: ct.label, items: cfg[ct.key] || [], onSave: (list) => saveCfg({ ...cfg, [ct.key]: list }) }), tab === "purgar" && /* @__PURE__ */ React.createElement(PurgarDB, { registros, onPurgeDB }), tab === "backend" && /* @__PURE__ */ React.createElement(BackendPanel, { onReloadDB, onSyncPendientes, registros }));
}
function BackendPanel({ onReloadDB, onSyncPendientes, registros }) {
  const [loadingReload, setLoadingReload] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [resultReload, setResultReload] = useState(null);
  const [resultSync, setResultSync] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  React.useEffect(() => {
    stGet("porteria_v2_pending", []).then((p) => setPendingCount(p.length));
  }, []);
  const handleReload = async () => {
    setLoadingReload(true);
    setResultReload(null);
    const r = await onReloadDB();
    setResultReload(r);
    setLoadingReload(false);
  };
  const handleSync = async () => {
    setLoadingSync(true);
    setResultSync(null);
    const r = await onSyncPendientes();
    setResultSync(r);
    if (r.ok) setPendingCount(0);
    setLoadingSync(false);
  };
  const btnStyle = (color) => ({ padding: "10px 20px", background: color, color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 700, cursor: "pointer" });
  return /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("h3", { style: d.h3 }, "\u{1F517} Backend / Supabase"), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", background: "var(--green-bg)", border: "1px solid var(--green)", borderRadius: "var(--radius)", fontSize: "12px", color: "var(--green-t)", marginBottom: "20px" } }, "\u2705 ", /* @__PURE__ */ React.createElement("strong", null, "Backend:"), " ", BACKEND_URL), /* @__PURE__ */ React.createElement("div", { style: { background: pendingCount > 0 ? "var(--amber-bg)" : "var(--bg-input)", border: `1px solid ${pendingCount > 0 ? "var(--amber)" : "var(--border)"}`, borderRadius: "var(--radius)", padding: "16px", marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: 700, color: pendingCount > 0 ? "var(--amber-t)" : "var(--text)", marginBottom: "6px" } }, pendingCount > 0 ? `\u26A0\uFE0F ${pendingCount} registro${pendingCount > 1 ? "s" : ""} pendiente${pendingCount > 1 ? "s" : ""} de subir` : "\u2705 Todo sincronizado con Supabase"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginBottom: pendingCount > 0 ? "14px" : "0" } }, pendingCount > 0 ? "Estos registros se guardaron localmente cuando no hab\xEDa conexi\xF3n. Sub\xEDlos a Supabase cuando tengas internet." : "No hay registros guardados offline pendientes de sincronizaci\xF3n."), pendingCount > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: handleSync, disabled: loadingSync, style: { ...btnStyle("var(--amber)"), opacity: loadingSync ? 0.6 : 1, cursor: loadingSync ? "not-allowed" : "pointer" } }, loadingSync ? "\u23F3 Subiendo..." : "\u2B06\uFE0F Subir registros locales a Supabase"), resultSync && /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: "10px",
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    fontSize: "12px",
    background: resultSync.ok ? "var(--green-bg)" : "var(--red-bg)",
    border: `1px solid ${resultSync.ok ? "var(--green)" : "var(--red)"}`,
    color: resultSync.ok ? "var(--green-t)" : "var(--red-t)"
  } }, resultSync.ok ? `\u2705 ${resultSync.total} registros subidos correctamente.` : "\u274C Error al subir. Verific\xE1 la conexi\xF3n e intent\xE1 de nuevo."))), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" } }, "\u2601\uFE0F Recargar desde Supabase"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" } }, "Actualmente hay ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--text)" } }, registros.length, " registros"), " en la app. Si borraste o editaste registros directo en Supabase, us\xE1 esto para sincronizar."), /* @__PURE__ */ React.createElement("button", { onClick: handleReload, disabled: loadingReload, style: { ...btnStyle("var(--accent)"), opacity: loadingReload ? 0.6 : 1, cursor: loadingReload ? "not-allowed" : "pointer" } }, loadingReload ? /* @__PURE__ */ React.createElement("span", { className: "cm-loader chico", role: "status", "aria-label": "Cargando" }) : "\u2601\uFE0F Cargar datos desde Supabase"), resultReload && /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: "10px",
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    fontSize: "12px",
    background: resultReload.ok ? "var(--green-bg)" : "var(--red-bg)",
    border: `1px solid ${resultReload.ok ? "var(--green)" : "var(--red)"}`,
    color: resultReload.ok ? "var(--green-t)" : "var(--red-t)"
  } }, resultReload.ok ? `\u2705 ${resultReload.total} registros cargados desde Supabase.` : "\u274C Error al conectar con el backend. El servidor puede estar iniciando (Render tarda ~30 seg). Esper\xE1 un momento y volv\xE9 a intentar.")), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" } }, "\u{1F5D1}\uFE0F Limpiar cach\xE9 local"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" } }, "Si la app sigue mostrando registros viejos aunque los hayas borrado de Supabase, el cach\xE9 del browser est\xE1 desactualizado. Esto lo limpia y recarga todo desde cero."), /* @__PURE__ */ React.createElement("button", { onClick: async () => {
    await stSet("porteria_v2_reg", []);
    await stSet("porteria_v2_pending", []);
    window.location.reload();
  }, style: { ...btnStyle("var(--red)"), opacity: 1 } }, "\u{1F5D1}\uFE0F Limpiar cach\xE9 y recargar")));
}
function PurgarDB({ registros, onPurgeDB }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const exportAll = () => {
    const headers = ["ID", "Fecha/Hora", "Tipo", "Perfil", "M\xF3dulo", "Nombre", "Remito", "Detalle", "Motivo", "Obs", "Egreso Temprano", "Usuario"];
    const rows = registros.map((r) => [r.id, fmtDate(r.fechaHora), r.tipoOp, r.perfil, r.modulo || "general", r.nombre, r.remito, r.detalle, r.estado, r.obs, r.egresoTemprano ? "S\xED" : "No", r.usuario]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registros_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handlePurge = async () => {
    setLoading(true);
    const result = await onPurgeDB();
    setLoading(false);
    if (result.ok) {
      setConfirm(false);
      setDone(result.eliminados);
    }
  };
  if (done !== null) return /* @__PURE__ */ React.createElement("div", { style: { ...d.card, textAlign: "center", padding: "40px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "40px", marginBottom: "12px" } }, "\u2705"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "16px", fontWeight: 700, color: "var(--green-t)", marginBottom: "8px" } }, "Base de datos limpiada"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", color: "var(--text-muted)" } }, done, " registros eliminados correctamente."));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--red-bg)", border: "1px solid var(--red-dark)", borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: "18px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "20px" } }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "14px", fontWeight: 700, color: "var(--red-t)", textTransform: "uppercase", letterSpacing: "0.05em" } }, "Zona de peligro")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "13px", color: "var(--red-t)", lineHeight: 1.6, margin: 0 } }, "Esta secci\xF3n permite borrar ", /* @__PURE__ */ React.createElement("strong", null, "permanentemente"), " todos los registros de la base de datos. Esta acci\xF3n ", /* @__PURE__ */ React.createElement("strong", null, "no se puede deshacer"), ". Export\xE1 los datos antes de continuar.")), /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("h3", { style: d.h3 }, "\u{1F5D1}\uFE0F Limpiar base de datos de registros"), /* @__PURE__ */ React.createElement("div", { style: { ...d.muted, marginBottom: "20px" } }, "Registros actuales en la base: ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--text)", fontSize: "16px", marginLeft: "6px" } }, registros.length)), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "14px", padding: "14px", background: "var(--bg-input)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--accent)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "5px" } }, "Paso 1 \u2014 Exportar datos (recomendado)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" } }, "Descarg\xE1 una copia de todos los registros antes de borrar."), /* @__PURE__ */ React.createElement("button", { onClick: exportAll, style: d.btnPrimary }, "\u{1F4E5} Exportar todo a Excel/CSV")), /* @__PURE__ */ React.createElement("div", { style: { padding: "14px", background: "var(--red-bg)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--red-dark)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--red-t)", marginBottom: "5px" } }, "Paso 2 \u2014 Borrar registros"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" } }, "Se eliminar\xE1n los ", registros.length, " registros de forma permanente."), /* @__PURE__ */ React.createElement("button", { onClick: () => setConfirm(true), disabled: registros.length === 0, style: { ...d.btnDanger, fontSize: "13px", padding: "9px 18px", opacity: registros.length === 0 ? 0.4 : 1, cursor: registros.length === 0 ? "not-allowed" : "pointer" } }, "\u{1F5D1}\uFE0F Borrar todos los registros"))), confirm && ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg-sidebar)", border: "2px solid var(--red-dark)", borderRadius: "var(--radius-lg)", padding: "28px 28px", maxWidth: "460px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.7)" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: "22px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "40px", marginBottom: "10px" } }, "\u{1F6A8}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "15px", fontWeight: 800, color: "var(--red-t)", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.4, marginBottom: "14px" } }, "EST\xC1S A PUNTO DE BORRAR", /* @__PURE__ */ React.createElement("br", null), "LA BASE DE DATOS DE REGISTROS"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "10px" } }, "\xBFDESE\xC1S EXPORTAR ANTES LOS DATOS A EXCEL?"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 } }, "Se eliminar\xE1n ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--red-t)" } }, registros.length, " registros"), " permanentemente.", /* @__PURE__ */ React.createElement("br", null), "Esta acci\xF3n no se puede deshacer.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } }, /* @__PURE__ */ React.createElement("button", { onClick: exportAll, style: { ...d.btnPrimary, width: "100%", justifyContent: "center", display: "flex", fontSize: "14px", padding: "10px" } }, "\u{1F4E5} S\xED, exportar primero a Excel"), /* @__PURE__ */ React.createElement("button", { onClick: handlePurge, disabled: loading, style: { ...d.btnDanger, width: "100%", padding: "10px", fontSize: "13px", opacity: loading ? 0.6 : 1 } }, loading ? "Borrando..." : "\u{1F5D1}\uFE0F Borrar sin exportar"), /* @__PURE__ */ React.createElement("button", { onClick: () => setConfirm(false), style: { ...d.btnGhost, width: "100%" } }, "Cancelar")))),
    document.body
  ));
}
function Footer() {
  return /* @__PURE__ */ React.createElement("footer", { className: "port-footer" }, "Desarrollado por Alexis Plescia");
}
function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [registros, setRegistros] = useState([]);
  const [cfg, setCfg] = useState(DEF_CFG);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    (async () => {
      const esCfgCorrupta = (cfg3) => {
        const tieneProv = (arr) => {
          if (!arr || !arr.length) return false;
          if (arr.length > 60) return true;
          return arr.some((n) => {
            const s = (n || "").toUpperCase();
            return s.includes(" S.A") || s.includes("S.R.L") || s.includes(" SRL") || s.includes(" SA ");
          });
        };
        return tieneProv(cfg3.jefes) || tieneProv(cfg3.oficinaTecnica);
      };
      const mapReg = (r) => ({
        id: r.id,
        fechaHora: r.fecha_hora,
        tipoOp: r.tipo_op,
        perfil: r.perfil,
        nombre: r.nombre,
        remito: r.remito,
        detalle: r.detalle,
        estado: r.estado,
        obs: r.obs,
        modulo: r.modulo,
        egresoTemprano: r.egreso_temprano,
        grupoId: r.grupo_id,
        usuario: r.usuario
      });
      const localCfg = await stGet("porteria_v2_cfg", null);
      const localReg = await stGet("porteria_v2_reg", []);
      let cfg2 = localCfg && !esCfgCorrupta(localCfg) ? { ...DEF_CFG, ...localCfg } : DEF_CFG;
      setRegistros(localReg);
      setCfg(cfg2);
      setLoading(false);
      if (!user) return;
      try {
        const [resReg, resCfg] = await Promise.all([
          fetch(BACKEND_URL + "/api/registros").then((r) => r.json()).catch(() => ({ ok: false })),
          fetch(BACKEND_URL + "/api/config").then((r) => r.json()).catch(() => ({ ok: false }))
        ]);
        if (resReg.ok && Array.isArray(resReg.data)) {
          const regs = resReg.data.map(mapReg);
          setRegistros(regs);
          await stSet("porteria_v2_reg", regs);
        }
        if (resCfg.ok && resCfg.data && Object.keys(resCfg.data).length > 0) {
          if (!esCfgCorrupta(resCfg.data)) {
            const nc = { ...DEF_CFG, ...resCfg.data };
            setCfg(nc);
            await stSet("porteria_v2_cfg", nc);
          }
        }
      } catch (e) {
        console.warn("Sync backend (background) fall\xF3:", e.message);
      }
    })();
  }, [user]);
  useEffect(() => {
    const f = () => {
      setUser(null);
      setView("dashboard");
    };
    window.addEventListener("porteria:sesion-vencida", f);
    return () => window.removeEventListener("porteria:sesion-vencida", f);
  }, []);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const enviarAlBackend = async (lote) => {
    try {
      const esLote = Array.isArray(lote) && lote.length > 1;
      const url = esLote ? `${BACKEND_URL}/api/registros/lote` : `${BACKEND_URL}/api/registros`;
      const body = esLote ? lote : lote[0];
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
    } catch (err) {
      console.warn("Backend sync fall\xF3, guardando en cola pendiente:", err.message);
      const pending = await stGet("porteria_v2_pending", []);
      const ids = new Set(pending.map((r) => r.id));
      const nuevos = lote.filter((r) => !ids.has(r.id));
      if (nuevos.length > 0) await stSet("porteria_v2_pending", [...pending, ...nuevos]);
    }
  };
  const addRegistros = async (lote) => {
    const next = [...registros, ...lote];
    setRegistros(next);
    await stSet("porteria_v2_reg", next);
    const ids = [...new Set(lote.map((r) => r.id))];
    showToast(`\u2713 ${ids.join(" + ")} guardado${ids.length > 1 ? "s" : ""} correctamente`);
    enviarAlBackend(lote);
  };
  const saveCfg = async (nc) => {
    setCfg(nc);
    await stSet("porteria_v2_cfg", nc);
    showToast("\u2713 Configuraci\xF3n guardada");
    try {
      await fetch(`${BACKEND_URL}/api/config`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nc) });
    } catch (_) {
    }
  };
  const syncPendientes = async () => {
    const pending = await stGet("porteria_v2_pending", []);
    if (pending.length === 0) return { ok: true, total: 0, subidos: 0 };
    try {
      const res = await fetch(`${BACKEND_URL}/api/registros/lote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      await stSet("porteria_v2_pending", []);
      showToast(`\u2713 ${pending.length} registro${pending.length > 1 ? "s" : ""} sincronizado${pending.length > 1 ? "s" : ""} con Supabase`);
      return { ok: true, total: pending.length, subidos: data.guardados };
    } catch (err) {
      showToast("Error al sincronizar: " + err.message, "error");
      return { ok: false, total: pending.length };
    }
  };
  const reloadFromDB = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/registros`);
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.data)) throw new Error(data.error || "Respuesta inv\xE1lida");
      const regs = data.data.map((r) => ({
        id: r.id,
        fechaHora: r.fecha_hora,
        tipoOp: r.tipo_op,
        perfil: r.perfil,
        nombre: r.nombre,
        remito: r.remito,
        detalle: r.detalle,
        estado: r.estado,
        obs: r.obs,
        modulo: r.modulo,
        egresoTemprano: r.egreso_temprano,
        grupoId: r.grupo_id,
        usuario: r.usuario
      }));
      setRegistros(regs);
      await stSet("porteria_v2_reg", regs);
      showToast(`\u2713 ${regs.length} registros cargados desde Supabase`);
      return { ok: true, total: regs.length };
    } catch (err) {
      showToast("Error al cargar: " + err.message, "error");
      return { ok: false };
    }
  };
  const purgeDB = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/registros/purge`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setRegistros([]);
      await stSet("porteria_v2_reg", []);
      showToast(`\u2713 ${data.eliminados} registros eliminados`);
      return { ok: true, eliminados: data.eliminados };
    } catch (err) {
      showToast("Error al purgar: " + err.message, "error");
      return { ok: false };
    }
  };
  const nextId = () => {
    if (registros.length === 0) return 1;
    const nums = registros.map((r) => parseInt(r.id.replace(/^[A-Z]+-/, ""), 10)).filter((n) => !isNaN(n));
    return nums.length === 0 ? 1 : Math.max(...nums) + 1;
  };
  if (loading) return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" } }, /* @__PURE__ */ React.createElement(CarrefourLogo, { size: 32 }), /* @__PURE__ */ React.createElement("span", { className: "cm-loader", role: "status", "aria-label": "Cargando" }));
  if (!user) return /* @__PURE__ */ React.createElement(LoginScreen, { onLogin: setUser });
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement(Sidebar, { view, setView: (v) => {
    setView(v);
    setSidebarOpen(false);
  }, user, onLogout: () => {
    if (window.porteriaSesion && window.porteriaSesion.salir) window.porteriaSesion.salir();
    else {
      setUser(null);
      setView("dashboard");
    }
  }, sidebarOpen }), sidebarOpen && /* @__PURE__ */ React.createElement("div", { className: "sidebar-overlay", onClick: () => setSidebarOpen(false) }), /* @__PURE__ */ React.createElement("div", { className: "main-wrap", style: { flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", marginLeft: "var(--sidebar-w)" } }, /* @__PURE__ */ React.createElement(Header, { view, onMenuToggle: () => setSidebarOpen((p) => !p) }), /* @__PURE__ */ React.createElement("main", { className: "main-pad", style: { flex: 1, padding: "28px 36px", overflow: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "1440px", margin: "0 auto" } }, view === "dashboard" && /* @__PURE__ */ React.createElement(Dashboard, { registros, setView }), view === "analytics" && /* @__PURE__ */ React.createElement(Analytics, { registros, setView }), view === "nueva" && /* @__PURE__ */ React.createElement(NuevaOp, { registros, cfg, user, addRegistros, nextId, setView }), view === "generadores" && /* @__PURE__ */ React.createElement(Generadores, { registros, cfg, user, addRegistros, nextId, setView }), view === "historial" && /* @__PURE__ */ React.createElement(Historial, { registros }), view === "tempranos" && /* @__PURE__ */ React.createElement(EgresosTemprano, { registros, addRegistros, nextId, user }), view === "admin" && user.role === "admin" && /* @__PURE__ */ React.createElement(Admin, { cfg, saveCfg, registros, onPurgeDB: purgeDB, onReloadDB: reloadFromDB, onSyncPendientes: syncPendientes }))), /* @__PURE__ */ React.createElement(Footer, null)), toast && /* @__PURE__ */ React.createElement(Toast, { msg: toast.msg, type: toast.type }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
