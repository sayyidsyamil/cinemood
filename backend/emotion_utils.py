# emotion_utils.py
import nltk
from transformers import pipeline
import pandas as pd
import logging
import spacy
import numpy as np
from typing import Dict, List, Tuple

logging.basicConfig(level=logging.INFO)

# Load SpaCy model once
try:
    nlp = spacy.load("en_core_web_sm")
    logging.info("SpaCy model 'en_core_web_sm' loaded successfully.")
except OSError:
    logging.error(
        "SpaCy model 'en_core_web_sm' not found. Please run: python -m spacy download en_core_web_sm"
    )
    nlp = None

# Load NLTK sentence tokenizer data
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    logging.info("NLTK 'punkt' not found. Downloading...")
    nltk.download("punkt", quiet=True)
    logging.info("NLTK 'punkt' downloaded.")

# Load emotion classification pipeline once
try:
    emotion_classifier = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        top_k=None,  # Get all scores initially if needed, or top_k=1 for just dominant
        # return_all_scores=False # Deprecated, use top_k=1 instead
    )
    logging.info("Emotion classification model loaded successfully.")
except Exception as e:
    logging.error(f"Failed to load emotion classification model: {e}")
    emotion_classifier = None


def chunk_text_nltk(text: str) -> list[str]:
    """Chunks text into sentences using NLTK."""
    if not text:
        return []
    try:
        sentences = nltk.sent_tokenize(text)
        return [s.strip() for s in sentences if s.strip()]  # Remove empty strings
    except Exception as e:
        logging.error(f"Error during NLTK sentence tokenization: {e}")
        # Fallback: split by newline if NLTK fails
        return [s.strip() for s in text.split("\n") if s.strip()]


def chunk_text_spacy(text: str) -> list[str]:
    """Chunks text into sentences using SpaCy."""
    if not text or not nlp:
        return chunk_text_nltk(
            text
        )  # Fallback to NLTK if SpaCy not loaded or text empty
    try:
        doc = nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
        return sentences
    except Exception as e:
        logging.error(f"Error during SpaCy sentence tokenization: {e}")
        return chunk_text_nltk(text)  # Fallback to NLTK


def classify_emotions(chunks: list[str]) -> pd.DataFrame:
    """
    Classifies the dominant emotion for each text chunk.

    Args:
        chunks: A list of text strings (scenes/sentences).

    Returns:
        A pandas DataFrame with columns: 'Scene', 'Chunk', 'Emotion', 'Score'.
        Returns an empty DataFrame if classification fails or input is empty.
    """
    if not chunks or not emotion_classifier:
        logging.warning(
            "Emotion classification skipped: No chunks or classifier unavailable."
        )
        return pd.DataFrame(columns=["Scene", "Chunk", "Emotion", "Score"])

    results = []
    logging.info(f"Classifying emotions for {len(chunks)} chunks...")
    try:
        # Process chunks in batches if needed (Hugging Face pipeline handles this efficiently)
        # The pipeline can take a list of strings directly
        model_outputs = emotion_classifier(chunks)

        for i, (chunk, output) in enumerate(zip(chunks, model_outputs)):
            # output is potentially a list of dicts [{'label': '...', 'score': ...}, ...]
            # If top_k=None, find the one with the highest score
            # If top_k=1 (or default), the first element is the dominant one
            # Need to handle both possibilities depending on pipeline setup

            if (
                isinstance(output, list) and output
            ):  # Check if it's a list and not empty
                # If top_k=None, find max score emotion
                if len(output) > 1:
                    dominant_emotion = max(output, key=lambda x: x["score"])
                # If top_k=1 (or default), the first element is the dominant one
                else:
                    dominant_emotion = output[0]

                results.append(
                    {
                        "Scene": i + 1,
                        "Chunk": chunk,
                        "Emotion": dominant_emotion["label"],
                        "Score": round(dominant_emotion["score"], 4),
                    }
                )
            else:
                # Handle cases where the classifier might return an unexpected format or empty result
                logging.warning(
                    f"Could not classify emotion for chunk {i+1}: '{chunk[:50]}...'"
                )
                results.append(
                    {"Scene": i + 1, "Chunk": chunk, "Emotion": "unknown", "Score": 0.0}
                )

    except Exception as e:
        logging.error(f"Error during emotion classification pipeline: {e}")
        # Return partial results if any, or an empty DataFrame
        if not results:
            return pd.DataFrame(columns=["Scene", "Chunk", "Emotion", "Score"])

    logging.info("Emotion classification completed.")
    return pd.DataFrame(results)


def get_emotion_totals(analysis_df: pd.DataFrame) -> Dict[str, float]:
    """
    Calculate the total percentage of each emotion across all scenes.

    Args:
        analysis_df: DataFrame containing the emotion analysis results.

    Returns:
        Dictionary with emotions as keys and their total percentages as values.
    """
    if analysis_df.empty:
        return {}

    # Get all unique emotions
    all_emotions = analysis_df["Emotion"].unique()
    total_scenes = len(analysis_df)

    # Calculate percentage for each emotion
    emotion_totals = {}
    for emotion in all_emotions:
        count = len(analysis_df[analysis_df["Emotion"] == emotion])
        percentage = (count / total_scenes) * 100
        emotion_totals[emotion] = round(percentage, 1)

    return emotion_totals


