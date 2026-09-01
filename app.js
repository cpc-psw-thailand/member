// ---------------------------------------------------------------------
// CPC-PSW Thailand — ระบบสมาชิก: ฟังก์ชันกลาง
// ---------------------------------------------------------------------

/**
 * เรียก Google Apps Script Web App
 * ใช้ Content-Type: text/plain เพื่อเลี่ยง CORS preflight (Apps Script ไม่รองรับ OPTIONS)
 */
async function callApi(action, data) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
    throw new Error("ยังไม่ได้ตั้งค่า APPS_SCRIPT_URL ใน assets/js/config.js");
  }
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action: action }, data)),
  });
  if (!res.ok) throw new Error("เครือข่ายมีปัญหา (HTTP " + res.status + ")");
  return res.json();
}

function showAlert(el, type, message) {
  el.className = "alert alert-" + type;
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideAlert(el) {
  el.classList.add("hidden");
}

function setLoading(btn, loading, labelDefault) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.label = btn.dataset.label || btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> กำลังดำเนินการ...';
  } else {
    btn.disabled = false;
    btn.textContent = labelDefault || btn.dataset.label || btn.textContent;
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case "ใช้งานอยู่": return "badge-active";
    case "รอตรวจสอบ": return "badge-pending";
    case "ไม่อนุมัติ": return "badge-rejected";
    case "ระงับ": return "badge-suspended";
    case "หมดอายุ": return "badge-expired";
    default: return "badge-pending";
  }
}

// mobile nav toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear() + 543;
});
