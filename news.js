// ---- ตัวช่วยแปลง Drive File ID เป็นลิงก์แสดง/เปิดรูปภาพ (เหมือนที่ใช้ในหน้าเจ้าหน้าที่) ----
function newsDriveIdFromValue(v) {
  if (!v) return "";
  const s = String(v);
  let m = s.match(/[?&]id=([^&]+)/);
  if (m) return m[1];
  m = s.match(/\/d\/([^/]+)/);
  if (m) return m[1];
  return s;
}

function newsDriveThumbSrc(v) {
  const id = newsDriveIdFromValue(v);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w800` : "";
}

function newsEscapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

document.addEventListener("DOMContentLoaded", async () => {
  const listView = document.getElementById("newsListView");
  const detailView = document.getElementById("newsDetailView");
  const newsGrid = document.getElementById("newsGrid");
  const newsListAlert = document.getElementById("newsListAlert");
  const newsDetailAlert = document.getElementById("newsDetailAlert");
  const newsDetailContent = document.getElementById("newsDetailContent");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    listView.classList.add("hidden");
    detailView.classList.remove("hidden");
    await loadDetail(id);
  } else {
    await loadList();
  }

  async function loadList() {
    hideAlert(newsListAlert);
    try {
      const res = await callApi("publicNewsList", {});
      if (res.ok) {
        renderList(res.list);
      } else {
        newsGrid.innerHTML = "";
        showAlert(newsListAlert, "error", res.error || "โหลดข่าวสารไม่สำเร็จ");
      }
    } catch (err) {
      newsGrid.innerHTML = "";
      showAlert(newsListAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    }
  }

  function renderList(list) {
    if (!list || list.length === 0) {
      newsGrid.innerHTML = '<p class="muted">ยังไม่มีข่าวสารในขณะนี้</p>';
      return;
    }
    newsGrid.innerHTML = list.map((item) => `
      <a class="news-card" href="news.html?id=${encodeURIComponent(item.id)}">
        <img class="news-card-thumb" src="${newsEscapeHtml(newsDriveThumbSrc(item.thumbnailID))}" alt="${newsEscapeHtml(item.title)}" loading="lazy" onerror="this.style.display='none'">
        <div class="news-card-body">
          <div class="news-card-date">${newsEscapeHtml(item.publishDate)}</div>
          <div class="news-card-title">${newsEscapeHtml(item.title)}</div>
          <div class="news-card-summary">${newsEscapeHtml(item.summary)}</div>
          <div class="news-card-cta">อ่านต่อ →</div>
        </div>
      </a>
    `).join("");
  }

  async function loadDetail(newsId) {
    hideAlert(newsDetailAlert);
    newsDetailContent.innerHTML = '<p class="muted">กำลังโหลดข่าวสาร...</p>';
    try {
      const res = await callApi("publicNewsDetail", { id: newsId });
      if (res.ok) {
        renderDetail(res.item);
      } else {
        newsDetailContent.innerHTML = "";
        showAlert(newsDetailAlert, "error", res.error || "ไม่พบข่าวสารนี้");
      }
    } catch (err) {
      newsDetailContent.innerHTML = "";
      showAlert(newsDetailAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    }
  }

  function renderDetail(item) {
    document.title = item.title + " — CPC–PSW Thailand";
    const imagesHtml = (item.imageIDs || []).length
      ? `<div class="news-detail-images">${item.imageIDs.map((imgId) =>
          `<img src="${newsEscapeHtml(newsDriveThumbSrc(imgId))}" alt="${newsEscapeHtml(item.title)}" loading="lazy" onerror="this.style.display='none'">`
        ).join("")}</div>`
      : "";

    newsDetailContent.innerHTML = `
      <div class="news-detail-meta">${newsEscapeHtml(item.publishDate)}${item.author ? " • " + newsEscapeHtml(item.author) : ""}</div>
      <h1>${newsEscapeHtml(item.title)}</h1>
      <hr class="rule">
      <div class="news-detail-content">${newsEscapeHtml(item.content)}</div>
      ${imagesHtml}
    `;
  }
});
