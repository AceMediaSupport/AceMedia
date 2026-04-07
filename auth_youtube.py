#!/usr/bin/env python3
"""
YouTube OAuth2 Authentication Script

Authenticates with the YouTube Data API using OAuth2.
Generates an authorization link for the user to grant access,
then saves the token for future use.

Prerequisites:
  - Download your OAuth2 client credentials (client_secret.json)
    from the Google Cloud Console and place it in this directory.
"""

import os
import json
import sys

from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# YouTube API scopes
SCOPES = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRET_FILE = os.path.join(SCRIPT_DIR, "client_secret.json")
TOKEN_FILE = os.path.join(SCRIPT_DIR, "token.json")


def authenticate():
    """Run the OAuth2 flow and return credentials."""
    creds = None

    # Check for existing token
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        if creds and creds.valid:
            print("Using existing valid token.")
            return creds
        if creds and creds.expired and creds.refresh_token:
            print("Token expired. Refreshing...")
            try:
                creds.refresh(Request())
                save_token(creds)
                print("Token refreshed successfully.")
                return creds
            except Exception as e:
                print(f"Failed to refresh token: {e}")
                print("Starting new authentication flow...")
                creds = None

    # Check for client_secret.json
    if not os.path.exists(CLIENT_SECRET_FILE):
        print(f"\nERROR: client_secret.json not found at:")
        print(f"  {CLIENT_SECRET_FILE}")
        print()
        print("To fix this:")
        print("  1. Go to https://console.cloud.google.com/apis/credentials")
        print("  2. Create or download your OAuth 2.0 Client ID credentials")
        print("  3. Save the file as 'client_secret.json' in:")
        print(f"     {SCRIPT_DIR}")
        sys.exit(1)

    # Run OAuth2 flow - generates a link for the user to visit
    flow = InstalledAppFlow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        redirect_uri="http://localhost",
    )

    auth_url, state = flow.authorization_url(
        prompt="consent",
        login_hint="gonzalber7000@gmail.com",
        access_type="offline",
    )

    print("\n" + "=" * 60)
    print("YouTube OAuth2 Authentication")
    print("=" * 60)
    print(f"\nAuthenticating for: gonzalber7000@gmail.com")
    print("Make sure to sign in with the correct Google account.\n")
    print("1. Open this URL in your browser:\n")
    print(auth_url)
    print("\n2. Sign in and grant access.")
    print("3. Your browser will redirect to a localhost URL that won't load.")
    print("   That's OK! Copy the FULL URL from the address bar and paste below.\n")

    redirect_response = input("Paste the full redirect URL here: ").strip()
    flow.fetch_token(authorization_response=redirect_response)
    creds = flow.credentials

    # Save the token
    save_token(creds)
    return creds


def save_token(creds):
    """Save credentials to token.json."""
    with open(TOKEN_FILE, "w") as f:
        f.write(creds.to_json())
    print(f"\nToken saved to: {TOKEN_FILE}")


def verify_auth(creds):
    """Verify authentication by fetching channel info."""
    print("\nVerifying authentication...")
    try:
        youtube = build("youtube", "v3", credentials=creds)
        request = youtube.channels().list(part="snippet", mine=True)
        response = request.execute()

        if response.get("items"):
            channel = response["items"][0]["snippet"]
            print(f"\nAuthentication successful!")
            print(f"  Channel: {channel['title']}")
            print(f"  Description: {channel.get('description', 'N/A')[:80]}")
        else:
            print("\nAuthenticated, but no YouTube channel found for this account.")
            print("You may need to create a YouTube channel first.")

    except Exception as e:
        print(f"\nAuthentication verified (token saved), but channel check failed: {e}")


def main():
    print("Starting YouTube authentication...")
    creds = authenticate()
    verify_auth(creds)
    print("\n" + "=" * 60)
    print("Done! You can now use the YouTube API with the saved token.")
    print("=" * 60)


if __name__ == "__main__":
    main()
