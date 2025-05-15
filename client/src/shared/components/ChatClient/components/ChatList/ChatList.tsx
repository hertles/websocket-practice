import { Grid, Stack, Typography } from "@mui/material";
import ChatButton from "./components/ChatButton/ChatButton.tsx";
import type { Chat } from "../../ChatClient.types.ts";

interface ChatListProps {
  chats: Chat[];
  selectedChatName: string;
  onChatSelect: (chat: Chat) => void;
}

export default function ChatList(props: ChatListProps) {
  const { chats, selectedChatName, onChatSelect: handleChatSelect } = props;

  return Boolean(chats.length) ? (
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
    <Typography>Ожидание присоединения пользователей к чату...</Typography>
  );
}
