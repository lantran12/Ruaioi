import { db, ref } from "./firebase.js";
import { get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Khởi chạy các Dropdown ẩn hiện như cũ
    setupDropdowns();

    // 2. LẤY DATA THẬT TỪ FIREBASE VỀ
    const listBooks = await fetchStoriesFromFirebase();

    // 3. Hiển thị danh sách truyện và truyện đề cử bằng data thật
    renderBookGrid(listBooks);
    renderRandomFeatured(listBooks);

    // 4. Lắng nghe sự kiện bộ lọc Tag (Lọc động từ data thật)
    setupTagFilter(listBooks);
});

// --- HÀM LẤY DATA TỰ ĐỘNG TỪ FIREBASE ---
async function fetchStoriesFromFirebase() {
    const storiesRef = ref(db, "stories");
    const loadedBooks = [];

    try {
        const snapshot = await get(storiesRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Duyệt qua từng bộ truyện trên Firebase
            for (let id in data) {
                const bookData = data[id];
                
                // --- TỰ ĐỘNG CẬP NHẬT SỐ CHƯƠNG ---
                // Hệ thống vào mục đếm số lượng chương thực tế của truyện này
                let latestChapter = "Chương 0";
                const chaptersRef = ref(db, `comments/${id}`); // Hoặc đổi thành đường dẫn chứa chương của chị
                const chapterSnapshot = await get(chaptersRef);
                
                if (chapterSnapshot.exists()) {
                    const chapters = chapterSnapshot.val();
                    // Đếm tổng số lượng key chương đang có (ví dụ: chapter_1, chapter_2...)
                    const totalChapters = Object.keys(chapters).length; 
                    latestChapter = `Chương ${totalChapters}`;
                }

                // Đẩy dữ liệu đã được tự động tính toán vào mảng
                loadedBooks.push({
                    id: id,
                    title: bookData.title,
                    author: bookData.author,
                    status: bookData.status || "updating",
                    tags: bookData.tags || [],
                    img: bookData.img || "https://picsum.photos/200/300",
                    chapter: latestChapter // Số chương tự động cập nhật ở đây!
                });
            }
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu từ Firebase:", error);
    }
    return loadedBooks;
}

// --- HÀM RENDER TRUYỆN RA GRID TRANG CHỦ ---
function renderBookGrid(booksToShow) {
    const bookGrid = document.getElementById("bookGrid");
    if (booksToShow.length === 0) {
        bookGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px 0;">Không có truyện nào rồi chị ơi... 🌸</p>`;
        return;
    }

    bookGrid.innerHTML = booksToShow.map(book => `
        <div class="book-card">
            <div class="book-cover">
                <img src="${book.img}" alt="${book.title}">
                <span class="status-badge ${book.status}">
                    ${book.status === 'completed' ? 'Hoàn thành' : 'Đang chạy'}
                </span>
            </div>
            <div class="book-info">
                <h3 class="book-title"><a href="book.html?id=${book.id}">${book.title}</a></h3>
                <p class="latest-chapter">${book.chapter} (Mới nhất)</p>
            </div>
        </div>
    `).join('');
}

// --- HÀM RENDER TRUYỆN ĐỀ CỬ PREMIUM (RANDOM TỪ DATA THẬT) ---
function renderRandomFeatured(listBooks) {
    const featuredCard = document.getElementById("featuredBook");
    if (!listBooks || listBooks.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * listBooks.length);
    const book = listBooks[randomIndex];
    
    featuredCard.innerHTML = `
        <div class="featured-card-premium">
            <div class="featured-cover-wrapper">
                <img src="${book.img}" alt="${book.title}">
                <div class="ribbon-pop">HOT</div>
            </div>
            <div class="featured-detail">
                <span class="badge-trending"><i class="fa-solid fa-fire"></i> ĐỀ CỬ HÔM NAY</span>
                <h3>${book.title}</h3>
                <div class="featured-meta">
                    <span><i class="fa-solid fa-pen-nib"></i> ${book.author}</span>
                    <span><i class="fa-solid fa-book"></i> ${book.chapter}</span>
                </div>
                <p class="featured-summary">Chào mừng độc giả đến với bộ truyện đề cử siêu hay ngày hôm nay. Bấm vào nút bên dưới để đọc ngay nhé!</p>
                <a href="book.html?id=${book.id}" class="btn-read-now">Đọc Ngay Tại Đây <i class="fa-solid fa-arrow-right"></i></a>
            </div>
        </div>
    `;
}

// --- CÁC HÀM ĐIỀU HƯỚNG DROPDOWN VÀ BỘ LỌC TAG ---
function setupDropdowns() {
    const notiBtn = document.getElementById("notiBtn");
    const notiContent = document.getElementById("notiContent");
    
    notiBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        notiContent.style.display = notiContent.style.display === "block" ? "none" : "block";
        document.getElementById("notiBadge").style.display = "none";
    });

    handleDropdown("tagDropdownBtn", "tagMenu");
    handleDropdown("authorDropdownBtn", "authorMenu");

    document.addEventListener("click", () => {
        notiContent.style.display = "none";
        document.getElementById("tagMenu").style.display = "none";
        document.getElementById("authorMenu").style.display = "none";
    });
}

function handleDropdown(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    });
}

function setupTagFilter(listBooks) {
    const tagItems = document.querySelectorAll(".tag-item");
    tagItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            const selectedTag = item.textContent.trim();
            const filteredBooks = listBooks.filter(book => book.tags.includes(selectedTag));
            document.getElementById("tagDropdownBtn").innerHTML = `${selectedTag} <i class="fa-solid fa-caret-down"></i>`;
            document.getElementById("tagMenu").style.display = "none";
            renderBookGrid(filteredBooks);
        });
    });
}
