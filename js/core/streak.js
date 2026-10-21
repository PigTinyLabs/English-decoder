// ---- Global Learning Streak Manager ---------------------------------------
// Quản lý chuỗi ngày học tập (streak) toàn diện cho MỌI hoạt động trong app:
// Chắp Bút (Writing), Đề Thi IELTS, Đọc Truyện (Reading), AI Quiz, Ngữ Pháp, Từ Vựng, Luyện Âm.

const Streak = {
  getStreak() {
    const raw = parseInt(Store.get("quiz_streak", "0")) || 0;
    const lastActive = Store.get("streak_last_active_date", "");
    const today = getTodayStr();
    const yesterday = getTodayStr(-1);

    // Nếu chưa từng có last_active (tài khoản cũ có sẵn quiz_streak),
    // kiểm tra ngày của quiz_history gần nhất
    if (!lastActive) {
      const quizHist = Store.getJSON("quiz_history", {});
      if (quizHist[today] || quizHist[yesterday]) return raw;
      if (Object.keys(quizHist).length > 0) {
        // Có quiz cũ nhưng không phải hôm qua/hôm nay
        const dates = Object.keys(quizHist);
        const latest = dates[dates.length - 1];
        if (latest !== today && latest !== yesterday) return 0;
      }
      return raw;
    }

    // Nếu ngày hoạt động gần nhất không phải hôm nay và cũng không phải hôm qua
    // -> chuỗi đã bị gián đoạn (missed day)
    if (lastActive !== today && lastActive !== yesterday) {
      return 0;
    }

    return raw;
  },

  isTodayCompleted() {
    const lastActive = Store.get("streak_last_active_date", "");
    return lastActive === getTodayStr();
  },

  getTodayActivities() {
    const history = Store.getJSON("streak_history", {});
    return history[getTodayStr()] || [];
  },

  recordActivity(activityType, details = {}) {
    const today = getTodayStr();
    const yesterday = getTodayStr(-1);
    let currentStreak = parseInt(Store.get("quiz_streak", "0")) || 0;
    const lastActive = Store.get("streak_last_active_date", "");

    // Lưu vào lịch sử hoạt động hôm nay
    const history = Store.getJSON("streak_history", {});
    if (!history[today]) history[today] = [];
    if (!history[today].includes(activityType)) {
      history[today].push(activityType);
    }
    Store.set("streak_history", history);

    // Nếu hôm nay đã được tính streak rồi, chỉ cập nhật thêm hoạt động
    if (lastActive === today) {
      this.updateBadges();
      return { streak: currentStreak, increased: false, alreadyDoneToday: true };
    }

    // Nếu đây là hoạt động học tập ĐẦU TIÊN trong ngày hôm nay:
    let increased = false;
    const yesterdayLearned = (lastActive === yesterday) ||
      (history[yesterday] && history[yesterday].length > 0) ||
      (Store.getJSON("quiz_history", {})[yesterday]);

    if (currentStreak === 0 || yesterdayLearned) {
      currentStreak++;
      increased = true;
    } else {
      // Bỏ lỡ ngày hôm qua -> bắt đầu chuỗi mới từ 1
      currentStreak = 1;
      increased = true;
    }

    // Lưu streak và ngày kích hoạt
    Store.setLocal("quiz_streak", currentStreak.toString());
    syncDataToFirebase("quiz_streak", currentStreak);

    Store.setLocal("streak_last_active_date", today);
    syncDataToFirebase("streak_last_active_date", today);

    this.updateBadges();

    // Hiển thị thông báo chúc mừng
    if (increased) {
      this.notifyStreakMilestone(currentStreak, activityType);
    }

    return { streak: currentStreak, increased, alreadyDoneToday: false };
  },

  updateBadges() {
    const streak = this.getStreak();
    const isDone = this.isTodayCompleted();
    const text = `🔥 ${streak} ${streak === 1 ? 'ngày' : 'ngày'}`;

    // Cập nhật Topbar Global Badge
    const globalBadge = document.getElementById("globalStreakBadge");
    if (globalBadge) {
      globalBadge.innerHTML = text;
      globalBadge.title = isDone 
        ? `🔥 Đã học hôm nay! Chuỗi: ${streak} ngày liên tục. Bấm để xem chi tiết.` 
        : `🔥 Chưa học hôm nay! Học bất kỳ bài nào để duy trì chuỗi ${streak} ngày.`;
      if (isDone) {
        globalBadge.classList.add("active-today");
      } else {
        globalBadge.classList.remove("active-today");
      }
    }

    // Cập nhật Quiz Badge cũ
    const quizBadge = document.getElementById("streakBadge");
    if (quizBadge) {
      quizBadge.innerHTML = text;
    }
  },

  notifyStreakMilestone(streak, activityType) {
    const activityNames = {
      writing: "✍️ Chắp Bút",
      ielts: "🎓 Đề Thi IELTS",
      reading: "📗 Đọc Truyện",
      quiz: "🧠 AI Quiz",
      vocab: "📚 Từ Vựng",
      grammar: "📝 Ngữ Pháp",
      practice: "🎤 Luyện Âm"
    };
    const actName = activityNames[activityType] || "Học tập";

    // Xóa toast cũ nếu có
    document.querySelectorAll(".streak-toast").forEach(t => t.remove());

    const toast = document.createElement("div");
    toast.className = "streak-toast";
    toast.innerHTML = `
      <div class="streak-toast-icon">🔥</div>
      <div class="streak-toast-content">
        <div class="streak-toast-title">Chuỗi ngày học tăng lên: ${streak} ngày!</div>
        <div class="streak-toast-sub">Ghi nhận từ: <b>${actName}</b></div>
      </div>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
      }, 4000);
    });
  },

  showDetailsModal() {
    const streak = this.getStreak();
    const isDone = this.isTodayCompleted();
    const todayActs = this.getTodayActivities();

    const activityLabels = {
      writing: "✍️ Chắp Bút (Viết câu / Đối thoại)",
      ielts: "🎓 Đề Thi IELTS",
      reading: "📗 Đọc Truyện / Tự đọc to",
      quiz: "🧠 AI Quiz Trắc nghiệm",
      vocab: "📚 Thêm & Ôn Từ Vựng",
      grammar: "📝 Luyện Thì & Ngữ Pháp",
      practice: "🎤 Luyện Phát Âm IPA"
    };

    let modal = document.getElementById("streakDetailsModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "ielts-modal-overlay";
      modal.id = "streakDetailsModal";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="ielts-modal-card" style="max-width: 480px;">
        <div class="ielts-modal-header">
          <div class="ielts-modal-title">🔥 Chuỗi Ngày Học Liên Tục</div>
          <button class="btn ghost" id="closeStreakModal" style="padding: 4px 10px;">✕</button>
        </div>
        <div class="ielts-modal-body" style="text-align: center;">
          <div style="font-size: 54px; margin-bottom: 6px;">🔥</div>
          <div style="font-size: 32px; font-weight: 800; font-family: var(--font-mono); color: var(--amber);">
            ${streak} NGÀY
          </div>
          <p class="sub" style="margin: 4px 0 16px 0;">
            ${isDone 
              ? "🎉 Tuyệt vời! Bạn đã hoàn thành mục tiêu học tập hôm nay." 
              : "⏳ Bạn chưa học hôm nay. Hãy học ít nhất một bài để giữ chuỗi!"}
          </p>

          <div style="background: var(--surface-alt); border-radius: 12px; padding: 14px; text-align: left; font-size: 13.5px; border: 1px solid var(--border);">
            <div style="font-weight: 700; margin-bottom: 8px; color: var(--cyan);">Các hoạt động đã làm hôm nay:</div>
            ${todayActs.length > 0 
              ? todayActs.map(a => `<div style="padding: 4px 0; color: var(--emerald);">✓ ${activityLabels[a] || a}</div>`).join("") 
              : `<div class="sub" style="font-style: italic;">Chưa có hoạt động nào trong hôm nay.</div>`}
          </div>

          <div style="margin-top: 14px; font-size: 12.5px; color: var(--muted); text-align: left; line-height: 1.6;">
            💡 <b>Mẹo giữ chuỗi:</b> Mọi hoạt động từ <i>Chắp Bút, Đọc Truyện, IELTS, AI Quiz, Ngữ Pháp, Từ Vựng đến Luyện Âm</i> đều được tính vào chuỗi ngày học!
          </div>
        </div>
        <div class="ielts-modal-footer">
          <button class="btn" id="closeStreakModalBtn" style="width: 100%;">Đã hiểu</button>
        </div>
      </div>
    `;

    modal.style.display = "flex";
    modal.querySelector("#closeStreakModal")?.addEventListener("click", () => { modal.style.display = "none"; });
    modal.querySelector("#closeStreakModalBtn")?.addEventListener("click", () => { modal.style.display = "none"; });
  }
};

// Global helpers tương thích toàn hệ thống
function getStreak() { return Streak.getStreak(); }
function updateStreakBadge() { Streak.updateBadges(); }
function recordLearningActivity(type, details) { return Streak.recordActivity(type, details); }

// Lắng nghe dữ liệu đồng bộ từ Firestore (Cloud)
if (typeof onRemoteField === "function") {
  onRemoteField("quiz_streak", streak => {
    Store.setLocal("quiz_streak", streak.toString());
    Streak.updateBadges();
  });
  onRemoteField("streak_last_active_date", d => {
    Store.setLocal("streak_last_active_date", d);
    Streak.updateBadges();
  });
  onRemoteField("streak_history", h => {
    Store.setLocal("streak_history", h);
    Streak.updateBadges();
  });
}

