package org.apache.cordova.firebasex;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.Timestamp;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.DocumentChange;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.EventListener;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.FirebaseFirestoreException;
import com.google.firebase.firestore.ListenerRegistration;
import com.google.firebase.firestore.MetadataChanges;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.QuerySnapshot;
import com.google.firebase.firestore.Query.Direction;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Type;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Set;

public class FirebasexFirestorePlugin extends CordovaPlugin {

    private static final String TAG = "FirebasexFirestore";

    private FirebaseFirestore firestore;
    private Map<String, ListenerRegistration> firestoreListeners = new HashMap<String, ListenerRegistration>();
    private Gson gson = new Gson();

    @Override
    protected void pluginInitialize() {
        Log.d(TAG, "pluginInitialize");
        firestore = FirebaseFirestore.getInstance();
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        switch (action) {
            case "addDocumentToFirestoreCollection":
                this.addDocumentToFirestoreCollection(args, callbackContext);
                return true;
            case "setDocumentInFirestoreCollection":
                this.setDocumentInFirestoreCollection(args, callbackContext);
                return true;
            case "updateDocumentInFirestoreCollection":
                this.updateDocumentInFirestoreCollection(args, callbackContext);
                return true;
            case "deleteDocumentFromFirestoreCollection":
                this.deleteDocumentFromFirestoreCollection(args, callbackContext);
                return true;
            case "documentExistsInFirestoreCollection":
                this.documentExistsInFirestoreCollection(args, callbackContext);
                return true;
            case "fetchDocumentInFirestoreCollection":
                this.fetchDocumentInFirestoreCollection(args, callbackContext);
                return true;
            case "fetchFirestoreCollection":
                this.fetchFirestoreCollection(args, callbackContext);
                return true;
            case "listenToDocumentInFirestoreCollection":
                this.listenToDocumentInFirestoreCollection(args, callbackContext);
                return true;
            case "listenToFirestoreCollection":
                this.listenToFirestoreCollection(args, callbackContext);
                return true;
            case "removeFirestoreListener":
                this.removeFirestoreListener(args, callbackContext);
                return true;
            default:
                return false;
        }
    }

    private int conformBooleanForPluginResult(boolean value) {
        return value ? 1 : 0;
    }

