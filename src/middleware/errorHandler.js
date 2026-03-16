function notFound(req, res, next) {
  res.status(404).json({
    status: "error",
    message: `Endpoint '${req.originalUrl}' tidak ditemukan`,
  });
}

function errorHandler(err, req, res, next) {
  console.error("[Unhandled Error]", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
}

module.exports = { notFound, errorHandler };
