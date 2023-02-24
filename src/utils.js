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

const api = (function() {
    const handler = async function(method, url, body) {
        let payload = {
            method,
            headers: {
              "Content-Type": "application/json"
            }
        };

        if(body) payload.body = JSON.stringify(body);

        const res = await fetch(url, payload);
        return await res.json();
    };

    return { 
        get: url => handler("get", url),
        put: (url, body) => handler("put", url, body),
        post: (url, body) => handler("post", url, body),
        delete: url => handler("delete", url)
    };
})();

// const api = new Aid({
//     steps: {
//         handler: function() {
//             const { next, method, url, body } = this;

//             let payload = {
//                 method,
//                 headers: {
//                   "Content-Type": "application/json"
//                 }
//             };

//             if(body) payload.body = JSON.stringify(body);

//             fetch(url, payload).then(res => res.json()).then(next);
//         }
//     },
//     instruct: {
//         get: (url) => [
//             { url, method: "GET" },
//             "handler"
//         ],
//         put: (url, body) => [
//             { url, body, method: "PUT" },
//             "handler"
//         ],
//         post: (url, body) => [
//             { url, body, method: "POST" },
//             "handler"
//         ],
//         delete: (url) => [
//             { url, method: "DELETE" },
//             "handler"
//         ]
//     }
// });

export { api };