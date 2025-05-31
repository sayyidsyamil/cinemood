import wikipedia
import logging

logging.basicConfig(level=logging.INFO)

def fetch_movie_plot(movie_title: str) -> str | None:
    """
    Fetches the plot summary of a movie from Wikipedia.

    Args:
        movie_title: The title of the movie to search for.

    Returns:
        The plot summary as a string, or None if not found or an error occurs.
    """
    logging.info(f"Attempting to fetch plot for: {movie_title}")
    try:
        # Search for the movie page
        search_results = wikipedia.search(movie_title)
        if not search_results:
            logging.warning(f"No Wikipedia page found for '{movie_title}'.")
            return None

        # Try to get the page, handling disambiguation
        try:
            page = wikipedia.page(search_results[0], auto_suggest=False) # Use first result precisely
        except wikipedia.exceptions.DisambiguationError as e:
            logging.warning(f"Disambiguation error for '{movie_title}'. Trying first option: {e.options[0]}")
            try:
                # Try the first option from the disambiguation page
                page = wikipedia.page(e.options[0], auto_suggest=False)
            except Exception as inner_e:
                 logging.error(f"Could not resolve disambiguation for '{movie_title}': {inner_e}")
                 return None
        except wikipedia.exceptions.PageError:
            logging.warning(f"Wikipedia page '{search_results[0]}' not found precisely.")
            # Try searching again with the suggested title if auto_suggest was True initially
            # Or just return None if strict matching is preferred
            return None

        # Try fetching the "Plot" section first, then "Synopsis"
        plot = None
        for section_title in ["Plot", "Synopsis"]:
            try:
                plot = page.section(section_title)
                if plot:
                    logging.info(f"Successfully fetched '{section_title}' section for '{movie_title}'.")
                    # Basic cleaning (optional: remove == Plot == headers if present)
                    plot = plot.replace(f"== {section_title} ==", "").strip()
                    break
            except Exception:
                 logging.warning(f"No '{section_title}' section found for '{movie_title}'.")
                 continue # Try next section title

        if not plot:
             logging.warning(f"Could not find Plot or Synopsis section for '{movie_title}'. Trying full content summary.")
             # Fallback: Get page summary or first few paragraphs of content if plot section fails
             plot = page.summary # Or page.content[:1500] for more text
             if plot:
                 logging.info(f"Using page summary as plot fallback for '{movie_title}'.")
             else:
                logging.error(f"Failed to get any meaningful content for '{movie_title}'.")
                return None

        return plot

    except wikipedia.exceptions.WikipediaException as e:
        logging.error(f"Wikipedia Exception occurred for '{movie_title}': {e}")
        return None
    except Exception as e:
        logging.error(f"An unexpected error occurred while fetching plot for '{movie_title}': {e}")
        return None

# Example usage (optional, for testing)
if __name__ == "__main__":
    test_plot = fetch_movie_plot("Inception")
    if test_plot:
        print("Plot fetched successfully!")
        # print(test_plot[:500] + "...") # Print first 500 chars
    else:
        print("Could not fetch plot.")

    test_plot_custom = fetch_movie_plot("NonExistent Movie 12345")
    if not test_plot_custom:
        print("Correctly handled non-existent movie.") 