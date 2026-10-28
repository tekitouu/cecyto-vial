const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const read = (key, fallback) => {
    try {
        const x = localStorage.getItem(key);
        return x === null ? fallback : JSON.parse(x);
    }
    catch {
        return fallback;
    }
};
const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));
function toast(msg) {
    const t = $("#toast"); if (!t) {
        alert(msg);
        return;
    } t.textContent = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 3000);
}
function modal(title, text, confirmText = "Confirmar", onConfirm = () => { }) {
    const m = $("#modal"); if (!m) {
        if (confirm(text))
            onConfirm();
        return;
    } $("#modalTitle").textContent = title; $("#modalText").textContent = text; $("#modalConfirm").textContent = confirmText; m.classList.add("open"); const close = () => m.classList.remove("open"); $("#modalCancel").onclick = close; $("#modalConfirm").onclick = () => { close(); onConfirm(); }; m.onclick = e => {
        if (e.target === m)
            close();
    };
}
const defaultDrivers = [
    { name: "Lucía Hernández", id: "REG-DEMO-0128", phone: "0000000000", address: "Dirección ficticia 1", fault: "Exceso de velocidad", date: "2026-10-25", status: "Seguimiento", notes: "" },
    { name: "Daniel Mendoza", id: "REG-DEMO-0127", phone: "0000000000", address: "Dirección ficticia 2", fault: "Uso del celular", date: "2026-10-25", status: "Atendido", notes: "" },
    { name: "Sofía Ríos", id: "REG-DEMO-0126", phone: "0000000000", address: "Dirección ficticia 3", fault: "Falta de cinturón", date: "2026-10-24", status: "Seguimiento", notes: "" },
    { name: "Jorge Salas", id: "REG-DEMO-0125", phone: "0000000000", address: "Dirección ficticia 4", fault: "Estacionamiento prohibido", date: "2026-10-24", status: "Atendido", notes: "" },
    { name: "Elena Navarro", id: "REG-DEMO-0124", phone: "0000000000", address: "Dirección ficticia 5", fault: "Exceso de velocidad", date: "2026-10-23", status: "Seguimiento", notes: "" }
];
const defaultUser = { name: "Mariana Torres Luna", email: "admin@cecyto.test", role: "Administración", password: "demo1234" };
function getDrivers() { return read("cecyto_drivers", defaultDrivers); }
function getUsers() {
    let users = read("cecyto_users", null); if (!Array.isArray(users) || !users.length) {
        users = [defaultUser];
        write("cecyto_users", users);
    } if (!users.some(u => u.role === "Administración")) {
        users.unshift(defaultUser);
        write("cecyto_users", users);
    } return users;
}
function getUser() { const session = read("cecyto_session", null); const users = getUsers(); return users.find(u => session && u.email.toLowerCase() === String(session.email || "").toLowerCase()) || defaultUser; }
function isAdmin() { return getUser().role === "Administración"; }
function requireAdminPage() {
    const page = location.pathname.split("/").pop();
    const adminPages = ["conductores.html", "nuevo-conductor.html", "estadisticas.html"];
    if (!adminPages.includes(page)) return true;
    const session = read("cecyto_session", null);
    const activeUser = getUsers().find(user => session && user.email.toLowerCase() === String(session.email || "").toLowerCase());
    if (!activeUser || activeUser.role !== "Administración") {
        location.replace(session ? "dashboard.html" : "index.html");
        return false;
    }
    return true;
}
function initials(n) { return (n || "Usuario").split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || "").join(""); }
function updateHeader() {
    const u = getUser();
    $$('[data-admin-only]').forEach(el => el.hidden = !isAdmin());
    $$('[data-driver-only]').forEach(el => el.hidden = isAdmin());
    if (!isAdmin()) {
        const stat = $("#statDrivers");
        if (stat) stat.closest("article")?.remove();
        const manageCard = [...document.querySelectorAll("a[href=\"conductores.html\"]")].find(a => a.textContent.toLowerCase().includes("gestionar"));
        manageCard?.closest("article")?.remove();
    }
    const headerAvatar = $("#headerAvatar");
    if (headerAvatar) headerAvatar.innerHTML = u.photo ? `<img src="${u.photo}" alt="Foto de perfil" class="avatar-photo">` : initials(u.name);
    if ($("#headerName"))
        $("#headerName").textContent = u.name.split(" ").slice(0, 2).join(" ");
    if ($("#headerRole")) $("#headerRole").textContent = u.role;
    const greeting = $("#dashboardGreeting");
    if (greeting) greeting.textContent = `${isAdmin() ? "Bienvenida" : "Bienvenido/a"}, ${u.name.split(" ")[0]}`; 
}
updateHeader();
if (!requireAdminPage()) { }
$$("[data-logout]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); location.href = "cerrar-sesion.html"; }));
if ($("#loginForm"))
    $("#loginForm").addEventListener("submit", e => {
        e.preventDefault(); const email = $("#email").value.trim(), pass = $("#password").value; const u = getUsers().find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === pass); if (u) {
            write("cecyto_session", { email: u.email, at: Date.now() });
            location.href = "dashboard.html";
        }
        else
            toast("Correo o contraseña incorrectos. Para probar la administración usa admin@cecyto.test / demo1234; también puedes registrar un conductor.");
    });
if ($("#forgotLink"))
    $("#forgotLink").addEventListener("click", e => { e.preventDefault(); toast("Recuperación no disponible: esta versión no usa servidor de correo."); });
if ($("#registerForm"))
    $("#registerForm").addEventListener("submit", e => {
        e.preventDefault(); if ($("#regPass").value !== $("#regConfirm").value) {
            toast("Las contraseñas no coinciden.");
            return;
        } const users = getUsers(), email = $("#regEmail").value.trim(); if (users.some(x => x.email.toLowerCase() === email.toLowerCase())) {
            toast("Ya existe una cuenta con ese correo.");
            return;
        } const u = { name: $("#regName").value.trim(), email, role: "Conductor", password: $("#regPass").value }; users.push(u); write("cecyto_users", users); write("cecyto_session", { email: u.email, at: Date.now() }); location.href = "dashboard.html";
    });
