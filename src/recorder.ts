import {record} from 'rrweb';

import {
    cdataNode as CdataNodeSnapshot,
    commentNode as CommentNodeSnapshot,
    documentNode as DocumentNodeSnapshot,
    documentTypeNode as DocumentTypeNodeSnapshot,
    elementNode as ElementNodeSnapshot,
    serializedNodeWithId as SnapshotNode,
    textNode as TextNodeSnapshot,
    NodeType as NodeSnapshotType,
    INode
} from 'rrweb-snapshot';

import {
    addedNodeMutation as AddedNodeMutation,
    attributeMutation as AttributeMutation,
    eventWithTime as RrwebEvent,
    fullSnapshotEvent as FullSnapshotEvent,
    incrementalData as IncrementalData,
    inputData as InputData,
    listenerHandler as StopRecorderCallback,
    metaEvent as MetaEvent,
    mouseInteractionData as MouseInteractionData,
    MouseInteractions,
    mousemoveData as MouseMoveData,
    mutationData as MutationData,
    removedNodeMutation as RemovedNodeMutation,
    scrollData as MouseScrollData,
    textMutation as TextMutation,
    viewportResizeData as ViewportResizeData,
    incrementalSnapshotEvent as IncrementalSnapshotEvent
} from 'rrweb/typings/types';

import {
    AttributeChange,
    FileMetadata,
    FormData,
    MouseOffset,
    Node,
    NodeAddition,
    NodeRemoval,
    NodeType,
    OnsitePayload,
    PayloadType,
    TextChange
} from "./beacon";

import {Logger} from "./logging";

type RecorderListener = {
    (event: RecorderEvent): void
}

export type RecorderEvent = {
    timestamp: number
    payload: OnsitePayload,
}

type StopCallback = StopRecorderCallback;

export default class Recorder {
    private stopCallback?: StopCallback;
    private pendingEvents: RrwebEvent[] = [];
    private listeners: RecorderListener[] = [];
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    isRecording() : boolean {
        return this.stopCallback !== undefined;
    }

    start() {
        if (this.stopCallback) {
            return;
        }

        const stopRecording: StopCallback | undefined = record({
            emit: this.handleRrwebEvent.bind(this),
        });

        if (!stopRecording) {
            this.logger.error('Failed to start recorder');

            return;
        }

        this.registerStopCallback(stopRecording);

        this.listen('submit', this.handleSubmitEvent.bind(this), true);

        this.logger.info('Recording started');
    }

    stop() {
        if (!this.stopCallback) {
            return;
        }

        this.stopCallback();
        this.pendingEvents = [];

        delete this.stopCallback;

        this.logger.info('Recording stopped');
    }

    registerListener(listener: RecorderListener) : void {
        this.listeners.push(listener);
    }

    removeListener(listener: RecorderListener) : void {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }

    private listen(event: string, listener: EventListener, capture: boolean = false) : void {
        window.addEventListener(event, listener, capture);

        this.registerStopCallback(() => {
            window.removeEventListener(event, listener, capture);
        });
    }

    private registerStopCallback(callback: StopCallback) {
        const currentCallback: StopCallback | undefined = this.stopCallback;

        if (!currentCallback) {
            this.stopCallback = callback;

            return;
        }

        this.stopCallback = () => {
            if (currentCallback) {
                currentCallback();
            }

            callback()
        };
    }

    private emit(event: RecorderEvent) : void {
        for (let listener of this.listeners) {
            listener(event);
        }
    }

    private handleRrwebEvent(event: RrwebEvent) : void {
        const payload = this.createPayload(event);

        if (payload !== null) {
            this.emit({
                timestamp: event.timestamp,
                payload: payload
            })
        }
    }

    private handleSubmitEvent(event: Event) : void {
        event.preventDefault();

        this.emit({
            timestamp: Date.now(),
            payload: {
                type: PayloadType.FORM_SUBMITTED,
                nodeId: (event.target as INode).__sn.id,
                data: this.extractFormData(event.target as HTMLFormElement)
            }
        });
    }

