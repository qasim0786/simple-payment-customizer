// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const metafieldValue = input.shop?.metafield?.value;
  const availablePaymentMethods = input.paymentMethods;

  // Return early if no metafield value or payment methods
  if (!metafieldValue || !availablePaymentMethods?.length) {
    console.log("No metafield value or payment methods found");
    return NO_CHANGES;
  }

  let prioritizedMethods;
  try {
    prioritizedMethods = JSON.parse(metafieldValue);
    if (!Array.isArray(prioritizedMethods)) {
      throw new Error("Metafield value is not an array");
    }
  } catch (err) {
    console.error("Failed to parse metafield value:", err);
    return NO_CHANGES;
  }

  // Create a map of available payment methods by name for easier lookup
  const availableMethodsMap = new Map();
  availablePaymentMethods.forEach(method => {
    if (method && method.name && method.id) {
      availableMethodsMap.set(method.name, method);
    }
  });

  if (availableMethodsMap.size === 0) {
    console.log("No valid available payment methods found");
    return NO_CHANGES;
  }

  // Filter and sort operations based on prioritized methods that exist in available methods
  const operations = [];
  const processedMethods = new Set();

  // Add reorder operations for methods that exist in both lists
  for (const priorityMethod of prioritizedMethods) {
    if (!priorityMethod?.name) continue;
    
    const availableMethod = availableMethodsMap.get(priorityMethod.name);
    if (availableMethod) {
      operations.push({
        move: {
          paymentMethodId: availableMethod.id,
          index: operations.length
        }
      });
      processedMethods.add(priorityMethod.name);
    }
  }

  // Then hide methods that aren't in the priority list
  for (const method of availablePaymentMethods) {
    if (method?.name && !processedMethods.has(method.name)) {
      operations.push({
        hide: {
          paymentMethodId: method.id
        }
      });
    }
  }

  if (operations.length === 0) {
    console.log("No valid operations generated");
    return NO_CHANGES;
  }

  return { operations };
}
