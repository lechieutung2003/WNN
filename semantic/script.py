import json
import os
# Change the relative import to an absolute import
from PromptBuilder import PromptBuilder

def test_prompt_builder():
    # Use absolute path to ensure file can be found
    current_dir = os.path.dirname(os.path.abspath(__file__))
    arts_file_path = os.path.join(os.path.dirname(current_dir), 'frontend', 'src', 'assets', 'data', 'Arts_List.json')
    
    # Load the arts list with error handling
    try:
        with open(arts_file_path, "r", encoding="utf-8") as f:
            arts_list = json.load(f)
        
        # Initialize prompt builder
        builder = PromptBuilder()
        
        # Test with a few examples
        for i, artwork in enumerate(arts_list[:5]):
            print(f"\nTesting artwork {i+1}: {artwork['title']}")
            print(f"Original description: {artwork['description'][:100]}...")
            
            result = builder.build_prompt(artwork)
            print(f"Enriched prompt: {result['prompt']}")
            print(f"Extracted semantic data: {json.dumps(result['semantic_data'], indent=2)}")
    
    except FileNotFoundError:
        print(f"Error: Arts_List.json file not found at {arts_file_path}")
    except json.JSONDecodeError:
        print("Error: Invalid JSON in Arts_List.json")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_prompt_builder()