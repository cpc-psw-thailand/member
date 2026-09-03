let lastResult = null;
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

  const additionalInfoWrap = document.getElementById("additionalInfoWrap");
  const infoRequestMessageText = document.getElementById("infoRequestMessageText");
  const currentInfoGrid = document.getElementById("currentInfoGrid");
  const additionalInfoForm = document.getElementById("additionalInfoForm");
  const additionalInfoAlert = document.getElementById("additionalInfoAlert");
  const additionalInfoBtn = document.getElementById("additionalInfoBtn");

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

  function detailItemHtml(label, value) {
    return `
      <div class="detail-item">
        <div class="dt-label">${label}</div>
        <div class="dt-value">${value || "—"}</div>
      </div>
    `;
  }

  function renderResult(r) {
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
      return;
    }

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
    additionalInfoWrap.classList.toggle("hidden", !needsInfo);

    if (needsInfo) {
      infoRequestMessageText.textContent = r.infoRequestMessage || "";
      currentInfoGrid.innerHTML = [
        detailItemHtml("เบอร์โทรศัพท์", r.phone),
        detailItemHtml("อีเมล", r.email),
        detailItemHtml("ที่อยู่", r.address),
        detailItemHtml("ตำบล/แขวง", r.subdistrict),
        detailItemHtml("อำเภอ/เขต", r.district),
        detailItemHtml("จังหวัด", r.province),
        detailItemHtml("รหัสไปรษณีย์", r.zipcode),
        detailItemHtml("วิชาชีพ", r.profession),
        detailItemHtml("เลขที่ใบประกอบโรคศิลปะ", r.licenseNo),
        detailItemHtml("หน่วยงานต้นสังกัด", r.organization),
        detailItemHtml("วุฒิการศึกษา", r.education),
        detailItemHtml("เลขที่ทะเบียน ป.วิ.อาญา", r.cpcRegNo),
      ].join("");
      additionalInfoForm.reset();
      resetSelect(aiDistrict, "— เลือกจังหวัดก่อน —");
      resetSelect(aiSubdistrict, "— เลือกอำเภอก่อน —");
      aiDistrict.disabled = true;
      aiSubdistrict.disabled = true;
      document.getElementById("aiZipcode").value = "";
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

  // ---- ที่อยู่แบบ cascade สำหรับฟอร์มแก้ไขข้อมูลเพิ่มเติม ----
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
  loadAddressData();

  aiProvince.addEventListener("change", () => {
    resetSelect(aiDistrict, "— เลือกอำเภอ/เขต —");
    resetSelect(aiSubdistrict, "— เลือกอำเภอก่อน —");
    aiZipcode.value = "";
    const province = AI_ADDRESS_DATA.find((p) => String(p.id) === aiProvince.value);
    if (province) {
      aiDistrict.disabled = false;
      province.d.forEach((dist) => {
        const opt = document.createElement("option");
        opt.value = dist.id;
        opt.textContent = dist.n;
        aiDistrict.appendChild(opt);
      });
    } else {
      aiDistrict.disabled = true;
    }
    aiSubdistrict.disabled = true;
  });

  aiDistrict.addEventListener("change", () => {
    resetSelect(aiSubdistrict, "— เลือกตำบล/แขวง —");
    aiZipcode.value = "";
    const province = AI_ADDRESS_DATA.find((p) => String(p.id) === aiProvince.value);
    const district = province && province.d.find((d) => String(d.id) === aiDistrict.value);
    if (district) {
      aiSubdistrict.disabled = false;
      district.t.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.n;
        opt.dataset.zip = t.z;
        aiSubdistrict.appendChild(opt);
      });
    } else {
      aiSubdistrict.disabled = true;
    }
  });

  aiSubdistrict.addEventListener("change", () => {
    const selected = aiSubdistrict.selectedOptions[0];
    aiZipcode.value = selected && selected.dataset.zip ? selected.dataset.zip : "";
  });

  // ---- ส่งข้อมูล/เอกสารเพิ่มเติม ----
  additionalInfoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(additionalInfoAlert);

    if (!additionalInfoForm.checkValidity()) {
      additionalInfoForm.reportValidity();
      return;
    }
    if (!lastResult) return;

    const docInput = document.getElementById("aiDoc");
    const file = docInput.files[0];
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

    const provinceName = aiProvince.value ? aiProvince.selectedOptions[0].textContent : "";
    const districtName = aiDistrict.value ? aiDistrict.selectedOptions[0].textContent : "";
    const subdistrictName = aiSubdistrict.value ? aiSubdistrict.selectedOptions[0].textContent : "";

    const data = {
      phone: document.getElementById("aiPhone").value.trim(),
      email: document.getElementById("aiEmail").value.trim(),
      address: document.getElementById("aiAddress").value.trim(),
      province: provinceName,
      district: districtName,
      subdistrict: subdistrictName,
      zipcode: aiZipcode.value.trim(),
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
        data,
      });
      if (res.ok) {
        showAlert(additionalInfoAlert, "success", res.message || "ส่งข้อมูลเพิ่มเติมเรียบร้อยแล้ว");
        additionalInfoForm.reset();
        document.getElementById("rcStatus").textContent = "รอตรวจสอบ";
        document.getElementById("rcStatus").className = "badge " + statusBadgeClass("รอตรวจสอบ");
        additionalInfoBtn.disabled = true;
      } else {
        showAlert(additionalInfoAlert, "error", res.error || "ส่งข้อมูลเพิ่มเติมไม่สำเร็จ");
      }
    } catch (err) {
      showAlert(additionalInfoAlert, "error", "เชื่อมต่อระบบไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(additionalInfoBtn, false, "ส่งข้อมูลเพิ่มเติม");
    }
  });

  // รองรับลิงก์ตรงจากอีเมล (?nid=...&ph=...) — กรอกให้และค้นหาอัตโนมัติ
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
