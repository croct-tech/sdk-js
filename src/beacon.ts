type WebBeaconPayload = {
    type: 'contextMenuOpened' |
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
        'pageSnapshotCaptured' |
        'pageOpened' |
        'pageVisibilityChanged' |
        'tabOpened' |
        'touchEnded' |
        'touchMoved' |
        'touchStarted' |
        'viewportResized'
}

type OnsiteEventPayload = WebBeaconPayload & {
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
};

export type ElementFocused = OnsiteEventPayload & {
    nodeId: number
};

export type ElementScrolled = OnsiteEventPayload & {
    nodeId: number
    point: Point
};

export type ElementUnfocused = OnsiteEventPayload & {
    url: URL
    nodeId: number
};

export type FormSubmitted = OnsiteEventPayload & {
    nodeId: number
    data: Map<string, string>
};

export type InputChanged = OnsiteEventPayload & {
    nodeId: number
    value: string
    checked: boolean
};

export type MouseClicked = OnsiteEventPayload & {
    nodeId: number
    point: Point
};

export type MouseDoubleClicked = OnsiteEventPayload & {
    nodeId: number
    point: Point
};

type MouseOffset = {
    nodeId: number
    point: Point
    timeOffset: number
}

export type MouseMoved = OnsiteEventPayload & {
    offsets: MouseOffset[]
};

export type MousePressed = OnsiteEventPayload & {
    nodeId: number
    point: Point
};

export type MouseReleased = OnsiteEventPayload & {
    nodeId: number
    point: Point
};

export type NothingChanged = OnsiteEventPayload;

type Node = {
    id: number
    type: number
    name: string
    attributes: {[key: string]: string}
    children: Node[]
    meta: {[key: string]: boolean | null | string}
}

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
};

export type PageSnapshotCaptured = OnsiteEventPayload & {
    viewportSize: Dimension
    scrollOffset: Point
    content: Node
};

export type PageOpened = OnsiteEventPayload & {
    ip: string
    userAgent: string
    preferredLanguages: string
};

enum PageVisibility {
    VISIBLE,
    HIDDEN
}

export type PageVisibilityChanged = OnsiteEventPayload & {
    visibility: PageVisibility
};

export type TabOpened = OnsiteEventPayload;

export type TouchEnded = OnsiteEventPayload & {
    nodeId: number
    point: Point
};

export type TouchMoved = OnsiteEventPayload & {
    nodeId: number
    point: Point
};

export type TouchStarted = OnsiteEventPayload & {
    nodeId: number
    point: Point
};

export type ViewportResized = OnsiteEventPayload & {
    nodeId: number
    viewportSize: Dimension
};

export type WebBeaconPayload =
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

type UserToken = {
    value: string
    timestamp: number
}

export type WebBeacon = {
    tenantId: string
    clientId: string
    userToken: UserToken
    timestamp: number
    payload: WebBeaconPayload
}