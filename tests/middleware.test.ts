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
    const mockDecodedToken = { 
      id: "user123", 
      email: "test@example.com", 
      username: "testuser",
      exp: Math.floor(Date.now() / 1000) + 3600 
    };

    (verify as jest.Mock).mockImplementation((token, secret) => {
      if (token === "mockValidToken" && secret === process.env.JWT_SECRET) {
        return mockDecodedToken;
      }
      throw new Error("Invalid token");
    });

    (getUserById as jest.Mock).mockResolvedValue({ 
      id: "user123", 
      email: "test@example.com" 
    });

    (sign as jest.Mock).mockReturnValue("newMockToken");

    (responseHandler as jest.Mock).mockImplementation();

    await auth_check(
      mockReq as Request, 
      mockRes as Response, 
      mockNext
    );

    expect(verify).toHaveBeenCalledWith("mockValidToken", process.env.JWT_SECRET);
    expect(getUserById).toHaveBeenCalledWith("user123");
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.cookie).toHaveBeenCalled();
  });

  test("should return 401 for missing token", async () => {
    mockReq = {
      cookies: {},
      headers: {},
    };

    await auth_check(
      mockReq as Request, 
      mockRes as Response, 
      mockNext
    );

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes, 
      401, 
      'Unauthorized Access'
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for invalid token", async () => {
    mockReq = {
      cookies: { token: "invalidToken" },
      headers: { authorization: "Bearer invalidToken" },
    };

    (verify as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await auth_check(
      mockReq as Request, 
      mockRes as Response, 
      mockNext
    );

    expect(responseHandler).toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

});