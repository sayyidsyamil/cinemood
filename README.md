# Cinemood: Movie Emotion Analyzer

Cinemood is a modern web application that analyzes the emotional content of movie plots using advanced Natural Language Processing (NLP) techniques. It provides detailed insights into the emotional journey of movies through beautiful visualizations and comprehensive analysis.

## Features

- Movie plot analysis using state-of-the-art NLP and AI-powered emotion detection
- Two input methods:
  - Fetch movie plots by title from Wikipedia
  - Input custom movie plots
- Comprehensive analysis results:
  - Scene-by-scene emotion breakdown
  - Emotion distribution visualization
  - Storytelling insights
- Modern, responsive user interface
- Dark mode design

## Tech Stack (with NLP Focus)

### Backend (NLP Pipeline)
- **Framework:** FastAPI (Python) — for high-performance RESTful API.
- **NLP & AI:**
  - **Hugging Face Transformers**: Utilizes the `j-hartmann/emotion-english-distilroberta-base` model for fine-grained emotion classification at the sentence/scene level.
  - **SpaCy**: Advanced sentence segmentation and linguistic preprocessing (tokenization, sentence splitting).
  - **NLTK**: Fallback for sentence tokenization if SpaCy is unavailable.
  - **pandas, numpy**: Data manipulation and analysis.
- **Plot Fetching:** Wikipedia API (via `wikipedia` Python package) — retrieves real-world movie plots for NLP analysis.
- **Visualization:** matplotlib (server-side, non-interactive backend) — generates emotion distribution graphs as images.
- **PDF Generation:** fpdf2 — compiles NLP results and visualizations into downloadable reports.
- **Other:** ltk (language toolkit), logging, tempfile, base64 (for file handling and API responses).

### Frontend
- **Framework:** React (TypeScript)
- **UI Library:** Material-UI (MUI) — modern, responsive components and theming (including dark mode)
- **Charts & Visualization:**
  - Chart.js (via `react-chartjs-2`) — for emotion trends and breakdowns
  - CanvasJS — for interactive charts
- **API Communication:** Axios
- **Routing:** React Router DOM
- **UX Enhancements:** Custom animations, typewriter effects, stepper navigation, and auto-suggestions for movie titles

---

## Application Flow (NLP Pipeline Emphasis)

### 1. User Input
- **Option 1:** Enter a movie title to fetch its plot from Wikipedia (real-world text for NLP analysis).
- **Option 2:** Paste a custom movie plot (user-generated text for NLP analysis).

### 2. Backend NLP Pipeline
- **Plot Retrieval:** If a title is provided, the backend fetches the plot summary or synopsis from Wikipedia, handling disambiguation and fallbacks.
- **Text Preprocessing & Chunking:**
  - The plot is split into sentences/scenes using SpaCy (or NLTK as fallback), ensuring each chunk is suitable for emotion classification.
  - This step is crucial for accurate NLP-based emotion detection at a granular level.
- **Emotion Analysis (NLP Model Inference):**
  - Each chunk is analyzed using a transformer-based model (`j-hartmann/emotion-english-distilroberta-base`) to predict the dominant emotion and its confidence score.
  - The model leverages contextual embeddings for nuanced emotion detection, a key NLP task.
- **Insights Generation:**
  - The backend summarizes the emotional arc, highlights top emotions, and computes emotion distribution using NLP-derived results.
- **Visualization:**
  - A bar chart of emotion distribution is generated as a PNG image using matplotlib.
- **Report Generation:**
  - Scene-by-scene results are compiled into downloadable CSV and PDF reports (the PDF includes the plot, insights, emotion graph, and a detailed table).

### 3. Frontend Experience
- **Step-by-Step UI:** Users are guided through input, analysis, summary, insights, scene breakdown, and downloads via a multi-step interface.
- **Visualizations:** Interactive and animated charts display emotion trends and distributions.
- **Dark Mode:** Fully supported, with smooth transitions and custom theming.
- **Movie Suggestions:** Animated, horizontally scrolling movie cards for quick selection.
- **Downloads:** Users can download the full analysis as CSV or PDF.

### 4. API Endpoints
- `POST /api/analyze` — Accepts a movie title or custom plot, returns NLP-based analysis, insights, visualizations, and downloadable files.
- `GET /api/health` — Health check endpoint.

---

## Setup Instructions

### Backend Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

The backend server will run on http://localhost:8000

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

The frontend application will run on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your web browser
2. Choose your preferred input method:
   - Enter a movie title to fetch its plot from Wikipedia
   - Or paste a custom movie plot
3. Click "Analyze" to process the plot using the NLP pipeline
4. View the comprehensive analysis results:
   - Plot summary
   - Emotion distribution graph
   - Storytelling insights
   - Scene-by-scene emotion breakdown

## API Documentation

The backend API documentation is available at http://localhost:8000/docs when the server is running.


## Credits

> Developed with 💡 by  
> **[@Sayyid Syamil](https://github.com/sayyidsyamil)** · **[@Hafiz Adha](https://github.com/hafizadha)** · **[@Luqman Nurhakim](https://github.com/lqmannn4)**  
> _Passion. Code. Cinema._
