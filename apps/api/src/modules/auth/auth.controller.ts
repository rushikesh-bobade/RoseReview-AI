import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service";
import { RegisterSchema, LoginSchema } from "./auth.schemas";
import { successResponse, errorResponse } from "../../infrastructure/api-response";

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const input = RegisterSchema.parse(request.body);
    
    try {
      const user = await authService.register(input);
      const token = await reply.jwtSign({ id: user.id, email: user.email, name: user.name });

      reply.setCookie("rosereview_token", token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return reply.send(successResponse({ user, token }, "Registration successful", undefined, request.id));
    } catch (error: any) {
      if (error.message === "User already exists with this email") {
        return reply.status(409).send(errorResponse("CONFLICT", error.message, null, request.id));
      }
      throw error;
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const input = LoginSchema.parse(request.body);

    try {
      const user = await authService.login(input);
      const token = await reply.jwtSign({ id: user.id, email: user.email, name: user.name });

      reply.setCookie("rosereview_token", token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return reply.send(successResponse({ user, token }, "Login successful", undefined, request.id));
    } catch (error: any) {
      return reply.status(401).send(errorResponse("UNAUTHORIZED", error.message, null, request.id));
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("rosereview_token", { path: "/" });
    return reply.send(successResponse(null, "Logged out successfully", undefined, request.id));
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = await authService.getUserById(request.user.id);
    if (!user) {
      return reply.status(404).send(errorResponse("NOT_FOUND", "User not found", null, request.id));
    }
    return reply.send(successResponse(user, "User profile retrieved", undefined, request.id));
  }
}

export const authController = new AuthController();
