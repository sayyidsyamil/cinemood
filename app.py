# app.py
import gradio as gr
import pandas as pd
import tempfile
import os
import logging
from typing import Tuple, Any

# Import project modules
from wiki_fetcher import fetch_movie_plot
from emotion_utils import chunk_text_spacy, classify_emotions, generate_insights
from visuals import create_emotion_distribution_graph
from report_generator import generate_pdf_report

logging.basicConfig(level=logging.INFO)

# Ensure temporary file directory exists if needed (usually handled by tempfile)
TEMP_DIR = "temp_outputs"
os.makedirs(TEMP_DIR, exist_ok=True)

# Global variable to store temporary file paths for cleanup if necessary
# Gradio's File component handles temp files well, but manual cleanup might be a backup
temp_files = []

def cleanup_temp_files():
    """Removes temporary files created during analysis."""
    global temp_files
    for file_path in temp_files:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logging.info(f"Cleaned up temp file: {file_path}")
            except OSError as e:
                logging.error(f"Error removing temp file {file_path}: {e}")
    temp_files = []


def process_analysis(movie_title: str | None, custom_plot: str | None) -> Tuple[Any, ...]:
    """
    Core function to perform the full movie emotion analysis.
    Takes either a movie title or a custom plot, analyzes it,
    and returns results formatted for Gradio outputs.
    """
    global temp_files
    cleanup_temp_files() # Clean up files from previous run

    plot_text = None
    display_title = "Custom Plot" # Default title for display

    if custom_plot and custom_plot.strip():
        logging.info("Processing custom plot text.")
        plot_text = custom_plot.strip()
    elif movie_title and movie_title.strip():
        display_title = movie_title.strip()
        logging.info(f"Fetching plot for title: {display_title}")
        # Display status to user
        yield ( # Yield intermediate status updates
            gr.update(value="Fetching plot from Wikipedia...", interactive=False), # plot_display
            gr.update(value=None), # emotion_table
            gr.update(value="Fetching plot..."), # insights_display
            gr.update(value=None), # emotion_graph
            gr.update(value=None, visible=False), # download_csv
            gr.update(value=None, visible=False), # download_png
            gr.update(value=None, visible=False), # download_pdf
        )
        plot_text = fetch_movie_plot(display_title)
        if not plot_text:
            logging.warning(f"Could not fetch plot for {display_title}.")
            yield (
                gr.update(value=f"Could not find plot for '{display_title}' on Wikipedia. Please try a different title or paste the plot manually.", interactive=False),
                None, "Plot not found.", None, None, None, None
            )
            return
        logging.info(f"Plot fetched successfully for {display_title}.")
    else:
        logging.warning("No movie title or custom plot provided.")
        yield (
            gr.update(value="Please enter a movie title or paste a plot.", interactive=False),
            None, "No input provided.", None, None, None, None
        )
        return

    # --- Start Analysis ---
    yield ( # Update status
        gr.update(value=plot_text[:1000] + "..." if len(plot_text) > 1000 else plot_text, interactive=False), # Show fetched plot
        None, "Analyzing emotions...", None, None, None, None
    )

    # 1. Chunk the text
    # chunks = chunk_text_nltk(plot_text) # Use NLTK
    chunks = chunk_text_spacy(plot_text) # Use SpaCy
    if not chunks:
        logging.error("Text chunking resulted in empty list.")
        yield (
             gr.update(value=plot_text, interactive=False),
             None, "Error: Could not break the plot into analysable chunks.", None, None, None, None
        )
        return

    # 2. Classify Emotions
    analysis_df = classify_emotions(chunks)
    if analysis_df.empty:
         logging.error("Emotion classification failed or returned empty results.")
         yield (
             gr.update(value=plot_text, interactive=False),
             None, "Error: Failed to classify emotions for the provided plot.", None, None, None, None
         )
         return

    # 3. Generate Insights
    insights = generate_insights(analysis_df)

    # 4. Create Visualization
    plot_buffer = create_emotion_distribution_graph(analysis_df)

    # --- Prepare Outputs for Gradio ---
    graph_path_or_obj = None
    png_path = None
    if plot_buffer:
        try:
            # Save buffer to a temporary PNG file for display and download
            with tempfile.NamedTemporaryFile(dir=TEMP_DIR, delete=False, suffix=".png") as temp_png:
                temp_png.write(plot_buffer.getvalue())
                png_path = temp_png.name
                graph_path_or_obj = png_path # Use the file path for gr.Image
                temp_files.append(png_path) # Track for cleanup
                logging.info(f"Graph saved to temporary file: {png_path}")
        except Exception as e:
            logging.error(f"Error saving graph to temporary file: {e}")
            graph_path_or_obj = None # Fallback if saving fails

    # 5. Generate Files for Download
    csv_path = None
    pdf_path = None
    try:
        # Save CSV
        with tempfile.NamedTemporaryFile(dir=TEMP_DIR, delete=False, suffix=".csv") as temp_csv:
            analysis_df.to_csv(temp_csv.name, index=False)
            csv_path = temp_csv.name
            temp_files.append(csv_path)
            logging.info(f"CSV analysis saved to temporary file: {csv_path}")

        # Save PDF (using the buffer from graph generation)
        pdf_path = generate_pdf_report(display_title, plot_text, analysis_df, insights, plot_buffer)
        if pdf_path:
            temp_files.append(pdf_path) # Track for cleanup
            logging.info(f"PDF report saved to temporary file: {pdf_path}")

    except Exception as e:
        logging.error(f"Error generating download files: {e}")
        # Don't crash, just might not have download links

    # Final yield with all results
    yield (
        gr.update(value=plot_text),
        gr.update(value=analysis_df),
        gr.update(value=insights),
        gr.update(value=graph_path_or_obj), # Display the graph via file path
        gr.update(value=csv_path, visible=csv_path is not None), # Show download button if file exists
        gr.update(value=png_path, visible=png_path is not None), # Use the same graph path for PNG download
        gr.update(value=pdf_path, visible=pdf_path is not None)  # Show download button if file exists
    )


