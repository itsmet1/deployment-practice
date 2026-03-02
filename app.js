// app.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const { GoogleGenAI } = require("@google/genai");
const { port, message, geminiApiKey } = require("./config");

const app = express();
app.use(express.json());

/* ---------------- Gemini Client ---------------- */
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

/* ---------------- Rate Limiting ---------------- */
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Too many requests. Try again later." }
});
app.use("/ask-ai", limiter);

/* ---------------- HTML Frontend ---------------- */
const html = `
<!DOCTYPE html>
<html>
<head>
<title>Gemini Chat Demo</title>
<style>
body { font-family: sans-serif; background: #f4f6f8; display: flex; justify-content: center; align-items: center; height: 100vh; }
#chat-container { width: 400px; height: 600px; background: white; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
#chat { flex: 1; padding: 15px; overflow-y: auto; }
.message { margin: 10px 0; padding: 10px; border-radius: 8px; max-width: 80%; white-space: pre-wrap; }
.user { background: #007bff; color: white; align-self: flex-end; margin-left: auto; }
.ai { background: #e9ecef; color: black; }
#input-area { display: flex; border-top: 1px solid #ddd; }
input { flex: 1; border: none; padding: 12px; font-size: 16px; outline: none; }
button { border: none; background: #007bff; color: white; padding: 12px 18px; cursor: pointer; }
</style>
</head>
<body>
<div id="chat-container">
  <div id="chat"></div>
  <div id="input-area">
    <input id="prompt" placeholder="Ask Gemini..." />
    <button onclick="sendMessage()">Send</button>
  </div>
</div>
<script>
const chat = document.getElementById("chat");
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
async function sendMessage() {
  const input = document.getElementById("prompt");
  const message = input.value.trim();
  if (!message) return;
  addMessage(message, "user");
  input.value = "";
  addMessage("Thinking...", "ai");
  const res = await fetch("/ask-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  chat.lastChild.remove();
  addMessage(data.reply || data.error, "ai");
}
document.getElementById("prompt").addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendMessage();
});
</script>
</body>
</html>
`;

/* ---------------- Routes ---------------- */
app.get("/", (req, res) => res.type("html").send(html));

app.post("/ask-ai", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: "Message is required" });

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage
    });

    res.json({ reply: result.text });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "AI request failed" });
  }
});

/* ---------------- Server ---------------- */
const server = app.listen(port, () => console.log(`Server running on port ${port}`));
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;