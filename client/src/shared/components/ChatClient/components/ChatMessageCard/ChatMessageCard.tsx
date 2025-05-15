import { Avatar, Card, CardActionArea, Grid, Typography } from "@mui/material";
import type { ChatMessage } from "../../ChatClient.types.ts";

interface ChatMessageCardProps {
  message: ChatMessage;
  onClick?: (message: ChatMessage) => void;
}

export default function ChatMessageCard(props: ChatMessageCardProps) {
  const { message, onClick: handleClick } = props;

  return (
    <Card variant="outlined">
      <CardActionArea
        sx={{ p: 2 }}
        disabled={!handleClick}
        onClick={() => handleClick?.(message)}
      >
        <Grid container spacing={2}>
          <Avatar />
          <Grid>
            <Typography variant="subtitle2" color="text.secondary">
              {message.sender}
            </Typography>
            <Typography variant="body1">{message.text}</Typography>
          </Grid>
        </Grid>
      </CardActionArea>
    </Card>
  );
}
