// @ts-ignore
Number.prototype.isInRangeOf = function (min = 0, max = null) {
  if (max === null) {
    // @ts-ignore
    return this >= min;
  }
  // @ts-ignore
  return this >= min && this <= max;
};

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {{
 *  customerId: null | string,
 *  customerPriceClass: null | string,
 *  price: number,
 *  breakQty: number,
 * }} BreakPoint
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
  /** @type {(line: RunInput['cart']['lines'][number]) => string | undefined | null} */
  const hasCustomPriceAttribute = (line) => line.prices && line.prices?.value;

  /** @type {(line: RunInput['cart']['lines'][number]) => any} */
  const noUpdates = (line) => ({
    update: {
      cartLineId: line.id,
      price: {
        adjustment: {
          fixedPricePerUnit: {
            amount: line.cost.amountPerQuantity.amount,
          },
        },
      },
    },
  });

  const operations = input?.cart?.lines
    .filter(hasCustomPriceAttribute)
    .map((line) => {
      if (line.prices?.value) {
        const prices =
          typeof line.prices.value === "string"
            ? JSON.parse(line.prices.value)
            : [];

        /** @type {BreakPoint | null} */
        const breakPoint = getBreakPoint(line.quantity, prices);

        if (breakPoint) {
          return {
            update: {
              cartLineId: line.id,
              price: {
                adjustment: {
                  fixedPricePerUnit: {
                    amount: Number(breakPoint.price),
                  },
                },
              },
            },
          };
        }
      }
      return noUpdates(line);
    });

  return operations?.length ? { operations } : NO_CHANGES;
}

/**
 * @description Gets the break point for the specified quantity
 * @param {number} quantity
 * @param {BreakPoint[]} breakPoints
 * @returns {BreakPoint | null}
 */
function getBreakPoint(quantity, breakPoints = []) {
  const breakPointsCollection = [];

  for (const [index, breakPoint] of breakPoints.entries()) {
    if (index === breakPoints.length - 1) {
      const min = breakPoint.breakQty;
      // @ts-ignore
      if (quantity.isInRangeOf(min)) breakPointsCollection.push(breakPoint);
    } else {
      const min = breakPoint.breakQty;
      const max = breakPoints[index + 1].breakQty - 1;
      // @ts-ignore
      if (quantity.isInRangeOf(min, max))
        breakPointsCollection.push(breakPoint);
    }
  }

  if (breakPointsCollection.length) {
    const customerSpecificBreakPoint = breakPointsCollection.find(
      ({ customerId }) => customerId,
    );
    if (customerSpecificBreakPoint) return customerSpecificBreakPoint;

    const customerPriceClassBreakPoint = breakPointsCollection.find(
      ({ customerPriceClass }) => customerPriceClass,
    );
    if (customerPriceClassBreakPoint) return customerPriceClassBreakPoint;

    const defaultBreakPoint = breakPointsCollection.find(
      ({ customerId, customerPriceClass }) =>
        !customerId && !customerPriceClass,
    );
    return defaultBreakPoint || null;
  }
  return null;
}