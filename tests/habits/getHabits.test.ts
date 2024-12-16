import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { Habit } from "../../models/habit.models";
import { getHabitGoalProgress, getUserHabits } from "../../controllers/habit.controllers";
import { responseHandler } from "../../utils/response-handlers";
import { connectToDatabase } from "../../utils/db";
import { getUserByEmailOrUsername } from "../../controllers/user.controllers";
import { createAccomplishedStatus, getHabitCountPerFrequency } from "../../controllers/accomplished.controllers";

jest.mock("../../utils/db", () => ({
  connectToDatabase: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn()
}));

jest.mock("../../utils/response-handlers", () => ({
  responseHandler: jest.fn(),
  genericError: jest.fn()
}));

jest.mock("../../models/habit.models", () => ({
  Habit: {
    countDocuments: jest.fn(),
    find: jest.fn()
  }
}));

jest.mock("../../controllers/habit.controllers", () => ({
  ...jest.requireActual("../../controllers/habit.controllers"),
  getHabitGoalProgress: jest.fn()
}));

jest.mock("../../controllers/accomplished.controllers", () => ({
  createAccomplishedStatus: jest.fn(),
  getHabitCountPerFrequency: jest.fn()
}));

jest.mock("../../controllers/user.controllers", () => ({
  getUserByEmailOrUsername: jest.fn()
}));

describe("getUserHabits", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";

    mockReq = {
      cookies: { token: "validToken" },
      query: { page: "1", limit: "5" },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("should successfully retrieve habits with pagination", async () => {
    const mockDecodedToken = { 
      id: "user123", 
      email: "test@example.com" 
    };

    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (verify as jest.Mock).mockReturnValue(mockDecodedToken);
    (getUserByEmailOrUsername as jest.Mock).mockResolvedValue({
      _id: "user123",
      email: "test@example.com"
    });

    (Habit.countDocuments as jest.Mock).mockResolvedValue(10);
    (Habit.find as jest.Mock).mockImplementation(() => ({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue([
        { _id: "habit1", name: "Habit 1", goal: 7 },
        { _id: "habit2", name: "Habit 2", goal: 5 },
      ])
    }));

    (createAccomplishedStatus as jest.Mock).mockResolvedValue(true);
    (getHabitGoalProgress as jest.Mock).mockResolvedValue(3.5);
    (getHabitCountPerFrequency as jest.Mock).mockResolvedValue(3);
    (responseHandler as jest.Mock).mockImplementation((res, status, message, data) => {
      res.status(status).json(data);
    });

    await getUserHabits(mockReq as Request, mockRes as Response);
    expect(connectToDatabase).toHaveBeenCalled();
    expect(verify).toHaveBeenCalledWith("validToken", process.env.JWT_SECRET);
    expect(getUserByEmailOrUsername).toHaveBeenCalledWith("test@example.com");
    expect(Habit.find).toHaveBeenCalledWith({
      user_id: "user123",
      deleted_at: null
    });
    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      200,
      'Habits retrieved successfully',
      expect.objectContaining({
        data: expect.any(Array),
        total: 10,
        page: 1,
        limit: 5,
        totalPages: 2,
      })
    );
  });

  test("should return 401 if no token is provided", async () => {
    mockReq.cookies = {};

    await getUserHabits(mockReq as Request, mockRes as Response);

    expect(connectToDatabase).toHaveBeenCalled();
    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      401,
      "Unauthorized"
    );
  });

  test("should return 404 if user is not found", async () => {
    const mockDecodedToken = { id: "user123", email: "test@example.com" };

    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (verify as jest.Mock).mockReturnValue(mockDecodedToken);
    (getUserByEmailOrUsername as jest.Mock).mockResolvedValue(null);

    await getUserHabits(mockReq as Request, mockRes as Response);

    expect(connectToDatabase).toHaveBeenCalled();
    expect(getUserByEmailOrUsername).toHaveBeenCalledWith("test@example.com");
    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      404,
      "User not found"
    );
  });
test("should return 204 if no habits are found", async () => {
    const mockDecodedToken = { 
      id: "user123", 
      email: "test@example.com" 
    };
  
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (verify as jest.Mock).mockReturnValue(mockDecodedToken);
    
    (getUserByEmailOrUsername as jest.Mock).mockResolvedValue({ 
      _id: "user123", 
      email: "test@example.com" 
    });
  
    (Habit.countDocuments as jest.Mock).mockResolvedValue(0);
    (Habit.find as jest.Mock).mockImplementation(() => ({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue([])
    }));
  
    (responseHandler as jest.Mock).mockImplementation((res, status, message, data) => {
      res.status(status).json(data || {});
    });
  
    await getUserHabits(mockReq as Request, mockRes as Response);
  
    expect(Habit.countDocuments).toHaveBeenCalledWith({ 
      user_id: "user123", 
      deleted_at: null 
    });
    expect(Habit.find).toHaveBeenCalledWith({ 
      user_id: "user123", 
      deleted_at: null 
    });
    
    expect(responseHandler).toHaveBeenCalledWith(
      mockRes, 
      204, 
      "No habits found"
    );
  });
});
