import { db, auth } from "./firebase.js";
import { ref, get, onValue, update, remove, push, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged, signOut, updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- BIẾN TOÀN CỤC ---
const ADMIN_EMAIL = "dongbanggei@gmail.com";
let tuSachListener = null;
let selectedAvatarUrl = "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix";
let globalListBooks = [];
let isSignUpMode = true;

// --- KHỞI CHẠY ---
document.addEventListener("DOMContentLoaded", async () => {
    setupDropdowns();
    listenAuthState();
    globalListBooks = await fetchStoriesFromFirebase();
    renderBookGrid(globalListBooks);
    renderRandomFeatured(globalListBooks);
    listenTopViews(globalListBooks);
    updateFilterMenusAutomatically(globalListBooks);
});

// --- HÀM ADMIN (ĐÃ RÚT GỌN) ---
window.submitNewStory = () => {
    const data = {
        title: document.getElementById('adminTitle').value.trim(),
        author: document.getElementById('adminAuthor').value.trim(),
        img: document.getElementById('adminImg').value.trim(),
        tags: document.getElementById('adminTags').value.trim().split(',').map(t => t.trim()),
        status: "updating",
        updatedAt: Date.now()
    };
    const id = document.getElementById('adminId').value.trim();
    if (!id || !data.title) return alert("Chị ơi, thiếu ID hoặc Tên truyện!");
    
    set(ref(db, 'stories/' + id), data).then(() => {
        alert("Đăng truyện thành công! 🚀");
        location.reload();
    }).catch(err => alert("Lỗi: " + err.message));
};

function checkAndGrantAdmin(user) {
    if (user?.email === ADMIN_EMAIL) {
        document.getElementById('adminPanel')?.style.setProperty('display', 'block');
        document.getElementById('btnOpenAdminPanel')?.style.setProperty('display', 'inline-block');
    }
}

// --- HÀM AUTH & USER PROFILE (GIỮ NGUYÊN LOGIC CỦA CHỊ) ---
function listenAuthState() {
    onAuthStateChanged(auth, (user) => {
        const btnAuth = document.getElementById('btnHeaderAuth');
        if (!btnAuth) return;
        if (user) {
            btnAuth.innerText = "Chào, " + (user.displayName || "Thành Viên 🌸");
            renderUserProfileData(user);
            checkAndGrantAdmin(user);
        } else {
            btnAuth.innerText = "Đăng Ký / Đăng Nhập";
            tuSachListener?.();
        }
    });
}

// ... Chị dán các hàm renderBookGrid, renderRandomFeatured, fetchStoriesFromFirebase, 
// renderUserProfileData, listenTopViews, updateFilterMenusAutomatically 
// từ file cũ của chị vào đây. Các hàm này hoạt động tốt, không cần sửa logic. ...

// --- CÁC HÀM TIỆN ÍCH ---
function setupDropdowns() {
    const handle = (btnId, menuId) => {
        document.getElementById(btnId)?.addEventListener("click", (e) => {
            e.stopPropagation();
            const menu = document.getElementById(menuId);
            const isShow = menu.style.display === "block";
            closeAllMenus();
            menu.style.display = isShow ? "none" : "block";
        });
    };
    handle("tagDropdownBtn", "tagMenu");
    handle("authorDropdownBtn", "authorMenu");
    document.addEventListener("click", closeAllMenus);
}

function closeAllMenus() {
    ['tagMenu', 'authorMenu', 'notiContent'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

// Giữ lại các hàm window.openAuthModal, window.submitAuthForm, 
// window.updateUserProfileData, v.v. như cũ là đủ.