const defaultRules = [
    { title: "Exceso de velocidad", cat: "Velocidad y prevención", desc: "Ajusta la velocidad al entorno y conserva una distancia segura.", photo: "https://acnews.blob.core.windows.net/imgnews/large/NAZ_e598d80f614849ce83743505ba297903.jpg", photoAlt: "Automóvil en carretera", recommend: ["Respeta la señalización y reduce la velocidad en zonas escolares y peatonales.", "Conserva una distancia de seguridad y aumenta la precaución con pavimento mojado.", "Anticipa los cruces y evita acelerar para intentar ganar el paso."], text: "Circular a una velocidad inadecuada para el entorno reduce el tiempo de reacción y aumenta la distancia necesaria para detener el vehículo. Adapta tu conducción a la señalización, al clima y a la presencia de peatones." },
    { title: "Uso del celular al conducir", cat: "Atención al conducir", desc: "Evita distracciones y mantén la atención en el camino.", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRA6-SMlrZGkSKKAOQa5FdadpB2VZtbh38Njz-qls-KodY6S0OtVLCRg&s=10", photoAlt: "Teléfono móvil como recordatorio de evitar distracciones", recommend: ["Configura la ruta antes de iniciar el trayecto.", "Si necesitas responder, detente en un lugar permitido y seguro.", "No manipules el teléfono mientras el vehículo está en movimiento."], text: "Mirar o manipular el teléfono desvía la atención visual, manual y cognitiva de la conducción. Detente en un lugar seguro antes de atender una llamada o mensaje." },
    { title: "Falta de cinturón", cat: "Protección de ocupantes", desc: "Usa el cinturón y verifica que todos los ocupantes lo utilicen.", photo: "https://www.allenandallen.com/wp-content/uploads/2018/12/failure-to-wear-seatbelt-and-personal-injury-case.jpg", photoAlt: "Interior de automóvil", recommend: ["Coloca el cinturón antes de iniciar la marcha.", "Asegúrate de que la banda no esté torcida.", "Verifica que todos los ocupantes estén correctamente sujetos."], text: "El cinturón de seguridad ayuda a reducir el riesgo de lesiones durante una frenada brusca o colisión. Debe utilizarse correctamente en todos los trayectos." },
    { title: "Estacionamiento prohibido", cat: "Uso de la vía pública", desc: "Respeta los espacios señalizados y los accesos peatonales.", photo: "https://www.arpem.com/wp-content/uploads/2023/04/prohibicion-parada-y-prohibicion-estacionamiento.jpg", photoAlt: "Vehículos estacionados en la vía pública", recommend: ["No bloquees rampas, cruces peatonales ni accesos.", "Revisa las señales y marcas viales antes de estacionarte.", "Deja libres las zonas destinadas a servicios de emergencia."], text: "Estacionarse en zonas no permitidas puede obstruir la visibilidad, dificultar el paso de peatones y bloquear accesos. Consulta la señalización y las normas locales aplicables." },
    { title: "No ceder el paso al peatón", cat: "Peatones y cruces", desc: "Reduce la velocidad y permite el cruce seguro de peatones.", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXwlaWvQD_tzs08k0cwyAeWSjqdABMsRNq1Vo95B8Yb3G0Jt3cVsQQOY__&s=10", photoAlt: "Calle urbana y zona peatonal", recommend: ["Observa cruces peatonales y esquinas.", "No bloquees el paso ni adelantes a un vehículo detenido para ceder el cruce.", "Extrema precauciones cerca de escuelas, parques y paradas."], text: "Las personas peatonas son usuarias vulnerables de la vía. Reduce la velocidad al aproximarte a cruces y sigue las indicaciones de señalización y del personal vial." },
    { title: "Conducir bajo efectos del alcohol", cat: "Conducción preventiva", desc: "Si consumes alcohol, no conduzcas; elige un traslado seguro.", photo: "https://acnews.blob.core.windows.net/imgnews/medium/NAZ_d32ba221e4bd463b9df2be24116c7745.jpg", photoAlt: "Automóvil en vía", recommend: ["Designa a una persona conductora que no haya consumido alcohol.", "Usa transporte público o un servicio de traslado.", "No confíes en café, duchas o descansos breves para eliminar sus efectos."], text: "El alcohol afecta la percepción, coordinación y capacidad de reacción. La decisión segura es no conducir después de consumirlo. Las sanciones dependen de la normativa aplicable." },
    { title: "No usar casco en motocicleta", cat: "Protección de ocupantes", desc: "Utiliza casco certificado y correctamente abrochado.", photo: "https://ucarecdn.com/04e9bb36-1060-41b7-b817-fb453cf17c22/-/format/auto/-/preview/960x960/-/quality/lightest/Errores-uso-casco-motocicleta.png", photoAlt: "Motocicleta en estacionamiento", recommend: ["Ajusta y abrocha el casco antes de arrancar.", "Usa equipo visible y adecuado al trayecto.", "Asegúrate de que el acompañante también lleve casco."], text: "El casco reduce el riesgo de lesiones graves en la cabeza. Revisa su ajuste y estado; consulta las reglas locales sobre equipamiento obligatorio." },
    { title: "No respetar el semáforo", cat: "Señalización", desc: "Obedece los semáforos y detente ante la luz roja.", photo: "https://tvazteca-adnnoticias-prod.web.arc-cdn.net/resizer/v2/OFQUHINADBGBRMIJWFKNHGPVLY.jpg?smart=true&auth=26b172b3a26dabb91a2c808e48093ee1a9ce76b15a6685d3b5d2fbdf859022c2&width=2048&height=1152", photoAlt: "Cruce vial urbano", recommend: ["Reduce la velocidad al aproximarte a una intersección.", "No avances con luz roja ni bloquees el cruce.", "Observa peatones y ciclistas al iniciar la marcha."], text: "Los semáforos organizan los movimientos en las intersecciones. Respeta las indicaciones luminosas y mantén libre el área de cruce." },
    { title: "No mantener distancia de seguridad", cat: "Velocidad y prevención", desc: "Deja espacio suficiente para frenar sin colisionar.", photo: "https://i0.wp.com/www.automotoryventas.com/wp-content/uploads/2020/08/distancia-de-seguiridad.jpg?fit=1200%2C800&ssl=1", photoAlt: "Carretera y circulación", recommend: ["Aumenta la distancia cuando llueve o hay poca visibilidad.", "Evita seguir demasiado cerca al vehículo delantero.", "Anticipa frenadas y evita maniobras bruscas."], text: "La distancia de seguimiento debe permitir detener el vehículo de forma segura. Ajusta el espacio a la velocidad, el clima, la visibilidad y el estado del pavimento." },
    { title: "Cambiar de carril sin señalizar", cat: "Conducción preventiva", desc: "Indica tus maniobras y revisa los puntos ciegos.", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGu-vT-r9BJ28E1ERZVCf_1XXwY1BIfLmWac8f9uLeNWpXOBs0CO0u6i0&s=10", photoAlt: "Conducción desde el interior de un automóvil", recommend: ["Activa la direccional con anticipación.", "Revisa espejos y puntos ciegos antes de moverte.", "Cambia de carril solo cuando haya espacio suficiente."], text: "Señalizar las maniobras permite que otras personas anticipen tus movimientos. Usa direccionales y verifica que el cambio pueda hacerse sin riesgo." },
    { title: "Conducir con fatiga", cat: "Atención al conducir", desc: "Detente y descansa cuando disminuya tu atención.", photo: "https://rentingfinders.com/wp-content/uploads/2020/12/estres-cansancio-conducir-coche-seguridad-1024x683.jpg", photoAlt: "Paisaje de carretera y montañas", recommend: ["Duerme lo suficiente antes de un viaje largo.", "Programa descansos y comparte la conducción si es posible.", "Si bostezas constantemente o pierdes concentración, detente en un sitio seguro."], text: "La fatiga reduce la atención y los reflejos. No continúes si tienes sueño; busca un lugar seguro para descansar antes de retomar el trayecto." },
    { title: "No revisar el vehículo antes de salir", cat: "Mantenimiento preventivo", desc: "Revisa neumáticos, luces, frenos y niveles básicos.", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyGgxz-oL_p102GlYZIW77NiFICNdrB4DSXTx92vLD5pQ8ymYUeI-w5rE&s=10", photoAlt: "Revisión y mantenimiento de automóvil", recommend: ["Verifica presión y estado de los neumáticos.", "Comprueba luces, frenos y limpiaparabrisas.", "Ante una falla relevante, no inicies el trayecto hasta revisarla."], text: "Una revisión básica antes de circular ayuda a detectar fallas que pueden comprometer la seguridad. Sigue el manual del vehículo y acude a mantenimiento profesional cuando sea necesario." }
];
let rules = read("cecyto_rules", defaultRules);
function saveRules() { write("cecyto_rules", rules); }
function editRule(rule = null) {
    if (!isAdmin()) return toast("Solo administración puede gestionar las reglas.");
    const title = prompt("Nombre de la regla:", rule?.title || ""); if (title === null || !title.trim()) return;
    const cat = prompt("Categoría:", rule?.cat || "Conducción preventiva"); if (cat === null || !cat.trim()) return;
    const desc = prompt("Descripción breve:", rule?.desc || ""); if (desc === null) return;
    const photo = prompt("URL directa de la imagen:", rule?.photo || ""); if (photo === null) return;
    const photoAlt = prompt("Descripción de la imagen:", rule?.photoAlt || title); if (photoAlt === null) return;
    const text = prompt("Información educativa:", rule?.text || desc); if (text === null) return;
    const recommendations = prompt("Tres recomendaciones separadas por | :", (rule?.recommend || ["", "", ""]).join(" | ")); if (recommendations === null) return;
    const updated = { title: title.trim(), cat: cat.trim(), desc: desc.trim(), photo: photo.trim(), photoAlt: photoAlt.trim(), text: text.trim(), recommend: recommendations.split("|").map(x => x.trim()).filter(Boolean) };
    if (rule) rules = rules.map(r => r === rule ? updated : r);
    else rules.unshift(updated);
    saveRules(); renderRules(); toast(rule ? "Regla actualizada." : "Regla añadida.");
}
function favoriteTitles() {
    const all = read("cecyto_favorites", {});
    return Array.isArray(all[getUser().email.toLowerCase()]) ? all[getUser().email.toLowerCase()] : [];
}
function toggleFavorite(title) {
    const all = read("cecyto_favorites", {});
    const email = getUser().email.toLowerCase();
    const list = Array.isArray(all[email]) ? all[email] : [];
    all[email] = list.includes(title) ? list.filter(x => x !== title) : [...list, title];
    write("cecyto_favorites", all);
    if ($("#ruleCards")) renderRules();
    if ($("#ruleDetail")) renderRuleDetail();
    renderDriverHub();
    toast(all[email].includes(title) ? "Regla guardada en favoritos." : "Regla quitada de favoritos.");
}
function renderRules() {
    if (!$("#ruleCards")) return;
    const admin = isAdmin();
    const favorites = favoriteTitles();
    let arr = [...rules];
    const q = ($("#ruleSearch")?.value || "").toLowerCase();
    const catSelect = $("#ruleCategory");
    const cat = catSelect?.value || "";
    if (catSelect) {
        const categories = [...new Set(rules.map(r => r.cat).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
        catSelect.innerHTML = `<option value="">Todas</option>${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
        catSelect.value = categories.includes(cat) ? cat : "";
    }
    if (q) arr = arr.filter(r => (r.title + " " + r.desc + " " + r.cat).toLowerCase().includes(q));
    if (catSelect?.value) arr = arr.filter(r => r.cat === catSelect.value);
    if ($("#ruleSort")?.value === "za") arr.reverse();
    const manager = $("#ruleManager");
    if (manager && admin) manager.innerHTML = `<div class="card" style="margin-bottom:16px"><div class="page-head"><div><h2>Administrar reglas</h2><p>Añade nuevas reglas o modifica y elimina las existentes.</p></div><button id="addRuleBtn" type="button">＋ Añadir regla</button></div></div>`;
    if (manager && !admin) manager.innerHTML = "";
    $("#ruleCards").innerHTML = arr.map(r => `<article class="card quick-card"><img class="topic-photo" src="${escapeHtml(r.photo)}" alt="${escapeHtml(r.photoAlt)}" loading="lazy" onerror="this.style.display='none'"><div><span class="badge">${escapeHtml(r.cat)}</span><h3 style="margin-top:9px">${escapeHtml(r.title)}</h3><p>${escapeHtml(r.desc)}</p></div><div class="form-actions"><a class="btn secondary small" href="detalle-reglamento.html?tema=${encodeURIComponent(r.title)}">Ver detalles →</a><button class="secondary small" type="button" data-favorite="${escapeHtml(r.title)}">${favorites.includes(r.title) ? "★ Guardada" : "☆ Guardar regla"}</button></div>${admin ? `<div class="form-actions"><button class="secondary small" data-rule-edit="${encodeURIComponent(r.title)}" type="button">Editar</button><button class="danger small" data-rule-delete="${encodeURIComponent(r.title)}" type="button">Eliminar</button></div>` : ""}</article>`).join("") || `<div class="empty span-3"><strong>No se encontraron contenidos</strong><span class="muted">Prueba otra palabra o categoría.</span></div>`;
    if ($("#ruleCount")) $("#ruleCount").textContent = `Mostrando ${arr.length} de ${rules.length} contenidos educativos.`;
    $("#addRuleBtn")?.addEventListener("click", () => editRule());
    $$('[data-favorite]').forEach(btn => btn.onclick = () => toggleFavorite(btn.dataset.favorite));
    $$('[data-rule-edit]').forEach(btn => btn.onclick = () => { const title = decodeURIComponent(btn.dataset.ruleEdit); const rule = rules.find(r => r.title === title); if (rule) editRule(rule); });
    $$('[data-rule-delete]').forEach(btn => btn.onclick = () => { const title = decodeURIComponent(btn.dataset.ruleDelete); if (!isAdmin()) return; if (confirm(`¿Eliminar la regla "${title}"?`)) { rules = rules.filter(r => r.title !== title); saveRules(); renderRules(); toast("Regla eliminada."); } });
}
if ($("#ruleCards")) {
    renderRules();
    $("#ruleFilter").onclick = renderRules;
    $("#ruleSearch").addEventListener("input", renderRules);
}
function renderRuleDetail() {
    if (!$("#ruleDetail")) return;
    const title = new URLSearchParams(location.search).get("tema") || rules[0].title;
    const r = rules.find(x => x.title === title) || rules[0];
    const saved = favoriteTitles().includes(r.title);
    $("#ruleDetail").innerHTML = `<div class="breadcrumb">Reglamento vial / Detalle educativo</div><div class="page-head"><div><a class="muted" href="reglamento.html">← Volver al catálogo</a><h1 style="margin-top:12px">${escapeHtml(r.title)}</h1><p>${escapeHtml(r.desc)}</p></div></div><div class="card"><div class="two-col"><img class="topic-photo" style="height:100%;min-height:190px" src="${escapeHtml(r.photo)}" alt="${escapeHtml(r.photoAlt)}" onerror="this.style.display='none'"><div><span class="badge warn">Artículo por verificar</span><h3 style="margin-top:10px">Información educativa</h3><p>${escapeHtml(r.text)}</p><div class="notice"><span class="notice-icon">i</span><span>La sanción aplicable está pendiente de verificación con el reglamento vigente.</span></div></div></div></div><div class="card" style="margin-top:16px"><h2>Recomendaciones para una conducción responsable</h2><ul>${r.recommend.map(x => `<li style="margin:9px 0">${escapeHtml(x)}</li>`).join("")}</ul></div><div class="card" style="margin-top:16px"><h2>Fuentes para ampliar</h2><p>Consulta materiales institucionales para contrastar las recomendaciones y revisar la normativa aplicable a tu localidad.</p><div class="form-actions"><a class="btn secondary" target="_blank" rel="noopener" href="https://legislacion.edomex.gob.mx/sites/legislacion.edomex.gob.mx/files/files/pdf/rgl/vig/rglvig079.pdf">Reglamento de Tránsito del Estado de México ↗</a><a class="btn secondary" target="_blank" rel="noopener" href="https://villavictoria.edomex.gob.mx/sites/villavictoria.edomex.gob.mx/files/files/acerca%20del%20ayuntamiento/Marco%20Juridico/CODIGO%20REGLAMENTARIO.pdf">Código Reglamentario de Villa Victoria ↗</a><a class="btn secondary" target="_blank" rel="noopener" href="https://sseguridad.edomex.gob.mx/infracciones-transito">Portal estatal de infracciones ↗</a><a class="btn secondary" target="_blank" rel="noopener" href="https://www.gob.mx/salud/documentos/guias-para-prevenir-accidentes-de-transito-304940">Guías de prevención · Secretaría de Salud ↗</a></div><small>Verifica la versión vigente y la competencia de la autoridad. Las recomendaciones educativas no sustituyen la consulta legal.</small></div><div class="notice"><span class="notice-icon">i</span><span>Contenido educativo. Verifica los artículos y sanciones en la normativa oficial correspondiente.</span></div><div class="form-actions" style="margin-top:14px"><button class="secondary" type="button" id="detailFavoriteBtn">${saved ? "★ Quitar de mis reglas guardadas" : "☆ Guardar en mis reglas"}</button><a class="btn" href="cuestionario.html">Consultar cuestionario relacionado</a></div>`;
    $("#detailFavoriteBtn")?.addEventListener("click", () => toggleFavorite(r.title));
}
if ($("#ruleDetail")) renderRuleDetail();
const questions = [
    { q: "¿Qué debes hacer al acercarte a un cruce peatonal con personas esperando?", a: ["Acelerar para pasar antes que los peatones.", "Reducir la velocidad y ceder el paso de forma segura.", "Tocar el claxon para que esperen.", "Mantener la velocidad sin observar el entorno."], correct: 1, cat: "Seguridad vial" },
    { q: "¿Qué debes hacer si necesitas leer un mensaje mientras conduces?", a: ["Leerlo rápidamente sin bajar la velocidad.", "Pedir al pasajero que sostenga el volante.", "Detenerte en un lugar permitido y seguro.", "Mirar solo cuando el camino esté despejado."], correct: 2, cat: "Atención al conducir" },
    { q: "¿Cuándo debes usar el cinturón de seguridad?", a: ["Solo en carretera.", "Solo el conductor debe usarlo.", "En todos los trayectos y todos los ocupantes.", "Cuando el viaje sea largo."], correct: 2, cat: "Protección de ocupantes" },
    { q: "¿Cómo debes ajustar la velocidad cuando llueve?", a: ["Mantener la velocidad habitual.", "Aumentar la velocidad para salir rápido.", "Reducir la velocidad y aumentar la distancia.", "Frenar bruscamente en cada curva."], correct: 2, cat: "Velocidad y prevención" },
    { q: "¿Dónde debes estacionarte?", a: ["En cualquier espacio libre.", "En un sitio permitido y señalizado.", "Sobre la rampa peatonal si es rápido.", "Bloqueando parcialmente la banqueta."], correct: 1, cat: "Uso de la vía pública" },
    { q: "¿Qué indica una señal de alto?", a: ["Reducir un poco y continuar.", "Detener completamente el vehículo y verificar.", "Acelerar si no ves otros vehículos.", "Solo detenerse si hay peatones."], correct: 1, cat: "Señalización" },
    { q: "¿Qué distancia debes mantener respecto al vehículo de adelante?", a: ["La mínima posible.", "Una distancia que permita detenerte con seguridad.", "Exactamente medio metro.", "Ninguna si circulas despacio."], correct: 1, cat: "Conducción preventiva" },
    { q: "¿Qué debes hacer antes de cambiar de carril?", a: ["Cambiar rápido sin avisar.", "Usar direccional y revisar puntos ciegos.", "Tocar el claxon y moverte.", "Frenar de golpe."], correct: 1, cat: "Conducción preventiva" },
    { q: "¿Qué haces si estás cansado y te cuesta concentrarte?", a: ["Abrir la ventana y seguir sin pausa.", "Subir la música.", "Detenerte en un lugar seguro y descansar.", "Acelerar para llegar antes."], correct: 2, cat: "Atención al conducir" },
    { q: "¿Qué debes hacer al aproximarte a una zona escolar?", a: ["Reducir la velocidad y estar atento.", "Usar el claxon continuamente.", "Rebasar a los vehículos detenidos.", "Mantener velocidad de carretera."], correct: 0, cat: "Seguridad vial" }
];
const quizUserKey = encodeURIComponent(getUser().email.toLowerCase());
let quizAnswers = read(`cecyto_quiz_answers_${quizUserKey}`, {}), quizIndex = 0;
function renderQuiz() {
    if (!$("#questionText"))
        return; const q = questions[quizIndex]; $("#questionNumber").textContent = `Pregunta ${quizIndex + 1} de ${questions.length}`; $("#questionCategory").textContent = q.cat; $("#questionText").textContent = q.q; $("#quizProgress").style.width = ((quizIndex + 1) / questions.length * 100) + "%"; $("#answerOptions").innerHTML = q.a.map((a, i) => `<label class="quiz-option ${quizAnswers[quizIndex] === i ? "selected" : ""}"><input type="radio" name="answer" value="${i}" ${quizAnswers[quizIndex] === i ? "checked" : ""}><span>${a}</span></label>`).join(""); $$('input[name="answer"]').forEach(x => x.addEventListener("change", () => { quizAnswers[quizIndex] = Number(x.value); write(`cecyto_quiz_answers_${quizUserKey}`, quizAnswers); renderQuiz(); })); const count = Object.keys(quizAnswers).length; $("#pendingText").textContent = `Quedan ${questions.length - count} preguntas sin responder.`; $("#answerProgress").style.width = count / questions.length * 100 + "%"; $("#confirmText").textContent = count === questions.length ? "Todas las preguntas tienen respuesta. Puedes finalizar el cuestionario." : `Has respondido ${count} de ${questions.length} preguntas.`; $("#prevQuestion").disabled = quizIndex === 0; $("#nextQuestion").textContent = quizIndex === questions.length - 1 ? "Ver resultado →" : "Siguiente →";
}
if ($("#questionText")) {
    renderQuiz();
    $("#prevQuestion").onclick = () => { quizIndex = Math.max(0, quizIndex - 1); renderQuiz(); };
    $("#nextQuestion").onclick = () => {
        if (quizIndex < questions.length - 1) {
            quizIndex++;
            renderQuiz();
        }
        else
            finishQuiz();
    };
    $("#finishQuiz").onclick = () => modal("Finalizar cuestionario", "¿Quieres calcular el resultado con las respuestas actuales? Las preguntas sin responder contarán como incorrectas.", "Finalizar", finishQuiz);
    $("#reviewQuiz").onclick = () => { const first = questions.findIndex((_, i) => quizAnswers[i] === undefined); quizIndex = first < 0 ? 0 : first; renderQuiz(); toast(first < 0 ? "Todas las preguntas tienen respuesta." : "Te llevé a la primera pregunta pendiente."); };
}
function finishQuiz() {
    let correct = 0; questions.forEach((q, i) => {
        if (quizAnswers[i] === q.correct)
            correct++;
    }); const result = { correct, total: questions.length, percent: Math.round(correct / questions.length * 100), date: new Date().toISOString() };
    write(`cecyto_quiz_result_${quizUserKey}`, result);
    const histories = read("cecyto_quiz_history", {});
    const email = getUser().email.toLowerCase();
    histories[email] = Array.isArray(histories[email]) ? histories[email] : [];
    histories[email].unshift(result);
    write("cecyto_quiz_history", histories);
    write(`cecyto_quiz_answers_${quizUserKey}`, {});
    location.href = "resultado.html";
}
if ($("#resultSummary")) {
    const r = read(`cecyto_quiz_result_${encodeURIComponent(getUser().email.toLowerCase())}`, { correct: 0, total: 10, percent: 0 });
    $("#resultSummary").innerHTML = `<div class="grid stats" style="margin:0"><div><div class="eyebrow">Resultado final</div><div style="font-size:42px;font-weight:800;letter-spacing:-2px">${r.correct}/${r.total}</div><span class="badge ${r.percent >= 80 ? "good" : "warn"}">${r.percent >= 80 ? "Aprobado" : "Requiere repaso"}</span></div><div class="stat" style="--accent:var(--sky)"><div class="label">Correctas</div><div class="value">${r.correct}</div></div><div class="stat" style="--accent:var(--pink)"><div class="label">Incorrectas o pendientes</div><div class="value">${r.total - r.correct}</div></div></div><p style="margin-top:15px">Resultado: <b>${r.percent}%</b>. ${r.percent >= 80 ? "Cumpliste el umbral ilustrativo de aprobación (80%)." : "No alcanzaste el umbral ilustrativo de aprobación (80%). Revisa las recomendaciones y vuelve a intentarlo."}</p>`;
}
if ($("#retryQuiz"))
    $("#retryQuiz").onclick = () => { write(`cecyto_quiz_answers_${encodeURIComponent(getUser().email.toLowerCase())}`, {}); location.href = "cuestionario.html"; };
let driverPage = 0;
function renderDrivers() {
    if (!isAdmin()) { location.replace("dashboard.html"); return; }
    if (!$("#driverRows"))
        return; const q = ($("#driverSearch").value || "").toLowerCase(), fault = $("#driverFault").value, status = $("#driverStatus").value; const arr = getDrivers().filter(d => (d.name + " " + d.id).toLowerCase().includes(q) && (!fault || d.fault === fault) && (!status || d.status === status)); const start = driverPage * 5, view = arr.slice(start, start + 5); $("#driverRows").innerHTML = view.map(d => `<tr><td><strong>${escapeHtml(d.name)}</strong></td><td>${escapeHtml(d.id)}</td><td>${escapeHtml(d.fault)}</td><td>${d.date || "—"}</td><td><span class="badge ${d.status === "Atendido" ? "good" : "warn"}">${d.status || "Seguimiento"}</span></td><td><button class="ghost small" data-view="${escapeHtml(d.id)}">Consultar</button> <button class="ghost small" data-edit="${escapeHtml(d.id)}">Editar</button> <button class="ghost small" data-delete="${escapeHtml(d.id)}">Eliminar</button></td></tr>`).join("") || `<tr><td colspan="6"><div class="empty"><strong>Sin registros</strong><span class="muted">No hay coincidencias con los filtros aplicados.</span><br><a class="btn secondary small" href="nuevo-conductor.html" style="margin-top:10px">Crear un registro</a></div></td></tr>`; $("#driverCount").textContent = `Mostrando ${arr.length ? start + 1 : 0}–${Math.min(start + 5, arr.length)} de ${arr.length} registros filtrados`; $("#driverPrev").disabled = driverPage === 0; $("#driverNext").disabled = start + 5 >= arr.length; $$("[data-delete]").forEach(b => b.onclick = () => modal("Eliminar registro", "¿Eliminar este registro? Esta acción no se puede deshacer.", "Eliminar", () => { write("cecyto_drivers", getDrivers().filter(d => d.id !== b.dataset.delete)); renderDrivers(); toast("Registro eliminado."); })); $$("[data-edit]").forEach(b => b.onclick = () => { write("cecyto_edit_driver", b.dataset.edit); location.href = "nuevo-conductor.html?editar=1"; }); $$("[data-view]").forEach(b => b.onclick = () => { const d = getDrivers().find(x => x.id === b.dataset.view); modal("Detalle del registro", `${d.name} · ${d.id} · ${d.fault} · ${d.status}`, "Cerrar", () => { }); });
}
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
if ($("#driverRows")) {
    renderDrivers();
    $("#driverFilter").onclick = () => { driverPage = 0; renderDrivers(); };
    $("#driverSearch").addEventListener("input", () => { driverPage = 0; renderDrivers(); });
    $("#driverPrev").onclick = () => { driverPage = Math.max(0, driverPage - 1); renderDrivers(); };
    $("#driverNext").onclick = () => { driverPage++; renderDrivers(); };
}
if ($("#driverForm")) {
    if (!isAdmin()) { location.replace("dashboard.html"); }
    const editId = new URLSearchParams(location.search).get("editar") === "1" ? read("cecyto_edit_driver", null) : null;
    const existing = getDrivers().find(d => d.id === editId);
    if (existing) {
        $("#driverName").value = existing.name;
        $("#driverId").value = existing.id;
        $("#driverPhone").value = existing.phone;
        $("#driverAddress").value = existing.address;
        $("#driverType").value = existing.fault;
        $("#driverDate").value = existing.date;
        $("#driverNotes").value = existing.notes || "";
        $("#driverId").readOnly = true;
        document.querySelector(".page-head h1").textContent = "Editar registro";
    }
    else if ($("#driverDate"))
        $("#driverDate").value = new Date().toISOString().slice(0, 10);
    $("#driverForm").addEventListener("submit", e => {
        e.preventDefault(); const d = { name: $("#driverName").value.trim(), id: $("#driverId").value.trim(), phone: $("#driverPhone").value.trim(), address: $("#driverAddress").value.trim(), fault: $("#driverType").value, date: $("#driverDate").value, status: existing?.status || "Seguimiento", notes: $("#driverNotes").value.trim() }; if (!/^\d{10}$/.test(d.phone)) {
            toast("El teléfono debe tener exactamente 10 dígitos.");
            return;
        } let arr = getDrivers(); if (existing)
            arr = arr.map(x => x.id === editId ? d : x);
        else {
            if (arr.some(x => x.id.toLowerCase() === d.id.toLowerCase())) {
                toast("Ese identificador ya existe.");
                return;
            }
            arr.unshift(d);
        } write("cecyto_drivers", arr); localStorage.removeItem("cecyto_edit_driver"); toast(existing ? "Registro actualizado." : "Registro guardado."); setTimeout(() => location.href = "conductores.html", 650);
    });
}
if ($("#statsDrivers")) $("#statsDrivers").textContent = getDrivers().length;
if ($("#statsApply"))
    $("#statsApply").onclick = () => { const n = getDrivers().length; $("#statsDrivers").textContent = n; toast("Filtros de demostración aplicados."); };
const vehicleChecks = [
    "Cinturón de seguridad en buen estado",
    "Llantas con presión y dibujo adecuados",
    "Luces y direccionales funcionando",
    "Espejos ajustados y parabrisas limpio",
    "Frenos y claxon en condiciones adecuadas",
    "Combustible suficiente para el trayecto",
    "Documentos requeridos y ruta revisados"
];
const dailyTips = [
    "Antes de arrancar, ajusta asiento y espejos con el vehículo detenido.",
    "Aumenta la distancia de seguimiento cuando llueva o haya poca visibilidad.",
    "Las direccionales avisan tus maniobras; úsalas con anticipación.",
    "Nunca manipules el teléfono mientras conduces. Detente en un lugar seguro si necesitas usarlo.",
    "En zonas escolares, reduce la velocidad y espera movimientos inesperados.",
    "Si sientes sueño o fatiga, detente en un lugar seguro y descansa.",
    "Antes de abrir una puerta hacia la calle, revisa si se aproximan ciclistas o vehículos."
];
function currentUserKey() { return getUser().email.toLowerCase(); }
function renderDriverHub() {
    if (!$("#driverHub") || isAdmin()) return;
    const email = currentUserKey();
    const histories = read("cecyto_quiz_history", {});
    const attempts = Array.isArray(histories[email]) ? histories[email] : [];
    const favorites = favoriteTitles();
    const best = attempts.reduce((n, item) => Math.max(n, Number(item.percent) || 0), 0);
    if ($("#myQuizCount")) $("#myQuizCount").textContent = attempts.length;
    if ($("#myBestScore")) $("#myBestScore").textContent = attempts.length ? `${best}%` : "—";
    if ($("#myFavoriteCount")) $("#myFavoriteCount").textContent = favorites.length;
    const allChecks = read("cecyto_vehicle_checks", {});
    const checks = Array.isArray(allChecks[email]) ? allChecks[email] : [];
    if ($("#vehicleChecklist")) {
        $("#vehicleChecklist").innerHTML = vehicleChecks.map((item, i) => `<label class="checklist-item"><input type="checkbox" data-vehicle-check="${i}" ${checks.includes(i) ? "checked" : ""}><span>${escapeHtml(item)}</span></label>`).join("");
        $$('[data-vehicle-check]').forEach(input => input.addEventListener("change", () => {
            const state = read("cecyto_vehicle_checks", {});
            const arr = Array.isArray(state[email]) ? state[email] : [];
            state[email] = input.checked ? [...new Set([...arr, Number(input.dataset.vehicleCheck)])] : arr.filter(x => x !== Number(input.dataset.vehicleCheck));
            write("cecyto_vehicle_checks", state);
            renderDriverHub();
        }));
    }
    if ($("#checklistProgress")) $("#checklistProgress").textContent = `${checks.length} de ${vehicleChecks.length} revisados`;
    if ($("#resetChecklist")) $("#resetChecklist").onclick = () => {
        const state = read("cecyto_vehicle_checks", {}); state[email] = []; write("cecyto_vehicle_checks", state); renderDriverHub(); toast("Checklist reiniciado.");
    };
    const tipIndex = Math.floor(Date.now() / 86400000) % dailyTips.length;
    if ($("#dailyTip")) $("#dailyTip").innerHTML = `<p>${escapeHtml(dailyTips[tipIndex])}</p><small>Consejo ${tipIndex + 1} de ${dailyTips.length}</small>`;
    const achievements = [];
    if (attempts.length >= 1) achievements.push("Primer cuestionario completado");
    if (best >= 80) achievements.push("Conocimiento vial: 80% o más");
    if (best === 100) achievements.push("Puntuación perfecta");
    if (favorites.length >= 3) achievements.push("Coleccionista: 3 reglas guardadas");
    if (checks.length === vehicleChecks.length) achievements.push("Vehículo revisado: checklist completo");
    if ($("#myAchievements")) $("#myAchievements").innerHTML = achievements.length ? achievements.map(a => `<span class="achievement-badge">✓ ${escapeHtml(a)}</span>`).join("") : `<p class="muted">Completa cuestionarios, guarda reglas y revisa tu vehículo para desbloquear logros.</p>`;
    const rulesSaved = rules.filter(rule => favorites.includes(rule.title));
    if ($("#mySavedRules")) $("#mySavedRules").innerHTML = rulesSaved.length ? rulesSaved.map(rule => `<div class="saved-rule-row"><div><strong>${escapeHtml(rule.title)}</strong><small>${escapeHtml(rule.cat)}</small></div><div class="form-actions"><a class="btn secondary small" href="detalle-reglamento.html?tema=${encodeURIComponent(rule.title)}">Abrir</a><button class="ghost small" data-remove-favorite="${escapeHtml(rule.title)}" type="button">Quitar</button></div></div>`).join("") : `<p class="muted">Todavía no guardas reglas. Entra al reglamento y usa “Guardar regla”.</p>`;
    $$('[data-remove-favorite]').forEach(btn => btn.onclick = () => toggleFavorite(btn.dataset.removeFavorite));
    if ($("#myQuizHistory")) $("#myQuizHistory").innerHTML = attempts.length ? attempts.slice(0, 8).map(item => `<tr><td>${new Date(item.date).toLocaleDateString("es-MX", {day:"2-digit", month:"short", year:"numeric"})}</td><td>${item.correct}/${item.total}</td><td>${item.percent}%</td><td><span class="badge ${item.percent >= 80 ? "good" : "warn"}">${item.percent >= 80 ? "Aprobado" : "Repasar"}</span></td></tr>`).join("") : `<tr><td colspan="4">Todavía no has completado un cuestionario.</td></tr>`;
    const reports = read("cecyto_risk_reports", {});
    const mine = Array.isArray(reports[email]) ? reports[email] : [];
    if ($("#myRiskReports")) $("#myRiskReports").innerHTML = mine.length ? `<h3>Mis reportes guardados</h3>` + mine.slice(0, 5).map(report => `<div class="risk-report-item"><strong>${escapeHtml(report.type)}</strong><small>${escapeHtml(report.location)} · ${new Date(report.date).toLocaleDateString("es-MX")}</small><p>${escapeHtml(report.description)}</p></div>`).join("") : `<p class="muted">Aún no has guardado reportes.</p>`;
}
if ($("#driverHub")) {
    renderDriverHub();
    $("#riskReportForm")?.addEventListener("submit", event => {
        event.preventDefault();
        const email = currentUserKey();
        const report = { type: $("#riskType").value, location: $("#riskLocation").value.trim(), description: $("#riskDescription").value.trim(), date: new Date().toISOString() };
        const all = read("cecyto_risk_reports", {});
        all[email] = Array.isArray(all[email]) ? all[email] : [];
        all[email].unshift(report);
        write("cecyto_risk_reports", all);
        $("#riskReportForm").reset();
        renderDriverHub();
        toast("Reporte guardado solo en este navegador.");
    });
}

function saveProfilePhoto(input) {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Selecciona un archivo de imagen válido."); input.value = ""; return; }
    if (file.size > 1500000) { toast("La imagen debe pesar menos de 1.5 MB."); input.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
        const current = getUser();
        current.photo = reader.result;
        write("cecyto_users", getUsers().map(user => user.email.toLowerCase() === current.email.toLowerCase() ? current : user));
        updateHeader();
        const avatar = $("#profileInitials");
        if (avatar) avatar.innerHTML = `<img src="${current.photo}" alt="Foto de perfil" class="profile-photo">`;
        toast("Foto de perfil actualizada.");
    };
    reader.readAsDataURL(file);
}
if ($("#profileName")) {
    const u = getUser();
    $("#profileName").textContent = u.name;
    $("#profileEmail").textContent = u.email;
    $("#profileEmail2").textContent = u.email;
    $("#profileRole").textContent = u.role;
    const avatar = $("#profileInitials");
    if (avatar) avatar.innerHTML = u.photo ? `<img src="${u.photo}" alt="Foto de perfil" class="profile-photo">` : initials(u.name);
    const photoInput = $("#profilePhotoInput");
    if (photoInput) photoInput.addEventListener("change", () => saveProfilePhoto(photoInput));
}
if ($("#profileForm")) {
    const u = getUser();
    $("#editName").value = u.name;
    $("#editEmail").value = u.email;
    $("#editRole").value = u.role;
    const editPhotoInput = $("#editPhotoInput");
    if (editPhotoInput) editPhotoInput.addEventListener("change", () => saveProfilePhoto(editPhotoInput));
    $("#profileForm").addEventListener("submit", e => {
        e.preventDefault(); const user = getUser(); const newPass = $("#editNewPass").value, confirm = $("#editConfirmPass").value, cur = $("#editCurrentPass").value; if (newPass || confirm || cur) {
            if (cur !== user.password) {
                toast("La contraseña actual no coincide con el registro local.");
                return;
            }
            if (newPass.length < 8 || newPass !== confirm) {
                toast("La nueva contraseña debe tener 8 caracteres y coincidir en ambos campos.");
                return;
            }
            user.password = newPass;
        } const oldEmail = user.email; const nextEmail = $("#editEmail").value.trim(); if (getUsers().some(x => x.email.toLowerCase() === nextEmail.toLowerCase() && x.email.toLowerCase() !== oldEmail.toLowerCase())) { toast("Ese correo ya está registrado."); return; } user.name = $("#editName").value.trim(); user.email = nextEmail; write("cecyto_users", getUsers().map(x => x.email.toLowerCase() === oldEmail.toLowerCase() ? user : x)); write("cecyto_session", { email: user.email, at: Date.now() }); updateHeader(); toast("Datos de perfil actualizados."); setTimeout(() => location.href = "perfil.html", 600);
    });
}
if ($("#passwordForm"))
    $("#passwordForm").addEventListener("submit", e => {
        e.preventDefault(); const u = getUser(), cur = $("#currentPassword").value, n = $("#newPassword").value, c = $("#confirmPassword").value; if (cur !== u.password) {
            toast("La contraseña actual no coincide.");
            return;
        } if (n.length < 8 || n !== c) {
            toast("La nueva contraseña debe tener al menos 8 caracteres y coincidir.");
            return;
        } u.password = n; write("cecyto_users", getUsers().map(x => x.email.toLowerCase() === u.email.toLowerCase() ? u : x)); toast("Contraseña local actualizada.");
    });
if ($("#confirmLogout"))
    $("#confirmLogout").onclick = () => { localStorage.removeItem("cecyto_session"); location.href = "index.html"; };
if ($("#statDrivers"))
    $("#statDrivers").textContent = getDrivers().length;
if ($("#statQuizzes"))
    $("#statQuizzes").textContent = 240 + read("cecyto_extra_quizzes", 0);
