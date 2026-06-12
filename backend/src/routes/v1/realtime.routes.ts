import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate.js";

export const realtimeRouter = Router();

realtimeRouter.get("/realtime/rooms/:fileId", (req, res) => {
  res.json({
    data: {
      roomId: `room_${req.params.fileId}`,
      layer: "websocket-ready",
      presence: [
        { name: "Maya", cursor: { x: 320, y: 140 } },
        { name: "Dev", cursor: { x: 520, y: 300 } }
      ],
      metrics: { users: 2, latencyMs: 24, updatesPerMinute: 18 }
    }
  });
});

realtimeRouter.post(
  "/realtime/rooms/:fileId/updates",
  validateBody(z.object({ update: z.unknown(), clientId: z.string().min(1) })),
  (req, res) => {
    res.status(202).json({
      data: {
        fileId: req.params.fileId,
        clientId: req.body.clientId,
        status: "accepted",
        compacted: false
      }
    });
  }
);

realtimeRouter.get("/realtime/metrics", (_req, res) => {
  res.json({ data: { rooms: 3, connectedUsers: 8, p95LatencyMs: 41, disconnectsLastHour: 0 } });
});
