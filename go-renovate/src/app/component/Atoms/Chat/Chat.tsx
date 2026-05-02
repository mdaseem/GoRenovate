// src/components/Chat.tsx
import { socket } from "@/app/socket";
import { useEffect, useState } from "react";

interface Message {
  roomId: string;
  message: string;
  sender: string;
}

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // 🔑 hardcoded users for now (replace later)
  const user1Id = "A";
  const user2Id = "B";

  const roomId = [user1Id, user2Id].sort().join("_");

  useEffect(() => {
    // connect socket
    socket.connect();

    // join room
    socket.emit("join_room", roomId);

    // listen for messages
    socket.on("receive_message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    // cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    const messageData: Message = {
      roomId,
      message,
      sender: user1Id,
    };

    // send to backend
    socket.emit("send_message", messageData);

    // show instantly in sender UI
    setMessages((prev) => [...prev, messageData]);

    setMessage("");
  };

  return (
    <div>
      <h2>Chat</h2>

      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            <b>{msg.sender}:</b> {msg.message}
          </p>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;