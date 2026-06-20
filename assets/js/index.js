// ==========================================================================
// 1. CẤU HÌNH FIREBASE 
// ==========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyBimiEGQcW9at2pOxfdUaJHjim2fmyjjcc",
    authDomain: "dongchanrua.firebaseapp.com",
    databaseURL: "https://dongchanrua-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dongchanrua",
    storageBucket: "dongchanrua.firebasestorage.app",
    messagingSenderId: "640115424540",
    appId: "1:640115424540:web:c9713b7921c09283150ed9"
};

// Khởi tạo Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();

// Chạy các hàm chức năng khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
    // Chỉ chạy các hàm này nếu tồn tại phần tử trên trang
    if (document.querySelector('.nav-link-btn')) initSubBarFilters();
    if (document.getElementById('notiCount')) listenToNotifications();
    
    if (document.getElementById('bookGrid')) {
        loadGenresDropdown();
        loadMainStories();
        loadTopViews();
    }
    const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") triggerSearch();
    });
}
    // Đảm bảo không lỗi nếu trang book.html không có các section này
    if (document.getElementById('avatarGridContainer')) {
        renderAvatarSelectionGrid();
    }
});
/* ==========================================================================
   2. XỬ LÝ BỘ LỌC TẠI SUB-BAR
   ========================================================================== */
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

/* ==========================================================================
   3. TRUYỆN ĐỀ CỬ NGẪU NHIÊN
   ========================================================================== */
function handleFeaturedRandomBook(storiesData) {
    const keys = Object.keys(storiesData);
    if (keys.length === 0) return;
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const story = storiesData[randomKey];

    const heroTitle = document.getElementById('heroTitle');
    const heroSynopsis = document.getElementById('heroSynopsis');
    const heroLink = document.getElementById('heroLink');
    const featuredBookSection = document.getElementById('featuredBook');

    if (heroTitle) heroTitle.innerText = story.title || "Tác phẩm độc quyền";
    if (heroSynopsis) heroSynopsis.innerText = story.description || story.synopsis || "Bấm vào để khám phá thế giới nội tâm đầy cảm xúc của tác phẩm này...";

    const storyReadUrl = `book.html?id=${randomKey}`;
    if (heroLink) heroLink.setAttribute('href', storyReadUrl);

    const storyImg = story.img || story.cover || story.image;
    if (storyImg && featuredBookSection) {
        featuredBookSection.style.setProperty('background', `linear-gradient(to right, rgba(252,249,250,0.95) 40%, rgba(252,249,250,0.4)), url('${storyImg}')`, 'important');
        featuredBookSection.style.setProperty('background-size', 'cover', 'important');
        featuredBookSection.style.setProperty('background-position', 'center 20%', 'important');
    }

    if (featuredBookSection) {
        featuredBookSection.onclick = function(e) {
            if (e.target.tagName !== 'A' && e.target.parentElement.tagName !== 'A') {
                window.location.href = storyReadUrl;
            }
        };
    }
}

/* ==========================================================================
   4. THẢ MENU THỂ LOẠI
   ========================================================================== */
function loadGenresDropdown() {
    const tagMenu = document.getElementById('tagMenu');
    if (!tagMenu) return;
    db.ref('genres').once('value').then((snapshot) => {
        tagMenu.innerHTML = '';
        if (!snapshot.exists()) return;
        snapshot.forEach((childSnapshot) => {
            const genreName = childSnapshot.val().name || childSnapshot.val();
            const span = document.createElement('span');
            span.textContent = genreName;
            span.addEventListener('click', () => {
                loadStoriesByCondition('genre', genreName, `📜 Thể Loại: ${genreName}`);
            });
            tagMenu.appendChild(span);
        });
    });
}

/* ==========================================================================
   5. BỘ LỌC ĐIỀU KIỆN
   ========================================================================== */
function loadStoriesByCondition(field, value, titleText) {
    const searchSection = document.getElementById('searchResultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const rowTitle = searchSection?.querySelector('.row-title');

    if (!searchSection || !resultsGrid) return;
    if (rowTitle) rowTitle.innerText = titleText;
    searchSection.style.display = 'block';
    resultsGrid.innerHTML = '<div style="grid-column: 1/-1; color: var(--smoke);">Đang lọc tác phẩm...</div>';
    searchSection.scrollIntoView({ behavior: 'smooth' });

    db.ref('stories').orderByChild(field).equalTo(value).once('value')
    .then((snapshot) => {
        resultsGrid.innerHTML = '';
        if (!snapshot.exists()) {
            resultsGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--smoke);">Động chưa tìm thấy truyện nào tương ứng 🐢</p>`;
            return;
        }
        snapshot.forEach((childSnapshot) => {
            resultsGrid.appendChild(createNetflixCard(childSnapshot.key, childSnapshot.val()));
        });
    });
}

