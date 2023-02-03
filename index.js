import { 
    api, 
    http 
} from "@serverless/cloud";

import auth from "./api/auth.js";
import db from "./api/db.js";

auth();

api.get("/:component/aloha", (req, res) => {
    res.json("hello"+req.params.component);
});

//dbs
const endpoint = "/:component/db/";
api.get(endpoint, (req, res) => db.find(req, res));
api.get(endpoint+":id", (req, res) => db.findOne(req, res));

api.put(endpoint+":id", (req, res) => db.updateOne(req, res));
api.put(endpoint, (req, res) => db.updateMany(req, res));

api.post(endpoint, (req, res) => db.insert(req, res));

api.delete(endpoint+":id", (req, res) => db.deleteOne(req, res));
api.delete(endpoint, (req, res) => db.deleteMany(req, res));

http.on(404, "index.html");

// Catch all for missing API routes
// api.get("/:component/api/*", (req, res) => {
//   res.status(404).send({ error: "not found" });
// });