import { db, auth } from "./firebase.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

(function() {
  const menuNotiHtml = `
    <div class="menu-noti-wrap" style="margin-left: 10px; display: none; position: relative;">
      <a href="#" id="btnBellMini" class="btn-noti-trigger" style="text-decoration: none; color: inherit; font-size: 20px;">
        <i class="fa-regular fa-bell"></i>
        <span class="mini-noti-badge" id="notiCountBadge" style="display: none; position: absolute; top: -5px; right: -5px; background: #ff4d6d; color: white; font-size: 10px; padding: 2px 5px; border-radius: 50%; font-weight: bold;">0</span>
      </a>
      <div id="notiPanelMini" style="display: none; position: absolute; top: 40px; right: 0; width: 300px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 9999; flex-direction: column; overflow: hidden; border: 1px solid #ddd;">
        <div style="padding: 10px; background: #f8f9fa; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;">
          <span>THÔNG BÁO</span>
          <span id="readAllBtn" style="color: #007bff; cursor: pointer; font-size: 12px;">Đọc hết</span>
        </div>
        <div id="notiListContainer" style="max-height: 300px; overflow-y: auto;">
          <div style="padding: 20px; text-align: center; color: #999;">Chưa có thông báo nào...</div>
        </div>
      </div>
    </div>
  `;

  // Tự động tìm .header-right hoặc .header-right-zone để chèn chuông vào
  const headerRight = document.querySelector('.header-right-zone') || document.querySelector('.header-right');
  if (headerRight) { headerRight.insertAdjacentHTML('beforeend', menuNotiHtml); }

  // Thêm style animation cho chuông
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes highlightComment {
      0% { background-color: #fff3cd; transform: scale(1.02); }
      50% { background-color: #fff3cd; transform: scale(1.02); }
      100% { background-color: transparent; transform: scale(1); }
    }
    .highlight-comment-box {
      animation: highlightComment 2.5s ease-in-out !important;
      border-radius: 6px;
      padding: 4px;
    }
    .mini-noti-item.read { opacity: 0.7; background: #fafafa; }
    .mini-noti-item { padding: 12px; border-bottom: 1px solid #f1f1f1; cursor: pointer; font-size: 13px; }
    .mini-noti-item:hover { background: #f1f1f1; }
    .mini-noti-time { font-size: 10px; color: #888; display: block; margin-top: 5px; }
  `;
  document.head.appendChild(style);

  const btnBell = document.getElementById('btnBellMini');
  const panel = document.getElementById('notiPanelMini');
  const badge = document.getElementById('notiCountBadge');
  const listContainer = document.getElementById('notiListContainer');
  const readAllBtn = document.getElementById('readAllBtn');

  if(btnBell) {
    btnBell.onclick = (e) => {
      e.preventDefault();
      panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    };
  }

  document.addEventListener('click', (e) => {
    if (panel && panel.style.display === 'flex' && !e.target.closest('.menu-noti-wrap')) {
      panel.style.display = 'none';
    }
  });

  // Lắng nghe trạng thái đăng nhập
  onAuthStateChanged(auth, user => {
    const menuWrap = document.querySelector('.menu-noti-wrap');
    if (!user) {
      if (menuWrap) menuWrap.style.display = 'none';
      if (badge) badge.style.display = 'none';
      return;
    }

    if (menuWrap) menuWrap.style.display = 'inline-block';
    
    const notiRef = ref(db, `notifications/${user.uid}`);

    onValue(notiRef, snap => {
      const data = snap.val();
      if (!data) {
        if (badge) badge.style.display = 'none';
        if (listContainer) listContainer.innerHTML = `<div class="mini-noti-item">Chưa có thông báo nào...</div>`;
        return;
      }

      let unread = 0;
      const arr = [];
      Object.keys(data).forEach(id => {
        arr.push({ id, ...data[id] });
        if (data[id].status === 'unread' || data[id].isRead === false) unread++;
      });

      arr.sort((a,b) => b.timestamp - a.timestamp);

      if (badge) {
        badge.innerText = unread;
        badge.style.display = unread > 0 ? 'inline-block' : 'none';
      }

      let html = '';
      arr.forEach(item => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleTimeString('vi-VN',{ hour:'2-digit', minute:'2-digit' }) + ' ' + date.toLocaleDateString('vi-VN');
        const isRead = item.status === 'read' || item.isRead === true;
        const nodeType = item.typeNode || 'tong';

        html += `
          <div class="mini-noti-item ${isRead ? 'read' : ''}" data-id="${item.id}" data-link="${item.link || '#'}" data-node="${nodeType}">
            <strong>${escapeHTML(item.senderName || "Hệ thống")}</strong> (${item.loaiCmtTxt || 'phản hồi'}):
            <div style="margin-top:4px;font-style:italic;opacity:0.9;">"${escapeHTML(item.content || item.message)}"</div>
            <span class="mini-noti-time">🕒 ${timeStr}</span>
          </div>
        `;
      });

      if (listContainer) {
        listContainer.innerHTML = html;
        listContainer.querySelectorAll('.mini-noti-item').forEach(el => {
          el.onclick = () => {
            const notiId = el.dataset.id;
            let link = el.dataset.link;
            const typeNode = el.dataset.node;

            if (!link || link === '#') return;
            if (panel) panel.style.display = 'none';

            let cleanLink = link.split('#')[0];
            const currentPath = window.location.pathname;
            const isSamePage = cleanLink.includes(currentPath) || currentPath.includes(cleanLink.replace('.html', ''));

            if (isSamePage) {
              if (typeNode && typeNode.startsWith('doan_')) {
                const pIdx = parseInt(typeNode.split('_')[1]);
                const pLines = document.querySelectorAll('.p-line');
                if (pLines && pLines[pIdx]) {
                  pLines[pIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  pLines[pIdx].classList.add('highlight-comment-box');
                  setTimeout(() => { pLines[pIdx].classList.remove('highlight-comment-box'); }, 2000);
                  pLines[pIdx].click();
                }
              } else {
                const commentBox = document.getElementById('commentBox');
                if (commentBox) {
                  commentBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  commentBox.classList.add('highlight-comment-box');
                  setTimeout(() => { commentBox.classList.remove('highlight-comment-box'); }, 2000);
                }
              }
              const specificNotiRef = ref(db, `notifications/${user.uid}/${notiId}`);
              update(specificNotiRef, { status: 'read', isRead: true });
            } else {
              const specificNotiRef = ref(db, `notifications/${user.uid}/${notiId}`);
              update(specificNotiRef, { status: 'read', isRead: true }).then(() => {
                window.location.href = cleanLink.includes('?') ? `${cleanLink}&targetP=${typeNode}` : `${cleanLink}?targetP=${typeNode}`;
              });
            }
          };
        });
      }
    });

    if(readAllBtn) {
      readAllBtn.onclick = (e) => {
        e.preventDefault();
        get(notiRef).then(snap => {
          const data = snap.val();
          if (!data) return;
          const updates = {};
          Object.keys(data).forEach(id => {
            updates[`${id}/status`] = 'read';
            updates[`${id}/isRead`] = true;
          });
          update(notiRef, updates);
        });
      };
    }
  });

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
  }
})();
