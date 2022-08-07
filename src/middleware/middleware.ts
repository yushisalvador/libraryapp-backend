import { Request, Response, NextFunction } from "express";
import { User } from "types/types";
require("dotenv").config();
const jwt = require("jsonwebtoken");

declare module "express" {
  export interface Request {
    user: User;
  }
}

const authenticateFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(403);

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err: Object, user: User) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    }
  );
};

module.exports = {
  authenticateFunction,
};
