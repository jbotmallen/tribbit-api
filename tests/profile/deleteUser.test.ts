import { deleteUser } from "../../controllers/user.controllers";
import { responseHandler, genericError } from "../../utils/response-handlers";
import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { User } from "../../models/user.models";
import { Habit } from "../../models/habit.models";
import { Accomplished } from "../../models/accomplished.models";
import { logoutUser } from "../../controllers/auth.controllers";
import { connectToDatabase } from "../../utils/db";

jest.mock("../../utils/response-handlers", () => ({
    responseHandler: jest.fn(),
    genericError: jest.fn(),
}));
jest.mock("../../utils/db", () => ({
    connectToDatabase: jest.fn(),
}));

jest.mock("../../models/user.models", () => ({
    User: {
      findOneAndDelete: jest.fn(),
    },
  }));
  
jest.mock("../../models/habit.models", () => ({
    Habit:{
        find: jest.fn(),
        deleteMany: jest.fn(),
    }
}))
jest.mock("../../models/accomplished.models", () => ({
    Accomplished:{
        deleteMany: jest.fn(),

    }
}))

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
  }));
jest.mock("../../controllers/auth.controllers", () => ({
  logoutUser: jest.fn(),
}));

describe("deleteUser", () => {
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

  test("should return 401 if no token is found", async () => {
    mockReq.cookies.token = undefined;

    await deleteUser(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(mockRes, 401, "Unauthorized");
  });

  test("should return 404 if user is not found", async () => {
    
    mockReq = {
      cookies: { token: 'valid-token' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  
    
    (verify as jest.Mock).mockReturnValue({ id: "userId", _id: "userId" });
  
    
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (User.findOneAndDelete as jest.Mock).mockResolvedValue(null); 
  
    
    await deleteUser(mockReq as Request, mockRes as Response);
  
    
    expect(responseHandler).toHaveBeenCalledWith(mockRes, 404, "User not found!");
  
    
    expect(Habit.find).not.toHaveBeenCalled();
    expect(Habit.deleteMany).not.toHaveBeenCalled();
    expect(Accomplished.deleteMany).not.toHaveBeenCalled();
});

test("should delete all habits and accomplishments if user is deleted", async () => {
    mockReq = {
        cookies: { token: "valid-token" },
    };
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    
    (verify as jest.Mock).mockReturnValue({ id: "userId", _id: "userId" });

    
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (User.findOneAndDelete as jest.Mock).mockResolvedValue({ id: "userId" }); 
    (Habit.find as jest.Mock).mockResolvedValue([{ _id: "habit1" }, { _id: "habit2" }]); 
    (Accomplished.deleteMany as jest.Mock).mockResolvedValue({}); 

    
    await deleteUser(mockReq as Request, mockRes as Response);

    
    expect(Habit.find).toHaveBeenCalledWith({ user_id: "userId" });
    expect(Accomplished.deleteMany).toHaveBeenCalledWith({ habit_id: "habit1" });
    expect(Accomplished.deleteMany).toHaveBeenCalledWith({ habit_id: "habit2" });
    expect(Habit.deleteMany).toHaveBeenCalledWith({ user_id: "userId" });
});
test("should not delete habits if user deletion fails", async () => {
    mockReq = {
        cookies: { token: "valid-token" },
    };
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    
    (verify as jest.Mock).mockReturnValue({ id: "userId", _id: "userId" });

    
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (User.findOneAndDelete as jest.Mock).mockResolvedValue(null); 

    
    await deleteUser(mockReq as Request, mockRes as Response);

    
    expect(responseHandler).toHaveBeenCalledWith(mockRes, 404, "User not found!");

    
    expect(Habit.find).not.toHaveBeenCalled();
    expect(Habit.deleteMany).not.toHaveBeenCalled();
    expect(Accomplished.deleteMany).not.toHaveBeenCalled();
});
test("should return 500 if there is a server error", async () => {
    mockReq = {
        cookies: { token: "valid-token" },
    };
    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    
    (verify as jest.Mock).mockReturnValue({ id: "userId", _id: "userId" });

    
    (connectToDatabase as jest.Mock).mockRejectedValue(new Error("Database error"));

    
    await deleteUser(mockReq as Request, mockRes as Response);

    
    expect(genericError).toHaveBeenCalledWith(mockRes, expect.any(Error));
});

});
