import {
    record,
    mirror,
    MouseInteractions as RrwebMouseInteractions,
    IncrementalSource as RrwebIncrementalSource,
    EventType as RrwebEventType,
} from 'rrweb';

import {
    cdataNode as RrwebCdataNode,
    commentNode as RrwebCommentNode,
    documentNode as RrwebDocumentNode,
    textNode as RrwebTextNode,
    documentTypeNode as RrwebDocumentTypeNode,
    elementNode as RrwebElementNode,
    INode as RrwebINode,
    NodeType as RrwebNodeType,
    serializedNodeWithId as RrwebNode,
} from 'rrweb-snapshot';

import {
    addedNodeMutation as RrwebAddedNodeMutation,
    attributeMutation as RrwebAttributeMutation,
    eventWithTime as RrwebEvent,
    fullSnapshotEvent as RrwebFullSnapshotEvent,
    incrementalData as RrwebIncrementalData,
    incrementalSnapshotEvent as RrwebIncrementalSnapshotEvent,
    inputData as RrwebInputData,
    listenerHandler as StopRecorderCallback,
    metaEvent as RrwebMetaEvent,
    mouseInteractionData as RrwebMouseInteractionData,
    mousemoveData as RrwebMouseMoveData,
    mutationData as RrwebMutationData,
    removedNodeMutation as RrwebRemovedNodeMutation,
    scrollData as RrwebMouseScrollData,
    textMutation as RrwebTextMutation,
    viewportResizeData as RrwebViewportResizeData,
} from 'rrweb/typings/types';

import {
    AttributeChange,
    FileMetadata,
    FormData,
    MouseOffset,
    Node as NodeSnapshot,
    NodeAddition,
    NodeRemoval,
    PartialPayload,
    TextChange,
} from './beacon';

import {Logger} from './logger';
import {NullLogger} from './logger/nullLogger';

type RecorderListener = {
    (event: RecorderEvent): void
}

export type RecorderEvent = {
    timestamp: number
    payload: PartialPayload,
}

type StopCallback = StopRecorderCallback;

export class Recorder {
    private stopCallback?: StopCallback;
    private pendingEvents: RrwebEvent[] = [];
    private listeners: RecorderListener[] = [];
    private logger: Logger;
    private version: number = 0;

    constructor(logger?: Logger) {
        this.logger = logger || new NullLogger();
    }

    isRecording(): boolean {
        return this.stopCallback !== undefined;
    }

    start() {
        if (this.stopCallback) {
            return;
        }

        this.logger.info('Starting recorder...');

        const stopRecording: StopCallback | undefined = record({
            emit: this.getEmitter(),
        });

        if (!stopRecording) {
            this.logger.error('Failed to start recorder');

            return;
        }

        this.registerStopCallback(stopRecording);

        this.listen('submit', this.handleSubmitEvent.bind(this), true);

        this.logger.info('Recorder started');
    }

    stop() {
        if (!this.stopCallback) {
            return;
        }

        this.logger.info('Stopping recorder...');

        this.stopCallback();
        this.pendingEvents = [];

        delete this.stopCallback;

        this.logger.info('Recorder stopped');
    }

    addListener(listener: RecorderListener): void {
        this.listeners.push(listener);
    }

    removeListener(listener: RecorderListener): void {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }

    private getEmitter(): { (event: RrwebEvent): void } {
        let emulatedEvents: RrwebEvent[] = [];

        if (this.version === 0 && document.readyState !== 'loading') {
            emulatedEvents.push({
                type: RrwebEventType.DomContentLoaded,
                timestamp: Date.now(),
                data: {},
            });
        }

        return event => {
            if (emulatedEvents.length > 0) {
                emulatedEvents.map(this.handleRrwebEvent.bind(this));
                emulatedEvents = [];
            }

            this.handleRrwebEvent(event);
        };
    }

