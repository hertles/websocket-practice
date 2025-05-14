const WebSocket = require('ws');
const server = new WebSocket.Server({port: 7070});

const clients = new Map();
const clientNames = new Map();

function sendInfoBroadcast(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({type: 'info', message}));
        }
    });
}

server.on('connection', (ws) => {
    ws.on('message', (message) => {
        const messageJson = JSON.parse(String(message));
        const {type} = messageJson;
        switch (type) {
            case 'init': {
                const {sender} = messageJson;
                clients.set(sender, ws);
                clientNames.set(ws, sender);
                sendInfoBroadcast(`Пользователь ${sender} вошёл в чат`);
                ws.send(JSON.stringify({type: 'init.success'}));
                break;
            }
            case 'message': {
                const {sender, receiver, message: messageText} = messageJson;
                const receiverWs = clients.get(receiver);
                if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
                    receiverWs.send(JSON.stringify({type: 'message', sender, message: messageText}))
                }
                ws.send(JSON.stringify({type: 'message.success', sender, receiver, message: messageText}))
                break;
            }
            default:
                break;
        }

    });

    ws.on('close', () => {
        const clientName = clientNames.get(ws);
        clientNames.delete(ws);
        clients.delete(clientName);
        sendInfoBroadcast(`Пользователь ${clientName} вышел из чата`);
    });

    ws.send(JSON.stringify({type: 'info', message: 'Добро пожаловать! Введите имя и начните общаться'}));
});
