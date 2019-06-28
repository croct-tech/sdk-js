import {Token} from './token';

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
    PAGE_LOADED = 'pageLoaded',
    URL_CHANGED = 'urlChanged',
    PAGE_SNAPSHOT_CAPTURED = 'pageSnapshotCaptured',
    PAGE_OPENED = 'pageOpened',
    PAGE_VISIBILITY_CHANGED = 'pageVisibilityChanged',
    TAB_OPENED = 'tabOpened',
    TOUCH_ENDED = 'touchEnded',
    TOUCH_MOVED = 'touchMoved',
    TOUCH_STARTED = 'touchStarted',
    VIEWPORT_RESIZED = 'viewportResized',
    USER_PROFILE_CHANGED = 'userProfileChanged',
}

type EventType =
    'contextMenuOpened' |
    'elementFocused'
;

type Event<T extends EventType> = {
    type: T
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

export type ContextMenuOpened = Event<'contextMenuOpened'> & {
    nodeId: number
    point: Point
}

export type ElementFocused = {
    type: PayloadType.ELEMENT_FOCUSED
    nodeId: number
}

export type ElementScrolled = {
    type: PayloadType.ELEMENT_SCROLLED
    nodeId: number
    point: Point
}

export type ElementUnfocused = {
    type: PayloadType.ELEMENT_UNFOCUSED
    nodeId: number
}

export enum FieldType {
    INPUT = 'input',
    SELECT = 'select',
    FILE = 'file',
    TEXTAREA = 'textarea',
}

export type InputValue = {
    type: FieldType.INPUT,
    nodeId: number,
    value: string,
}

export type SelectValue = {
    type: FieldType.SELECT,
    nodeId: number,
    options: string[],
}

export type FileMetadata = {
    name: string
    size: number
    type: string
    lastModified: number
}

export type FileValue = {
    type: FieldType.FILE,
    nodeId: number,
    files: FileMetadata[],
}

export type TextareaValue = {
    type: FieldType.TEXTAREA,
    nodeId: number,
    value: string,
}

export type FieldValue =
    InputValue |
    TextareaValue |
    SelectValue |
    FileValue
    ;

export type FormData = {
    [key: string]: FieldValue
}

export type FormSubmitted = {
    type: PayloadType.FORM_SUBMITTED
    nodeId: number
    formId?: string
    formName?: string
    formData: FormData
}

export type InputChanged = {
    type: PayloadType.INPUT_CHANGED
    nodeId: number
    value: string
    checked: boolean
}

export type MouseClicked = {
    type: PayloadType.MOUSE_CLICKED
    nodeId: number
    point: Point
}

export type MouseDoubleClicked = {
    type: PayloadType.MOUSE_DOUBLE_CLICKED
    nodeId: number
    point: Point
}

export type MouseOffset = {
    nodeId: number
    point: Point
    timeOffset: number
}

export type MouseMoved = {
    type: PayloadType.MOUSE_MOVED
    offsets: MouseOffset[]
}

export type MousePressed = {
    type: PayloadType.MOUSE_PRESSED
    nodeId: number
    point: Point
}

export type MouseReleased = {
    type: PayloadType.MOUSE_RELEASED
    nodeId: number
    point: Point
}

export type NothingChanged = {
    type: PayloadType.NOTHING_CHANGED
}

export enum NodeType {
    DOCUMENT = 'document',
    DOCUMENT_TYPE = 'documentType',
    ELEMENT = 'element',
    CDATA = 'cdata',
    COMMENT = 'comment',
    TEXT = 'text',
}

export type CdataNode = {
    type: NodeType.CDATA
    id: number
    value: string
}

export type CommentNode = {
    type: NodeType.COMMENT
    id: number
    value: string
}

export type TextNode = {
    type: NodeType.TEXT
    id: number
    value: string
}

export type DocumentNode = {
    type: NodeType.DOCUMENT
    id: number
    children: Node[]
}

export type DocumentTypeNode = {
    type: NodeType.DOCUMENT_TYPE
    id: number
    name: string
    publicId: string
    systemId: string
}

export declare type attributes = {
    [key: string]: string | boolean;
};

export type ElementNode = {
    type: NodeType.ELEMENT
    id: number
    tagName: string
    attributes: attributes
    children: Node[]
}

export type Node =
    CdataNode |
    CommentNode |
    DocumentNode |
    DocumentTypeNode |
    ElementNode |
    TextNode
    ;

export type NodeAddition = {
    parentId: number
    nextId: number | null
    previousId: number | null
    node: Node
}

export type NodeRemoval = {
    nodeId: number
    parentId: number
}

export type AttributeChange = {
    nodeId: number
    attributes: { [key: string]: string | null }
}

export type TextChange = {
    nodeId: number
    value: string | null
}

export type PageChanged = {
    type: PayloadType.PAGE_CHANGED
    nodesAdded: NodeAddition[]
    nodesRemoved: NodeRemoval[]
    attributesChanged: AttributeChange[]
    textsChanged: TextChange[]
}

export type PageSnapshotCaptured = {
    type: PayloadType.PAGE_SNAPSHOT_CAPTURED
    viewportSize: Dimension
    scrollOffset: Point
    content: Node
    version: number
}

export type PageLoaded = {
    type: PayloadType.PAGE_LOADED
    title: string
    lastModified: number
}

export type PageOpened = {
    type: PayloadType.PAGE_OPENED
    referrer: string
    //ip: string
    //userAgent: string
    //preferredLanguages: string
}

export enum PageVisibility {
    VISIBLE,
    HIDDEN
}

export type PageVisibilityChanged = {
    type: PayloadType.PAGE_VISIBILITY_CHANGED
    visibility: PageVisibility
}

export type TabOpened = {
    type: PayloadType.TAB_OPENED
}

export type TouchEnded = {
    type: PayloadType.TOUCH_ENDED
    nodeId: number
    point: Point
}

export type TouchMoved = {
    type: PayloadType.TOUCH_MOVED
    nodeId: number
    point: Point
}

export type TouchStarted = {
    type: PayloadType.TOUCH_STARTED
    nodeId: number
    point: Point
}

export type ViewportResized = {
    type: PayloadType.VIEWPORT_RESIZED
    viewportSize: Dimension
}

export type UrlChanged = {
    type: PayloadType.URL_CHANGED
}

type PrimitiveAttribute = string | number | boolean | null;
type CustomAttribute = PrimitiveAttribute | PrimitiveAttribute[];

export type ProfileChange = {
    email?: string | null
    firstName?: string | null
    gender?: 'neutral' | 'male' | 'female'
    custom?: {
        [key: string]: CustomAttribute
    }
}

export type UserProfileChanged = {
    type: PayloadType.USER_PROFILE_CHANGED
    attributes: ProfileChange
}

export type Payload =
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
    PageLoaded |
    PageVisibilityChanged |
    TabOpened |
    TouchEnded |
    TouchMoved |
    TouchStarted |
    ViewportResized |
    UrlChanged |
    UserProfileChanged
;

export type Beacon = {
    userToken: Token | null
    timestamp: number
    payload: Payload
}