    private listen(event: string, listener: EventListener, capture: boolean = false): void {
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

            callback();
        };
    }

    private emit(event: RecorderEvent): void {
        for (let listener of this.listeners) {
            listener(event);
        }
    }

    private handleRrwebEvent(event: RrwebEvent): void {
        const payload = this.createPayload(event);

        if (payload !== null) {
            this.emit({
                timestamp: event.timestamp,
                payload: payload,
            });
        }
    }

    private handleSubmitEvent(event: Event): void {
        const form = event.target as HTMLFormElement;

        this.emit({
            timestamp: Date.now(),
            payload: {
                type: 'formSubmitted',
                nodeId: mirror.getId(event.target as RrwebINode),
                formData: this.extractFormData(form),
                formName: form.name,
                formId: form.id,
            },
        });
    }

    private extractFormData(form: HTMLFormElement): FormData {
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
                    // ignore
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
                        data[element.name] = {
                            type: 'file',
                            nodeId: mirror.getId((element as Node) as RrwebINode),
                            files: files,
                        };
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
                        data[element.name] = {
                            type: 'select',
                            nodeId: mirror.getId((element as Node) as RrwebINode),
                            options: options,
                        };
                    }
                    break;

                case 'textarea':
                    data[element.name] = {
                        type: 'textarea',
                        nodeId: mirror.getId((element as Node) as RrwebINode),
                        // normalize linefeeds for textareas
                        // https://infra.spec.whatwg.org/#normalize-newlines
                        value: element.value.replace(/\r\n|\r/g, '\n'),
                    };
                    break;

                case 'checkbox':
                case 'radio':
                    if ((element as HTMLInputElement).checked) {
                        data[element.name] = {
                            type: 'input',
                            nodeId: mirror.getId((element as Node) as RrwebINode),
                            value: element.value,
                        };
                    }
                    break;

                default:
                    data[element.name] = {
                        type: 'input',
                        nodeId: mirror.getId((element as Node) as RrwebINode),
                        value: element.value,
                    };
                    break;
            }
        }

        return data;
    }

    private createPayload(event: RrwebEvent): PartialPayload | null {
        switch (event.type) {
            case RrwebEventType.DomContentLoaded:
                return {
                    type: 'pageLoaded',
                    title: document.title,
                    lastModified: Date.parse(document.lastModified),
                };

            case RrwebEventType.Load:
                // ignored
                return null;

            case RrwebEventType.FullSnapshot:
                const meta = (this.pendingEvents.pop() as RrwebMetaEvent).data;
                const {node, initialOffset} = (event as RrwebFullSnapshotEvent).data;

                return {
                    type: 'pageSnapshotCaptured',
                    version: this.version++,
                    viewportSize: {
                        width: meta.width,
                        height: meta.height,
                    },
                    scrollOffset: {
                        x: initialOffset.left,
                        y: initialOffset.top,
                    },
                    content: this.createNode(node),
                };

            case RrwebEventType.IncrementalSnapshot:
                return this.createIncrementalPayload((event as RrwebIncrementalSnapshotEvent).data);

            case RrwebEventType.Meta:
                this.pendingEvents.push(event);

                return null;
        }
    }

    private createIncrementalPayload(data: RrwebIncrementalData): PartialPayload {
        switch (data.source) {
            case RrwebIncrementalSource.Mutation:
                const mutation = data as RrwebMutationData;

                return {
                    type: 'pageChanged',
                    nodesAdded: this.createNodeAdditions(mutation.adds),
                    nodesRemoved: this.createNodeRemovals(mutation.removes),
                    attributesChanged: this.createAttributeChanges(mutation.attributes),
                    textsChanged: this.createTextChanges(mutation.texts),
                };
            case RrwebIncrementalSource.MouseMove:
                const mouseMove = data as RrwebMouseMoveData;

                return {
                    type: 'mouseMoved',
                    offsets: mouseMove.positions.map(
                        (position): MouseOffset => ({
                            nodeId: position.id,
                            timeOffset: position.timeOffset,
                            point: {
                                x: position.x,
                                y: position.y,
                            },
                        }),
                    ),
                };

            case RrwebIncrementalSource.MouseInteraction:
                return this.createMouseInteractionPayload(data as RrwebMouseInteractionData);

            case RrwebIncrementalSource.Scroll:
                const mouseScroll = data as RrwebMouseScrollData;

                return {
                    type: 'elementScrolled',
                    nodeId: mouseScroll.id,
                    point: {
                        x: mouseScroll.x,
                        y: mouseScroll.y,
                    },
                };

            case RrwebIncrementalSource.ViewportResize:
                const viewportResize = data as RrwebViewportResizeData;

                return {
                    type: 'viewportResized',
                    viewportSize: {
                        width: viewportResize.width,
                        height: viewportResize.height,
                    },
                };

            case RrwebIncrementalSource.Input:
                const input = data as RrwebInputData;

                return {
                    type: 'inputChanged',
                    nodeId: input.id,
                    checked: input.isChecked,
                    value: input.text,
                };
        }
    }

    private createMouseInteractionPayload(data: RrwebMouseInteractionData): PartialPayload {
        switch (data.type) {
            case RrwebMouseInteractions.MouseUp:
                return {
                    type: 'mouseReleased',
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y,
                    },
                };

            case RrwebMouseInteractions.MouseDown:
                return {
                    type: 'mousePressed',
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y,
                    },
                };

            case RrwebMouseInteractions.Click:
                return {
                    type: 'mouseClicked',
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y,
                    },
                };

            case RrwebMouseInteractions.ContextMenu:
                return {
                    type: 'contextMenuOpened',
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y,
                    },
                };

            case RrwebMouseInteractions.DblClick:
                return {
                    type: 'mouseDoubleClicked',
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y,
                    },
                };

            case RrwebMouseInteractions.Focus:
                return {
                    type: 'elementFocused',
                    nodeId: data.id,
                };

            case RrwebMouseInteractions.Blur:
                return {
                    type: 'elementUnfocused',
                    nodeId: data.id,
                };

            case RrwebMouseInteractions.TouchStart:
                return {
                    type: 'touchStarted',
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y,
                    },
                };

            case RrwebMouseInteractions.TouchMove_Departed:
                // @todo fix it
                return {
                    type: 'touchMoved',
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y,
                    },
                };

            case RrwebMouseInteractions.TouchEnd:
                return {
                    type: 'touchEnded',
                    nodeId: data.id,
                    point: {
                        x: data.x,
                        y: data.y,
                    },
                };
        }
    }

    private createNodeAdditions(mutations: RrwebAddedNodeMutation[]): NodeAddition[] {
        const previous: { [key: number]: number } = {};
        const next: { [key: number]: number } = {};

        for (const mutation of mutations) {
            if (mutation.previousId != null && mutation.previousId >= 0) {
                previous[mutation.previousId] = mutation.node.id;
            }

            if (mutation.nextId != null && mutation.nextId >= 0) {
                next[mutation.nextId] = mutation.node.id;
            }
        }

        const additions: NodeAddition[] = [];

        for (const mutation of mutations) {
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
            });
        }

        return additions;
    }

    private createNodeRemovals(mutations: RrwebRemovedNodeMutation[]): NodeRemoval[] {
        return mutations.map(
            (mutation): NodeRemoval => ({
                nodeId: mutation.id,
                parentId: mutation.parentId,
            }),
        );
    }

    private createTextChanges(mutations: RrwebTextMutation[]): TextChange[] {
        return mutations.map(
            (mutation): TextChange => ({
                nodeId: mutation.id,
                value: mutation.value,
            }),
        );
    }

    private createAttributeChanges(mutations: RrwebAttributeMutation[]): AttributeChange[] {
        return mutations.map(
            (mutation): AttributeChange => ({
                nodeId: mutation.id,
                attributes: mutation.attributes,
            }),
        );
    }

    private createNode(node: RrwebNode): NodeSnapshot {
        switch (node.type) {
            case RrwebNodeType.Document:
                const documentNode = node as RrwebDocumentNode;

                return {
                    type: 'document',
                    id: node.id,
                    children: documentNode.childNodes.map(
                        (child) => this.createNode(child),
                    ),
                };

            case RrwebNodeType.DocumentType:
            case 1:
                const documentTypeNode = node as RrwebDocumentTypeNode;

                return {
                    type: 'documentType',
                    id: node.id,
                    name: documentTypeNode.name,
                    publicId: documentTypeNode.publicId,
                    systemId: documentTypeNode.systemId,
                };

            case RrwebNodeType.Element:
                const elementNode = node as RrwebElementNode;

                return {
                    type: 'element',
                    id: node.id,
                    tagName: elementNode.tagName,
                    attributes: elementNode.attributes,
                    children: elementNode.childNodes.map(
                        (child) => this.createNode(child),
                    ),
                };

            case RrwebNodeType.Text:
                const textNode = node as RrwebTextNode;

                return {
                    type: 'text',
                    id: node.id,
                    value: textNode.textContent,
                };

            case RrwebNodeType.CDATA:
                const cdataNode = node as RrwebCdataNode;

                return {
                    type: 'cdata',
                    id: node.id,
                    value: cdataNode.textContent,
                };

            case RrwebNodeType.Comment:
                const commentNode = node as RrwebCommentNode;

                return {
                    type: 'comment',
                    id: node.id,
                    value: commentNode.textContent,
                };
        }
    }
}