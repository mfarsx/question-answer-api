const sendJwtToClient = (user, res) => {
  const token = user.generateJwtFromUser();
  const { JWT_COOKIE, NODE_ENV } = process.env;
  const cookieExpireInMinutes = Number(JWT_COOKIE) || 60;

  return res
    .status(200)
    .cookie("access_token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + cookieExpireInMinutes * 1000 * 60),
      secure: NODE_ENV === "production",
      sameSite: "lax",
    })
    .json({
      success: true,
      access_token: token,
      data: {
        name: user.name,
        email: user.email,
      },
    });
};

const getAccessTokenFromCookie = (req) => {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").reduce((acc, currentValue) => {
    const [key, ...valueParts] = currentValue.trim().split("=");

    if (!key) {
      return acc;
    }

    acc[key] = valueParts.join("=");
    return acc;
  }, {});

  return cookies.access_token || null;
};

const isTokenIncluded = (req) => {
  return Boolean(getAccessTokenFromHeader(req) || getAccessTokenFromCookie(req));
};

const getAccessTokenFromHeader = (req) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return null;
  }

  return auth.split(" ")[1];
};

const getAccessToken = (req) => {
  return getAccessTokenFromHeader(req) || getAccessTokenFromCookie(req);
};

module.exports = {
  sendJwtToClient,
  isTokenIncluded,
  getAccessTokenFromHeader,
  getAccessTokenFromCookie,
  getAccessToken,
};
