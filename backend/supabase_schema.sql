-- Supabase SQL Schema for Synthetic Customers

-- 1. Studies Table
CREATE TABLE studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name TEXT NOT NULL,
    product_idea TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    cohort_size INT NOT NULL,
    mcq_form JSONB,
    mcq_answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Personas Table
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INT NOT NULL,
    occupation TEXT NOT NULL,
    location TEXT NOT NULL,
    income_bracket TEXT NOT NULL,
    tech_savviness INT NOT NULL,
    communication_style TEXT NOT NULL,
    current_solution TEXT NOT NULL,
    relationship_with_money TEXT NOT NULL,
    biggest_professional_frustration TEXT NOT NULL,
    awareness_of_problem TEXT NOT NULL,
    trust_style TEXT NOT NULL,
    dealbreaker TEXT NOT NULL,
    ocean_profile JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for querying personas by study
CREATE INDEX idx_personas_study_id ON personas(study_id);

-- 3. Feedback Table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    likelihood_to_buy INT NOT NULL,
    price_reaction TEXT NOT NULL,
    would_try_free_trial BOOLEAN NOT NULL,
    overall_statement TEXT NOT NULL,
    features_should_have TEXT[] NOT NULL,
    features_should_not_have TEXT[] NOT NULL,
    top_objections JSONB NOT NULL,
    awareness_shift TEXT NOT NULL,
    mcq_transcript JSONB,
    likelihood_updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for querying feedback by study or persona
CREATE INDEX idx_feedback_study_id ON feedback(study_id);
CREATE INDEX idx_feedback_persona_id ON feedback(persona_id);

-- 4. Persona Conversations Table
CREATE TABLE persona_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    turn_number INT NOT NULL,
    likelihood_update INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for querying conversations
CREATE INDEX idx_persona_conversations_study_id ON persona_conversations(study_id);
CREATE INDEX idx_persona_conversations_persona_id ON persona_conversations(persona_id);

-- 5. Synthesis Table
CREATE TABLE synthesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE UNIQUE,
    objection_clusters JSONB NOT NULL,
    positive_signals JSONB NOT NULL,
    surprising_outliers JSONB NOT NULL,
    critical_risk TEXT NOT NULL,
    executive_summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure RLS is enabled for security (optional depending on frontend, but good practice)
-- If the backend is using the service_role key, it bypasses RLS anyway.
-- ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE synthesis ENABLE ROW LEVEL SECURITY;
