export default {
  testEnvironment: "node",
  // Source imports use explicit .js extensions (required by Node's ESM
  // resolver once compiled), but the files on disk are .ts. Strip the
  // extension so Jest's resolver falls through to moduleFileExtensions.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  // Without this, a local `npm run build` (or a stray non---noEmit tsc run)
  // leaves compiled test doubles in dist/tests/*.test.js that Jest picks up
  // alongside the real tests/*.test.ts sources, running everything twice.
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
