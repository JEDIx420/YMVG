import { getSafeRedirect } from "./redirectHelper";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Test Failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

function runTests() {
  console.log("Running redirect redirect helper unit tests...");

  // Legitimate redirect inputs
  assert(getSafeRedirect(null) === "/dashboard", "Null redirects to /dashboard");
  assert(getSafeRedirect("") === "/dashboard", "Empty string redirects to /dashboard");
  assert(getSafeRedirect("/dashboard") === "/dashboard", "/dashboard remains /dashboard");
  assert(getSafeRedirect("/directory/123-abc") === "/directory/123-abc", "Deep path is allowed");
  assert(getSafeRedirect("   /dashboard  ") === "/dashboard", "Whitespace is trimmed");

  // Malicious / external redirect inputs
  assert(getSafeRedirect("https://hacker.com") === "/dashboard", "Full https URL blocked");
  assert(getSafeRedirect("http://hacker.com/dashboard") === "/dashboard", "Full http URL blocked");
  assert(getSafeRedirect("//hacker.com") === "/dashboard", "Protocol-relative URL blocked");
  assert(getSafeRedirect("///hacker.com") === "/dashboard", "Triple slash URL blocked");
  assert(getSafeRedirect("\\hacker.com") === "/dashboard", "Backslash URL blocked");
  assert(getSafeRedirect("/\\hacker.com") === "/dashboard", "Prefix backslash URL blocked");
  assert(getSafeRedirect("javascript:alert(1)") === "/dashboard", "javascript: scheme blocked");

  console.log("All redirect validation tests passed successfully!");
}

runTests();
