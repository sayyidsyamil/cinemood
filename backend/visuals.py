# visuals.py
import matplotlib
matplotlib.use('Agg') # Use non-interactive backend suitable for web servers/Gradio
import matplotlib.pyplot as plt
import pandas as pd
import io
import logging

logging.basicConfig(level=logging.INFO)

# Define a consistent color map for emotions (optional but recommended)
EMOTION_COLORS = {
    'joy': 'gold',
    'sadness': 'cornflowerblue',
    'anger': 'red',
    'fear': 'purple',
    'love': 'lightcoral',
    'surprise': 'orange',
    'neutral': 'grey',
    'disgust': 'olive', # Add other emotions from model if needed
    'guilt': 'brown',
    'shame': 'darkgrey',
    'unknown': 'black'
}

def create_emotion_distribution_graph(analysis_df: pd.DataFrame) -> io.BytesIO | None:
    """
    Creates a bar chart showing the distribution of emotions across the movie.

    Args:
        analysis_df: DataFrame containing the emotion analysis results.

    Returns:
        A BytesIO buffer containing the PNG image of the plot, or None if error.
    """
    if analysis_df.empty or 'Emotion' not in analysis_df.columns:
        logging.warning("Cannot create graph: Analysis data is empty or missing 'Emotion' column.")
        return None

    try:
        plt.figure(figsize=(10, 6)) # Create a new figure

        emotion_counts = analysis_df['Emotion'].value_counts()

        # Get colors for the emotions present, default to grey if not in map
        colors = [EMOTION_COLORS.get(emotion, 'grey') for emotion in emotion_counts.index]

        bars = plt.bar(emotion_counts.index, emotion_counts.values, color=colors)

        plt.title('Overall Emotion Distribution in Movie Plot', fontsize=16)
        plt.xlabel('Emotion', fontsize=12)
        plt.ylabel('Number of Scenes (Chunks)', fontsize=12)
        plt.xticks(rotation=45, ha='right') # Rotate labels for better readability
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        plt.tight_layout() # Adjust layout to prevent labels overlapping

        # Add counts on top of bars (optional)
        for bar in bars:
            yval = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2.0, yval, int(yval), va='bottom', ha='center') # Add text labels

        # Save plot to a BytesIO buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)

        plt.close() # Close the figure to free memory
        logging.info("Emotion distribution graph created successfully.")
        return buf

    except Exception as e:
        logging.error(f"Error creating emotion distribution graph: {e}")
        plt.close() # Ensure plot is closed even if error occurs
        return None

# Example usage (optional)
if __name__ == "__main__":
    # Create dummy data for testing
    data = {'Scene': [1, 2, 3, 4, 5, 6, 7, 8, 9],
            'Chunk': ['Scene 1 text', 'Scene 2 text', 'Scene 3 text', 'Scene 4 text', 'Scene 5 text', 'Scene 6 text', 'Scene 7 text', 'Scene 8 text', 'Scene 9 text'],
            'Emotion': ['joy', 'anger', 'sadness', 'fear', 'joy', 'neutral', 'anger', 'surprise', 'joy'],
            'Score': [0.9, 0.8, 0.95, 0.7, 0.85, 0.9, 0.75, 0.88, 0.92]}
    dummy_df = pd.DataFrame(data)

    plot_buffer = create_emotion_distribution_graph(dummy_df)

    if plot_buffer:
        print("Graph created, buffer size:", len(plot_buffer.getvalue()))
        # To save locally for verification:
        # with open("test_emotion_graph.png", "wb") as f:
        #     f.write(plot_buffer.getvalue())
        # print("Saved test_emotion_graph.png")
    else:
        print("Failed to create graph.") 