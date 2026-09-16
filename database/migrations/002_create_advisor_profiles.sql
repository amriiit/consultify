CREATE TABLE advisor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    domain VARCHAR(30) NOT NULL
        CHECK (domain IN ('FINANCE', 'HEALTH', 'ASTROLOGY')),

    bio TEXT NOT NULL,

    specialization VARCHAR(150) NOT NULL,

    experience_years INTEGER NOT NULL
        CHECK (experience_years >= 0),

    consultation_fee NUMERIC(10,2) NOT NULL
        CHECK (consultation_fee >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);