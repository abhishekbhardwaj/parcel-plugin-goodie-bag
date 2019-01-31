const fs = require("fs");
const path = require("path");
const URL = require("url");
const cheerio = require("cheerio");
const goodieBagFileName = "goodie-bag.min.js";
const goodieBagHeaderComment = `/**
* parcel-plugin-goodie-bag
*
* Provides a high-level polyfill to both the Promise and fetch APIs, to keep parcel working on IE(11).
* This works around: https://github.com/parcel-bundler/parcel/issues/2364
*
* src: https://github.com/edm00se/parcel-plugin-goodie-bag
*/`;

module.exports = function(bundler) {
    bundler.on("bundled", bund => {
        if (bund.type === "html" && bund.entryAsset.basename === "index.html") {
            injectGoodies(bund);
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

function copyGoodiesToDist(outDir) {
    const polyPromisePath = require.resolve(
        "es6-promise/dist/es6-promise.auto.min.js"
    );
    const polyPromiseContent = fs.readFileSync(polyPromisePath, "utf8");
    const polyFetchPath = require.resolve("unfetch/polyfill/index.js");
    const polyFetchContent = fs.readFileSync(polyFetchPath, "utf8");
    const polyObjectAssignPath = require.resolve(
        "es6-object-assign/dist/object-assign-auto.min.js"
    );
    const polyObjectAssignContent = fs.readFileSync(
        polyObjectAssignPath,
        "utf8"
    );
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
    const polyObjectEntriesValuesContent = fs.readFileSync(
        require.resolve(
            "es7-object-polyfill/build/es7-object-polyfill.browser.js"
        ),
        "utf8"
    );

    const polyFileContent = [
        goodieBagHeaderComment,
        polyPromiseContent,
        polyFetchContent,
        polyObjectAssignContent,
        polyArrayIncludesContent,
        polyArrayFindContent,
        polyObjectEntriesValuesContent
    ].join("\n");

    fs.writeFileSync(path.join(outDir, goodieBagFileName), polyFileContent);
}

function resolveGoodieBagPath(bundlePublicUrl) {
    const url = URL.parse(bundlePublicUrl, false, true);
    const assetUrl = URL.parse(goodieBagFileName);
    url.pathname = path.posix.join(url.pathname, assetUrl.pathname);
    return URL.format(url);
}
