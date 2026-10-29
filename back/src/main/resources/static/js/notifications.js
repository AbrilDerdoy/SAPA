/**
 * SAPA - Botón de notificaciones
 * Requiere un botón en el header con id="notifBellBtn" (ver index.html).
 * No usa WebSocket: el contador de no leídas se actualiza por polling.
 */
(function () {

    const POLL_INTERVAL_MS = 30000;
    let isOpen = false;
    let pollTimer = null;

    const ICONS = {
        SYSTEM: "⚙️",
        MESSAGE: "💬",
        REMINDER: "⏰",
        FOLLOW: "🤝",
        QUESTIONNAIRE: "📋"
    };

    function getToken() {
        return localStorage.getItem("accessToken");
    }

    function authHeaders() {
        return { "Authorization": `Bearer ${getToken()}` };
    }

    // ---------- Markup ----------

    function buildPanel() {
        const panel = document.createElement("div");
        panel.id = "notifPanel";
        panel.className = "notif-panel";
        panel.style.display = "none";
        panel.innerHTML = `
            <div class="notif-panel-header">
                <span>Notificaciones</span>
                <button id="notifMarkAllBtn" class="notif-mark-all">Marcar todas como leídas</button>
            </div>
            <div id="notifList" class="notif-list"></div>
        `;
        document.body.appendChild(panel);

        document.getElementById("notifMarkAllBtn").addEventListener("click", markAllAsRead);

        document.addEventListener("click", (e) => {
            const bellBtn = document.getElementById("notifBellBtn");
            if (!isOpen) return;
            if (panel.contains(e.target) || (bellBtn && bellBtn.contains(e.target))) return;
            closePanel();
        });
    }

    function positionPanel() {
        const panel = document.getElementById("notifPanel");
        const bellBtn = document.getElementById("notifBellBtn");
        if (!bellBtn) return;

        const rect = bellBtn.getBoundingClientRect();
        panel.style.top = `${rect.bottom + 8 + window.scrollY}px`;

        const panelWidth = 340;
        let left = rect.right + window.scrollX - panelWidth;
        if (left < 16) left = 16;
        panel.style.left = `${left}px`;
    }

    function togglePanel() {
        isOpen ? closePanel() : openPanel();
    }

    function openPanel() {
        positionPanel();
        document.getElementById("notifPanel").style.display = "";
        isOpen = true;
        loadNotifications();
        window.addEventListener("resize", positionPanel);
    }

    function closePanel() {
        document.getElementById("notifPanel").style.display = "none";
        isOpen = false;
        window.removeEventListener("resize", positionPanel);
    }

    // ---------- Datos ----------

    async function loadNotifications() {
        const listEl = document.getElementById("notifList");
        listEl.innerHTML = `<div class="notif-empty">Cargando...</div>`;

        try {
            const res = await fetch("/notifications", { headers: authHeaders() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const notifications = await res.json();
            renderList(notifications);
        } catch (err) {
            console.error("Error al cargar notificaciones:", err);
            listEl.innerHTML = `<div class="notif-empty">No se pudieron cargar las notificaciones.</div>`;
        }
    }

    async function refreshBadge() {
        try {
            const res = await fetch("/notifications/unreaded", { headers: authHeaders() });
            if (!res.ok) return;

            const unread = await res.json();
            updateBadge(unread.length);
        } catch (err) {
            console.error("Error al consultar notificaciones no leídas:", err);
        }
    }

    function updateBadge(count) {
        const badge = document.getElementById("notifBadge");
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count > 9 ? "9+" : String(count);
            badge.style.display = "";
        } else {
            badge.style.display = "none";
        }
    }

    // ---------- Render ----------

    function renderList(notifications) {
        const listEl = document.getElementById("notifList");

        if (notifications.length === 0) {
            listEl.innerHTML = `<div class="notif-empty">No tenés notificaciones.</div>`;
            return;
        }

        const sorted = [...notifications].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        listEl.innerHTML = sorted.map(n => `
            <div class="notif-item ${n.readed ? "" : "unread"}" data-id="${n.notificationId}">
                <span class="notif-icon">${ICONS[n.type] || "🔔"}</span>
                <div class="notif-content">
                    <span class="notif-title">${escapeHtml(n.title)}</span>
                    <span class="notif-msg">${escapeHtml(n.msg)}</span>
                    <span class="notif-time">${formatDate(n.createdAt)}</span>
                </div>
                <button class="notif-delete" data-id="${n.notificationId}" title="Eliminar">✕</button>
            </div>
        `).join("");

        listEl.querySelectorAll(".notif-item").forEach(item => {
            item.addEventListener("click", (e) => {
                if (e.target.classList.contains("notif-delete")) return;
                const id = Number(item.dataset.id);
                if (item.classList.contains("unread")) markAsRead(id, item);
            });
        });

        listEl.querySelectorAll(".notif-delete").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteNotification(Number(btn.dataset.id), btn.closest(".notif-item"));
            });
        });
    }

    function formatDate(createdAt) {
        if (!createdAt) return "";
        let date;
        if (Array.isArray(createdAt)) {
            date = new Date(createdAt[0], createdAt[1] - 1, createdAt[2], createdAt[3] ?? 0, createdAt[4] ?? 0);
        } else {
            date = new Date(createdAt);
        }
        if (isNaN(date)) return "";

        const now = new Date();
        const sameDay = date.toDateString() === now.toDateString();

        return sameDay
            ? date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
            : date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) +
              " " + date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }

    // ---------- Acciones ----------

    async function markAsRead(id, itemEl) {
        try {
            const res = await fetch(`/notifications/${id}/read`, {
                method: "PATCH",
                headers: authHeaders()
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            itemEl.classList.remove("unread");
            refreshBadge();
        } catch (err) {
            console.error("Error al marcar como leída:", err);
        }
    }

    async function markAllAsRead() {
        const unreadItems = document.querySelectorAll("#notifList .notif-item.unread");
        if (unreadItems.length === 0) return;

        await Promise.all(
            Array.from(unreadItems).map(item =>
                fetch(`/notifications/${item.dataset.id}/read`, {
                    method: "PATCH",
                    headers: authHeaders()
                }).catch(err => console.error("Error al marcar como leída:", err))
            )
        );

        unreadItems.forEach(item => item.classList.remove("unread"));
        refreshBadge();
    }

    async function deleteNotification(id, itemEl) {
        try {
            const res = await fetch(`/notifications/${id}`, {
                method: "DELETE",
                headers: authHeaders()
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const wasUnread = itemEl.classList.contains("unread");
            itemEl.remove();
            if (wasUnread) refreshBadge();

            const listEl = document.getElementById("notifList");
            if (!listEl.querySelector(".notif-item")) {
                listEl.innerHTML = `<div class="notif-empty">No tenés notificaciones.</div>`;
            }
        } catch (err) {
            console.error("Error al eliminar notificación:", err);
        }
    }

    // ---------- Init ----------

    document.addEventListener("DOMContentLoaded", () => {
        if (!getToken()) return;

        const bellBtn = document.getElementById("notifBellBtn");
        if (!bellBtn) return;

        bellBtn.style.display = "";
        buildPanel();

        bellBtn.addEventListener("click", (e) => {
            e.preventDefault();
            togglePanel();
        });

        refreshBadge();
        pollTimer = setInterval(refreshBadge, POLL_INTERVAL_MS);
    });

})();
