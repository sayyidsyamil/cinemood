# emotion_utils.py
import nltk
from transformers import pipeline
import pandas as pd
import logging
import spacy

logging.basicConfig(level=logging.INFO)

# Load SpaCy model once
try:
    nlp = spacy.load("en_core_web_sm")
    logging.info("SpaCy model 'en_core_web_sm' loaded successfully.")
except OSError:
    logging.error("SpaCy model 'en_core_web_sm' not found. Please run: python -m spacy download en_core_web_sm")
    nlp = None

# Load NLTK sentence tokenizer data
try:
    nltk.data.find('tokenizers/punkt')
except nltk.downloader.DownloadError:
    logging.info("NLTK 'punkt' not found. Downloading...")
    nltk.download('punkt', quiet=True)
    logging.info("NLTK 'punkt' downloaded.")

# Load emotion classification pipeline once
try:
    emotion_classifier = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        top_k=None # Get all scores initially if needed, or top_k=1 for just dominant
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
        return [s.strip() for s in sentences if s.strip()] # Remove empty strings
    except Exception as e:
        logging.error(f"Error during NLTK sentence tokenization: {e}")
        # Fallback: split by newline if NLTK fails
        return [s.strip() for s in text.split('\n') if s.strip()]

def chunk_text_spacy(text: str) -> list[str]:
    """Chunks text into sentences using SpaCy."""
    if not text or not nlp:
        return chunk_text_nltk(text) # Fallback to NLTK if SpaCy not loaded or text empty
    try:
        doc = nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
        return sentences
    except Exception as e:
        logging.error(f"Error during SpaCy sentence tokenization: {e}")
        return chunk_text_nltk(text) # Fallback to NLTK

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
        logging.warning("Emotion classification skipped: No chunks or classifier unavailable.")
        return pd.DataFrame(columns=['Scene', 'Chunk', 'Emotion', 'Score'])

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

             if isinstance(output, list) and output: # Check if it's a list and not empty
                 # If top_k=None, find max score emotion
                 if len(output) > 1:
                     dominant_emotion = max(output, key=lambda x: x['score'])
                 # If top_k=1 (or default), the first element is the dominant one
                 else:
                      dominant_emotion = output[0]

                 results.append({
                     "Scene": i + 1,
                     "Chunk": chunk,
                     "Emotion": dominant_emotion['label'],
                     "Score": round(dominant_emotion['score'], 4)
                 })
             else:
                 # Handle cases where the classifier might return an unexpected format or empty result
                 logging.warning(f"Could not classify emotion for chunk {i+1}: '{chunk[:50]}...'")
                 results.append({
                     "Scene": i + 1,
                     "Chunk": chunk,
                     "Emotion": "unknown",
                     "Score": 0.0
                 })

    except Exception as e:
        logging.error(f"Error during emotion classification pipeline: {e}")
        # Return partial results if any, or an empty DataFrame
        if not results:
             return pd.DataFrame(columns=['Scene', 'Chunk', 'Emotion', 'Score'])

    logging.info("Emotion classification completed.")
    return pd.DataFrame(results)


def generate_insights(analysis_df: pd.DataFrame) -> str:
    """
    Generates textual insights based on the emotion analysis.

    Args:
        analysis_df: DataFrame containing the emotion analysis results.

    Returns:
        A string summarizing the emotional arc insights.
    """
    if analysis_df.empty or 'Emotion' not in analysis_df.columns:
        return "No analysis data available to generate insights."

    try:
        total_scenes = len(analysis_df)
        emotion_counts = analysis_df['Emotion'].value_counts()
        most_common_emotion = emotion_counts.idxmax()
        most_common_count = emotion_counts.max()
        most_common_perc = round((most_common_count / total_scenes) * 100, 1)

        # Basic insight
        insight = f"The analysis covers {total_scenes} scenes (text chunks).\n\n"
        insight += f"The most dominant emotion throughout the plot is **{most_common_emotion}**, appearing in {most_common_count} scenes ({most_common_perc}%).\n\n"

        # Add more insights (optional)
        # - Emotion shifts: Look for sequences like joy -> sadness
        # - Intensity: Are scores generally high or low?
        # - Climax hint: Is there a peak of negative emotions like fear/anger/sadness around the middle/end?

        # Example: Mention top 3 emotions
        top_3 = emotion_counts.head(3).index.tolist()
        insight += f"Other prominent emotions include: {', '.join(top_3[1:])}." # Assuming at least 2 emotions exist

        # Example: Significance (generic template)
        significance = {
            "joy": f"This suggests the narrative likely focuses on positive outcomes, achievements, or moments of happiness, potentially characterizing it as uplifting or comedic.",
            "sadness": f"This indicates a strong presence of loss, disappointment, or melancholy, suggesting a dramatic or tragic storyline.",
            "anger": f"This points towards conflict, frustration, or confrontation being central themes, common in action, thriller, or intense drama genres.",
            "fear": f"This suggests suspense, tension, or danger are significant elements, typical of horror, thriller, or suspense genres.",
            "love": f"This highlights romance, deep connection, or affection as key drivers, pointing towards romance or relationship-focused drama.",
            "surprise": f"This indicates unexpected events or twists play a noticeable role, potentially adding intrigue or humor depending on context.",
            "neutral": f"A high prevalence of neutrality might indicate descriptive passages, objective narration, or a more subdued emotional tone overall."
        }
        # Add significance of the *most common* emotion
        insight += f"\n\nThe prevalence of **{most_common_emotion}** often indicates that {significance.get(most_common_emotion, 'the emotional core revolves around this feeling.')}"

        return insight

    except Exception as e:
        logging.error(f"Error generating insights: {e}")
        return "Could not generate insights due to an error."

# Example usage (optional)
if __name__ == "__main__":
    sample_plot = """
    The team lands in a dream within a dream. Things look good initially. Suddenly, projections attack.
    Cobb feels immense guilt over Mal. Ariadne designs complex mazes. They finally reach the target's subconscious.
    A tense confrontation occurs. Success seems within reach, but Saito is dying. Cobb performs inception. They escape, but Cobb is lost in limbo. He wakes up on the plane, finally home. Or is he?
    """
    # chunks = chunk_text_nltk(sample_plot)
    chunks = chunk_text_spacy(sample_plot) # Use SpaCy
    print("Chunks:", chunks)

    if emotion_classifier:
        analysis = classify_emotions(chunks)
        print("\nAnalysis DataFrame:")
        print(analysis)

        insights = generate_insights(analysis)
        print("\nInsights:")
        print(insights)
    else:
        print("\nEmotion classifier not loaded, skipping analysis.") 