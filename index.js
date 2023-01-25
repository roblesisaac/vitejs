import { api, http } from "@serverless/cloud";

http.on(404, "index.html");

api.get("/helloHi", (req, res) => {
    res.send("hello hi");
});