import { logoutUser } from "../../controllers/auth.controllers";
import { responseHandler, genericError } from "../../utils/response-handlers";
import { Request, Response } from "express";

jest.mock("../../utils/response-handlers", () => ({
  responseHandler: jest.fn(),
  genericError: jest.fn(),
}));

describe("logout user", () => {
    let mockReq: any;
    let mockRes: any; 

  beforeEach(() => {
    mockReq = {
      cookies: { token: "validToken" },
    };
    mockRes = {
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("should return 401 if no token is found", async () => {
    mockReq.cookies.token = undefined;

    await logoutUser(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      401,
      "No token found, unauthorized access"
    );
  });

  test("should clear the cookie and return 200 if token is found", async () => {
    await logoutUser(mockReq as Request, mockRes as Response);

    expect(mockRes.clearCookie).toHaveBeenCalledWith("token", expect.objectContaining({
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(0),
    }));
    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      200,
      "User logged out successfully"
    );
  });

  test("should handle errors gracefully", async () => {
    const error = new Error("Something went wrong");
    jest.spyOn(mockRes, 'clearCookie').mockImplementationOnce(() => { throw error; });

    await logoutUser(mockReq as Request, mockRes as Response);

    expect(genericError).toHaveBeenCalledWith(mockRes, error);
  });
});
