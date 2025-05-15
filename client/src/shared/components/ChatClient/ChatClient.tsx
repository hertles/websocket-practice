import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import type { ChatMessage, ChatMap, WSMessage } from "./ChatClient.types.ts";
import ChatMessageCard from "./components/ChatMessageCard/ChatMessageCard.tsx";
import { useSnackbar } from "notistack";

export default function ChatClient() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [sender, setSender] = useState("");
  const [chatsMap, setChatsMap] = useState<ChatMap>({});
  const [selectedChat, setSelectedChat] = useState("");
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const incomingMessageAudio = useRef<HTMLAudioElement | null>(null);
  const currentChatIncomingMessageAudio = useRef<HTMLAudioElement | null>(null);

  const chats = useMemo(() => {
    return Object.values(chatsMap).filter(
      (receiver) => receiver.name && receiver.name !== sender,
    );
  }, [chatsMap]);

  const selectedChatMessages = useMemo(() => {
    return [...chatMessages]
      .filter(
        (msg) =>
          msg.sender === selectedChat ||
          (msg.sender === sender && msg.receiver === selectedChat),
      )
      .reverse();
  }, [selectedChat, chatMessages]);

  const showMessageNotification = (message: ChatMessage) => {
      enqueueSnackbar({
        content: (key: string | number) => (
          <Paper sx={{ width: "600px" }} elevation={4} key={key}>
            <ChatMessageCard
              message={message}
              onClick={() => {
                setSelectedChat(message.sender);
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
      autoHideDuration: 2000
    });
  };

  useEffect(() => {
    incomingMessageAudio.current = new Audio("src/assets/sounds/incomingMessage.wav");
    currentChatIncomingMessageAudio.current = new Audio("src/assets/sounds/currentChatIncomingMessage.mp3");
  }, []);

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
              setConnected(true);
              setChatsMap(messageJson.receivers);
              break;
            case "message":
              const newMessage = {
                id: Date.now(),
                text: messageJson.message,
                sender: messageJson.sender,
                receiver: sender,
              };
              if (selectedChat === newMessage.sender) {
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
  }, [socket, selectedChat]);

  const handleConnect = () => {
    socket?.send(JSON.stringify({ type: "init", sender }));
  };

  const handleSend = () => {
    socket?.send(
      JSON.stringify({
        type: "message",
        sender,
        receiver: selectedChat,
        message,
      }),
    );
  };

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
        p={2}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: "100%" }}>
          <Stack spacing={2} mb={3}>
            <Typography variant="h5" gutterBottom align="center">
              Тестирование WebSocket
            </Typography>
            <Divider />
            {!connected && (
              <>
                <TextField
                  label="Ваше имя"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handleConnect}
                  disabled={!sender}
                >
                  Войти в чат
                </Button>
              </>
            )}

            {connected && (
              <>
                <Typography>
                  Вы вошли как{" "}
                  <span style={{ fontWeight: "bold" }}>{sender}</span>{" "}
                </Typography>
                {Boolean(chats.length) ? (
                  <Stack gap={2}>
                    <Typography>Выберите получателя:</Typography>
                    <Grid container spacing={2}>
                      {chats.map((chat) => (
                        <Tooltip
                          key={chat.name}
                          title={
                            chat.isOnline
                              ? "Пользователь в сети"
                              : "Пользователь не в сети"
                          }
                          arrow
                        >
                          <Chip
                            key={chat.name}
                            icon={
                              chat.isOnline ? (
                                <CircleIcon fontSize="small" />
                              ) : undefined
                            }
                            label={chat.name}
                            color={
                              selectedChat === chat.name ? "primary" : undefined
                            }
                            onClick={() => setSelectedChat(chat.name)}
                          />
                        </Tooltip>
                      ))}
                    </Grid>
                  </Stack>
                ) : (
                  <Typography>
                    Ожидание присоединения пользователей к чату...
                  </Typography>
                )}
                {selectedChat && (
                  <>
                    <TextField
                      label="Сообщение"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSend}
                      disabled={!selectedChat || !message}
                    >
                      Отправить сообщение
                    </Button>
                    {Boolean(selectedChatMessages.length) && (
                      <>
                        <Typography variant="h6" gutterBottom>
                          Сообщения
                        </Typography>
                        <Stack spacing={2} maxHeight={300} overflow="auto">
                          {selectedChatMessages.map((message) => (
                            <Grid key={message.id} flexShrink={0} pr={1}>
                              <ChatMessageCard message={message} />
                            </Grid>
                          ))}
                        </Stack>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </Stack>
        </Paper>
      </Box>
    </>
  );
}
