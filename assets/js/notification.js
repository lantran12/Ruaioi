import { db, auth } from "./firebase.js";
import { ref, onValue, update, get, off } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let notiUnsub = null;

// ================= INIT =================
function initNotification() {
  if (document.querySelector('.menu-noti-wrap')) return;

  waitForHeader(() => renderNotiUI());
}

// ================= WAIT HEADER =================
function waitForHeader(cb) {
  const header = document.querySelector('.header-right-zone') || document.querySelector('.header-right');
  if (header) return cb();
  setTimeout(() => waitForHeader(cb), 300);
}

// ================= UI =================
function renderNotiUI() {
  const headerRight = document.querySelector('.header-right-zone') || document.querySelector('.header-right');

  headerRight.insertAdjacentHTML('beforeend', `
    <div class="menu-noti-wrap" style="margin-left:10px; display:none; position:relative;">
      <a href="#" id="btnBellMini" style="font-size:20px;">
        <i class="fa-solid fa-bell"></i>
        <span id="notiCountBadge" style="display:none; position:absolute; top:-5px; right:-5px; background:#ff4d6d; color:#fff; font-size:10px; padding:2px 5px; border-radius:50%;">0</span>
      </a>

      <div id="notiPanelMini" style="display:none; position:absolute; top:40px; right:0; width:300px; background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.2); overflow:hidden;">
        <div style="padding:10px; background:#f8f9fa; display:flex; justify-content:space-between;">
          <b>THÔNG BÁO</b>
          <span id="readAllBtn" style="cursor:pointer; color:#007bff;">Đọc hết</span>
        </div>
        <div id="notiListContainer" style="max-height:300px; overflow:auto;"></div>
      </div>
    </div>
  `);

  bindNotiEvents();
}

// ================= EVENTS =================
function bindNotiEvents() {
  const btn = document.getElementById("btnBellMini");
  const panel = document.getElementById("notiPanelMini");

  btn.onclick = (e) => {
    e.preventDefault();
    panel.style.display = panel.style.display === "block" ? "none" : "block";
  };

  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !panel.contains(e.target)) {
      panel.style.display = "none";
    }
  });
}

// ================= AUTH =================
onAuthStateChanged(auth, (user) => {
  const wrap = document.querySelector(".menu-noti-wrap");
  if (!wrap) return;

  // clear old listener
  if (notiUnsub) {
    notiUnsub();
    notiUnsub = null;
  }

  if (!user) {
    wrap.style.display = "none";
    return;
  }

  wrap.style.display = "inline-block";
  listenUserNotifications(user);
});

// ================= LISTEN =================
function listenUserNotifications(user) {
  const badge = document.getElementById("notiCountBadge");
  const list = document.getElementById("notiListContainer");
  const readAllBtn = document.getElementById("readAllBtn");

  const notiRef = ref(db, `notifications/${user.uid}`);

  notiUnsub = onValue(notiRef, snap => {
    const data = snap.val();

    if (!data) {
      list.innerHTML = `<div style="padding:20px;text-align:center;color:#999;">Chưa có thông báo</div>`;
      badge.style.display = "none";
      return;
    }

    const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));

    // sort mới nhất
    arr.sort((a, b) => b.timestamp - a.timestamp);

    const unread = arr.filter(i => i.status !== "read" && !i.isRead).length;

    badge.innerText = unread;
    badge.style.display = unread > 0 ? "inline-block" : "none";

    list.innerHTML = arr.map(item => `
      <div class="mini-noti-item ${item.status === 'read' || item.isRead ? 'read' : ''}"
        data-id="${item.id}"
        data-link="${item.link || '#'}"
        data-node="${item.typeNode || ''}"
      >
        <b>${escapeHTML(item.senderName || "Hệ thống")}</b>
        <div>"${escapeHTML(item.content || item.message || '')}"</div>
        <span style="font-size:10px;color:#888;">
          ${formatTime(item.timestamp)}
        </span>
      </div>
    `).join("");

    bindItemClick(user, notiRef);
  });

  // read all
  readAllBtn.onclick = () => {
    get(notiRef).then(snap => {
      if (!snap.exists()) return;

      const updates = {};
      snap.forEach(c => {
        updates[`${c.key}/status`] = "read";
        updates[`${c.key}/isRead`] = true;
      });

      update(notiRef, updates);
    });
  };
}

// ================= ITEM CLICK =================
function bindItemClick(user, notiRef) {
  document.querySelectorAll(".mini-noti-item").forEach(el => {
    el.onclick = () => {
      const id = el.dataset.id;
      const link = el.dataset.link;

      update(ref(db, `notifications/${user.uid}/${id}`), {
        status: "read",
        isRead: true
      });

      if (!link || link === "#") return;

      const clean = link.split("#")[0];

      if (clean.includes(window.location.pathname)) {
        scrollToTarget(el.dataset.node);
      } else {
        window.location.href = link;
      }
    };
  });
}

// ================= SCROLL =================
function scrollToTarget(node) {
  if (!node) return;

  let el = null;

  if (node.startsWith("doan_")) {
    const index = parseInt(node.split("_")[1]);
    el = document.querySelectorAll(".p-line")[index];
  } else {
    el = document.getElementById(node);
  }

  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-comment-box");
    setTimeout(() => el.classList.remove("highlight-comment-box"), 2000);
  }
}

// ================= UTIL =================
function escapeHTML(str) {
  return str?.replace(/[&<>'"]/g, t => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[t])) || "";
}

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("vi-VN");
}

// ================= RUN =================
window.addEventListener("DOMContentLoaded", initNotification);
