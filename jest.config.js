module.exports = {
  preset: "ts-jest", // Use ts-jest to handle TypeScript
  testEnvironment: "node", // Node environment for backend testing
  transform: {
    "^.+\\.ts$": "ts-jest", // Transform TypeScript files using ts-jest
  },
  extensionsToTreatAsEsm: [".ts"], // Treat TypeScript files as ES modules
};
