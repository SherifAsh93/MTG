module.exports = {
  apps: [{
    name: 'ahmed-elakad-live',
    cwd: '/home/sherif/sites/ahmed-elakad-releases/20261008-imagesfix',
    script: '/home/sherif/sites/ahmed-elakad-releases/20261008-imagesfix/node_modules/next/dist/bin/next',
    args: ['start', '-H', '127.0.0.1', '-p', '3002'],
    interpreter: '/usr/bin/node',
    env: {
      NODE_ENV: 'production',
      NEXT_DIST_DIR: '.next-imagesfix',
      MEDIA_CACHE_DIR: '/home/sherif/data/ahmed-elakad/media-cache',
      MEDIA_ORIGINALS_DIR: '/home/sherif/data/ahmed-elakad/media-originals',
    },
  }],
};
