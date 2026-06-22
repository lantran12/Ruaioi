import { db, auth } from "./firebase.js";
import { ref, set, update, get, onChildAdded, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- CÁC BIẾN TOÀN CỤC ---
let importedChapters = [];
let currentStoryId = null;
let currentUser = null;

// --- KIỂM TRA QUYỀN TRUY CẬP ---
onAuthStateChanged(auth, (user) => {
    if (user && user.uid === "BrZQ9s07ujfIYG1iPtC4vIhGgx33") {
        currentUser = user;
        loadAdminStoryList();
    } else {
        alert("Chị không có quyền vào đây!");
        window.location.href = "index.html";
    }
});

// --- QUẢN LÝ TRUYỆN ---
async function handleCreateStory() {
    const customId = document.getElementById("idInput").value.trim().toLowerCase();
    const title = document.getElementById("titleInput").value;
    const author = document.getElementById("authorInput").value;
    const status = document.getElementById("statusSelect").value;
    const cover = document.getElementById("coverInput").value;
    const description = document.getElementById("descInput").value;
    const selectedGenres = [];
    document.querySelectorAll("#genreModalContainer input:checked").forEach(cb => selectedGenres.push(cb.value));

    if (!customId) { alert("Chưa nhập ID truyện."); return; }
    
    const storyRef = ref(db, "stories/" + customId);
    const isEditing = document.getElementById("idInput").readOnly;
    const storyData = { title, author, status, cover, description, genres: selectedGenres, updatedAt: Date.now() };

    if (isEditing) {
        await update(storyRef, storyData);
        alert("✅ Đã cập nhật truyện.");
    } else {
        await set(storyRef, { ...storyData, createdAt: Date.now(), latestChapter: 0, lastUpdate: "", views: 0 });
        alert("🎉 Đăng truyện thành công.");
    }
    resetForm();
    document.getElementById("idInput").readOnly = false;
    loadAdminStoryList();
}

function resetForm() {
    document.getElementById("idInput").value = "";
    document.getElementById("titleInput").value = "";
    document.getElementById("authorInput").value = "";
    document.getElementById("coverInput").value = "";
    document.getElementById("descInput").value = "";
    if(document.getElementById("editorNote")) document.getElementById("editorNote").value = "";
    document.getElementById("selectedGenresText").innerText = "Chọn thể loại...";
    document.querySelectorAll("#genreModalContainer input").forEach(cb => cb.checked = false);
}

function loadAdminStoryList() {
    const list = document.getElementById("adminStoryList");
    if(!list) return;
    list.innerHTML = "";
    onChildAdded(ref(db, "stories"), (snapshot) => {
        const id = snapshot.key;
        const story = snapshot.val();
        const item = document.createElement("div");
        item.id = "story-" + id;
        item.style = "padding:15px;margin-bottom:10px;background:white;border-radius:12px;display:flex;justify-content:space-between;align-items:center;border:1px solid #eee;";
        item.innerHTML = `<div><h4 style="margin:0">${story.title}</h4><div style="font-size:13px;color:#777">ID : ${id}</div></div>
        <div style="display:flex;gap:8px;"><button onclick="editStory('${id}')">Sửa</button><button onclick="deleteStory('${id}')">Xóa</button><button onclick="openPostModal('${id}','${story.title}')">Đăng chương</button></div>`;
        list.appendChild(item);
    });
}

// --- QUẢN LÝ CHƯƠNG (FILE IMPORT) ---
async function handleImportFile() {
    const input = document.getElementById("chapterFileInput");
    if (!input.files.length) { alert("Chưa chọn file."); return; }
    const file = input.files[0];
    let text = "";
    
    if (file.name.endsWith(".txt")) { text = await file.text(); }
    else if (file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
    } else { alert("Chỉ hỗ trợ TXT và DOCX"); return; }
    
    splitChapters(text);
}

function splitChapters(text) {
    importedChapters = [];
    const preview = document.getElementById("chapterPreview");
    preview.style.display = "block";
    preview.innerHTML = "<h4>Đang xử lý...</h4>";
    
    // Tách chương theo từ khóa "Chương"
    const arr = text.split(/(?=Chương\s+\d+)/gi);
    arr.forEach(item => {
        item = item.trim();
        if (item.length < 10) return;
        const firstLine = item.split("\n")[0];
        importedChapters.push({ title: firstLine, content: item });
    });
    
    preview.innerHTML = "<h4>Đã tìm thấy " + importedChapters.length + " chương</h4>";
    importedChapters.forEach((chapter, index) => {
        preview.innerHTML += `<div style="padding:5px;border-bottom:1px solid #eee;">${index + 1}. ${chapter.title}</div>`;
    });
}

async function handleUploadContent() {
    const storyId = document.getElementById("modalStoryId").value;
    if (!storyId || importedChapters.length === 0) { alert("Dữ liệu không hợp lệ."); return; }
    try {
        for (let i = 0; i < importedChapters.length; i++) {
            await set(ref(db, `stories/${storyId}/chapters/chapter-${i + 1}`), { 
                number: i + 1, title: importedChapters[i].title, content: importedChapters[i].content 
            });
        }
        await update(ref(db, `stories/${storyId}`), { latestChapter: importedChapters.length });
        alert("Đăng thành công!");
        closePostModal();
    } catch (err) { alert("Lỗi upload."); }
}

// --- GẮN HÀM VÀO WINDOW ĐỂ HTML GỌI ĐƯỢC ---
Object.assign(window, {
    handleCreateStory,
    resetForm,
    loadAdminStoryList,
    handleImportFile,
    handleUploadContent
});
