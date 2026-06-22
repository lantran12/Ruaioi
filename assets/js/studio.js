import { db, auth, ref, onChildAdded, onAuthStateChanged, remove } from "./firebase.js";
import { set, update, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"; 
onAuthStateChanged(auth, (user) => {
    if (user && user.uid === "BrZQ9s07ujfIYG1iPtC4vIhGgx33") {
        loadAdminStoryList();
    } else {
        alert("Chị không có quyền vào đây!");
        window.location.href = "index.html";
    }
});

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
    list.innerHTML = "";
    const storiesRef = ref(db, "stories");
    onChildAdded(storiesRef, (snapshot) => {
        const id = snapshot.key;
        const story = snapshot.val();
        const item = document.createElement("div");
        item.id = "story-" + id;
        item.style = "padding:15px;margin-bottom:10px;background:white;border-radius:12px;display:flex;justify-content:space-between;align-items:center;";
        item.innerHTML = `<div><h4 style="margin:0">${story.title}</h4><div style="font-size:13px;color:#777">ID : ${id}</div><div style="font-size:12px;color:#999">Chương mới nhất : ${story.latestChapter || 0}</div><div style="font-size:12px;color:#999">Cập nhật : ${story.lastUpdate || "Chưa có"}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button onclick="editStory('${id}')">Sửa</button><button onclick="deleteStory('${id}')">Xóa</button><button onclick="openPostModal('${id}','${story.title}')">Đăng chương</button></div>`;
        list.appendChild(item);
    });
}

window.handleCreateStory = handleCreateStory;
window.resetForm = resetForm;

let importChapters = [];
function splitChapters(text) {
    importChapters = [];
    text = text.replace(/\r/g, "");
    const regex = /(Chương\s*\d+.*?)(?=\nChương\s*\d+|\nCHƯƠNG\s*\d+|$)/gis;
    const matches = text.match(regex);
    if (!matches) { alert("Không tìm thấy chương nào.\n\nTiêu đề phải dạng:\nChương 1\nhoặc\nChương 1: ABC"); return; }
    matches.forEach((chapterText, index) => {
        const lines = chapterText.trim().split("\n");
        const title = lines.shift().trim();
        const content = lines.join("\n").trim();
        importChapters.push({ number: index + 1, title: title, content: content });
    });
    renderPreview();
}
function renderPreview() {
    const preview = document.getElementById("chapterPreview");
    if (!preview) return;
    preview.innerHTML = "";
    importChapters.forEach(ch => {
        const div = document.createElement("div");
        div.style = "background:#fff;padding:10px;margin-bottom:8px;border-radius:10px;border:1px solid #eee;";
        div.innerHTML = `<b>${ch.title}</b><br><small>${ch.content.substring(0,120)}...</small>`;
        preview.appendChild(div);
    });
}
window.handleImportFile = function () {
    const input = document.getElementById("chapterFileInput");
    if (!input.files.length) { alert("Chưa chọn file."); return; }
    const file = input.files[0];
    const ext = file.name.toLowerCase();
    if (ext.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = e => splitChapters(e.target.result);
        reader.readAsText(file, "utf-8");
        return;
    }
    if (ext.endsWith(".docx")) {
        const reader = new FileReader();
        reader.onload = e => mammoth.extractRawText({ arrayBuffer: e.target.result }).then(r => splitChapters(r.value));
        reader.readAsArrayBuffer(file);
        return;
    }
    alert("Chỉ hỗ trợ TXT và DOCX.");
}
window.clearPreview = function(){
    importChapters = [];
    const preview = document.getElementById("chapterPreview");
    if(preview) preview.innerHTML = "";
    document.getElementById("chapterFileInput").value = "";
}

let importedChapters = [];
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
    preview.innerHTML = "";
    const arr = text.split(/(?=Chương\s+\d+\s*:)/gi);
    arr.forEach(item => {
        item = item.trim();
        if (item.length < 10) return;
        const firstLine = item.split("\n")[0];
        importedChapters.push({ title: firstLine, content: item });
    });
    preview.innerHTML = "<h4>Đã tìm thấy " + importedChapters.length + " chương</h4>";
    importedChapters.forEach((chapter, index) => {
        preview.innerHTML += `<div style="padding:10px;margin-bottom:8px;border:1px solid #ddd;border-radius:8px;"><b>${index + 1}. ${chapter.title}</b></div>`;
    });
}

async function handleUploadContent() {
    const storyId = document.getElementById("modalStoryId").value;
    if (!storyId) { alert("Không tìm thấy ID truyện."); return; }
    if (importedChapters.length === 0) { alert("Chưa đọc file."); return; }
    try {
        for (let i = 0; i < importedChapters.length; i++) {
            const chapter = importedChapters[i];
            await set(ref(db, `stories/${storyId}/chapters/chapter-${i + 1}`), { number: i + 1, title: chapter.title, content: chapter.content });
        }
        const today = new Date();
        const updateTime = today.getDate().toString().padStart(2, "0") + "/" + (today.getMonth() + 1).toString().padStart(2, "0") + "/" + today.getFullYear();
        await update(ref(db, `stories/${storyId}`), { latestChapter: importedChapters.length, updatedAt: updateTime });
        alert("Đăng " + importedChapters.length + " chương thành công!");
        importedChapters = [];
        document.getElementById("chapterPreview").innerHTML = "";
        document.getElementById("chapterPreview").style.display = "none";
        document.getElementById("chapterFileInput").value = "";
        closePostModal();
    } catch (err) {
        console.error(err);
        alert("Upload thất bại.");
    }
}

let currentStoryId = null;
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user && user.uid === "BrZQ9s07ujfIYG1iPtC4vIhGgx33") {

        currentUser = user;

        loadAdminStoryList();

    } else {
        alert("Chị không có quyền vào đây!");
        window.location.href = "index.html";
    }
});

async function loadChapters(storyId) {
    currentStoryId = storyId;
    document.getElementById("chapterManager").style.display = "block";
    const chapterList = document.getElementById("chapterList");
    chapterList.innerHTML = "";
    const snapshot = await get(ref(db, "chapters/" + storyId));
    if (!snapshot.exists()) { chapterList.innerHTML = "<p>Chưa có chương.</p>"; return; }
    const chapters = [];
    snapshot.forEach(child => { chapters.push({ id: child.key, ...child.val() }); });
    chapters.sort((a, b) => a.chapter - b.chapter);
    chapters.forEach(ch => {
        const item = document.createElement("div");
        item.className = "chapter-item";
        item.innerHTML = `<b>Chương ${ch.chapter}</b> - ${ch.title} <button onclick="editChapter('${ch.id}')">Sửa</button> <button onclick="deleteChapter('${ch.id}')">Xóa</button>`;
        chapterList.appendChild(item);
    });
}
