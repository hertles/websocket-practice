import {
  type FormEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  ChatMessage,
  ChatMap,
  WSMessage,
  Chat,
} from "./ChatClient.types.ts";
import ChatMessageCard from "./components/ChatMessageCard/ChatMessageCard.tsx";
import { useSnackbar } from "notistack";
import ChatButton from "./components/ChatButton/ChatButton.tsx";

export default function ChatClient() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [currentUserName, setCurrentUserName] = useState("");
  const [chatsMap, setChatsMap] = useState<ChatMap>({});
  const [selectedChatName, setSelectedChatName] = useState("");
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const incomingMessageAudio = useRef<HTMLAudioElement | null>(null);
  const currentChatIncomingMessageAudio = useRef<HTMLAudioElement | null>(null);

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
    incomingMessageAudio.current = new Audio(
      "src/assets/sounds/incomingMessage.wav",
    );
    currentChatIncomingMessageAudio.current = new Audio(
      "src/assets/sounds/currentChatIncomingMessage.mp3",
    );
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

  const handleConnect: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    socket?.send(JSON.stringify({ type: "init", sender: currentUserName }));
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChatName(chat.name);
  };

  const handleSend: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    socket?.send(
      JSON.stringify({
        type: "message",
        sender: currentUserName,
        receiver: selectedChatName,
        message,
      }),
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: "100%" }}>
      <Stack spacing={2} mb={3}>
        <Typography variant="h5" gutterBottom align="center">
          Тестирование WebSocket
        </Typography>
        <Divider />
        {!connected && (
          <form onSubmit={handleConnect}>
            <Stack gap={2}>
              <TextField
                label="Ваше имя"
                value={currentUserName}
                onChange={(e) => setCurrentUserName(e.target.value)}
                fullWidth
              />
              <Button
                component="button"
                type="submit"
                variant="contained"
                disabled={!currentUserName}
              >
                Войти в чат
              </Button>
            </Stack>
          </form>
        )}

        {connected && (
          <>
            <Typography>
              Вы вошли как{" "}
              <Typography component="span" fontWeight="bold">
                {currentUserName}
              </Typography>
            </Typography>
            {Boolean(chats.length) ? (
              <Stack gap={2}>
                <Typography>Выберите получателя:</Typography>
                <Grid container spacing={1}>
                  {chats.map((chat) => (
                    <ChatButton
                      key={chat.name}
                      chat={chat}
                      isSelected={selectedChatName === chat.name}
                      onSelect={handleChatSelect}
                    />
                  ))}
                </Grid>
              </Stack>
            ) : (
              <Typography>
                Ожидание присоединения пользователей к чату...
              </Typography>
            )}
            {selectedChatName && (
              <>
                <form onSubmit={handleSend}>
                  <Stack gap={2}>
                    <TextField
                      label="Сообщение"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      fullWidth
                    />
                    <Button
                      component="button"
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={!message}
                    >
                      Отправить сообщение
                    </Button>
                  </Stack>
                </form>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Сообщения
                  </Typography>
                  {Boolean(selectedChatMessages.length) ? (
                    <Stack spacing={1} maxHeight={300} overflow="auto">
                      {selectedChatMessages.map((message) => (
                        <Grid key={message.id} flexShrink={0} pr={1}>
                          <ChatMessageCard message={message} />
                        </Grid>
                      ))}
                    </Stack>
                  ) : (
                    <Typography>
                      Начните общаться с {selectedChatName}
                    </Typography>
                  )}
                </Paper>
              </>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
