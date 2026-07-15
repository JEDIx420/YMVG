import { z } from "zod";

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || null);

export const registrationRequestSchema = z.object({
  full_name: z.string().trim().min(2).max(150),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().min(5).max(30),
  club_id: z.string().uuid(),
  member_imis_id: optionalTrimmed(100),
  address: optionalTrimmed(500),
  city: optionalTrimmed(120),
  state: optionalTrimmed(120),
  country: optionalTrimmed(120),
  education: optionalTrimmed(250),
  job_title: optionalTrimmed(150),
}).strict();

export const registrationReviewSchema = z.object({
  request_id: z.string().uuid(),
  requested_action: z.enum(["approve", "reject"]),
  rejection_reason: z.string().trim().max(1000).nullable().optional(),
  corrected_club_id: z.string().uuid().nullable().optional(),
}).strict().superRefine((value, context) => {
  if (value.requested_action === "reject" && !value.rejection_reason) {
    context.addIssue({
      code: "custom",
      path: ["rejection_reason"],
      message: "A rejection reason is required.",
    });
  }
});
