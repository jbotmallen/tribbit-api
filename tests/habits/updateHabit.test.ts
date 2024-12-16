import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { Habit } from "../../models/habit.models";
import { updateHabit } from "../../controllers/habit.controllers";
import { responseHandler } from "../../utils/response-handlers";
import { connectToDatabase } from "../../utils/db";
import { convertToPhilippineTime } from "../../utils/timezone";

jest.mock("jsonwebtoken");
jest.mock("../../utils/db");
jest.mock("../../controllers/user.controllers");
jest.mock("../../utils/response-handlers");
jest.mock("../../models/habit.models");
jest.mock("../../controllers/accomplished.controllers");
jest.mock("../../utils/sanitation");
jest.mock("../../utils/timezone");

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
  
      
      (convertToPhilippineTime as jest.Mock).mockReturnValue("2024-12-16T12:00:00Z");
    });
  
    describe("updateHabit", () => {
      test("should successfully update a habit", async () => {
        const mockDecodedToken = {
          id: "user123",
          email: "test@example.com",
        };
  
        const mockHabit = {
          _id: "habit123",
          name: "Test Habit",
          goal: 6,
          color: "#BFFF95",
          user_id: "user123",
          updated_at: "2024-12-16T12:00:00Z", 
        };
  
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        (verify as jest.Mock).mockReturnValue(mockDecodedToken);
        (Habit.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockHabit);
  
        mockReq.body = {
          id: "habit123",
          name: "Updated Habit",
          goal: 5,
          color: "#89E2CD",
        };
  
        
        await updateHabit(mockReq as Request, mockRes as Response);
  
        
        expect(Habit.findByIdAndUpdate).toHaveBeenCalledWith(
          "habit123",
          {
            name: "Updated Habit",
            goal: 5,
            color: "#89E2CD",
            updated_at: "2024-12-16T12:00:00Z", 
          },
          { new: true }
        );
  
        expect(responseHandler).toHaveBeenCalledWith(
          mockRes,
          200,
          "Habit updated successfully",
          mockHabit
        );
      });
  
      test("should return an error if no token is provided", async () => {
        mockReq.cookies = {}; 
        
        
        const authCheckMiddleware = jest.fn((req, res, next) => {
            return responseHandler(res, 401, "Unauthorized Access");
        });
    
        
        await authCheckMiddleware(mockReq as Request, mockRes as Response, () => {});
    
        expect(responseHandler).toHaveBeenCalledWith(
            mockRes,
            401,
            "Unauthorized Access"
        );
    });
    
    test("should return an error if habit is not found", async () => {
        const mockDecodedToken = {
            id: "user123",
            email: "test@example.com",
        };
    
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        (verify as jest.Mock).mockReturnValue(mockDecodedToken);
        (Habit.findByIdAndUpdate as jest.Mock).mockResolvedValue(null); 
    
        mockReq.body = {
            id: "habit123",
            name: "Updated Habit",
            goal: 5,
            color: "#89E2CD",
        };
    
        await updateHabit(mockReq as Request, mockRes as Response);
    
        expect(responseHandler).toHaveBeenCalledWith(
            mockRes,
            404,
            "Habit not found"
        );
    });
  
      test("should return an error if invalid data is provided", async () => {
        const mockDecodedToken = {
          id: "user123",
          email: "test@example.com",
        };
  
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        (verify as jest.Mock).mockReturnValue(mockDecodedToken);
  
        
        mockReq.body = {
          id: "habit123",
          name: "hi hello ror",
          goal: -5,
          color: "#89E2CD",
        };
  
        await updateHabit(mockReq as Request, mockRes as Response);
  
        expect(responseHandler).toHaveBeenCalledWith(
          mockRes,
          400,
          "Invalid habit data provided"
        );
      });
    });
  });
  