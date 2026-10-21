// ---- Cloudflare Worker: english-decoder Proxy ---------------------------------
// Copy toàn bộ code này vào nút "Edit code" trên Cloudflare Dashboard rồi bấm "Deploy".

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Danh sách models Gemini mới nhất đang hoạt động
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

export default {
  async fetch(request, env) {
    // Xử lý Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // 1. Endpoint test sức khỏe
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "english-decoder-proxy" }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    // 2. Endpoint gọi Gemini Proxy (/api/gemini)
    if (url.pathname === "/api/gemini") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Chưa cấu hình GEMINI_API_KEY trong Cloudflare Worker Secrets!" }), {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      let reqBody;
      try {
        reqBody = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      let lastError = null;
      for (const model of GEMINI_MODELS) {
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        try {
          const res = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody)
          });

          if (res.ok) {
            const data = await res.json();
            return new Response(JSON.stringify(data), {
              headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
          }

          const errJson = await res.json().catch(() => ({}));
          lastError = `[${model}]: ${res.status} - ${errJson.error?.message || "Lỗi không xác định"}`;
        } catch (e) {
          lastError = `[${model}]: ${e.message}`;
        }
      }

      return new Response(JSON.stringify({ error: `Tất cả models đều lỗi:\n${lastError}` }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
};
