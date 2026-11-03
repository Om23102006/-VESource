import { useEffect, useState, useRef, useContext } from "react";
import { io } from "socket.io-client";
import { UserContext } from "../context/UserContext";
import Navbar from "./Navbar";
import useDocumentTitle from "../hooks/useDocumentTitle";

let socket;

function Chat() {
  useDocumentTitle("VESource — Live Student Community Chat");
  const { user } = useContext(UserContext);

  const [username, setUsername] = useState(user ? user.name : "");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(Boolean(user));
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("chatMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) setJoined(true);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !username.trim() || !connected) return;
    socket.emit("chatMessage", {
      username: username.trim(),
      message: message.trim(),
    });
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1F2937]">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#C90000]">
                EXPERIMENT 8: WEBSOCKETS (SOCKET.IO)
              </span>
              <h2 className="text-2xl font-bold text-[#1F2937] mt-0.5">
                Live Student Helpdesk Chat
              </h2>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                connected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {connected ? "● Connected" : "○ Disconnected"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time multi-client communication using Socket.IO broadcast channels.
          </p>
        </div>

        {!joined ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-7 shadow-sm">
            <h3 className="text-sm font-bold text-[#1F2937] mb-2">
              Enter your name to join student chat
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Ask fellow students questions about scholarship schemes, document attested copies, or verification deadlines.
            </p>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name / Roll number"
                required
                className="flex-1 rounded-lg border border-[#E5E7EB] px-3.5 py-2 text-xs outline-none focus:border-[#C90000]"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#C90000] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Join Chat
              </button>
            </form>
          </div>
        ) : (
          <div
            className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm flex flex-col"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="border-b border-[#E5E7EB] px-5 py-3 flex items-center justify-between bg-[#F8F8F6] rounded-t-xl">
              <div>
                <p className="text-xs font-semibold text-gray-700">
                  Chatting as: <span className="font-bold text-[#C90000]">{username}</span>
                </p>
              </div>
              {!user && (
                <button
                  onClick={() => setJoined(false)}
                  className="text-[11px] text-gray-500 hover:text-gray-700 underline"
                >
                  Change Name
                </button>
              )}
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-16">
                  <p className="text-2xl mb-1">💬</p>
                  No messages in this session yet. Say hello to start the conversation!
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMine = msg.username === username;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] text-gray-400 mb-0.5 px-1">
                      {msg.username} •{" "}
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div
                      className={`max-w-xs sm:max-w-md rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                        isMine
                          ? "bg-[#C90000] text-white rounded-br-none"
                          : "bg-gray-100 text-[#1F2937] rounded-bl-none"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={sendMessage}
              className="border-t border-[#E5E7EB] p-3 flex gap-2 bg-white rounded-b-xl"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  connected
                    ? "Type your question or message here..."
                    : "Connecting to Socket.IO server..."
                }
                disabled={!connected}
                className="flex-1 rounded-lg border border-[#E5E7EB] px-3.5 py-2 text-xs outline-none focus:border-[#C90000] disabled:bg-gray-50"
              />
              <button
                type="submit"
                disabled={!connected || !message.trim()}
                className="rounded-lg bg-[#C90000] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default Chat;
