// src/socket.ts
import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_EXPRESS_API_URL, {
  autoConnect: false, // important (we control when to connect)
});