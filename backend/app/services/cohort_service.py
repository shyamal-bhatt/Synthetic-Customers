# Backwards compatible re-export of CohortService
# Decoupled cohort service modules are located under app/services/cohort/

from app.services.cohort import CohortService

__all__ = ["CohortService"]
