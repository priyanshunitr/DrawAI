import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate.js";
import { plans, usage } from "../../data/mock-data.js";

export const billingRouter = Router();

billingRouter.get("/billing/plans", (_req, res) => {
  res.json({ data: plans });
});

billingRouter.get("/billing/usage", (_req, res) => {
  res.json({ data: usage });
});

billingRouter.post("/billing/checkout", validateBody(z.object({ plan: z.string().min(1) })), (req, res) => {
  res.json({ data: { checkoutUrl: `https://billing.drawai.local/checkout?plan=${req.body.plan}` } });
});

billingRouter.post("/billing/portal", (_req, res) => {
  res.json({ data: { portalUrl: "https://billing.drawai.local/portal" } });
});

billingRouter.post("/billing/webhooks/stripe", (req, res) => {
  res.json({ received: true, event: req.body?.type ?? "unknown" });
});

billingRouter.get("/admin/audit-events", (_req, res) => {
  res.json({
    data: [
      { action: "file.share", actor: "Maya", target: "Auth architecture", at: "2m ago" },
      { action: "billing.plan_update", actor: "Founder", target: "Team Pro", at: "1h ago" }
    ]
  });
});

billingRouter.get("/admin/reports", (_req, res) => {
  res.json({ data: { members: 12, files: 18, integrations: 6, exports: 86 } });
});