def get_scene_emotion_data(
    analysis_df: pd.DataFrame,
) -> Tuple[List[int], List[str], List[float]]:
    """
    Prepare data for scene-by-scene emotion visualization.

    Args:
        analysis_df: DataFrame containing the emotion analysis results.

    Returns:
        Tuple of (scenes, emotions, scores) for plotting.
    """
    if analysis_df.empty:
        return [], [], []

    # Map emotions to numerical values for y-axis
    emotion_map = {
        "joy": 1,
        "disgust": 2,
        "surprise": 3,
        "neutral": 4,
        "fear": 5,
        "sadness": 6,
        "anger": 7,
    }

    scenes = analysis_df["Scene"].tolist()
    emotions = [
        emotion_map.get(emotion, 4) for emotion in analysis_df["Emotion"]
    ]  # Default to neutral if unknown
    scores = analysis_df["Score"].tolist()

    return scenes, emotions, scores


def generate_insights(
    analysis_df: pd.DataFrame,
) -> Tuple[str, Dict[str, float], Dict[str, Dict]]:
    """
    Generates textual insights and emotion totals based on the emotion analysis.

    Args:
        analysis_df: DataFrame containing the emotion analysis results.

    Returns:
        Tuple of (insights text, emotion totals dictionary, top emotions dictionary)
    """
    if analysis_df.empty or "Emotion" not in analysis_df.columns:
        return "No analysis data available to generate insights.", {}, {}

    try:
        # Get emotion totals for visualization
        emotion_totals = get_emotion_totals(analysis_df)

        # Get emotion counts excluding neutral
        emotion_counts = analysis_df[analysis_df["Emotion"] != "neutral"][
            "Emotion"
        ].value_counts()
        total_scenes = len(analysis_df[analysis_df["Emotion"] != "neutral"])

        # Get top 3 emotions with their counts and percentages
        top_emotions = {}
        for emotion, count in emotion_counts.head(3).items():
            percentage = round((count / total_scenes) * 100, 1)
            top_emotions[emotion] = {
                "count": count,
                "percentage": percentage,
                "significance": get_emotion_significance(emotion),
            }

        # Generate insights text
        insight = f"The analysis covers {total_scenes} emotional scenes (excluding neutral).\n\n"

        # Add top 3 emotions to insights
        for i, (emotion, data) in enumerate(top_emotions.items(), 1):
            insight += f"{i}. **{emotion.title()}** appears in {data['count']} scenes ({data['percentage']}%)\n"
            insight += f"   {data['significance']}\n\n"

        return insight, emotion_totals, top_emotions

    except Exception as e:
        logging.error(f"Error generating insights: {e}")
        return "Could not generate insights due to an error.", {}, {}


def get_emotion_significance(emotion: str) -> str:
    """
    Returns the significance text for a given emotion.
    """
    significance = {
        "joy": "This suggests the narrative focuses on positive outcomes, achievements, or moments of happiness, characterizing it as uplifting or comedic.",
        "sadness": "This indicates a strong presence of loss, disappointment, or melancholy, suggesting a dramatic or tragic storyline.",
        "anger": "This points towards conflict, frustration, or confrontation being central themes, common in action, thriller, or intense drama genres.",
        "fear": "This suggests suspense, tension, or danger are significant elements, typical of horror, thriller, or suspense genres.",
        "disgust": "This highlights a character's strong aversion to something, often related to moral or physical repulsion",
        "surprise": "This indicates unexpected events or twists play a noticeable role, potentially adding intrigue or humor depending on context.",
    }
    return significance.get(
        emotion,
        "This emotion plays a significant role in shaping the narrative's emotional landscape.",
    )


# Example usage (optional)
if __name__ == "__main__":
    sample_plot = """
    The team lands in a dream within a dream. Things look good initially. Suddenly, projections attack.
    Cobb feels immense guilt over Mal. Ariadne designs complex mazes. They finally reach the target's subconscious.
    A tense confrontation occurs. Success seems within reach, but Saito is dying. Cobb performs inception. They escape, but Cobb is lost in limbo. He wakes up on the plane, finally home. Or is he?
    """
    # chunks = chunk_text_nltk(sample_plot)
    chunks = chunk_text_spacy(sample_plot)  # Use SpaCy
    print("Chunks:", chunks)

    if emotion_classifier:
        analysis = classify_emotions(chunks)
        print("\nAnalysis DataFrame:")
        print(analysis)

        insights, emotion_totals, top_emotions = generate_insights(analysis)
        print("\nInsights:")
        print(insights)

        print("\nEmotion Totals:")
        print(emotion_totals)

        print("\nTop Emotions:")
        print(top_emotions)
    else:
        print("\nEmotion classifier not loaded, skipping analysis.")
