import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// 1. Cấu hình Firebase (Chị thay bằng thông tin từ file config.js của chị)
const firebaseConfig = {
    // Copy đoạn config trong file config.js của chị vào đây
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 2. Lấy ID truyện từ URL (Ví dụ: post-chapter.html?id=zombie)
const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get('id');

// 3. Hàm Đăng chương lẻ
window.uploadChapter = async () => {
    const chapNum = document.getElementById('chapterNumber').value;
    const title = document.getElementById('chapterTitle').value;
    const content = quill.root.innerHTML;

    if (!chapNum || !title) return alert("Vui lòng điền đủ thông tin!");

    const chapterRef = ref(db, `stories/${storyId}/chapters/${chapNum}`);
    await set(chapterRef, {
        title: title,
        content: content,
        timestamp: Date.now()
    });
    alert("Đăng chương thành công!");
};

// 4. Load danh sách chương tự động
const listRef = ref(db, `stories/${storyId}/chapters`);
onValue(listRef, (snapshot) => {
    const listDiv = document.getElementById('chapterList');
    listDiv.innerHTML = ''; 
    const data = snapshot.val();
    
    if (data) {
        Object.keys(data).forEach(key => {
            const chap = data[key];
            const div = document.createElement('div');
            div.className = 'chapter-item';
            div.innerHTML = `
                <span>Chương ${key}: ${chap.title}</span>
                <div>
                    <button onclick="alert('Tính năng sửa chưa viết')">Sửa</button>
                    <button onclick="deleteChapter('${key}')" style="color:#ff4d6d">Xóa</button>
                </div>
            `;
            listDiv.appendChild(div);
        });
    }
});

// 5. Hàm Xóa
window.deleteChapter = (chapNum) => {
    if (confirm("Chắc chắn muốn xóa chương này?")) {
        remove(ref(db, `stories/${storyId}/chapters/${chapNum}`));
    }
};


// Xử lý Import hàng loạt (đơn giản cho .txt)
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        // Giả sử file của chị chia chương bằng từ "Chương"
        const lines = text.split(/Chương \d+/i); 
        const preview = document.getElementById('previewList');
        preview.innerHTML = '<h3>Dữ liệu đã tách (rà soát lại trước khi đăng):</h3>';
        
        lines.forEach((content, index) => {
            if(content.trim().length > 0) {
                const item = document.createElement('div');
                item.style.border = "1px solid #ddd";
                item.style.padding = "10px";
                item.style.marginBottom = "5px";
                item.innerHTML = `<strong>Chương ${index + 1}</strong>: ${content.substring(0, 50)}...`;
                preview.appendChild(item);
            }
        });
    };
    reader.readAsText(file);
});
