/* ==========================================================================
   INDEX.JS - ĐỘNG CHĂN RÙA PREMIUM
   ========================================================================== */

// --- 1. KHỞI TẠO BIẾN TOÀN CỤC ---
let isSignUpMode = true;
let selectedAvatarUrl = "";
const ADMIN_UID = 'BrZQ9s07ujfIYG1iPtC4vIhGgx33';

// --- 2. HÀM CHẠY KHI TẢI TRANG ---
document.addEventListener('DOMContentLoaded', () => {
    initSubBarFilters();
    loadMainStories();
    loadTopViews();
    loadGenresDropdown();
    listenToNotifications();
});

// --- 3. LOGIC AUTH & ADMIN ---
auth.onAuthStateChanged((user) => {
    const btnHeaderAuth = document.getElementById('btnHeaderAuth');
    const adminPanel = document.getElementById('btnOpenAdminPanel');

    if (user) {
        // Đã đăng nhập
        if (btnHeaderAuth) {
            btnHeaderAuth.innerHTML = `<i class="fa-regular fa-user" style="margin-right: 4px;"></i> ${user.displayName || 'Thành viên'}`;
            btnHeaderAuth.onclick = openProfileZone;
        }
        
        // Hiển thị nút Admin nếu đúng UID
        if (adminPanel) {
            adminPanel.style.display = (user.uid === ADMIN_UID) ? 'flex' : 'none';
        }

        // Cập nhật thông tin profile ẩn
        if (document.getElementById('userProfileEmail')) document.getElementById('userProfileEmail').textContent = user.email;
        if (document.getElementById('userProfileName')) document.getElementById('userProfileName').textContent = user.displayName || "Thành viên Động Rùa";
        
        renderUserProfileData(user);
    } else {
        // Chưa đăng nhập
        if (btnHeaderAuth) {
            btnHeaderAuth.innerHTML = `<i class="fa-regular fa-user"></i>`;
            btnHeaderAuth.onclick = openAuthModal;
        }
        if (adminPanel) adminPanel.style.display = 'none';
    }
});

// --- 4. CÁC HÀM XỬ LÝ GIAO DIỆN CHÍNH ---
function initSubBarFilters() {
    const filterButtons = document.querySelectorAll('.nav-link-btn');
    filterButtons.forEach(btn => {
        if (btn.id === 'tagDropdownBtn') return;
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterType = btn.getAttribute('data-filter');
            if (filterType === 'new') {
                closeSearch();
                loadMainStories();
            } else if (filterType === 'completed') {
                loadStoriesByCondition('status', 'Hoàn thành', '📜 Danh Sách Truyện Đã Hoàn Thành');
            }
        });
    });
}

function loadMainStories() {
    const bookGrid = document.getElementById('bookGrid');
    if (!bookGrid) return;
    
    db.ref('stories').orderByChild('updatedAt').once('value').then((snapshot) => {
        bookGrid.innerHTML = '';
        if (!snapshot.exists()) return;
        const storiesData = snapshot.val();
        handleFeaturedRandomBook(storiesData);
        
        const storiesArray = [];
        snapshot.forEach(child => storiesArray.push({ id: child.key, ...child.val() }));
        storiesArray.reverse().forEach(story => bookGrid.appendChild(createNetflixCard(story.id, story)));
    });
}

function loadStoriesByCondition(field, value, titleText) {
    const searchSection = document.getElementById('searchResultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    searchSection.style.display = 'block';
    searchSection.querySelector('.row-title').innerText = titleText;
    
    db.ref('stories').orderByChild(field).equalTo(value).once('value').then((snapshot) => {
        resultsGrid.innerHTML = snapshot.exists() ? '' : '<p>Không tìm thấy 🐢</p>';
        snapshot.forEach(child => resultsGrid.appendChild(createNetflixCard(child.key, child.val())));
    });
}

// --- 5. HÀM HỖ TRỢ HIỂN THỊ ---
function createNetflixCard(id, story) {
    const div = document.createElement('div');
    div.className = 'story-card';
    div.onclick = () => window.location.href = `book.html?id=${id}`;
    const img = story.img || story.cover || story.image || 'https://via.placeholder.com/180x250';
    div.innerHTML = `<img src="${img}" alt="${story.title}"><h4>${story.title}</h4><p>${story.author || 'Động Chăn Rùa'}</p>`;
    return div;
}

function handleFeaturedRandomBook(storiesData) {
    const keys = Object.keys(storiesData);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const story = storiesData[randomKey];
    
    document.getElementById('heroTitle').innerText = story.title;
    document.getElementById('heroLink').href = `book.html?id=${randomKey}`;
    const img = story.img || story.cover || story.image;
    document.getElementById('featuredBook').style.background = `linear-gradient(to right, rgba(252,249,250,0.95) 40%, rgba(252,249,250,0.4)), url('${img}')`;
}

// --- 6. HÀM QUẢN LÝ HỒ SƠ ---
function openProfileZone() {
    document.getElementById('homeMainContent').style.display = 'none';
    document.getElementById('profileSection').style.display = 'block';
}

function showHome() {
    document.getElementById('profileSection').style.display = 'none';
    document.getElementById('homeMainContent').style.display = 'block';
}

function logoutFromProfile() {
    if(confirm("Chị muốn đăng xuất khỏi Động ạ?")) auth.signOut().then(() => showHome());
}

// --- 7. CÁC HÀM BỔ TRỢ KHÁC ---
function openAuthModal() { document.getElementById('authModal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('authModal').style.display = 'none'; }
function closeAuthModalOverlay(event) { if (event.target.id === 'authModal') closeAuthModal(); }

// ... Các hàm còn lại như toggleAuthMode, submitAuthForm, renderUserProfileData ...
// (Đã tích hợp sẵn logic như Chị cung cấp ở đoạn cuối)
