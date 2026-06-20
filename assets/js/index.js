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
    initSubBarFilters();
    loadGenresDropdown();
    loadMainStories();
    loadTopViews();
    listenToNotifications();
});

/* ==========================================================================
   2. XỬ LÝ BỘ LỌC TẠI SUB-BAR (Mới phát hành / Đã trọn bộ)
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
                loadStoriesByCondition('status', 'Hoàn thành', '🍿 Danh Sách Truyện Đã Hoàn Thành');
            }
        });
    });
}

/* ==========================================================================
   3. TRUYỆN ĐỀ CỬ NGẪU NHIÊN (Đọc trường 'img' chị tạo)
   ========================================================================== */
function handleFeaturedRandomBook(storiesData) {
    const keys = Object.keys(storiesData);
    if (keys.length === 0) return;

    // Bốc ngẫu nhiên 1 Key (ID) truyện từ Firebase
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const story = storiesData[randomKey];

    const heroTitle = document.getElementById('heroTitle');
    const heroSynopsis = document.getElementById('heroSynopsis');
    const heroLink = document.getElementById('heroLink');
    const featuredBookSection = document.getElementById('featuredBook');

    if (heroTitle) heroTitle.innerText = story.title || "Tác phẩm độc quyền";
    if (heroSynopsis) heroSynopsis.innerText = story.description || story.synopsis || "Bấm vào để khám phá thế giới nội tâm đầy cảm xúc của tác phẩm này...";

    // Tạo link dẫn tới trang chi tiết truyện của chị
    const storyReadUrl = `book.html?id=${randomKey}`;
    if (heroLink) heroLink.setAttribute('href', storyReadUrl);

    // Ưu tiên đọc trường 'img' từ Form Admin của chị, nếu không có mới tìm trường 'cover' hoặc 'image'
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
   4. THẢ MENU THỂ LOẠI TẠI DROP-DOWN
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
                loadStoriesByCondition('genre', genreName, `🍿 Thể Loại: ${genreName}`);
            });
            tagMenu.appendChild(span);
        });
    });
}

/* ==========================================================================
   5. BỘ LỌC ĐIỀU KIỆN (Xổ dữ liệu ra vùng Tìm kiếm chuyên sâu)
   ========================================================================== */
function loadStoriesByCondition(field, value, titleText) {
    const searchSection = document.getElementById('searchResultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const rowTitle = searchSection.querySelector('.row-title');

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
    })
    .catch((err) => {
        console.error("Lỗi lọc dữ liệu:", err);
        resultsGrid.innerHTML = '<p style="grid-column: 1/-1;">Đã xảy ra lỗi khi tìm kiếm.</p>';
    });
}

function closeSearch() {
    const searchSection = document.getElementById('searchResultsSection');
    if (searchSection) searchSection.style.display = 'none';
}

/* ==========================================================================
   6. THƯ VIỆN CHÍNH (Mới Cập Nhật Trên Hệ Thống)
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
        
        // Gọi hàm Random Banner Hero ngay tại đây
        handleFeaturedRandomBook(storiesData);

        const storiesArray = [];
        snapshot.forEach((childSnapshot) => {
            storiesArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        storiesArray.reverse().forEach((story) => {
            bookGrid.appendChild(createNetflixCard(story.id, story));
        });
    })
    .catch((err) => {
        console.error("Lỗi tải truyện chính:", err);
        bookGrid.innerHTML = '<p style="grid-column: 1/-1;">Lỗi kết nối thư viện chính.</p>';
    });
}

/* ==========================================================================
   7. TOP 5 ĐỘT PHÁ LƯỢT XEM (Hàng Ngang Kiểu Dáng Xịn)
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

        topStories.reverse();

        topStories.forEach((story, index) => {
            const card = document.createElement('div');
            card.className = 'story-card';
            card.onclick = () => window.location.href = `book.html?id=${story.id}`;
            
            // Tự động kiểm tra trường ảnh mượt mà
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
   8. LẮNG NGHE THÔNG BÁO REALTIME (Chuông thông báo trên Header)
   ========================================================================== */
