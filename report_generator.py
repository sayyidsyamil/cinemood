# report_generator.py
from fpdf import FPDF
import pandas as pd
import io
import tempfile
import os
import logging
import matplotlib.pyplot as plt # Needed to save the buffer to a temporary file

logging.basicConfig(level=logging.INFO)

# Define consistent colors from visuals.py if needed, or keep simple
# from visuals import EMOTION_COLORS

class PDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 12)
        self.cell(0, 10, 'Cinemood: Movie Emotion Analysis Report', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_pdf_report(movie_title: str,
                        plot_summary: str,
                        analysis_df: pd.DataFrame,
                        insights: str,
                        plot_buffer: io.BytesIO | None) -> str | None:
    """
    Generates a PDF report summarizing the analysis.

    Args:
        movie_title: The title of the movie analyzed.
        plot_summary: The plot text used for analysis.
        analysis_df: DataFrame with scene-by-scene emotion analysis.
        insights: Textual summary of the emotional arc.
        plot_buffer: BytesIO buffer containing the emotion distribution graph PNG.

    Returns:
        File path to the generated temporary PDF file, or None if error.
    """
    pdf = PDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font('Helvetica', '', 12)

    try:
        # --- Movie Title ---
        pdf.set_font('Helvetica', 'B', 16)
        pdf.cell(0, 10, f"Analysis for: {movie_title}", 0, 1, 'L')
        pdf.ln(5)

        # --- Plot Summary ---
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, "Plot Summary Used:", 0, 1, 'L')
        pdf.set_font('Helvetica', '', 10)
        # Use multi_cell for long text, handle potential encoding issues
        try:
            pdf.multi_cell(0, 5, plot_summary.encode('latin-1', 'replace').decode('latin-1'))
        except Exception as e:
            logging.error(f"Encoding error adding plot summary to PDF: {e}")
            pdf.multi_cell(0, 5, "Error displaying plot summary due to character encoding issues.")
        pdf.ln(5)

        # --- Storytelling Insights ---
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, "Emotional Arc Insights:", 0, 1, 'L')
        pdf.set_font('Helvetica', '', 10)
        # Clean up insights text formatting slightly for PDF
        insights_pdf = insights.replace("**", "") # Remove markdown bold
        pdf.multi_cell(0, 5, insights_pdf.encode('latin-1', 'replace').decode('latin-1'))
        pdf.ln(5)

        # --- Emotion Distribution Graph ---
        if plot_buffer:
            pdf.set_font('Helvetica', 'B', 12)
            pdf.cell(0, 10, "Overall Emotion Distribution:", 0, 1, 'L')
            pdf.ln(2)
            try:
                # Save buffer to a temporary image file for FPDF
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_img:
                    temp_img.write(plot_buffer.getvalue())
                    temp_img_path = temp_img.name

                # Calculate image width to fit page (A4 width ~ 210mm, margins ~15mm each side)
                available_width = pdf.w - 2 * pdf.l_margin
                pdf.image(temp_img_path, x=pdf.get_x(), y=pdf.get_y(), w=available_width * 0.8) # Use 80% width
                pdf.ln(available_width * 0.8 * 0.6) # Adjust line break based on image height (estimate aspect ratio)

                os.remove(temp_img_path) # Clean up temporary image file
                pdf.ln(5)
            except Exception as img_err:
                logging.error(f"Error embedding graph image in PDF: {img_err}")
                pdf.set_font('Helvetica', 'I', 10)
                pdf.cell(0, 5, "[Error displaying emotion graph]", 0, 1, 'L')
                pdf.ln(5)


        # --- Scene-by-Scene Analysis Table ---
        if not analysis_df.empty:
             pdf.add_page() # Start table on a new page for clarity
             pdf.set_font('Helvetica', 'B', 12)
             pdf.cell(0, 10, "Scene-by-Scene Emotion Details:", 0, 1, 'L')
             pdf.ln(5)

             pdf.set_font('Helvetica', 'B', 9)
             col_widths = {'Scene': 15, 'Emotion': 25, 'Score': 15, 'Chunk': pdf.w - pdf.l_margin - pdf.r_margin - 15 - 25 - 15 - 5} # Adjust widths

             # Table Header
             pdf.cell(col_widths['Scene'], 7, 'Scene', 1, 0, 'C')
             pdf.cell(col_widths['Emotion'], 7, 'Emotion', 1, 0, 'C')
             pdf.cell(col_widths['Score'], 7, 'Score', 1, 0, 'C')
             pdf.cell(col_widths['Chunk'], 7, 'Chunk Text', 1, 1, 'C')

             # Table Rows
             pdf.set_font('Helvetica', '', 8)
             for index, row in analysis_df.iterrows():
                 current_y = pdf.get_y()
                 # Use multi_cell for the chunk text to allow wrapping
                 pdf.multi_cell(col_widths['Scene'], 5, str(row['Scene']), 1, 'C')
                 x_after_scene = pdf.l_margin + col_widths['Scene']
                 pdf.set_xy(x_after_scene, current_y) # Reset X position

                 pdf.multi_cell(col_widths['Emotion'], 5, str(row['Emotion']), 1, 'C')
                 x_after_emotion = x_after_scene + col_widths['Emotion']
                 pdf.set_xy(x_after_emotion, current_y) # Reset X position

                 pdf.multi_cell(col_widths['Score'], 5, str(row['Score']), 1, 'C')
                 x_after_score = x_after_emotion + col_widths['Score']
                 pdf.set_xy(x_after_score, current_y) # Reset X position

                 # Handle chunk encoding and wrapping
                 chunk_text = str(row['Chunk']).encode('latin-1', 'replace').decode('latin-1')
                 pdf.multi_cell(col_widths['Chunk'], 5, chunk_text, 1, 'L')
                 # The multi_cell for Chunk automatically moves Y, so no need for pdf.ln() here

                 # Check if page break needed manually (fpdf might handle this with set_auto_page_break)
                 if pdf.get_y() > pdf.h - pdf.b_margin - 15: # Check if near bottom margin
                      pdf.add_page()
                      # Re-draw header if needed (optional)
                      pdf.set_font('Helvetica', 'B', 9)
                      pdf.cell(col_widths['Scene'], 7, 'Scene', 1, 0, 'C')
                      pdf.cell(col_widths['Emotion'], 7, 'Emotion', 1, 0, 'C')
                      pdf.cell(col_widths['Score'], 7, 'Score', 1, 0, 'C')
                      pdf.cell(col_widths['Chunk'], 7, 'Chunk Text', 1, 1, 'C')
                      pdf.set_font('Helvetica', '', 8)


        # Save PDF to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            pdf_output_path = temp_pdf.name

        pdf.output(pdf_output_path, "F") # 'F' saves to local file
        logging.info(f"PDF report generated successfully at: {pdf_output_path}")
        return pdf_output_path

    except Exception as e:
        logging.error(f"Failed to generate PDF report: {e}")
        # Clean up temp file if it exists and failed mid-generation
        if 'temp_pdf' in locals() and os.path.exists(temp_pdf.name):
             try:
                 os.remove(temp_pdf.name)
             except OSError:
                 pass # Ignore error if removal fails
        if 'temp_img_path' in locals() and os.path.exists(temp_img_path):
             try:
                 os.remove(temp_img_path)
             except OSError:
                 pass
        return None

