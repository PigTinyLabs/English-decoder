// ---- Firebase + profile-scoped storage --------------------------------------
// Đọc cấu hình từ env.js (được sinh ra từ GitHub Secrets hoặc .env)
const firebaseConfig = {
  apiKey: window.ENV?.FIREBASE_API_KEY || "",
  authDomain: window.ENV?.FIREBASE_AUTH_DOMAIN || "",
  projectId: window.ENV?.FIREBASE_PROJECT_ID || "",
  storageBucket: window.ENV?.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: window.ENV?.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: window.ENV?.FIREBASE_APP_ID || ""
};

let db = null;
const isFirebaseConfigured = !!firebaseConfig.apiKey;
if (isFirebaseConfigured && window.firebase) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

let currentProfile = sessionStorage.getItem("current_profile");

// Mỗi user có một namespace riêng trong localStorage: `${profile}_${name}`.
// Tên field trên Firestore trùng với `name` để dữ liệu cũ tiếp tục dùng được.
const Store = {
  key(name) { return `${currentProfile}_${name}`; },

  get(name, fallback = null) {
    const raw = localStorage.getItem(this.key(name));
    return raw === null ? fallback : raw;
  },

  getJSON(name, fallback) {
    try {
      const raw = localStorage.getItem(this.key(name));
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  setLocal(name, value) {
    localStorage.setItem(this.key(name), typeof value === "string" ? value : JSON.stringify(value));
  },

  // Lưu local và đẩy lên Firestore (nếu có cấu hình)
  set(name, value) {
    this.setLocal(name, value);
    syncDataToFirebase(name, value);
  },

  remove(name) { localStorage.removeItem(this.key(name)); },
};

function syncDataToFirebase(key, value) {
  if (!db) return;
  db.collection("users").doc(currentProfile).set({ [key]: value }, { merge: true }).catch(console.error);
}

// Các feature đăng ký handler cho field của mình; khi Firestore có dữ liệu mới, handler được gọi.
const remoteFieldHandlers = {};
function onRemoteField(field, handler) { remoteFieldHandlers[field] = handler; }

function listenToFirebase() {
  if (!db) return;
  db.collection("users").doc(currentProfile).onSnapshot(doc => {
    if (!doc.exists) return;
    const data = doc.data();
    for (const [field, handler] of Object.entries(remoteFieldHandlers)) {
      if (data[field] !== undefined && data[field] !== null) handler(data[field]);
    }
  });
}
