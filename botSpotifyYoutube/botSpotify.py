import json
import requests
import os

import scopes as scopes

from secrets import spotify_user_id
from secrets import spotify_token

import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors

import youtube_dl

class CreatePlaylist:
    def __init__(self):
        self.user_id = spotify_user_id
        self.spotify_token = spotify_token
        self.youtube_client = self.get_youtube_client()
        self.all_song_info = {}


    def get_youtube_client(self):
        # Disable OAuthlib's HTTPS verification when running locally.
        # *DO NOT* leave this option enabled in production.
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

        api_service_name = "youtube"
        api_version = "v3"
        client_secrets_file = "client_secret.json"

        scopes = ["https://www.googleapis.com/auth/youtube.readonly"]
        # Get credentials and create an API client
        flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(client_secrets_file, scopes)
        credentials = flow.run_console()
        youtube_client = googleapiclient.discovery.build(api_service_name, api_version, credentials=credentials)

        return youtube_client



    def get_liked_videos(self):
        request = self.youtube_client.videos().list(
            part="snipped,contentDetails,statistics",
            myRating="like"
        )

        response = request.execute()

        for item in response["items"]:
            video_title = item["snippet"]["title"]
            youtube_url = "https://www.youtube.com/watch?v={}".format(item["id"])

            video = youtube_dl.YoutubeDL({}).extract_info(youtube_url, download=False)

            song_name = video["track"]
            artist = video["artist"]

            self.all_song_info[video_title]={
                "youtube_url":youtube_url,
                "song_name":song_name,
                "artist":artist,

                "spotify_uri":self.get_spotify_uri(song_name, artist)

            }

    def create_playlist(self):

        request_body = json.dumps({
            "name": "Youtube bot",
            "description": "hahahaha",
            "public": True
        })

        query = "https://api.spotify.com/v1/users/{user_id}/playlists".format(self.user_id)

        response = requests.post(
            query,
            data=request_body,
            headers={
                "Content-type": "application/json",
                "Authorization": "Bearer {}".format(self.spotify_token)
            }
        )

        response_json = response.json()

        return response_json["id"]

    def get_spotify_uri(self, song_name, artist):

        query = "https://api.spotify.com/v1/search?query=track%2Cartist&market=US&limit=10&offset=5".format(
            song_name,
            artist
        )

        response = requests.get(
            query,
            headers={
                "Content-type": "application/json",
                "Authorization": "Bearer {}".format(self.spotify_token)
            }
        )

        response_json = response.json()
        songs = response_json["tracks"]["items"]

    def add_song_to_playlist(self):
        self.get_liked_videos()

        uris = []
        for song,info in self.all_song_info.items():
            uris.append(info["spotify_uri"])

        playlist_id =self.create_playlist()

        request_data = json.dumps()

        query = "https://api.spotify.com/v1/playlists/{}/tracks".format(playlist_id)

        response = requests.post(
            query,
            data=request_data,
            headers={
                "Content-type": "application/json",
                "Authorization": "Bearer {}".format(self.spotify_token)
            }
        )

        response_json = response.json()

        return response_json