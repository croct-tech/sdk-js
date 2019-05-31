import {Token} from "./token";

export enum PayloadType {
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

type Point = {
    x: number
    y: number
}

type Dimension = {
    height: number
    width: number
}

type Payload = {
    type: PayloadType
}

export type ContextMenuOpened = Payload & {
    type: PayloadType.CONTEXT_MENU_OPENED
    nodeId: number
    point: Point
}

export type ElementFocused = Payload & {
    type: PayloadType.ELEMENT_FOCUSED
    nodeId: number
}

export type ElementScrolled = Payload & {
    type: PayloadType.ELEMENT_SCROLLED
    nodeId: number
    point: Point
}

export type ElementUnfocused = Payload & {
    type: PayloadType.ELEMENT_UNFOCUSED
    url: URL
    nodeId: number
}

export type FormSubmitted = Payload & {
    type: PayloadType.FORM_SUBMITTED
    nodeId: number
    data: {[key: string]: string}
}

export type InputChanged = Payload & {
    type: PayloadType.INPUT_CHANGED
    nodeId: number
    value: string
    checked: boolean
}

export type MouseClicked = Payload & {
    type: PayloadType.MOUSE_CLICKED
    nodeId: number
    point: Point
}

export type MouseDoubleClicked = Payload & {
    type: PayloadType.MOUSE_DOUBLE_CLICKED
    nodeId: number
    point: Point
}

type MouseOffset = {
    nodeId: number
    point: Point
    timeOffset: number
}

export type MouseMoved = Payload & {
    type: PayloadType.MOUSE_MOVED
    offsets: MouseOffset[]
}

export type MousePressed = Payload & {
    type: PayloadType.MOUSE_PRESSED
    nodeId: number
    point: Point
}

export type MouseReleased = Payload & {
    type: PayloadType.MOUSE_RELEASED
    nodeId: number
    point: Point
}

export type NothingChanged = Payload & {
    type: PayloadType.NOTHING_CHANGED
}

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

export type PageChanged = Payload & {
    type: PayloadType.PAGE_CHANGED
    nodesAdded: NodeAddition[]
    nodesRemoved: NodeRemoval[]
    attributesChanged: AttributeChange[]
    textsChanged: TextChange[]
}

export type PageSnapshotCaptured = Payload & {
    type: PayloadType.PAGE_SNAPSHOT_CAPTURED
    viewportSize: Dimension
    scrollOffset: Point
    content: Node
}

export type PageOpened = Payload & {
    type: PayloadType.PAGE_OPENED
    ip: string
    userAgent: string
    preferredLanguages: string
}

enum PageVisibility {
    VISIBLE,
    HIDDEN
}

export type PageVisibilityChanged = Payload & {
    type: PayloadType.PAGE_VISIBILITY_CHANGED
    visibility: PageVisibility
}

export type TabOpened = Payload & {
    type: PayloadType.TAB_OPENED
}

export type TouchEnded = Payload & {
    type: PayloadType.TOUCH_ENDED
    nodeId: number
    point: Point
}

export type TouchMoved = Payload & {
    type: PayloadType.TOUCH_MOVED
    nodeId: number
    point: Point
}

export type TouchStarted = Payload & {
    type: PayloadType.TOUCH_STARTED
    nodeId: number
    point: Point
}

export type ViewportResized = Payload & {
    type: PayloadType.VIEWPORT_RESIZED
    nodeId: number
    viewportSize: Dimension
}

type OnsitePayload =
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

type OnsiteBeaconPayload = OnsitePayload & {
    tabId: string
    url: string
}

export type BeaconPayload = OnsiteBeaconPayload

export type Beacon = {
    tenantId: string
    clientId: string
    userToken: Token
    timestamp: number
    payload: BeaconPayload
}