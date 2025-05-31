from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
import tempfile
import os

# Import project modules
from wiki_fetcher import fetch_movie_plot
from emotion_utils import chunk_text_spacy, classify_emotions, generate_insights, get_scene_emotion_data
from visuals import create_emotion_distribution_graph
from report_generator import generate_pdf_report

# Configure logging
logging.basicConfig(level=logging.INFO)

# Ensure temporary file directory exists
TEMP_DIR = "temp_outputs"
os.makedirs(TEMP_DIR, exist_ok=True)

app = FastAPI(title="Cinemood API", description="Movie Emotion Analysis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MoviePlot(BaseModel):
    title: Optional[str] = None
    custom_plot: Optional[str] = None

class AnalysisResponse(BaseModel):
    plot: str
    emotions: List[Dict]
    insights: str
    emotion_totals: Dict[str, float]
    top_emotions: Dict[str, Dict]
    scene_data: Dict[str, List]
    emotion_distribution: str
    csv_data: str
    pdf_data: str

@app.post("/api/analyze")
async def analyze_movie(movie: MoviePlot):
    try:
        # Get plot text
        plot_text = None
        display_title = "Custom Plot"

        if movie.custom_plot and movie.custom_plot.strip():
            logging.info("Processing custom plot text.")
            plot_text = movie.custom_plot.strip()
        elif movie.title and movie.title.strip():
            display_title = movie.title.strip()
            logging.info(f"Fetching plot for title: {display_title}")
            plot_text = fetch_movie_plot(display_title)
            if not plot_text:
                raise HTTPException(status_code=404, detail=f"Could not find plot for '{display_title}'")
        else:
            raise HTTPException(status_code=400, detail="Either title or custom_plot must be provided")

        # 1. Chunk the text using SpaCy
        chunks = chunk_text_spacy(plot_text)
        if not chunks:
            raise HTTPException(status_code=500, detail="Could not break the plot into analysable chunks")

        # 2. Classify Emotions
        analysis_df = classify_emotions(chunks)
        if analysis_df.empty:
            raise HTTPException(status_code=500, detail="Failed to classify emotions for the provided plot")

        # 3. Generate Insights and get emotion totals
        insights, emotion_totals, top_emotions = generate_insights(analysis_df)
        
        # Get scene-by-scene data for visualization
        scenes, emotions, scores = get_scene_emotion_data(analysis_df)
        scene_data = {
            "scenes": scenes,
            "emotions": emotions,
            "scores": scores
        }

        # 4. Create Visualization
        plot_buffer = create_emotion_distribution_graph(analysis_df)
        if not plot_buffer:
            raise HTTPException(status_code=500, detail="Failed to generate emotion distribution graph")

        # 5. Generate Files for Download
        # Save CSV
        csv_path = None
        pdf_path = None
        try:
            with tempfile.NamedTemporaryFile(dir=TEMP_DIR, delete=False, suffix=".csv") as temp_csv:
                analysis_df.to_csv(temp_csv.name, index=False)
                csv_path = temp_csv.name
                logging.info(f"CSV analysis saved to temporary file: {csv_path}")

            # Generate PDF report
            pdf_path = generate_pdf_report(display_title, plot_text, analysis_df, insights, plot_buffer)
            if not pdf_path:
                raise HTTPException(status_code=500, detail="Failed to generate PDF report")

        except Exception as e:
            logging.error(f"Error generating download files: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate download files")

        # Convert files to base64 for API response
        import base64
        with open(csv_path, 'rb') as f:
            csv_base64 = base64.b64encode(f.read()).decode()
        with open(pdf_path, 'rb') as f:
            pdf_base64 = base64.b64encode(f.read()).decode()

        # Clean up temporary files
        try:
            os.remove(csv_path)
            os.remove(pdf_path)
        except OSError as e:
            logging.error(f"Error cleaning up temporary files: {e}")

        # Convert plot buffer to base64
        plot_buffer.seek(0)
        image_base64 = base64.b64encode(plot_buffer.getvalue()).decode()

        # Convert DataFrame to list of dictionaries for JSON response
        emotions = analysis_df.to_dict('records')

        return AnalysisResponse(
            plot=plot_text,
            emotions=emotions,
            insights=insights,
            emotion_totals=emotion_totals,
            top_emotions=top_emotions,
            scene_data=scene_data,
            emotion_distribution=image_base64,
            csv_data=csv_base64,
            pdf_data=pdf_base64
        )

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Unexpected error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 