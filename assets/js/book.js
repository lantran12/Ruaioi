import { db, ref, get } from "./firebase.js";

const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get('id');

async function loadBook() {
    if (!storyId) return;

    const snap = await get(ref(db, 'stories/' + storyId));
    if (snap.exists()) {
        const story = snap.val();
        document.getElementById('storyTitle').innerText = story.title;
        document.getElementById('storyDesc').innerText = story.description || "Chưa có mô tả.";
        document.getElementById('storyCover').src = story.cover || 'https://via.placeholder.com/250x350';
    }

    const chaptersSnap = await get(ref(db, 'chapters/' + storyId));
    const listDiv = document.getElementById('chapterList');
    
    if (chaptersSnap.exists()) {
        chaptersSnap.forEach((child) => {
            const ch = child.val();
            listDiv.innerHTML += `
                <a href="read.html?storyId=${storyId}&chapterId=${child.key}" class="chapter-item">
                    <span>${ch.title}</span>
                    <i class="fa-solid fa-chevron-right"></i>
                </a>
            `;
        });
    }
}
loadBook();
