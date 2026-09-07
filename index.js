document.addEventListener("DOMContentLoaded", async () => {
  const totalEl = document.getElementById("pubStatTotal");
  const samanyaEl = document.getElementById("pubStatSamanya");
  const wisamanyaEl = document.getElementById("pubStatWisamanya");
  const honoraryCard = document.getElementById("pubStatHonoraryCard");
  const honoraryEl = document.getElementById("pubStatHonorary");
  if (!totalEl) return;

  try {
    const res = await callApi("publicStats", {});
    if (res.ok) {
      const c = res.counts;
      totalEl.textContent = c.total;
      samanyaEl.textContent = c.samanya;
      wisamanyaEl.textContent = c.wisamanya;
      if (c.honorary > 0) {
        honoraryEl.textContent = c.honorary;
        honoraryCard.classList.remove("hidden");
      }
    } else {
      totalEl.textContent = "—";
      samanyaEl.textContent = "—";
      wisamanyaEl.textContent = "—";
    }
  } catch (err) {
    // ไม่ให้กระทบหน้าแรกถ้าดึงข้อมูลสถิติไม่สำเร็จ
    console.error("โหลดสถิติสมาชิกไม่สำเร็จ", err);
    totalEl.textContent = "—";
    samanyaEl.textContent = "—";
    wisamanyaEl.textContent = "—";
  }
});
