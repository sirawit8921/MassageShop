const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, telephone, email, password, role } = req.body;

    // ข้อมูลที่สมัครต้องมีครบ
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

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res
      .status(404)
      .json({ success: false, msg: "There is no user with that email" });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you has requested the reset password.\n\nPlease make a put request to:\n\n${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res
      .status(500)
      .json({ success: false, msg: "Email could not be sent" });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, msg: "Invalid token" });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, msg: "Password reset success" });
};
