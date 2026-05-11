// src/components/Chat.tsx
import { socket } from "@/app/socket";
import "./Chat.css";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";

interface Message {
  roomId: string;
  message: string;
  senderId: string;
  receiverId: string;
  sender: string;
}

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { data: session } = useSession();
  // 🔑 hardcoded users for now (replace later)
  const user1Id = session?.user?.id;
  const user2Id = session?.user?.connections?.[0]?.userId; // first connection

  const roomId = [user1Id, user2Id].sort().join("_");

  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`https://go-renovate-server.onrender.com/rooms/${roomId}`);

        const data = await res.json();

        setMessages(data.messages);
      } catch (error) {
        console.log(error);
      }
    };

    fetchMessages();
  }, [roomId]);

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
      roomId: roomId,
      message: message,
      sender: session?.user?.name || "",
      senderId: user1Id?.toString() || "",
      receiverId: user2Id?.toString() || "",
    };

    // send to backend
    socket.emit("send_message", messageData);

    // show instantly in sender UI
    setMessages((prev) => [...prev, messageData]);

    setMessage("");
  };

  return (
    <div className="chat-container">
      <h2>Chat</h2>
      <div className="message-container">
        {messages.map((msg, index) => (
          <p key={index} className="message">
            <b>{msg.sender}:</b> {msg.message}
          </p>
        ))}
      </div>
      <div className="chat-input-container">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type message..."
          className="chat-input"
        />

        <button className="chat-send" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
