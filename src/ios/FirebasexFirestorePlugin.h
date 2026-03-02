/**
 * @file FirebasexFirestorePlugin.h
 * @brief Cordova plugin interface for Cloud Firestore on iOS.
 *
 * Provides CRUD operations, filtered collection queries, and real-time
 * snapshot listeners with change tracking.
 */
#import <Cordova/CDVPlugin.h>
@import FirebaseFirestore;

/**
 * @brief Cordova plugin class for Cloud Firestore on iOS.
 *
 * @see https://firebase.google.com/docs/firestore
 */
@interface FirebasexFirestorePlugin : CDVPlugin

/** Adds a document with auto-generated ID. @param command args[0]: document, args[1]: collection, args[2]: timestamp. */
- (void)addDocumentToFirestoreCollection:(CDVInvokedUrlCommand *)command;
/** Sets/overwrites a document by ID. @param command args[0]: documentId, args[1]: document, args[2]: collection, args[3]: timestamp. */
- (void)setDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command;
/** Updates fields of an existing document. @param command args[0]: documentId, args[1]: document, args[2]: collection, args[3]: timestamp. */
- (void)updateDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command;
/** Deletes a document by ID. @param command args[0]: documentId, args[1]: collection. */
- (void)deleteDocumentFromFirestoreCollection:(CDVInvokedUrlCommand *)command;
/** Checks if a document exists. @param command args[0]: documentId, args[1]: collection. */
- (void)documentExistsInFirestoreCollection:(CDVInvokedUrlCommand *)command;
/** Fetches a single document by ID. @param command args[0]: documentId, args[1]: collection. */
- (void)fetchDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command;
/** Fetches a collection with optional filters. @param command args[0]: collection, args[1]: filters array. */
- (void)fetchFirestoreCollection:(CDVInvokedUrlCommand *)command;
/** Listens for real-time changes on a document. @param command args[0]: documentId, args[1]: collection, args[2]: includeMetadata. */
- (void)listenToDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command;
/** Listens for real-time changes on a collection. @param command args[0]: collection, args[1]: filters, args[2]: includeMetadata. */
- (void)listenToFirestoreCollection:(CDVInvokedUrlCommand *)command;
/** Removes a snapshot listener by ID. @param command args[0]: listenerId. */
- (void)removeFirestoreListener:(CDVInvokedUrlCommand *)command;

@end
