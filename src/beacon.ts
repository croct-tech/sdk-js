import {Token} from './token';

type PayloadType =
    'contextMenuOpened' |
    'elementFocused' |
    'elementScrolled' |
    'elementUnfocused' |
    'formSubmitted' |
    'inputChanged' |
    'mouseClicked' |
    'mouseDoubleClicked' |
    'mouseMoved' |
    'mousePressed' |
    'mouseReleased' |
    'nothingChanged' |
    'pageChanged' |
    'pageLoaded' |
    'pageSnapshotCaptured' |
    'pageOpened' |
    'pageVisibilityChanged' |
    'tabOpened' |
    'touchEnded' |
    'touchMoved' |
    'touchStarted' |
    'viewportResized' |
    'urlChanged' |
    'userProfileChanged'
;

type BasePayload<T extends PayloadType> = {
    type: T
}

type Point = {
    x: number
    y: number
}

type Dimension = {
    height: number
    width: number
}

export type ContextMenuOpened = BasePayload<'contextMenuOpened'> & {
    nodeId: number
    point: Point
}

export type ElementFocused = BasePayload<'elementFocused'> & {
    nodeId: number
}

export type ElementScrolled = BasePayload<'elementScrolled'> & {
    nodeId: number
    point: Point
}

export type ElementUnfocused = BasePayload<'elementUnfocused'> & {
    nodeId: number
}

type FieldType =
    'input' |
    'select' |
    'file' |
    'textarea'
;

type BaseFieldValue<T extends FieldType> = {
    type: T
}

export type InputValue = BaseFieldValue<'input'> & {
    nodeId: number,
    value: string,
}

export type SelectValue = BaseFieldValue<'select'> & {
    nodeId: number,
    options: string[],
}

export type FileMetadata = {
    name: string
    size: number
    type: string
    lastModified: number
}

export type FileValue = BaseFieldValue<'file'> & {
    nodeId: number,
    files: FileMetadata[],
}

export type TextareaValue = BaseFieldValue<'textarea'> & {
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

export type FormSubmitted = BasePayload<'formSubmitted'> & {
    nodeId: number
    formId?: string
    formName?: string
    formData: FormData
}

export type InputChanged = BasePayload<'inputChanged'> & {
    nodeId: number
    value: string
    checked: boolean
}
export type MouseClicked = BasePayload<'mouseClicked'> & {
    nodeId: number
    point: Point
}

export type MouseDoubleClicked = BasePayload<'mouseDoubleClicked'> & {
    nodeId: number
    point: Point
}

export type MouseOffset = {
    nodeId: number
    point: Point
    timeOffset: number
}

export type MouseMoved = BasePayload<'mouseMoved'> & {
    offsets: MouseOffset[]
}

export type MousePressed = BasePayload<'mousePressed'> & {
    nodeId: number
    point: Point
}

export type MouseReleased = BasePayload<'mouseReleased'> & {
    nodeId: number
    point: Point
}

export type NothingChanged = BasePayload<'nothingChanged'>;

type NodeType =
    'document' |
    'documentType' |
    'element' |
    'cdata' |
    'comment' |
    'text'
;

type BaseNode<T extends NodeType> = {
    type: T,
    id: number
}

export type CdataNode = BaseNode<'cdata'> & {
    value: string
}

export type CommentNode = BaseNode<'comment'> & {
    value: string
}

export type TextNode = BaseNode<'text'> & {
    value: string
}

export type DocumentNode = BaseNode<'document'> & {
    children: Node[]
}

export type DocumentTypeNode = BaseNode<'documentType'> & {
    name: string
    publicId: string
    systemId: string
}

export declare type attributes = {
    [key: string]: string | boolean;
};

export type ElementNode = BaseNode<'element'> & {
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

export type PageChanged = BasePayload<'pageChanged'> & {
    nodesAdded: NodeAddition[]
    nodesRemoved: NodeRemoval[]
    attributesChanged: AttributeChange[]
    textsChanged: TextChange[]
}

export type PageSnapshotCaptured = BasePayload<'pageSnapshotCaptured'> & {
    viewportSize: Dimension
    scrollOffset: Point
    content: Node
    version: number
}

export type PageLoaded = BasePayload<'pageLoaded'> & {
    title: string
    lastModified: number
}

export type PageOpened = BasePayload<'pageOpened'> & {
    referrer: string
    //ip: string
    //userAgent: string
    //preferredLanguages: string
}

export type PageVisibilityChanged = BasePayload<'pageVisibilityChanged'> & {
    visibility: 'visible' | 'hidden'
}

export type TabOpened = BasePayload<'tabOpened'>;

export type TouchEnded = BasePayload<'touchEnded'> & {
    nodeId: number
    point: Point
}

export type TouchMoved = BasePayload<'touchMoved'> & {
    nodeId: number
    point: Point
}

export type TouchStarted = BasePayload<'touchStarted'> & {
    nodeId: number
    point: Point
}

export type ViewportResized = BasePayload<'viewportResized'> & {
    viewportSize: Dimension
}

export type UrlChanged = BasePayload<'urlChanged'>;

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

export type UserProfileChanged = BasePayload<'userProfileChanged'> & {
    changes: ProfileChange
}

export type PartialPayload =
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

export type Payload = PartialPayload & {
    tabId: string
    url: string
};

export type Beacon = {
    userToken: Token | null
    timestamp: number
    payload: Payload
}