document.addEventListener("DOMContentLoaded", () => {
  // 1. ELEMEN LAYAR & UI
  const splashScreen = document.getElementById("splash-screen");
  const tapScreen = document.getElementById("tap-screen");
  const mainContent = document.getElementById("main-content");

  // 2. INISIALISASI SUPABASE (Di dalam DOMContentLoaded & Aman dari Crash)
  const SUPABASE_URL = "https://gqnlbflsvtfhrtfxhmaw.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbmxiZmxzdnRmaHJ0ZnhobWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMjQ1NzksImV4cCI6MjEwMDkwMDU3OX0.0jCXvXEycPrpKB-DUr3aaW0KRGRQTjCCR_g1f-vV4Yk";

  let supabase = null;
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Supabase berhasil terhubung!");
    } else {
      console.warn("SDK Supabase belum siap / gagal dimuat dari CDN.");
    }
  } catch (err) {
    console.error("Error inisialisasi Supabase:", err);
  }

  // 3. TIMING SPLASH SCREEN (PASTI JALAN KARENA ADA DI ATAS)
  setTimeout(() => {
    if (splashScreen) splashScreen.classList.add("hidden");
    if (tapScreen) tapScreen.classList.remove("hidden");
  }, 3500);

  // 4. AUDIO ELEMENTS
  const bgm = document.getElementById("bgm");
  const sfxWelcome = document.getElementById("sfx-welcome");
  const sfxClick = document.getElementById("sfx-click");
  const musicBtn = document.getElementById("music-btn");
  const musicIcon = document.getElementById("music-icon");

  if (bgm) bgm.volume = 0.3;
  if (sfxWelcome) sfxWelcome.volume = 1.0;
  if (sfxClick) sfxClick.volume = 0.8;

  let isPlaying = false;

  // 5. TAP SCREEN EVENT
  if (tapScreen) {
    tapScreen.addEventListener("click", () => {
      tapScreen.classList.add("hidden");
      if (mainContent) mainContent.classList.remove("hidden");
      if (musicBtn) musicBtn.classList.remove("hidden");

      if (sfxWelcome) {
        sfxWelcome.currentTime = 0;
        sfxWelcome.play().catch(e => console.log(e));
      }
      playBGM();

      // Load data anggota dari database
      loadApprovedMembers();
    });
  }

  function playBGM() {
    if (bgm) {
      bgm.play().then(() => {
        isPlaying = true;
        if (musicIcon) musicIcon.textContent = "🔊";
        if (musicBtn) musicBtn.classList.remove("muted");
      }).catch(err => console.log(err));
    }
  }

  // 6. TOGGLE MUSIC
  if (musicBtn) {
    musicBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isPlaying) {
        bgm.pause();
        isPlaying = false;
        musicIcon.textContent = "🔇";
        musicBtn.classList.add("muted");
      } else {
        bgm.play();
        isPlaying = true;
        musicIcon.textContent = "🔊";
        musicBtn.classList.remove("muted");
      }
    });
  }

  // 7. NAVIGASI TAB MENU
  const menuButtons = document.querySelectorAll(".menu-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  menuButtons.forEach(button => {
    button.addEventListener("click", () => {
      menuButtons.forEach(btn => btn.classList.remove("active"));
      tabContents.forEach(content => content.classList.remove("active"));

      button.classList.add("active");
      const targetId = button.getAttribute("data-target");
      const targetElement = document.getElementById(targetId);
      if (targetElement) targetElement.classList.add("active");
    });
  });

  // 8. GLOBAL SFX CLICK
  document.addEventListener("click", (e) => {
    const isButton = e.target.tagName === "BUTTON" || e.target.closest("button") || e.target.classList.contains("menu-btn");
    if (isButton && tapScreen && tapScreen.classList.contains("hidden")) {
      if (sfxClick) {
        sfxClick.currentTime = 0;
        sfxClick.play().catch(err => console.log(err));
      }
    }
  });

  // ==========================================
  // LOGIKA DATABASE (FORM PENDAFTARAN)
  // ==========================================

  const regForm = document.getElementById("registration-form");
  const statusMsg = document.getElementById("form-status-msg");

  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!supabase) {
        alert("Koneksi database belum siap. Coba refresh halaman.");
        return;
      }

      statusMsg.style.color = "#00e5ff";
      statusMsg.textContent = "Mengirim pendaftaran...";

      const vtuber_name = document.getElementById("reg-name").value;
      const virtual_age = document.getElementById("reg-age").value;
      const platform = document.getElementById("reg-platform").value;
      const biodata = document.getElementById("reg-bio").value;

      const { data, error } = await supabase
        .from('members')
        .insert([
          { vtuber_name, virtual_age, platform, biodata, status: 'pending' }
        ]);

      if (error) {
        statusMsg.style.color = "#ff4d79";
        statusMsg.textContent = "Gagal mendaftar: " + error.message;
      } else {
        statusMsg.style.color = "#00e676";
        statusMsg.textContent = "Pendaftaran berhasil terkirim! Menunggu persetujuan Owner.";
        regForm.reset();
      }
    });
  }

  // Load Anggota Diterima
  async function loadApprovedMembers() {
    const container = document.getElementById("member-list-container");
    if (!container) return;

    const ownerCardHTML = `
      <div class="member-card owner-card">
        <div class="member-info">
          <span class="member-name">Reine Mihara</span>
          <span class="member-role">(Owner / Founder)</span>
        </div>
        <div class="member-emblem">🇲🇨👑</div>
      </div>
    `;

    if (!supabase) {
      container.innerHTML = ownerCardHTML;
      return;
    }

    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'approved');

    if (error || !members) {
      console.log("Error / Tidak ada data:", error);
      container.innerHTML = ownerCardHTML;
      return;
    }

    let membersHTML = ownerCardHTML;
    members.forEach(member => {
      membersHTML += `
        <div class="member-card">
          <div class="member-info">
            <span class="member-name">${member.vtuber_name}</span>
            <span class="member-details">Platform: ${member.platform} | Umur: ${member.virtual_age}</span>
            <span class="member-bio">"${member.biodata}"</span>
          </div>
          <div class="member-emblem">✨</div>
        </div>
      `;
    });

    container.innerHTML = membersHTML;
  }

  // ==========================================
  // LOGIKA ADMIN / OWNER MODAL
  // ==========================================

  const adminModal = document.getElementById("admin-modal");
  const adminAccessBtn = document.getElementById("admin-login-btn");
  const closeAdminModal = document.getElementById("close-admin-modal");
  const submitPinBtn = document.getElementById("submit-pin-btn");
  const adminPinInput = document.getElementById("admin-pin-input");
  const adminLoginSec = document.getElementById("admin-login-sec");
  const adminDashboardSec = document.getElementById("admin-dashboard-sec");

  const OWNER_PIN = "1234";

  if (adminAccessBtn) {
    adminAccessBtn.addEventListener("click", () => {
      if (adminModal) adminModal.classList.remove("hidden");
    });
  }

  if (closeAdminModal) {
    closeAdminModal.addEventListener("click", () => {
      if (adminModal) adminModal.classList.add("hidden");
    });
  }

  if (submitPinBtn) {
    submitPinBtn.addEventListener("click", () => {
      if (adminPinInput && adminPinInput.value === OWNER_PIN) {
        if (adminLoginSec) adminLoginSec.classList.add("hidden");
        if (adminDashboardSec) adminDashboardSec.classList.remove("hidden");
        loadPendingRequests();
      } else {
        alert("PIN Salah!");
      }
    });
  }

  async function loadPendingRequests() {
    const pendingList = document.getElementById("pending-list");
    if (!pendingList) return;

    if (!supabase) {
      pendingList.innerHTML = "<p>Database belum siap.</p>";
      return;
    }

    pendingList.innerHTML = "<p>Memuat pendaftaran...</p>";

    const { data: pendings, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'pending');

    if (error || !pendings || !pendings.length) {
      pendingList.innerHTML = "<p style='color: #aaa;'>Tidak ada pendaftaran baru.</p>";
      return;
    }

    pendingList.innerHTML = "";
    pendings.forEach(item => {
      const card = document.createElement("div");
      card.className = "pending-card";
      card.innerHTML = `
        <strong>${item.vtuber_name}</strong>
        <span style="font-size: 0.85rem; color: #ccc;">Platform: ${item.platform} | Umur: ${item.virtual_age}</span>
        <p style="font-size: 0.8rem; font-style: italic; color: #aaa;">Bio: ${item.biodata}</p>
        <div class="pending-actions">
          <button class="approve-btn" onclick="updateMemberStatus(${item.id}, 'approved')">Terima ✅</button>
          <button class="reject-btn" onclick="updateMemberStatus(${item.id}, 'rejected')">Tolak ❌</button>
        </div>
      `;
      pendingList.appendChild(card);
    });
  }

  window.updateMemberStatus = async function(id, status) {
    if (!supabase) return;

    const { error } = await supabase
      .from('members')
      .update({ status: status })
      .eq('id', id);

    if (error) {
      alert("Gagal mengubah status: " + error.message);
    } else {
      alert(status === 'approved' ? "Anggota diterima!" : "Pendaftaran ditolak.");
      loadPendingRequests();
      loadApprovedMembers();
    }
  };
});
