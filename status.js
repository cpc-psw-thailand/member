let lastResult = null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("statusForm");
  const alertBox = document.getElementById("alertBox");
  const checkBtn = document.getElementById("checkBtn");
  const resultWrap = document.getElementById("resultWrap");
  const ecardWrap = document.getElementById("ecardWrap");
  const plainResultWrap = document.getElementById("plainResultWrap");
  const renewWrap = document.getElementById("renewWrap");
  const renewBtn = document.getElementById("renewBtn");
  const renewAlert = document.getElementById("renewAlert");
  const saveCardBtn = document.getElementById("saveCardBtn");

  async function runCheck(nationalID, phone) {
    hideAlert(alertBox);
    resultWrap.classList.add("hidden");
    hideAlert(renewAlert);

    setLoading(checkBtn, true);
    try {
      const res = await callApi("checkStatus", { nationalID, phone });
      if (res.ok) {
        lastResult = { ...res.result, nationalID, phone };
        renderResult(lastResult);
        resultWrap.classList.remove("hidden");
      } else {
        showAlert(alertBox, "error", res.error || "ไม่พบข้อมูล");
      }
    } catch (err) {
      showAlert(alertBox, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(checkBtn, false, "ตรวจสอบสถานะ");
    }
  }

  function renderResult(r) {
    const isActive = r.status === "ใช้งานอยู่";
    const isExpired = r.status === "หมดอายุ";

    ecardWrap.classList.toggle("hidden", !isActive);
    plainResultWrap.classList.toggle("hidden", isActive);

    if (isActive) {
      document.getElementById("ecName").textContent = r.fullName;
      document.getElementById("ecType").textContent = r.memberType;
      document.getElementById("ecMemberID").textContent = r.memberID || "—";
      document.getElementById("ecExpire").textContent = r.expireDate || "—";
    } else {
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
      renewWrap.classList.toggle("hidden", !isExpired);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const nationalID = document.getElementById("nationalID").value.trim();
    const phone = document.getElementById("phone").value.trim();
    await runCheck(nationalID, phone);
  });

  renewBtn.addEventListener("click", async () => {
    if (!lastResult) return;
    hideAlert(renewAlert);
    setLoading(renewBtn, true);
    try {
      const res = await callApi("renewMembership", {
        nationalID: lastResult.nationalID,
        phone: lastResult.phone,
      });
      if (res.ok) {
        showAlert(renewAlert, "success", res.message || "ส่งคำขอต่ออายุเรียบร้อยแล้ว");
        renewWrap.querySelector(".alert-info")?.classList.add("hidden");
        renewBtn.classList.add("hidden");
        // อัปเดตสถานะที่แสดงเป็น "รอตรวจสอบ" ทันทีโดยไม่ต้องค้นหาใหม่
        document.getElementById("rcStatus").textContent = "รอตรวจสอบ";
        document.getElementById("rcStatus").className = "badge " + statusBadgeClass("รอตรวจสอบ");
      } else {
        showAlert(renewAlert, "error", res.error || "ส่งคำขอต่ออายุไม่สำเร็จ");
      }
    } catch (err) {
      showAlert(renewAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(renewBtn, false, "ต่ออายุสมาชิกภาพ");
    }
  });

  // รองรับลิงก์ตรงจากอีเมลแจ้งผลอนุมัติ (?nid=...&ph=...) — กรอกให้และค้นหาอัตโนมัติ
  const params = new URLSearchParams(window.location.search);
  const nidParam = params.get("nid");
  const phParam = params.get("ph");
  if (nidParam && phParam) {
    document.getElementById("nationalID").value = nidParam;
    document.getElementById("phone").value = phParam;
    runCheck(nidParam, phParam);
  }

  // ---- บันทึกภาพบัตรสมาชิกเป็นไฟล์รูป ----
  if (saveCardBtn) {
    saveCardBtn.addEventListener("click", async () => {
      const cardEl = document.querySelector(".member-ecard");
      if (!cardEl || typeof html2canvas === "undefined") return;

      setLoading(saveCardBtn, true);
      try {
        const canvas = await html2canvas(cardEl, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
        });
        const link = document.createElement("a");
        const idPart = (lastResult && lastResult.memberID ? lastResult.memberID : "member").replace(/[^a-zA-Z0-9-]/g, "");
        link.download = "CPC-PSW-" + idPart + ".png";
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        alert("บันทึกภาพบัตรไม่สำเร็จ กรุณาลองใหม่ หรือใช้วิธีแคปหน้าจอแทน");
      } finally {
        setLoading(saveCardBtn, false, "บันทึกภาพบัตรสมาชิก");
      }
    });
  }
});
