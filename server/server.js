const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 7070 });

const clientsWs = new Map();
const clients = new Map();

function broadcastSend(message) {
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

server.on("connection", (ws) => {
  ws.on("message", (message) => {
    const messageJson = JSON.parse(String(message));
    const { type } = messageJson;
    switch (type) {
      case "init": {
        const { sender } = messageJson;
        const newClientData = { name: sender, isOnline: true };
        clientsWs.set(sender, ws);
        clients.set(ws, newClientData);
        broadcastSend({
          type: "info",
          message: `Пользователь ${sender} вошёл в чат`,
        });
        broadcastSend({
          type: "receiver.updated",
          receiver: newClientData,
        });
        ws.send(
          JSON.stringify({
            type: "init.success",
            receivers: Object.fromEntries(
              [...clients.entries()].map(([_, client]) => [
                client.name,
                client,
              ]),
            ),
          }),
        );
        break;
      }
      case "message": {
        const { sender, receiver, message: messageText } = messageJson;
        const receiverWs = clientsWs.get(receiver);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          receiverWs.send(
            JSON.stringify({ type: "message", sender, message: messageText }),
          );
        }
        ws.send(
          JSON.stringify({
            type: "message.success",
            sender,
            receiver,
            message: messageText,
          }),
        );
        break;
      }
      default:
        break;
    }
  });

  ws.on("close", () => {
    const client = clients.get(ws);
    if (client) {
      const leavedClientData = { ...client, isOnline: false };
      clients.set(ws, leavedClientData);
      clientsWs.delete(client.name);
      broadcastSend({
        type: "receiver.updated",
        receiver: leavedClientData,
      });
      broadcastSend({
        type: "info",
        message: `Пользователь ${client.name} вышел из чата`,
      });
    }
  });

  ws.send(
    JSON.stringify({
      type: "info",
      message: "Добро пожаловать! Введите имя и начните общаться",
    }),
  );
});
