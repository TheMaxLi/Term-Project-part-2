const fs = require("fs/promises");
const path = require("path");
const qs = require("querystring");
const ejs = require("ejs");
const util = require("util");
const { formidable } = require("formidable");
const promisifyFunction = util.promisify(ejs.renderFile);

const openAndAddToDatabase = (request, response, fileName) => {
  const { url } = request;
  const username = url.split("/")[2];
  const dataPath = path.join(__dirname, "..", "database", "data.json");
  fs.readFile(dataPath)
    .then((data) => addPhotoToDatabase(data, username, fileName))
    .then((data) => fs.writeFile(dataPath, JSON.stringify(data)))
    .catch((err) => console.log(err));
};

const addPhotoToDatabase = (data, name, fileName) => {
  const newDatabase = JSON.parse(data).map((obj) => {
    if (obj.username === name) {
      obj.photos.push(fileName);
      obj.stats.post++;
    }
    return obj;
  });
  return newDatabase;
};

const controller = {
  uploadImages: async (request, response) => {
    const { url } = request;
    const uploadDir = path.join(__dirname, url);

    const form = formidable({ keepExtensions: true, uploadDir: uploadDir });
    let fields, files;
    [fields, files] = await form.parse(request);
    const fileName = files.photo[0].newFilename;

    openAndAddToDatabase(request, request, fileName);

    response.writeHead(302, { location: "/" });
    response.end();
    return;
  },
  getHomePage: async (request, response) => {
    const pageTemplatePath = path.join(__dirname, "public", "home.html");
    const dataPath = path.join(__dirname, "..", "database", "data.json");
    const database = await fs.readFile(dataPath);
    let usersArray = JSON.parse(database);

    for (user of usersArray) {
      const profileImgPath = path.join(user.username, user.profile);
      const imgDirPath = path.join("photos", user.username);
      user.imgDirPath = imgDirPath;
      user.profile = profileImgPath;
    }

    let renderedHomepage = await promisifyFunction(pageTemplatePath, {
      usersArray: usersArray,
    });
    return response.end(renderedHomepage);
  },
  getFeed: async (request, response) => {
    const { url } = request;
    const pageTemplatePath = path.join(__dirname, "public", "profilePage.html");

    const dataPath = path.join(__dirname, "..", "database", "data.json");
    const database = await fs.readFile(dataPath);
    let usersArray = JSON.parse(database);

    for (user of usersArray) {
      if (url.includes(user.username)) {
        let renderedHomepage = await promisifyFunction(pageTemplatePath, {
          user: user,
        });
        return response.end(renderedHomepage);
      }
    }
  },
  sendFormData: (request, response) => {
    var body = "";

    request.on("data", function (data) {
      body += data;
    });

    request.on("end", function () {
      var post = qs.parse(body);
      console.log(post);
    });
  },
};

module.exports = controller;
