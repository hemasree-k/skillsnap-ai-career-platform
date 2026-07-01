import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List

class GitHubIntegration:
    @staticmethod
    def fetch_user_data(username: str) -> Dict[str, Any]:
        """
        Fetches public profile and repository details from GitHub API for a given username.
        """
        token = os.getenv("GITHUB_TOKEN", "").strip()
        headers = {
            "User-Agent": "SkillSnap-AI-Platform",
            "Accept": "application/vnd.github.v3+json"
        }
        if token:
            headers["Authorization"] = f"token {token}"

        user_url = f"https://api.github.com/users/{username}"
        repos_url = f"https://api.github.com/users/{username}/repos?per_page=50&sort=updated"

        user_data = {}
        repos_data = []

        # 1. Fetch User Profile
        try:
            req = urllib.request.Request(user_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                user_data = json.loads(response.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise ValueError(f"GitHub user '{username}' not found.")
            else:
                raise Exception(f"GitHub API error fetching profile: {e.reason} (Code: {e.code})")
        except Exception as e:
            raise Exception(f"Connection error fetching GitHub profile: {str(e)}")

        # 2. Fetch Repositories
        try:
            req = urllib.request.Request(repos_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                repos_data = json.loads(response.read().decode())
        except Exception as e:
            # We don't fail the whole request if repos fetch fails, but log it
            print(f"Warning: Failed to fetch repositories for {username}: {e}")

        # 3. Process and Aggregate Data
        repo_count = user_data.get("public_repos", 0)
        followers = user_data.get("followers", 0)
        name = user_data.get("name") or username
        bio = user_data.get("bio") or ""

        # Language aggregate & repo info mapping
        language_counts = {}
        processed_repos = []
        for repo in repos_data:
            lang = repo.get("language")
            if lang:
                language_counts[lang] = language_counts.get(lang, 0) + 1
            
            processed_repos.append({
                "name": repo.get("name"),
                "description": repo.get("description") or "",
                "language": lang or "Unknown",
                "stars": repo.get("stargazers_count", 0),
                "url": repo.get("html_url", "")
            })

        # Sort languages by frequency
        sorted_languages = sorted(language_counts.items(), key=lambda x: x[1], reverse=True)
        top_languages = [lang for lang, _ in sorted_languages[:5]]

        return {
            "username": username,
            "name": name,
            "bio": bio,
            "repo_count": repo_count,
            "followers": followers,
            "languages": top_languages,
            "repos": processed_repos
        }
