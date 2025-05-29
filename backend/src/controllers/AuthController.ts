import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import asyncHandler from '../middleware/async'; // Will need async.ts
import AuthService from '../services/AuthService';
import ErrorResponse from '../utils/errorResponse'; // Already *.ts
import { CustomRequest } from '../middleware/auth'; // For req.user if needed, not for logout directly
import { IUser } from '../models/User'; // Import the IUser interface
// User model might not be directly needed here if AuthService handles all User interactions
// import User from '../models/User'; // Will need User.ts

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
  public register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Input validation (already defined in routes, but can be double-checked or more specific here)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // To make errors more specific to the frontend (e.g. field-specific errors)
      const errorMessages = errors.array().map((err: ValidationError) => ({ 
        field: typeof err === 'object' && 'path' in err ? err.path : 'unknown', 
        message: err.msg 
      }));
      return next(new ErrorResponse(`Validation failed: ${errorMessages.map(e=>e.message).join(', ')}`, 400));
    }

  const { name, email, password, username } = req.body;

    try {
      // Generate a username if not provided
      const usernameToUse = username || email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      const userData = { 
        name, 
        email, 
        password, 
        username: usernameToUse 
      };
      
      const user = await this.authService.registerUser(userData, req);
      
      // Return the user without sending a token (email verification required)
      res.status(201).json({
      success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          message: 'Registration successful. Please check your email to verify your account.'
        }
    });
    } catch (error) {
      // AuthService methods should throw ErrorResponse instances on failure
      next(error);
  }
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
  public login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      // Consider a helper for formatting validation errors
      return next(new ErrorResponse('Validation failed', 400));
  }

  const { email, password } = req.body;

    try {
      // AuthService.loginUser will now handle sending the response
      await this.authService.loginUser({ email, password }, res); 
      // No explicit res.status().json() here as service handles it
    } catch (error) {
      next(error);
    }
});

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
  // @access  Private (though can be public depending on how client handles token)
  public logout = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.logoutUser(res); // Service handles setting the cookie
      res.status(200).json({ success: true, data: 'Successfully logged out' });
    } catch (error) {
      next(error);
    }
});

// @desc    Get current logged in user (profile)
// @route   GET /api/v1/auth/profile
// @access  Private
  public getProfile = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized, user data unavailable', 401));
  }
    try {
      const userProfile = await this.authService.getAuthenticatedUserProfile(req.user.id);
  res.status(200).json({
    success: true,
        data: userProfile
      });
    } catch (error) {
      next(error);
    }
});

  // @desc    Update user profile details
  // @route   PUT /api/v1/auth/me 
// @access  Private
  public updateProfile = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }

    // Extract allowed fields from req.body
    const { name, email, username, profileImage, biography, preferences } = req.body;
    const updateData: Partial<Pick<IUser, 'name' | 'email' | 'username' | 'profileImage' | 'biography' | 'preferences'>> = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (profileImage !== undefined) updateData.profileImage = profileImage; // Assuming URL or simple string
    if (biography !== undefined) updateData.biography = biography;
    if (preferences !== undefined) updateData.preferences = preferences;

    // Basic validation: ensure at least one field is being updated if needed, or allow empty updates
    if (Object.keys(updateData).length === 0) {
      return next(new ErrorResponse('No update data provided', 400));
    }

    try {
      const updatedUser = await this.authService.updateUserProfile(req.user.id, updateData);
  res.status(200).json({
    success: true,
        data: updatedUser
  });
    } catch (error) {
      next(error);
    }
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
  public updatePassword = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized, user data unavailable', 401));
    }

    const { currentPassword, newPassword } = req.body;
    // Add validation for currentPassword and newPassword presence & strength in express-validator if desired

    try {
      const updatedUser = await this.authService.updateUserPassword(req.user.id, currentPassword, newPassword);
      // Send new token as password change should invalidate old sessions (implicitly by re-issuing token)
      this.authService.sendTokenResponse(updatedUser, 200, res);
    } catch (error) {
      next(error);
    }
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
  public forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    // Add express-validator check for email in routes if not already present

    try {
      const successMessage = await this.authService.forgotPassword(email, req);
      res.status(200).json({ success: true, data: successMessage });
    } catch (error) {
      next(error);
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
  public resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { resettoken } = req.params;
    const { password } = req.body;
    // Add express-validator checks for password in routes

    try {
      const user = await this.authService.resetPassword(resettoken, password);
      this.authService.sendTokenResponse(user, 200, res); // Send new login token
    } catch (error) {
      next(error);
    }
});

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:verificationtoken
// @access  Public
  public verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { verificationtoken } = req.params;

    try {
      const user = await this.authService.verifyUserEmail(verificationtoken);
      // Decide on response: redirect or send token/success message
      // For example, redirect to a frontend page:
      if (process.env.CLIENT_URL) {
        res.redirect(`${process.env.CLIENT_URL}/email-verified?success=true`);
      } else {
        // Fallback if CLIENT_URL is not set, or send token directly
        this.authService.sendTokenResponse(user, 200, res); 
      }
    } catch (error) {
      // Redirect to a failure page or send error response
      if (process.env.CLIENT_URL) {
        // Pass error message or code to client for user-friendly display
        const errorMessage = error instanceof ErrorResponse ? error.message : 'Verification failed';
        res.redirect(`${process.env.CLIENT_URL}/email-verified?success=false&error=${encodeURIComponent(errorMessage)}`);
      } else {
        next(error);
      }
    }
});

// @desc    Resend email verification token
// @route   POST /api/v1/auth/resend-verification
// @access  Public
  public resendVerificationEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
    // Add express-validator check for email in routes if not already present

    try {
      const successMessage = await this.authService.resendVerificationEmail(email, req);
      res.status(200).json({ success: true, data: successMessage });
  } catch (error) {
      next(error);
  }
});

// Get token from model, create cookie and send response
  // This method is now removed as it's handled by AuthService.sendTokenResponse
  /*
  private sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Prepare user object for response
  const userResponse = {
    name: user.name,
    email: user.email,
    xp: user.xp,
    streak: user.currentStreak // Assuming currentStreak is the one to show
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: userResponse
    });
}; 
*/
}

export default AuthController;

// For now, to keep existing route imports working, we export individual methods
// This part will be removed once all methods are part of the class and routes are updated.
/*
const controllerInstance = new AuthController();
export const register = controllerInstance.register;
export const login = controllerInstance.login; // Export the new login method
export const logout = controllerInstance.logout; // Export the new logout method
export const getProfile = controllerInstance.getProfile; // Export the new getProfile method
export const updateProfile = controllerInstance.updateProfile; // Export the new updateProfile method
export const updatePassword = controllerInstance.updatePassword; // Export the new updatePassword method
export const forgotPassword = controllerInstance.forgotPassword; // Export new method
export const resetPassword = controllerInstance.resetPassword; // Export new method
export const verifyEmail = controllerInstance.verifyEmail; // Export new method
export const resendVerificationEmail = controllerInstance.resendVerificationEmail; // Export new method

// Placeholder exports for other functions from the original authController.js
// These will need to be implemented in the AuthController class and then exported like `register`
// or the router will be updated to use `controllerInstance.login`, etc.
export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => { res.status(501).json({success: false, error: 'Not Implemented'})});

// Still need to handle: forgotPassword, resetPassword
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => { res.status(501).json({success: false, error: 'Not Implemented'})});
*/
// sendTokenResponse is now private in AuthService, no need to export from controller 