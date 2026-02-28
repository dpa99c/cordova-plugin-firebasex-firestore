#import "FirebasexFirestorePlugin.h"
#import "FirebasexCorePlugin.h"

@interface FirebasexFirestorePlugin ()
@property(nonatomic, strong) FIRFirestore *firestore;
@property(nonatomic, strong) NSMutableDictionary *firestoreListeners;
@end

@implementation FirebasexFirestorePlugin

- (void)pluginInitialize {
    NSLog(@"FirebasexFirestorePlugin: pluginInitialize");
    self.firestore = [FIRFirestore firestore];
    self.firestoreListeners = [[NSMutableDictionary alloc] init];
}

#pragma mark - ID generation

- (int)generateId {
    int key = -1;
    while (key < 0 || [self.firestoreListeners objectForKey:[NSNumber numberWithInt:key]] != nil) {
        key = arc4random_uniform(100000);
    }
    return key;
}

- (NSNumber *)saveFirestoreListener:(id<FIRListenerRegistration>)firestoreListener {
    @synchronized(self.firestoreListeners) {
        int listenerId = [self generateId];
        NSNumber *key = [NSNumber numberWithInt:listenerId];
        [self.firestoreListeners setObject:firestoreListener forKey:key];
        return key;
    }
}

- (bool)_removeFirestoreListener:(NSNumber *)key {
    @synchronized(self.firestoreListeners) {
        bool removed = false;
        if ([self.firestoreListeners objectForKey:key] != nil) {
            id<FIRListenerRegistration> firestoreListener = [self.firestoreListeners objectForKey:key];
            [firestoreListener remove];
            [self.firestoreListeners removeObjectForKey:key];
            removed = true;
        }
        return removed;
    }
}

#pragma mark - Data sanitization

- (NSMutableDictionary *)sanitiseFirestoreDataDictionary:(NSDictionary *)data {
    NSMutableDictionary *sanitisedData = [[NSMutableDictionary alloc] init];
    for (id key in data) {
        id value = [data objectForKey:key];
        value = [self sanitizeFirestoreData:value];
        [sanitisedData setValue:value forKey:key];
    }
    return sanitisedData;
}

- (id)sanitizeFirestoreData:(id)value {
    if ([value isKindOfClass:[FIRDocumentReference class]]) {
        FIRDocumentReference *reference = (FIRDocumentReference *)value;
        return reference.path;
    } else if ([value isKindOfClass:[NSDictionary class]]) {
        return [self sanitiseFirestoreDataDictionary:value];
    } else if ([value isKindOfClass:[NSArray class]]) {
        NSMutableArray *array = [[NSMutableArray alloc] init];
        for (id element in value) {
            id sanitizedValue = [self sanitizeFirestoreData:element];
            [array addObject:sanitizedValue];
        }
        return array;
    } else if ([value isKindOfClass:[FIRTimestamp class]]) {
        FIRTimestamp *dateTimestamp = (FIRTimestamp *)value;
        NSDictionary *dateDictionary = @{
            @"nanoseconds": [NSNumber numberWithInt:dateTimestamp.nanoseconds],
            @"seconds": [NSNumber numberWithLong:dateTimestamp.seconds]
        };
        return dateDictionary;
    } else if ([value isKindOfClass:[NSNumber class]]) {
        double number = [value doubleValue];
        if (isnan(number) || isinf(number)) {
            return nil;
        }
    }
    return value;
}

#pragma mark - Query filters

