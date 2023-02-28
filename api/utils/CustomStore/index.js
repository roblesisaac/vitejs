'use strict';

import { data } from "@serverless/cloud";

export default function(connect) {
    const Store = connect.Store || connect.sessionStore;

    class CustomStore extends Store {
        constructor() {
            super()
        }

        async get(sid, callback) {
            const session = await data.get(`sessions:${sid}`);
        
            if (!session) {
              return callback(null, null);
            }
        
            const sess = JSON.parse(session),
                cookie = sess ? sess.cookie : null;
        
            if (cookie && cookie.expires) {
                cookie.expires = new Date(cookie.expires);
            }
            
            const now = new Date();
            console.log(cookie.expires, now);
            
            if (cookie.expires < now) {
                await this.destroy(sid);
                return callback(null, null);
            }
        
            return callback(null, sess);
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

        async destroy(sessionId, next) {
            console.log("destroy::", sessionId)
            try {
                const result = await data.remove(`sessions:${sessionId}`);

                if (typeof next == "function") next(null, result);
            } catch (err) {
                console.log(err);
                if(typeof next == "function") next(err);
            }
        }

        // async touch(sid, sess, callback) {
        //     const maxAge = sess.cookie.maxAge;
        //     const now = new Date().getTime();
        //     const expires = now + maxAge;
        
        //     console.log("touch::", {
        //         maxAge,
        //         now, 
        //         expires,
        //         sid, sess
        //     });

        //     if(typeof callback == "function") {
        //         return callback(null, sess);
        //     }

        //     // const data = JSON.stringify(sess);
        //     // await data.set(`sessions:${sid}`, data, 'EX', Math.round(ttl / 1000));
        // }

    }

    return CustomStore;
}