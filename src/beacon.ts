type OnsitePayload = {
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

export type ContextMenuOpened = OnsitePayload & {
    nodeId: number
    point: Point
};

export type ElementFocused = OnsitePayload & {
    nodeId: number
};

export type ElementScrolled = OnsitePayload & {
    nodeId: number
    point: Point
};

export type ElementUnfocused = OnsitePayload & {
    url: URL
    nodeId: number
};

export type FormSubmitted = OnsitePayload & {
    nodeId: number
    data: Map<string, string>
};

export type InputChanged = OnsitePayload & {
    nodeId: number
    value: string
    checked: boolean
};

export type MouseClicked = OnsitePayload & {
    nodeId: number
    point: Point
};

export type MouseDoubleClicked = OnsitePayload & {
    nodeId: number
    point: Point
};

type MouseOffset = {
    nodeId: number
    point: Point
    timeOffset: number
}

export type MouseMoved = OnsitePayload & {
    offsets: MouseOffset[]
};

export type MousePressed = OnsitePayload & {
    nodeId: number
    point: Point
};

export type MouseReleased = OnsitePayload & {
    nodeId: number
    point: Point
};

export type NothingChanged = OnsitePayload;

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

export type PageChanged = OnsitePayload & {
    nodesAdded: NodeAddition[]
    nodesRemoved: NodeRemoval[]
    attributesChanged: AttributeChange[]
    textsChanged: TextChange[]
};

export type PageLoaded = OnsitePayload & {
    viewportSize: Dimension
    scrollOffset: Point
    content: Node
};

export type PageOpened = OnsitePayload & {
    ip: string
    userAgent: string
    preferredLanguages: string
};

enum PageVisibility {
    VISIBLE,
    HIDDEN
}

export type PageVisibilityChanged = OnsitePayload & {
    visibility: PageVisibility
};

export type TabOpened = OnsitePayload;

export type TouchEnded = OnsitePayload & {
    nodeId: number
    point: Point
};

export type TouchMoved = OnsitePayload & {
    nodeId: number
    point: Point
};

export type TouchStarted = OnsitePayload & {
    nodeId: number
    point: Point
};

export type ViewportResized = OnsitePayload & {
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
    PageLoaded |
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