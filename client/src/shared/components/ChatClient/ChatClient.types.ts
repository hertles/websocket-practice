interface Chat {
  name: string;
  isOnline: boolean;
}

export type ChatMap = Record<string, Chat>;

export type WSMessage =
  | { type: "init.success"; receivers: ChatMap }
  | { type: "message"; sender: string; message: string }
  | {
      type: "message.success";
      sender: string;
      receiver: string;
      message: string;
    }
  | { type: "info"; message: string }
  | { type: "receiver.updated"; receiver: Chat };

export interface ChatMessage {
  id: number;
  sender: string;
  receiver: string;
  text: string;
}
