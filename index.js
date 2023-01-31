import { api, http } from "@serverless/cloud";

import auth from "./api/auth.js";
import db from "./api/db.js";

http.on(404, "index.html");

const test = db.get;

//db
const endpoint = "/:component/db/";
api.get(endpoint, test);
api.get(endpoint+":id",  db.findOne);

api.put(endpoint+":id",  db.updateOne);
api.put(endpoint, db.updateMany);

api.post(endpoint, db.insert);

api.delete(endpoint+":id", db.deleteOne);
api.delete(endpoint, db.deleteMany);


//auth
api.get("/:component/auth", function(req, res) {
  auth(req, res, api);
});

// Catch all for missing API routes
api.get("/:component/api/*", (req, res) => {
  console.log(`404 - api`);
  res.status(404).send({ error: "not found" });
});