"use client";
import "./AIChat.css";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  clearAIChatError,
  sendAIChatMessage,
} from "@/app/store/features/aiChatSlice";
import { RootState } from "@/app/store/store";
import ErrorState from "../ErrorState/ErrorState";

const AIChat = () => {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { displayMessages, isLoading, error } = useAppSelector(
    (state: RootState) => state.aiChat,
  );
  const [input, setInput] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [displayMessages.length, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    if (!session?.backendToken) {
      return;
    }

    dispatch(sendAIChatMessage({ text, token: session.backendToken }));
    setInput("");
  };

  if (!session) {
    return (
      <ErrorState
        title="You're signed out"
        message="Please sign in again to use the assistant."
      />
    );
  }

  return (
    <div className="ai-chat-main-container">
      <div className="ai-chat-container">
        <h2 className="ai-chat-heading" id="ai-chat-heading">
          Ask AI
        </h2>
        <div
          className="ai-chat-message-container"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-labelledby="ai-chat-heading"
        >
          {displayMessages.length === 0 && !error && (
            <p className="ai-chat-empty-state">
              Ask about vendors, services, or products — e.g. &ldquo;Find
              painters near Koramangala&rdquo;.
            </p>
          )}
          {displayMessages.map((msg, index) => (
            <p
              key={index}
              className={`ai-chat-message ${
                msg.sender === "user"
                  ? "ai-chat-message-sent"
                  : "ai-chat-message-received"
              }`}
            >
              <span className="ai-chat-message-sender">
                {msg.sender === "user" ? "You" : "Assistant"}
              </span>
              {msg.text}
            </p>
          ))}
          {isLoading && (
            <p className="ai-chat-message ai-chat-message-pending">
              <span className="ai-chat-typing-dot" />
              <span className="ai-chat-typing-dot" />
              <span className="ai-chat-typing-dot" />
              <span className="ai-chat-visually-hidden">
                Assistant is thinking
              </span>
            </p>
          )}
          {error && (
            <ErrorState
              title="Something went wrong"
              message={error}
              actionLabel="Dismiss"
              onAction={() => dispatch(clearAIChatError())}
            />
          )}
          <div ref={messageEndRef} />
        </div>
      </div>
      <form className="ai-chat-input-container" onSubmit={handleSubmit}>
        <label htmlFor="ai-chat-input" className="ai-chat-visually-hidden">
          Message the assistant
        </label>
        <input
          id="ai-chat-input"
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="ai-chat-input"
          autoComplete="off"
        />
        <button
          type="submit"
          className="ai-chat-send"
          disabled={isLoading || !input.trim()}
          aria-busy={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat;
