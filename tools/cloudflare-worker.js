// ---- Cloudflare Worker: english-decoder Proxy (Llama 3.2 3B + Gemini) -------------
// Copy toàn bộ code này vào nút "Edit code" trên Cloudflare Dashboard rồi bấm "Deploy".
//
// Yêu cầu: Trong Cloudflare Settings -> Bindings, thêm Workers AI với tên biến là "AI".

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Model 3B có sẵn miễn phí trên Cloudflare Workers AI
const LLAMA_MODEL = "@cf/meta/llama-3.2-3b-instruct";

// Danh sách models Gemini dự phòng nếu không dùng Llama
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

export default {
  async fetch(request, env) {
    // Xử lý Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // 1. Endpoint kiểm tra sức khỏe
    if (url.pathname === "/" || url.pathname === "/health") {
      const hasAI = !!env.AI;
      const hasGemini = !!env.GEMINI_API_KEY;
      return new Response(JSON.stringify({
        status: "ok",
        service: "english-decoder-ai",
        provider: hasAI ? "Cloudflare Workers AI (Llama 3.2 3B)" : (hasGemini ? "Gemini" : "None")
      }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    // 2. Endpoint AI chấm bài (/api/gemini hoặc /api/ai)
    if (url.pathname === "/api/gemini" || url.pathname === "/api/ai") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
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

      // Trích xuất prompt từ cấu trúc payload
      let promptText = "";
      if (Array.isArray(reqBody.contents)) {
        promptText = reqBody.contents.map(c => {
          const role = c.role === "model" ? "Trợ lý AI" : "Học viên";
          const text = (c.parts || []).map(p => p.text || "").join("\n");
          return `${role}: ${text}`;
        }).join("\n\n");
      } else if (typeof reqBody.prompt === "string") {
        promptText = reqBody.prompt;
      } else {
        promptText = JSON.stringify(reqBody);
      }

      // ƯU TIÊN 1: Chạy mô hình Llama 3.2 3B có sẵn trên Cloudflare Workers AI
      if (env.AI) {
        try {
          const aiRes = await env.AI.run(LLAMA_MODEL, {
            messages: [
              {
                role: "system",
                content: "You are an expert English teacher evaluating translation exercises. Output ONLY valid JSON matching the requested schema. Do not add conversational introduction or markdown text outside JSON."
              },
              { role: "user", content: promptText }
            ],
            temperature: 0.2,
            max_tokens: 1024,
          });

          const outputText = typeof aiRes.response === "string" 
            ? aiRes.response 
            : JSON.stringify(aiRes.response || "");
          return new Response(JSON.stringify({
            model: "llama-3.2-3b",
            candidates: [
              {
                content: {
                  parts: [{ text: outputText }]
                }
              }
            ]
          }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        } catch (aiErr) {
          console.warn("Workers AI error, trying Gemini fallback:", aiErr);
          // Tiếp tục fallback bên dưới nếu có Gemini
        }
      }

      // ƯU TIÊN 2: Fallback sang Gemini nếu có cấu hình GEMINI_API_KEY
      const apiKey = env.GEMINI_API_KEY;
      if (apiKey) {
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
            lastError = `[${model}]: ${res.status} - ${errJson.error?.message || "Lỗi"}`;
          } catch (e) {
            lastError = `[${model}]: ${e.message}`;
          }
        }
        return new Response(JSON.stringify({ error: `Tất cả models đều lỗi:\n${lastError}` }), {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      // Nếu không có cả Workers AI và Gemini API Key
      return new Response(JSON.stringify({
        error: "Chưa bật Workers AI (binding 'AI') hoặc chưa có GEMINI_API_KEY trong Cloudflare Settings -> Bindings!"
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
};