    private extractFormData(form: HTMLFormElement) : FormData {
        const data: FormData = {};

        for (let element of form.elements) {
            if (!(element instanceof HTMLInputElement
                || element instanceof HTMLSelectElement)
                || !element.name
                || element.disabled) {
                continue;
            }

            switch (element.type) {
                case 'submit':
                case 'reset':
                case 'button':
                    // ignored
                    break;

                case 'file':
                    const files: FileMetadata[] = [];

                    for (let file of (element as HTMLInputElement).files || []) {
                        files.push({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            lastModified: file.lastModified,
                        });
                    }

                    if (files.length > 0) {
                        data[element.name] = element.multiple ? files : files[0];
                    }
                    break;

                case 'select-one':
                case 'select-multiple':
                    const options: string[] = [];

                    for (let option of (element as HTMLSelectElement).options) {
                        if (!option.disabled && option.selected) {
                            options.push(option.value);
                        }
                    }

                    if (options.length > 0) {
                        data[element.name] = element.multiple ? options : options[0];
                    }
                    break;

                case 'checkbox':
                case 'radio':
                    if ((element as HTMLInputElement).checked) {
                        data[element.name] = element.value;
                    }
                    break;

                case 'textarea':
                    data[element.name] = element.value;
                    break;

                default:
                    data[element.name] = element.value;
                    break;
            }
        }

        return data;
    }

    private createPayload(event: RrwebEvent) : OnsitePayload | null {
        switch (event.type) {
            //case EventType.DomContentLoaded:
            case 0:
                // ignored
                break;

            //case EventType.Load:
            case 1:
                // ignored
                break;

            //case EventType.FullSnapshot:
            case 2:
                const meta = (this.pendingEvents.pop() as MetaEvent).data;
                const {node, initialOffset} = (event as FullSnapshotEvent).data;

                return {
                    type: PayloadType.PAGE_SNAPSHOT_CAPTURED,
                    viewportSize: {
                        width: meta.width,
                        height: meta.height,
                    },
                    scrollOffset: {
                        x: initialOffset.left,
                        y: initialOffset.top,
                    },
                    content: this.createNode(node)
                };

            //case EventType.IncrementalSnapshot:
            case 3:
                return this.createIncrementalPayload((event as IncrementalSnapshotEvent).data);

            //case EventType.Meta:
            case 4:
                this.pendingEvents.push(event);
                break;
        }

        return null;
    }

    private createIncrementalPayload(data: IncrementalData) : OnsitePayload {
        switch (data.source) {
            //case IncrementalSource.Mutation:
            case 0:
                const mutation = data as MutationData;

                return {
                    type: PayloadType.PAGE_CHANGED,
                    nodesAdded: this.createNodeAdditions(mutation.adds),
                    nodesRemoved: this.createNodeRemovals(mutation.removes),
                    attributesChanged: this.createAttributeChanges(mutation.attributes),
                    textsChanged: this.createTextChanges(mutation.texts),
                };
            //case IncrementalSource.MouseMove:
            case 1:
                const mouseMove = data as MouseMoveData;

                return {
                    type: PayloadType.MOUSE_MOVED,
                    offsets: mouseMove.positions.map(
                        (position) : MouseOffset => ({
                            nodeId: position.id,
                            timeOffset: position.timeOffset,
                            point: {
                                x: position.x,
                                y: position.y,
                            }
                        })
                    ),
                };

            //case IncrementalSource.MouseInteraction:
            case 2:
                return this.createMouseInteractionPayload(data as MouseInteractionData);

            //case IncrementalSource.Scroll:
            case 3:
                const mouseScroll = data as MouseScrollData;

                return {
                    type: PayloadType.ELEMENT_SCROLLED,
                    nodeId: mouseScroll.id,
                    point: {
                        x: mouseScroll.x,
                        y: mouseScroll.y,
                    }
                };

            //case IncrementalSource.ViewportResize:
            case 4:
                const viewportResize = data as ViewportResizeData;

                return {
                    type: PayloadType.VIEWPORT_RESIZED,
                    viewportSize: {
                        width: viewportResize.width,
                        height: viewportResize.height,
                    }
                };

            //case IncrementalSource.Input:
            case 5:
                const input = data as InputData;

                return {
                    type: PayloadType.INPUT_CHANGED,
                    nodeId: input.id,
                    checked: input.isChecked,
                    value: input.text
                };

            default:
                // @todo: remove it
                throw new Error('Unexpected incremental source.');
        }
    }

    private createMouseInteractionPayload(data: MouseInteractionData) : OnsitePayload {
        switch (data.type) {
            //case MouseInteractions.MouseUp:
            case 0:
                return {
                    type: PayloadType.MOUSE_RELEASED,
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y
                    }
                };

            //case MouseInteractions.MouseDown:
            case 1:
                return {
                    type: PayloadType.MOUSE_PRESSED,
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y
                    }
                };

