import { getProfileInformation } from "../../controllers/user.controllers";
import { connectToDatabase } from "../../utils/db";
import { User } from "../../models/user.models";
import { responseHandler, genericError } from "../../utils/response-handlers";
import { verify } from "jsonwebtoken";
import { Request, Response } from "express";

jest.mock("../../utils/db", () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock("../../models/user.models", () => ({
  User: {
    findOne: jest.fn(),
  },
}));

jest.mock("../../utils/response-handlers", () => ({
  responseHandler: jest.fn(),
  genericError: jest.fn(),
  logoutUser: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

describe("getProfileInformation", () => {
    let mockReq: any;
    let mockRes: any; 

  beforeEach(() => {
    mockReq = {
      cookies: { token: "validToken" },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("should return 401 if no token is provided", async () => {
    mockReq.cookies.token = undefined;

    await getProfileInformation(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      401,
      "Unauthorized"
    );
  });

  test("should return 404 if user not found", async () => {
    const decodedToken = { id: "userId" };
    (verify as jest.Mock).mockReturnValue(decodedToken);
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await getProfileInformation(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      404,
      "User not found!"
    );
  });

  test("should return 200 and user information if user found", async () => {
    const decodedToken = { id: "userId" };
    const userMock = { username: "testuser", email: "test@example.com" };
    (verify as jest.Mock).mockReturnValue(decodedToken);
    (User.findOne as jest.Mock).mockResolvedValue(userMock);

    await getProfileInformation(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      200,
      "User found!",
      {
        username: "testuser",
        email: "test@example.com",
      }
    );
  });

  test("should handle errors gracefully", async () => {
    (connectToDatabase as jest.Mock).mockRejectedValue(new Error("Database connection error"));

    await getProfileInformation(mockReq as Request, mockRes as Response);

    expect(genericError).toHaveBeenCalledWith(mockRes, expect.any(Error));
  });
});
