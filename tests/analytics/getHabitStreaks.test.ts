import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { Habit } from "../../models/habit.models";
import { getHabitStreaks } from "../../controllers/streaks.controllers";
import { connectToDatabase } from "../../utils/db";
import { responseHandler, genericError } from "../../utils/response-handlers";
import { getHabitBestStreak, getHabitCurrentStreak } from "../../controllers/streaks.controllers"; // Assuming these are utility functions
import {getHabitAllAccomplishedStatuses} from "../../controllers/accomplished.controllers"

jest.mock("jsonwebtoken");
jest.mock("../../utils/db");
jest.mock("../../models/habit.models");
jest.mock("../../utils/response-handlers");
jest.mock("../../controllers/accomplished.controllers")
jest.mock("../../controllers/streaks.controllers")
jest.mock("../../controllers/streaks.controllers")
describe("Streaks Controller - getHabitStreaks", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";

    mockReq = {
      params: { id: "habit123" },
      cookies: { token: "validToken" },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should return habit streaks successfully with start and end dates for streaks", async () => {
    const mockDecodedToken = { id: "user123", email: "test@example.com" };

    (verify as jest.Mock).mockReturnValue(mockDecodedToken);
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (Habit.findById as jest.Mock).mockResolvedValue({
      _id: "habit123",
      name: "Test Habit",
    });

    // Mocking the streak calculation logic with start and end dates
    const mockBestStreak = {
      bestStreak: 10,
      bestStreakDates: ["2024-01-01", "2024-01-10"], // Start and end dates for the best streak
    };
    const mockCurrentStreak = {
      currentStreak: 5,
      currentStreakDates: ["2024-01-02", "2024-01-06"], // Start and end dates for the current streak
    };
    const mockAccomplishedStatuses = [
      { date_changed: "2024-01-01", accomplished: true },
      { date_changed: "2024-01-02", accomplished: true },
      { date_changed: "2024-01-03", accomplished: false },
      { date_changed: "2024-01-04", accomplished: true },
      { date_changed: "2024-01-05", accomplished: true },
      { date_changed: "2024-01-06", accomplished: true },
    ];

    (getHabitBestStreak as jest.Mock).mockReturnValue(mockBestStreak);
    (getHabitCurrentStreak as jest.Mock).mockReturnValue(mockCurrentStreak);
    (getHabitAllAccomplishedStatuses as jest.Mock).mockResolvedValue(mockAccomplishedStatuses);

    // Call the controller method
    await getHabitStreaks(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      200,
      "Streaks retrieved successfully",
      expect.objectContaining({
        bestStreak: 10,
        bestStreakDates: ["2024-01-01", "2024-01-10"], // Start and end date for best streak
        currentStreak: 5,
        currentStreakDates: ["2024-01-02", "2024-01-06"], // Start and end date for current streak
      })
    );
  });

//   test("should return 401 if token is missing", async () => {
//     mockReq.cookies = {}; // No token

//     await getHabitStreaks(mockReq as Request, mockRes as Response);

//     expect(responseHandler).toHaveBeenCalledWith(
//       mockRes,
//       401,
//       "Unauthorized Access"
//     );
//   });

//   test("should return 404 if habit is not found", async () => {
//     const mockDecodedToken = { id: "user123", email: "test@example.com" };

//     (verify as jest.Mock).mockReturnValue(mockDecodedToken);
//     (connectToDatabase as jest.Mock).mockResolvedValue(true);
//     (Habit.findById as jest.Mock).mockResolvedValue(null); // Habit not found

//     await getHabitStreaks(mockReq as Request, mockRes as Response);

//     expect(responseHandler).toHaveBeenCalledWith(mockRes, 204, "Habit not found");
//   });

//   test("should handle errors correctly", async () => {
//     const mockDecodedToken = { id: "user123", email: "test@example.com" };

//     (verify as jest.Mock).mockReturnValue(mockDecodedToken);
//     (connectToDatabase as jest.Mock).mockResolvedValue(true);
//     (Habit.findById as jest.Mock).mockRejectedValue(new Error("DB Error"));

//     await getHabitStreaks(mockReq as Request, mockRes as Response);

//     expect(genericError).toHaveBeenCalledWith(mockRes, expect.any(Error));
//   });
});
