import { db, ref } from "./firebase.js";
import { get, onValue, update, remove, push, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut, updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ADMIN_UID = "BrZQ9s07ujfIYG1iPtC4vIhGgx33";
const ADMIN_EMAIL = "dongbanggei@gmail.com";
let tuSachListenerRef = null;
let globalListBooks = [];
let isSignUpMode = true;
let selectedAvatarUrl = "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix";

document.addEventListener("DOMContentLoaded", async () => {
    setupDropdowns();
    listenAuthState();
    globalListBooks = await fetchStoriesFromFirebase();
    renderBookGrid(globalListBooks);
    renderRandomFeatured(globalListBooks);
    listenTopViews(globalListBooks);
    updateFilterMenusAutomatically(globalListBooks);
});

// --- AUTH & ADMIN ---
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
            if (tuSachListenerRef) { tuSachListenerRef(); tuSachListenerRef = null; }
        }
    });
}

function checkAndGrantAdmin(user) {
    if (user.uid === ADMIN_UID || user.email === ADMIN_EMAIL) {
        const adminBtn = document.getElementById('btnOpenAdminPanel');
        if (adminBtn) {
            adminBtn.style.display = 'inline-block';
            adminBtn.onclick = () => {
                const p = document.getElementById('adminPanel');
                if (p) p.style.display = (p.style.display === 'none') ? 'block' : 'none';
            };
        }
    }
}

// --- XỬ LÝ DỮ LIỆU ---
async function fetchStoriesFromFirebase() {
    try {
        const snapshot = await get(ref(db, "stories"));
        if (!snapshot.exists()) return [];
        const data = snapshot.val();
        const promises = Object.keys(data).map(async (id) => {
            const chapSnap = await get(ref(db, `comments/${id}`));
            const chapCount = chapSnap.exists() ? Object.keys(chapSnap.val()).length : 0;
            return { id, ...data[id], chapter: `Chương ${chapCount}`, updatedAt: data[id].updatedAt || 0 };
        });
        const books = await Promise.all(promises);
        return books.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (e) { console.error(e); return []; }
}

// --- RENDER & TÌM KIẾM ---
function renderBookGrid(books) {
    const grid = document.getElementById("bookGrid");
    if (!grid) return;
    grid.innerHTML = books.map(b => `
        <div class="book-card">
            <div class="book-cover"><img src="${b.img}" alt="${b.title}"></div>
            <div class="book-info"><h3><a href="book.html?id=${b.id}">${b.title}</a></h3><p>${b.chapter}</p></div>
        </div>`).join('');
}

window.triggerSearch = function() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const results = globalListBooks.filter(t => t.title.toLowerCase().includes(query));
    const section = document.getElementById('searchResultsSection');
    const grid = document.getElementById('resultsGrid');
    if (grid) grid.innerHTML = results.map(t => `<a href="book.html?id=${t.id}" class="book-card"><img src="${t.img}">${t.title}</a>`).join('');
    if (section) section.style.display = "block";
};

// --- BỘ LỌC ĐỘNG ---
window.filterByAuthor = (name) => {
    renderBookGrid(globalListBooks.filter(b => b.author === name));
    document.getElementById('authorDropdownBtn').innerHTML = `${name} <i class="fa-solid fa-caret-down"></i>`;
    document.getElementById('authorMenu').style.display = 'none';
};

window.filterByTag = (tag) => {
    renderBookGrid(globalListBooks.filter(b => b.tags?.includes(tag)));
    document.getElementById('tagDropdownBtn').innerHTML = `${tag} <i class="fa-solid fa-caret-down"></i>`;
    document.getElementById('tagMenu').style.display = 'none';
};

function updateFilterMenusAutomatically(books) {
    const authors = [...new Set(books.map(b => b.author).filter(a => a))];
    const tags = [...new Set(books.flatMap(b => b.tags || []))];
    const authorMenu = document.getElementById('authorMenu');
    const tagMenu = document.getElementById('tagMenu');
    if (authorMenu) authorMenu.innerHTML = authors.map(a => `<span class="author-item" onclick="filterByAuthor('${a}')">${a}</span>`).join('');
    if (tagMenu) tagMenu.innerHTML = tags.map(t => `<span class="tag-item" onclick="filterByTag('${t}')">${t}</span>`).join('');
}

// --- TỦ SÁCH CÁ NHÂN ---
function renderUserProfileData(user) {
    const tuSachRef = ref(db, 'users/' + user.uid + '/tuSach');
    if (tuSachListenerRef) tuSachListenerRef();
    tuSachListenerRef = onValue(tuSachRef, (snapshot) => {
        const container = document.getElementById('userBookshelfContainer');
        if (!container) return;
        const data = snapshot.val();
        container.innerHTML = data ? Object.keys(data).map(key => `
            <div class="bookshelf-item">
                <p>${data[key].tenTruyen}</p>
                <button onclick="removeFromBookshelf('${key}')">❌</button>
            </div>`).join('') : "Tủ sách trống!";
    });
}

window.removeFromBookshelf = (key) => {
    remove(ref(db, 'users/' + auth.currentUser.uid + '/tuSach/' + key));
};

function setupDropdowns() {
    document.addEventListener("click", () => document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none'));
}

// --- CÁC HÀM UI ---
window.openAuthModal = () => document.getElementById('authModal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('authModal').style.display = 'none';