# --- Gradio Interface ---
css = """
body { font-family: sans-serif; }
.gr-button { background-color: #4CAF50; color: white; border: none; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 8px; }
.gr-button:hover { background-color: #45a049; }
footer {display: none !important;}
"""

with gr.Blocks(css=css, title="Cinemood: Movie Emotion Analyzer") as app:
    gr.Markdown("# 🎬 Cinemood: Movie Emotion Analyzer")
    gr.Markdown("Analyze the emotional arc of a movie plot fetched from Wikipedia or your own custom text.")

    with gr.Row():
        with gr.Column(scale=1):
            with gr.Tabs():
                with gr.TabItem("Analyze by Title"):
                    movie_title_input = gr.Textbox(label="Enter Movie Title", placeholder="e.g., Inception")
                    analyze_button_title = gr.Button("Analyze Title", variant="primary")
                with gr.TabItem("Analyze Custom Plot"):
                    custom_plot_input = gr.Textbox(label="Paste Movie Plot Here", lines=10, placeholder="Paste the movie plot summary text here...")
                    analyze_button_custom = gr.Button("Analyze Custom Plot", variant="primary")

            gr.Markdown("---")
            gr.Markdown("### Download Results")
            with gr.Row():
                 download_csv = gr.File(label="Download Analysis (CSV)", visible=False, interactive=False)
                 download_png = gr.File(label="Download Graph (PNG)", visible=False, interactive=False)
                 download_pdf = gr.File(label="Download Full Report (PDF)", visible=False, interactive=False)


        with gr.Column(scale=2):
            gr.Markdown("### Analysis Results")
            plot_display = gr.Textbox(label="Fetched/Used Plot", lines=8, interactive=False)
            insights_display = gr.Textbox(label="Storytelling Insights", lines=4, interactive=False)
            emotion_graph = gr.Image(label="Emotion Distribution Graph", type="filepath", interactive=False) # Use filepath type
            emotion_table = gr.DataFrame(label="Scene-by-Scene Emotion Analysis", interactive=False)


    # Define outputs list (must match the order yielded by process_analysis)
    outputs = [
        plot_display,
        emotion_table,
        insights_display,
        emotion_graph,
        download_csv,
        download_png,
        download_pdf
    ]

    # Connect buttons to the processing function
    analyze_button_title.click(
        fn=process_analysis,
        inputs=[movie_title_input, gr.State(None)], # Pass None for custom_plot
        outputs=outputs,
        show_progress="full" # Show Gradio's progress indicator
    )

    analyze_button_custom.click(
        fn=process_analysis,
        inputs=[gr.State(None), custom_plot_input], # Pass None for movie_title
        outputs=outputs,
        show_progress="full" # Show Gradio's progress indicator
    )

    # Add example usage
    gr.Examples(
        examples=[
            ["The Dark Knight"],
            ["Parasite (2019 film)"],
            ["Everything Everywhere All at Once"]
        ],
        inputs=[movie_title_input], # Link examples to the title input
        outputs=outputs,
        fn=lambda title: next(process_analysis(title, None)), # Lambda to call the generator correctly for examples
        cache_examples=False, # Caching might be complex with file outputs/state
        label="Example Movie Titles (Click to Run)"
    )

    # Add cleanup hook (optional, Gradio often handles temp files well)
    # app.unload(cleanup_temp_files) # Register cleanup function on app close/reload

# --- Run the App ---
if __name__ == "__main__":
    # Set share=True to get a public link (requires Gradio account or tunneling)
    app.launch(debug=True, share=True) # debug=True provides more logs
    # Clean up any remaining temp files on exit (might not always run on forced exit)
    cleanup_temp_files() 