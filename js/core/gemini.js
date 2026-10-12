// ---- Gemini client -------------------------------------------------------------
// Ưu tiên gọi qua proxy (key ẩn trên server); nếu không có proxy thì gọi thẳng API bằng key trong env.js.
const Gemini = {
  MODELS: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"],

  proxyUrl() { return (window.ENV?.GEMINI_PROXY_URL || "").trim(); },
  apiKey() { return (window.ENV?.GEMINI_API_KEY || "").trim(); },
  isAvailable() { return !!(this.proxyUrl() || this.apiKey()); },

  // `input`: chuỗi prompt, hoặc mảng contents [{ role, parts: [{ text }] }] cho hội thoại nhiều lượt.
  async generate(input, { json = true } = {}) {
    const contents = typeof input === "string" ? [{ parts: [{ text: input }] }] : input;
    const body = JSON.stringify({
      contents,
      generationConfig: json ? { response_mime_type: "application/json" } : {}
    });

    let res = null;
    const proxy = this.proxyUrl();
    if (proxy) {
      res = await fetch(`${proxy}/api/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Proxy error: ${res.status}`);
      }
    } else {
      const key = this.apiKey();
      if (!key) throw new Error("Không tìm thấy Gemini API Key trong hệ thống (.env)!");
      let lastErr = null;
      for (const model of this.MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        if (res.ok) break;
        const errBody = await res.json().catch(() => ({}));
        lastErr = `Model ${model}: ${res.status} - ${errBody.error?.message || "Unknown error"}`;
        res = null;
      }
      if (!res) throw new Error(lastErr || "Tất cả models đều thất bại.");
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  },

  async generateJSON(input) {
    const raw = await this.generate(input, { json: true });
    // Phòng trường hợp model vẫn bọc trong ```json ... ```
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    return JSON.parse(cleaned);
  },
};
