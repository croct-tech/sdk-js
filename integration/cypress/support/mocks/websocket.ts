import { Server, ServerOptions } from 'mock-socket';


interface ReceiptMessage {
    receiptId: string
}

const defaultAnswerer = (msg: ReceiptMessage): ReceiptMessage => ({
    receiptId: msg.receiptId,
});

class WebSocketServer extends Server {
    messages: any[];
    private answerer: (message: any) => any = defaultAnswerer;

    constructor(url: string, options?: ServerOptions) {
        super(url, options);
        console.log(`Server URL: ${(this as any).url}`);
        this.messages = [];
        this.on('connection', socket => {
            socket.on('message',
                data => this.receiveData(
                    socket,
                    JSON.parse(data.toString()),
                ));
        });
    }

    get messagesByEvent(): { [k: string]: any[] } {
        return this.messages.reduce((acc, message) => {
            const type: string = message.payload?.type;
            if (type !== undefined) {
                const curList: any[] = acc[type] ?? [];
                curList.push(message);
                acc[type] = curList;
            }
            return acc;
        }, {});
    }

    receiveData(socket: WebSocket, message: ReceiptMessage) {
        this.messages.push(message);
        if (this.answerer !== undefined) {
            socket.send(JSON.stringify(this.answerer(message)));
        }
    }

    setAnswerer(answerer: (message: any) => any) {
        this.answerer = answerer;
    }
}

export const WebBridgeServer = new WebSocketServer(
    'wss://main.test.croct.tech/client/web/connect/ac88a73c-4387-4a45-8d2d-236398bda7d9',
);
