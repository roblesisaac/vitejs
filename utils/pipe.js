import { convert, getArgNames, getArgs, obj, type } from "./utils.js";
import Memory from "./memory.js";
import globalSteps from "./globalSteps.js";

function Pipe(blueprint) {
  const instruct = blueprint.instruct;

  const getStep = function(sIndex, args, steps) {
    steps = steps || this.steps(args);
    
    return steps.index == sIndex || steps.missingIndex
      ? steps
      : getStep(sIndex, args, steps.nextStep() || { missingIndex: sIndex });
  };

  const buildWithSpecialArgs = function(pipeMethod) {
    return function() {
      const specialArgs = arguments;
      
      return function (res, next) {
        const { _step } = this,
            { specialProp, pipe, methodName } = _step;
        
        pipeMethod(this, specialProp, !!pipe[methodName], specialArgs).then(next);
      };
    };
  };

  const buildSteps = function(stepsArr, pipe, pipeName, prev, stepIndex, specialProp) {
    if (!stepsArr || !stepsArr.length || stepIndex == stepsArr.length) {
      return;
    }
  
    const index = stepIndex || 0,
        stepPrint = stepsArr[index],
        isObj = type.isObject(stepPrint),
        specials = pipe._library.specials;
  
    const methodName = typeof stepPrint == "string"
          ? stepPrint
          : type.isObject(stepPrint)
          ? Object.keys(stepPrint)[0]
          : typeof stepPrint == "function" && specials.includes(stepPrint.name)
          ? "function"
          : stepPrint.name || typeof stepPrint;
          
    const isSpecial = specials.includes(methodName),
        isFinalStep = stepsArr.length == index+1,
        isVariation = !!pipe[methodName] || methodName == "pipeMethod";
  
    const buildSub = function(index, sProp, instructs, previous) {
      instructs = instructs || stepsArr;
      previous = previous || this;
      sProp = sProp || specialProp;
      return buildSteps(instructs, pipe, pipeName, previous, index, sProp);
    };
  
    return {
      pipe,
      pipeName,
      isFinalStep,
      isSpecial,
      isVariation,
      index,
      methodName,
      prev,
      specialProp,
      stepPrint,
      init: function() {
        if(!isSpecial) {
          return this;
        }
        
        const special = this[methodName] = {},
              specialInstructions = specialArr => convert.toArray(specialArr).flat();

        Object.keys(stepPrint).forEach((sProp) => {
          const specialInstruct = specialInstructions(stepPrint[sProp]);
          
          special[sProp] = buildSub(0, sProp, specialInstruct, prev);
        });
  
        return this;
      },
      firstStep: function() {
        return this.prev ?
          this.prev.firstStep() :
          this;
      },
      nextStep: function() {
        return buildSub.call(this, index + 1);
      },
      handleError: function(memory, error) {
        const { _rej, _pipeName } = memory,
            { _catch } = pipe;   
        
        const errMessage = {
          error,
          methodName,
          pipeName,
          _pipeName,
          prev,
          stepPrint
        };
        
        const errMethod = _catch ? _catch[_pipeName] || _catch : console.log;
        
        if (errMethod && typeof errMethod == "function") {
          errMethod.call(memory, errMessage);
          return;
        }
  
        console.error(errMessage);
        return;
      },
      method: function(memory, rabbitTrail, parentSpecial) {
        const { nextStep, handleError } = this;
  
        const method = pipe[methodName] || pipe._steps[methodName] || stepPrint,
            theSpecialProp = specialProp || parentSpecial,
            updater = theSpecialProp == "if" ? "_condition" : "_args";
            
        const relayLast = function(args) {
          if (theSpecialProp && memory._conditions) {
            memory._conditions.push(args[0]);
            return;
          }
          
          memory[updater] = Array.from(args);
          if(updater == "_args") memory._output = args[0];
        };
        
        const resolvePromise = function(output=[]) {      
          const resolve = rabbitTrail || memory._resolve.shift();
  
          if (typeof resolve != "function") {
            return;
          }
          
          resolve(output[0]);
        };
  
        const next = function(res) {
          if(arguments.length) relayLast(arguments);
  
          if (isFinalStep || memory._endAll) {
            resolvePromise(memory[updater]);
            return;
          }
          
          nextStep.call(this).method(memory, rabbitTrail, parentSpecial);
        };
  
        const learnAndProceed = function(res) {
          memory._learn(res);
          next(res);
        };
  
        const setupArgs = () => {
          let arr = isObj && !isSpecial 
                ? stepPrint[methodName]
                : memory[updater];
                
          arr = convert.toArray(arr);
          
          return arr.concat([next, learnAndProceed]);
        };
  
        const stepData = function() {
          if (!isObj || isSpecial) {
            return {};
          }
  
          const printCopy = obj.copy(stepPrint);
  
          for (const i in arguments) {
            delete printCopy[arguments[i]];
          }
          
          return printCopy;
        };
  
        const { _output, _error } = memory,
        _errorMessage = _output ? _output._error : _error;
          
        if(_errorMessage) {
          handleError(memory, _errorMessage);
          return;
        }
  
        if (isVariation) {
          method(memory, specialProp, !pipe[methodName]).then(next);
          return;
        }
  
        if (methodName == "boolean") {
          memory[updater] = stepPrint;
          return next();
        }
  
        if (typeof method != "function") {
          memory._learn(stepData());
          return next();
        }
  
        const args = setupArgs(),
            data = stepData(methodName),
            autoCompletes = method.toString().includesAny("next", "return;");
  
        try {
          memory
            ._import(data)
            ._addTools({ step: this, next });

          method.apply(memory, args);
        } catch (error) {
          handleError(memory, error.toString());
          return;
        }
  
        if (!autoCompletes) {
          next();
        }
      }
    }.init();
  };

  const buildPipeMethod = function(instructions, pipe, pipeName) {
    const getSteps = function(args) {
      const stepsArr = convert.toInstruct(instructions, args);
      return buildSteps(stepsArr, pipe, pipeName);
    };

    function pipeMethod(memory, parentSpecial, pipeIsForeign, specialArgs) {
      const args = arguments;
      
      function getMemory(resolve, rej) {
        resolve = [resolve];

        if (memory && memory._isMemory) {
          memory._resolve = resolve.concat(memory._resolve);

          if (pipeIsForeign || memory._args[1]) {
            memory._absorb(pipe);
          }

          if (specialArgs) {
            return memory._importSpecialArgs(instructions, specialArgs);
          }

          return memory._unshiftArgs(instructions);
        }

        return new Memory(pipe)
          ._importArgs(instructions, args)
          ._addTools({ resolve, rej, pipeName, args: [args] });
      }
      
      return new Promise(function(resolve, reject) {
        const memry = getMemory(resolve, reject);
        console.log({ memry }) 
        const args = memry._args,
            arg = args[1] ? args.shift() : args[0],
            steps = getSteps(arg);
            
        steps.method(memry, null, parentSpecial);
      });
    };

    pipeMethod.steps = getSteps;
    pipeMethod.step = getStep;
    pipeMethod._data = function() {
      const memory = new Memory(pipe)._import(...arguments);

      return (...args) => {
        memory._importArgs(instructions, args);
        return new Promise((resolve, rej) => {
          const steps = getSteps(args);
          memory._addTools({ resolve: [resolve], rej, pipeName, args: [args] });
          steps.method(memory);
        });
      };
    };

    return pipeMethod;
  }

  const assignPipe = (instruct, pipeName) => {
    const instructions = instruct[pipeName] || instruct,
          method = buildPipeMethod(instructions, this, pipeName);

    obj.assignNative(this, pipeName+"_", buildWithSpecialArgs(method));
    obj.assignNative(this, pipeName, method);
  };

  const assignNativeKeys = (natives) => {
    Object.keys(natives).forEach(prop => {
      obj.assignNative(this, prop, natives[prop])
    });
  }

  const _library = {
    specials: ["if", "each", "setup"],
    steps: globalSteps
  };

  assignNativeKeys({
    _blueprint: obj.copy(blueprint),
    _catch: blueprint.catch ? obj.copy(blueprint.catch) : null,
    _library,
    _steps: Object.assign({}, _library.steps, blueprint.steps)
  });

  if (!type.isObject(instruct)) {
    assignPipe(instruct, "run");
    return;
  }

  for (const vName in instruct) {
    assignPipe(instruct, vName);
  }
}

export { Memory, Pipe, convert, globalSteps, getArgNames, getArgs, obj, type };