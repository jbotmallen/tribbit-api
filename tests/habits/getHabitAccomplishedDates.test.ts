import { getHabitAccomplishedDates } from "../../controllers/habit.controllers";
import { connectToDatabase } from "../../utils/db";
import { Habit } from "../../models/habit.models";
import { responseHandler, genericError } from "../../utils/response-handlers";
import { getHabitAllAccomplishedStatuses } from "../../controllers/accomplished.controllers";

jest.mock("../../utils/db", () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock("../../utils/response-handlers", () => ({
  responseHandler: jest.fn(),
  genericError: jest.fn(),
}));

jest.mock("../../models/habit.models", () => ({
  Habit: {
    findById: jest.fn(),
  },
}));

jest.mock("../../controllers/accomplished.controllers", () => ({
  getHabitAllAccomplishedStatuses: jest.fn(),
}));

describe("getHabitAccomplishedDates", () => {
  let mockReq: any;  
  let mockRes: any;  

  beforeEach(() => {
    mockReq = {
      params: { id: "habitId" },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("should return 400 if id is missing", async () => {
    mockReq.params.id = undefined;

    await getHabitAccomplishedDates(mockReq, mockRes);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      400,
      "Please provide all required fields"
    );
  });

  test("should return 204 if habit not found", async () => {
    (Habit.findById as jest.Mock).mockResolvedValue(null);

    await getHabitAccomplishedDates(mockReq, mockRes);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      204,
      "Habit not found"
    );
  });

  test("should return 204 if no accomplished dates found", async () => {
    const habitMock = { _id: "habitId" };
    (Habit.findById as jest.Mock).mockResolvedValue(habitMock);
    (getHabitAllAccomplishedStatuses as jest.Mock).mockResolvedValue([]);

    await getHabitAccomplishedDates(mockReq, mockRes);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      204,
      "No accomplished dates found",
      { habit: habitMock, accomplished: [], streak: { currentStreak: 0, streakDates: [] } }
    );
  });

  test("should return 200 if accomplished dates are found", async () => {
    const habitMock = { _id: "habitId", name: "Habit 1" };
    const accomplishedMock = [
      { date_changed: "2024-12-15T00:00:00Z" },
      { date_changed: "2024-12-16T00:00:00Z" },
    ];
    (Habit.findById as jest.Mock).mockResolvedValue(habitMock);
    (getHabitAllAccomplishedStatuses as jest.Mock).mockResolvedValue(accomplishedMock);
  
    await getHabitAccomplishedDates(mockReq, mockRes);
  
    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      200,
      "Accomplished dates retrieved successfully",
      expect.objectContaining({
        habit: habitMock,
        accomplished: accomplishedMock,
        streak: expect.objectContaining({
          currentStreak: expect.any(Number),
          currentStreakDates: expect.any(Array), 
        }),
      })
    );
  });
  
  test("should handle errors gracefully", async () => {
    (connectToDatabase as jest.Mock).mockRejectedValue(new Error("Database connection error"));

    await getHabitAccomplishedDates(mockReq, mockRes);

    expect(genericError).toHaveBeenCalledWith(mockRes, expect.any(Error));
  });
});
