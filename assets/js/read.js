import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Chị thay phần config này bằng cấu hình của chị nhé
const firebaseConfig = {
    // ... nội dung config của chị
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 1. Lấy ID truyện từ link: read.html?id=zombie
const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get('id');

// 2. Lấy tên truyện và hiển thị
const storyRef = ref(db, 'stories/' + storyId);
get(storyRef).then((snapshot) => {
    if (snapshot.exists()) {
        const storyData = snapshot.val();
        document.getElementById('storyTitle').innerText = storyData.title; // Giả sử trong stories có trường 'title'
    } else {
        document.getElementById('storyTitle').innerText = "Truyện không tồn tại";
    }
});

// 3. Lấy danh sách chương và hiển thị
const chaptersRef = ref(db, 'chapters/' + storyId);
onValue(chaptersRef, (snapshot) => {
    const container = document.getElementById('chapterListContainer');
    container.innerHTML = ""; 

    snapshot.forEach((childSnapshot) => {
        const chapterKey = childSnapshot.key; // ví dụ: chuong_001
        const chapterData = childSnapshot.val();
        
        const div = document.createElement('div');
        div.className = "chapter-item";
        div.innerHTML = `
            <span>${chapterData.title}</span>
            <button class="btn-read" onclick="window.location.href='view.html?id=${storyId}&chap=${chapterKey}'">Đọc</button>
        `;
        container.appendChild(div);
    });
});
