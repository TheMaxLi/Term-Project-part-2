const { parse } = require("url");
const { DEFAULT_HEADER } = require("./util/util.js");
const controller = require("./controller");
const { createReadStream } = require("fs");
const path = require("path");
const fs = require("fs/promises");

const allRoutes = {
  // GET: localhost:3000/
  "/:get": async (request, response) => {
    await controller.getHomePage(request, response);
  },
  // POST: localhost:3000/form
  "/form:post": (request, response) => {
    controller.sendFormData(request, response);
  },
  "/test:post": (request, response) => {
    controller.test(request, response);
  },
  // 404 routes
  default: (request, response) => {
    response.writeHead(404, DEFAULT_HEADER);
    createReadStream(path.join(__dirname, "views", "404.html"), "utf8").pipe(
      response
    );
  },
};

function handler(request, response) {
  const { url, method } = request;

  const { pathname } = parse(url, true);
  const key = `${pathname}:${method.toLowerCase()}`;

  const handlerCode = {
    ".jpeg": sendPhotoToClient,
    ".png": sendPhotoToClient,
    ".jpg": sendPhotoToClient,
    ".css": sendCss,
    "/feed": sendFeedUrl,
    "photos/": uploadPhoto,
  };
  for (code in handlerCode) {
    if (pathname.includes(code)) {
      allRoutes[key] = handlerCode[code];
    }
  }

  const chosen = allRoutes[key] || allRoutes.default;

  return Promise.resolve(chosen(request, response)).catch(
    handlerError(response)
  );
}

sendPhotoToClient = async (request, response) => {
  const { url } = request;
  const imgPath = path.join(__dirname, "photos", url);
  const img = await fs.readFile(imgPath);
  response.end(img);
};

sendCss = async (request, response) => {
  const { url } = request;
  const cssFileName = getFileName(url);
  const cssPath = path.join(__dirname, "public", cssFileName);
  const css = await fs.readFile(cssPath);
  response.end(css);
};

sendFeedUrl = (request, response) => {
  controller.getFeed(request, response);
};

uploadPhoto = (request, response) => {
  controller.uploadImages(request, response);
};

function handlerError(response) {
  return (error) => {
    console.log("Something bad has  happened**", error.stack);
    response.writeHead(500, DEFAULT_HEADER);
    response.write(JSON.stringify({ error: "internet server error!!" }));

    return response.end();
  };
}

function getFileName(str) {
  const splitList = str.split("/");
  for (let i = 0; i < splitList.length; i++) {
    if (splitList[i].includes(".")) {
      return splitList[i];
    }
  }
}

module.exports = handler;
