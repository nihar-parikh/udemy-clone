//creating token and saving in cookie

const sendJWTToken = (user, statusCode, message, res) => {
  const token = user.getJWTToken();

  //options for cookie
  //options must be same when sending JWT token
  const options = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000), //15 days
    httpOnly: true,
    secure: true, //don't add in localhost
    sameSite: "none",
  };

  //for response we have cookie while for request we have cookies
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user,
    token,
  });
};

export { sendJWTToken };
