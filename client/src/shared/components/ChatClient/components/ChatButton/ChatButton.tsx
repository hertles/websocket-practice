import { Chip, Tooltip } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import type { Chat } from "../../ChatClient.types.ts";

interface ChatButtonProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: (chat: Chat) => void;
}

export default function ChatButton(props: ChatButtonProps) {
  const { chat, isSelected, onSelect: handleSelect } = props;

  return (
    <Tooltip
      key={chat.name}
      title={chat.isOnline ? "Пользователь в сети" : "Пользователь не в сети"}
      arrow
    >
      <Chip
        key={chat.name}
        icon={chat.isOnline ? <CircleIcon fontSize="small" /> : undefined}
        label={chat.name}
        color={isSelected ? "primary" : undefined}
        onClick={() => handleSelect(chat)}
      />
    </Tooltip>
  );
}
