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
const LOGO_B64 = "/porteria/logo-carrefour.png";
function CarrefourLogo({ size = 54 }) {
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
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-deep)", padding: "20px" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "36px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "16px", display: "flex", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(CarrefourLogo, { size: 64 })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" } }, "Sistema de Control de Acceso \u2014 Porter\xEDa")), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, width: "100%", maxWidth: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: "24px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "32px", marginBottom: "8px" } }, "\u{1F6E1}\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "18px", fontWeight: 700, color: "var(--text)" } }, "Iniciar Sesi\xF3n")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, loading && /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 0" } }, /* @__PURE__ */ React.createElement("span", { className: "cm-loader", role: "status", "aria-label": "Cargando" })), err && /* @__PURE__ */ React.createElement("p", { style: { ...d.err, marginBottom: "16px" } }, err), !loading && err && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: go, style: { ...d.btnPrimary, padding: "10px 18px" } }, "Reintentar"), /* @__PURE__ */ React.createElement("a", { href: "/", style: { padding: "10px 18px", fontSize: "14px", color: "var(--accent)" } }, "Volver al inicio")))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "40px", fontSize: "11px", color: "var(--text-dim)" } }, "desarrollado por alexis plescia en 2026"));
}
const NAV = [{ id: "dashboard", label: "Dashboard", icon: "\u{1F3E0}" }, { id: "analytics", label: "Analytics", icon: "\u{1F4CA}" }, { id: "nueva", label: "Nueva Operaci\xF3n", icon: "\u2795" }, { id: "generadores", label: "Grupos Electr\xF3genos", icon: "\u26A1" }, { id: "historial", label: "Historial", icon: "\u{1F4CB}" }, { id: "tempranos", label: "Pendientes de Egreso", icon: "\u23F1\uFE0F" }];
function Sidebar({ view, setView, user, onLogout, sidebarOpen }) {
  const nb = (item, accentColor) => {
    const active = view === item.id;
    const ac = accentColor || "var(--accent)";
    return /* @__PURE__ */ React.createElement("button", { key: item.id, onClick: () => setView(item.id), style: { display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", borderRadius: "var(--radius)", border: "none", background: active ? `color-mix(in srgb, ${ac} 12%, transparent)` : "transparent", color: active ? ac : "var(--text-muted)", fontWeight: active ? 600 : 400, fontSize: "14px", cursor: "pointer", textAlign: "left", marginBottom: "2px", transition: "all .15s" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "16px", lineHeight: 1, opacity: active ? 1 : 0.75 } }, item.icon), item.label);
  };
  return /* @__PURE__ */ React.createElement("aside", { className: `sidebar${sidebarOpen ? " open" : ""}`, style: { width: "var(--sidebar-w)", minHeight: "100vh", background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "22px 20px 16px", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(CarrefourLogo, { size: 48 }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "7px", letterSpacing: ".04em", fontWeight: 500 } }, "Control de Acceso")), /* @__PURE__ */ React.createElement("nav", { style: { flex: 1, padding: "14px 10px", overflowY: "auto" } }, NAV.map((item) => nb(item)), /* @__PURE__ */ React.createElement("div", { style: { height: "1px", background: "var(--border)", margin: "12px 4px" } }), user.role === "admin" && nb({ id: "admin", icon: "\u2699\uFE0F", label: "Administraci\xF3n" }, "var(--purple)")), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px", borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "34px", height: "34px", borderRadius: "50%", background: "var(--blue-bg)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "var(--accent)", flexShrink: 0 } }, user.name[0]), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "14px", fontWeight: 600, color: "var(--text)" } }, user.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" } }, user.role))), /* @__PURE__ */ React.createElement("button", { onClick: onLogout, style: { ...d.btnGhost, width: "100%", fontSize: "12px", padding: "8px" } }, "Cerrar sesi\xF3n")));
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
  const chartDias = useMemo(() => {
    if (registros.some((r) => r.tipoOp === "INGRESO" && new Date(r.fechaHora) >= hoy)) return { dr: hoy, da: ayer, fallback: false };
    var fs = registros.filter((r) => r.tipoOp === "INGRESO").map((r) => new Date(r.fechaHora)).sort((a, b) => b - a);
    if (!fs.length) return { dr: hoy, da: ayer, fallback: false };
    var dr = new Date(fs[0]); dr.setHours(0, 0, 0, 0); var da = new Date(dr); da.setDate(da.getDate() - 1);
    return { dr, da, fallback: true };
  }, [registros, hoy, ayer]);
  const traficoHoy = useMemo(() => {
    const hs = Array.from({ length: 24 }, (_, i) => ({ h: i, hoy: 0, ayer: 0 }));
    registros.filter((r) => r.tipoOp === "INGRESO" && new Date(r.fechaHora) >= chartDias.dr).forEach((r) => {
      hs[new Date(r.fechaHora).getHours()].hoy++;
    });
    registros.filter((r) => r.tipoOp === "INGRESO").filter((r) => {
      const f = new Date(r.fechaHora);
      return f >= chartDias.da && f < chartDias.dr;
    }).forEach((r) => {
      hs[new Date(r.fechaHora).getHours()].ayer++;
    });
    return hs;
  }, [registros, chartDias]);
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
  ), kpiCard("\u23F0", "Pendientes egreso", sinEgreso.length, criticos.length > 0 ? /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red-t)" } }, criticos.length, " cr\xEDtico(s) >4h") : "Sin alertas cr\xEDticas", "var(--amber-t)"), /* @__PURE__ */ React.createElement("div", { style: { ...d.card, display: "flex", flexDirection: "column", gap: "5px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "2px" } }, "\u231B Permanencia por perfil"), permPorPerfil.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)" } }, "Sin datos completos a\xFAn") : permPorPerfil.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.perfil, style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.perfil), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", fontWeight: 700, color: "var(--purple-t)", flexShrink: 0 } }, fmtMin(p.avg)))))), /* @__PURE__ */ React.createElement("div", { className: "g2", style: { display: "grid", gridTemplateColumns: "3fr 2fr", gap: "14px", marginBottom: "18px" } }, /* @__PURE__ */ React.createElement("div", { style: { ...d.card, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("h3", { style: { ...d.h3, margin: 0 } }, "\u{1F4C8} Ingresos por hora", chartDias.fallback && React.createElement("div", { style: { fontSize: "10px", fontWeight: 400, color: "var(--text-muted)", marginTop: "2px" } }, chartDias.dr.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }), " vs d\xEDa anterior")), picoHoy.hoy > 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-input)", padding: "4px 8px", borderRadius: "6px", flexShrink: 0 } }, "Pico: ", picoHoy.h, "h (", picoHoy.hoy, " ing.)") : /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" } }, "Sin datos de ingresos")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: "2px", height: "150px" } }, traficoHoy.map(({ h, hoy: th, ayer: ta }) => /* @__PURE__ */ React.createElement("div", { key: h, title: `${h}h \u2014 Hoy:${th} Ayer:${ta}`, style: { flex: 1, display: "flex", gap: "2px", alignItems: "flex-end", height: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, borderRadius: "3px 3px 0 0", background: th > 0 && th === picoHoy.hoy ? "var(--accent)" : "var(--green-dark)", height: `${Math.max(Math.round(th / traficoMax * 100), th ? 5 : 0)}%`, minHeight: th ? "6px" : "0" } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, borderRadius: "3px 3px 0 0", background: "color-mix(in srgb,var(--text-muted) 40%,transparent)", height: `${Math.max(Math.round(ta / traficoMax * 100), ta ? 5 : 0)}%`, minHeight: ta ? "6px" : "0" } })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "3px", marginTop: "4px" } }, traficoHoy.map(({ h }) => /* @__PURE__ */ React.createElement("div", { key: h, style: { flex: 1, textAlign: "center", fontSize: "9px", color: "var(--text-dim)" } }, h % 4 === 0 ? h : ""))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "14px", marginTop: "8px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "10px", height: "10px", borderRadius: "2px", background: "var(--green-dark)" } }), chartDias.fallback ? " \xDAlt. d\xEDa" : " Hoy"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "10px", height: "10px", borderRadius: "2px", background: "var(--border)" } }), chartDias.fallback ? " D\xEDa anterior" : " Ayer"))), /* @__PURE__ */ React.createElement("div", { style: d.card }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("h3", { style: { ...d.h3, margin: 0 } }, "\u{1F7E2} Adentro ahora"), adentroAhora.length > 0 && /* @__PURE__ */ React.createElement("button", { onClick: () => setView("tempranos"), style: { ...d.btnGhost, fontSize: "10px", padding: "3px 8px" } }, "Ver todos")), adentroAhora.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: d.muted }, "Nadie en el establecimiento.") : /* @__PURE__ */ React.createElement("div", { style: { maxHeight: "220px", overflowY: "auto" } }, adentroAhora.map((r) => {
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
  if (loading) return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" } }, /* @__PURE__ */ React.createElement(CarrefourLogo, { size: 56 }), /* @__PURE__ */ React.createElement("span", { className: "cm-loader", role: "status", "aria-label": "Cargando" }));
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
