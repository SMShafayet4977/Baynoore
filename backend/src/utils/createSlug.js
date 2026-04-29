const slugify = require("slugify");

function createSlug(name, productCode) {
  const nameSlug = slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  const codeSlug = slugify(productCode, {
    lower: true,
    strict: true,
  });

  return `${nameSlug}-${codeSlug}`;
}

module.exports = { createSlug };
