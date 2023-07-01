/**
 * V8 Virtual Machine context
 *
 */

const vm = require("node:vm");

// context object
const context = {
  age: 20,
};

// contextifying the object
vm.createContext(context);

const code = `
    // global variable  age 
    age *= 2;

`;
 
// run the code 
vm.runInContext(code, context);

console.log(context);