function closeSearch() {
    const searchSection = document.getElementById('searchResultsSection');
    if (searchSection) searchSection.style.display = 'none';
}

/* ==========================================================================
   6. THƯ VIỆN CHÍNH
   ========================================================================== */
function loadMainStories() {
    const bookGrid = document.getElementById('bookGrid');
    if (!bookGrid) return;
    bookGrid.innerHTML = '<div style="grid-column: 1/-1; color: var(--smoke);">Đang liên kết Động Chăn Rùa...</div>';

    db.ref('stories').orderByChild('updatedAt').once('value')
    .then((snapshot) => {
        bookGrid.innerHTML = '';
        if (!snapshot.exists()) return;
        const storiesData = snapshot.val();
        handleFeaturedRandomBook(storiesData);
        const storiesArray = [];
        snapshot.forEach((childSnapshot) => {
            storiesArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        storiesArray.reverse().forEach((story) => {
            bookGrid.appendChild(createNetflixCard(story.id, story));
        });
    });
}

/* ==========================================================================
   7. TOP 5 ĐỘT PHÁ LƯỢT XEM
   ========================================================================== */
function loadTopViews() {
    const nominationContainer = document.getElementById('nominationListContainer');
    if (!nominationContainer) return;
    db.ref('stories').orderByChild('views').limitToLast(5).once('value')
    .then((snapshot) => {
        nominationContainer.innerHTML = '';
        if (!snapshot.exists()) return;
        const topStories = [];
        snapshot.forEach((childSnapshot) => {
            topStories.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        topStories.reverse().forEach((story, index) => {
            const card = document.createElement('div');
            card.className = 'story-card';
            card.onclick = () => window.location.href = `book.html?id=${story.id}`;
            const currentImg = story.img || story.cover || story.image || 'https://via.placeholder.com/180x250';
            card.innerHTML = `
                <img src="${currentImg}" alt="${story.title}">
                <div style="flex: 1; min-width: 0;">
                    <h4 style="margin-top:0; font-size:0.95rem; font-weight:700;">TOP ${index + 1} . ${story.title}</h4>
                    <p style="margin-bottom:0; font-size:0.8rem; color: var(--netflix-red); font-weight:600;"><i class="fa-regular fa-eye"></i> ${story.views || 0} lượt xem</p>
                </div>
            `;
            nominationContainer.appendChild(card);
        });
    });
}

/* ==========================================================================
   8. LẮNG NGHE THÔNG BÁO
   ========================================================================== */
function listenToNotifications() {
    const notiCountBadge = document.getElementById('notiCount');
    if (!notiCountBadge) return;
    db.ref('notifications').on('value', (snapshot) => {
        notiCountBadge.textContent = snapshot.exists() ? snapshot.numChildren() : "0";
    });
}

/* ==========================================================================
   9. HÀM BỔ TRỢ: TẠO CARD
   ========================================================================== */
function createNetflixCard(id, story) {
    const div = document.createElement('div');
    div.className = 'story-card';
    div.onclick = () => window.location.href = `book.html?id=${id}`;
    const currentImg = story.img || story.cover || story.image || 'https://via.placeholder.com/180x250';
    div.innerHTML = `
        <img src="${currentImg}" alt="${story.title}">
        <h4>${story.title}</h4>
        <p>${story.author || 'Động Chăn Rùa'}</p>
    `;
    return div;
}

function triggerSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput || !searchInput.value.trim()) return;
    const keyword = searchInput.value.trim().toLowerCase();
    const searchSection = document.getElementById('searchResultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const rowTitle = searchSection?.querySelector('.row-title');

    if (rowTitle) rowTitle.innerText = `🔍 Kết quả tìm kiếm cho: "${searchInput.value}"`;
    searchSection.style.display = 'block';
    resultsGrid.innerHTML = '';
    db.ref('stories').once('value').then((snapshot) => {
        if(!snapshot.exists()) return;
        let hasResult = false;
        snapshot.forEach((childSnapshot) => {
            const story = childSnapshot.val();
            if((story.title || '').toLowerCase().includes(keyword) || (story.author || '').toLowerCase().includes(keyword)) {
                resultsGrid.appendChild(createNetflixCard(childSnapshot.key, story));
                hasResult = true;
            }
        });
        if(!hasResult) resultsGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--smoke);">Không tìm thấy tác phẩm nào khớp từ khóa 🐢</p>`;
    });
}

/* ==========================================================================
   10. QUẢN LÝ ĐĂNG NHẬP & HỒ SƠ
   ========================================================================== */
let isSignUpMode = true; 
let selectedAvatarUrl = "";
let tuSachListenerRef = null; 

auth.onAuthStateChanged((user) => {
    const btnHeaderAuth = document.getElementById('btnHeaderAuth');
    let btnAdminCrown = document.getElementById('btnOpenAdminPanel');
    if (!btnAdminCrown && btnHeaderAuth) {
        btnAdminCrown = document.createElement('button');
        btnAdminCrown.id = 'btnOpenAdminPanel';
        btnAdminCrown.innerHTML = '👑';
        btnAdminCrown.style.cssText = "background: #2e8b57; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 16px; cursor: pointer; display: none; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 8px;";
        if (btnHeaderAuth.parentNode) {
            btnHeaderAuth.parentNode.style.display = "flex";
            btnHeaderAuth.parentNode.alignItems = "center";
            btnHeaderAuth.parentNode.insertBefore(btnAdminCrown, btnHeaderAuth);
        }
    }

    if (user) {
            renderAvatarSelectionGrid(); // 👈 THÊM DÒNG NÀY
        
        btnHeaderAuth.innerHTML = `Chào, ${user.displayName || 'Bạn'}`;
        btnHeaderAuth.style.cssText = "width: auto; padding: 0 12px; border-radius: 20px; font-size: 13px; background: #ff4d6d; color: white; border: none; height: 36px; cursor: pointer;";
        btnHeaderAuth.onclick = openProfileZone;

        if (document.getElementById('userProfileEmail')) document.getElementById('userProfileEmail').textContent = user.email;
        if (document.getElementById('userProfileName')) document.getElementById('userProfileName').textContent = user.displayName || "Thành viên Động Rùa";

        renderUserProfileData(user);
        loadUserBookshelf(user);

        if (user.uid === 'BrZQ9s07ujfIYG1iPtC4vIhGgx33') {
            if (btnAdminCrown) {
                btnAdminCrown.style.display = "flex";
                btnAdminCrown.onclick = () => window.location.href = 'admin.html';
            }
        }
    } else {
        btnHeaderAuth.innerHTML = '<i class="fa-regular fa-user"></i>';
        btnHeaderAuth.style.cssText = ""; 
        btnHeaderAuth.onclick = openAuthModal;
        if (btnAdminCrown) btnAdminCrown.style.display = "none";
    }
});

function openProfileZone() {
    const homeContent = document.getElementById('homeMainContent');
    const profileSection = document.getElementById('profileSection');
    if (homeContent) homeContent.style.display = 'none';
    if (profileSection) profileSection.style.display = 'block';
}

function renderAvatarSelectionGrid() {
    const container = document.getElementById('avatarGridContainer');
    if (!container) return;
    const cuteAvatars = [
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Lily",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Mia",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Bear",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Buster",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Coco",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Lucky",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Milo",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver"
    ];
    container.innerHTML = cuteAvatars.map(url => `
        <img src="${url}" class="avatar-option-img" style="width: 50px; height: 50px; cursor: pointer; margin: 5px; border-radius: 50%; border: 2px solid transparent;" onclick="selectAvatarOption(this, '${url}')" alt="Cute Avatar">
    `).join('');
}

function buildBookshelfHTML(data, container) {
    container.innerHTML = Object.keys(data).map(key => {
        const b = data[key];
        return `<div class="bookshelf-item" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
            <div class="bookshelf-left" style="display: flex; align-items: center; gap: 10px;">
                <img src="${b.image || 'https://via.placeholder.com/45x60'}" class="bookshelf-thumb" style="width: 45px; height: 60px; object-fit: cover; border-radius: 4px;" alt="Cover">
                <div>
                    <p style="margin: 0; font-weight: bold; font-size: 14px;">${b.tenTruyen}</p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #777;">Đọc đến: ${b.chuongGanNhat || 'Chưa đọc'}</p>
                </div>
            </div>
            <button class="btn-remove-book" onclick="removeFromBookshelf('${key}')" style="background: none; border: none; cursor: pointer; font-size: 14px;">❌</button>
        </div>`;
    }).join('');
}

function selectAvatarOption(imgEl, url) { 
    selectedAvatarUrl = url; 
    document.querySelectorAll('.avatar-option-img').forEach(img => img.style.border = '2px solid transparent'); 
    imgEl.style.border = '2px solid #ff4d6d'; 
}

function removeFromBookshelf(key) {
    if (confirm("Chị có muốn xóa truyện này không ạ? 🐢")) {
        firebase.database().ref('users/' + auth.currentUser.uid + '/tuSach/' + key).remove();
    }
}

function openAuthModal() { const modal = document.getElementById('authModal'); if (modal) modal.style.display = 'flex'; }
function closeAuthModal() { const modal = document.getElementById('authModal'); if (modal) modal.style.display = 'none'; }

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const authTitle = document.getElementById('authTitle');
    const nickNameGroup = document.getElementById('nickNameGroup');
    const btnAuthSubmit = document.getElementById('btnAuthSubmit');
    const authToggleLink = document.getElementById('authToggleLink');
    if (isSignUpMode) {
        authTitle.textContent = "GIA NHẬP RÙA STREAM"; nickNameGroup.style.display = 'block';
        btnAuthSubmit.textContent = "BẮT ĐẦU TRẢI NGHIỆM"; authToggleLink.textContent = "Đã có tài khoản rồi? Bấm vào đây để Đăng nhập";
    } else {
        authTitle.textContent = "ĐĂNG NHẬP THÀNH VIÊN"; nickNameGroup.style.display = 'none';
        btnAuthSubmit.textContent = "ĐĂNG NHẬP VÀO ĐỘNG NGAY"; authToggleLink.textContent = "Chưa có tài khoản? Bấm vào đây để Đăng ký";
    }
}

function submitAuthForm() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const displayName = document.getElementById('authDisplayName').value.trim();
    if (!email || !password) { alert("Chị vui lòng điền đủ thông tin nha!"); return; }
    if (isSignUpMode) {
        auth.createUserWithEmailAndPassword(email, password).then((userCredential) => {
            if (displayName) userCredential.user.updateProfile({ displayName: displayName });
            alert("🎉 Đăng ký thành công!"); closeAuthModal();
        }).catch(err => alert(err.message));
    } else {
        auth.signInWithEmailAndPassword(email, password).then(() => {
            alert("🎉 Chào mừng chị trở lại!"); closeAuthModal();
        }).catch(err => alert(err.message));
    }
}

