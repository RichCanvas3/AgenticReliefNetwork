const { greet } = require("./index");

function runTests() {
  const expected = "Hello, ARR monorepo!";
  const actual = greet("ARR monorepo");

  if (actual !== expected) {
    console.error("Test failed:", { expected, actual });
    process.exitCode = 1;
  } else {
    console.log("All tests passed.");
  }
}

runTests();


