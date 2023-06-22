/**
 * Template Handlers
 *
 */

//Deps
const helpers = require("./helpers");

// container
const templateHandlers = {};

const getTemplateByName = (templateName, data, globalPageData, cb) => {
  if (data.method !== "get") return cb(405, null, "html");

  // getting template by Name
  helpers.getTemplate(templateName, globalPageData, (err, data) => {
    if (err) return cb(500, null, "html");

    helpers.addHeaderAndFooterSection(data, globalPageData, (err, finalStr) => {
      if (err)
        return cb(
          500,
          { error: "Couldn't add both header and footer" },
          "html"
        );

      cb(200, finalStr, "html");
    });
  });
};

// accept only a get method
// Return 405 - Method Not Acceptable
templateHandlers.index = (data, callback) => {
  // get the index template
  // use helper.getTemplate
  const indexGlobals = {
    "global.bodyClass": "index",
    "global.title": "Uptime Checker"
  };
  getTemplateByName("index", data, indexGlobals, callback);
};

templateHandlers.accountCreate = (data, cb) => {

   const accountCreateGlobals = {
     "global.bodyClass": "index",
     "global.title": "Create Account",
   };

  getTemplateByName("accountCreate", data, accountCreateGlobals, cb);
};

templateHandlers.login = (data, cb) => {
  const accountLoginGlobals = {
    "global.bodyClass": "index",
    "global.title": "Login",
  };

  getTemplateByName("login", data, accountLoginGlobals, cb);
};

// favicon
templateHandlers.favicon = (data, callback) => {
  if (data.method !== "get") return callback(405, null, "html");

  helpers.getStaticAsset("favicon.ico", (err, asset) => {
    if (err) return callback(404);

    callback(200, asset, "favicon");
  });
};

// static assets
templateHandlers.public = (data, callback) => {
  if (data.method !== "get") return callback(405, null, "html");

  // get the name for the asset
  const assetName = data.trimmedPath.replace("public/", "");

  if (!assetName) return callback(404);

  // getting the actual asset
  helpers.getStaticAsset(assetName, (err, asset) => {
    if (err) {
      console.log(`Error: `, err);
      return callback(404);
    }

    let contentType = "plain";

    if (assetName.indexOf(".css") > -1) contentType = "css";
    if (assetName.indexOf(".jpeg") > -1 || assetName.indexOf(".jpg") > -1)
      contentType = "jpeg";
    if (assetName.indexOf(".png") > -1) contentType = "png";
    if (assetName.indexOf(".ico") > -1) contentType = "favicon";
    // if (assetName.indexOf(".js") > -1) contentType = "text/javascript";

    // return back the asset
    // with its corresponding
    // contentType
    callback(200, asset, contentType);
  });
};

// export
module.exports = templateHandlers;
