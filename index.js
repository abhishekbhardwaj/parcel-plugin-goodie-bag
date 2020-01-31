const fs = require("fs");
const path = require("path");
const URL = require("url");
const cheerio = require("cheerio");
const UglifyJS = require("uglify-js");
const goodieBagFileName = "goodie-bag.min.js";
const goodieBagHeaderComment = `/**
* parcel-plugin-goodie-bag
*
* Provides high-level polyfills to keep parcel working on IE(11) for the following API's:
*
* - Promise
* - fetch APIs
* - Object.assign
* - Array.includes
* - Array.find
* - Object.entries
* - Object.values
* - Object.keys
* - Array.findIndex
* - URL (object)
*
* This works around: https://github.com/parcel-bundler/parcel/issues/2364
*
* Source: https://github.com/edm00se/parcel-plugin-goodie-bag
* Fork: https://github.com/phoenix-scitent/parcel-plugin-goodie-bag
*/`;

module.exports = function(bundler) {
  bundler.on("bundled", bund => {
    // Pretty custom for propel
    if (bund.type === "html" && bund.entryAsset.basename === "index.html") {
      // For development (this gets called) - ./node_modules/.bin/parcel serve index.html
      injectGoodies(bund);
    } else {
      // For production (this gets called) - ./node_modules/.bin/parcel build index.html --out-dir build
      bund.childBundles.forEach(b => {
        if (b.type === "html") {
          copyGoodiesToDist(path.dirname(b.name), true);
        }
      });
    }
  });
};

function injectGoodies(bund) {
  const filePath = bund.name;
  const bundlePublicUrl = bund.entryAsset.options.publicURL;
  const finalResolvedGoodieBagDestination = resolveGoodieBagPath(
    bundlePublicUrl
  );
  const bundleDir = path.dirname(bund.name);
  const content = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(content);

  if (!$(`script[src="${finalResolvedGoodieBagDestination}"]`).length > 0) {
    $("head").prepend(
      `<script src="${finalResolvedGoodieBagDestination}"></script>`
    );
    fs.writeFileSync(filePath, $.html());

    copyGoodiesToDist(bundleDir);
  }
}

function copyGoodiesToDist(outDir, minify = false) {
  const polyPromisePath = require.resolve(
    "es6-promise/dist/es6-promise.auto.min.js"
  );
  const polyPromiseContent = fs.readFileSync(polyPromisePath, "utf8");
  const polyFetchPath = require.resolve("unfetch/polyfill/index.js");
  const polyFetchContent = fs.readFileSync(polyFetchPath, "utf8");
  const polyObjectAssignPath = require.resolve(
    "es6-object-assign/dist/object-assign-auto.min.js"
  );
  const polyObjectAssignContent = fs.readFileSync(polyObjectAssignPath, "utf8");
  const polyArrayIncludesPath = require.resolve(
    "polyfill-array-includes/index.js"
  );
  const polyArrayIncludesContent = fs.readFileSync(
    polyArrayIncludesPath,
    "utf8"
  );
  const polyArrayFindContent = fs.readFileSync(
    require.resolve("array.find/dist/array-find-polyfill.min.js"),
    "utf8"
  );
  const polyObjectKeysContent = fs.readFileSync(
    require.resolve("./object.keys.js"),
    "utf8"
  );
  const polyObjectEntriesContent = fs.readFileSync(
    require.resolve("./object.entries.js"),
    "utf8"
  );
  const polyArrayFindIndexContent = fs.readFileSync(
    require.resolve("./array.findIndex.js"),
    "utf8"
  );
  const polyfillURLObjectContent = fs.readFileSync(
    require.resolve("url-polyfill/url-polyfill.min.js"),
    "utf8"
  );

  let polyFileContent = [
    goodieBagHeaderComment,
    polyPromiseContent,
    polyFetchContent,
    polyObjectAssignContent,
    polyArrayIncludesContent,
    polyArrayFindContent,
    polyObjectKeysContent,
    polyObjectEntriesContent,
    polyArrayFindIndexContent,
    polyfillURLObjectContent
  ].join("\n");

  // Minify code to reduce size.
  if (minify) {
    const minifyResult = UglifyJS.minify(polyFileContent);
    if (!minifyResult.error) {
      polyFileContent = minifyResult.code;
    }
  }

  fs.writeFileSync(path.join(outDir, goodieBagFileName), polyFileContent);
}

function resolveGoodieBagPath(bundlePublicUrl) {
  const url = URL.parse(bundlePublicUrl, false, true);
  const assetUrl = URL.parse(goodieBagFileName);
  url.pathname = path.posix.join(url.pathname, assetUrl.pathname);
  return URL.format(url);
}
