import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Chat,
  ChatMap,
  ChatMessage,
  WSMessage,
} from "../ChatClient.types.ts";
import { useSnackbar } from "notistack";
import { Paper, Typography } from "@mui/material";
import ChatMessageCard from "../components/ChatMessageCard/ChatMessageCard.tsx";

interface UseChatProps {
  currentUserName: string;
}

export default function useChat({ currentUserName }: UseChatProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [chatsMap, setChatsMap] = useState<ChatMap>({});
  const [message, setMessage] = useState("");
  const [selectedChatName, setSelectedChatName] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const incomingMessageAudio = useRef<HTMLAudioElement | null>(null);
  const currentChatIncomingMessageAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    incomingMessageAudio.current = new Audio(
      "src/assets/sounds/incomingMessage.wav",
    );
    currentChatIncomingMessageAudio.current = new Audio(
      "src/assets/sounds/currentChatIncomingMessage.mp3",
    );
  }, []);

  const showMessageNotification = (message: ChatMessage) => {
    enqueueSnackbar({
      content: (key: string | number) => (
        <Paper sx={{ width: "600px" }} elevation={4} key={key}>
          <ChatMessageCard
            message={message}
            onClick={() => {
              setSelectedChatName(message.sender);
              closeSnackbar(key);
            }}
          />
        </Paper>
      ),
    });
  };

  const showInfoNotification = (info: string) => {
    enqueueSnackbar({
      content: (key: string | number) => (
        <Paper sx={{ width: "600px", p: 2 }} elevation={4} key={key}>
          <Typography>{info}</Typography>
        </Paper>
      ),
      autoHideDuration: 2000,
    });
  };

  useEffect(() => {
    setSocket(new WebSocket("ws://localhost:7070"));

    window.addEventListener("beforeunload", () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket?.close(1000, "Страница закрыта");
      }
    });

    return () => {
      socket?.close();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.onopen = () => {
        console.log("[open] Соединение установлено");
      };

      socket.onmessage = (event) => {
        try {
          const messageJson: WSMessage = JSON.parse(event.data);
          switch (messageJson.type) {
            case "init.success":
              setAuthorized(true);
              setChatsMap(messageJson.receivers);
              break;
            case "message":
              const newMessage = {
                id: Date.now(),
                text: messageJson.message,
                sender: messageJson.sender,
                receiver: currentUserName,
              };
              if (selectedChatName === newMessage.sender) {
                currentChatIncomingMessageAudio.current?.play();
              } else {
                incomingMessageAudio.current?.play();
                showMessageNotification(newMessage);
              }
              setChatMessages((prev) => [...prev, newMessage]);
              break;
            case "message.success":
              setMessage("");
              setChatMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  text: messageJson.message,
                  sender: messageJson.sender,
                  receiver: messageJson.receiver,
                },
              ]);
              break;
            case "receiver.updated":
              setChatsMap((prevReceivers) => ({
                ...prevReceivers,
                [messageJson.receiver.name]: messageJson.receiver,
              }));
              break;
            case "info":
              showInfoNotification(messageJson.message);
              break;
            default:
              break;
          }
        } catch (err) {
          console.error("Ошибка при обработке сообщения:", err);
        }
      };

      socket.onclose = (event) => {
        if (event.wasClean) {
          console.log(`[close] Чистое закрытие: ${event.code} ${event.reason}`);
        } else {
          console.log("[close] Соединение прервано");
        }
      };

      socket.onerror = (err) => {
        console.log("[error]", err);
      };
    }
    return () => {
      if (socket) {
        socket.onopen = () => {};
        socket.onclose = () => {};
        socket.onerror = () => {};
      }
    };
  }, [socket, selectedChatName]);

  const handleChatSelect = useCallback((chat: Chat) => {
    setSelectedChatName(chat.name);
  }, []);

  const handleMessageChange = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
  }, []);

  const handleSendMessageToWs = useCallback(
    (data: string | ArrayBufferLike | Blob | ArrayBufferView) =>
      socket?.send(data),
    [socket],
  );

  const chats = useMemo(() => {
    return Object.values(chatsMap).filter(
      (chat) => chat.name && chat.name !== currentUserName,
    );
  }, [chatsMap]);

  const selectedChatMessages = useMemo(() => {
    return [...chatMessages]
      .filter(
        (msg) =>
          msg.sender === selectedChatName ||
          (msg.sender === currentUserName && msg.receiver === selectedChatName),
      )
      .reverse();
  }, [selectedChatName, chatMessages]);

  return {
    chatsMap,
    handleSendMessageToWs,
    selectedChatName,
    handleChatSelect,
    message,
    handleMessageChange,
    authorized,
    chats,
    selectedChatMessages,
  };
}
