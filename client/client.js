let socket = new WebSocket("ws://localhost:7070");

socket.onopen = function () {
    console.log("[open] Соединение установлено");
};

function appendMessage(sender, message) {
    document.querySelector('#message-container').innerHTML += `<div><strong>${sender}</strong>: ${message}</div>`;
}

socket.onmessage = function (event) {
    const messageJson = JSON.parse(String(event.data));
    const {type} = messageJson;
    switch (type) {
        case 'init.success': {
            document.querySelector('#sender-input').disabled = true;
            document.querySelector('#connect-button').disabled = true;

            document.querySelector('#receiver-input').disabled = false;
            document.querySelector('#message-input').disabled = false;
            document.querySelector('#message-send-button').disabled = false;
            break;
        }
        case 'message': {
            const {sender, message} = messageJson;
            appendMessage(sender, message);
            break;
        }
        case 'message.success': {
            const {sender, receiver, message} = messageJson;
            document.querySelector('#message-input').value = '';
            appendMessage(`${sender} (для ${receiver})`, message);
            break;
        }
        case 'info': {
            const {message} = messageJson;
            console.log(message);
            break;
        }
        default:
            break;
    }
};

socket.onclose = function (event) {
    if (event.wasClean) {
        console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
    } else {
        console.log('[close] Соединение прервано');
    }
};

socket.onerror = function (error) {
    console.log(`[error]: ${error}`);
};

window.addEventListener('beforeunload', () => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Страница закрыта');
    }
});

function handleConnectClick() {
    const sender = document.querySelector('#sender-input').value;
    socket.send(JSON.stringify({type: 'init', sender}));
}

function handleSendClick() {
    const sender = document.querySelector('#sender-input').value;
    const message = document.querySelector('#message-input').value;
    const receiver = document.querySelector('#receiver-input').value;
    socket.send(JSON.stringify({type: 'message', sender, receiver, message}));
}
