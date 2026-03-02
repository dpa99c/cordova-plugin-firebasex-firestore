/**
 * @fileoverview Cordova JavaScript interface for the FirebaseX Firestore plugin.
 *
 * Provides CRUD operations on Firestore documents and collections, query filtering,
 * and real-time snapshot listeners with change tracking.
 *
 * @module firebasex-firestore
 * @see https://firebase.google.com/docs/firestore
 */

var exec = require('cordova/exec');

/** @private Cordova service name registered in plugin.xml. */
var SERVICE = 'FirebasexFirestorePlugin';

/**
 * Wraps a callback so its result is coerced to a strict boolean.
 *
 * @private
 * @param {function} callback - The original callback.
 * @returns {function} A wrapper that calls callback with a boolean.
 */
var ensureBooleanFn = function (callback) {
    return function (result) {
        callback(result === true || result === 1);
    };
};

/**
 * Adds a new document with an auto-generated ID to a Firestore collection.
 *
 * @param {Object} document - The document data to add (must be a plain object, not an array).
 * @param {string} collection - The Firestore collection path.
 * @param {boolean} [timestamp=false] - If {@code true}, adds {@code created} and
 *   {@code lastUpdate} Firestore Timestamp fields automatically.
 * @param {function} success - Called with the auto-generated document ID string.
 * @param {function} error - Called with an error message on failure.
 */
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

/**
 * Creates or overwrites a document with a specific ID in a Firestore collection.
 *
 * @param {string|number} documentId - The document identifier.
 * @param {Object} document - The document data.
 * @param {string} collection - The Firestore collection path.
 * @param {boolean} [timestamp=false] - If {@code true}, adds a {@code lastUpdate} Timestamp field.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
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

/**
 * Updates specific fields of an existing document in a Firestore collection.
 * Fails if the document does not exist.
 *
 * @param {string|number} documentId - The document identifier.
 * @param {Object} document - The fields to update.
 * @param {string} collection - The Firestore collection path.
 * @param {boolean} [timestamp=false] - If {@code true}, updates the {@code lastUpdate} Timestamp field.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
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

/**
 * Deletes a document from a Firestore collection.
 *
 * @param {string|number} documentId - The document identifier.
 * @param {string} collection - The Firestore collection path.
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message on failure.
 */
exports.deleteDocumentFromFirestoreCollection = function (documentId, collection, success, error) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");

    exec(success, error, SERVICE, "deleteDocumentFromFirestoreCollection", [documentId.toString(), collection]);
};

/**
 * Checks whether a document exists in a Firestore collection.
 *
 * @param {string|number} documentId - The document identifier.
 * @param {string} collection - The Firestore collection path.
 * @param {function} success - Called with a boolean: {@code true} if the document exists.
 * @param {function} error - Called with an error message on failure.
 */
exports.documentExistsInFirestoreCollection = function (documentId, collection, success, error) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");

    exec(ensureBooleanFn(success), error, SERVICE, "documentExistsInFirestoreCollection", [documentId.toString(), collection]);
};

/**
 * Fetches a single document from a Firestore collection.
 *
 * @param {string|number} documentId - The document identifier.
 * @param {string} collection - The Firestore collection path.
 * @param {function} success - Called with the document data as a JSON object.
 * @param {function} error - Called with an error message on failure or if not found.
 */
exports.fetchDocumentInFirestoreCollection = function (documentId, collection, success, error) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");

    exec(success, error, SERVICE, "fetchDocumentInFirestoreCollection", [documentId.toString(), collection]);
};

/**
 * Fetches all documents from a Firestore collection, optionally filtered.
 *
 * @param {string} collection - The Firestore collection path.
 * @param {Array.<Array>} [filters] - An array of filter arrays. Each filter is an array
 *   describing a query operation. Supported filter types:
 *   - {@code ["where", fieldName, operator, value, type]} — operators: ==, <, >, <=, >=, array-contains
 *   - {@code ["orderBy", fieldName, direction]} — direction: "asc" or "desc"
 *   - {@code ["startAt", value, type]}
 *   - {@code ["endAt", value, type]}
 *   - {@code ["limit", count]}
 * @param {function} success - Called with a JSON object mapping document IDs to document data.
 * @param {function} error - Called with an error message on failure.
 */
exports.fetchFirestoreCollection = function (collection, filters, success, error) {
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");
    if (filters && (typeof filters !== 'object' || typeof filters.length === 'undefined' || (filters.length && typeof filters[0] !== 'object'))) return error("'filters' must be a array specifying a list of filters (as arrays) to apply to documents in the Firestore collection");

    exec(success, error, SERVICE, "fetchFirestoreCollection", [collection, filters || []]);
};

/**
 * Registers a real-time listener on a single document in a Firestore collection.
 *
 * The success callback is called multiple times: first with {@code {eventType: "id", id: listenerId}},
 * then with {@code {eventType: "change", snapshot: ..., source: "local"|"remote", fromCache: boolean}}
 * on each change.
 *
 * @param {function} success - Called with listener events.
 * @param {function} error - Called with an error message on failure.
 * @param {string|number} documentId - The document identifier.
 * @param {string} collection - The Firestore collection path.
 * @param {boolean} includeMetadata - Whether to include metadata-only changes.
 */
exports.listenToDocumentInFirestoreCollection = function (success, error, documentId, collection, includeMetadata) {
    if (typeof documentId !== 'string' && typeof documentId !== 'number') return error("'documentId' must be a string or number specifying the Firestore document identifier");
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");

    exec(success, error, SERVICE, "listenToDocumentInFirestoreCollection", [documentId.toString(), collection, includeMetadata]);
};

/**
 * Registers a real-time listener on an entire Firestore collection, optionally filtered.
 *
 * The success callback is called multiple times: first with {@code {eventType: "id", id: listenerId}},
 * then with {@code {eventType: "change", documents: {...}}} on each change.
 * Each document entry includes {@code type} ("new", "modified", "removed"),
 * {@code snapshot}, {@code source}, and {@code fromCache}.
 *
 * @param {function} success - Called with listener events.
 * @param {function} error - Called with an error message on failure.
 * @param {string} collection - The Firestore collection path.
 * @param {Array.<Array>} [filters] - Query filters (same format as {@link fetchFirestoreCollection}).
 * @param {boolean} includeMetadata - Whether to include metadata-only changes.
 */
exports.listenToFirestoreCollection = function (success, error, collection, filters, includeMetadata) {
    if (typeof collection !== 'string') return error("'collection' must be a string specifying the Firestore collection name");
    if (filters && (typeof filters !== 'object' || typeof filters.length === 'undefined')) return error("'filters' must be a array specifying a list of filters to apply to documents in the Firestore collection");

    exec(success, error, SERVICE, "listenToFirestoreCollection", [collection, filters, includeMetadata]);
};

/**
 * Removes a previously registered Firestore snapshot listener.
 *
 * @param {function} success - Called on success.
 * @param {function} error - Called with an error message if the listener ID is not found.
 * @param {string|number} listenerId - The listener ID returned in the initial listener response.
 */
exports.removeFirestoreListener = function (success, error, listenerId) {
    if (typeof listenerId === 'undefined') return error("'listenerId' must be specified");

    exec(success, error, SERVICE, "removeFirestoreListener", [listenerId.toString()]);
};
