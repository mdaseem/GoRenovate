import { socket } from "@/app/socket";
import "./Chat.css";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { RootState } from "@/app/store/store";
import { useAppSelector } from "@/app/store/hooks";
import { Loader2 } from "../../Molecules/Loader/Loader";

interface Message {
  roomId: string;
  message: string;
  senderId: string;
  receiverId: string;
  sender: string;
  updatedAt: string;
}

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();
  const isChatOpen = useAppSelector(
    (state: RootState) => state.overlay.isOpenChat,
  );

  const user1Id = session?.user?.id;
  const user2Id = session?.user?.connections?.[0]?.userId; // first connection
  let roomId = [user1Id, user2Id].sort().join("_");
  if (!user2Id) {
    roomId = "public";
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/rooms/${roomId}`,
      );

      const data = await res.json();

      setMessages(data.messages);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    if (messages.length === 0) {
      fetchMessages();
    }
  }, [roomId]);

  useEffect(() => {
    if (((user1Id && user2Id) || session) && isChatOpen) {
      // connect socket
      socket.connect();

      // join room
      socket.emit("join_room", roomId);

      // listen for messages
      socket.on("receive_message", (data: Message) => {
        setMessages((prev) => {
          fetchMessages();
          return [...prev, data];
        });
      });
      setIsConnected(true);
      if (!isChatOpen && isConnected) {
        // cleanup
        return () => {
          socket.disconnect();
          setIsConnected(false);
        };
      }
    }
  }, [session, user1Id, user2Id, isChatOpen]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const messageData: Message = {
      roomId: roomId,
      message: message,
      sender: session?.user?.name || "",
      senderId: user1Id?.toString() || "",
      receiverId: user2Id?.toString() || "unknown",
      updatedAt: new Date().toISOString(),
    };

    // send to backend
    socket.emit("send_message", messageData);

    // show instantly in sender UI
    setMessages((prev) => [...prev, messageData]);

    setMessage("");
  };

  if (!session) return "Something went wrong";
  if (!messages.length && isChatOpen) return <Loader2 />;

  return (
    <div className="main-chat-container">
      <div className="chat-container">
        <h2 className="chat-heading">Chat</h2>
        <div className="message-container">
          {messages?.map((msg, index) => (
            <p
              key={index}
              className={`message ${msg?.senderId === user1Id?.toString() ? "sent" : "received"}`}
            >
              <b>{msg?.sender}:</b> {msg?.message}
              <span className="time-sent">
                {new Date(msg?.updatedAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </p>
          ))}
        </div>
      </div>
      <div className="chat-input-container">
        <input
          value={message}
          disabled={!isConnected}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
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
