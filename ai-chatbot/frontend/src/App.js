import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [docUrl, setDocUrl] = useState("");
  const [docLoaded, setDocLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDocLoaded(false);
    try {
      await axios.post("http://localhost:8000/upload_doc_url", { url: docUrl });
      setDocLoaded(true);
      setMessages([]);
    } catch (err) {
      setError("Failed to load documentation. Please check the URL.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    const newMessages = [...messages, { user: input }];
    setMessages(newMessages);
    setInput("");
    try {
      const res = await axios.post("http://localhost:8000/chat", {
        message: input,
        history: newMessages.slice(0, -1),
      });
      setMessages([...newMessages, { ai: res.data.response }]);
    } catch (err) {
      setMessages([...newMessages, { ai: "[Error: Unable to get response]" }]);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <h2>API Doc Chatbot</h2>
      <form onSubmit={handleDocSubmit} className="doc-form">
        <input
          type="text"
          placeholder="Paste API documentation URL (e.g. https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml)"
          value={docUrl}
          onChange={(e) => setDocUrl(e.target.value)}
          className="doc-url-input"
        />
        <button type="submit">Load Docs</button>
      </form>
      {error && <div className="error">{error}</div>}
      {docLoaded ? (
        <div className="chat-window">
          <div className="messages">
            {messages.map((msg, idx) =>
              msg.user ? (
                <div key={idx} className="user-msg">
                  <b>You:</b> {msg.user}
                </div>
              ) : (
                <div key={idx} className="ai-msg">
                  <b>AI:</b> {msg.ai}
                </div>
              )
            )}
            {loading && <div className="ai-msg">AI is typing...</div>}
          </div>
          <form onSubmit={handleSend} className="input-form">
            <input
              type="text"
              placeholder="Ask about the API docs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="chat-input"
            />
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      ) : (
        <div className="info">Please load API documentation to start chatting.</div>
      )}
    </div>
  );
}

export default App;
