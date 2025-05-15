import { Button, Stack, TextField } from "@mui/material";
import { type FormEventHandler, useState } from "react";

interface AuthFormProps {
  onSubmit: (userName: string) => void;
}

export default function AuthForm(props: AuthFormProps) {
  const { onSubmit } = props;

  const [userName, setUserName] = useState("");

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    onSubmit(userName);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={2}>
        <TextField
          label="Ваше имя"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          fullWidth
        />
        <Button
          component="button"
          type="submit"
          variant="contained"
          disabled={!userName}
        >
          Войти в чат
        </Button>
      </Stack>
    </form>
  );
}
