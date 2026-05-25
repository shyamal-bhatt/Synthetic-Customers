import re
from typing import List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict, field_validator

class StudyInitializeRequest(BaseModel):
    """
    Schema representing the incoming configuration parameters for initializing a study framework.
    Uses camelCase field aliases to match frontend payloads while allowing standard snake_case python access.
    """
    project_name: str = Field(
        ...,
        alias="projectName",
        description="The project name to identify the study in the UI"
    )
    product_idea: str = Field(
        ..., 
        alias="productIdea",
        description="The product idea description and problem statement"
    )
    target_audience: str = Field(
        ..., 
        alias="targetAudience",
        description="The description of the target audience and market demographics"
    )
    cohort_size: int = Field(
        ..., 
        alias="cohortSize", 
        ge=5, 
        le=200, 
        description="The requested size of the synthetic cohort persona group (between 5 and 200)"
    )

    @field_validator("project_name", mode="before")
    @classmethod
    def clean_project_name(cls, v: Any) -> str:
        if not isinstance(v, str):
            raise ValueError("Project name must be a string")
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Project name cannot be empty")
        return cleaned

    @field_validator("product_idea", "target_audience", mode="before")
    @classmethod
    def clean_and_validate_strings(cls, v: Any) -> str:
        """
        Hop 1: Clean and pre-validate user inputs.
        Strips whitespace and ensures it is a non-empty string.
        This runs BEFORE other validation checks.
        """
        if not isinstance(v, str):
            raise ValueError("Value must be a string")
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Value cannot be empty or only whitespace")
        return cleaned

    @field_validator("product_idea")
    @classmethod
    def validate_product_idea_sanity(cls, v: str) -> str:
        """
        Content sanity and length validations on clean product idea.
        """
        if len(v) < 10:
            raise ValueError("Product idea description must be at least 10 characters long to build a high-fidelity cohort")
        if len(v) > 1500:
            raise ValueError("Product idea description must not exceed 1500 characters")
        
        # Prevent completely random character sequences (e.g. "asdfasdf" or ".....")
        # Check if there is at least one alphabetical word of length 2 or more.
        words = re.findall(r'\b[a-zA-Z]{2,}\b', v)
        if not words:
            raise ValueError("Product idea must contain real descriptive English words")
            
        return v

    @field_validator("target_audience")
    @classmethod
    def validate_target_audience_sanity(cls, v: str) -> str:
        """
        Content sanity and length validations on clean target audience description.
        """
        if len(v) < 5:
            raise ValueError("Target audience description must be at least 5 characters long")
        if len(v) > 500:
            raise ValueError("Target audience description must not exceed 500 characters")
            
        words = re.findall(r'\b[a-zA-Z]{2,}\b', v)
        if not words:
            raise ValueError("Target audience must contain real descriptive English words")
            
        return v

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "projectName": "Smart Grocery App",
                "productIdea": "An AI app that builds a weekly grocery list from a photo of your fridge",
                "targetAudience": "Busy professionals aged 25-45 who want to eat healthier",
                "cohortSize": 20
            }
        }
    )


class MCQOption(BaseModel):
    """
    Representing a single option in a dynamic clarifying question.
    """
    id: str = Field(..., description="Unique option identifier (must be a, b, c, or d)")
    label: str = Field(..., description="Option text")


class MCQQuestion(BaseModel):
    """
    Representing a single generated clarifying question from Gemini.
    """
    id: str = Field(..., description="Unique question identifier (q1, q2, q3, q4, q5)")
    dimension: str = Field(..., description="The dimension of user research (e.g. pricing_tolerance)")
    question: str = Field(..., min_length=5, description="The generated question text")
    options: List[MCQOption] = Field(..., description="The options available for the question")

    @field_validator("options")
    @classmethod
    def validate_options_structure(cls, v: List[MCQOption]) -> List[MCQOption]:
        """
        Ensure there are exactly 4 or 5 options.
        """
        if len(v) < 4 or len(v) > 5:
            raise ValueError("Each question must contain 4 or 5 options")
        return v


class StudyMCQSchema(BaseModel):
    """
    Representing the container for generated MCQ questions.
    """
    questions: List[MCQQuestion] = Field(..., description="A list of generated questions")



