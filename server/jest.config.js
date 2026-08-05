// The default 5000ms per-test timeout is routinely too tight here: every
// test does real round trips to the live MongoDB Atlas cluster (no local
// mock) plus bcrypt hashing per user created, and later tests in a file
// slow down further as the run accumulates load under --runInBand. This
// isn't a hang — confirmed by re-running failing files with a longer
// timeout and watching them pass in a fraction of it. A single global
// default here replaces one-off jest.setTimeout() calls scattered across
// individual test files.
module.exports = {
  testTimeout: 20000,
};
