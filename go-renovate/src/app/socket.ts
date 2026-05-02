// src/socket.ts
import { io } from "socket.io-client";

export const socket = io("https://go-renovate-server.onrender.com", {
  autoConnect: false, // important (we control when to connect)
});