# Example usage (optional)
if __name__ == "__main__":
     # Use dummy data from visuals.py example
    data = {'Scene': [1, 2, 3, 4, 5, 6, 7, 8, 9],
            'Chunk': ['Scene 1 text - joy', 'Scene 2 text - anger', 'Scene 3 text - sadness', 'Scene 4 text - fear', 'Scene 5 text - joy', 'Scene 6 text - neutral', 'Scene 7 text - anger', 'Scene 8 text - surprise', 'Scene 9 text - joy'],
            'Emotion': ['joy', 'anger', 'sadness', 'fear', 'joy', 'neutral', 'anger', 'surprise', 'joy'],
            'Score': [0.9, 0.8, 0.95, 0.7, 0.85, 0.9, 0.75, 0.88, 0.92]}
    dummy_df = pd.DataFrame(data)
    dummy_plot = "This is a short dummy plot summary.\nIt has multiple lines."
    dummy_insights = "The most common emotion is joy (33%). Anger is also prominent. This suggests a mix of positive moments and conflict."
    from visuals import create_emotion_distribution_graph # Import for example
    dummy_plot_buffer = create_emotion_distribution_graph(dummy_df)

    pdf_path = generate_pdf_report("Dummy Movie", dummy_plot, dummy_df, dummy_insights, dummy_plot_buffer)

    if pdf_path:
        print(f"PDF report saved to: {pdf_path}")
        # Keep the file for inspection: print(f"Temporary PDF path: {pdf_path}")
        # To auto-delete, you would manage the tempfile differently or clean up later.
    else:
        print("Failed to generate PDF report.") 