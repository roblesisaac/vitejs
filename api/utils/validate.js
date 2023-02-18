const err = (_error) => {
    return { _error };
};

export default function (schema, subject) {
    for (const key in schema) {
      if (schema[key] instanceof Array) {
        if (!subject.hasOwnProperty(key) && schema[key].required) {
          return err(`Missing required property ${key} in the subject object`);
        } else if (subject.hasOwnProperty(key)) {
          // If the property is an array, validate each element
          for (let i = 0; i < subject[key].length; i++) {
            validate(schema[key][0], subject[key][i]);
          }
        }
      } else if (typeof schema[key] === 'object') {
        if (!subject.hasOwnProperty(key) && schema[key].required) {
          return err(`Missing required property ${key} in the subject object`)
        } else {
          subject[key] = validate(schema[key], subject[key] || {});
        }
      } else if (schema[key].required && !subject.hasOwnProperty(key)) {
        return err(`Missing required property ${key} in the subject object`);
      } else if (!subject.hasOwnProperty(key)) {
        // Assign the default value based on the type in the schema
        switch (schema[key].value || schema[key]) {
          case String:
            subject[key] = "";
            break;
          case Number:
            subject[key] = 0;
            break;
          case Boolean:
            subject[key] = false;
            break;
          case Array:
            subject[key] = [];
            break;
          case Object:
            subject[key] = {};
            break;
          default:
            subject[key] = null;
            break;
        }
      } else if (subject.hasOwnProperty(key) && subject[key].constructor !== (schema[key].value || schema[key])) {
        return err(`Invalid type for property ${key}. Expected ${(schema[key].value || schema[key]).name} but got '${subject[key]}' which is a ${subject[key].constructor.name}`)
      }
    }
    return subject;
  }
  