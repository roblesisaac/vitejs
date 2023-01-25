import { api, http } from "@serverless/cloud";

http.on(404, "index.html");

api.get("/aloha", (req, res) => {
    res.send("hello hi");
});