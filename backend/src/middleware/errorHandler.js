export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error via errorHandler";

  res.status(statusCode).json({
    success: false,
    message: err.message,
  });
};
export const notFound = (req, res, next) => {
  const error = new Error("Route not found");
  error.statusCode = 404;
  next(error);
};
