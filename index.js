import { api, http } from "@serverless/cloud";

import auth from "./api/auth.js";
import db from "./api/db.js";

http.on(404, "index.html");

//db
const endpoint = "/:component/db/";
api.get(endpoint, (req, res) => db.find(req, res));
api.get(endpoint+":id", (req, res) => db.findOne(req, res));

api.put(endpoint+":id", (req, res) => db.updateOne(req, res));
api.put(endpoint, (req, res) => db.updateMany(req, res));

api.post(endpoint, (req, res) => db.insert(req, res));

api.delete(endpoint+":id", (req, res) => db.deleteOne(req, res));
api.delete(endpoint, (req, res) => db.deleteMany(req, res));


// //auth
// api.get("/:component/auth", function(req, res) {
//   auth(req, res, api);
// });

api.get("/auth/google/callback", function(req, res) {
  res.json("callback fired");
});

// Catch all for missing API routes
api.get("/:component/api/*", (req, res) => {
  console.log(`404 - api`);
  res.status(404).send({ error: "not found" });
});