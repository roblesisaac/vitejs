import { api } from "@serverless/cloud";

api.get("/aloha", (req, res) => {
    res.send("hello hi");
});