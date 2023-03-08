import { Aid } from "../api/utils/aidkit";

export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function proper(str) {
    if (!str) return "";

    return str.toLowerCase().replace(/\b(\w)/g, function(firstLetter) {
        return firstLetter.toUpperCase();
    });
}

export function randomString(length=8) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function buildId(timestamp) {
    timestamp = timestamp || new Date().getTime().toString(16);
    const random = Math.random().toString(16).substring(2);
    return timestamp + random;
}

// const api = (function() {
//     const handler = async function(method, url, body) {
//         let payload = {
//             method,
//             headers: {
//               "Content-Type": "application/json"
//             }
//         };

//         if(body) payload.body = JSON.stringify(body);

//         const res = await fetch(url, payload);
//         return await res.json();
//     };

//     return { 
//         get: url => handler("get", url),
//         put: (url, body) => handler("put", url, body),
//         post: (url, body) => handler("post", url, body),
//         delete: url => handler("delete", url)
//     };
// })();

const api = new Aid({
    steps: {
        handler: function(method, url, body) {
            const payload = {
                method,
                headers: {
                  "Content-Type": "application/json"
                }
            };

            const { onError } = this;

            if(body) payload.body = JSON.stringify(body);

            fetch(url, payload)
                .then(res => res.json())
                .then(this.next).catch(onError);
        }
    },
    instruct: {
        get: (url) => [
            { handler: ["GET", url] }
        ],
        put: (url, body) => [
            { handler: ["PUT", url, body] }
        ],
        post: (url, body) => [
            { handler: ["POST", url, body] }
        ],
        delete: (url) => [
            { handler: ["DELETE", url] }
        ]
    }
});

export { api };