import { db, ref } from "./firebase.js";
import { get, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut, updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ADMIN_UID = "BrZQ9s07ujfIYG1iPtC4vIhGgx33";
let tuSachListenerRef = null;
let globalListBooks = [];
let isSignUpMode = true;

document.addEventListener("DOMContentLoaded", async () => {
    listenAuthState();
    globalListBooks = await fetchStoriesFromFirebase();
    renderBookGrid(globalListBooks);
});

// --- AUTHENTICATION ---
function listenAuthState() {
    onAuthStateChanged(auth, (user) => {
        const btnAuth = document.getElementById('btnHeaderAuth');
        const adminBtn = document.getElementById('btnOpenAdminPanel');
        if (user) {
            btnAuth.innerHTML = `<i class="fa-solid fa-user"></i> ${user.displayName || "Thành viên"}`;
            btnAuth.onclick = () => { document.getElementById('profileSection').style.display = 'block'; };
            if (user.uid === ADMIN_UID) adminBtn.style.display = 'inline-block';
            renderUserProfileData(user);
        } else {
            btnAuth.innerHTML = `<i class="fa-solid fa-user"></i> Đăng ký / Đăng nhập`;
            btnAuth.onclick = window.openAuthModal;
            adminBtn.style.display = 'none';
        }
    });
}

// --- TỦ SÁCH CÁ NHÂN ---
function renderUserProfileData(user) {
    const container = document.getElementById('userBookshelfContainer');
    const tuSachRef = ref(db, 'users/' + user.uid + '/tuSach');
    
    // Xóa listener cũ để tránh trùng lặp
    if (tuSachListenerRef) tuSachListenerRef(); 
    
    tuSachListenerRef = onValue(tuSachRef, (snapshot) => {
        const data = snapshot.val();
        if (!container) return;
        
        if (!data) {
            container.innerHTML = "<p>Tủ sách của chị đang trống. Hãy thêm truyện nhé! 🌸</p>";
            return;
        }

        container.innerHTML = Object.keys(data).map(key => `
            <div class="bookshelf-item" style="padding: 10px; border: 1px solid #eee; margin-bottom: 5px; display: flex; justify-content: space-between;">
                <span>${data[key].tenTruyen}</span>
                <button onclick="window.removeFromBookshelf('${key}')" style="cursor:pointer; border:none; background:none;">❌</button>
            </div>`).join('');
    });
    
    document.getElementById('userProfileName').innerText = user.displayName;
    document.getElementById('userProfileEmail').innerText = user.email;
}

window.removeFromBookshelf = (key) => {
    const uid = auth.currentUser?.uid;
    if (uid) {
        remove(ref(db, 'users/' + uid + '/tuSach/' + key))
            .catch(err => alert("Lỗi khi xóa: " + err.message));
    }
};

// --- CÁC HÀM ĐIỀU KHIỂN UI ---
window.openAuthModal = () => document.getElementById('authModal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('authModal').style.display = 'none';
window.showHome = () => {
    document.getElementById('profileSection').style.display = 'none';
};
window.logoutFromProfile = () => { signOut(auth).then(() => window.location.reload()); };

window.submitAuthForm = async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authDisplayName').value;
    try {
        if (isSignUpMode) {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCred.user, { displayName: name });
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        window.closeAuthModal();
    } catch (e) { alert("Lỗi: " + e.message); }
};

window.toggleAuthMode = () => {
    isSignUpMode = !isSignUpMode;
    document.getElementById('authTitle').innerText = isSignUpMode ? "ĐĂNG KÝ THÀNH VIÊN" : "ĐĂNG NHẬP";
    document.getElementById('nickNameGroup').style.display = isSignUpMode ? "block" : "none";
};

// --- DATA FETCHING ---
async function fetchStoriesFromFirebase() {
    try {
        const snapshot = await get(ref(db, "stories"));
        return snapshot.exists() ? Object.entries(snapshot.val()).map(([id, val]) => ({ id, ...val })) : [];
    } catch (e) { return []; }
}

function renderBookGrid(books) {
    const grid = document.getElementById("bookGrid");
    if (grid) grid.innerHTML = books.map(b => `<div class="book-card"><img src="${b.img}"><h3>${b.title}</h3></div>`).join('');
}