class StudyInitializeResponse(BaseModel):
    """
    Schema representing the structured confirmation response returned to the frontend.
    Now includes the generated MCQ clarifying form.
    """
    status: str = Field(..., description="The overall operational status (e.g. 'success')")
    message: str = Field(..., description="Detailed message indicating processing details")
    study_id: str = Field(..., description="Unique generated study transaction ID (UUID)")
    config: StudyInitializeRequest = Field(..., description="Echo of the validated study configuration")
    mcq_form: StudyMCQSchema = Field(..., alias="mcqForm", description="The 5 dynamically generated multiple choice questions")

    model_config = ConfigDict(
        populate_by_name=True
    )


class StudyCohortGenerateRequest(BaseModel):
    """
    Schema representing the cohort generation request, taking the initial configuration,
    the generated MCQ form, and the researcher's chosen answers.
    """
    study_id: str = Field(None, alias="studyId")
    project_name: str = Field(..., alias="projectName")
    product_idea: str = Field(..., alias="productIdea")
    target_audience: str = Field(..., alias="targetAudience")
    cohort_size: int = Field(..., alias="cohortSize", ge=5, le=200)
    mcq_answers: Dict[str, str] = Field(..., alias="mcqAnswers")
    mcq_form: StudyMCQSchema = Field(..., alias="mcqForm")

    model_config = ConfigDict(
        populate_by_name=True
    )


class OceanProfileSchema(BaseModel):
    openness: int = Field(..., ge=1, le=10)
    conscientiousness: int = Field(..., ge=1, le=10)
    extraversion: int = Field(..., ge=1, le=10)
    agreeableness: int = Field(..., ge=1, le=10)
    neuroticism: int = Field(..., ge=1, le=10)
    profile_summary: str = Field(..., alias="profileSummary")

    model_config = ConfigDict(
        populate_by_name=True
    )


class PersonaSchema(BaseModel):
    id: str
    name: str
    age: int
    occupation: str
    location: str
    income_bracket: str = Field(..., alias="incomeBracket")
    tech_savviness: int = Field(..., alias="techSavviness", ge=1, le=5)
    communication_style: str = Field(..., alias="communicationStyle")
    current_solution: str = Field(..., alias="currentSolution")
    relationship_with_money: str = Field(..., alias="relationshipWithMoney")
    biggest_professional_frustration: str = Field(..., alias="biggestProfessionalFrustration")
    awareness_of_problem: str = Field(..., alias="awarenessOfProblem")
    trust_style: str = Field(..., alias="trustStyle")
    dealbreaker: str
    ocean_profile: OceanProfileSchema = Field(..., alias="oceanProfile")

    model_config = ConfigDict(
        populate_by_name=True
    )


class ObjectionSchema(BaseModel):
    objection: str
    severity: str
    would_overcome_if: str = Field(..., alias="wouldOvercomeIf")

    model_config = ConfigDict(
        populate_by_name=True
    )


class MCQTranscriptItem(BaseModel):
    question: str
    options: List[str]
    selected_option: str = Field(..., alias="selectedOption")
    persona_response: str = Field(..., alias="personaResponse")

    model_config = ConfigDict(
        populate_by_name=True
    )


class PersonaFeedbackSchema(BaseModel):
    persona_id: str = Field(..., alias="personaId")
    likelihood_to_buy: int = Field(..., alias="likelihoodToBuy", ge=1, le=5)
    price_reaction: str = Field(..., alias="priceReaction")
    would_try_free_trial: bool = Field(..., alias="wouldTryFreeTrial")
    overall_statement: str = Field(..., alias="overallStatement")
    mcq_transcript: List[MCQTranscriptItem] = Field(default_factory=list, alias="mcqTranscript")
    features_should_have: List[str] = Field(..., alias="featuresShouldHave")
    features_should_not_have: List[str] = Field(..., alias="featuresShouldNotHave")
    top_objections: List[ObjectionSchema] = Field(..., alias="topObjections")
    awareness_shift: str = Field(..., alias="awarenessShift")

    model_config = ConfigDict(
        populate_by_name=True
    )


