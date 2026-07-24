import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AIChatDisplayMessage {
  sender: "user" | "ai";
  text: string;
}

// Opaque conversation history in the shape the backend's /ai/chat expects
// and returns (Anthropic message params) — never rendered directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AIChatApiMessage = any;

interface AIChatState {
  displayMessages: AIChatDisplayMessage[];
  apiHistory: AIChatApiMessage[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AIChatState = {
  displayMessages: [],
  apiHistory: [],
  isLoading: false,
  error: null,
};

export const aiChatSlice = createSlice({
  name: "aiChat",
  initialState,
  reducers: {
    sendAIChatMessage: (
      state,
      action: PayloadAction<{ text: string; token: string }>,
    ) => {
      state.displayMessages.push({ sender: "user", text: action.payload.text });
      state.apiHistory.push({ role: "user", content: action.payload.text });
      state.isLoading = true;
      state.error = null;
    },
    setAIChatReply: (
      state,
      action: PayloadAction<{ reply: string; messages: AIChatApiMessage[] }>,
    ) => {
      state.displayMessages.push({
        sender: "ai",
        text: action.payload.reply || "(no response)",
      });
      state.apiHistory = action.payload.messages;
      state.isLoading = false;
    },
    setAIChatError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearAIChatError: (state) => {
      state.error = null;
    },
    resetAIChat: () => initialState,
  },
});

export const {
  sendAIChatMessage,
  setAIChatReply,
  setAIChatError,
  clearAIChatError,
  resetAIChat,
} = aiChatSlice.actions;
export default aiChatSlice.reducer;