function listenToNotifications() {
    const notiCountBadge = document.getElementById('notiCount');
    if (!notiCountBadge) return;
    
    db.ref('notifications').on('value', (snapshot) => {
        if (snapshot.exists()) {
            notiCountBadge.textContent = snapshot.numChildren();
        } else {
            notiCountBadge.textContent = "0";
        }
    });
}

/* ==========================================================================
   9. HÀM BỔ TRỢ: TẠO CARD TRUYỆN PHONG CÁCH NETFLIX (Kiểm tra trường 'img')
   ========================================================================== */
function createNetflixCard(id, story) {
    const div = document.createElement('div');
    div.className = 'story-card';
    div.onclick = () => window.location.href = `book.html?id=${id}`;
    
    // Tự động dùng 'img' chị tạo, hoặc các trường cũ dự phòng
    const currentImg = story.img || story.cover || story.image || 'https://via.placeholder.com/180x250';
    
    div.innerHTML = `
        <img src="${currentImg}" alt="${story.title}">
        <h4>${story.title}</h4>
        <p>${story.author || 'Động Chăn Rùa'}</p>
    `;
    return div;
}

// Hàm Tìm kiếm thủ công khi bấm kính lúp
function triggerSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput || !searchInput.value.trim()) return;
    
    const keyword = searchInput.value.trim().toLowerCase();
    
    const searchSection = document.getElementById('searchResultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const rowTitle = searchSection.querySelector('.row-title');

    if (rowTitle) rowTitle.innerText = `🍿 Kết quả tìm kiếm cho: "${searchInput.value}"`;
    searchSection.style.display = 'block';
    resultsGrid.innerHTML = '';

    db.ref('stories').once('value').then((snapshot) => {
        if(!snapshot.exists()) return;
        
        let hasResult = false;
        snapshot.forEach((childSnapshot) => {
            const story = childSnapshot.val();
            const title = (story.title || '').toLowerCase();
            const author = (story.author || '').toLowerCase();
            
            if(title.includes(keyword) || author.includes(keyword)) {
                resultsGrid.appendChild(createNetflixCard(childSnapshot.key, story));
                hasResult = true;
            }
        });
        
        if(!hasResult) {
            resultsGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--smoke);">Không tìm thấy tác phẩm nào khớp từ khóa 🐢</p>`;
        }
    });
}
/* ==========================================================================
   10. QUẢN LÝ ĐĂNG NHẬP, ĐĂNG XUẤT VÀ PHÂN QUYỀN ADMIN (UID CHUẨN)
   ========================================================================== */

// Biến toàn cục để theo dõi chế độ của Modal (true = Đăng ký, false = Đăng nhập)
let isSignUpMode = true; 

// --- THEO DÕI TRẠNG THÁI ĐĂNG NHẬP REALTIME TỪ FIREBASE ---
auth.onAuthStateChanged((user) => {
    const btnHeaderAuth = document.getElementById('btnHeaderAuth'); // Nút avatar góc phải
    const btnOpenAdminPanel = document.getElementById('btnOpenAdminPanel'); // Nút vương miện 👑
    const adminPanel = document.getElementById('adminPanel'); // Bảng đăng truyện

    if (user) {
        // A. TRƯỜNG HỢP: ĐÃ ĐĂNG NHẬP THÀNH CÔNG
        console.log("Đăng nhập thành công với UID:", user.uid);
        
        // 1. Đổi icon người dùng thành icon Đăng xuất để chị click khi muốn thoát
        if (btnHeaderAuth) {
            btnHeaderAuth.innerHTML = `<i class="fa-solid fa-sign-out-alt" style="color: #ff4d6d;"></i>`;
            btnHeaderAuth.title = "Đăng xuất tài khoản";
            btnHeaderAuth.onclick = () => {
                if(confirm("Chị muốn đăng xuất khỏi Động đúng không ạ? 🐢")) {
                    auth.signOut().then(() => alert("Đã đăng xuất tài khoản thành công!"));
                }
            };
        }

        // 2. Kiểm tra chính xác chuỗi UID tối cao của Chị
        if (user.uid === 'BrZQ9s07ujfIYG1iPtC4vIhGgx33') {
            if (btnOpenAdminPanel) btnOpenAdminPanel.style.display = 'inline-block'; // Hiện vương miện 👑
        } else {
            if (btnOpenAdminPanel) btnOpenAdminPanel.style.display = 'none';
        }

    } else {
        // B. TRƯỜNG HỢP: CHƯA ĐĂNG NHẬP HOẶC VỪA ĐĂNG XUẤT
        if (btnHeaderAuth) {
            btnHeaderAuth.innerHTML = `<i class="fa-regular fa-user"></i>`;
            btnHeaderAuth.title = "Đăng nhập / Đăng ký";
            btnHeaderAuth.onclick = openAuthModal; // Bấm vào gọi lại hộp thoại đăng nhập
        }
        
        // Giấu hoàn toàn nút vương miện và bảng đăng truyện
        if (btnOpenAdminPanel) btnOpenAdminPanel.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'none';
    }
});

