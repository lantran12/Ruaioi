import { db, auth, ref, onChildAdded, onAuthStateChanged, remove } from "../firebase.js";
import { set, update, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- PHẦN 1: KIỂM TRA ĐĂNG NHẬP ---
onAuthStateChanged(auth, (user) => {
    if (user && user.uid === 'BrZQ9s07ujfIYG1iPtC4vIhGgx33') {
        loadAdminStoryList();
    } else {
        alert("Chị không có quyền vào đây!");
        window.location.href = "index.html";
    }
});

// --- PHẦN 2: CÁC HÀM XỬ LÝ DỮ LIỆU TRUYỆN ---
// Hàm lưu truyện (Đăng mới hoặc Cập nhật)
window.handleCreateStory = async function() {
    const customId = document.getElementById('idInput').value.trim().toLowerCase();
    const title = document.getElementById('titleInput').value;
    
    if (!customId || !title) {
        alert("Chị ơi, chị chưa nhập ID hoặc Tên truyện kìa!");
        return;
    }

    // Lấy danh sách thể loại từ các checkbox trong Modal
    const selectedGenres = [];
    document.querySelectorAll('#genreModalContainer input:checked').forEach(cb => {
        selectedGenres.push(cb.value);
    });

    const storyData = {
        title: title,
        author: document.getElementById('authorInput').value,
        status: document.getElementById('statusSelect').value,
        cover: document.getElementById('coverInput').value,
        description: document.getElementById('descInput').value,
        genres: selectedGenres,
        updatedAt: Date.now()
    };

    const isEditing = document.getElementById('idInput').readOnly;
    const storyRef = ref(db, 'stories/' + customId);

    try {
        if (isEditing) {
            await update(storyRef, storyData);
            alert("✅ Đã cập nhật truyện thành công!");
        } else {
            await set(storyRef, { ...storyData, createdAt: Date.now(), views: 0 });
            alert("🎉 Đăng truyện mới thành công!");
        }
        location.reload(); // Tải lại trang để làm sạch mọi thứ
    } catch (error) {
        alert("Có lỗi xảy ra: " + error.message);
    }
};

// Hàm hiển thị danh sách truyện
function loadAdminStoryList() {
    const listContainer = document.getElementById('adminStoryList');
    listContainer.innerHTML = "";
    const storiesRef = ref(db, 'stories');

    onChildAdded(storiesRef, (snapshot) => {
        const story = snapshot.val();
        const id = snapshot.key;
        
        const item = document.createElement('div');
        item.style = "padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #fff; margin-bottom: 10px; border-radius: 12px;";
        
        item.innerHTML = `
            <div>
                <h4 style="margin: 0;">${story.title}</h4>
                <small style="color: #777;">ID: ${id}</small>
            </div>
            <div style="display: flex; gap: 5px;">
                <button onclick="editStory('${id}')" style="background: #fff3bf; border: none; padding: 6px 12px; border-radius: 20px; cursor: pointer;">Sửa</button>
                <button onclick="deleteStory('${id}')" style="background: #ffdede; color: #d90429; border: none; padding: 6px 12px; border-radius: 20px; cursor: pointer;">Xóa</button>
                <button onclick="openPostModal('${id}', '${story.title}')" style="background: #e0f2f1; color: #00796b; border: none; padding: 6px 12px; border-radius: 20px; cursor: pointer;">Đăng chương</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// --- PHẦN 3: CÁC HÀM ĐĂNG CHƯƠNG ---
// Hàm lưu chương vào Firebase
window.saveChapterToFirebase = function(storyId, title, content) {
    const match = title.match(/Chương\s+(\d+)/i);
    const chapterId = match ? `chuong_${parseInt(match[1])}` : `chuong_${Date.now()}`;

    set(ref(db, `chapters/${storyId}/${chapterId}`), {
        title: title,
        content: content,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }).then(() => {
        console.log("Đã đăng chương: " + chapterId);
    }).catch(error => {
        alert("Lỗi khi đăng chương: " + error.message);
    });
};

// Hàm xử lý file import hàng loạt
window.processBulkFile = function() {
    const file = document.getElementById('bulkFileInput').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        mammoth.extractRawText({arrayBuffer: e.target.result}).then(result => {
            const text = result.value;
            const chapters = text.split(/(?=Chương\s+\d+)/i);
            
            window.bulkData = [];
            const preview = document.getElementById('bulkPreview');
            preview.innerHTML = "<h5>Danh sách chương đã đọc:</h5>";

            chapters.forEach((content) => {
                if (content.trim().length > 0) {
                    const lines = content.split('\n');
                    const title = lines[0].trim();
                    const body = lines.slice(1).join('\n').trim();
                    window.bulkData.push({ title, body });
                    
                    preview.innerHTML += `<div style="padding: 5px; font-size: 13px;">✅ ${title}</div>`;
                }
            });
        });
    };
    reader.readAsArrayBuffer(file);
};

// --- PHẦN 4: HÀM BỔ TRỢ (SỬA, XÓA, POPUP) ---
window.editStory = function(id) {
    get(ref(db, 'stories/' + id)).then((snapshot) => {
        if (snapshot.exists()) {
            const story = snapshot.val();
            document.getElementById('idInput').value = id;
            document.getElementById('idInput').readOnly = true; // Khóa ID khi sửa
            document.getElementById('titleInput').value = story.title;
            document.getElementById('authorInput').value = story.author;
            document.getElementById('coverInput').value = story.cover;
            document.getElementById('descInput').value = story.description;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            alert("Đã tải dữ liệu truyện: " + story.title);
        }
    });
};

window.deleteStory = function(id) {
    if (confirm("Chị ơi, chị có chắc muốn xóa truyện này không?")) {
        remove(ref(db, 'stories/' + id)).then(() => {
            alert("Đã xóa truyện!");
            location.reload();
        });
    }
};

window.openPostModal = function(id, title) {
    document.getElementById('modalStoryId').value = id;
    document.getElementById('modalStoryTitle').innerText = "Đăng chương cho: " + title;
    document.getElementById('postChapterModal').style.display = 'flex';
};

window.closePostModal = function() {
    document.getElementById('postChapterModal').style.display = 'none';
};

window.switchModalTab = function(type) {
    document.getElementById('tab-single').style.display = (type === 'single') ? 'block' : 'none';
    document.getElementById('tab-bulk').style.display = (type === 'bulk') ? 'block' : 'none';
    document.getElementById('btn-single').className = (type === 'single') ? 'btn-action btn-primary' : 'btn-action btn-reset';
    document.getElementById('btn-bulk').className = (type === 'bulk') ? 'btn-action btn-primary' : 'btn-action btn-reset';
};

window.handleConfirmUpload = function() {
    const storyId = document.getElementById('modalStoryId').value;
    const isSingle = document.getElementById('tab-single').style.display !== 'none';
    
    if (isSingle) {
        const num = document.getElementById('singleChapterNumber').value;
        const name = document.getElementById('singleChapterTitle').value;
        const content = document.getElementById('singleContent').value;
        saveChapterToFirebase(storyId, `Chương ${num}: ${name}`, content);
        alert("Đã đăng chương lẻ!");
    } else {
        if (!window.bulkData || window.bulkData.length === 0) return alert("Chưa chọn file hoặc file trống!");
        window.bulkData.forEach(item => saveChapterToFirebase(storyId, item.title, item.body));
        alert("Đang đẩy hàng loạt chương lên...");
    }
    location.reload();
};
