export default {
  testEnvironment: "node",
  // Source imports use explicit .js extensions (required by Node's ESM
  // resolver once compiled), but the files on disk are .ts. Strip the
  // extension so Jest's resolver falls through to moduleFileExtensions.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
