import {Token} from "./token";

enum PayloadType {
    CONTEXT_MENU_OPENED = 'contextMenuOpened',
    ELEMENT_FOCUSED = 'elementFocused',
    ELEMENT_SCROLLED = 'elementScrolled',
    ELEMENT_UNFOCUSED = 'elementUnfocused',
    FORM_SUBMITTED = 'formSubmitted',
    INPUT_CHANGED = 'inputChanged',
    MOUSE_CLICKED = 'mouseClicked',
    MOUSE_DOUBLE_CLICKED = 'mouseDoubleClicked',
    MOUSE_MOVED = 'mouseMoved',
    MOUSE_PRESSED = 'mousePressed',
    MOUSE_RELEASED = 'mouseReleased',
    NOTHING_CHANGED = 'nothingChanged',
    PAGE_CHANGED = 'pageChanged',
    PAGE_SNAPSHOT_CAPTURED = 'pageSnapshotCaptured',
    PAGE_OPENED = 'pageOpened',
    PAGE_VISIBILITY_CHANGED = 'pageVisibilityChanged',
    TAB_OPENED = 'tabOpened',
    TOUCH_ENDED = 'touchEnded',
    TOUCH_MOVED = 'touchMoved',
    TOUCH_STARTED = 'touchStarted',
    VIEWPORT_RESIZED = 'viewportResized',
}

type EventPayload = {
    type: PayloadType
}

type OnsiteEventPayload = EventPayload & {
    tabId: string
    url: string
}

type Point = {
    x: number
    y: number
}

type Dimension = {
    height: number
    width: number
}

export type ContextMenuOpened = OnsiteEventPayload & {
    nodeId: number
    point: Point
}

export type ElementFocused = OnsiteEventPayload & {
    nodeId: number
}

export type ElementScrolled = OnsiteEventPayload & {
    nodeId: number
    point: Point
}

export type ElementUnfocused = OnsiteEventPayload & {
    url: URL
    nodeId: number
}

export type FormSubmitted = OnsiteEventPayload & {
    nodeId: number
    data: Map<string, string>
}

export type InputChanged = OnsiteEventPayload & {
    nodeId: number
    value: string
    checked: boolean
}

export type MouseClicked = OnsiteEventPayload & {
    nodeId: number
    point: Point
}

export type MouseDoubleClicked = OnsiteEventPayload & {
    nodeId: number
    point: Point
}

type MouseOffset = {
    nodeId: number
    point: Point
    timeOffset: number
}

export type MouseMoved = OnsiteEventPayload & {
    offsets: MouseOffset[]
}

export type MousePressed = OnsiteEventPayload & {
    nodeId: number
    point: Point
}

export type MouseReleased = OnsiteEventPayload & {
    nodeId: number
    point: Point
}

export type NothingChanged = OnsiteEventPayload;

type DataNode = {
    id: number
    value: string
}

type CdataNode = DataNode

type CommentNode = DataNode

type TextNode = DataNode

type DocumentNode = {
    id: number
    children: Node[]
}

type DocumentTypeNode = {
    id: number
    name: string
    publicId: string
    systemId: string
}

type ElementNode = {
    id: number
    tagName: string
    attributes: {[key: string]: string}
    children: Node[]
}

type Node = 
    CdataNode |
    CommentNode |
    DocumentNode |
    DocumentTypeNode |
    ElementNode |
    TextNode
;

type NodeAddition = {
    parentId: number
    nextId: number
    previousId: number
    node: Node
}

type NodeRemoval = {
    nodeId: number
    parentId: number
}

type AttributeChange = {
    nodeId: number
    attributes: {[key: string]: string}
}

type TextChange = {
    nodeId: number
    value: string
}

export type PageChanged = OnsiteEventPayload & {
    nodesAdded: NodeAddition[]
    nodesRemoved: NodeRemoval[]
    attributesChanged: AttributeChange[]
    textsChanged: TextChange[]
}

export type PageSnapshotCaptured = OnsiteEventPayload & {
    viewportSize: Dimension
    scrollOffset: Point
    content: Node
}

export type PageOpened = OnsiteEventPayload & {
    ip: string
    userAgent: string
    preferredLanguages: string
}

enum PageVisibility {
    VISIBLE,
    HIDDEN
}

export type PageVisibilityChanged = OnsiteEventPayload & {
    visibility: PageVisibility
}

export type TabOpened = OnsiteEventPayload;

export type TouchEnded = OnsiteEventPayload & {
    nodeId: number
    point: Point
}

export type TouchMoved = OnsiteEventPayload & {
    nodeId: number
    point: Point
}

export type TouchStarted = OnsiteEventPayload & {
    nodeId: number
    point: Point
}

export type ViewportResized = OnsiteEventPayload & {
    nodeId: number
    viewportSize: Dimension
}

export type BeaconPayload =
    ContextMenuOpened |
    ElementFocused |
    ElementScrolled |
    ElementUnfocused |
    FormSubmitted |
    InputChanged |
    MouseClicked |
    MouseDoubleClicked |
    MouseMoved |
    MousePressed |
    MouseReleased |
    NothingChanged |
    PageChanged |
    PageSnapshotCaptured |
    PageOpened |
    PageVisibilityChanged |
    TabOpened |
    TouchEnded |
    TouchMoved |
    TouchStarted |
    ViewportResized
;

export type Beacon = {
    tenantId: string
    clientId: string
    userToken: Token
    timestamp: number
    payload: BeaconPayload
}