import { Howl } from 'howler';

const isSoundEnabled = process.env.REACT_APP_ENABLE_SOUNDS === 'true';

const sounds = {
  click: null,
  success: null,
  error: null,
  notification: null,
};

export const initSounds = () => {
  if (!isSoundEnabled) return;

  try {
    sounds.click = new Howl({
      src: ['/sounds/click.mp3'],
      volume: 0.3,
    });

    sounds.success = new Howl({
      src: ['/sounds/success.mp3'],
      volume: 0.5,
    });

    sounds.error = new Howl({
      src: ['/sounds/error.mp3'],
      volume: 0.5,
    });

    sounds.notification = new Howl({
      src: ['/sounds/notification.mp3'],
      volume: 0.4,
    });
  } catch (error) {
    console.error("Error initializing sounds. Make sure sound files are in /public/sounds/", error);
  }
};

export const playSound = (soundName) => {
  if (!isSoundEnabled) return;
  
  const sound = sounds[soundName];
  if (sound) {
    sound.play();
  } else {
    console.warn(`Sound "${soundName}" not found or initialized.`);
  }
};

export const stopAllSounds = () => {
  if (!isSoundEnabled) return;
  Object.values(sounds).forEach(sound => {
    if (sound) sound.stop();
  });
};
