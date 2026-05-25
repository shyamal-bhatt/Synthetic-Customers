import json
from typing import List, Dict, Any, Optional
from app.db.supabase import get_supabase
from app.core.logging import get_logger
from app.schemas.study import (
    StudyCohortGenerateRequest,
    PersonaSchema,
    PersonaFeedbackSchema,
    SynthesisSchema
)

logger = get_logger()

class StudyRepository:
    """
    Repository for persisting and fetching study data from Supabase.
    """
    
    @classmethod
    def save_study_config(cls, study_id: str, payload: StudyCohortGenerateRequest) -> None:
        try:
            client = get_supabase()
            data = {
                "id": study_id,
                "project_name": payload.project_name,
                "product_idea": payload.product_idea,
                "target_audience": payload.target_audience,
                "cohort_size": payload.cohort_size,
                "mcq_form": payload.mcq_form.model_dump(by_alias=True) if payload.mcq_form else None,
                "mcq_answers": payload.mcq_answers
            }
            logger.info(f"[DB] Attempting to save study config for study_id={study_id}. Payload keys: {list(data.keys())}")
            response = client.table("studies").upsert(data).execute()
            logger.info(f"[DB] Successfully saved study config for study_id={study_id}. Response: {response.data}")
        except Exception as e:
            logger.error(f"[DB] Error saving study config: {str(e)}", exc_info=True)

    @classmethod
    def save_personas(cls, study_id: str, personas: List[PersonaSchema]) -> None:
        if not personas:
            return
        try:
            client = get_supabase()
            
            # Clear any existing personas for this study ID to ensure idempotency
            try:
                client.table("personas").delete().eq("study_id", study_id).execute()
            except Exception as e:
                logger.warning(f"[DB] Error clearing existing personas: {e}")
                
            data = []
            for p in personas:
                p_dump = p.model_dump(by_alias=True)
                # Map camelCase back to snake_case for the database
                data.append({
                    "id": p_dump["id"],
                    "study_id": study_id,
                    "name": p_dump["name"],
                    "age": p_dump["age"],
                    "occupation": p_dump["occupation"],
                    "location": p_dump["location"],
                    "income_bracket": p_dump["incomeBracket"],
                    "tech_savviness": p_dump["techSavviness"],
                    "communication_style": p_dump["communicationStyle"],
                    "current_solution": p_dump["currentSolution"],
                    "relationship_with_money": p_dump["relationshipWithMoney"],
                    "biggest_professional_frustration": p_dump["biggestProfessionalFrustration"],
                    "awareness_of_problem": p_dump["awarenessOfProblem"],
                    "trust_style": p_dump["trustStyle"],
                    "dealbreaker": p_dump["dealbreaker"],
                    "ocean_profile": p_dump["oceanProfile"]
                })
            logger.info(f"[DB] Attempting to save {len(data)} personas for study_id={study_id}. First persona ID: {data[0]['id']}")
            response = client.table("personas").insert(data).execute()
            logger.info(f"[DB] Successfully saved {len(personas)} personas for study_id={study_id}. Response: {len(response.data)} rows inserted.")
        except Exception as e:
            logger.error(f"[DB] Error saving personas: {str(e)}", exc_info=True)

    @classmethod
    def save_feedback(cls, study_id: str, feedbacks: List[PersonaFeedbackSchema]) -> None:
        if not feedbacks:
            return
        try:
            client = get_supabase()
            
            # Clear any existing feedback for this study ID to ensure idempotency
            try:
                client.table("feedback").delete().eq("study_id", study_id).execute()
            except Exception as e:
                logger.warning(f"[DB] Error clearing existing feedback: {e}")
                
            data = []
            for f in feedbacks:
                f_dump = f.model_dump(by_alias=True)
                top_objs = list(f_dump.get("topObjections", []))
                
                # Embed MCQ transcript as a special hidden item in top_objections
                if f_dump.get("mcqTranscript"):
                    top_objs.append({
                        "objection": "__mcq_transcript",
                        "severity": "low",
                        "wouldOvercomeIf": json.dumps(f_dump["mcqTranscript"])
                    })
                    
                data.append({
                    "study_id": study_id,
                    "persona_id": f_dump["personaId"],
                    "likelihood_to_buy": f_dump["likelihoodToBuy"],
                    "price_reaction": f_dump["priceReaction"],
                    "would_try_free_trial": f_dump["wouldTryFreeTrial"],
                    "overall_statement": f_dump["overallStatement"],
                    "features_should_have": f_dump["featuresShouldHave"],
                    "features_should_not_have": f_dump["featuresShouldNotHave"],
                    "top_objections": top_objs,
                    "awareness_shift": f_dump["awarenessShift"]
                })
            logger.info(f"[DB] Attempting to save {len(data)} feedbacks for study_id={study_id}.")
            response = client.table("feedback").insert(data).execute()
            logger.info(f"[DB] Successfully saved {len(feedbacks)} feedbacks for study_id={study_id}. Response: {len(response.data)} rows inserted.")
        except Exception as e:
            logger.error(f"[DB] Error saving feedback: {str(e)}", exc_info=True)

    @classmethod
    def save_synthesis(cls, study_id: str, synthesis: SynthesisSchema) -> None:
        try:
            client = get_supabase()
            
            # Clear any existing synthesis for this study ID to ensure idempotency
            try:
                client.table("synthesis").delete().eq("study_id", study_id).execute()
            except Exception as e:
                logger.warning(f"[DB] Error clearing existing synthesis: {e}")
                
            s_dump = synthesis.model_dump(by_alias=True)
            data = {
                "study_id": study_id,
                "objection_clusters": s_dump["objectionClusters"],
                "positive_signals": s_dump["positiveSignals"],
                "surprising_outliers": s_dump["surprisingOutliers"],
                "critical_risk": s_dump["criticalRisk"],
                "executive_summary": s_dump["executiveSummary"],
                "fidelity": s_dump.get("fidelity")
            }
            logger.info(f"[DB] Attempting to save synthesis for study_id={study_id}.")
            response = client.table("synthesis").insert(data).execute()
            logger.info(f"[DB] Successfully saved synthesis for study_id={study_id}. Response: {response.data}")
        except Exception as e:
            logger.error(f"[DB] Error saving synthesis: {str(e)}", exc_info=True)

    @classmethod
    def get_studies(cls) -> List[Dict[str, Any]]:
        try:
            client = get_supabase()
            # Fetch studies along with basic existence checks for personas and feedback (or just fetch all if it's small)
            # For simplicity, we just fetch studies, but since the frontend dropdown needs to know if personas/feedback exist,
            # we'll do a quick count or just return the studies with empty arrays, and the frontend will fetch details on click.
            # Actually, to make the dropdown work as-is with hasPersonas/hasFeedback logic, we can just do a join or fetch them.
            # Let's fetch the summary and return it in SavedStudy format.
            response = client.table("studies").select("id, project_name, product_idea, target_audience, cohort_size, created_at").order("created_at", desc=True).execute()
            
            # We also need to know if they have personas/feedback for the badges.
            # For a small app, we can just fetch all personas/feedback study_ids.
            personas_res = client.table("personas").select("study_id").execute()
            feedback_res = client.table("feedback").select("study_id").execute()
            
            p_study_ids = set(row["study_id"] for row in personas_res.data)
            f_study_ids = set(row["study_id"] for row in feedback_res.data)
            
            results = []
            for row in response.data:
                # Convert ISO string to timestamp
                from datetime import datetime
                import dateutil.parser
                try:
                    dt = dateutil.parser.isoparse(row["created_at"])
                    timestamp = int(dt.timestamp() * 1000)
                except:
                    timestamp = 0
                    
                results.append({
                    "studyId": row["id"],
                    "timestamp": timestamp,
                    "config": {
                        "projectName": row.get("project_name", ""),
                        "productIdea": row["product_idea"],
                        "targetAudience": row["target_audience"],
                        "cohortSize": row["cohort_size"]
                    },
                    "personas": [{"id": "dummy"} if row["id"] in p_study_ids else None][:1] if row["id"] in p_study_ids else [], # Just enough to pass .length > 0
                    "feedbacks": [{"personaId": "dummy"} if row["id"] in f_study_ids else None][:1] if row["id"] in f_study_ids else [],
                })
            return results
        except Exception as e:
            logger.error(f"[DB] Error fetching studies: {str(e)}", exc_info=True)
            return []

    @classmethod
    def get_study_details(cls, study_id: str) -> Optional[Dict[str, Any]]:
        try:
            client = get_supabase()
            study_res = client.table("studies").select("*").eq("id", study_id).execute()
            if not study_res.data:
                return None
            
            row = study_res.data[0]
            
            personas_res = client.table("personas").select("*").eq("study_id", study_id).execute()
            feedback_res = client.table("feedback").select("*").eq("study_id", study_id).execute()
            synthesis_res = client.table("synthesis").select("*").eq("study_id", study_id).execute()
            
            from datetime import datetime
            import dateutil.parser
            try:
                dt = dateutil.parser.isoparse(row["created_at"])
                timestamp = int(dt.timestamp() * 1000)
            except:
                timestamp = 0
                
            # Map back to camelCase PersonaSchema
            personas = []
            for p in personas_res.data:
                personas.append({
                    "id": p["id"],
                    "name": p["name"],
                    "age": p["age"],
                    "occupation": p["occupation"],
                    "location": p["location"],
                    "incomeBracket": p["income_bracket"],
                    "techSavviness": p["tech_savviness"],
                    "communicationStyle": p["communication_style"],
                    "currentSolution": p["current_solution"],
                    "relationshipWithMoney": p["relationship_with_money"],
                    "biggestProfessionalFrustration": p["biggest_professional_frustration"],
                    "awarenessOfProblem": p["awareness_of_problem"],
                    "trustStyle": p["trust_style"],
                    "dealbreaker": p["dealbreaker"],
                    "oceanProfile": p["ocean_profile"]
                })
                
            feedbacks = []
            for f in feedback_res.data:
                db_top_objections = f.get("top_objections") or []
                clean_top_objections = []
                mcq_transcript = []
                
                for obj in db_top_objections:
                    if isinstance(obj, dict) and obj.get("objection") == "__mcq_transcript":
                        try:
                            mcq_transcript = json.loads(obj.get("wouldOvercomeIf", "[]"))
                        except Exception:
                            mcq_transcript = []
                    else:
                        clean_top_objections.append(obj)
                        
                feedbacks.append({
                    "personaId": f["persona_id"],
                    "likelihoodToBuy": f["likelihood_to_buy"],
                    "priceReaction": f["price_reaction"],
                    "wouldTryFreeTrial": f["would_try_free_trial"],
                    "overallStatement": f["overall_statement"],
                    "featuresShouldHave": f["features_should_have"],
                    "featuresShouldNotHave": f["features_should_not_have"],
                    "topObjections": clean_top_objections,
                    "awarenessShift": f["awareness_shift"],
                    "mcqTranscript": mcq_transcript
                })
                
            synthesis = None
            if synthesis_res.data:
                s = synthesis_res.data[0]
                synthesis = {
                    "objectionClusters": s["objection_clusters"],
                    "positiveSignals": s["positive_signals"],
                    "surprisingOutliers": s["surprising_outliers"],
                    "criticalRisk": s["critical_risk"],
                    "executiveSummary": s["executive_summary"],
                    "fidelity": s.get("fidelity")
                }
                
            # Full SavedStudy format
            full_study = {
                "studyId": row["id"],
                "timestamp": timestamp,
                "config": {
                    "projectName": row.get("project_name", ""),
                    "productIdea": row["product_idea"],
                    "targetAudience": row["target_audience"],
                    "cohortSize": row["cohort_size"]
                },
                "mcqForm": row["mcq_form"],
                "mcqAnswers": row["mcq_answers"] or {},
                "modelMode": "api", # Default
                "appState": "dashboard",
                "personas": personas,
                "feedbacks": feedbacks,
                "synthesis": synthesis
            }
            
            return full_study
        except Exception as e:
            logger.error(f"[DB] Error fetching study details for {study_id}: {str(e)}", exc_info=True)
            return None

    @classmethod
    def delete_study(cls, study_id: str) -> bool:
        try:
            client = get_supabase()
            # Because of foreign key constraints (ON DELETE CASCADE),
            # deleting the study from 'studies' table should also delete
            # personas, feedback, and synthesis linked to it.
            # If CASCADE is not set, we'd need to delete from child tables first.
            # Let's delete from all tables explicitly to be safe, starting from children.
            try:
                client.table("persona_conversations").delete().eq("study_id", study_id).execute()
            except Exception as e:
                logger.warning(f"[DB] Could not delete persona_conversations (maybe table doesn't exist yet): {e}")

            client.table("synthesis").delete().eq("study_id", study_id).execute()
            client.table("feedback").delete().eq("study_id", study_id).execute()
            client.table("personas").delete().eq("study_id", study_id).execute()
            
            response = client.table("studies").delete().eq("id", study_id).execute()
            logger.info(f"[DB] Successfully deleted study {study_id}.")
            return True
        except Exception as e:
            logger.error(f"[DB] Error deleting study {study_id}: {str(e)}", exc_info=True)
            return False

