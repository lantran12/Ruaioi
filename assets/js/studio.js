// Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBimiEGQcW9at2pOxfdUaJHjim2fmyjjcc",
    authDomain: "dongchanrua.firebaseapp.com",
    databaseURL: "https://dongchanrua-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dongchanrua",
    storageBucket: "dongchanrua.firebasestorage.app",
    messagingSenderId: "640115424540",
    appId: "1:640115424540:web:c9713b7921c09283150ed9"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Khởi động
document.addEventListener("DOMContentLoaded", loadStories);

// Load danh sách truyện
function loadStories() {
    const storyList = document.getElementById("storyList");
    db.ref("stories").on("value", (snapshot) => {
        storyList.innerHTML = "";
        const addCard = document.createElement("div");
        addCard.className = "story-card add-new";
        addCard.innerHTML = `<div class="plus">+</div><p>Tạo truyện mới</p>`;
        addCard.onclick = showCreateForm;
        storyList.appendChild(addCard);

        if (!snapshot.exists()) {
            const empty = document.createElement("p");
            empty.className = "empty";
            empty.innerText = "Chưa có truyện nào.";
            return storyList.appendChild(empty);
        }

        let stories = [];
        snapshot.forEach(child => stories.push({ id: child.key, ...child.val() }));
        stories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        stories.forEach(story => createStoryCard(storyList, story));
    });
}

// Tạo Card
function createStoryCard(container, story) {
    const card = document.createElement("div");
    card.className = "story-card";
    const cover = story.cover || "https://placehold.co/300x420?text=No+Cover";
    card.innerHTML = `
        <img src="${cover}" class="cover">
        <div class="story-info">
            <h3>${story.title}</h3>
            <p class="author">✍ ${story.author || "Chưa có tác giả"}</p>
            <span class="category">${story.category || "Chung"}</span>
            <p class="desc">${story.description || "Chưa có mô tả"}</p>
        </div>`;
    container.appendChild(card);
}

// Form logic
function showCreateForm() { document.getElementById("createStoryModal").style.display = "flex"; }
function hideCreateForm() { document.getElementById("createStoryModal").style.display = "none"; }

// Lưu truyện
function saveStory() {
    const title = document.getElementById("storyTitle").value.trim();
    if (!title) return alert("Vui lòng nhập tên truyện.");
    const story = {
        title,
        author: document.getElementById("storyAuthor").value.trim(),
        category: document.getElementById("storyCategory").value.trim(),
        description: document.getElementById("storyDescription").value.trim(),
        cover: document.getElementById("storyCover").value.trim(),
        createdAt: Date.now()
    };
    db.ref("stories").push(story).then(() => {
        alert("Đã tạo truyện.");
        clearForm();
        hideCreateForm();
    }).catch(err => { console.error(err); alert("Có lỗi khi lưu."); });
}

function clearForm() {
    document.querySelectorAll("#createStoryModal input, #createStoryModal textarea").forEach(el => el.value = "");
}

window.onclick = (e) => {
    const modal = document.getElementById("createStoryModal");
    if (e.target === modal) hideCreateForm();
};
