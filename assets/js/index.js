// Dữ liệu mẫu (Khi có Firebase, chị sẽ lấy dữ liệu từ Realtime Database/Firestore về đây)
const listBooks = [
    { title: "Yêu Em Từ Cái Nhìn Đầu Tiên", author: "Cố Mạn", status: "updating", chapter: "Chương 120", img: "https://picsum.photos/200/300?random=1" },
    { title: "Bên Nhau Trọn Đời", author: "Cố Mạn", status: "completed", chapter: "Chương 80", img: "https://picsum.photos/200/300?random=2" },
    { title: "Ma Đạo Tổ Sư", author: "Mặc Hương Đồng Khứu", status: "completed", chapter: "Chương 113", img: "https://picsum.photos/200/300?random=3" }
];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Bật/Tắt Dropdown Thông báo
    const notiBtn = document.getElementById("notiBtn");
    const notiContent = document.getElementById("notiContent");
    
    notiBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        notiContent.style.display = notiContent.style.display === "block" ? "none" : "block";
        // Bấm vào xem thì xóa số badge đi cho tinh tế
        document.getElementById("notiBadge").style.display = "none";
    });

    // 2. Bật/Tắt Dropdown Thể loại và Tác giả
    handleDropdown("tagDropdownBtn", "tagMenu");
    handleDropdown("authorDropdownBtn", "authorMenu");

    // Click ra ngoài thì ẩn hết dropdown
    document.addEventListener("click", () => {
        notiContent.style.display = "none";
        document.getElementById("tagMenu").style.display = "none";
        document.getElementById("authorMenu").style.display = "none";
    });

    // 3. Render Truyện Đề Cử ngẫu nhiên (Random)
    renderRandomFeatured();
});

// Hàm hỗ trợ ẩn hiện dropdown chung
function handleDropdown(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    });
}

// Hàm random truyện đề cử
function renderRandomFeatured() {
    const featuredCard = document.getElementById("featuredBook");
    if(listBooks.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * listBooks.length);
    const book = listBooks[randomIndex];
    
    featuredCard.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: center;">
            <img src="${book.img}" alt="${book.title}" style="width: 80px; height: 110px; object-fit: cover; border-radius: 8px;">
            <div>
                <h3 style="margin-bottom: 5px; color: #ff9aa2;">${book.title}</h3>
                <p style="font-size: 14px;">Tác giả: <strong>${book.author}</strong></p>
                <p style="font-size: 13px; color: #888; margin-top: 5px;">Gợi ý: Một bộ truyện cực kỳ ngọt ngào không thể bỏ qua!</p>
            </div>
        </div>
    `;
}