// --- CÁC HÀM ĐIỀU KHIỂN HỘP THOẠI (AUTH MODAL) ---

// Mở Modal Đăng Nhập / Đăng Ký
function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

// Đóng Modal
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

// Đóng khi click ra ngoài vùng xám vùng nền
function closeAuthModalOverlay(event) {
    if (event.target.id === 'authModal') {
        closeAuthModal();
    }
}

// Chuyển đổi qua lại giữa chế độ Đăng Ký và Đăng Nhập
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const authTitle = document.getElementById('authTitle');
    const nickNameGroup = document.getElementById('nickNameGroup');
    const btnAuthSubmit = document.getElementById('btnAuthSubmit');
    const authToggleLink = document.getElementById('authToggleLink');

    if (isSignUpMode) {
        if (authTitle) authTitle.textContent = "GIA NHẬP RÙA STREAM";
        if (nickNameGroup) nickNameGroup.style.display = 'block';
        if (btnAuthSubmit) btnAuthSubmit.textContent = "BẮT ĐẦU TRẢI NGHIỆM";
        if (authToggleLink) authToggleLink.textContent = "Đã có tài khoản? Đăng nhập ngay";
    } else {
        if (authTitle) authTitle.textContent = "CHÀO MỪNG TRỞ LẠI ĐỘNG";
        if (nickNameGroup) nickNameGroup.style.display = 'none'; // Đăng nhập thì ẩn ô biệt danh đi
        if (btnAuthSubmit) btnAuthSubmit.textContent = "ĐĂNG NHẬP NGAY";
        if (authToggleLink) authToggleLink.textContent = "Chưa có tài khoản? Đăng ký tại đây";
    }
}

// --- XỬ LÝ GỬI FORM XÁC THỰC LÊN FIREBASE AUTH ---
function submitAuthForm() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const displayName = document.getElementById('authDisplayName').value.trim();

    if (!email || !password) {
        alert("Chị ơi, vui lòng nhập đầy đủ Email và Mật mã nhé! 🐢");
        return;
    }

    if (isSignUpMode) {
        // 1. LOGIC XỬ LÝ ĐĂNG KÝ TÀI KHOẢN MỚI
        auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Cập nhật tên hiển thị nếu có nhập
            if (displayName) {
                userCredential.user.updateProfile({ displayName: displayName });
            }
            alert("🎉 Đăng ký thành viên Động Chăn Rùa thành công!");
            closeAuthModal();
        })
        .catch((error) => {
            alert("Lỗi đăng ký: " + error.message);
        });
    } else {
        // 2. LOGIC XỬ LÝ ĐĂNG NHẬP TÀI KHOẢN CÓ SẴN
        auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert("🎉 Đăng nhập thành công!");
            closeAuthModal();
        })
        .catch((error) => {
            alert("⚠️ Đăng nhập thất bại: " + error.message);
        });
    }
}

// Hàm xử lý nhanh khi người dùng quên mật khẩu
function handleForgotPassword() {
    const email = document.getElementById('authEmail').value.trim();
    if (!email) {
        alert("Vui lòng nhập Email của chị vào ô trống trước rồi bấm nút này nhé!");
        return;
    }
    auth.sendPasswordResetEmail(email)
    .then(() => {
        alert("Một link đặt lại mật khẩu đã được gửi vào Email của chị, hãy kiểm tra hòm thư nha!");
    })
    .catch((error) => {
        alert("Có lỗi xảy ra: " + error.message);
    });
}
