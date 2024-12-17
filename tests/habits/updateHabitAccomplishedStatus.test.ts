import { updateHabitAccomplishedStatus } from "../../controllers/habit.controllers";
import { connectToDatabase } from "../../utils/db";
import { Habit } from "../../models/habit.models";
import { Accomplished } from "../../models/accomplished.models";
import { responseHandler, genericError } from "../../utils/response-handlers";
import { startOfToday } from "date-fns";
import { Request, Response } from "express";

jest.mock("../../utils/db", () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock("../../models/habit.models", () => ({
  Habit: {
    findById: jest.fn(),
  },
}));

jest.mock("../../models/accomplished.models", () => ({
  Accomplished: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../utils/response-handlers", () => ({
  responseHandler: jest.fn(),
  genericError: jest.fn(),
}));

describe("updateHabitAccomplishedStatus", () => {
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

    await updateHabitAccomplishedStatus(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      400,
      "Please provide all required fields"
    );
  });

  test("should return 204 if habit not found", async () => {
    (Habit.findById as jest.Mock).mockResolvedValue(null);

    await updateHabitAccomplishedStatus(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      204,
      "Habit not found"
    );
  });

  test("should return 204 if accomplished status not found", async () => {
    const habitMock = { _id: "habitId" };
    (Habit.findById as jest.Mock).mockResolvedValue(habitMock);
    (Accomplished.findOne as jest.Mock).mockResolvedValue(null);
    (Accomplished.create as jest.Mock).mockResolvedValue({ habit_id: "habitId", accomplished: true });

    await updateHabitAccomplishedStatus(mockReq as Request, mockRes as Response);

    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      204,
      "Accomplished status not found"
    );
  });

  test("should return 200 if accomplished status is updated successfully", async () => {
    const habitMock = { _id: "habitId", name: "Habit 1" };
    const accomplishedMock = { habit_id: "habitId", accomplished: true, save: jest.fn() };
    (Habit.findById as jest.Mock).mockResolvedValue(habitMock);
    (Accomplished.findOne as jest.Mock).mockResolvedValue(accomplishedMock);

    await updateHabitAccomplishedStatus(mockReq as Request, mockRes as Response);

    expect(accomplishedMock.save).toHaveBeenCalled();
    expect(responseHandler).toHaveBeenCalledWith(
      mockRes,
      200,
      "Accomplished status updated successfully",
      accomplishedMock
    );
  });

  test("should handle errors gracefully", async () => {
    (connectToDatabase as jest.Mock).mockRejectedValue(new Error("Database connection error"));

    await updateHabitAccomplishedStatus(mockReq as Request, mockRes as Response);

    expect(genericError).toHaveBeenCalledWith(mockRes, expect.any(Error));
  });
});