    private void sendPluginResultAndKeepCallback(JSONObject result, CallbackContext callbackContext) {
        PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, result);
        pluginResult.setKeepCallback(true);
        callbackContext.sendPluginResult(pluginResult);
    }

    private String generateId() {
        Random r = new Random();
        return Integer.toString(r.nextInt(1000 + 1));
    }

    // Firestore data conversion helpers

    private Map<String, Object> jsonStringToMap(String jsonString) throws JSONException {
        Type type = new TypeToken<Map<String, Object>>() {}.getType();
        return gson.fromJson(jsonString, type);
    }

    private JSONObject mapFirestoreDataToJsonObject(Map<String, Object> map) throws JSONException {
        map = sanitiseFirestoreHashMap(map);
        return mapToJsonObject(map);
    }

    private Map<String, Object> sanitiseFirestoreHashMap(Map<String, Object> map) {
        Set<String> keys = map.keySet();
        for (String key : keys) {
            Object value = map.get(key);
            if (value instanceof DocumentReference) {
                map.put(key, ((DocumentReference) value).getPath());
            } else if (value instanceof HashMap) {
                map.put(key, sanitiseFirestoreHashMap((Map<String, Object>) value));
            }
        }
        return map;
    }

    private JSONObject mapToJsonObject(Map<String, Object> map) throws JSONException {
        String jsonString = gson.toJson(map);
        return new JSONObject(jsonString);
    }

    // Firestore listener management

    private String saveFirestoreListener(ListenerRegistration listenerRegistration) {
        String id = this.generateId();
        this.firestoreListeners.put(id, listenerRegistration);
        return id;
    }

    private boolean removeFirestoreListenerById(String id) {
        boolean removed = false;
        if (this.firestoreListeners.containsKey(id)) {
            ListenerRegistration listenerRegistration = this.firestoreListeners.get(id);
            if (listenerRegistration != null) {
                listenerRegistration.remove();
            }
            this.firestoreListeners.remove(id);
            removed = true;
        }
        return removed;
    }

    // Query filter helpers

    private Query applyFiltersToFirestoreCollectionQuery(JSONArray filters, Query query) throws JSONException {
        for (int i = 0; i < filters.length(); i++) {
            JSONArray filter = filters.getJSONArray(i);
            switch (filter.getString(0)) {
                case "where":
                    String fieldName = filter.getString(1);
                    String operator = filter.getString(2);
                    switch (operator) {
                        case "<":
                            query = query.whereLessThan(fieldName, getFilterValueAsType(filter, 3, 4));
                            break;
                        case ">":
                            query = query.whereGreaterThan(fieldName, getFilterValueAsType(filter, 3, 4));
                            break;
                        case "<=":
                            query = query.whereLessThanOrEqualTo(fieldName, getFilterValueAsType(filter, 3, 4));
                            break;
                        case ">=":
                            query = query.whereGreaterThanOrEqualTo(fieldName, getFilterValueAsType(filter, 3, 4));
                            break;
                        case "array-contains":
                            query = query.whereArrayContains(fieldName, getFilterValueAsType(filter, 3, 4));
                            break;
                        default:
                            query = query.whereEqualTo(fieldName, getFilterValueAsType(filter, 3, 4));
                    }
                    break;
                case "orderBy":
                    Direction direction = Direction.ASCENDING;
                    if (Objects.equals(filter.getString(2), new String("desc"))) {
                        direction = Direction.DESCENDING;
                    }
                    query = query.orderBy(filter.getString(1), direction);
                    break;
                case "startAt":
                    query = query.startAt(getFilterValueAsType(filter, 1, 2));
                    break;
                case "endAt":
                    query = query.endAt(getFilterValueAsType(filter, 1, 2));
                    break;
                case "limit":
                    query = query.limit(filter.getLong(1));
                    break;
            }
        }
        return query;
    }

    private Object getFilterValueAsType(JSONArray filter, int valueIndex, int typeIndex) throws JSONException {
        Object typedValue;
        String type = "string";
        if (!filter.isNull(typeIndex)) {
            type = filter.getString(typeIndex);
        }

        switch (type) {
            case "boolean":
                typedValue = filter.getBoolean(valueIndex);
                break;
            case "integer":
                typedValue = filter.getInt(valueIndex);
                break;
            case "double":
                typedValue = filter.getDouble(valueIndex);
                break;
            case "long":
                typedValue = filter.getLong(valueIndex);
                break;
            default:
                typedValue = filter.getString(valueIndex);
        }

        return typedValue;
    }

    // CRUD operations

    private void addDocumentToFirestoreCollection(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String jsonDoc = args.getString(0);
                    String collection = args.getString(1);
                    boolean timestamp = args.getBoolean(2);

                    Map<String, Object> docData = jsonStringToMap(jsonDoc);

                    if (timestamp) {
                        docData.put("created", new Timestamp(new Date()));
                        docData.put("lastUpdate", new Timestamp(new Date()));
                    }

                    firestore.collection(collection)
                            .add(docData)
                            .addOnSuccessListener(new OnSuccessListener<DocumentReference>() {
                                @Override
                                public void onSuccess(DocumentReference documentReference) {
                                    callbackContext.success(documentReference.getId());
                                }
                            })
                            .addOnFailureListener(new OnFailureListener() {
                                @Override
                                public void onFailure(@NonNull Exception e) {
                                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                }
                            });
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    private void setDocumentInFirestoreCollection(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String documentId = args.getString(0);
                    String jsonDoc = args.getString(1);
                    String collection = args.getString(2);
                    boolean timestamp = args.getBoolean(3);

                    Map<String, Object> docData = jsonStringToMap(jsonDoc);

                    if (timestamp) {
                        docData.put("lastUpdate", new Timestamp(new Date()));
                    }

                    firestore.collection(collection).document(documentId)
                            .set(docData)
                            .addOnSuccessListener(new OnSuccessListener<Void>() {
                                @Override
                                public void onSuccess(Void aVoid) {
                                    callbackContext.success();
                                }
                            })
                            .addOnFailureListener(new OnFailureListener() {
                                @Override
                                public void onFailure(@NonNull Exception e) {
                                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                }
                            });
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    private void updateDocumentInFirestoreCollection(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String documentId = args.getString(0);
                    String jsonDoc = args.getString(1);
                    String collection = args.getString(2);
                    boolean timestamp = args.getBoolean(3);

                    Map<String, Object> docData = jsonStringToMap(jsonDoc);

                    if (timestamp) {
                        docData.put("lastUpdate", new Timestamp(new Date()));
                    }

                    firestore.collection(collection).document(documentId)
                            .update(docData)
                            .addOnSuccessListener(new OnSuccessListener<Void>() {
                                @Override
                                public void onSuccess(Void aVoid) {
                                    callbackContext.success();
                                }
                            })
                            .addOnFailureListener(new OnFailureListener() {
                                @Override
                                public void onFailure(@NonNull Exception e) {
                                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                }
                            });
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    private void deleteDocumentFromFirestoreCollection(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String documentId = args.getString(0);
                    String collection = args.getString(1);

                    firestore.collection(collection).document(documentId)
                            .delete()
                            .addOnSuccessListener(new OnSuccessListener<Void>() {
                                @Override
                                public void onSuccess(Void aVoid) {
                                    callbackContext.success();
                                }
                            })
                            .addOnFailureListener(new OnFailureListener() {
                                @Override
                                public void onFailure(@NonNull Exception e) {
                                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                }
                            });
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    private void documentExistsInFirestoreCollection(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String documentId = args.getString(0);
                    String collection = args.getString(1);

                    firestore.collection(collection).document(documentId)
                            .get()
                            .addOnCompleteListener(new OnCompleteListener<DocumentSnapshot>() {
                                @Override
                                public void onComplete(@NonNull Task<DocumentSnapshot> task) {
                                    try {
                                        if (task.isSuccessful()) {
                                            DocumentSnapshot document = task.getResult();
                                            callbackContext.success(conformBooleanForPluginResult(document != null && document.getData() != null));
                                        } else {
                                            Exception e = task.getException();
                                            if (e != null) {
                                                FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                            }
                                        }
                                    } catch (Exception e) {
                                        FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                    }
                                }
                            })
                            .addOnFailureListener(new OnFailureListener() {
                                @Override
                                public void onFailure(@NonNull Exception e) {
                                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                }
                            });
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    private void fetchDocumentInFirestoreCollection(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String documentId = args.getString(0);
                    String collection = args.getString(1);

                    firestore.collection(collection).document(documentId)
                            .get()
                            .addOnCompleteListener(new OnCompleteListener<DocumentSnapshot>() {
                                @Override
                                public void onComplete(@NonNull Task<DocumentSnapshot> task) {
                                    try {
                                        if (task.isSuccessful()) {
                                            DocumentSnapshot document = task.getResult();
                                            if (document != null && document.getData() != null) {
                                                JSONObject jsonDoc = mapFirestoreDataToJsonObject(document.getData());
                                                callbackContext.success(jsonDoc);
                                            } else {
                                                callbackContext.error("No document found in collection");
                                            }
                                        } else {
                                            Exception e = task.getException();
                                            if (e != null) {
                                                FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                            }
                                        }
                                    } catch (Exception e) {
                                        FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                    }
                                }
                            })
                            .addOnFailureListener(new OnFailureListener() {
                                @Override
                                public void onFailure(@NonNull Exception e) {
                                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                }
                            });
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    // Collection fetch and query

    private void fetchFirestoreCollection(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String collection = args.getString(0);
                    JSONArray filters = args.getJSONArray(1);
                    Query query = firestore.collection(collection);

                    if (filters != null) {
                        query = applyFiltersToFirestoreCollectionQuery(filters, query);
                    }

                    query.get()
                            .addOnCompleteListener(new OnCompleteListener<QuerySnapshot>() {
                                @Override
                                public void onComplete(@NonNull Task<QuerySnapshot> task) {
                                    try {
                                        if (task.isSuccessful()) {
                                            JSONObject jsonDocs = new JSONObject();
                                            for (QueryDocumentSnapshot document : task.getResult()) {
                                                jsonDocs.put(document.getId(), mapFirestoreDataToJsonObject(document.getData()));
                                            }
                                            callbackContext.success(jsonDocs);
                                        } else {
                                            FirebasexCorePlugin.handleExceptionWithContext(task.getException(), callbackContext);
                                        }
                                    } catch (Exception e) {
                                        FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                                    }
                                }
                            });
                } catch (Exception e) {
                    FirebasexCorePlugin.handleExceptionWithContext(e, callbackContext);
                }
            }
        });
    }

    // Listeners

    private void listenToDocumentInFirestoreCollection(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String documentId = args.getString(0);
                    String collection = args.getString(1);
                    boolean includeMetadata = args.getBoolean(2);

                    ListenerRegistration registration = firestore.collection(collection).document(documentId)
                            .addSnapshotListener(includeMetadata ? MetadataChanges.INCLUDE : MetadataChanges.EXCLUDE, new EventListener<DocumentSnapshot>() {
                                @Override
                                public void onEvent(@Nullable DocumentSnapshot snapshot,
                                                    @Nullable FirebaseFirestoreException e3) {
                                    try {
                                        if (e3 == null) {
                                            JSONObject document = new JSONObject();
                                            document.put("eventType", "change");

                                            String source = snapshot != null && snapshot.getMetadata().hasPendingWrites() ? "local" : "remote";
                                            document.put("source", source);
                                            document.put("fromCache", snapshot.getMetadata().isFromCache());

                                            if (snapshot != null && snapshot.exists()) {
                                                JSONObject jsonDoc = mapFirestoreDataToJsonObject(snapshot.getData());
                                                document.put("snapshot", jsonDoc);
                                            }
                                            sendPluginResultAndKeepCallback(document, callbackContext);
                                        } else {
                                            FirebasexCorePlugin.handleExceptionWithContext(e3, callbackContext);
                                        }
                                    } catch (Exception e2) {
                                        FirebasexCorePlugin.handleExceptionWithContext(e2, callbackContext);
                                    }
                                }
                            });

                    String id = saveFirestoreListener(registration);
                    JSONObject jsResult = new JSONObject();
                    jsResult.put("eventType", "id");
                    jsResult.put("id", id);
                    sendPluginResultAndKeepCallback(jsResult, callbackContext);
                } catch (Exception e1) {
                    FirebasexCorePlugin.handleExceptionWithContext(e1, callbackContext);
                }
            }
        });
    }

    private void listenToFirestoreCollection(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String collection = args.getString(0);
                    JSONArray filters = null;
                    if (!args.isNull(1)) {
                        filters = args.getJSONArray(1);
                    }
                    boolean includeMetadata = args.getBoolean(2);

                    Query query = firestore.collection(collection);

                    if (filters != null) {
                        query = applyFiltersToFirestoreCollectionQuery(filters, query);
                    }

                    ListenerRegistration registration = query
                            .addSnapshotListener(includeMetadata ? MetadataChanges.INCLUDE : MetadataChanges.EXCLUDE, new EventListener<QuerySnapshot>() {
                                @Override
                                public void onEvent(@Nullable QuerySnapshot snapshots,
                                                    @Nullable FirebaseFirestoreException e3) {
                                    try {
                                        if (e3 == null) {
                                            JSONObject jsResult = new JSONObject();
                                            jsResult.put("eventType", "change");

                                            JSONObject documents = new JSONObject();
                                            boolean hasDocuments = false;
                                            for (DocumentChange dc : snapshots.getDocumentChanges()) {
                                                hasDocuments = true;
                                                JSONObject document = new JSONObject();

                                                switch (dc.getType()) {
                                                    case ADDED:
                                                        document.put("type", "new");
                                                        break;
                                                    case MODIFIED:
                                                        document.put("type", "modified");
                                                        break;
                                                    case REMOVED:
                                                        document.put("type", "removed");
                                                        break;
                                                    default:
                                                        document.put("type", "metadata");
                                                }

                                                QueryDocumentSnapshot documentSnapshot = dc.getDocument();
                                                document.put("snapshot", mapFirestoreDataToJsonObject(documentSnapshot.getData()));
                                                document.put("source", documentSnapshot.getMetadata().hasPendingWrites() ? "local" : "remote");
                                                document.put("fromCache", documentSnapshot.getMetadata().isFromCache());

                                                documents.put(documentSnapshot.getId(), document);
                                            }
                                            if (hasDocuments) {
                                                jsResult.put("documents", documents);
                                            }
                                            sendPluginResultAndKeepCallback(jsResult, callbackContext);
                                        } else {
                                            FirebasexCorePlugin.handleExceptionWithContext(e3, callbackContext);
                                        }
                                    } catch (Exception e2) {
                                        FirebasexCorePlugin.handleExceptionWithContext(e2, callbackContext);
                                    }
                                }
                            });

                    String id = saveFirestoreListener(registration);
                    JSONObject jsResult = new JSONObject();
                    jsResult.put("eventType", "id");
                    jsResult.put("id", id);
                    sendPluginResultAndKeepCallback(jsResult, callbackContext);

                } catch (Exception e1) {
                    FirebasexCorePlugin.handleExceptionWithContext(e1, callbackContext);
                }
            }
        });
    }

    private void removeFirestoreListener(JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String id = args.getString(0);
                    boolean removed = removeFirestoreListenerById(id);
                    if (removed) {
                        callbackContext.success();
                    } else {
                        callbackContext.error("Listener ID not found");
                    }
                } catch (Exception e1) {
                    FirebasexCorePlugin.handleExceptionWithContext(e1, callbackContext);
                }
            }
        });
    }
}
