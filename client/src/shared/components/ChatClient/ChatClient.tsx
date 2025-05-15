import { useState } from "react";
import { Divider, Paper, Stack, Typography } from "@mui/material";
import useChat from "./hooks/useChat.tsx";
import AuthForm from "./components/AuthForm/AuthForm.tsx";
import ChatList from "./components/ChatList/ChatList.tsx";
import MessageForm from "./components/MessageForm/MessageForm.tsx";
import MessageList from "./components/MessageList/MessageList.tsx";

export default function ChatClient() {
  const [currentUserName, setCurrentUserName] = useState("");

  const {
    handleSendMessageToWs,
    selectedChatName,
    message,
    handleChatSelect,
    handleMessageChange,
    selectedChatMessages,
    authorized,
    chats,
  } = useChat({ currentUserName });

  const handleAuth = (nextUserName: string) => {
    setCurrentUserName(nextUserName);
    handleSendMessageToWs(
      JSON.stringify({ type: "init", sender: nextUserName }),
    );
  };

  const handleSend = (nextMessage: string) => {
    handleSendMessageToWs(
      JSON.stringify({
        type: "message",
        sender: currentUserName,
        receiver: selectedChatName,
        message: nextMessage,
      }),
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: "100%" }}>
      <Stack spacing={2} mb={3}>
        <Typography variant="h5" gutterBottom align="center">
          Чат на WebSocket
        </Typography>
        <Divider />
        {authorized ? (
          <>
            <Typography>
              Вы вошли как{" "}
              <Typography component="span" fontWeight="bold">
                {currentUserName}
              </Typography>
            </Typography>
            <ChatList
              chats={chats}
              selectedChatName={selectedChatName}
              onChatSelect={handleChatSelect}
            />
            {selectedChatName && (
              <>
                <MessageForm
                  message={message}
                  onMessageChange={handleMessageChange}
                  onSubmit={handleSend}
                />
                <MessageList
                  messages={selectedChatMessages}
                  selectedChatName={selectedChatName}
                />
              </>
            )}
          </>
        ) : (
          <AuthForm onSubmit={handleAuth} />
        )}
      </Stack>
    </Paper>
  );
}
