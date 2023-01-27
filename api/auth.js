import { Pipe } from "../utils/pipe.js";
import mongo from "../utils/mongo.js";

export default async (req, res) => {
  const respond = output => res.json(output);

  mongo.insert._data({ res, req })("users", { name: 12 })
    .then(respond)
    .catch(respond);
}