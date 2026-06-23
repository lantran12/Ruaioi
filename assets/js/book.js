import { db, ref, get } from "./firebase.js";

const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get('id');
let allChapters = []; 
const chaptersPerPage = 20; // 20 chương/trang

async function loadBook() {
    if (!storyId) return;

    // 1. Lấy thông tin truyện từ Firebase
    const snap = await get(ref(db, 'stories/' + storyId));
    if (snap.exists()) {
        const s = snap.val();
        document.getElementById('storyTitle').innerText = s.title;
        document.getElementById('storyAuthor').innerText = s.author || "Đang cập nhật";
        document.getElementById('storyEditor').innerText = s.editor || "Chưa có";
        document.getElementById('storyCover').src = s.cover || 'https://via.placeholder.com/250x350';
        document.getElementById('storyDesc').innerText = s.description || "Chưa có mô tả.";
        
        // Render Tags
        const tagsDiv = document.getElementById('genreTags');
        tagsDiv.innerHTML = "";
        if (s.genres && Array.isArray(s.genres)) {
            s.genres.forEach(g => {
                tagsDiv.innerHTML += `<span style="background: #333; padding: 5px 10px; border-radius: 5px; font-size: 12px;">${g}</span>`;
            });
        }
    }

    // 2. Lấy danh sách chương và sắp xếp
    const chaptersSnap = await get(ref(db, 'chapters/' + storyId));
    if (chaptersSnap.exists()) {
        // Chuyển dữ liệu thành mảng để xử lý
        allChapters = Object.entries(chaptersSnap.val()).map(([key, val]) => ({ key, ...val }));
        
        // Sắp xếp: chương mới nhất (createdAt cao nhất) lên đầu
        allChapters.sort((a, b) => b.createdAt - a.createdAt);
        
        renderPage(1);
    } else {
        document.getElementById('chapterList').innerHTML = "<p>Truyện này chưa có chương nào.</p>";
    }
}

// 3. Hàm render danh sách chương theo trang
function renderPage(page) {
    const listDiv = document.getElementById('chapterList');
    listDiv.innerHTML = "";
    
    const start = (page - 1) * chaptersPerPage;
    const end = start + chaptersPerPage;
    const pageData = allChapters.slice(start, end);

    pageData.forEach(ch => {
        listDiv.innerHTML += `
            <a href="read.html?storyId=${storyId}&chapterId=${ch.key}" class="chapter-item">
                <span>${ch.title}</span>
                <i class="fa-solid fa-chevron-right"></i>
            </a>
        `;
    });
    
    renderPagination();
}

// 4. Hàm hiển thị nút phân trang
function renderPagination() {
    const totalPages = Math.ceil(allChapters.length / chaptersPerPage);
    const pagDiv = document.getElementById('pagination');
    pagDiv.innerHTML = "";
    
    for(let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.style = "margin: 0 5px; padding: 5px 10px; cursor: pointer;";
        btn.onclick = () => renderPage(i);
        pagDiv.appendChild(btn);
    }
}

// 5. Nút đọc chương mới nhất
window.goToLatest = () => {
    if(allChapters.length > 0) {
        // Lấy chương đầu tiên trong danh sách đã sort (mới nhất)
        window.location.href = `read.html?storyId=${storyId}&chapterId=${allChapters[0].key}`;
    } else {
        alert("Truyện chưa có chương nào!");
    }
};

loadBook();