- (FIRQuery *)applyFiltersToFirestoreCollectionQuery:(NSArray *)filters query:(FIRQuery *)query {
    for (int i = 0; i < [filters count]; i++) {
        NSArray *filter = [filters objectAtIndex:i];
        if ([[filter objectAtIndex:0] isEqualToString:@"where"]) {
            if ([[filter objectAtIndex:2] isEqualToString:@"=="]) {
                query = [query queryWhereField:[filter objectAtIndex:1]
                                     isEqualTo:[self getFilterValueAsType:filter valueIndex:3 typeIndex:4]];
            }
            if ([[filter objectAtIndex:2] isEqualToString:@"<"]) {
                query = [query queryWhereField:[filter objectAtIndex:1]
                                    isLessThan:[self getFilterValueAsType:filter valueIndex:3 typeIndex:4]];
            }
            if ([[filter objectAtIndex:2] isEqualToString:@">"]) {
                query = [query queryWhereField:[filter objectAtIndex:1]
                                 isGreaterThan:[self getFilterValueAsType:filter valueIndex:3 typeIndex:4]];
            }
            if ([[filter objectAtIndex:2] isEqualToString:@"<="]) {
                query = [query queryWhereField:[filter objectAtIndex:1]
                           isLessThanOrEqualTo:[self getFilterValueAsType:filter valueIndex:3 typeIndex:4]];
            }
            if ([[filter objectAtIndex:2] isEqualToString:@">="]) {
                query = [query queryWhereField:[filter objectAtIndex:1]
                        isGreaterThanOrEqualTo:[self getFilterValueAsType:filter valueIndex:3 typeIndex:4]];
            }
            if ([[filter objectAtIndex:2] isEqualToString:@"array-contains"]) {
                query = [query queryWhereField:[filter objectAtIndex:1]
                                 arrayContains:[self getFilterValueAsType:filter valueIndex:3 typeIndex:4]];
            }
            continue;
        }
        if ([[filter objectAtIndex:0] isEqualToString:@"orderBy"]) {
            query = [query queryOrderedByField:[filter objectAtIndex:1]
                                    descending:([[filter objectAtIndex:2] isEqualToString:@"desc"])];
            continue;
        }
        if ([[filter objectAtIndex:0] isEqualToString:@"startAt"]) {
            query = [query queryStartingAtValues:[self getFilterValueAsType:filter valueIndex:1 typeIndex:2]];
            continue;
        }
        if ([[filter objectAtIndex:0] isEqualToString:@"endAt"]) {
            query = [query queryEndingAtValues:[self getFilterValueAsType:filter valueIndex:1 typeIndex:2]];
            continue;
        }
        if ([[filter objectAtIndex:0] isEqualToString:@"limit"]) {
            query = [query queryLimitedTo:[(NSNumber *)[filter objectAtIndex:1] integerValue]];
            continue;
        }
    }
    return query;
}

- (id)getFilterValueAsType:(NSArray *)filter valueIndex:(int)valueIndex typeIndex:(int)typeIndex {
    id typedValue = [filter objectAtIndex:valueIndex];

    NSString *type = @"string";
    if ([filter objectAtIndex:typeIndex] != nil) {
        type = [filter objectAtIndex:typeIndex];
    }

    if ([type isEqual:@"boolean"]) {
        if ([typedValue isKindOfClass:[NSNumber class]]) {
            typedValue = [NSNumber numberWithBool:typedValue];
        } else if ([typedValue isKindOfClass:[NSString class]]) {
            bool boolValue = [typedValue boolValue];
            typedValue = [NSNumber numberWithBool:boolValue];
        }
    } else if ([type isEqual:@"integer"] || [type isEqual:@"long"]) {
        if ([typedValue isKindOfClass:[NSString class]]) {
            NSInteger intValue = [typedValue integerValue];
            typedValue = [NSNumber numberWithInteger:intValue];
        }
    } else if ([type isEqual:@"double"]) {
        if ([typedValue isKindOfClass:[NSString class]]) {
            double doubleValue = [typedValue doubleValue];
            typedValue = [NSNumber numberWithDouble:doubleValue];
        }
    } else { // string
        if ([typedValue isKindOfClass:[NSNumber class]]) {
            if ([self isBoolNumber:typedValue]) {
                bool boolValue = [typedValue boolValue];
                typedValue = boolValue ? @"true" : @"false";
            } else {
                typedValue = [typedValue stringValue];
            }
        }
    }

    return typedValue;
}

- (BOOL)isBoolNumber:(NSNumber *)num {
    CFTypeID boolID = CFBooleanGetTypeID();
    CFTypeID numID = CFGetTypeID((__bridge CFTypeRef)(num));
    return numID == boolID;
}

