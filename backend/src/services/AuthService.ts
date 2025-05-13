import crypto from 'crypto';
import User, { IUser } from '../models/User'; // Assuming IUser has the updated streak and aiUsage
import ErrorResponse from '../utils/errorResponse';
import sendEmailUtil from '../utils/sendEmail'; // Will need sendEmail.ts
import { Request, Response } from 'express'; // For req.protocol and req.get('host'), and res for sendTokenResponse
import { NotFoundError } from '../utils/customErrors'; // For consistency, use customErrors if user not found

class AuthService {
  public sendTokenResponse(user: IUser, statusCode: number, res: Response) {
    const token = user.getSignedJwtToken();

    const options: any = {
      expires: new Date(
        Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE || '30', 10) * 24 * 60 * 60 * 1000)
      ),
      httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    // Prepare user object for response, excluding sensitive info
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      xp: user.xp,
      level: user.level,
      currentStreak: user.currentStreak,
      profileImage: user.profileImage
      // Add other non-sensitive fields as needed
    };

    res
      .status(statusCode)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: userResponse
      });
  }

  public async registerUser(
    userData: Pick<IUser, 'name' | 'email' | 'password' | 'username'>,
    req: Request // Pass request object for constructing verification URL
  ): Promise<string> { // Returns a success message
    const { name, email, password, username } = userData;

    // Check if user already exists (more robust check)
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ErrorResponse('User with this email already exists', 400);
      }
      if (existingUser.username === username) {
        throw new ErrorResponse('Username is already taken', 400);
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      username
    });

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken(); // This method should be on the User model
    await user.save({ validateBeforeSave: false }); // validateBeforeSave: false because we are only saving the token

    // Create verification url
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;

    const message = `You are receiving this email because you need to confirm your email address. Please click the link below to verify your email:\n\n${verificationUrl}`;

    try {
      await sendEmailUtil({
        email: user.email,
        subject: 'Email Verification',
        message
      });

      return 'Registration successful. Please check your email to verify your account.';
    } catch (err: any) {
      console.error('[AuthService Register] Email sending error:', err);
      // Clean up token fields if send fails, so user can try to register again or request new token
      user.emailVerificationToken = undefined;
      user.emailVerificationTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });

      // It's important to let the controller know this specific part failed.
      // The controller can then decide to inform the user appropriately.
      throw new ErrorResponse('Email could not be sent. Please try registering again or contact support if the issue persists.', 500);
    }
  }

  public async loginUser(
    loginData: Pick<IUser, 'email' | 'password'>,
    res: Response // Pass express response to send token
  ): Promise<void> { // Returns void as it sends the response directly
    const { email, password } = loginData;

    if (!email || !password) {
      throw new ErrorResponse('Please provide an email and password', 400);
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new ErrorResponse('Invalid credentials (user not found)', 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new ErrorResponse('Invalid credentials (password mismatch)', 401);
    }

    if (!user.emailVerified) {
      throw new ErrorResponse(
        'Please verify your email address to login. You can request a new verification link if needed.',
        403 // Forbidden
      );
    }

    // Update streak & activity
    user.updateStreak();
    user.addActivity('login', 'User logged in', 1);
    user.xp += 1; // Direct XP or handled by addActivity if preferred
    user.calculateLevel(); // Recalculate level after XP change
    await user.save();

    this.sendTokenResponse(user, 200, res);
  }

  public async logoutUser(res: Response): Promise<void> {
    // Note: JWTs are stateless. True logout involves client-side token deletion.
    // This clears the httpOnly cookie if one was set.
    // For more robust logout (e.g., token blacklisting), a more complex solution is needed.
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000), // Expire quickly
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    // No user data to send back, just success
    // The client should then clear any local storage of the token/user data.
    // res.status(200).json({ success: true, data: {} }); // Service doesn't send response for this one directly
  }

  public async getAuthenticatedUserProfile(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationTokenExpire')
      .populate({ path: 'badges.badge', select: 'name description icon rarity' }) // Keep badge population
      .lean(); // Using lean as it is for profile display, not direct update here

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Ensure IUser on the backend now has streak: { current, max, lastUsed } and aiUsage: { summaryUsed, flashcardUsed, lastReset }
    // The toObject() or lean() should include these as per schema.
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      xp: user.xp,
      level: user.level,
      streak: user.streak, // NEW - should be the object { current, max, lastUsed }
      aiUsage: user.aiUsage, // NEW - should be the object { summaryUsed, flashcardUsed, lastReset }
      profileImage: user.profileImage,
      biography: user.biography,
      preferences: user.preferences,
      badges: user.badges, 
      activity: user.activity ? user.activity.slice(0, 10) : [], // Ensure activity is not null
      subjects: user.subjects,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified
      // Ensure any other fields returned are consistent with frontend UserProfile type
    };
  }

  public async updateUserProfile(
    userId: string,
    updateData: Partial<Pick<IUser, 'name' | 'email' | 'username' | 'profileImage' | 'biography' | 'preferences'>>
  ): Promise<Partial<IUser>> {
    const { name, email, username, profileImage, biography, preferences } = updateData;

    const user = await User.findById(userId);
    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    // Check for email uniqueness if email is being changed
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ErrorResponse('Email is already taken', 400);
      }
      user.email = email;
      // If email is changed, it might be good practice to re-verify it.
      // For now, we'll update it directly. Consider adding re-verification logic.
      // user.emailVerified = false; 
      // user.getEmailVerificationToken(); // and send new verification email
    }

    // Check for username uniqueness if username is being changed
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new ErrorResponse('Username is already taken', 400);
      }
      user.username = username;
    }

    if (name) user.name = name;
    if (profileImage) user.profileImage = profileImage; // Handle file upload separately if it's not just a URL
    if (biography !== undefined) user.biography = biography; // Allow empty string
    if (preferences) {
      if (preferences.darkMode !== undefined) user.preferences.darkMode = preferences.darkMode;
      if (preferences.emailNotifications !== undefined) user.preferences.emailNotifications = preferences.emailNotifications;
    }

    await user.save();

    // Fetch the full user again to return the complete and correct profile structure
    const updatedUser = await User.findById(user._id)
                            .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationTokenExpire')
                            .populate({ path: 'badges.badge', select: 'name description icon rarity' })
                            .lean();
    if (!updatedUser) {
        throw new NotFoundError('Updated user not found after profile update');
    }
    
    return {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      xp: updatedUser.xp,
      level: updatedUser.level,
      streak: updatedUser.streak,
      aiUsage: updatedUser.aiUsage,
      profileImage: updatedUser.profileImage,
      biography: updatedUser.biography,
      preferences: updatedUser.preferences,
      badges: updatedUser.badges,
      activity: updatedUser.activity ? updatedUser.activity.slice(0, 10) : [],
      subjects: updatedUser.subjects,
      createdAt: updatedUser.createdAt,
      emailVerified: updatedUser.emailVerified
    };
  }

  public async updateUserPassword(
    userId: string,
    currentPasswordInput: string,
    newPasswordInput: string
  ): Promise<IUser> { // Returns the full user object for sendTokenResponse
    if (!currentPasswordInput || !newPasswordInput) {
      throw new ErrorResponse('Please provide current and new passwords', 400);
    }

    if (newPasswordInput.length < 6) {
        throw new ErrorResponse('New password must be at least 6 characters', 400);
    }

    const user = await User.findById(userId).select('+password'); // Need to select password to match
    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    const isMatch = await user.matchPassword(currentPasswordInput);
    if (!isMatch) {
      throw new ErrorResponse('Incorrect current password', 401);
    }

    user.password = newPasswordInput; // The pre-save hook in User.ts will hash it
    await user.save();
    
    // Don't .select('-password') here, as the original password field is already not selected by default for queries
    // and the sendTokenResponse function will pick the fields it needs.
    // We need the full user object (with methods) for getSignedJwtToken.
    return user; 
  }

  public async forgotPassword(emailInput: string, req: Request): Promise<string> { // Returns success message
    if (!emailInput) {
      throw new ErrorResponse('Please provide an email', 400);
    }
    const user = await User.findOne({ email: emailInput });

    if (!user) {
      // Important: Do not reveal if a user exists or not for security reasons.
      // Send a generic success message even if user is not found.
      // console.warn(`[AuthService] Forgot password attempt for non-existent email: ${emailInput}`);
      return 'If an account with that email exists, a password reset link has been sent.';
    }

    const resetToken = user.getResetPasswordToken(); // Method on User model
    await user.save({ validateBeforeSave: false }); // Saving token fields

    // Create reset url (ensure base URL is correct for your frontend)
    const resetUrl = `${process.env.CLIENT_URL || req.protocol + '://' + req.get('host')}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process within ten minutes of receiving it:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;

    try {
      await sendEmailUtil({
        email: user.email,
        subject: 'Password Reset Request',
        message
      });
      return 'If an account with that email exists, a password reset link has been sent.';
    } catch (err: any) {
      console.error('[AuthService ForgotPassword] Email sending error:', err);
      // Clear tokens if email sending failed to allow user to try again
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      throw new ErrorResponse('Email could not be sent. Please try again.', 500);
    }
  }

  public async resetPassword(
    resetTokenInput: string,
    newPasswordInput: string
  ): Promise<IUser> { // Returns full user for sendTokenResponse
    if (!resetTokenInput || !newPasswordInput) {
      throw new ErrorResponse('Please provide a reset token and a new password', 400);
    }
    if (newPasswordInput.length < 6) {
      throw new ErrorResponse('New password must be at least 6 characters', 400);
    }

    // Get hashed token (tokens are stored hashed in DB)
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetTokenInput)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() } // Check if token is not expired
    }).select('+password'); // Select password to allow matchPassword if needed, though not strictly for reset

    if (!user) {
      throw new ErrorResponse('Invalid or expired reset token', 400);
    }

    // Set new password
    user.password = newPasswordInput; // Pre-save hook will hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Potentially mark email as verified again if it wasn't, though forgot password implies user had access to email
    // user.emailVerified = true; 
    await user.save();

    return user; // Return user for sendTokenResponse
  }

  public async verifyUserEmail(verificationTokenInput: string): Promise<IUser> { // Returns user for potential token response
    if (!verificationTokenInput) {
      throw new ErrorResponse('Verification token is required', 400);
    }

    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationTokenInput)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationTokenExpire: { $gt: Date.now() } // Check expiry
    });

    if (!user) {
      throw new ErrorResponse('Invalid or expired email verification token', 400);
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpire = undefined;
    
    // Award XP for email verification if not already awarded or handled elsewhere
    if (!user.activity.some(act => act.action === 'earn_xp' && act.description === 'Email verified')) {
        user.xp += 20; // Example XP amount
        user.addActivity('earn_xp', 'Email verified', 20);
        user.calculateLevel();
    }
    
    await user.save();
    return user;
  }

  public async resendVerificationEmail(emailInput: string, req: Request): Promise<string> { // Returns success message
    if (!emailInput) {
      throw new ErrorResponse('Please provide an email', 400);
    }
    const user = await User.findOne({ email: emailInput });

    if (!user) {
      // To prevent user enumeration, send a generic success message.
      return 'If your email is registered and not yet verified, a new verification link has been sent.';
    }

    if (user.emailVerified) {
      throw new ErrorResponse('This email is already verified.', 400);
    }

    // Generate new verification token
    const verificationToken = user.getEmailVerificationToken(); // Method on User model
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;
    const message = `You requested a new email verification link. Please click the link below to verify your email:\n\n${verificationUrl}`;

    try {
      await sendEmailUtil({
        email: user.email,
        subject: 'Email Verification (New Link)',
        message
      });
      return 'If your email is registered and not yet verified, a new verification link has been sent.';
    } catch (err: any) {
      console.error('[AuthService ResendVerification] Email sending error:', err);
      // Optionally clear tokens if sending failed, to allow user to try again cleanly
      user.emailVerificationToken = undefined;
      user.emailVerificationTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      throw new ErrorResponse('Email could not be sent at this time. Please try again later.', 500);
    }
  }

  // Placeholder for other auth methods (login, logout, etc.)
}

export default AuthService; 