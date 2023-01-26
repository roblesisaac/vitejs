import { Pipe } from "../utils/pipe.js";
import mongo from "../utils/mongo.js";

export default async (req, res) => {
  mongo.insert.data({ res })("users", {
    name: 12
  }).then(output => {
    res.json(output);
  });
}