#pragma mark - CRUD operations

- (void)addDocumentToFirestoreCollection:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSDictionary *document = [command.arguments objectAtIndex:0];
            NSString *collection = [command.arguments objectAtIndex:1];
            bool timestamp = [[command.arguments objectAtIndex:2] boolValue];

            NSMutableDictionary *document_mutable = [document mutableCopy];

            if (timestamp) {
                document_mutable[@"created"] = [FIRTimestamp timestampWithDate:[NSDate date]];
                document_mutable[@"lastUpdate"] = [FIRTimestamp timestampWithDate:[NSDate date]];
            }

            __block FIRDocumentReference *ref = [[self.firestore collectionWithPath:collection]
                addDocumentWithData:document_mutable
                         completion:^(NSError *_Nullable error) {
                             [[FirebasexCorePlugin sharedInstance] handleStringResultWithPotentialError:error
                                                                                               command:command
                                                                                                result:ref.documentID];
                         }];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

- (void)setDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *documentId = [command.arguments objectAtIndex:0];
            NSDictionary *document = [command.arguments objectAtIndex:1];
            NSString *collection = [command.arguments objectAtIndex:2];
            bool timestamp = [[command.arguments objectAtIndex:3] boolValue];

            NSMutableDictionary *document_mutable = [document mutableCopy];

            if (timestamp) {
                document_mutable[@"lastUpdate"] = [FIRTimestamp timestampWithDate:[NSDate date]];
            }

            [[[self.firestore collectionWithPath:collection] documentWithPath:documentId]
                   setData:document_mutable
                completion:^(NSError *_Nullable error) {
                    [[FirebasexCorePlugin sharedInstance] handleEmptyResultWithPotentialError:error command:command];
                }];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

- (void)updateDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *documentId = [command.arguments objectAtIndex:0];
            NSDictionary *document = [command.arguments objectAtIndex:1];
            NSString *collection = [command.arguments objectAtIndex:2];
            bool timestamp = [[command.arguments objectAtIndex:3] boolValue];

            NSMutableDictionary *document_mutable = [document mutableCopy];

            if (timestamp) {
                document_mutable[@"lastUpdate"] = [FIRTimestamp timestampWithDate:[NSDate date]];
            }

            FIRDocumentReference *docRef = [[self.firestore collectionWithPath:collection] documentWithPath:documentId];
            if (docRef != nil) {
                [docRef updateData:document_mutable
                        completion:^(NSError *_Nullable error) {
                            [[FirebasexCorePlugin sharedInstance] handleEmptyResultWithPotentialError:error command:command];
                        }];
            } else {
                [[FirebasexCorePlugin sharedInstance] sendPluginErrorWithMessage:@"Document not found in collection" :command];
            }
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

- (void)deleteDocumentFromFirestoreCollection:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *documentId = [command.arguments objectAtIndex:0];
            NSString *collection = [command.arguments objectAtIndex:1];

            [[[self.firestore collectionWithPath:collection] documentWithPath:documentId]
                deleteDocumentWithCompletion:^(NSError *_Nullable error) {
                    [[FirebasexCorePlugin sharedInstance] handleEmptyResultWithPotentialError:error command:command];
                }];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

- (void)documentExistsInFirestoreCollection:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *documentId = [command.arguments objectAtIndex:0];
            NSString *collection = [command.arguments objectAtIndex:1];

            FIRDocumentReference *docRef = [[self.firestore collectionWithPath:collection] documentWithPath:documentId];
            if (docRef != nil) {
                [docRef getDocumentWithCompletion:^(FIRDocumentSnapshot *_Nullable snapshot, NSError *_Nullable error) {
                    BOOL docExists = snapshot.data != nil;
                    [[FirebasexCorePlugin sharedInstance] handleBoolResultWithPotentialError:error command:command result:docExists];
                }];
            } else {
                [[FirebasexCorePlugin sharedInstance] sendPluginErrorWithMessage:@"Collection not found" :command];
            }
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

