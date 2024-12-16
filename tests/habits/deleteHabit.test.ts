import { Request, Response, NextFunction } from 'express';
import { deleteHabit } from '../../controllers/habit.controllers';
import { connectToDatabase } from '../../utils/db';
import { responseHandler } from '../../utils/response-handlers';
import { Habit } from '../../models/habit.models';
import { Accomplished } from '../../models/accomplished.models';
import { verify } from 'jsonwebtoken';

jest.mock('../../utils/db');
jest.mock('../../utils/response-handlers');
jest.mock('../../models/habit.models');
jest.mock('../../models/accomplished.models');
jest.mock('jsonwebtoken');

describe('Habit Controllers - deleteHabit', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        mockReq = {
            body: {},
            cookies: {},
            headers: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();

        jest.clearAllMocks();
    });

    test('should return an error if no ID is provided', async () => {
        mockReq.body = {};

        await deleteHabit(mockReq as Request, mockRes as Response);

        expect(connectToDatabase).toHaveBeenCalled();
        expect(responseHandler).toHaveBeenCalledWith(
            mockRes,
            400,
            'Please provide all required fields'
        );
    });

    test('should delete the habit and its accomplishments successfully', async () => {
        mockReq.body = { id: 'habit123' };
        (Habit.findByIdAndDelete as jest.Mock).mockResolvedValue(true);
        (Accomplished.deleteMany as jest.Mock).mockResolvedValue(true);

        await deleteHabit(mockReq as Request, mockRes as Response);

        expect(connectToDatabase).toHaveBeenCalled();
        expect(Habit.findByIdAndDelete).toHaveBeenCalledWith('habit123');
        expect(Accomplished.deleteMany).toHaveBeenCalledWith({ habit_id: 'habit123' });
        expect(responseHandler).toHaveBeenCalledWith(
            mockRes,
            200,
            'Habit deleted successfully'
        );
    });

    test('should return an error if habit is not found', async () => {
        mockReq.body = { id: 'habit123' };
        (Habit.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

        await deleteHabit(mockReq as Request, mockRes as Response);

        expect(connectToDatabase).toHaveBeenCalled();
        expect(Habit.findByIdAndDelete).toHaveBeenCalledWith('habit123');
        expect(responseHandler).toHaveBeenCalledWith(
            mockRes,
            404,
            'Habit not found'
        );
    });
});
