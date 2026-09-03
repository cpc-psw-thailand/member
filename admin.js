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

  const addHonoraryBtn = document.getElementById("addHonoraryBtn");
  const honoraryPanel = document.getElementById("honoraryPanel");
  const honoraryForm = document.getElementById("honoraryForm");
  const honoraryBtn = document.getElementById("honoraryBtn");
  const honoraryCancelBtn = document.getElementById("honoraryCancelBtn");

  const detailModal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

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

  // ---- แผงเพิ่มสมาชิกกิตติมศักดิ์ ----
  addHonoraryBtn.addEventListener("click", () => {
    honoraryPanel.classList.toggle("hidden");
  });
  honoraryCancelBtn.addEventListener("click", () => {
    honoraryForm.reset();
    honoraryPanel.classList.add("hidden");
  });

  honoraryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dashAlert = document.getElementById("dashAlert");
    hideAlert(dashAlert);

    if (!honoraryForm.checkValidity()) {
      honoraryForm.reportValidity();
      return;
    }

    const data = {
      title: document.getElementById("hTitle").value.trim(),
      firstName: document.getElementById("hFirstName").value.trim(),
      lastName: document.getElementById("hLastName").value.trim(),
      phone: document.getElementById("hPhone").value.trim(),
      email: document.getElementById("hEmail").value.trim(),
      organization: document.getElementById("hOrganization").value.trim(),
      note: document.getElementById("hNote").value.trim(),
    };

    setLoading(honoraryBtn, true);
    try {
      const res = await callApi("adminAddHonorary", { password: getPassword(), data });
      if (res.ok) {
        showAlert(dashAlert, "success", "เพิ่มสมาชิกกิตติมศักดิ์แล้ว รหัสสมาชิก: " + res.memberID);
        honoraryForm.reset();
        honoraryPanel.classList.add("hidden");
        loadList();
      } else {
        showAlert(dashAlert, "error", res.error || "เพิ่มสมาชิกไม่สำเร็จ");
      }
    } catch (err) {
      showAlert(dashAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(honoraryBtn, false, "เพิ่มสมาชิก");
    }
  });

  // ---- โมดัลรายละเอียด ----
  // ---- โมดัลยืนยัน (แทน confirm()/prompt() ของเบราว์เซอร์) ----
  function showConfirm({ title, message, withReason = false, requireReason = false, reasonLabel = "เหตุผล (ถ้ามี)", confirmLabel = "ยืนยัน", danger = false }) {
    return new Promise((resolve) => {
      const modal = document.getElementById("confirmModal");
      const okBtn = document.getElementById("confirmOkBtn");
      const cancelBtn = document.getElementById("confirmCancelBtn");
      const closeBtn = document.getElementById("confirmCloseBtn");
      const reasonWrap = document.getElementById("confirmReasonWrap");
      const reasonInput = document.getElementById("confirmReasonInput");
      const reasonLabelEl = document.getElementById("confirmReasonLabel");

      document.getElementById("confirmTitle").textContent = title;
      document.getElementById("confirmMessage").textContent = message;
      reasonWrap.classList.toggle("hidden", !withReason);
      if (reasonLabelEl) reasonLabelEl.textContent = reasonLabel;
      reasonInput.value = "";
      okBtn.textContent = confirmLabel;
      okBtn.className = "btn " + (danger ? "btn-danger" : "btn-primary");
      modal.classList.remove("hidden");

      function cleanup(result) {
        modal.classList.add("hidden");
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        closeBtn.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdrop);
        resolve(result);
      }
      function onOk() {
        if (withReason && requireReason && !reasonInput.value.trim()) {
          reasonInput.focus();
          reasonInput.style.borderColor = "var(--red)";
          return;
        }
        cleanup(withReason ? { confirmed: true, reason: reasonInput.value.trim() } : { confirmed: true });
      }
      function onCancel() {
        cleanup({ confirmed: false });
      }
      function onBackdrop(e) {
        if (e.target === modal) onCancel();
      }
      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      closeBtn.addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdrop);
    });
  }

  function driveIdFromValue(v) {
    if (!v) return "";
    const s = String(v);
    // ค่าที่เก็บอาจเป็น Drive File ID ตรง ๆ (แบบใหม่) หรือเป็น URL เต็ม (แถวเก่าก่อนอัปเดต)
    let m = s.match(/[?&]id=([^&]+)/);
    if (m) return m[1];
    m = s.match(/\/d\/([^/]+)/);
    if (m) return m[1];
    return s; // สมมติว่าเป็น ID อยู่แล้ว
  }

  function drivePhotoSrc(v) {
    const id = driveIdFromValue(v);
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1000` : "";
  }

  function drivePhotoLink(v) {
    const id = driveIdFromValue(v);
    return id ? `https://drive.google.com/file/d/${id}/view` : "";
  }

  function closeModal() {
    detailModal.classList.add("hidden");
  }
  modalCloseBtn.addEventListener("click", closeModal);
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  function openDetail(m) {
    modalBody.innerHTML = renderDetail(m);
    detailModal.classList.remove("hidden");
  }

  function detailItem(label, value) {
    return `
      <div class="detail-item">
        <div class="dt-label">${escapeHtml(label)}</div>
        <div class="dt-value">${escapeHtml(value) || "—"}</div>
      </div>
    `;
  }

  function renderDetail(m) {
    let html = `
      <div class="detail-section">
        <h4>ข้อมูลสมาชิก</h4>
        <div class="detail-grid">
          ${detailItem("รหัสสมาชิก", m.memberID || "ยังไม่ออกรหัส")}
          ${detailItem("สถานะ", m.status)}
          ${detailItem("ประเภทสมาชิก", m.memberType)}
          ${detailItem("วันที่สมัคร", m.applyDate)}
          ${detailItem("วันที่อนุมัติ", m.approveDate)}
          ${detailItem("วันหมดอายุ", m.expireDate)}
        </div>
      </div>

      <div class="detail-section">
        <h4>ข้อมูลส่วนบุคคล</h4>
        <div class="detail-grid">
          ${detailItem("ชื่อ-นามสกุล", (m.title + " " + m.firstName + " " + m.lastName).trim())}
          ${detailItem("เลขบัตรประชาชน", m.nationalID)}
          ${detailItem("วันเดือนปีเกิด", m.birthDate)}
          ${detailItem("เบอร์โทรศัพท์", m.phone)}
          ${detailItem("อีเมล", m.email)}
        </div>
        <div class="detail-grid" style="margin-top:10px">
          ${detailItem("ที่อยู่", m.address)}
          ${detailItem("ตำบล/แขวง", m.subdistrict)}
          ${detailItem("อำเภอ/เขต", m.district)}
          ${detailItem("จังหวัด", m.province)}
          ${detailItem("รหัสไปรษณีย์", m.zipcode)}
        </div>
      </div>

      <div class="detail-section">
        <h4>ข้อมูลวิชาชีพ</h4>
        <div class="detail-grid">
          ${detailItem("วิชาชีพ", m.profession)}
          ${detailItem("เลขที่ใบประกอบโรคศิลปะ", m.licenseNo)}
          ${detailItem("หน่วยงานต้นสังกัด", m.organization)}
          ${detailItem("วุฒิการศึกษา", m.education)}
        </div>
        ${m.degreeDocURL ? `
          <div style="margin-top:12px">
            <div class="dt-label" style="margin-bottom:6px">ใบปริญญา/หนังสือรับรองวุฒิการศึกษา</div>
            <img class="detail-photo" src="${escapeHtml(drivePhotoSrc(m.degreeDocURL))}" alt="เอกสารรับรองวุฒิการศึกษา" loading="lazy" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('p'),{className:'muted',textContent:'ไม่สามารถแสดงตัวอย่างเอกสารได้ (อาจเป็นไฟล์ PDF) กรุณากดลิงก์ด้านล่างเพื่อเปิดดู'}))">
            <div style="margin-top:6px">
              <a href="${escapeHtml(drivePhotoLink(m.degreeDocURL))}" target="_blank" rel="noopener">เปิดเอกสารในแท็บใหม่</a>
            </div>
          </div>
        ` : ""}
      </div>
    `;

    if (m.cpcRole || m.cpcRegNo || m.cpcCardPhotoURL) {
      html += `
        <div class="detail-section">
          <h4>ข้อมูลผู้ทำหน้าที่นักจิตวิทยาและนักสังคมสงเคราะห์ ป.วิ.อาญา</h4>
          <div class="detail-grid">
            ${detailItem("ตำแหน่ง", m.cpcRole)}
            ${detailItem("เลขที่ทะเบียน ป.วิ.อาญา", m.cpcRegNo)}
            ${detailItem("ประสบการณ์ทำงาน (ปี)", m.cpcExperienceYears)}
          </div>
          ${m.cpcCardPhotoURL ? `
            <div style="margin-top:12px">
              <div class="dt-label" style="margin-bottom:6px">รูปบัตรผู้ทำหน้าที่ฯ</div>
              <img class="detail-photo" src="${escapeHtml(drivePhotoSrc(m.cpcCardPhotoURL))}" alt="รูปบัตรผู้ทำหน้าที่ฯ" loading="lazy" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('p'),{className:'muted',textContent:'ไม่สามารถแสดงรูปตัวอย่างได้ กรุณากดลิงก์ด้านล่างเพื่อเปิดดูรูป'}))">
              <div style="margin-top:6px">
                <a href="${escapeHtml(drivePhotoLink(m.cpcCardPhotoURL))}" target="_blank" rel="noopener">เปิดรูปในแท็บใหม่</a>
              </div>
            </div>
          ` : ""}
        </div>
      `;
    }

    if (m.infoRequestMessage) {
      html += `
        <div class="detail-section">
          <h4>คำขอเอกสาร/ข้อมูลเพิ่มเติมจากเจ้าหน้าที่</h4>
          <div class="detail-grid">
            ${detailItem("วันที่ขอ", m.infoRequestDate)}
          </div>
          <p style="margin:10px 0 0;white-space:pre-wrap">${escapeHtml(m.infoRequestMessage)}</p>
          ${m.additionalDocURL ? `
            <div style="margin-top:12px">
              <div class="dt-label" style="margin-bottom:6px">เอกสารเพิ่มเติมที่ผู้สมัครแนบกลับมา</div>
              <img class="detail-photo" src="${escapeHtml(drivePhotoSrc(m.additionalDocURL))}" alt="เอกสารเพิ่มเติม" loading="lazy" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('p'),{className:'muted',textContent:'ไม่สามารถแสดงตัวอย่างเอกสารได้ (อาจเป็นไฟล์ PDF) กรุณากดลิงก์ด้านล่างเพื่อเปิดดู'}))">
              <div style="margin-top:6px">
                <a href="${escapeHtml(drivePhotoLink(m.additionalDocURL))}" target="_blank" rel="noopener">เปิดเอกสารในแท็บใหม่</a>
              </div>
            </div>
          ` : `<p class="muted" style="margin:10px 0 0;font-size:.85rem">ผู้สมัครยังไม่ได้ส่งข้อมูลกลับมา</p>`}
        </div>
      `;
    }

    if (m.note) {
      html += `
        <div class="detail-section">
          <h4>หมายเหตุ</h4>
          <p style="margin:0;white-space:pre-wrap">${escapeHtml(m.note)}</p>
        </div>
      `;
    }

    return html;
  }

  async function loadList() {
    const dashAlert = document.getElementById("dashAlert");
    hideAlert(dashAlert);
    const tbody = document.getElementById("memberTableBody");
    tbody.innerHTML = '<tr><td colspan="8" class="center muted">กำลังโหลดข้อมูล...</td></tr>';

    try {
      const res = await callApi("adminList", { password: getPassword() });
      if (res.ok) {
        currentList = res.list.reverse(); // ล่าสุดขึ้นก่อน
        renderStats();
        renderProfessionStats();
        renderTable();
      } else {
        showAlert(dashAlert, "error", res.error || "โหลดข้อมูลไม่สำเร็จ");
        tbody.innerHTML = '<tr><td colspan="8" class="center muted">—</td></tr>';
      }
    } catch (err) {
      showAlert(dashAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    }
  }

  function renderStats() {
    const counts = {
      total: currentList.length,
      pending: 0, needInfo: 0, active: 0, suspended: 0, expired: 0, rejected: 0,
    };
    currentList.forEach((m) => {
      if (m.status === "รอตรวจสอบ") counts.pending++;
      else if (m.status === "รอข้อมูลเพิ่มเติม") counts.needInfo++;
      else if (m.status === "ใช้งานอยู่") counts.active++;
      else if (m.status === "ระงับ") counts.suspended++;
      else if (m.status === "หมดอายุ") counts.expired++;
      else if (m.status === "ไม่อนุมัติ") counts.rejected++;
    });
    document.getElementById("statTotal").textContent = counts.total;
    document.getElementById("statPending").textContent = counts.pending;
    document.getElementById("statNeedInfo").textContent = counts.needInfo;
    document.getElementById("statActive").textContent = counts.active;
    document.getElementById("statSuspended").textContent = counts.suspended;
    document.getElementById("statExpired").textContent = counts.expired;
    document.getElementById("statRejected").textContent = counts.rejected;
  }

  function renderProfessionStats() {
    const counts = { social: 0, psych: 0, other: 0 };
    currentList.forEach((m) => {
      if (m.profession === "นักสังคมสงเคราะห์") counts.social++;
      else if (m.profession === "นักจิตวิทยา") counts.psych++;
      else counts.other++;
    });
    const total = counts.social + counts.psych + counts.other;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

    document.getElementById("professionSocialCount").textContent = counts.social;
    document.getElementById("professionPsychCount").textContent = counts.psych;
    document.getElementById("professionOtherCount").textContent = counts.other;
    document.getElementById("professionSocialPct").textContent = pct(counts.social) + "%";
    document.getElementById("professionPsychPct").textContent = pct(counts.psych) + "%";
    document.getElementById("professionOtherPct").textContent = pct(counts.other) + "%";

    document.getElementById("professionBarSocial").style.width = pct(counts.social) + "%";
    document.getElementById("professionBarPsych").style.width = pct(counts.psych) + "%";
    document.getElementById("professionBarOther").style.width = pct(counts.other) + "%";

    document.getElementById("professionOtherItem").classList.toggle("hidden", counts.other === 0);
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
      tbody.innerHTML = '<tr><td colspan="8" class="center muted">ไม่พบข้อมูล</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((m) => `
      <tr data-row="${m.row}">
        <td>${m.memberID || "—"}</td>
        <td><a href="#" data-action="detail" style="font-weight:600">${escapeHtml(m.title + " " + m.firstName + " " + m.lastName)}</a></td>
        <td>${escapeHtml(m.profession || "—")}</td>
        <td>${escapeHtml(m.memberType || "")}</td>
        <td>${cpcRegCell(m)}</td>
        <td><span class="badge ${statusBadgeClass(m.status)}">${m.status}</span></td>
        <td>${m.applyDate}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-sm" data-action="detail">ดูรายละเอียด</button>
            ${actionButtons(m)}
          </div>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll('[data-action="detail"]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const row = Number(el.closest("tr").dataset.row);
        const member = currentList.find((m) => m.row === row);
        if (member) openDetail(member);
      });
    });

    tbody.querySelectorAll("[data-action]:not([data-action='detail'])").forEach((btn) => {
      btn.addEventListener("click", () => handleAction(btn.dataset.action, Number(btn.closest("tr").dataset.row)));
    });
  }

  function cpcRegCell(m) {
    if (!m.cpcRegNo && !m.cpcCardPhotoURL) return "—";
    const regText = escapeHtml(m.cpcRegNo || "—");
    const photoLink = m.cpcCardPhotoURL
      ? ` <a href="${escapeHtml(drivePhotoLink(m.cpcCardPhotoURL))}" target="_blank" rel="noopener">(ดูรูปบัตร)</a>`
      : "";
    return regText + photoLink;
  }

  function actionButtons(m) {
    if (m.status === "รอตรวจสอบ") {
      return `
        <button class="btn btn-gold btn-sm" data-action="approve">อนุมัติ</button>
        <button class="btn btn-outline btn-sm" data-action="requestInfo">ขอเอกสารเพิ่มเติม</button>
        <button class="btn btn-danger btn-sm" data-action="reject">ไม่อนุมัติ</button>
      `;
    }
    if (m.status === "รอข้อมูลเพิ่มเติม") {
      return `<span class="muted" style="font-size:.82rem">รอผู้สมัครส่งข้อมูลกลับ</span>`;
    }
    if (m.status === "ใช้งานอยู่") {
      return `<button class="btn btn-outline btn-sm" data-action="suspend">ระงับ</button>`;
    }
    if (m.status === "ระงับ") {
      return `<button class="btn btn-outline btn-sm" data-action="reactivate">คืนสถานะ</button>`;
    }
    return "";
  }

  async function handleAction(action, row) {
    const dashAlert = document.getElementById("dashAlert");
    hideAlert(dashAlert);
    const password = getPassword();

    if (action === "approve") {
      const { confirmed } = await showConfirm({
        title: "อนุมัติสมาชิก",
        message: "ยืนยันการอนุมัติสมาชิกรายนี้ และออกรหัสสมาชิก? ระบบจะส่งอีเมลแจ้งผลพร้อมลิงก์ดูบัตรสมาชิกให้อัตโนมัติ",
        confirmLabel: "อนุมัติ",
      });
      if (!confirmed) return;
      const res = await callApi("adminApprove", { password, row });
      finishAction(res, res.ok ? ("อนุมัติสำเร็จ รหัสสมาชิก: " + res.memberID) : null);
    } else if (action === "reject") {
      const { confirmed, reason } = await showConfirm({
        title: "ไม่อนุมัติใบสมัคร",
        message: "ระบุเหตุผลที่ไม่อนุมัติ (ถ้ามี) แล้วกดยืนยัน",
        withReason: true,
        confirmLabel: "ยืนยันไม่อนุมัติ",
        danger: true,
      });
      if (!confirmed) return;
      const res = await callApi("adminReject", { password, row, reason });
      finishAction(res, res.ok ? "บันทึกผลไม่อนุมัติแล้ว" : null);
    } else if (action === "requestInfo") {
      const { confirmed, reason } = await showConfirm({
        title: "ขอเอกสาร/ข้อมูลเพิ่มเติม",
        message: "พิมพ์ข้อความแจ้งผู้สมัครว่าต้องการเอกสารหรือข้อมูลอะไรเพิ่มเติม (ระบบจะส่งอีเมลแจ้งพร้อมลิงก์ให้แก้ไข/แนบไฟล์)",
        withReason: true,
        requireReason: true,
        reasonLabel: "ข้อความถึงผู้สมัคร",
        confirmLabel: "ส่งคำขอ",
      });
      if (!confirmed) return;
      const res = await callApi("adminRequestInfo", { password, row, message: reason });
      finishAction(res, res.ok ? "ส่งคำขอเอกสารเพิ่มเติมแล้ว" : null);
    } else if (action === "suspend") {
      const { confirmed } = await showConfirm({
        title: "ระงับสมาชิกภาพ",
        message: "ยืนยันการระงับสมาชิกภาพรายนี้?",
        confirmLabel: "ระงับ",
        danger: true,
      });
      if (!confirmed) return;
      const res = await callApi("adminSuspend", { password, row });
      finishAction(res, res.ok ? "ระงับสมาชิกภาพแล้ว" : null);
    } else if (action === "reactivate") {
      const { confirmed } = await showConfirm({
        title: "คืนสถานะสมาชิก",
        message: "ยืนยันการคืนสถานะใช้งานอยู่ให้สมาชิกรายนี้?",
        confirmLabel: "คืนสถานะ",
      });
      if (!confirmed) return;
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
