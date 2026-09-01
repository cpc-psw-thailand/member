let currentList = [];

document.addEventListener("DOMContentLoaded", () => {
  const loginView = document.getElementById("loginView");
  const dashView = document.getElementById("dashView");
  const loginForm = document.getElementById("loginForm");
  const loginAlert = document.getElementById("loginAlert");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const filterStatus = document.getElementById("filterStatus");
  const filterSearch = document.getElementById("filterSearch");

  function getPassword() {
    return sessionStorage.getItem("cpcpsw_admin_pass") || "";
  }

  function showDashboard() {
    loginView.classList.add("hidden");
    dashView.classList.remove("hidden");
    loadList();
  }

  // auto-login if password already in this session
  if (getPassword()) showDashboard();

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(loginAlert);
    const password = document.getElementById("password").value;

    setLoading(loginBtn, true);
    try {
      const res = await callApi("adminList", { password });
      if (res.ok) {
        sessionStorage.setItem("cpcpsw_admin_pass", password);
        showDashboard();
      } else {
        showAlert(loginAlert, "error", res.error || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (err) {
      showAlert(loginAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(loginBtn, false, "เข้าสู่ระบบ");
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("cpcpsw_admin_pass");
    dashView.classList.add("hidden");
    loginView.classList.remove("hidden");
  });

  refreshBtn.addEventListener("click", loadList);
  filterStatus.addEventListener("change", renderTable);
  filterSearch.addEventListener("input", renderTable);

  async function loadList() {
    const dashAlert = document.getElementById("dashAlert");
    hideAlert(dashAlert);
    const tbody = document.getElementById("memberTableBody");
    tbody.innerHTML = '<tr><td colspan="7" class="center muted">กำลังโหลดข้อมูล...</td></tr>';

    try {
      const res = await callApi("adminList", { password: getPassword() });
      if (res.ok) {
        currentList = res.list.reverse(); // ล่าสุดขึ้นก่อน
        renderTable();
      } else {
        showAlert(dashAlert, "error", res.error || "โหลดข้อมูลไม่สำเร็จ");
        tbody.innerHTML = '<tr><td colspan="7" class="center muted">—</td></tr>';
      }
    } catch (err) {
      showAlert(dashAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    }
  }

  function renderTable() {
    const tbody = document.getElementById("memberTableBody");
    const statusVal = filterStatus.value;
    const searchVal = filterSearch.value.trim().toLowerCase();

    let rows = currentList.filter((m) => {
      if (statusVal && m.status !== statusVal) return false;
      if (searchVal) {
        const hay = (m.firstName + m.lastName + m.nationalID + m.memberID).toLowerCase();
        if (hay.indexOf(searchVal) === -1) return false;
      }
      return true;
    });

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="center muted">ไม่พบข้อมูล</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((m) => `
      <tr data-row="${m.row}">
        <td>${m.memberID || "—"}</td>
        <td>${escapeHtml(m.title + " " + m.firstName + " " + m.lastName)}</td>
        <td>${escapeHtml(m.profession)}</td>
        <td>${escapeHtml(m.memberType || "")}</td>
        <td><span class="badge ${statusBadgeClass(m.status)}">${m.status}</span></td>
        <td>${m.applyDate}</td>
        <td>
          <div class="row-actions">
            ${actionButtons(m)}
          </div>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => handleAction(btn.dataset.action, Number(btn.closest("tr").dataset.row)));
    });
  }

  function actionButtons(m) {
    if (m.status === "รอตรวจสอบ") {
      return `
        <button class="btn btn-gold btn-sm" data-action="approve">อนุมัติ</button>
        <button class="btn btn-danger btn-sm" data-action="reject">ไม่อนุมัติ</button>
      `;
    }
    if (m.status === "ใช้งานอยู่") {
      return `<button class="btn btn-outline btn-sm" data-action="suspend">ระงับ</button>`;
    }
    if (m.status === "ระงับ") {
      return `<button class="btn btn-outline btn-sm" data-action="reactivate">คืนสถานะ</button>`;
    }
    return "—";
  }

  async function handleAction(action, row) {
    const dashAlert = document.getElementById("dashAlert");
    hideAlert(dashAlert);
    const password = getPassword();

    if (action === "approve") {
      if (!confirm("ยืนยันการอนุมัติสมาชิกรายนี้ และออกรหัสสมาชิก?")) return;
      const res = await callApi("adminApprove", { password, row });
      finishAction(res, res.ok ? ("อนุมัติสำเร็จ รหัสสมาชิก: " + res.memberID) : null);
    } else if (action === "reject") {
      const reason = prompt("ระบุเหตุผลที่ไม่อนุมัติ (ถ้ามี):", "");
      if (reason === null) return;
      const res = await callApi("adminReject", { password, row, reason });
      finishAction(res, res.ok ? "บันทึกผลไม่อนุมัติแล้ว" : null);
    } else if (action === "suspend") {
      if (!confirm("ยืนยันการระงับสมาชิกภาพรายนี้?")) return;
      const res = await callApi("adminSuspend", { password, row });
      finishAction(res, res.ok ? "ระงับสมาชิกภาพแล้ว" : null);
    } else if (action === "reactivate") {
      if (!confirm("ยืนยันการคืนสถานะใช้งานอยู่ให้สมาชิกรายนี้?")) return;
      const res = await callApi("adminReactivate", { password, row });
      finishAction(res, res.ok ? "คืนสถานะเรียบร้อยแล้ว" : null);
    }

    function finishAction(res, successMsg) {
      if (res.ok) {
        showAlert(dashAlert, "success", successMsg);
        loadList();
      } else {
        showAlert(dashAlert, "error", res.error || "ดำเนินการไม่สำเร็จ");
      }
    }
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
});
