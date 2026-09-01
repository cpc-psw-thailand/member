document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("statusForm");
  const alertBox = document.getElementById("alertBox");
  const checkBtn = document.getElementById("checkBtn");
  const resultWrap = document.getElementById("resultWrap");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);
    resultWrap.classList.add("hidden");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const nationalID = document.getElementById("nationalID").value.trim();
    const phone = document.getElementById("phone").value.trim();

    setLoading(checkBtn, true);
    try {
      const res = await callApi("checkStatus", { nationalID, phone });
      if (res.ok) {
        const r = res.result;
        document.getElementById("rcMemberID").textContent = r.memberID || "ยังไม่ออกรหัส";
        const statusEl = document.getElementById("rcStatus");
        statusEl.textContent = r.status;
        statusEl.className = "badge " + statusBadgeClass(r.status);
        document.getElementById("rcName").textContent = r.fullName;
        document.getElementById("rcType").textContent = r.memberType;
        document.getElementById("rcApply").textContent = r.applyDate || "—";
        document.getElementById("rcApprove").textContent = r.approveDate || "—";
        document.getElementById("rcExpire").textContent = r.expireDate || "—";
        document.getElementById("rcNote").textContent = r.note || "—";
        resultWrap.classList.remove("hidden");
      } else {
        showAlert(alertBox, "error", res.error || "ไม่พบข้อมูล");
      }
    } catch (err) {
      showAlert(alertBox, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(checkBtn, false, "ตรวจสอบสถานะ");
    }
  });
});