function showHome() {
    if(document.getElementById('profileSection')) document.getElementById('profileSection').style.display = 'none';
    if(document.getElementById('homeMainContent')) document.getElementById('homeMainContent').style.display = 'block';
}

function logoutFromProfile() {
    if(confirm("Chị muốn đăng xuất tài khoản đúng không ạ? 🐢")) {
        if (tuSachListenerRef) tuSachListenerRef.off();
        auth.signOut();
        location.reload(); 
    }
}

function updateUserProfileData() {
    const user = auth.currentUser;
    const newName = document.getElementById('editDisplayNameInput').value; 
    if (!user) { alert("Chị ơi, chị chưa đăng nhập kìa!"); return; }
    const finalName = newName.trim() === "" ? document.getElementById('userProfileName').textContent : newName;

    user.updateProfile({ displayName: finalName }).then(() => {
        db.ref('users/' + user.uid).update({ displayName: finalName, avatar: selectedAvatarUrl || user.photoURL || "" }).then(() => {
            alert("Đã cập nhật hồ sơ thành công! 🐢");
            document.getElementById('userProfileName').textContent = finalName;
        });
    }).catch((error) => alert("Lỗi rồi: " + error.message));
}

function loadUserBookshelf(user) {
    const bookshelfContainer = document.getElementById('userBookshelfContainer');
    if (!bookshelfContainer) return;
    if (tuSachListenerRef) tuSachListenerRef.off('value');
    tuSachListenerRef = db.ref('users/' + user.uid + '/tuSach');
    tuSachListenerRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            buildBookshelfHTML(snapshot.val(), bookshelfContainer);
        } else {
            bookshelfContainer.innerHTML = "<p style='color: #777; text-align: center;'>Chị chưa lưu bộ truyện nào cả 🐢</p>";
        }
    });
}

function addToBookshelf(storyId, storyData) {
    const user = auth.currentUser;
    if (!user) { alert("Chị ơi, chị đăng nhập để lưu truyện nha!"); openAuthModal(); return; }
    db.ref('users/' + user.uid + '/tuSach/' + storyId).set({
        tenTruyen: storyData.title,
        image: storyData.img || storyData.cover || storyData.image,
        chuongGanNhat: 'Chương 1',
        addedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        alert("Đã lưu vào tủ sách của chị! 🐢");
        loadUserBookshelf(user); 
    });
}
// ===== FIX MODAL CLICK NGOÀI =====
function closeAuthModalOverlay(e) {
    if (e.target.id === "authModal") {
        closeAuthModal();
    }
}

// ===== FIX QUÊN MẬT KHẨU =====
function handleForgotPassword() {
    const email = document.getElementById('authEmail').value;
    if (!email) {
        alert("Nhập email trước nha chị!");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => alert("Đã gửi mail reset mật khẩu rồi đó 💌"))
        .catch(err => alert(err.message));
}
function renderUserProfileData(user) {
    // Có thể để trống cũng được
    // Sau này muốn thêm avatar + info thì viết tiếp ở đây
}