- (void)fetchDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *documentId = [command.arguments objectAtIndex:0];
            NSString *collection = [command.arguments objectAtIndex:1];

            FIRDocumentReference *docRef = [[self.firestore collectionWithPath:collection] documentWithPath:documentId];
            if (docRef != nil) {
                [docRef getDocumentWithCompletion:^(FIRDocumentSnapshot *_Nullable snapshot, NSError *_Nullable error) {
                    if (error != nil) {
                        [[FirebasexCorePlugin sharedInstance] sendPluginErrorWithMessage:error.localizedDescription :command];
                    } else if (snapshot.data != nil) {
                        [self.commandDelegate
                            sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                          messageAsDictionary:[self sanitiseFirestoreDataDictionary:snapshot.data]]
                                  callbackId:command.callbackId];
                    } else {
                        [[FirebasexCorePlugin sharedInstance] sendPluginErrorWithMessage:@"Document not found in collection" :command];
                    }
                }];
            } else {
                [[FirebasexCorePlugin sharedInstance] sendPluginErrorWithMessage:@"Collection not found" :command];
            }
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

#pragma mark - Collection queries

- (void)fetchFirestoreCollection:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *collection = [command.arguments objectAtIndex:0];
            NSArray *filters = nil;
            if ([command.arguments objectAtIndex:1] != [NSNull null]) {
                filters = [command.arguments objectAtIndex:1];
            }

            FIRQuery *query = [self.firestore collectionWithPath:collection];
            if (filters != nil) {
                query = [self applyFiltersToFirestoreCollectionQuery:filters query:query];
            }

            [query getDocumentsWithCompletion:^(FIRQuerySnapshot *_Nullable snapshot, NSError *_Nullable error) {
                if (error != nil) {
                    [[FirebasexCorePlugin sharedInstance] sendPluginErrorWithMessage:error.localizedDescription :command];
                } else {
                    NSMutableDictionary *documents = [[NSMutableDictionary alloc] init];
                    for (FIRDocumentSnapshot *document in snapshot.documents) {
                        [documents setObject:[self sanitiseFirestoreDataDictionary:document.data]
                                      forKey:document.documentID];
                    }
                    [self.commandDelegate
                        sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:documents]
                              callbackId:command.callbackId];
                }
            }];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

#pragma mark - Listeners

