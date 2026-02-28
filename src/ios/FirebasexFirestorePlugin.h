#import <Cordova/CDVPlugin.h>
@import FirebaseFirestore;

@interface FirebasexFirestorePlugin : CDVPlugin

- (void)addDocumentToFirestoreCollection:(CDVInvokedUrlCommand *)command;
- (void)setDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command;
- (void)updateDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command;
- (void)deleteDocumentFromFirestoreCollection:(CDVInvokedUrlCommand *)command;
- (void)documentExistsInFirestoreCollection:(CDVInvokedUrlCommand *)command;
- (void)fetchDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command;
- (void)fetchFirestoreCollection:(CDVInvokedUrlCommand *)command;
- (void)listenToDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command;
- (void)listenToFirestoreCollection:(CDVInvokedUrlCommand *)command;
- (void)removeFirestoreListener:(CDVInvokedUrlCommand *)command;

@end
