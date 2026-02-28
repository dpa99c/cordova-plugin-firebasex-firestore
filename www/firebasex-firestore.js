var exec = require('cordova/exec');

var SERVICE = 'FirebasexFirestorePlugin';

var ensureBooleanFn = function (callback) {
    return function (result) {
        callback(result === true || result === 1);
    };
};

exports.addDocumentToFirestoreCollection = function (document, collection, timestamp, success, error) {
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");
    if (typeof document !== 'object' || typeof document.length === 'number') return error("'document' must be an object specifying record data");

    if (typeof timestamp !== "boolean" && typeof error === "undefined") {
        error = success;
        success = timestamp;
        timestamp = false;
    }

    exec(success, error, SERVICE, "addDocumentToFirestoreCollection", [document, collection, timestamp || false]);
};

exports.setDocumentInFirestoreCollection = function (documentId, document, collection, timestamp, success, error) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");
    if (typeof document !== 'object' || typeof document.length === 'number') return error("'document' must be an object specifying record data");

    if (typeof timestamp !== "boolean" && typeof error === "undefined") {
        error = success;
        success = timestamp;
        timestamp = false;
    }

    exec(success, error, SERVICE, "setDocumentInFirestoreCollection", [documentId.toString(), document, collection, timestamp || false]);
};

exports.updateDocumentInFirestoreCollection = function (documentId, document, collection, timestamp, success, error) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");
    if (typeof document !== 'object' || typeof document.length === 'number') return error("'document' must be an object specifying record data");

    if (typeof timestamp !== "boolean" && typeof error === "undefined") {
        error = success;
        success = timestamp;
        timestamp = false;
    }

    exec(success, error, SERVICE, "updateDocumentInFirestoreCollection", [documentId.toString(), document, collection, timestamp || false]);
};

exports.deleteDocumentFromFirestoreCollection = function (documentId, collection, success, error) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");

    exec(success, error, SERVICE, "deleteDocumentFromFirestoreCollection", [documentId.toString(), collection]);
};

exports.documentExistsInFirestoreCollection = function (documentId, collection, success, error) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");

    exec(ensureBooleanFn(success), error, SERVICE, "documentExistsInFirestoreCollection", [documentId.toString(), collection]);
};

exports.fetchDocumentInFirestoreCollection = function (documentId, collection, success, error) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");

    exec(success, error, SERVICE, "fetchDocumentInFirestoreCollection", [documentId.toString(), collection]);
};

exports.fetchFirestoreCollection = function (collection, filters, success, error) {
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");
    if (filters && (typeof filters !== 'object' || typeof filters.length === 'undefined' || (filters.length && typeof filters[0] !== 'object'))) return error("'filters' must be a array specifying a list of filters (as arrays) to apply to documents in the Firestore collection");

    exec(success, error, SERVICE, "fetchFirestoreCollection", [collection, filters || []]);
};

exports.listenToDocumentInFirestoreCollection = function (success, error, documentId, collection, includeMetadata) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");

    exec(success, error, SERVICE, "listenToDocumentInFirestoreCollection", [documentId.toString(), collection, includeMetadata]);
};

exports.listenToFirestoreCollection = function (success, error, collection, filters, includeMetadata) {
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");
    if (filters && (typeof filters !== 'object' || typeof filters.length === 'undefined')) return error("'filters' must be a array specifying a list of filters to apply to documents in the Firestore collection");

    exec(success, error, SERVICE, "listenToFirestoreCollection", [collection, filters, includeMetadata]);
};

exports.removeFirestoreListener = function (success, error, listenerId) {
    if (typeof listenerId === 'undefined') return error("'listenerId' must be specified");

    exec(success, error, SERVICE, "removeFirestoreListener", [listenerId.toString()]);
};