- (void)listenToDocumentInFirestoreCollection:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *documentId = [command.arguments objectAtIndex:0];
            NSString *collection = [command.arguments objectAtIndex:1];
            bool includeMetadata = [[command.arguments objectAtIndex:2] boolValue];

            id<FIRListenerRegistration> listener =
                [[[self.firestore collectionWithPath:collection] documentWithPath:documentId]
                    addSnapshotListenerWithIncludeMetadataChanges:includeMetadata
                                                        listener:^(FIRDocumentSnapshot *snapshot, NSError *error) {
                    @try {
                        if (snapshot != nil) {
                            NSMutableDictionary *document = [[NSMutableDictionary alloc] init];
                            [document setObject:@"change" forKey:@"eventType"];
                            if (snapshot.data != nil) {
                                [document setObject:[self sanitiseFirestoreDataDictionary:snapshot.data] forKey:@"snapshot"];
                            }
                            if (snapshot.metadata != nil) {
                                [document setObject:[NSNumber numberWithBool:snapshot.metadata.fromCache] forKey:@"fromCache"];
                                [document setObject:snapshot.metadata.hasPendingWrites ? @"local" : @"remote" forKey:@"source"];
                            }
                            [[FirebasexCorePlugin sharedInstance] sendPluginDictionaryResultAndKeepCallback:[self sanitiseFirestoreDataDictionary:document]
                                                                                                   command:command
                                                                                                callbackId:command.callbackId];
                        } else {
                            [[FirebasexCorePlugin sharedInstance] sendPluginErrorWithError:error command:command];
                        }
                    } @catch (NSException *exception) {
                        [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
                    }
                }];

            NSMutableDictionary *jsResult = [[NSMutableDictionary alloc] init];
            [jsResult setObject:@"id" forKey:@"eventType"];
            NSNumber *key = [self saveFirestoreListener:listener];
            [jsResult setObject:key forKey:@"id"];
            [[FirebasexCorePlugin sharedInstance] sendPluginDictionaryResultAndKeepCallback:jsResult
                                                                                    command:command
                                                                                 callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

- (void)listenToFirestoreCollection:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSString *collection = [command.arguments objectAtIndex:0];
            NSArray *filters = nil;
            if ([command.arguments objectAtIndex:1] != [NSNull null]) {
                filters = [command.arguments objectAtIndex:1];
            }
            bool includeMetadata = [[command.arguments objectAtIndex:2] boolValue];

            FIRQuery *query = [self.firestore collectionWithPath:collection];
            if (filters != nil) {
                query = [self applyFiltersToFirestoreCollectionQuery:filters query:query];
            }

            id<FIRListenerRegistration> listener =
                [query addSnapshotListenerWithIncludeMetadataChanges:includeMetadata
                                                            listener:^(FIRQuerySnapshot *snapshot, NSError *error) {
                    @try {
                        if (snapshot != nil) {
                            NSMutableDictionary *jsResult = [[NSMutableDictionary alloc] init];
                            [jsResult setObject:@"change" forKey:@"eventType"];

                            NSMutableDictionary *documents = [[NSMutableDictionary alloc] init];
                            bool hasDocuments = false;
                            for (FIRDocumentChange *dc in snapshot.documentChanges) {
                                hasDocuments = true;
                                NSMutableDictionary *document = [[NSMutableDictionary alloc] init];
                                if (dc.type == FIRDocumentChangeTypeAdded) {
                                    [document setObject:@"new" forKey:@"type"];
                                } else if (dc.type == FIRDocumentChangeTypeModified) {
                                    [document setObject:@"modified" forKey:@"type"];
                                } else if (dc.type == FIRDocumentChangeTypeRemoved) {
                                    [document setObject:@"removed" forKey:@"type"];
                                } else {
                                    [document setObject:@"metadata" forKey:@"type"];
                                }
                                if (dc.document.data != nil) {
                                    [document setObject:[self sanitiseFirestoreDataDictionary:dc.document.data] forKey:@"snapshot"];
                                }
                                if (dc.document.metadata != nil) {
                                    [document setObject:[NSNumber numberWithBool:dc.document.metadata.fromCache] forKey:@"fromCache"];
                                    [document setObject:dc.document.metadata.hasPendingWrites ? @"local" : @"remote" forKey:@"source"];
                                }
                                [documents setObject:document forKey:dc.document.documentID];
                            }
                            if (hasDocuments) {
                                [jsResult setObject:documents forKey:@"documents"];
                            }
                            [[FirebasexCorePlugin sharedInstance] sendPluginDictionaryResultAndKeepCallback:jsResult
                                                                                                   command:command
                                                                                                callbackId:command.callbackId];
                        } else {
                            [[FirebasexCorePlugin sharedInstance] sendPluginErrorWithError:error command:command];
                        }
                    } @catch (NSException *exception) {
                        [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
                    }
                }];

            NSMutableDictionary *jsResult = [[NSMutableDictionary alloc] init];
            [jsResult setObject:@"id" forKey:@"eventType"];
            NSNumber *key = [self saveFirestoreListener:listener];
            [jsResult setObject:key forKey:@"id"];
            [[FirebasexCorePlugin sharedInstance] sendPluginDictionaryResultAndKeepCallback:jsResult
                                                                                    command:command
                                                                                 callbackId:command.callbackId];
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

- (void)removeFirestoreListener:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        @try {
            NSNumber *listenerId = @([[command.arguments objectAtIndex:0] intValue]);
            bool removed = [self _removeFirestoreListener:listenerId];
            if (removed) {
                [[FirebasexCorePlugin sharedInstance] sendPluginSuccess:command];
            } else {
                [[FirebasexCorePlugin sharedInstance] sendPluginErrorWithMessage:@"Listener ID not found" :command];
            }
        } @catch (NSException *exception) {
            [[FirebasexCorePlugin sharedInstance] handlePluginExceptionWithContext:exception :command];
        }
    }];
}

@end
