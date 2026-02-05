import Joi from "joi";

// ✅ Validation Schemas
const schemas = {
  // Quest Join Validation
  joinQuest: Joi.object({
    questId: Joi.string()
      .alphanum()
      .min(10) // At least 10 characters
      .max(50) // Max 50 characters
      .required()
      .messages({
        "string.alphanum": "Invalid questId format",
        "any.required": "questId is required",
      }),
    secretCode: Joi.string()
      .allow("") // ✅ Allow empty string for public quests
      .length(6)
      .pattern(/^[A-Z0-9]{6}$/)
      .optional()
      .messages({
        "string.length": "Secret code must be exactly 6 characters",
        "string.pattern.base":
          "Secret code must contain only uppercase letters and numbers",
      }),
  }),

  // Quest Leave Validation
  leaveQuest: Joi.object({
    questId: Joi.string().alphanum().min(10).max(50).required(),
  }),

  // Finalize Quest Validation
  finalizeQuest: Joi.object({
    questId: Joi.string().alphanum().min(10).max(50).required(),
    photoURL: Joi.string().max(1000).optional().allow(""),
  }),

  // Vibe Check Validation
  submitVibeCheck: Joi.object({
    questId: Joi.string().alphanum().min(10).max(50).required(),
    reviews: Joi.object()
      .pattern(
        Joi.string(), // User ID key
        Joi.array()
          .items(
            Joi.string().valid(
              "leader",
              "storyteller",
              "funny",
              "listener",
              "teamplayer",
              "intellectual",
            ),
          )
          .max(6), // Max 6 tags per user
      )
      .max(20) // Max 20 users reviewed at once
      .required(),
    genderMismatchReports: Joi.array()
      .items(Joi.string().alphanum().min(10).max(50))
      .max(20)
      .optional(),
  }),

  // Avatar Config Validation
  avatarConfig: Joi.object({
    avatarConfig: Joi.object({
      backgroundColor: Joi.string().max(50),
      skinColor: Joi.string().max(50),
      hairColor: Joi.string().max(50),
      hairType: Joi.string().max(50),
      facialHair: Joi.string().max(50),
      clothes: Joi.string().max(50),
      eyes: Joi.string().max(50),
      eyebrows: Joi.string().max(50),
      mouth: Joi.string().max(50),
      accessories: Joi.array().items(Joi.string().max(50)).max(10),
      // Allow unknown keys but limit to prevent pollution
    })
      .max(20) // Max 20 properties
      .required(),
  }),
};

// ✅ Validation Middleware Factory
export const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      console.error(`⚠️ [Validation] Schema "${schemaName}" not found`);
      return next();
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields (security)
    });

    if (error) {
      console.warn(`❌ [Validation] ${schemaName} failed:`, error.details);
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    // Replace req.body with validated & sanitized data
    req.validatedData = value;
    next();
  };
};
