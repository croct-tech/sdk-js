import { After } from 'cypress-cucumber-preprocessor/steps';
import { Server, ServerOptions } from 'mock-socket';


interface ReceiptMessage {
    receiptId: string
}

export function acceptAllMessages(msg: ReceiptMessage): ReceiptMessage {
    return {
        receiptId: msg.receiptId,
    };
}

export function rejectAllMessages(msg: ReceiptMessage): ReceiptMessage {
    return {
        receiptId: msg.receiptId,
    };
}

const WebBridgeEndpoint = 'wss://main.test.croct.tech/client/web/connect';

export class WebBridgeServer extends Server {
    messages: any[];
    private answerer?: (message: any) => any = acceptAllMessages;

    constructor(appId: string, options?: ServerOptions) {
        super(`${WebBridgeEndpoint}/${appId}`, options);
        this.messages = [];
        this.on('connection', socket => {
            socket.on('message',
                data => this.receiveData(
                    socket,
                    JSON.parse(data.toString()),
                ));
        });
        After((done) => this.stop(done));
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

    setAnswerer(answerer?: (message: any) => any) {
        this.answerer = answerer;
    }

    private receiveData(socket: WebSocket, message: ReceiptMessage) {
        console.log(`Received message: ${JSON.stringify(message)}`)
        this.messages.push(message);
        if (this.answerer !== undefined) {
            socket.send(JSON.stringify(this.answerer(message)));
        }
    }
}
