'use strict';

import { data } from "@serverless/cloud";

export default function(connect) {
    const Store = connect.Store || connect.sessionStore;

    class CustomStore extends Store {
        constructor() {
            super()
        }
        async get(sessionId, callback) {
            let session = await data.get(`sessions:${sessionId}`);

            if (!session) {
                return callback(null, null);
            }

            callback(null, JSON.parse(session));
        }
        async all(callback) {
            // Retrieve all sessions from the database
            const sessions = "database.getAll()";

            // Call the callback function with the sessions data
            callback(null, sessions);
        }
        async destroy(sessionId, next) {
            try {
                const id = `sessions:${sessionId}`;

                const result = await data.remove(id);
                next(null, result);
            } catch (err) {
                next(err);
            }
        }
        async clear(callback) {
            try {
                console.log("clear");
                // const result = await data.remove(`sessions`);
                callback(null, "result");
            } catch (err) {
                callback(err);
            }
        }
        async set(sessionId, session, next) {
            try {
                const id = `sessions:${sessionId}`;
                const payload = JSON.stringify(session);

                const result = await data.set(id, payload);
                next(null, result);
            } catch (err) {
                next(err);
            }
        }
    }

    return CustomStore;
}