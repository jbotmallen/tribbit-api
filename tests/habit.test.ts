import { Request, Response, NextFunction } from "express";
import { verify, sign } from "jsonwebtoken";
import { getUserById } from "../controllers/user.controllers";
import { responseHandler } from "../utils/response-handlers";
import { auth_check } from "../middlewares/authentication";

jest.mock("jsonwebtoken");
jest.mock("../controllers/user.controllers");
jest.mock("../utils/response-handlers");

describe("auth_check middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    process.env.JWT_SECRET = "kyungchu";

    mockReq = {
      cookies: { token: "mockValidToken" },
      headers: { authorization: "Bearer mockValidToken" },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    mockNext = jest.fn();
  });

  test("should call next for a valid token", async () => {
    // Detailed mocking
    const mockDecodedToken = { 
      id: "user123", 
      email: "test@example.com", 
      username: "testuser",
      exp: Math.floor(Date.now() / 1000) + 3600 
    };

    // Mock verify to simulate successful token verification
    (verify as jest.Mock).mockImplementation((token, secret) => {
      if (token === "mockValidToken" && secret === process.env.JWT_SECRET) {
        return mockDecodedToken;
      }
      throw new Error("Invalid token");
    });

    // Mock getUserById to return a user
    (getUserById as jest.Mock).mockResolvedValue({ 
      id: "user123", 
      email: "test@example.com" 
    });

    // Mock sign to return a new token
    (sign as jest.Mock).mockReturnValue("newMockToken");

    // Mock responseHandler to do nothing
    (responseHandler as jest.Mock).mockImplementation();

    // Call the middleware
    await auth_check(
      mockReq as Request, 
      mockRes as Response, 
      mockNext
    );

    // Debug logging
    console.log("Verify mock calls:", (verify as jest.Mock).mock.calls);
    console.log("getUserById mock calls:", (getUserById as jest.Mock).mock.calls);
    console.log("Next function calls:", mockNext.mock.calls);
    console.log("ResponseHandler calls:", (responseHandler as jest.Mock).mock.calls);

    // Assertions
    expect(verify).toHaveBeenCalledWith("mockValidToken", process.env.JWT_SECRET);
    expect(getUserById).toHaveBeenCalledWith("user123");
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.cookie).toHaveBeenCalled();
  });
});