import { getUserByEmailOrUsername, updateProfileInformation } from "../../controllers/user.controllers";
import { responseHandler, genericError } from "../../utils/response-handlers";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../../models/user.models";
import { connectToDatabase } from "../../utils/db";
import { verify } from "jsonwebtoken";

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
  }));

jest.mock("../../utils/response-handlers", () => ({
  responseHandler: jest.fn(),
  genericError: jest.fn(),
}));
jest.mock("../../utils/db", () => ({
    connectToDatabase: jest.fn(),
  }));
  
jest.mock("../../models/user.models", () => ({
  User: {
    findOne: jest.fn(),
  },
}));

describe("updateProfileInformation", () => {
    let mockReq: any;
    let mockRes: any; 
  beforeEach(() => {
    mockReq = {
      cookies: { token: "validToken" },
      body: { username: "newUsername" },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("should return 401 if no token is found", async () => {
    mockReq.cookies.token = undefined;

    await updateProfileInformation(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(mockRes, 401, "Unauthorized");
  });

  test("should return 404 if user is not found", async () => {
    mockReq = {
        cookies: { token: "valid-token" },
        body: { username: "newUsername" },
    };
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    // Mock token verification
    (verify as jest.Mock).mockReturnValue({ id: "userId" });

    // Mock database operations
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (User.findOne as jest.Mock).mockResolvedValue(null); // User not found

    await updateProfileInformation(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(mockRes, 404, "User not found!");
});
test("should return 400 if no field is provided to update", async () => {
    mockReq = {
        cookies: { token: "valid-token" },
        body: {}, // Empty body
    };
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    // Mock token verification
    (verify as jest.Mock).mockReturnValue({ id: "userId" });

    await updateProfileInformation(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(mockRes, 400, "Please provide at least one field to update");
});
test("should return 400 if username already exists", async () => {
    mockReq = {
        cookies: { token: "valid-token" },
        body: { username: "existingUsername" },
    };
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    // Mock token verification
    (verify as jest.Mock).mockReturnValue({ id: "userId" });

    // Mock database operations
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (User.findOne as jest.Mock).mockResolvedValue({ id: "userId" }); // User found
    (getUserByEmailOrUsername as jest.Mock).mockResolvedValue(true); // Username exists

    await updateProfileInformation(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(mockRes, 400, "Username already exists");
});

test("should return 400 if the username is the same as the current one", async () => {
    mockReq = {
        cookies: { token: "valid-token" },
        body: { username: "currentUsername" },
    };
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    // Mock token verification
    (verify as jest.Mock).mockReturnValue({ id: "userId" });

    // Mock database operations
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (User.findOne as jest.Mock).mockResolvedValue({ id: "userId", username: "currentUsername" });

    await updateProfileInformation(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(mockRes, 400, "Username is the same as the current one");
});

test("should return 200 if the username is updated successfully", async () => {
    mockReq = {
        cookies: { token: "valid-token" },
        body: { username: "newUsername" },
    };
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    // Mock token verification
    (verify as jest.Mock).mockReturnValue({ id: "userId" });

    // Mock database operations
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (User.findOne as jest.Mock).mockResolvedValue({ id: "userId", username: "oldUsername" });
    (getUserByEmailOrUsername as jest.Mock).mockResolvedValue(null); // Username doesn't exist

    // Mock user save
    const saveMock = jest.fn().mockResolvedValue({ username: "newUsername" });
    (User.prototype.save as jest.Mock).mockImplementation(saveMock);

    await updateProfileInformation(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(mockRes, 200, "User updated successfully");
    expect(saveMock).toHaveBeenCalled();
});
test("should return 500 if there is a server error", async () => {
    mockReq = {
        cookies: { token: "valid-token" },
        body: { username: "newUsername" },
    };
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    // Mock token verification
    (verify as jest.Mock).mockReturnValue({ id: "userId" });

    // Mock database operation to throw an error
    (connectToDatabase as jest.Mock).mockRejectedValue(new Error("Database error"));

    await updateProfileInformation(mockReq as Request, mockRes as Response);

    expect(genericError).toHaveBeenCalledWith(mockRes, expect.any(Error));
});

});
