// ---- Unified LLM Client (BitNet 3B / Local OpenAI-compatible & Gemini) -------------
// Hỗ trợ mô hình Hybrid:
// 1. BitNet 3B / Local Server (OpenAI format: bitnet.cpp, Ollama, vLLM, llama.cpp...)
// 2. Gemini Cloud API (qua proxy hoặc trực tiếp)
// 3. Tự động chuyển đổi và trích xuất JSON an toàn cho các model 3B

function extractJSONFromText(raw) {
  if (typeof raw === "object" && raw !== null) return raw;
  if (!raw || typeof raw !== "string") throw new Error("Phản hồi từ AI rỗng");
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try { return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)); } catch (_) {}
    }
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try { return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1)); } catch (_) {}
    }
    throw e;
  }
}

const Gemini = {
  MODELS: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"],

  // Cấu hình BitNet / Local LLM
  bitnetUrl() { return (window.ENV?.BITNET_API_URL || "").trim().replace(/\/+$/, ""); },
  bitnetKey() { return (window.ENV?.BITNET_API_KEY || "").trim(); },
  bitnetModel() { return (window.ENV?.BITNET_MODEL || "bitnet-b1.58-3b").trim(); },

  // Cấu hình Gemini
  proxyUrl() { return (window.ENV?.GEMINI_PROXY_URL || "https://english-decoder.tinyspirit99-9ec.workers.dev").trim(); },
  apiKey() { return (window.ENV?.GEMINI_API_KEY || "").trim(); },

  // Xác định nhà cung cấp đang dùng
  provider() {
    const pref = (window.ENV?.LLM_PROVIDER || "auto").toLowerCase();
    if (pref === "bitnet" && this.bitnetUrl()) return "bitnet";
    if (pref === "gemini" && (this.proxyUrl() || this.apiKey())) return "gemini";
    // Mặc định "auto": ưu tiên BitNet nếu có cấu hình endpoint, nếu không thì dùng Gemini
    if (this.bitnetUrl()) return "bitnet";
    if (this.proxyUrl() || this.apiKey()) return "gemini";
    return "none";
  },

  isAvailable() {
    return this.provider() !== "none";
  },

  providerLabel() {
    const p = this.provider();
    if (p === "bitnet") return `BitNet 3B (${this.bitnetModel()})`;
    if (this.proxyUrl().includes("workers.dev")) return "Cloudflare Workers AI (Llama 3.2 3B)";
    if (p === "gemini") return "Gemini";
    return "Offline (Rule-based)";
  },

  // Gọi BitNet / Local OpenAI-compatible server
  async generateBitNet(input, { json = true } = {}) {
    let endpoint = this.bitnetUrl();
    if (!endpoint.endsWith("/chat/completions")) {
      endpoint = `${endpoint}/chat/completions`;
    }

    let messages = [];
    if (typeof input === "string") {
      messages = [{ role: "user", content: input }];
    } else if (Array.isArray(input)) {
      messages = input.map(item => {
        if (item.parts) {
          return {
            role: item.role === "model" ? "assistant" : item.role,
            content: item.parts.map(p => p.text || "").join("")
          };
        }
        return item;
      });
    }

    const headers = { "Content-Type": "application/json" };
    const key = this.bitnetKey();
    if (key) headers["Authorization"] = `Bearer ${key}`;

    const body = {
      model: this.bitnetModel(),
      messages,
      temperature: 0.2,
      max_tokens: 1024,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `BitNet error ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (content == null) throw new Error("BitNet không trả về nội dung");
    return content;
  },

  // Gọi Gemini API (trực tiếp hoặc proxy)
  async generateGemini(input, { json = true } = {}) {
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
      if (!key) throw new Error("Không tìm thấy Gemini API Key trong hệ thống!");
      let lastErr = null;
      for (const model of this.MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        if (res.ok) break;
        const errBody = await res.json().catch(() => ({}));
        lastErr = `Model ${model}: ${res.status} - ${errBody.error?.message || "Unknown error"}`;
        res = null;
      }
      if (!res) throw new Error(lastErr || "Tất cả Gemini models đều thất bại.");
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  },

  // Hàm gọi chính: tự động chọn BitNet hoặc Gemini, tự động fallback nếu cần
  async generate(input, { json = true } = {}) {
    const currentProvider = this.provider();
    if (currentProvider === "bitnet") {
      try {
        return await this.generateBitNet(input, { json });
      } catch (e) {
        console.warn("BitNet failed, fallback to Gemini if available:", e);
        if (this.proxyUrl() || this.apiKey()) {
          return await this.generateGemini(input, { json });
        }
        throw e;
      }
    } else if (currentProvider === "gemini") {
      return await this.generateGemini(input, { json });
    }
    throw new Error("Chưa cấu hình API Key hoặc URL cho BitNet / Gemini trong env.js");
  },

  async generateJSON(input) {
    const raw = await this.generate(input, { json: true });
    return extractJSONFromText(raw);
  },
};

// Alias tương thích
const LLM = Gemini;
window.LLM = LLM;

