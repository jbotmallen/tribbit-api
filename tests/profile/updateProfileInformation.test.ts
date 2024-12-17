import { Request, Response } from 'express';
import { updateProfileInformation } from '../../controllers/user.controllers';
import { User } from '../../models/user.models';
import jwt from 'jsonwebtoken';


jest.mock('../../utils/db', () => ({
  connectToDatabase: jest.fn()
}));

jest.mock('../../models/user.models', () => ({
  User: {
    findOne: jest.fn(),
    save: jest.fn()
  }
}));

describe('Update Profile Information', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    
    jest.clearAllMocks();

    
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      cookies: {},
      body: {}
    };

    mockRes = {
      status: statusMock,
      json: jsonMock
    };

    
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('Validation Checks', () => {
    it('should return 400 if no username is provided', async () => {
      mockReq.cookies = {};
      mockReq.cookies.token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET!);
      mockReq.body = {}; 

      await updateProfileInformation(
        mockReq as Request, 
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Please provide at least one field to update"
        })
      );
    });

    it('should return 401 if no token is present', async () => {
      mockReq.body = { username: 'newusername' }; 
      

      await updateProfileInformation(
        mockReq as Request, 
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unauthorized'
        })
      );
    });

    it('should return 404 if user is not found', async () => {
      
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET!);
      mockReq.cookies = {};
      mockReq.cookies.token = token;
      mockReq.body = { username: 'newusername' };

      
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await updateProfileInformation(
        mockReq as Request, 
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User not found!"
        })
      );
    });
  });

  describe('Username Update Scenarios', () => {
    it('should return 400 if new username is the same as current username', async () => {
      
      const existingUser = {
        username: 'currentuser',
        _id: 'user123',
        save: jest.fn()
      };

      
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET!);
      mockReq.cookies = {};
      mockReq.cookies.token = token;
      mockReq.body = { username: 'currentuser' };

      
      (User.findOne as jest.Mock).mockResolvedValue(existingUser);

      await updateProfileInformation(
        mockReq as Request, 
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Username is the same as the current one"
        })
      );
    });

    it('should return 400 if username already exists', async () => {
      
      const existingUser = {
        username: 'currentuser',
        _id: 'user123',
        save: jest.fn()
      };

      
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET!);
      mockReq.cookies = {};
      mockReq.cookies.token = token;
      mockReq.body = { username: 'newusername' };

      
      
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        
        .mockResolvedValueOnce({ username: 'newusername' });

      await updateProfileInformation(
        mockReq as Request, 
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Username already exists"
        })
      );
    });

    it('should successfully update username', async () => {
      
      const existingUser = {
        username: 'currentuser',
        _id: 'user123',
        save: jest.fn()
      };

      
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET!);
      mockReq.cookies = {};
      mockReq.cookies.token = token;
      mockReq.body = { username: 'newusername' };

      
      
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null);

      await updateProfileInformation(
        mockReq as Request, 
        mockRes as Response
      );

      expect(existingUser.username).toBe('newusername');
      expect(existingUser.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User updated successfully"
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors', async () => {
      
      (User.findOne as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET!);
      mockReq.cookies = {};
      mockReq.cookies.token = token;
      mockReq.body = { username: 'newusername' };

      await updateProfileInformation(
        mockReq as Request, 
        mockRes as Response
      );

      
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});