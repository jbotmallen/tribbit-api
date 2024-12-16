import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { Habit } from "../models/habit.models";
import { createHabit } from "../controllers/habit.controllers";
import { responseHandler } from "../utils/response-handlers";
import { connectToDatabase } from "../utils/db";
import { createAccomplishedStatus } from "../controllers/accomplished.controllers";
import { sanitize } from "../utils/sanitation";
import { convertToPhilippineTime } from "../utils/timezone";

jest.mock("jsonwebtoken");
jest.mock("../utils/db");
jest.mock("../controllers/user.controllers");
jest.mock("../utils/response-handlers");
jest.mock("../models/habit.models");
jest.mock("../controllers/accomplished.controllers");
jest.mock("../utils/sanitation");
jest.mock("../utils/timezone");

describe("Habit Controllers", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";

    mockReq = {
      cookies: { token: "validToken" },
      query: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("createHabit", () => {
    test("should successfully create a habit", async () => {
      const mockDecodedToken = {
        id: "user123",
        email: "test@example.com",
      };

      (connectToDatabase as jest.Mock).mockResolvedValue(true);
      (verify as jest.Mock).mockReturnValue(mockDecodedToken);
      (Habit.findOne as jest.Mock).mockResolvedValue(null);

      (sanitize as jest.Mock).mockReturnValue({ error: null });

      (convertToPhilippineTime as jest.Mock).mockReturnValue("2024-01-01T00:00:00Z");

      (Habit.create as jest.Mock).mockResolvedValue({
        _id: "habit123",
        name: "Test Habit",
        goal: 6,
        user_id: "user123",
        color: "#BFFF95",
      });

      (createAccomplishedStatus as jest.Mock).mockResolvedValue({});

      mockReq.body = {
        name: "Test Habit",
        goal: 6,
        color: "#BFFF95",
      };

      await createHabit(mockReq as Request, mockRes as Response);

      expect(Habit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Habit",
          goal: 6,
          color: "#BFFF95",
          user_id: "user123",
          created_at: "2024-01-01T00:00:00Z",
        })
      );

      expect(responseHandler).toHaveBeenCalledWith(
        mockRes,
        201,
        "Habit created successfully",
        expect.any(Object)
      );
    });

    test("should return 400 for missing required fields", async () => {
      const mockDecodedToken = {
        id: "user123",
        email: "test@example.com",
      };

      (connectToDatabase as jest.Mock).mockResolvedValue(true);
      (verify as jest.Mock).mockReturnValue(mockDecodedToken);

      mockReq.body = {
        name: "hihelo",
      };

      await createHabit(mockReq as Request, mockRes as Response);

      expect(responseHandler).toHaveBeenCalledWith(
        mockRes,
        400,
        "Please provide all required fields"
      );
    });
    
    test("should return 400 for invalid color value", async () => {
      const mockDecodedToken = {
        id: "user123",
        email: "test@example.com",
      };
    
      (connectToDatabase as jest.Mock).mockResolvedValue(true);
      (verify as jest.Mock).mockReturnValue(mockDecodedToken);
      (Habit.findOne as jest.Mock).mockResolvedValue(null);
    
      (sanitize as jest.Mock).mockReturnValue({ error: null });
    
      mockReq.body = {
        name: "Test Habit",
        goal: 6,
        color: "#INVALID",
      };
    
      (Habit.create as jest.Mock).mockImplementation(() => {
        const error = new Error();
        error.name = "ValidationError";
        error.message = "`#INVALID` is not a valid enum value for path `color`.";
        throw error;
      });
    
      await createHabit(mockReq as Request, mockRes as Response);
    
      expect(Habit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Habit",
          goal: 6,
          color: "#INVALID",
        })
      );
    
      expect(responseHandler).toHaveBeenCalledWith(
        mockRes,
        400,
        "`#INVALID` is not a valid enum value for path `color`."
      );
    });

    test("should return 400 for goal being greater than 7", async () => {
      const mockDecodedToken = {
        id: "user123",
        email: "test@example.com",
      };
    
      (connectToDatabase as jest.Mock).mockResolvedValue(true);
      (verify as jest.Mock).mockReturnValue(mockDecodedToken);
      (Habit.findOne as jest.Mock).mockResolvedValue(null);
    
      (sanitize as jest.Mock).mockReturnValue({ error: null });
    
      mockReq.body = {
        name: "Test Habit",
        goal: 19,
      };
    
      (Habit.create as jest.Mock).mockImplementation(() => {
        const error = new Error();
        error.name = "ValidationError";
        error.message = "Goal should be less than or equal to 7";
        throw error;
      });
    
      await createHabit(mockReq as Request, mockRes as Response);
    
      expect(Habit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Habit",
          goal: 19,
        })
      );
    
      expect(responseHandler).toHaveBeenCalledWith(
        mockRes,
        400,
        "Goal should be less than or equal to 7"
      );
    });
    
  });
});
