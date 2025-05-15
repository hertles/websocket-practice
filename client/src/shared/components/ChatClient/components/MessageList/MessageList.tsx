import { Grid, Paper, Stack, Typography } from "@mui/material";
import ChatMessageCard from "../ChatMessageCard/ChatMessageCard.tsx";
import type { ChatMessage } from "../../ChatClient.types.ts";

interface MessageListProps {
  messages: ChatMessage[];
  selectedChatName: string;
}

export default function MessageList(props: MessageListProps) {
  const { messages, selectedChatName } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Сообщения
      </Typography>
      {Boolean(messages.length) ? (
        <Stack spacing={1} maxHeight={300} overflow="auto">
          {messages.map((message) => (
            <Grid key={message.id} flexShrink={0} pr={1}>
              <ChatMessageCard message={message} />
            </Grid>
          ))}
        </Stack>
      ) : (
        <Typography>Начните общаться с {selectedChatName}</Typography>
      )}
    </Paper>
  );
}
