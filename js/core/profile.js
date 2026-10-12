// ---- Profile System (Session Storage & Welcome Screen) ----------------------
let profileList = JSON.parse(localStorage.getItem("profile_list") || '[]');

function selectProfile(name) {
  sessionStorage.setItem("current_profile", name);
  location.reload();
}

function addProfile() {
  if (profileList.length >= 5) {
    alert("Hệ thống chỉ cho phép tối đa 5 người dùng để đảm bảo hiệu suất!");
    return;
  }
  const newName = prompt("Nhập tên người dùng mới (VD: Heo, Vịt):");
  if (newName && newName.trim() !== "") {
    const n = newName.trim();
    if (!profileList.includes(n)) {
      profileList.push(n);
      localStorage.setItem("profile_list", JSON.stringify(profileList));
    }
    selectProfile(n);
  }
}

function renderWelcomeGrid(list) {
  const grid = document.getElementById("profileGrid");
  let html = "";
  list.forEach(p => {
    html += `
      <div class="profile-card" data-profile="${escapeHtml(p)}">
        <div class="profile-icon">👤</div>
        <div class="profile-name">${escapeHtml(p)}</div>
      </div>
    `;
  });
  if (list.length < 5) {
    html += `
      <div class="profile-card profile-add" data-add-profile>
        <div class="profile-icon">➕</div>
        <div class="profile-name">Thêm User</div>
      </div>
    `;
  }
  grid.innerHTML = html;
}

// Trả về true nếu đã chọn profile (hiện app), false nếu đang ở màn hình chọn user.
function initProfile() {
  const appEl = document.getElementById("app");
  const welcomeEl = document.getElementById("welcomeScreen");

  if (!currentProfile) {
    appEl.style.display = "none";
    welcomeEl.style.display = "flex";

    document.getElementById("profileGrid").addEventListener("click", e => {
      const card = e.target.closest(".profile-card");
      if (!card) return;
      if (card.hasAttribute("data-add-profile")) addProfile();
      else selectProfile(card.dataset.profile);
    });
    renderWelcomeGrid(profileList);

    if (db) {
      db.collection("users").doc("_global_profiles_").onSnapshot(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        if (data.names && Array.isArray(data.names)) {
          const merged = [...new Set([...profileList, ...data.names])];
          if (merged.length !== profileList.length) {
            profileList = merged;
            localStorage.setItem("profile_list", JSON.stringify(profileList));
            renderWelcomeGrid(profileList);
          }
        }
      });
    }
    return false;
  }

  welcomeEl.style.display = "none";
  appEl.style.display = ""; // Bỏ inline style để CSS grid của #app có hiệu lực

  const nameEl = document.getElementById("currentProfileName");
  nameEl.textContent = `👤 ${currentProfile}`;
  if (!isFirebaseConfigured) {
    nameEl.innerHTML += ` <span style="color: var(--amber); font-size: 12px; margin-left: 8px;">(Offline Mode - Thiếu API Key)</span>`;
  }

  document.getElementById("changeProfileBtn").addEventListener("click", () => {
    sessionStorage.removeItem("current_profile");
    location.reload();
  });
  return true;
}

// Đăng ký tên user lên danh sách toàn cầu + hệ thống đếm người online
function startCloudPresence() {
  if (!db) return;
  db.collection("users").doc("_global_profiles_").set({
    names: firebase.firestore.FieldValue.arrayUnion(currentProfile)
  }, { merge: true }).catch(err => console.error(err));

  const onlineIndicator = document.getElementById("onlineIndicator");
  const onlineCount = document.getElementById("onlineCount");
  onlineIndicator.style.display = "flex";

  const onlineRef = db.collection("online_users").doc(currentProfile);
  const updatePresence = () => onlineRef.set({ lastActive: Date.now() }).catch(e => console.log(e));
  updatePresence();

  // Nhịp tim 15 giây/lần để có cảm giác real-time
  const presenceInterval = setInterval(updatePresence, 15000);

  // Xóa trạng thái ngay khi người dùng đóng tab hoặc F5
  window.addEventListener('beforeunload', () => {
    clearInterval(presenceInterval);
    onlineRef.delete();
  });

  db.collection("online_users").onSnapshot(snap => {
    let count = 0;
    const now = Date.now();
    snap.forEach(doc => {
      // Cửa sổ trễ 35 giây (phòng hờ rớt mạng, sập nguồn)
      if (now - doc.data().lastActive < 35000) count++;
    });
    onlineCount.textContent = count;
  });
}
