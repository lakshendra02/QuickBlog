import ImageKit from "imagekit";

var imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// monkey patch imagekit.url to trace usage
const originalUrlMethod = imagekit.url;

imagekit.url = function (options) {
  return originalUrlMethod.call(this, options);
};

export default imagekit;
