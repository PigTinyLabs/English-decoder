// ---- IndexedDB key-value nhỏ gọn ----------------------------------------------------
// Dùng cho dữ liệu lớn chỉ nằm trên máy (VD sách EPUB đã nhập) — localStorage chỉ ~5MB.
const LocalDB = {
  _db: null,

  open() {
    if (this._db) return this._db;
    this._db = new Promise((resolve, reject) => {
      const req = indexedDB.open("english-decoder", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("books", { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this._db;
  },

  async _run(store, mode, fn) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = () => reject(tx.error);
    });
  },

  get(store, key) { return this._run(store, "readonly", s => s.get(key)); },
  getAll(store) { return this._run(store, "readonly", s => s.getAll()); },
  put(store, value) { return this._run(store, "readwrite", s => s.put(value)); },
  delete(store, key) { return this._run(store, "readwrite", s => s.delete(key)); },
};
