# cordova-plugin-firebasex-firestore

Firestore module for `cordova-plugin-firebasex`.

## Installation

```bash
cordova plugin add cordova-plugin-firebasex-firestore
```

This plugin depends on `cordova-plugin-firebasex-core` which will be installed automatically.

## Preferences

| Preference | Default | Description |
|---|---|---|
| `IOS_USE_PRECOMPILED_FIRESTORE_POD` | `false` | Use precompiled Firestore pod for faster iOS builds |

## API

### addDocumentToFirestoreCollection(document, collection, timestamp, success, error)
Add a new document to a Firestore collection. Returns the auto-generated document ID.

```javascript
FirebasexFirestorePlugin.addDocumentToFirestoreCollection(
    { name: "John", age: 30 },
    "users",
    true,   // add created/lastUpdate timestamps
    function(docId) { console.log("Added doc: " + docId); },
    function(error) { console.error(error); }
);
```

### setDocumentInFirestoreCollection(documentId, document, collection, timestamp, success, error)
Set (overwrite) a document in a Firestore collection.

### updateDocumentInFirestoreCollection(documentId, document, collection, timestamp, success, error)
Update specific fields of a document.

### deleteDocumentFromFirestoreCollection(documentId, collection, success, error)
Delete a document from a collection.

### documentExistsInFirestoreCollection(documentId, collection, success, error)
Check if a document exists.

### fetchDocumentInFirestoreCollection(documentId, collection, success, error)
Fetch a single document.

### fetchFirestoreCollection(collection, filters, success, error)
Fetch all documents in a collection, optionally filtered.

```javascript
FirebasexFirestorePlugin.fetchFirestoreCollection(
    "users",
    [
        ["where", "age", ">=", 18, "integer"],
        ["orderBy", "name", "asc"],
        ["limit", 10]
    ],
    function(docs) { console.log(docs); },
    function(error) { console.error(error); }
);
```

### listenToDocumentInFirestoreCollection(success, error, documentId, collection, includeMetadata)
Listen to real-time changes on a document. Returns a listener ID via the first callback event.

### listenToFirestoreCollection(success, error, collection, filters, includeMetadata)
Listen to real-time changes on a collection. Returns a listener ID via the first callback event.

### removeFirestoreListener(success, error, listenerId)
Remove a previously registered listener.

## Filters

Filters are arrays of arrays with the following formats:
- `["where", fieldName, operator, value, type]` - operators: `==`, `<`, `>`, `<=`, `>=`, `array-contains`
- `["orderBy", fieldName, direction]` - direction: `asc` or `desc`
- `["startAt", value, type]`
- `["endAt", value, type]`
- `["limit", count]`

Types: `string` (default), `boolean`, `integer`, `double`, `long`

## Precompiled Firestore Pod (iOS)

For faster iOS builds, enable the precompiled Firestore pod:

```bash
cordova plugin add cordova-plugin-firebasex-firestore --variable IOS_USE_PRECOMPILED_FIRESTORE_POD=true
```

Note: Requires the `SKIP_FIREBASE_FIRESTORE_SWIFT` environment variable to be set.
