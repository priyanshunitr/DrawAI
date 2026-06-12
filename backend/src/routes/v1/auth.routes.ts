import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate.js";

export const authRouter = Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional()
});

authRouter.post("/auth/sign-in", validateBody(authSchema), (req, res) => {
  res.json({
    data: {
      user: { id: "user_founder", email: req.body.email, name: req.body.name ?? "Founder" },
      session: { token: "dev-session-token", expiresIn: 3600 }
    }
  });
});

authRouter.post("/auth/sign-up", validateBody(authSchema), (req, res) => {
  res.status(201).json({
    data: {
      user: { id: "user_new", email: req.body.email, name: req.body.name ?? "New member" },
      workspaceId: "ws_drawai"
    }
  });
});

authRouter.post(
  "/auth/forgot-password",
  validateBody(z.object({ email: z.string().email() })),
  (req, res) => {
    res.json({ data: { email: req.body.email, status: "reset_link_queued" } });
  }
);

authRouter.post(
  "/auth/invites/accept",
  validateBody(z.object({ token: z.string().min(4), email: z.string().email() })),
  (req, res) => {
    res.json({ data: { token: req.body.token, email: req.body.email, status: "accepted" } });
  }
);

authRouter.post(
  "/auth/team-switch",
  validateBody(z.object({ workspaceSlug: z.string().min(1), role: z.string().min(1) })),
  (req, res) => {
    res.json({ data: { workspaceSlug: req.body.workspaceSlug, role: req.body.role, status: "active" } });
  }
);

authRouter.get("/auth/oauth/:provider/start", (req, res) => {
  res.json({ data: { provider: req.params.provider, redirectUrl: `/api/v1/auth/oauth/${req.params.provider}/callback` } });
});

authRouter.get("/auth/saml/metadata", (_req, res) => {
  res.type("application/xml").send("<EntityDescriptor entityID=\"drawai-dev\" />");
});

authRouter.post("/auth/scim/users", (req, res) => {
  res.status(201).json({ data: { status: "provisioned", payload: req.body } });
});
