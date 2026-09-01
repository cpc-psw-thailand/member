document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const alertBox = document.getElementById("alertBox");
  const submitBtn = document.getElementById("submitBtn");
  const titleSelect = document.getElementById("title");
  const titleOtherField = document.getElementById("titleOtherField");
  const titleOtherInput = document.getElementById("titleOther");

  function syncTitleOther() {
    const isOther = titleSelect.value === "อื่น ๆ";
    titleOtherField.classList.toggle("hidden", !isOther);
    titleOtherInput.required = isOther;
    if (!isOther) titleOtherInput.value = "";
  }
  titleSelect.addEventListener("change", syncTitleOther);
  syncTitleOther();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const nationalID = document.getElementById("nationalID").value.trim();
    if (!/^[0-9]{13}$/.test(nationalID)) {
      showAlert(alertBox, "error", "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก");
      return;
    }

    const titleValue = titleSelect.value === "อื่น ๆ"
      ? titleOtherInput.value.trim()
      : titleSelect.value;

    const data = {
      title: titleValue,
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      nationalID: nationalID,
      birthDate: document.getElementById("birthDate").value,
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      address: document.getElementById("address").value.trim(),
      profession: document.getElementById("profession").value,
      licenseNo: document.getElementById("licenseNo").value.trim(),
      organization: document.getElementById("organization").value.trim(),
      education: document.getElementById("education").value.trim(),
      experienceYears: document.getElementById("experienceYears").value,
      memberType: form.querySelector('input[name="memberType"]:checked').value,
      consent: document.getElementById("consent").checked,
    };

    setLoading(submitBtn, true);
    try {
      const res = await callApi("register", { data });
      if (res.ok) {
        form.reset();
        syncTitleOther();
        showAlert(alertBox, "success", res.message || "ส่งใบสมัครเรียบร้อยแล้ว");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        showAlert(alertBox, "error", res.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch (err) {
      showAlert(alertBox, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(submitBtn, false, "ส่งใบสมัคร");
    }
  });
});