            //case MouseInteractions.Click:
            case 2:
                return {
                    type: PayloadType.MOUSE_CLICKED,
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y
                    }
                };

            //case MouseInteractions.ContextMenu:
            case 3:
                return {
                    type: PayloadType.CONTEXT_MENU_OPENED,
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y
                    }
                };

            //case MouseInteractions.DblClick:
            case 4:
                return {
                    type: PayloadType.MOUSE_DOUBLE_CLICKED,
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y
                    }
                };

            //case MouseInteractions.Focus:
            case 5:
                return {
                    type: PayloadType.ELEMENT_FOCUSED,
                    nodeId: data.id,
                };

            //case MouseInteractions.Blur:
            case 6:
                return {
                    type: PayloadType.ELEMENT_UNFOCUSED,
                    nodeId: data.id,
                };

            //case MouseInteractions.TouchStart:
            case 7:
                return {
                    type: PayloadType.TOUCH_STARTED,
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y
                    }
                };

            //case MouseInteractions.TouchMove:
            case 8:
                return {
                    type: PayloadType.TOUCH_MOVED,
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y
                    }
                };

            //case MouseInteractions.TouchEnd:
            case 9:
                return {
                    type: PayloadType.TOUCH_ENDED,
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y
                    }
                };

            default:
                // @todo: remove it
                throw new Error('Unexpected mouse interaction type');
        }
    }

    private createNodeAdditions(mutations: AddedNodeMutation[]) : NodeAddition[] {
        const previous: {[key: number]: number} = {};
        const next: {[key: number]: number} = {};

        for (let mutation of mutations) {
            if (mutation.previousId != null && mutation.previousId >= 0) {
                previous[mutation.previousId] = mutation.node.id;
            }

            if (mutation.nextId != null && mutation.nextId >= 0) {
                next[mutation.nextId] = mutation.node.id;
            }
        }

        let additions: NodeAddition[] = [];

        for (let mutation of mutations) {
            let {previousId, nextId} = mutation;

            if (previousId !== null && previousId < 0) {
                previousId = next[mutation.node.id];
            }

            if (nextId !== null && nextId < 0) {
                nextId = previous[mutation.node.id];
            }

            additions.push({
                parentId: mutation.parentId,
                nextId: nextId,
                previousId: previousId,
                node: this.createNode(mutation.node),
            })
        }

        return additions;
    }

    private createNodeRemovals(mutations: RemovedNodeMutation[]) : NodeRemoval[] {
        return mutations.map(
            (mutation) : NodeRemoval => ({
                nodeId: mutation.id,
                parentId: mutation.parentId
            })
        );
    }

    private createTextChanges(mutations: TextMutation[]) : TextChange[] {
        return mutations.map(
            (mutation) : TextChange => ({
                nodeId: mutation.id,
                value: mutation.value
            })
        );
    }

    private createAttributeChanges(mutations: AttributeMutation[]) : AttributeChange[] {
        return mutations.map(
            (mutation) : AttributeChange => ({
                nodeId: mutation.id,
                attributes: mutation.attributes
            })
        );
    }

    private createNode(node: SnapshotNode) : Node {
        switch (node.type) {
            case NodeSnapshotType.Document:
                const document = node as DocumentNodeSnapshot;

                return {
                    type: NodeType.DOCUMENT,
                    id: node.id,
                    children: document.childNodes.map(
                        (child) => this.createNode(child)
                    ),
                };

            case NodeSnapshotType.DocumentType:
            case 1:
                const documentType = node as DocumentTypeNodeSnapshot;

                return {
                    type: NodeType.DOCUMENT_TYPE,
                    id: node.id,
                    name: documentType.name,
                    publicId: documentType.publicId,
                    systemId: documentType.systemId,
                };

            case NodeSnapshotType.Element:
                const element = node as ElementNodeSnapshot;

                return {
                    type: NodeType.ELEMENT,
                    id: node.id,
                    tagName: element.tagName,
                    attributes: element.attributes,
                    children: element.childNodes.map(
                        (child) => this.createNode(child)
                    ),
                };

            case NodeSnapshotType.Text:
                const text = node as TextNodeSnapshot;

                return {
                    type: NodeType.TEXT,
                    id: node.id,
                    value: text.textContent
                };

            case NodeSnapshotType.CDATA:
                const cdata = node as CdataNodeSnapshot;

                return {
                    type: NodeType.CDATA,
                    id: node.id,
                    value: cdata.textContent
                };

            case NodeSnapshotType.Comment:
                const comment = node as CommentNodeSnapshot;

                return {
                    type: NodeType.CDATA,
                    id: node.id,
                    value: comment.textContent
                };
        }
    }
}