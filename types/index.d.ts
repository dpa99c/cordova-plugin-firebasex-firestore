interface FirebasexFirestorePlugin {
    addDocumentToFirestoreCollection(
        document: object,
        collection: string,
        timestamp: boolean,
        success: (documentId: string) => void,
        error: (err: string) => void
    ): void;
    setDocumentInFirestoreCollection(
        documentId: string,
        document: object,
        collection: string,
        timestamp: boolean,
        success: () => void,
        error: (err: string) => void
    ): void;
    updateDocumentInFirestoreCollection(
        documentId: string,
        document: object,
        collection: string,
        timestamp: boolean,
        success: () => void,
        error: (err: string) => void
    ): void;
    deleteDocumentFromFirestoreCollection(
        documentId: string,
        collection: string,
        success: () => void,
        error: (err: string) => void
    ): void;
    documentExistsInFirestoreCollection(
        documentId: string,
        collection: string,
        success: (exists: boolean) => void,
        error: (err: string) => void
    ): void;
    fetchDocumentInFirestoreCollection(
        documentId: string,
        collection: string,
        success: (document: object) => void,
        error: (err: string) => void
    ): void;
    fetchFirestoreCollection(
        collection: string,
        filters?: object[],
        success?: (collection: object) => void,
        error?: (err: string) => void
    ): void;
    listenToDocumentInFirestoreCollection(
        success: (event: object) => void,
        error: (err: string) => void,
        documentId: string,
        collection: string,
        includeMetadata?: boolean
    ): void;
    listenToFirestoreCollection(
        success: (event: object) => void,
        error: (err: string) => void,
        collection: string,
        filters?: object[],
        includeMetadata?: boolean
    ): void;
    removeFirestoreListener(
        success: () => void,
        error: (err: string) => void,
        listenerId: string
    ): void;
}
