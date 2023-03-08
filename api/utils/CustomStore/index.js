'use strict';

import { data } from '@serverless/cloud';

export default function(connect) {
    const Store = connect.Store || connect.sessionStore;
  
    return class CustomStore extends Store {
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
            
            if (cookie.expires < new Date()) {
                await this.destroy(sid);
                return callback(null, null);
            }
        
            return callback(null, sess);
        }
  
        async set(sessionId, session, next) {
            try {
                const id = `sessions:${sessionId}`;
                const payload = JSON.stringify(session);
                const maxAge = session.cookie.originalMaxAge;
                const ttl = (maxAge || 0) / 1000;
  
                const result = await data.set(id, payload, { ttl });
                next(null, result);
            } catch (err) {
                next(err);
            }
        }
  
        async destroy(sessionId, next) {
            try {
                const result = await data.remove(`sessions:${sessionId}`);
  
                if (typeof next == 'function') next(null, result);
            } catch (err) {
                console.log(err);
                if(typeof next == 'function') next(err);
            }
        }
  
    }
  };