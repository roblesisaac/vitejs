import { Pipe } from "../utils/pipe.js";
import mongo from "../utils/mongo.js";

export default async (req, res) => {
  const respond = output => res.json(output);

  mongo.insert._import({ res, req })("users", { name: "uriah" })
    .then(respond)
    .catch(respond);
}