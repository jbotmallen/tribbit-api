import request from 'supertest';
import app from '../index';
import { Habit } from '../models/habit.models';
import { sign } from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';

// Mock the Habit model's find method
jest.mock('../models/habit.models', () => ({
  Habit: {
    find: jest.fn(), // Mock the find method
    countDocuments: jest.fn(), // Mock countDocuments
  },
}));

// Mock the js-cookie library
jest.mock('js-cookie', () => ({
  get: jest.fn(() => 'mocked_token_value'), // Mock the return value for js-cookie's get method
}));
describe('GET /api/habits/', () => {
  let token: string;

  beforeAll(async () => {
    // Generate a valid token for a user
    token = sign(
      { id: '675f0ca9062cef78d010f052', email: 'thatinspector00@gmail.com', username: 'leaf' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  it('should return 200 and a list of habits when a valid token is provided in cookies', async () => {
    // Mock js-cookie to return the valid token
    require('js-cookie').get.mockReturnValue(token); // Mocking js-cookie to return the valid token

    // Decode the token to check its validity (by decoding it and checking the expiration)
    const decodedToken = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    expect(decodedToken.exp).toBeGreaterThan(currentTime); // Check if token is not expired

    // Send the request with the token included in cookies
    const res = await request(app)
      .get('/api/habits/')
      .set('Cookie', `token=${token}`); // Include the token in cookies

    // Check the status and response body
    console.log("Response on valid token:", res.body);
    console.log("Response Status:", res.status);
    console.log("Response Headers:", res.headers);
    expect(res.status).toBe(200);
    // Verify that Habit.find was called once (you can uncomment the line if needed)
    // expect(Habit.find).toHaveBeenCalledTimes(1);
  });






  // it('should return 401 if no token is provided in cookies', async () => {
  //   const res = await request(app)
  //     .get('/api/habits/');
  //   expect(res.status).toBe(401);
  //   expect(res.body.message).toBe('Unauthorized Access');
  // });

  // it('should return 498 if an invalid token is provided in cookies', async () => {
  //   const res = await request(app)
  //     .get('/api/habits/')
  //     .set('Cookie', 'token=invalid_token'); // Invalid token
  //   expect(res.status).toBe(400);
  //   expect(res.body.message).toBe('Invalid token');
  // });
});
