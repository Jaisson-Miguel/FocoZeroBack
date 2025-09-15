export default (request, response, next) => {
  const token = request.headers.authorization;

  jwt.verify(token, process.env.SECRET_KEY, function (err) {
    if (err) {
      return response.status(401).json({ message: "UNAUTHORIZATION" });
    } else {
      next();
    }
  });
};
