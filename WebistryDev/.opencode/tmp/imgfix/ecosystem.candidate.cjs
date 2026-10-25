module.exports = {
  apps: [{
    name: 'ahmed-elakad-candidate',
    cwd: '/home/sherif/sites/ahmed-elakad-releases/20261008-fastadmin',
    script: '/home/sherif/sites/ahmed-elakad-releases/20261008-fastadmin/node_modules/next/dist/bin/next',
    args: ['start', '-H', '127.0.0.1', '-p', '3003'],
    interpreter: '/usr/bin/node',
    env: {
      NODE_ENV: 'production',
      NEXT_DIST_DIR: '.next-fastadmin',
      MEDIA_CACHE_DIR: '/home/sherif/data/ahmed-elakad/media-cache',
      MEDIA_ORIGINALS_DIR: '/home/sherif/data/ahmed-elakad/media-originals',
    },
  }],
};
