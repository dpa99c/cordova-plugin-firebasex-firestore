# cordova-plugin-firebasex-firestore

[![npm version](https://img.shields.io/npm/v/cordova-plugin-firebasex-firestore.svg)](https://www.npmjs.com/package/cordova-plugin-firebasex-firestore)

Firebase Firestore module for the [modular FirebaseX Cordova plugin suite](https://github.com/dpa99c/cordova-plugin-firebasex#modular-plugins).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Installation](#installation)
  - [Plugin variables](#plugin-variables)
- [API](#api)
  - [addDocumentToFirestoreCollection](#adddocumenttofirestorecollection)
  - [setDocumentInFirestoreCollection](#setdocumentinfirestorecollection)
  - [updateDocumentInFirestoreCollection](#updatedocumentinfirestorecollection)
  - [deleteDocumentFromFirestoreCollection](#deletedocumentfromfirestorecollection)
  - [documentExistsInFirestoreCollection](#documentexistsinfirestorecollection)
  - [fetchDocumentInFirestoreCollection](#fetchdocumentinfirestorecollection)
  - [fetchFirestoreCollection](#fetchfirestorecollection)
  - [listenToDocumentInFirestoreCollection](#listentodocumentinfirestorecollection)
  - [listenToFirestoreCollection](#listentofirestorecollection)
  - [removeFirestoreListener](#removefirestorelistener)
- [Reporting issues](#reporting-issues)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation

Install the plugin by adding it to your project's config.xml:

    cordova plugin add cordova-plugin-firebasex-firestore

or by running:

    cordova plugin add cordova-plugin-firebasex-firestore

**This module depends on `cordova-plugin-firebasex-core` which will be installed automatically as a dependency.**

## Plugin variables

The following plugin variables are used to configure the firestore module at install time.
They can be set on the command line at plugin installation time:

    cordova plugin add cordova-plugin-firebasex-firestore --variable VARIABLE_NAME=value

Or in your `config.xml`:

    <plugin name="cordova-plugin-firebasex-firestore">
        <variable name="VARIABLE_NAME" value="value" />
    </plugin>

| Variable | Default | Description |
|---|---|---|
| `ANDROID_FIREBASE_FIRESTORE_VERSION` | `26.1.0` | Android Firebase Firestore SDK version. |
| `ANDROID_GRPC_OKHTTP` | `1.75.0` | Android gRPC OkHttp version (Firestore dependency). |
| `ANDROID_GSON_VERSION` | `2.13.2` | Google Gson library version (Firestore dependency). |
| `IOS_FIREBASE_SDK_VERSION` | `12.9.0` | iOS Firebase SDK version (for firestore pod). |
| `IOS_USE_PRECOMPILED_FIRESTORE_POD` | `false` | Use precompiled Firestore pod for faster iOS builds. See [Precompiled Firestore Pod](#precompiled-firestore-pod-ios) below. |

### Precompiled Firestore Pod (iOS)

For faster iOS builds, enable the precompiled Firestore pod:

```bash
cordova plugin add cordova-plugin-firebasex-firestore --variable IOS_USE_PRECOMPILED_FIRESTORE_POD=true
```

# API

The following methods are available via the `FirebasexFirestore` global object.

These API functions provide CRUD operations for working with documents in Firestore collections.

Notes:

-   Only top-level Firestore collections are currently supported - [subcollections](https://firebase.google.com/docs/firestore/manage-data/structure-data#subcollections) (nested collections within documents) are currently not supported due to the complexity of mapping the native objects into the plugin's JS API layer.
-   A document object may contain values of primitive Javascript types `string`, `number`, `boolean`, `array` or `object`.
    Arrays and objects may contain nested structures of these types.
-   If a collection name referenced in a document write operation does not already exist, it will be created by the first write operation referencing it.

## addDocumentToFirestoreCollection

Adds a new document to a Firestore collection, which will be allocated an auto-generated document ID.

**Parameters**:

-   {object} document - document object to add to collection
-   {string} collection - name of top-level collection to add document to.
-   {boolean} timestamp (optional) - Add 'created' and 'lastUpdate' variables in the document. Default `false`.
-   {function} success (optional) - callback function to call on successfully adding the document.
    Will be passed a {string} argument containing the auto-generated document ID that the document was stored against.
-   {function} error (optional) - callback function which will be passed a {string} error message as an argument.

```javascript
var document = {
    a_string: "foo",
    a_list: [1, 2, 3],
    an_object: {
        an_integer: 1,
    },
};
var collection = "my_collection";

// with timestamp
FirebasexFirestore.addDocumentToFirestoreCollection(
    document,
    collection,
    true,
    function (documentId) {
        console.log("Successfully added document with id=" + documentId);
    },
    function (error) {
        console.error("Error adding document: " + error);
    }
);

// without timestamp
FirebasexFirestore.addDocumentToFirestoreCollection(
    document,
    collection,
    function (documentId) {
        console.log("Successfully added document with id=" + documentId);
    },
    function (error) {
        console.error("Error adding document: " + error);
    }
);
```

## setDocumentInFirestoreCollection

Sets (adds/replaces) a document with the given ID in a Firestore collection.

**Parameters**:

-   {string} documentId - document ID to use when setting document in the collection.
-   {object} document - document object to set in collection.
-   {string} collection - name of top-level collection to set document in.
-   {boolean} timestamp (optional) - Add 'lastUpdate' variable in the document. Default `false`.
-   {function} success (optional) - callback function to call on successfully setting the document.
-   {function} error (optional) - callback function which will be passed a {string} error message as an argument.

```javascript
var documentId = "my_doc";
var document = {
    a_string: "foo",
    a_list: [1, 2, 3],
    an_object: {
        an_integer: 1,
    },
};
var collection = "my_collection";

// with timestamp
FirebasexFirestore.setDocumentInFirestoreCollection(
    documentId,
    document,
    collection,
    true,
    function () {
        console.log("Successfully set document with id=" + documentId);
    },
    function (error) {
        console.error("Error setting document: " + error);
    }
);

// without timestamp
FirebasexFirestore.setDocumentInFirestoreCollection(
    documentId,
    document,
    collection,
    function () {
        console.log("Successfully set document with id=" + documentId);
    },
    function (error) {
        console.error("Error setting document: " + error);
    }
);
```

## updateDocumentInFirestoreCollection

Updates an existing document with the given ID in a Firestore collection.
This is a non-destructive update that will only overwrite existing keys in the existing document or add new ones if they don't already exist.
If the no document with the specified ID exists in the collection, an error will be raised.

**Parameters**:

-   {string} documentId - document ID of the document to update.
-   {object} document - entire document or document fragment to update existing document with.
-   {string} collection - name of top-level collection to update document in.
-   {boolean} timestamp (optional) - Add 'lastUpdate' variable in the document. Default `false`.
-   {function} success (optional) - callback function to call on successfully updating the document.
-   {function} error (optional) - callback function which will be passed a {string} error message as an argument.

```javascript
var documentId = "my_doc";
var documentFragment = {
    a_string: "new value",
    a_new_string: "bar",
};
var collection = "my_collection";

// with timestamp
FirebasexFirestore.updateDocumentInFirestoreCollection(
    documentId,
    documentFragment,
    collection,
    true,
    function () {
        console.log("Successfully updated document with id=" + documentId);
    },
    function (error) {
        console.error("Error updating document: " + error);
    }
);

// without timestamp
FirebasexFirestore.updateDocumentInFirestoreCollection(
    documentId,
    documentFragment,
    collection,
    function () {
        console.log("Successfully updated document with id=" + documentId);
    },
    function (error) {
        console.error("Error updating document: " + error);
    }
);
```

## deleteDocumentFromFirestoreCollection

Deletes an existing document with the given ID in a Firestore collection.

Note: If the no document with the specified ID exists in the collection, the Firebase SDK will still return a successful outcome.

**Parameters**:

-   {string} documentId - document ID of the document to delete.
-   {string} collection - name of top-level collection to delete document in.
-   {function} success - callback function to call on successfully deleting the document.
-   {function} error - callback function which will be passed a {string} error message as an argument.

```javascript
var documentId = "my_doc";
var collection = "my_collection";
FirebasexFirestore.deleteDocumentFromFirestoreCollection(
    documentId,
    collection,
    function () {
        console.log("Successfully deleted document with id=" + documentId);
    },
    function (error) {
        console.error("Error deleting document: " + error);
    }
);
```

## documentExistsInFirestoreCollection

Indicates if a document with the given ID exists in a Firestore collection.

**Parameters**:

-   {string} documentId - document ID of the document.
-   {string} collection - name of top-level collection to check for document.
-   {function} success - callback function to call pass result.
    Will be passed an {boolean} which is `true` if a document exists.
-   {function} error - callback function which will be passed a {string} error message as an argument.

```javascript
var documentId = "my_doc";
var collection = "my_collection";
FirebasexFirestore.documentExistsInFirestoreCollection(
    documentId,
    collection,
    function (exists) {
        console.log("Document " + (exists ? "exists" : "doesn't exist"));
    },
    function (error) {
        console.error("Error fetching document: " + error);
    }
);
```

## fetchDocumentInFirestoreCollection

Fetches an existing document with the given ID from a Firestore collection.

Notes:

-   If no document with the specified ID exists in the collection, the error callback will be invoked.
-   If the document contains references to another document, they will be converted to the document path string to avoid circular reference issues.

**Parameters**:

-   {string} documentId - document ID of the document to fetch.
-   {string} collection - name of top-level collection to fetch document from.
-   {function} success - callback function to call on successfully fetching the document.
    Will be passed an {object} contain the document contents.
-   {function} error - callback function which will be passed a {string} error message as an argument.

```javascript
var documentId = "my_doc";
var collection = "my_collection";
FirebasexFirestore.fetchDocumentInFirestoreCollection(
    documentId,
    collection,
    function (document) {
        console.log(
            "Successfully fetched document: " + JSON.stringify(document)
        );
    },
    function (error) {
        console.error("Error fetching document: " + error);
    }
);
```

## fetchFirestoreCollection

Fetches all the documents in the specific collection.

Notes:

-   If no collection with the specified name exists, the error callback will be invoked.
-   If the documents in the collection contain references to another document, they will be converted to the document path string to avoid circular reference issues.

**Parameters**:

-   {string} collection - name of top-level collection to fetch.
-   {array} filters (optional) - a list of filters to sort/filter the documents returned from your collection.

    -   Supports `where`, `orderBy`, `startAt`, `endAt` and `limit` filters.
        -   See the [Firestore documentation](https://firebase.google.com/docs/firestore/query-data/queries) for more details.
    -   Each filter is defined as an array of filter components:
        -   `where`: [`where`, `fieldName`, `operator`, `value`, `valueType`]
            -   `fieldName` - name of field to match
            -   `operator` - operator to apply to match
                -   supported operators: `==`, `<`, `>`, `<=`, `>=`, `array-contains`
            -   `value` - field value to match
            -   `valueType` (optional) - type of variable to fetch value as
                -   supported types: `string`, `boolean`, `integer`, `double`, `long`
                -   if not specified, defaults to `string`
        -   `startAt`: [`startAt`, `value`, `valueType`]
            -   `value` - field value to start at
            -   `valueType` (optional) - type of variable to fetch value as (as above)
        -   `endAt`: [`endAt`, `value`, `valueType`]
            -   `value` - field value to end at
            -   `valueType` (optional) - type of variable to fetch value as (as above)
        -   `orderBy`: [`orderBy`, `fieldName`, `sortDirection`]
            -   `fieldName` - name of field to order by
            -   `sortDirection` - direction to order in: `asc` or `desc`
        -   `limit`: [`limit`, `value`]
            -   `value` - `integer` defining maximum number of results to return.

-   {function} success - callback function to call on successfully fetching the collection.
    Will be passed an {object} containing all the documents in the collection, indexed by document ID.
    If a Firebase collection with that name does not exist or it contains no documents, the object will be empty.
-   {function} error - callback function which will be passed a {string} error message as an argument.

```javascript
var collection = "my_collection";
var filters = [
    ["where", "my_string", "==", "foo"],
    ["where", "my_integer", ">=", 0, "integer"],
    ["where", "my_boolean", "==", true, "boolean"],
    ["orderBy", "an_integer", "desc"],
    ["startAt", "an_integer", 10, "integer"],
    ["endAt", "an_integer", 100, "integer"],
    ["limit", 100000],
];

FirebasexFirestore.fetchFirestoreCollection(
    collection,
    filters,
    function (documents) {
        console.log(
            "Successfully fetched collection: " + JSON.stringify(documents)
        );
    },
    function (error) {
        console.error("Error fetching collection: " + error);
    }
);
```

## listenToDocumentInFirestoreCollection

Adds a listener to detect real-time changes to the specified document.

Note: If the document contains references to another document, they will be converted to the document path string to avoid circular reference issues.

Upon adding a listener using this function, the success callback function will be invoked with an `id` event which specifies the native ID of the added listener.
This can be used to subsequently remove the listener using [`removeFirestoreListener()`](#removefirestorelistener).
For example:

```json
{
    "eventType": "id",
    "id": 12345
}
```

The callback will also be immediately invoked again with a `change` event which contains a snapshot of the document at the time of adding the listener.
Then each time the document is changed, either locally or remotely, the callback will be invoked with another `change` event detailing the change.

Event fields:

-   `source` - specifies if the change was `local` (made locally on the app) or `remote` (made via the server).
-   `fromCache` - specifies whether the snapshot was read from local cache
-   `snapshot` - a snapshot of document at the time of the change.
    -   May not be present if change event is due to a metadata change.

For example:

```json
{
    "eventType": "change",
    "source": "remote",
    "fromCache": true,
    "snapshot": {
        "a_field": "a_value"
    }
}
```

See the [Firestore documentation](https://firebase.google.com/docs/firestore/query-data/listen) for more info on real-time listeners.

**Parameters**:

-   {function} success - callback function to call on successfully adding the listener AND on subsequently detecting changes to that document.
    Will be passed an {object} representing the `id` or `change` event.
-   {function} error - callback function which will be passed a {string} error message as an argument.
-   {string} documentId - document ID of the document to listen to.
-   {string} collection - name of top-level collection to listen to the document in.
-   {boolean} includeMetadata - whether to listen for changes to document metadata.
    -   Defaults to `false`.
    -   See [Events for metadata changes](https://firebase.google.com/docs/firestore/query-data/listen#events-metadata-changes) for more info.

```javascript
var documentId = "my_doc";
var collection = "my_collection";
var includeMetadata = true;
var listenerId;

FirebasexFirestore.listenToDocumentInFirestoreCollection(
    function (event) {
        switch (event.eventType) {
            case "id":
                listenerId = event.id;
                console.log(
                    "Successfully added document listener with id=" + listenerId
                );
                break;
            case "change":
                console.log("Detected document change");
                console.log("Source of change: " + event.source);
                console.log("Read from local cache: " + event.fromCache);
                if (event.snapshot) {
                    console.log(
                        "Document snapshot: " + JSON.stringify(event.snapshot)
                    );
                }
                break;
        }
    },
    function (error) {
        console.error("Error adding listener: " + error);
    },
    documentId,
    collection,
    includeMetadata
);
```

## listenToFirestoreCollection

Adds a listener to detect real-time changes to documents in a Firestore collection.

Note: If the documents in the collection contain references to another document, they will be converted to the document path string to avoid circular reference issues.

Upon adding a listener using this function, the success callback function will be invoked with an `id` event which specifies the native ID of the added listener.
This can be used to subsequently remove the listener using [`removeFirestoreListener()`](#removefirestorelistener).
For example:

```json
{
    "eventType": "id",
    "id": 12345
}
```

The callback will also be immediately invoked again with a `change` event which contains a snapshot of all documents in the collection at the time of adding the listener.
Then each time document(s) in the collection change, either locally or remotely, the callback will be invoked with another `change` event detailing the change.

Event fields:

-   `documents` - key/value list of document changes indexed by document ID. For each document change:
    -   `source` - specifies if the change was `local` (made locally on the app) or `remote` (made via the server).
    -   `fromCache` - specifies whether the snapshot was read from local cache
    -   `type` - specifies the change type:
        -   `added` - document was added to collection
        -   `modified` - document was modified in collection
        -   `removed` - document was removed from collection
        -   `metadata` - document metadata changed
    -   `snapshot` - a snapshot of document at the time of the change.
        -   May not be present if change event is due to a metadata change.

For example:

```json
{
    "eventType": "change",
    "documents": {
        "a_doc": {
            "source": "remote",
            "fromCache": false,
            "type": "added",
            "snapshot": {
                "a_field": "a_value"
            }
        },
        "another_doc": {
            "source": "remote",
            "fromCache": false,
            "type": "removed",
            "snapshot": {
                "foo": "bar"
            }
        }
    }
}
```

See the [Firestore documentation](https://firebase.google.com/docs/firestore/query-data/listen) for more info on real-time listeners.

**Parameters**:

-   {function} success - callback function to call on successfully adding the listener AND on subsequently detecting changes to that collection.
    Will be passed an {object} representing the `id` or `change` event.
-   {function} error - callback function which will be passed a {string} error message as an argument.
-   {string} collection - name of top-level collection to listen to the document in.
-   {array} filters (optional) - a list of filters to sort/filter the documents returned from your collection.
    -   See [fetchFirestoreCollection](#fetchfirestorecollection)
-   {boolean} includeMetadata (optional) - whether to listen for changes to document metadata.
    -   Defaults to `false`.
    -   See [Events for metadata changes](https://firebase.google.com/docs/firestore/query-data/listen#events-metadata-changes) for more info.

```javascript
var collection = "my_collection";
var filters = [
    ["where", "field", "==", "value"],
    ["orderBy", "field", "desc"],
];
var includeMetadata = true;
var listenerId;

FirebasexFirestore.listenToFirestoreCollection(
    function (event) {
        switch (event.eventType) {
            case "id":
                listenerId = event.id;
                console.log(
                    "Successfully added collection listener with id=" +
                        listenerId
                );
                break;
            case "change":
                console.log("Detected collection change");
                if (event.documents) {
                    for (var documentId in event.documents) {
                        console.log("Document ID: " + documentId);

                        var docChange = event.documents[documentId];
                        console.log("Source of change: " + docChange.source);
                        console.log("Change type: " + docChange.type);
                        console.log(
                            "Read from local cache: " + docChange.fromCache
                        );
                        if (docChange.snapshot) {
                            console.log(
                                "Document snapshot: " +
                                    JSON.stringify(docChange.snapshot)
                            );
                        }
                    }
                }
                break;
        }
    },
    function (error) {
        console.error("Error adding listener: " + error);
    },
    collection,
    filters,
    includeMetadata
);
```

## removeFirestoreListener

Removes an existing native Firestore listener (see [detaching listeners](https://firebase.google.com/docs/firestore/query-data/listen#detach_a_listener)) added with [`listenToDocumentInFirestoreCollection()`](#listentodocumentinfirestorecollection) or [`listenToFirestoreCollection()`](#listentofirestorecollection).

Upon adding a listener using either of the above functions, the success callback function will be invoked with an `id` event which specifies the native ID of the added listener.
For example:

```json
{
    "eventType": "id",
    "id": 12345
}
```

This can be used to subsequently remove the listener using this function.
You should remove listeners when you're not using them as while active they maintain a continual HTTP connection to the Firebase servers costing memory, bandwidth and money: see [best practices for realtime updates](https://firebase.google.com/docs/firestore/best-practices#realtime_updates) and [billing for realtime updates](https://firebase.google.com/docs/firestore/pricing#listens).

**Parameters**:

-   {function} success - callback function to call on successfully removing the listener.
-   {function} error - callback function which will be passed a {string} error message as an argument.
-   {string|number} listenerId - ID of the listener to remove

```javascript
FirebasexFirestore.removeFirestoreListener(
    function () {
        console.log("Successfully removed listener");
    },
    function (error) {
        console.error("Error removing listener: " + error);
    },
    listenerId
);
```

# Reporting issues

Before reporting an issue with this plugin, please do the following:
- Check the existing [issues](https://github.com/dpa99c/cordova-plugin-firebasex-firestore/issues) to see if the issue has already been reported.
- Check the [issue template](https://github.com/dpa99c/cordova-plugin-firebasex-firestore/issues/new/choose) and provide all requested information.
- The more information and context you provide, the easier it is for the maintainers to understand the issue and provide a resolution.
