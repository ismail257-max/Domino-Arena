# Sound Effects

Download free sound effects from:
- https://pixabay.com/sound-effects/
- https://freesound.org/

## Required sounds:

1. **click.mp3** - Button click sound (short, subtle)
   - Search for: "button click", "UI click", "soft click"
   - Duration: < 0.5 seconds
   
2. **success.mp3** - Success notification (cheerful)
   - Search for: "success", "achievement", "win"
   - Duration: 1-2 seconds
   
3. **error.mp3** - Error notification (warning tone)
   - Search for: "error", "wrong", "buzzer"
   - Duration: 0.5-1 second
   
4. **notification.mp3** - General notification (neutral)
   - Search for: "notification", "alert", "ding"
   - Duration: 0.5-1 second

## Instructions:

1. Download the .mp3 files from the sites above
2. Rename them exactly as shown above
3. Place all .mp3 files in this directory (`public/sounds/`)
4. Restart your React app

## Optional:

If you don't have sound files yet, the app will still work fine. Sounds are optional.
You can enable/disable sounds in the `.env` file:

```env
REACT_APP_ENABLE_SOUNDS=true  # or false to disable
```
