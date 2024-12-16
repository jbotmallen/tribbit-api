import supertest from "supertest";
import app from "../index";
import { User } from "../models/user.models";
import { connectToDatabase } from "../utils/db";
import { sendMail } from "../utils/mail";
import http from "http";
import mongoose from "mongoose";

let server: http.Server;

jest.mock("../utils/mail", () => ({
  sendMail: jest.fn(),
}));

beforeAll(async () => {
  await connectToDatabase();
  await User.deleteMany({});

  server = app.listen(8081, () => {
    console.log('Test server running on port 8081');
  });
});

describe("POST /api/auth/register", () => {
  describe("given an identifier and password", () => {
    test("should register a user and send verification email", async () => {
      const userData = {
        email: "testuser1@gmail.com",
        username: "testuser1",
        password: "TestPassword123!",
      };

      const response = await supertest(app).post("/api/auth/register").send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Check email for verification.");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("email", userData.email);
      expect(response.body.data).toHaveProperty("username", userData.username);

      const expectedVerificationLink = "verify-email";
      expect(sendMail).toHaveBeenCalledWith(
        userData.email,
        "Email Verification",
        expect.stringContaining(expectedVerificationLink)
      );
    });


    test("should return 400 for invalid email (Joi validation)", async () => {
      const response = await supertest(app).post("/api/auth/register").send({
        email: "invalid-email",
        username: "userr",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid email format");
    });


    test("should return 400 for invalid username (Joi validation)", async () => {
      const response = await supertest(app).post("/api/auth/register").send({
        email: "email@gmail.com",
        username: "ur",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Username must be at least 3 characters long");
    });
    test("should return 400 if email or username already exists", async () => {
      const response = await supertest(app).post("/api/auth/register").send({
        email: "cassielex17@gmail.com",
        username: "testuser1",
        password: "AnotherPassword123!",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User with that email or username already exists");
    });

    test("should return 400 if required fields are missing", async () => {
      const response = await supertest(app).post("/api/auth/register").send({
        email: "testuser@gmail.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Please provide all required fields");
    });

  })
})


describe("POST /api/auth/login", () => {
  describe("given an identifier and password", () => {
    test("should return 400 if identifier or password is missing", async () => {
      const userData = {
        "identifier": "leaf"
      };

      const response = await supertest(app).post("/api/auth/login").send({ identifier: userData.identifier });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Please provide all required fields");
    });

    test("should return 404 if user is not found", async () => {
      const response = await supertest(app).post("/api/auth/login").send({ identifier: "invalid@gmail.com", password: "invalid123" });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    test("should return 400 if password is incorrect", async () => {
      const response = await supertest(app).post("/api/auth/login").send({ identifier: "testuser1@gmail.com", password: "invalid123" });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid credentials");
    });

    test("should return 403 if email is not verified", async () => {
      const response = await supertest(app)
        .post("/api/auth/login")
        .send({
          identifier: "testuser1@gmail.com",
          password: "TestPassword123!",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Email not verified. Check your email.");
    });

    test("should return 200 for valid credentials", async () => {
      await User.updateOne({ email: "testuser1@gmail.com" }, { verified: true });
      const response = await supertest(app)
        .post("/api/auth/login")
        .send({
          identifier: "testuser1@gmail.com",
          password: "TestPassword123!",
        });

      expect(response.status).toBe(200);
      const possibleMessages = ["OTP sent to email.", "OTP already sent. Check your email."];
      expect(possibleMessages).toContain(response.body.message);
      expect(response.body.data).toHaveProperty("email");
    });
  })
})


// describe("POST /api/auth/verify-otp", () => {
//   test("should verify OTP successfully", async () => {
//     (Otp.findOne as jest.Mock).mockResolvedValue({ email: "testuser@gmail.com", otp: "123456" });
//     (User.updateOne as jest.Mock).mockResolvedValue({ acknowledged: true });

//       const response = await supertest(app)
//           .post("/api/auth/verify-otp")
//           .send({ email: "testuser@gmail.com", otp: "123456" });

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe("OTP verified. Email verified successfully.");
//   });

//   test("should return 400 for invalid OTP", async () => {
//     (Otp.findOne as jest.Mock).mockResolvedValue({ email: "testuser@gmail.com", otp: "654321" });

//       const response = await supertest(app)
//           .post("/api/auth/verify-otp")
//           .send({ email: "testuser@gmail.com", otp: "123456" });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toBe("Invalid OTP");
//   });

//   test("should return 400 if OTP is not found", async () => {
//     (Otp.findOne as jest.Mock).mockResolvedValue(null);

//       const response = await supertest(app)
//           .post("/api/auth/verify-otp")
//           .send({ email: "testuser@gmail.com", otp: "123456" });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toBe("Invalid OTP");
//   });
// });

// describe("POST /api/auth/verify-email", () => {
//   test("should verify email successfully", async () => {
//       (jwt.verify as jest.Mock).mockReturnValue({ id: "user-id" });
//       (User.findById as jest.Mock).mockResolvedValue({ isVerified: false, save: jest.fn() });

//       const response = await supertest(app)
//           .post("/api/auth/verify-email")
//           .send({ token: "mock-token" });

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe("Email verified successfully");
//   });

//   test("should return 400 for expired token", async () => {
//     (jwt.verify as jest.Mock).mockImplementation(() => {
//           throw new Error("Token expired");
//       });

//       const response = await supertest(app)
//           .post("/api/auth/verify-email")
//           .send({ token: "mock-token" });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toBe("Invalid or expired token");
//   });
// });

// describe("POST /api/auth/verify-token", () => {
//   test("should validate token successfully", async () => {
//       (jwt.verify as jest.Mock).mockReturnValue({ id: "user-id" });

//       const response = await supertest(app)
//           .post("/api/auth/verify-token")
//           .send({ token: "mock-token" });

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe("Token is valid");
//   });

//   test("should return 400 for invalid token", async () => {
//     (jwt.verify as jest.Mock).mockImplementation(() => {
//           throw new Error("Invalid token");
//       });

//       const response = await supertest(app)
//           .post("/api/auth/verify-token")
//           .send({ token: "mock-token" });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toBe("Invalid or expired token");
//   });
// });

afterAll(async () => {
  await mongoose.connection.close();
  await jest.restoreAllMocks();

  // Wrap server.close in a promise
  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      console.log("Test server stopped");
      resolve(undefined);
    });
  });
});
