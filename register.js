let ADDRESS_DATA = [];

async function loadAddressData() {
  try {
    const res = await fetch("thai-address-data.json");
    ADDRESS_DATA = await res.json();
  } catch (err) {
    console.error("โหลดข้อมูลจังหวัด/อำเภอ/ตำบลไม่สำเร็จ", err);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data:<mime>;base64,....
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("registerForm");
  const alertBox = document.getElementById("alertBox");
  const submitBtn = document.getElementById("submitBtn");

  // ---- คำนำหน้า "อื่น ๆ" ----
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

  // ---- ที่อยู่: จังหวัด / อำเภอ / ตำบล / รหัสไปรษณีย์ (แบบ cascade) ----
  const provinceSelect = document.getElementById("province");
  const districtSelect = document.getElementById("district");
  const subdistrictSelect = document.getElementById("subdistrict");
  const zipcodeInput = document.getElementById("zipcode");

  await loadAddressData();

  ADDRESS_DATA.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.n;
    provinceSelect.appendChild(opt);
  });

  function resetSelect(select, placeholder) {
    select.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    select.appendChild(opt);
  }

  provinceSelect.addEventListener("change", () => {
    resetSelect(districtSelect, "— เลือกอำเภอ/เขต —");
    resetSelect(subdistrictSelect, "— เลือกอำเภอก่อน —");
    zipcodeInput.value = "";
    const province = ADDRESS_DATA.find((p) => String(p.id) === provinceSelect.value);
    if (province) {
      districtSelect.disabled = false;
      province.d.forEach((dist) => {
        const opt = document.createElement("option");
        opt.value = dist.id;
        opt.textContent = dist.n;
        districtSelect.appendChild(opt);
      });
    } else {
      districtSelect.disabled = true;
    }
    subdistrictSelect.disabled = true;
  });

  districtSelect.addEventListener("change", () => {
    resetSelect(subdistrictSelect, "— เลือกตำบล/แขวง —");
    zipcodeInput.value = "";
    const province = ADDRESS_DATA.find((p) => String(p.id) === provinceSelect.value);
    const district = province && province.d.find((d) => String(d.id) === districtSelect.value);
    if (district) {
      subdistrictSelect.disabled = false;
      district.t.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.n;
        opt.dataset.zip = t.z;
        subdistrictSelect.appendChild(opt);
      });
    } else {
      subdistrictSelect.disabled = true;
    }
  });

  subdistrictSelect.addEventListener("change", () => {
    const selected = subdistrictSelect.selectedOptions[0];
    zipcodeInput.value = selected && selected.dataset.zip ? selected.dataset.zip : "";
  });

  // ---- ประเภทสมาชิก: แสดง/ซ่อนส่วนข้อมูลผู้ทำหน้าที่ ป.วิ.อาญา เฉพาะสมาชิกสามัญ ----
  const memberTypeRadios = form.querySelectorAll('input[name="memberType"]');
  const cpcDutyFieldset = document.getElementById("cpcDutyFieldset");
  const cpcRole = document.getElementById("cpcRole");
  const cpcRegNo = document.getElementById("cpcRegNo");
  const cpcExperienceYears = document.getElementById("cpcExperienceYears");
  const cpcCardPhoto = document.getElementById("cpcCardPhoto");

  function syncCpcDutySection() {
    const isSamanya = form.querySelector('input[name="memberType"]:checked').value === "สมาชิกสามัญ";
    cpcDutyFieldset.classList.toggle("hidden", !isSamanya);
    [cpcRole, cpcRegNo, cpcExperienceYears].forEach((el) => { el.required = isSamanya; });
    cpcCardPhoto.required = isSamanya;
  }
  memberTypeRadios.forEach((r) => r.addEventListener("change", syncCpcDutySection));
  syncCpcDutySection();

  // ---- Submit ----
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

    const provinceName = provinceSelect.selectedOptions[0]?.textContent || "";
    const districtName = districtSelect.selectedOptions[0]?.textContent || "";
    const subdistrictName = subdistrictSelect.selectedOptions[0]?.textContent || "";
    const addressDetail = document.getElementById("address").value.trim();
    const fullAddress = [
      addressDetail,
      subdistrictName && ("ตำบล/แขวง" + subdistrictName),
      districtName && ("อำเภอ/เขต" + districtName),
      provinceName && ("จังหวัด" + provinceName),
      zipcodeInput.value && zipcodeInput.value,
    ].filter(Boolean).join(" ");

    const isSamanya = form.querySelector('input[name="memberType"]:checked').value === "สมาชิกสามัญ";

    let cpcCardPhotoBase64 = "";
    let cpcCardPhotoName = "";
    if (isSamanya && cpcCardPhoto.files[0]) {
      const file = cpcCardPhoto.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showAlert(alertBox, "error", "ไฟล์รูปบัตรผู้ทำหน้าที่ฯ ต้องมีขนาดไม่เกิน 5 MB");
        return;
      }
      try {
        cpcCardPhotoBase64 = await fileToBase64(file);
        cpcCardPhotoName = file.name;
      } catch (err) {
        showAlert(alertBox, "error", "อ่านไฟล์รูปภาพไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
    }

    const data = {
      title: titleValue,
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      nationalID: nationalID,
      birthDate: document.getElementById("birthDate").value,
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      address: fullAddress,
      province: provinceName,
      district: districtName,
      subdistrict: subdistrictName,
      zipcode: zipcodeInput.value,
      profession: document.getElementById("profession").value,
      licenseNo: document.getElementById("licenseNo").value.trim(),
      organization: document.getElementById("organization").value.trim(),
      education: document.getElementById("education").value.trim(),
      experienceYears: document.getElementById("experienceYears").value,
      memberType: form.querySelector('input[name="memberType"]:checked').value,
      cpcRole: isSamanya ? cpcRole.value : "",
      cpcRegNo: isSamanya ? cpcRegNo.value.trim() : "",
      cpcExperienceYears: isSamanya ? cpcExperienceYears.value : "",
      cpcCardPhotoBase64: cpcCardPhotoBase64,
      cpcCardPhotoName: cpcCardPhotoName,
      consent: document.getElementById("consent").checked,
    };

    setLoading(submitBtn, true);
    try {
      const res = await callApi("register", { data });
      if (res.ok) {
        form.reset();
        syncTitleOther();
        syncCpcDutySection();
        resetSelect(districtSelect, "— เลือกจังหวัดก่อน —");
        resetSelect(subdistrictSelect, "— เลือกอำเภอก่อน —");
        districtSelect.disabled = true;
        subdistrictSelect.disabled = true;
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
