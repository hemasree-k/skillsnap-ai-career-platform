import re
from typing import Dict, Any

class LinkedInIntegration:
    @staticmethod
    def process_profile_input(profile_url: str, profile_text: str) -> Dict[str, Any]:
        """
        Validates LinkedIn profile URL and ensures profile text is cleaned.
        """
        profile_url = profile_url.strip() if profile_url else ""
        profile_text = profile_text.strip() if profile_text else ""

        # Validate URL format if provided
        if profile_url and not re.match(r'^https?://(www\.)?linkedin\.com/.*$', profile_url):
            raise ValueError("Invalid LinkedIn profile URL. Must start with http://linkedin.com or https://linkedin.com")

        if not profile_url and not profile_text:
            raise ValueError("You must provide either a LinkedIn profile URL or profile text content.")

        # Clean profile text if needed (e.g., stripping double spaces)
        cleaned_text = re.sub(r'\s+', ' ', profile_text)

        return {
            "profile_url": profile_url,
            "profile_text": cleaned_text
        }
