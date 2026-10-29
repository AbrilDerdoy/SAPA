(function () {

    let stompClient = null;
    let currentUserId = null;
    let conversations = [];
    let activeConversationId = null;
    const subscribedConversations = new Set();

    function getToken() {
        return localStorage.getItem("accessToken");
    }

    function show(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = "";
    }

    function hide(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    }

    function isVisible(id) {
        const el = document.getElementById(id);
        return el && el.style.display !== "none";
    }

    function buildWidget() {
        const wrapper = document.createElement("div");
        wrapper.id = "sapaChatWidget";
        wrapper.innerHTML = `
            <button id="sapaChatToggle" class="sapa-chat-toggle" title="Mensajes">
                <span class="sapa-chat-toggle-icon">💬</span>
                <span id="sapaChatBadge" class="sapa-chat-badge" style="display:none">0</span>
            </button>

            <div id="sapaChatPanel" class="sapa-chat-panel" style="display:none">
                <div class="sapa-chat-header">
                    <button id="sapaChatBack" class="sapa-chat-back" style="display:none" title="Volver">←</button>
                    <span id="sapaChatTitle">Mensajes</span>
                    <button id="sapaChatClose" class="sapa-chat-close" title="Cerrar">✕</button>
                </div>

                <div id="sapaChatListView" class="sapa-chat-list">
                    <div class="sapa-chat-empty">Cargando...</div>
                </div>

                <div id="sapaChatConversationView" class="sapa-chat-conversation" style="display:none">
                    <div id="sapaChatMessages" class="sapa-chat-messages"></div>
                    <form id="sapaChatForm" class="sapa-chat-form">
                        <input id="sapaChatInput" type="text" placeholder="Escribí un mensaje..." autocomplete="off">
                        <label class="sapa-chat-attach" title="Adjuntar archivo">
                            📎
                            <input id="sapaChatFile" type="file" accept="image/*,application/pdf" style="display:none">
                        </label>
                        <button type="submit">Enviar</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper);

        document.getElementById("sapaChatToggle").addEventListener("click", togglePanel);
        document.getElementById("sapaChatClose").addEventListener("click", closePanel);
        document.getElementById("sapaChatBack").addEventListener("click", showConversationList);
        document.getElementById("sapaChatForm").addEventListener("submit", handleSendMessage);
        document.getElementById("sapaChatFile").addEventListener("change", handleAttachmentUpload);
    }

    function togglePanel() {
        if (isVisible("sapaChatPanel")) {
            closePanel();
        } else {
            openPanel();
        }
    }

    function openPanel() {
        show("sapaChatPanel");
        resetBadge();
        if (conversations.length === 0) {
            loadConversations();
        } else {
            renderConversationList();
        }
    }

    function closePanel() {
        hide("sapaChatPanel");
        goBackToList();
    }


    function showConversationList() {
        goBackToList();
    }

    function goBackToList() {
        activeConversationId = null;
        document.getElementById("sapaChatTitle").textContent = "Mensajes";
        hide("sapaChatBack");
        show("sapaChatListView");
        hide("sapaChatConversationView");
    }

    function showConversationView(name) {
        document.getElementById("sapaChatTitle").textContent = name;
        show("sapaChatBack");
        hide("sapaChatListView");
        show("sapaChatConversationView");
    }

    async function getCurrentUserId() {
        if (currentUserId) return currentUserId;
        try {
            const res = await fetch("/users/me", {
                headers: { "Authorization": `Bearer ${getToken()}` }
            });
            if (!res.ok) return null;
            const profile = await res.json();
            // Requiere que ProfileResponseDTO incluya el campo "id"
            currentUserId = profile.id;
        } catch (e) {
            console.error("No se pudo obtener el usuario actual:", e);
        }
        return currentUserId;
    }

    async function loadConversations() {
        const listView = document.getElementById("sapaChatListView");
        listView.innerHTML = `<div class="sapa-chat-empty">Cargando...</div>`;

        try {
            const res = await fetch("/conversations", {
                headers: { "Authorization": `Bearer ${getToken()}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            conversations = await res.json();
            renderConversationList();
            conversations.forEach(c => subscribeToConversation(c.conversationId));
        } catch (err) {
            console.error("Error al cargar conversaciones:", err);
            listView.innerHTML = `<div class="sapa-chat-empty">No se pudieron cargar los mensajes.</div>`;
        }
    }

    function renderConversationList() {
        const listView = document.getElementById("sapaChatListView");

        if (conversations.length === 0) {
            listView.innerHTML = `<div class="sapa-chat-empty">Todavía no tenés conversaciones.</div>`;
            return;
        }

        const sorted = [...conversations].sort((a, b) =>
            new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );

        listView.innerHTML = sorted.map(c => `
            <button class="sapa-chat-item" data-id="${c.conversationId}">
                <div class="sapa-chat-item-avatar">${initials(c.otherParticipantName)}</div>
                <div class="sapa-chat-item-info">
                    <span class="sapa-chat-item-name">${escapeHtml(c.otherParticipantName)}</span>
                    <span class="sapa-chat-item-last">${escapeHtml(c.lastMessage || "")}</span>
                </div>
            </button>
        `).join("");

        listView.querySelectorAll(".sapa-chat-item").forEach(item => {
            item.addEventListener("click", () => openConversation(Number(item.dataset.id)));
        });
    }

    function initials(name) {
        if (!name) return "?";
        const parts = name.replace(/^Dr\.\s*/i, "").trim().split(" ");
        return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
    }

    async function openConversation(conversationId) {
        activeConversationId = conversationId;
        await getCurrentUserId();

        const conv = conversations.find(c => c.conversationId === conversationId);
        showConversationView(conv ? conv.otherParticipantName : "Conversación");

        const messagesEl = document.getElementById("sapaChatMessages");
        messagesEl.innerHTML = `<div class="sapa-chat-empty">Cargando mensajes...</div>`;

        try {
            const res = await fetch(`/conversations/${conversationId}/messages`, {
                headers: { "Authorization": `Bearer ${getToken()}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const history = await res.json();
            messagesEl.innerHTML = "";
            history.forEach(renderMessage);
            scrollToBottom();
        } catch (err) {
            console.error("Error al cargar historial:", err);
            messagesEl.innerHTML = `<div class="sapa-chat-empty">No se pudo cargar el historial.</div>`;
        }

        subscribeToConversation(conversationId);
    }

    function connectWebSocket() {
        const socket = new SockJS("/ws");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect(
            { Authorization: `Bearer ${getToken()}` },
            () => {
                conversations.forEach(c => subscribeToConversation(c.conversationId));
            },
            (error) => {
                console.error("Error WebSocket, reintentando en 5s:", error);
                setTimeout(connectWebSocket, 5000);
            }
        );
    }

    function subscribeToConversation(conversationId) {
        if (!stompClient?.connected) return;
        if (subscribedConversations.has(conversationId)) return;

        stompClient.subscribe(`/queue/conversation/${conversationId}`, (frame) => {
            const message = JSON.parse(frame.body);
            handleIncomingMessage(conversationId, message);
        });

        subscribedConversations.add(conversationId);
    }

    function handleIncomingMessage(conversationId, message) {
        const conv = conversations.find(c => c.conversationId === conversationId);
        if (conv) {
            conv.lastMessage = message.content;
            conv.lastMessageAt = message.sentAt;
        }

        if (activeConversationId === conversationId) {
            renderMessage(message);
            scrollToBottom();
        } else {
            incrementBadge();
        }
    }

    function formatTime(sentAt) {
        if (!sentAt) return "";
        let date;
        if (Array.isArray(sentAt)) {
            date = new Date(sentAt[0], sentAt[1] - 1, sentAt[2], sentAt[3] ?? 0, sentAt[4] ?? 0);
        } else {
            date = new Date(sentAt);
        }
        if (isNaN(date)) return "";
        return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    }

    function renderMessage(message) {
        const messagesEl = document.getElementById("sapaChatMessages");

console.log("Usuario actual:", currentUserId);
console.log("Sender:", message.senderId);
console.log("Receiver:", message.receiverId);
console.log(message);

    const isMine =
        currentUserId !== null &&
        Number(message.senderId) === Number(currentUserId);        const side = isMine ? "mine" : "theirs";

        let contentHtml = "";
        if (message.type !== "FILE") {
            contentHtml = `<p>${escapeHtml(message.content)}</p>`;
        }

        let attachmentHtml = "";
        if (message.attachments?.length > 0) {
            attachmentHtml = message.attachments.map(a =>
                a.type === "IMAGE"
                    ? `<a href="${a.fileUrl}" download="${escapeHtml(a.fileName)}" class="sapa-chat-attachment-link" title="Haz clic para descargar">
                           <img src="${a.fileUrl}" class="sapa-chat-attachment-img" alt="${escapeHtml(a.fileName)}">
                       </a>`
                    : `<a href="${a.fileUrl}" download="${escapeHtml(a.fileName)}" target="_blank" class="sapa-chat-attachment-file">📄 ${escapeHtml(a.fileName)}</a>`
            ).join("");
        }

        const timeHtml = `<span class="sapa-chat-time">${formatTime(message.sentAt)}</span>`;

        const wrapper = document.createElement("div");
        wrapper.className = `sapa-chat-row ${side}`;
        wrapper.innerHTML = `
            <div class="sapa-chat-bubble ${side}">
                ${contentHtml}${attachmentHtml}${timeHtml}
            </div>
        `;
        messagesEl.appendChild(wrapper);
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }

    function scrollToBottom() {
        const el = document.getElementById("sapaChatMessages");
        el.scrollTop = el.scrollHeight;
    }

    function incrementBadge() {
        const badge = document.getElementById("sapaChatBadge");
        const current = Number(badge.textContent || "0");
        badge.textContent = current + 1;
        badge.style.display = "";
    }

    function resetBadge() {
        const badge = document.getElementById("sapaChatBadge");
        badge.textContent = "0";
        badge.style.display = "none";
    }

    function handleSendMessage(e) {
        e.preventDefault();
        const input = document.getElementById("sapaChatInput");
        const content = input.value.trim();
        if (!content || !activeConversationId) return;

        if (!stompClient?.connected) {
            alert("Sin conexión al chat. Esperá un momento y reintentá.");
            return;
        }

        stompClient.send(
            `/app/chat/${activeConversationId}`,
            {},
            JSON.stringify({ content, type: "TEXT" })
        );
        input.value = "";
    }

    async function handleAttachmentUpload(e) {
        const file = e.target.files[0];
        if (!file || !activeConversationId) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`/conversations/${activeConversationId}/attachments`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${getToken()}` },
                body: formData
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            console.error("Error al subir archivo:", err);
            alert("No se pudo enviar el archivo.");
        }
        e.target.value = "";
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!getToken()) return;
        buildWidget();
        connectWebSocket();
        getCurrentUserId();
    });

})();
