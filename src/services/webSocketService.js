
const handleWebSocketEvent = (onMessageReceived) => {
    const ws = new WebSocket("ws://localhost:4000");

    ws.onopen = () => {
        console.log("Websocket connected");
    }

    ws.onmessage = (msg) => {
        try {
            const event = JSON.parse(msg.data);
            console.log("Received event:", event);
            if (onMessageReceived) {
                onMessageReceived(event);
            }
        } catch (err) {
            console.error("Error parsing message", err);
        }
    };

    return () => {
        console.log("Closing webhook");
        ws.close();
    }
}

export default handleWebSocketEvent;
