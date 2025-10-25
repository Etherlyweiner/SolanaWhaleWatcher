'use strict';

function roundTo(value, decimals = 2) {
  if (Number.isNaN(Number(value))) return null;
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}

module.exports = {
  roundTo,
};
