import { Pipe } from "../utils/pipe.js";
import mongo from "../utils/mongo.js";

export default async (req, res) => {
  mongo.insert("users", {
    name: "aloha"
  }).then(output => {
    res.json(output);
  });
}