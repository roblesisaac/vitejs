import { data } from "@serverless/cloud";

export default function(collectionName) {
    const collection = {
        users: { email : "label1" }
    }[collectionName];

    return {
        getOne: async (filter) => {
            const readableName = Object.keys(filter)[0];
            const labelNumber = collection[readableName];
            const labelValue = filter[readableName];

            const { items } = await data.getByLabel(labelNumber, labelValue);
            const item = items[0];

            if(!item || !item.value) {
                return null;
            }

            const { value } = item;

            value[readableName] = labelValue;
            value.key = item.key;

            return value;
        }
    }
}

// await records("users").get({ email });