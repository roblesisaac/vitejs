import { Pipe } from "peachmap";
import mongo from "./mongo.js";

export default new Pipe({
  steps: {
    fetchPermitForUser: function(res, next) {
      const filter = this.user;

      mongo.findOne("users", filter).then(next);
    }
  },
  instruct: {
    user: (user) => [
      "fetchPermitForUser",
      // mongo.findOne_("permits", "user"),
      { log: "_output" }
    ]
  }
});