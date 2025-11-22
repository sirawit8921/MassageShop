const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, telephone, email, password, role } = req.body;

    if (!name || !telephone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, telephone, email, and password",
      });
    }

    // Create User
    const user = await User.create({
      name,
      telephone,
      email,
      password,
      role,
    });

    // Send token in response
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
    console.log(err);

    console.log(err.stack);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, msg: "Please provide an email and password" });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, msg: "Invalid credentials" });
    }

    // Create Token
    // const token=user.getSignedJwtToken();
    //res.status(200).json({success:true,token})
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      msh: "Sever error while logging in",
    });
  }
};

// @desc    Generate token, set cookie, and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Set cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Secure cookie in production
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  // Send cookie and response
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    //add for frontend ***
    _id: user._id,
    name: user.name,
    email: user.email,
    //end for frontend ***
    token,
  });
};

//@desc Get current Logged in user
//@route POST /api/v1/auth/me
//@access Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Cannot fetch user data",
    });
  }
};

//@desc Log user out / clear cookie
//@route GET/api/v1/auth/logout
//@acces Private
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// @desc    Forgot password (send reset link if email exists)
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // ใช้ method จาก model (จะ hash และ save ใน DB ให้ครบ)
    const resetToken = user.getResetPasswordToken();

    // ต้อง save หลังจากสร้าง token
    await user.save({ validateBeforeSave: false });

    // ส่ง token ดิบไปในอีเมล
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const message = `
      You (or someone else) requested a password reset.
      Please click the link below to reset your password:
      \n\n ${resetUrl} \n\n
      This link will expire in 10 minutes.
    `;

    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message,
    });

    res.status(200).json({
      success: true,
      message: "Reset link sent to email if it exists in our system",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({ success: false, error: "Email could not be sent" });
  }
};


// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    console.log("====== RESET PASSWORD DEBUG ======");
    console.log("Incoming raw token:", req.params.resettoken);

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    console.log("Hashed token:", resetPasswordToken);

    const allUsers = await User.find({}, 'email resetPasswordToken resetPasswordExpire');
    console.log("All tokens in DB:");
    console.table(allUsers.map(u => ({
      email: u.email,
      token: u.resetPasswordToken,
      expire: u.resetPasswordExpire
    })));

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    console.log("Found user:", user ? user.email : null);

    if (!user) {
      console.log("Invalid token or expired.");
      return res.status(400).json({ success: false, msg: "Invalid token" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    console.log("Password reset success for:", user.email);
    return res.status(200).json({ success: true, msg: "Password reset success" });
  } catch (err) {
    console.error("Reset Password Error:", err.message);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};
