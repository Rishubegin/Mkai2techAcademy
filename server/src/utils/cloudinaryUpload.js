const crypto = require("crypto");
const cloudinary = require("../config/cloudinary");

// Under test, skip real Cloudinary calls entirely — the test suite uploads
// fake byte buffers (not real images), and tests shouldn't depend on live
// network calls to a third party. Mirrors the NODE_ENV==="test" short-circuits
// already used for email sending and rate limiting.
const uploadBuffer = (buffer, { folder, resourceType = "image" }) => {
  if (process.env.NODE_ENV === "test") {
    const fakeId = crypto.randomBytes(8).toString("hex");
    return Promise.resolve({
      public_id: `${folder}/${fakeId}`,
      secure_url: `https://res.cloudinary.com/test/${resourceType}/upload/${folder}/${fakeId}`,
    });
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) {
          // Cloudinary's own SDK errors ("Server returned unexpected status
          // code - 403", raw HTTP-client internals, etc.) are meaningless to
          // an end user filling out a form. Log the real error server-side
          // for debugging, surface a plain-language one to the client.
          console.error("Cloudinary upload failed:", err.message || err);
          return reject(
            new Error("Image upload isn't working right now. Please try again shortly."),
          );
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
};

const deleteAsset = (publicId, resourceType = "image") => {
  if (process.env.NODE_ENV === "test" || !publicId) {
    return Promise.resolve();
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { uploadBuffer, deleteAsset };