class ObjectionClusterSchema(BaseModel):
    theme: str
    frequency: int
    persona_ids: List[str] = Field(..., alias="personaIds")
    summary: str

    model_config = ConfigDict(
        populate_by_name=True
    )


class PositiveSignalSchema(BaseModel):
    signal: str
    persona_ids: List[str] = Field(..., alias="personaIds")
    evidence: str

    model_config = ConfigDict(
        populate_by_name=True
    )


class SurprisingOutlierSchema(BaseModel):
    persona_id: str = Field(..., alias="personaId")
    expected_behaviour: str = Field(..., alias="expectedBehaviour")
    actual_behaviour: str = Field(..., alias="actualBehaviour")
    implication: str

    model_config = ConfigDict(
        populate_by_name=True
    )


class FidelityDimensionSchema(BaseModel):
    score: int = Field(..., ge=0, le=100)
    evidence: str
    model_config = ConfigDict(extra="allow")

class FidelityAssessmentDimensionsSchema(BaseModel):
    score_variance: FidelityDimensionSchema = Field(..., alias="scoreVariance")
    profile_coherence: FidelityDimensionSchema = Field(..., alias="profileCoherence")
    objection_diversity: FidelityDimensionSchema = Field(..., alias="objectionDiversity")
    ocean_alignment: FidelityDimensionSchema = Field(..., alias="oceanAlignment")
    persona_distinctiveness: FidelityDimensionSchema = Field(..., alias="personaDistinctiveness")

    model_config = ConfigDict(populate_by_name=True, extra="allow")

class FidelityAssessmentSchema(BaseModel):
    dimensions: FidelityAssessmentDimensionsSchema
    final_score: int = Field(..., alias="finalScore", ge=0, le=100)
    label: str
    primary_weakness: str = Field(..., alias="primaryWeakness")
    improvement_note: str = Field(..., alias="improvementNote")

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class SynthesisSchema(BaseModel):
    objection_clusters: List[ObjectionClusterSchema] = Field(..., alias="objectionClusters")
    positive_signals: List[PositiveSignalSchema] = Field(..., alias="positiveSignals")
    surprising_outliers: List[SurprisingOutlierSchema] = Field(..., alias="surprisingOutliers")
    critical_risk: str = Field(..., alias="criticalRisk")
    executive_summary: str = Field(..., alias="executiveSummary")
    fidelity: FidelityAssessmentSchema = Field(None, description="Fidelity assessment results")

    model_config = ConfigDict(
        populate_by_name=True
    )


class StudyCohortGenerateResponse(BaseModel):
    status: str
    study_id: str = Field(..., alias="studyId")
    personas: List[PersonaSchema]
    feedback: List[PersonaFeedbackSchema]
    synthesis: SynthesisSchema

    model_config = ConfigDict(
        populate_by_name=True
    )


class StudyPersonasGenerateResponse(BaseModel):
    status: str
    study_id: str = Field(..., alias="studyId")
    personas: List[PersonaSchema]

    model_config = ConfigDict(
        populate_by_name=True
    )


class StudyFeedbackGenerateRequest(BaseModel):
    study_id: str = Field(None, alias="studyId")
    project_name: str = Field(..., alias="projectName")
    product_idea: str = Field(..., alias="productIdea")
    target_audience: str = Field(..., alias="targetAudience")
    mcq_answers: Dict[str, str] = Field(..., alias="mcqAnswers")
    mcq_form: StudyMCQSchema = Field(..., alias="mcqForm")
    personas: List[PersonaSchema]

    model_config = ConfigDict(
        populate_by_name=True
    )


class StudyFeedbackGenerateResponse(BaseModel):
    status: str
    feedback: List[PersonaFeedbackSchema]
    synthesis: SynthesisSchema

    model_config = ConfigDict(
        populate_by_name=True
    )


class TargetAudienceGenerateRequest(BaseModel):
    project_name: str = Field(..., alias="projectName")
    product_idea: str = Field(..., alias="productIdea")

    model_config = ConfigDict(
        populate_by_name=True
    )


class TargetAudienceGenerateResponse(BaseModel):
    status: str
    target_audience: str = Field(..., alias="targetAudience")

    model_config = ConfigDict(
        populate_by_name=True
    )

