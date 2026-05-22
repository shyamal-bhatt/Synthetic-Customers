import re
from typing import List, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

class StudyInitializeRequest(BaseModel):
    """
    Schema representing the incoming configuration parameters for initializing a study framework.
    Uses camelCase field aliases to match frontend payloads while allowing standard snake_case python access.
    """
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
    label: str = Field(..., min_length=1, description="Option text")


class MCQQuestion(BaseModel):
    """
    Representing a single generated clarifying question from Gemini.
    """
    id: str = Field(..., description="Unique question identifier (q1, q2, q3, q4, q5)")
    dimension: str = Field(..., description="The dimension of user research (e.g. pricing_tolerance)")
    question: str = Field(..., min_length=5, description="The generated question text")
    options: List[MCQOption] = Field(..., description="The 4 options available for the question")

    @field_validator("options")
    @classmethod
    def validate_options_structure(cls, v: List[MCQOption]) -> List[MCQOption]:
        """
        Ensure there are exactly 4 options labeled a, b, c, d with no duplicates.
        """
        if len(v) != 4:
            raise ValueError("Each question must contain exactly 4 options")
        option_ids = [opt.id for opt in v]
        if set(option_ids) != {"a", "b", "c", "d"}:
            raise ValueError("Options must be labeled exactly a, b, c, d")
        return v


class StudyMCQSchema(BaseModel):
    """
    Representing the container for exactly 5 generated MCQ questions.
    """
    questions: List[MCQQuestion] = Field(..., description="A list of exactly 5 generated questions")

    @field_validator("questions")
    @classmethod
    def validate_questions_list(cls, v: List[MCQQuestion]) -> List[MCQQuestion]:
        """
        Ensure there are exactly 5 questions representing the 5 mandatory dimensions in order.
        """
        if len(v) != 5:
            raise ValueError("The form must contain exactly 5 clarifying questions")
            
        expected_dimensions = [
            "pricing_tolerance",
            "problem_urgency",
            "current_behaviour",
            "purchase_trigger",
            "biggest_hesitation"
        ]
        
        for idx, dim in enumerate(expected_dimensions):
            if idx >= len(v):
                raise ValueError(f"Missing question for dimension '{dim}'")
            if v[idx].dimension != dim:
                raise ValueError(f"Question {idx + 1} must cover dimension '{dim}' in exact order. Received '{v[idx].dimension}'")
                
        return v


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
