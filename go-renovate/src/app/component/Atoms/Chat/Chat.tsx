import { socket } from "@/app/socket";
import "./Chat.css";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { RootState } from "@/app/store/store";
import { useAppSelector } from "@/app/store/hooks";
import { Loader2 } from "../../Molecules/Loader/Loader";
import ErrorState from "../ErrorState/ErrorState";

interface Message {
  roomId: string;
  message: string;
  senderId: string;
  receiverId: string;
  sender: string;
  updatedAt: string;
  createdAt?: string;
}

const PAGE_SIZE = 30;
const NEAR_TOP_THRESHOLD = 60;
const NEAR_BOTTOM_THRESHOLD = 80;

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const { data: session } = useSession();
  const isChatOpen = useAppSelector(
    (state: RootState) => state.overlay.isOpenChat,
  );

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);

  const user1Id = session?.user?.id;
  const user2Id = session?.user?.connections?.[0]?.userId; // first connection

  let roomId = [user1Id, user2Id].sort().join("_");
  if (!user2Id) {
    roomId = "public";
  }

  const fetchLatestMessages = async () => {
    setIsLoadingMessages(true);
    setLoadError(null);
    isInitialLoadRef.current = true;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/rooms/${roomId}?limit=${PAGE_SIZE}`,
      );

      if (!res.ok) {
        throw new Error(`Failed to load messages (${res.status})`);
      }

      const data = await res.json();

      setMessages(data?.messages ?? []);
      setHasMoreMessages(Boolean(data?.hasMore));
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
      setLoadError("Couldn't load messages. Please try again.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const fetchOlderMessages = async () => {
    const oldest = messages[0];
    if (!oldest || isLoadingOlder || !hasMoreMessages) return;

    const cursor = oldest.createdAt || oldest.updatedAt;
    const container = messageContainerRef.current;
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
      prevScrollTopRef.current = container.scrollTop;
    }

    setIsLoadingOlder(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/rooms/${roomId}?limit=${PAGE_SIZE}&before=${encodeURIComponent(cursor)}`,
      );

      if (!res.ok) {
        throw new Error(`Failed to load older messages (${res.status})`);
      }

      const data = await res.json();
      const older: Message[] = data?.messages ?? [];

      if (older.length) {
        setMessages((prev) => [...older, ...prev]);
      }
      setHasMoreMessages(Boolean(data?.hasMore));
    } catch (error) {
      console.error("Failed to fetch older chat messages:", error);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    if (messages.length === 0) {
      fetchLatestMessages();
    }
  }, [roomId]);

  useLayoutEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    if (isInitialLoadRef.current) {
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
      return;
    }

    if (prevScrollHeightRef.current) {
      container.scrollTop =
        container.scrollHeight -
        prevScrollHeightRef.current +
        prevScrollTopRef.current;
      prevScrollHeightRef.current = 0;
      return;
    }

    if (shouldStickToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleMessagesScroll = () => {
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;

      const container = messageContainerRef.current;
      if (!container) return;

      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      shouldStickToBottomRef.current =
        distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
      setShowScrollToBottom(distanceFromBottom >= NEAR_BOTTOM_THRESHOLD);

      if (container.scrollTop < NEAR_TOP_THRESHOLD) {
        fetchOlderMessages();
      }
    });
  };

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const scrollToLatestMessage = () => {
    const container = messageContainerRef.current;
    if (!container) return;

    shouldStickToBottomRef.current = true;
    setShowScrollToBottom(false);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    if (!(((user1Id && user2Id) || session) && isChatOpen)) return;

    // connect socket
    socket.connect();

    // join room
    socket.emit("join_room", roomId);

    // listen for messages
    const handleReceiveMessage = (data: Message) => {
      if (data.senderId === user1Id?.toString()) return;
      setMessages((prev) => [...prev, data]);
    };
    socket.on("receive_message", handleReceiveMessage);
    setIsConnected(true);

    // cleanup
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.disconnect();
      setIsConnected(false);
    };
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

    shouldStickToBottomRef.current = true;

    // show instantly in sender UI
    setMessages((prev) => [...prev, messageData]);

    setMessage("");
  };

  const renderedMessages = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let lastDateLabel = "";

    return messages?.map((msg, index) => {
      const msgDate = new Date(msg?.updatedAt);
      const msgDayStart = new Date(
        msgDate.getFullYear(),
        msgDate.getMonth(),
        msgDate.getDate(),
      ).getTime();
      const diffDays = Math.round(
        (todayStart.getTime() - msgDayStart) / 86400000,
      );

      let dateLabel: string;
      if (diffDays === 0) {
        dateLabel = "Today";
      } else if (diffDays === 1) {
        dateLabel = "Yesterday";
      } else {
        dateLabel = msgDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year:
            msgDate.getFullYear() !== todayStart.getFullYear()
              ? "numeric"
              : undefined,
        });
      }

      const showDateSeparator = dateLabel !== lastDateLabel;
      lastDateLabel = dateLabel;

      return (
        <Fragment key={index}>
          {showDateSeparator && (
            <div className="date-separator">
              <span>{dateLabel}</span>
            </div>
          )}
          <p
            className={`message ${msg?.senderId === user1Id?.toString() ? "sent" : "received"}`}
          >
            <b>{msg?.sender}:</b> {msg?.message}
            <span className="time-sent">
              {msgDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </p>
        </Fragment>
      );
    });
  }, [messages, user1Id]);

  if (!session) {
    return (
      <ErrorState
        title="You're signed out"
        message="Please sign in again to use chat."
      />
    );
  }

  if (loadError && !messages.length) {
    return (
      <ErrorState
        title="Couldn't load chat"
        message={loadError}
        actionLabel="Retry"
        onAction={fetchLatestMessages}
      />
    );
  }

  if (isLoadingMessages && !messages.length && isChatOpen) return <Loader2 />;

  return (
    <div className="main-chat-container">
      <div className="chat-container">
        <h2 className="chat-heading">Chat</h2>
        <div className="message-area">
          <div
            className="message-container"
            ref={messageContainerRef}
            onScroll={handleMessagesScroll}
          >
            {isLoadingOlder && (
              <div className="messages-top-status">
                <span className="chat-spinner" aria-hidden="true" />
              </div>
            )}
            {!hasMoreMessages && messages.length > 0 && (
              <div className="date-separator">
                <span>Beginning of conversation</span>
              </div>
            )}
            {renderedMessages}
          </div>
          {showScrollToBottom && (
            <button
              type="button"
              className="scroll-to-bottom-btn"
              onClick={scrollToLatestMessage}
              aria-label="Scroll to latest message"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
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
