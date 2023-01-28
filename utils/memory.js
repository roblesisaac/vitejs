import { convert, obj, type, getArgNames, getArgs } from "./utils.js";

export default function Memory(pipe) {
  const _absorb = function(pipe) {
    const bluePrnt = pipe._blueprint,
        format = data => obj.copy(convert.toObject(data || {}, pipe));
    
    const assignProps = (assignee, rawData) => {
      if (!rawData) return;
    
      const define = (prop, definer) => {
        definer.enumerable = true;
        Object.defineProperty(assignee, prop, definer);
      },
      defineGetterMethod = (value, prop) => {
        define(prop, {
          get: value.bind(this)
        });
      },
      getAndSetFromPipe = (prop) => {
        define(prop, {
          get: () => pipe[prop],
          set: (newValue) => pipe[prop] = newValue
        });
      };
    
      const data = format(rawData);
      
      const assignProp = (prop) => {
        const value = data[prop];
    
        if (prop in assignee) {
          return;
        };
    
        if (prop in pipe) {
          getAndSetFromPipe(prop);
          return;
        }
    
        if (typeof value == "function") {
          defineGetterMethod(value, prop);
          return;
        }
    
        assignee[prop] = value;
      };
    
      Object.keys(data).forEach(assignProp);
    };
    
    assignProps(pipe, bluePrnt.state);
    assignProps(this, bluePrnt.state);
    assignProps(this, bluePrnt.data);
      
    return this;
  },
  _learn = function() {
    if(!arguments.length) return this;
    
    const learnData = (data) => {
      if(!type.isObject(data)) return;
      
      Object.keys(data).forEach(key => {
        const staticValue = data[key],
            { item, prop } = obj.tip(this, key),
            value = obj.deep(this, staticValue) || staticValue;
  
        item[prop] = value;
      });
    };
    
    Array.from(arguments).forEach(learnData);
    
    return this;
  },
  _importArgs = function(instructions, args) {
    return this._import(getArgs(instructions, args));
  },
  _importSpecialArgs = function(instructions, specialArgs) {
    const getArgDataForEach = arg => obj.deep(this, arg) || arg,
          specials = Array.from(specialArgs).map(getArgDataForEach);

    this._args.unshift(specials);

    return this._import(getArgs(instructions, specials));
  },
  _import = function() {
    if(!arguments.length) return this;
    
    const learnDataObject = (data) => {
      if(!type.isObject(data)) return;
      
      Object.assign(this, data);
    };
    
    Array.from(arguments).forEach(learnDataObject);
    
    return this;
  },
  _addTools = function(data) {
    const config = (prop) => {
      return {
        configurable: true,
        writable: true,
        value: data[prop]
      };
    };
  
    for (const prop in data) {
      Object.defineProperty(this, prop, config(prop));
    }
  
    return this;
  },
  _unshiftArgs = function(instructions) {
    const argNames = getArgNames(instructions),
          getArg = argName => this[argName] || argName,
          getSubArgs = () => argNames.map(getArg);

    this._args.unshift(getSubArgs());
    return this;
  },
  assignNativeMemories = (natives) => {
    for(const native in natives) {
      obj.assignNative(this, native, natives[native]);
    }
  };

  assignNativeMemories({ 
    _absorb, 
    _learn, 
    _import, 
    _importArgs, 
    _importSpecialArgs, 
    _addTools,
    _unshiftArgs,
    _isMemory: true 
  });

  this._absorb(pipe);
}