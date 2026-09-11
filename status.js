let lastResult = null;       // ผลลัพธ์แบบปิดบังข้อมูล (จากการค้นหาปกติ ไม่ต้องยืนยันตัวตน)
let verifiedToken = null;    // token หลังยืนยัน OTP สำเร็จ (สำหรับการกระทำที่ต้องยืนยันตัวตน)
let verifiedFullResult = null; // ข้อมูลแบบเต็ม (ไม่ปิดบัง) ที่ได้หลังยืนยัน OTP สำเร็จ
let pendingGateAction = null; // งานที่รอทำต่อหลังยืนยัน OTP สำเร็จ
let AI_ADDRESS_DATA = [];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const ecMaskedContact = document.getElementById("ecMaskedContact");

  const otpWrap = document.getElementById("otpWrap");
  const otpGateTitle = document.getElementById("otpGateTitle");
  const otpForm = document.getElementById("otpForm");
  const otpCode = document.getElementById("otpCode");
  const otpAlert = document.getElementById("otpAlert");
  const otpVerifyBtn = document.getElementById("otpVerifyBtn");
  const otpResendBtn = document.getElementById("otpResendBtn");
  const otpCancelBtn = document.getElementById("otpCancelBtn");
  const otpSentMessage = document.getElementById("otpSentMessage");

  const upgradeWrap = document.getElementById("upgradeWrap");
  const upgradeForm = document.getElementById("upgradeForm");
  const upgradeAlert = document.getElementById("upgradeAlert");
  const upgradeBtn = document.getElementById("upgradeBtn");

  const infoRequestBanner = document.getElementById("infoRequestBanner");
  const infoRequestMessageText = document.getElementById("infoRequestMessageText");
  const editLockedPanel = document.getElementById("editLockedPanel");
  const editFormPanel = document.getElementById("editFormPanel");
  const unlockEditBtn = document.getElementById("unlockEditBtn");
  const additionalInfoForm = document.getElementById("additionalInfoForm");
  const additionalInfoAlert = document.getElementById("additionalInfoAlert");
  const additionalInfoBtn = document.getElementById("additionalInfoBtn");
  const aiCpcFieldset = document.getElementById("aiCpcFieldset");
  const aiDoc = document.getElementById("aiDoc");
  const aiDocLabel = document.getElementById("aiDocLabel");

  function resetSelect(select, placeholder) {
    select.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    select.appendChild(opt);
  }

  async function runCheck(nationalID, phone) {
    hideAlert(alertBox);
    resultWrap.classList.add("hidden");
    hideAlert(renewAlert);
    hideAlert(additionalInfoAlert);

    verifiedToken = null;
    verifiedFullResult = null;
    pendingGateAction = null;
    otpWrap.classList.add("hidden");

    setLoading(checkBtn, true);
    try {
      const res = await callApi("checkStatus", { nationalID, phone });
      if (res.ok) {
        lastResult = { ...res.result, nationalID, phone };
        await renderResult(lastResult);
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

  async function renderResult(r) {
    const isActive = r.status === "ใช้งานอยู่";
    const isExpired = r.status === "หมดอายุ";
    const needsInfo = r.status === "รอข้อมูลเพิ่มเติม";

    ecardWrap.classList.toggle("hidden", !isActive);
    plainResultWrap.classList.toggle("hidden", isActive);

    if (isActive) {
      const cardEl = document.getElementById("memberEcard");
      cardEl.classList.remove("theme-samanya", "theme-wisamanya", "theme-honorary");
      if (r.memberType === "สมาชิกวิสามัญ") {
        cardEl.classList.add("theme-wisamanya");
      } else if (r.memberType === "สมาชิกกิตติมศักดิ์") {
        cardEl.classList.add("theme-honorary");
      } else {
        cardEl.classList.add("theme-samanya");
      }
      document.getElementById("ecName").textContent = r.fullName;
      document.getElementById("ecType").textContent = r.memberType;
      document.getElementById("ecMemberID").textContent = r.memberID || "—";
      document.getElementById("ecExpire").textContent = r.expireDate || "—";
      ecMaskedContact.textContent = "เบอร์โทรศัพท์: " + (r.phone || "—") + " · อีเมล: " + (r.email || "—");

      const isWisamanya = r.memberType === "สมาชิกวิสามัญ";
      upgradeWrap.classList.toggle("hidden", !isWisamanya);
      if (isWisamanya) {
        upgradeForm.reset();
        hideAlert(upgradeAlert);
        upgradeBtn.disabled = false;
      }
    } else {
      document.getElementById("rcMemberID").textContent = r.memberID || "ยังไม่ออกรหัส";
      const statusEl = document.getElementById("rcStatus");
      statusEl.textContent = r.status;
      statusEl.className = "badge " + statusBadgeClass(r.status);
      document.getElementById("rcName").textContent = r.fullName;
      document.getElementById("rcType").textContent = r.memberType;
      document.getElementById("rcPhone").textContent = r.phone || "—";
      document.getElementById("rcEmail").textContent = r.email || "—";
      document.getElementById("rcApply").textContent = r.applyDate || "—";
      document.getElementById("rcApprove").textContent = r.approveDate || "—";
      document.getElementById("rcExpire").textContent = r.expireDate || "—";
      document.getElementById("rcNote").textContent = r.note || "—";
      renewWrap.classList.toggle("hidden", !isExpired);
    }

    infoRequestBanner.classList.toggle("hidden", !needsInfo);
    if (needsInfo) {
      infoRequestMessageText.textContent = r.infoRequestMessage || "";
    }
    editLockedPanel.classList.remove("hidden");
    editFormPanel.classList.add("hidden");
  }

  function ensureVerified(title, callback) {
    if (verifiedToken) {
      callback();
      return;
    }
    pendingGateAction = callback;
    otpGateTitle.textContent = title;
    otpSentMessage.textContent = "กำลังส่งรหัสยืนยันไปยังอีเมลที่ลงทะเบียนไว้...";
    otpCode.value = "";
    hideAlert(otpAlert);
    otpWrap.classList.remove("hidden");
    otpWrap.scrollIntoView({ behavior: "smooth", block: "start" });
    requestOtpForGate();
  }

  async function requestOtpForGate() {
    if (!lastResult) return;
    try {
      const res = await callApi("requestOtp", {
        nationalID: lastResult.nationalID,
        phone: lastResult.phone,
      });
      if (res.ok) {
        otpSentMessage.textContent = res.message || "ส่งรหัสยืนยันแล้ว กรุณาตรวจสอบอีเมล";
      } else {
        showAlert(otpAlert, "error", res.error || "ขอรหัสยืนยันไม่สำเร็จ");
      }
    } catch (err) {
      showAlert(otpAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    }
  }

  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!otpForm.checkValidity()) {
      otpForm.reportValidity();
      return;
    }
    hideAlert(otpAlert);
    setLoading(otpVerifyBtn, true);
    try {
      const res = await callApi("verifyOtp", {
        nationalID: lastResult.nationalID,
        phone: lastResult.phone,
        otp: otpCode.value.trim(),
      });
      if (res.ok) {
        verifiedToken = res.token;
        verifiedFullResult = { ...res.result, nationalID: lastResult.nationalID, phone: lastResult.phone, token: res.token };
        otpWrap.classList.add("hidden");
        const cb = pendingGateAction;
        pendingGateAction = null;
        if (cb) await cb();
      } else {
        showAlert(otpAlert, "error", res.error || "ยืนยันรหัสไม่สำเร็จ");
      }
    } catch (err) {
      showAlert(otpAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(otpVerifyBtn, false, "ยืนยันรหัส");
    }
  });

  otpResendBtn.addEventListener("click", async () => {
    hideAlert(otpAlert);
    setLoading(otpResendBtn, true);
    try {
      await requestOtpForGate();
    } finally {
      setLoading(otpResendBtn, false, "ขอรหัสใหม่");
    }
  });

  otpCancelBtn.addEventListener("click", () => {
    otpWrap.classList.add("hidden");
    pendingGateAction = null;
    hideAlert(otpAlert);
  });

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

  unlockEditBtn.addEventListener("click", () => {
    ensureVerified("ยืนยันตัวตนเพื่อแก้ไขข้อมูล", async () => {
      editLockedPanel.classList.add("hidden");
      editFormPanel.classList.remove("hidden");
      await prefillEditForm(verifiedFullResult);
      editFormPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  renewBtn.addEventListener("click", () => {
    ensureVerified("ยืนยันตัวตนเพื่อต่ออายุสมาชิกภาพ", async () => {
      hideAlert(renewAlert);
      setLoading(renewBtn, true);
      try {
        const res = await callApi("renewMembership", {
          nationalID: lastResult.nationalID,
          phone: lastResult.phone,
          token: verifiedToken,
        });
        if (res.ok) {
          showAlert(renewAlert, "success", res.message || "ส่งคำขอต่ออายุเรียบร้อยแล้ว");
          const infoAlert = renewWrap.querySelector(".alert-info");
          if (infoAlert) infoAlert.classList.add("hidden");
          renewBtn.classList.add("hidden");
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
  });

  const aiTitleSelect = document.getElementById("aiTitle");
  const aiTitleOtherField = document.getElementById("aiTitleOtherField");
  const aiTitleOtherInput = document.getElementById("aiTitleOther");

  function syncTitleOther() {
    const isOther = aiTitleSelect.value === "อื่น ๆ";
    aiTitleOtherField.classList.toggle("hidden", !isOther);
  }
  aiTitleSelect.addEventListener("change", syncTitleOther);

  upgradeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(upgradeAlert);

    if (!upgradeForm.checkValidity()) {
      upgradeForm.reportValidity();
      return;
    }
    if (!lastResult) return;

    const fileInput = document.getElementById("upCardPhoto");
    const file = fileInput.files[0];
    if (!file) {
      showAlert(upgradeAlert, "error", "กรุณาแนบรูปบัตรผู้ทำหน้าที่ฯ");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert(upgradeAlert, "error", "ไฟล์รูปบัตรผู้ทำหน้าที่ฯ ต้องมีขนาดไม่เกิน 5 MB");
      return;
    }

    let cpcCardPhotoBase64 = "";
    let cpcCardPhotoName = "";
    try {
      cpcCardPhotoBase64 = await fileToBase64(file);
      cpcCardPhotoName = file.name;
    } catch (err) {
      showAlert(upgradeAlert, "error", "อ่านไฟล์รูปภาพไม่สำเร็จ กรุณาลองใหม่");
      return;
    }

    const data = {
      cpcRole: document.getElementById("upRole").value,
      cpcRegNo: document.getElementById("upRegNo").value.trim(),
      cpcExperienceYears: document.getElementById("upExperienceYears").value,
      cpcCardPhotoBase64: cpcCardPhotoBase64,
      cpcCardPhotoName: cpcCardPhotoName,
    };

    ensureVerified("ยืนยันตัวตนเพื่อขอเปลี่ยนประเภทสมาชิก", async () => {
      setLoading(upgradeBtn, true);
      try {
        const res = await callApi("requestUpgrade", {
          nationalID: lastResult.nationalID,
          phone: lastResult.phone,
          token: verifiedToken,
          data,
        });
        if (res.ok) {
          showAlert(upgradeAlert, "success", res.message || "ส่งคำขอเรียบร้อยแล้ว");
          upgradeForm.reset();
          upgradeBtn.disabled = true;
        } else {
          showAlert(upgradeAlert, "error", res.error || "ส่งคำขอไม่สำเร็จ");
        }
      } catch (err) {
        showAlert(upgradeAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
      } finally {
        setLoading(upgradeBtn, false, "ส่งคำขอเปลี่ยนประเภทสมาชิก");
      }
    });
  });

  const aiProvince = document.getElementById("aiProvince");
  const aiDistrict = document.getElementById("aiDistrict");
  const aiSubdistrict = document.getElementById("aiSubdistrict");
  const aiZipcode = document.getElementById("aiZipcode");

  async function loadAddressData() {
    if (AI_ADDRESS_DATA.length) return;
    try {
      const res = await fetch("thai-address-data.json");
      AI_ADDRESS_DATA = await res.json();
      AI_ADDRESS_DATA.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.n;
        aiProvince.appendChild(opt);
      });
    } catch (err) {
      console.error("โหลดข้อมูลจังหวัด/อำเภอ/ตำบลไม่สำเร็จ", err);
    }
  }

  function populateDistrictOptions(province) {
    resetSelect(aiDistrict, "— เลือกอำเภอ/เขต —");
    resetSelect(aiSubdistrict, "— เลือกอำเภอก่อน —");
    aiDistrict.disabled = true;
    aiSubdistrict.disabled = true;
    if (!province) return;
    aiDistrict.disabled = false;
    province.d.forEach((dist) => {
      const opt = document.createElement("option");
      opt.value = dist.id;
      opt.textContent = dist.n;
      aiDistrict.appendChild(opt);
    });
  }

  function populateSubdistrictOptions(district) {
    resetSelect(aiSubdistrict, "— เลือกตำบล/แขวง —");
    aiSubdistrict.disabled = true;
    if (!district) return;
    aiSubdistrict.disabled = false;
    district.t.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.n;
      opt.dataset.zip = t.z;
      aiSubdistrict.appendChild(opt);
    });
  }

  aiProvince.addEventListener("change", () => {
    aiZipcode.value = "";
    const province = AI_ADDRESS_DATA.find((p) => String(p.id) === aiProvince.value);
    populateDistrictOptions(province);
  });

  aiDistrict.addEventListener("change", () => {
    aiZipcode.value = "";
    const province = AI_ADDRESS_DATA.find((p) => String(p.id) === aiProvince.value);
    const district = province && province.d.find((d) => String(d.id) === aiDistrict.value);
    populateSubdistrictOptions(district);
  });

  aiSubdistrict.addEventListener("change", () => {
    const selected = aiSubdistrict.selectedOptions[0];
    aiZipcode.value = selected && selected.dataset.zip ? selected.dataset.zip : "";
  });

  async function prefillEditForm(r) {
    additionalInfoForm.reset();
    hideAlert(additionalInfoAlert);
    additionalInfoBtn.disabled = false;

    aiCpcFieldset.classList.toggle("hidden", r.memberType !== "สมาชิกสามัญ");

    const needsInfo = r.status === "รอข้อมูลเพิ่มเติม";
    aiDoc.required = needsInfo;
    aiDocLabel.innerHTML = needsInfo
      ? 'แนบเอกสารเพิ่มเติมตามที่เจ้าหน้าที่ร้องขอ<span class="req">*</span>'
      : "แนบเอกสารเพิ่มเติม (ถ้ามี)";

    const titleSelect = document.getElementById("aiTitle");
    const knownTitles = ["นาย", "นาง", "นางสาว"];
    if (r.title && knownTitles.indexOf(r.title) !== -1) {
      titleSelect.value = r.title;
    } else if (r.title) {
      titleSelect.value = "อื่น ๆ";
      document.getElementById("aiTitleOther").value = r.title;
    }
    syncTitleOther();

    document.getElementById("aiFirstName").value = r.firstName || "";
    document.getElementById("aiLastName").value = r.lastName || "";
    document.getElementById("aiBirthDate").value = r.birthDate || "";
    document.getElementById("aiPhone").value = r.phone || "";
    document.getElementById("aiEmail").value = r.email || "";
    document.getElementById("aiAddress").value = r.address || "";
    document.getElementById("aiProfession").value = r.profession || "";
    document.getElementById("aiLicenseNo").value = r.licenseNo || "";
    document.getElementById("aiOrganization").value = r.organization || "";
    document.getElementById("aiEducation").value = r.education || "";
    document.getElementById("aiCpcRegNo").value = r.cpcRegNo || "";
    document.getElementById("aiCpcExperienceYears").value = r.cpcExperienceYears || "";

    await loadAddressData();
    resetSelect(aiDistrict, "— เลือกจังหวัดก่อน —");
    resetSelect(aiSubdistrict, "— เลือกอำเภอก่อน —");
    aiDistrict.disabled = true;
    aiSubdistrict.disabled = true;
    aiZipcode.value = "";
    aiProvince.value = "";

    if (r.province) {
      const province = AI_ADDRESS_DATA.find((p) => p.n === r.province);
      if (province) {
        aiProvince.value = String(province.id);
        populateDistrictOptions(province);
        if (r.district) {
          const district = province.d.find((d) => d.n === r.district);
          if (district) {
            aiDistrict.value = String(district.id);
            populateSubdistrictOptions(district);
            if (r.subdistrict) {
              const sub = district.t.find((t) => t.n === r.subdistrict);
              if (sub) {
                aiSubdistrict.value = String(sub.id);
                aiZipcode.value = sub.z || r.zipcode || "";
              }
            }
          }
        }
      }
    }
    if (!aiZipcode.value) aiZipcode.value = r.zipcode || "";
  }

  additionalInfoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(additionalInfoAlert);

    if (!additionalInfoForm.checkValidity()) {
      additionalInfoForm.reportValidity();
      return;
    }
    if (!lastResult || !verifiedToken) {
      showAlert(additionalInfoAlert, "error", "เซสชันหมดอายุ กรุณากดปลดล็อกฟอร์มแก้ไขข้อมูลใหม่อีกครั้ง");
      return;
    }

    const file = aiDoc.files[0];
    let additionalDocBase64 = "";
    let additionalDocName = "";
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert(additionalInfoAlert, "error", "ไฟล์เอกสารต้องมีขนาดไม่เกิน 5 MB");
        return;
      }
      try {
        additionalDocBase64 = await fileToBase64(file);
        additionalDocName = file.name;
      } catch (err) {
        showAlert(additionalInfoAlert, "error", "อ่านไฟล์เอกสารไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
    }

    const titleValue = aiTitleSelect.value === "อื่น ๆ"
      ? aiTitleOtherInput.value.trim()
      : aiTitleSelect.value;

    const provinceName = aiProvince.value ? aiProvince.selectedOptions[0].textContent : "";
    const districtName = aiDistrict.value ? aiDistrict.selectedOptions[0].textContent : "";
    const subdistrictName = aiSubdistrict.value ? aiSubdistrict.selectedOptions[0].textContent : "";

    const data = {
      title: titleValue,
      firstName: document.getElementById("aiFirstName").value.trim(),
      lastName: document.getElementById("aiLastName").value.trim(),
      birthDate: document.getElementById("aiBirthDate").value,
      phone: document.getElementById("aiPhone").value.trim(),
      email: document.getElementById("aiEmail").value.trim(),
      address: document.getElementById("aiAddress").value.trim(),
      province: provinceName,
      district: districtName,
      subdistrict: subdistrictName,
      zipcode: aiZipcode.value.trim(),
      profession: document.getElementById("aiProfession").value,
      licenseNo: document.getElementById("aiLicenseNo").value.trim(),
      organization: document.getElementById("aiOrganization").value.trim(),
      education: document.getElementById("aiEducation").value.trim(),
      cpcRegNo: document.getElementById("aiCpcRegNo").value.trim(),
      cpcExperienceYears: document.getElementById("aiCpcExperienceYears").value,
      additionalDocBase64: additionalDocBase64,
      additionalDocName: additionalDocName,
      responseNote: document.getElementById("aiNote").value.trim(),
    };

    setLoading(additionalInfoBtn, true);
    try {
      const res = await callApi("submitAdditionalInfo", {
        nationalID: lastResult.nationalID,
        phone: lastResult.phone,
        token: verifiedToken,
        data,
      });
      if (res.ok) {
        showAlert(additionalInfoAlert, "success", res.message || "บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว");
        if (lastResult.status === "รอข้อมูลเพิ่มเติม") {
          document.getElementById("rcStatus").textContent = "รอตรวจสอบ";
          document.getElementById("rcStatus").className = "badge " + statusBadgeClass("รอตรวจสอบ");
          infoRequestBanner.classList.add("hidden");
          aiDoc.required = false;
          aiDocLabel.textContent = "แนบเอกสารเพิ่มเติม (ถ้ามี)";
        }
      } else {
        showAlert(additionalInfoAlert, "error", res.error || "บันทึกการแก้ไขข้อมูลไม่สำเร็จ");
      }
    } catch (err) {
      showAlert(additionalInfoAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(additionalInfoBtn, false, "บันทึกการแก้ไขข้อมูล");
    }
  });

  const params = new URLSearchParams(window.location.search);
  const nidParam = params.get("nid");
  const phParam = params.get("ph");
  if (nidParam && phParam) {
    document.getElementById("nationalID").value = nidParam;
    document.getElementById("phone").value = phParam;
    runCheck(nidParam, phParam);
  }

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
