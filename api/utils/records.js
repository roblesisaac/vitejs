import { data } from "@serverless/cloud";

export default function(collectionName) {
    const collection = {
        users: { email : "label1" }
    }[collectionName];

    return {
        get: async (filter) => {
            const readableName = Object.keys(filter)[0];
            const labelNumber = collection[readableName];
            const labelValue = filter[readableName];

            const { items } = await data.getByLabel(labelNumber, labelValue);

            if (!items.length) {
                return null;
            }

            if (items.length > 1) {
                return items;
            }

            const item = items[0];

            const { value } = item;

            value[readableName] = labelValue;
            value.key = item.key;

            return value;
        }
    }
}