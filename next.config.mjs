const browserConfig = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_HOME_URL',
  'VITE_WORKSPACE_URL',
  'VITE_APK_URL',
];

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? 'dist/workspace' : '.next',
  webpack(config, { webpack }) {
    config.plugins.push(new webpack.DefinePlugin(Object.fromEntries(
      browserConfig.map((key) => [
        'import.meta.env.' + key,
        JSON.stringify(process.env[key] ?? ''),
      ]),
    )));
    return config;
  },
};

export default config;
