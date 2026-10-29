/**
 * SAPA - Buscador de médicos + envío de solicitud de seguimiento
 * Se integra con el link "Buscar" del nav (id="navSearchBtn" en index.html).
 * Muestra una barra de búsqueda en dropdown debajo del botón.
 */
(function () {

    let debounceTimer = null;
    let currentUserRole = null;
    let isOpen = false;

    function getToken() {
        return localStorage.getItem("accessToken");
    }

    // ---------- Markup ----------

    function buildPanel() {
        const panel = document.createElement("div");
        panel.id = "dsearchPanel";
        panel.className = "dsearch-panel";
        panel.style.display = "none";
        panel.innerHTML = `
            <input id="dsearchInput" type="text" placeholder="Nombre y apellido del médico..." autocomplete="off">
            <div id="dsearchResults" class="dsearch-results"></div>
        `;
        document.body.appendChild(panel);

        document.getElementById("dsearchInput").addEventListener("input", onSearchInput);

        // Cerrar al clickear afuera del panel y del botón que lo abre
        document.addEventListener("click", (e) => {
            const navBtn = document.getElementById("navSearchBtn");
            if (!isOpen) return;
            if (panel.contains(e.target) || (navBtn && navBtn.contains(e.target))) return;
            closePanel();
        });
    }

    function positionPanel() {
        const panel = document.getElementById("dsearchPanel");
        const navBtn = document.getElementById("navSearchBtn");
        if (!navBtn) return;

        const rect = navBtn.getBoundingClientRect();
        panel.style.top = `${rect.bottom + 8 + window.scrollY}px`;

        // Si no entra a la derecha, lo alineamos contra el borde derecho de la ventana
        const panelWidth = 320;
        let left = rect.left + window.scrollX;
        if (left + panelWidth > window.innerWidth - 16) {
            left = window.innerWidth - panelWidth - 16;
        }
        panel.style.left = `${left}px`;
    }

    function togglePanel() {
        if (isOpen) {
            closePanel();
        } else {
            openPanel();
        }
    }

    function openPanel() {
        positionPanel();
        document.getElementById("dsearchPanel").style.display = "";
        isOpen = true;
        document.getElementById("dsearchInput").value = "";
        document.getElementById("dsearchInput").focus();
        loadCurrentUserRole().then(() => searchDoctors(""));
        window.addEventListener("resize", positionPanel);
    }

    function closePanel() {
        document.getElementById("dsearchPanel").style.display = "none";
        isOpen = false;
        window.removeEventListener("resize", positionPanel);
    }

    async function loadCurrentUserRole() {
        if (currentUserRole) return currentUserRole;
        try {
            const res = await fetch("/users/me", {
                headers: { "Authorization": `Bearer ${getToken()}` }
            });
            if (res.ok) {
                const profile = await res.json();
                currentUserRole = profile.role;
            }
        } catch (e) {
            console.error("No se pudo obtener el rol del usuario:", e);
        }
        return currentUserRole;
    }

    // ---------- Búsqueda ----------

    function onSearchInput(e) {
        clearTimeout(debounceTimer);
        const value = e.target.value;
        debounceTimer = setTimeout(() => searchDoctors(value), 350);
    }

    async function searchDoctors(query) {
        const resultsEl = document.getElementById("dsearchResults");
        resultsEl.innerHTML = `<div class="dsearch-empty">Buscando...</div>`;

        try {
            const res = await fetch(`/doctors/search?query=${encodeURIComponent(query)}`, {
                headers: { "Authorization": `Bearer ${getToken()}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const doctors = await res.json();
            renderResults(doctors);
        } catch (err) {
            console.error("Error al buscar médicos:", err);
            resultsEl.innerHTML = `<div class="dsearch-empty">No se pudo realizar la búsqueda.</div>`;
        }
    }

    function renderResults(doctors) {
        const resultsEl = document.getElementById("dsearchResults");

        if (doctors.length === 0) {
            resultsEl.innerHTML = `<div class="dsearch-empty">No se encontraron médicos.</div>`;
            return;
        }

        const canSendRequest = currentUserRole === "PATIENT";

        resultsEl.innerHTML = doctors.map(d => `
            <div class="dsearch-item">
                <span class="dsearch-name">Dr. ${escapeHtml(d.firstName)} ${escapeHtml(d.lastName)}</span>
                ${canSendRequest
                    ? `<button class="dsearch-send-btn" data-doctor-id="${d.id}">Solicitar seguimiento</button>`
                    : ""}
            </div>
        `).join("");

        if (canSendRequest) {
            resultsEl.querySelectorAll(".dsearch-send-btn").forEach(btn => {
                btn.addEventListener("click", () => sendFollowRequest(btn));
            });
        }
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }

    // ---------- Enviar solicitud ----------

    async function sendFollowRequest(btn) {
        const doctorId = btn.dataset.doctorId;
        btn.disabled = true;
        btn.textContent = "Enviando...";

        try {
            const res = await fetch(`/follow-requests/send/${doctorId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${getToken()}` }
            });

            if (res.ok) {
                btn.textContent = "Solicitud enviada ✓";
                btn.classList.add("dsearch-sent");
            } else {
                const body = await res.json().catch(() => null);
                const message = body?.message || "No se pudo enviar la solicitud.";
                btn.textContent = "Solicitar seguimiento";
                btn.disabled = false;
                alert(message);
            }
        } catch (err) {
            console.error("Error al enviar solicitud:", err);
            btn.textContent = "Solicitar seguimiento";
            btn.disabled = false;
            alert("No se pudo enviar la solicitud. Intentá de nuevo.");
        }
    }

    // ---------- Init ----------

    document.addEventListener("DOMContentLoaded", () => {
        if (!getToken()) return; // sin sesión no habilitamos el buscador

        buildPanel();

        const navBtn = document.getElementById("navSearchBtn");
        if (navBtn) {
            navBtn.addEventListener("click", (e) => {
                e.preventDefault();
                togglePanel();
            });
        }
    });

})();
