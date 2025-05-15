import { Button, Stack, TextField } from "@mui/material";
import type { FormEventHandler } from "react";

interface MessageFormProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: (message: string) => void;
}

export default function MessageForm(props: MessageFormProps) {
  const { message, onMessageChange: handleMessageChange, onSubmit } = props;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    onSubmit(message);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={2}>
        <TextField
          label="Сообщение"
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
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
  );
}
