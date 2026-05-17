# Prophet Path Live

This is the Kahoot-style version: a TV host screen plus team devices.

## Required Firebase Setup

GitHub Pages can host the files, but live device syncing needs a backend. This app uses Firebase Realtime Database.

1. Create a Firebase project.
2. Add a Web App in the Firebase project settings.
3. Create a Realtime Database.
4. For a short camp activity, use temporary test rules:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

5. Open the live app and paste the Firebase web config object.
6. Use the TV as the host screen and have each team join with the game code.

Do not leave open read/write rules enabled after the event.
