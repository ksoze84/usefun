import typescript from 'rollup-plugin-typescript2'
export default [
  {
    input: './src/main.ts',
    output: {
      file: './lib/main.esm.js',
      format: 'esm',
    },
    plugins: [typescript()],
  },
  {
    input: './src/main.ts',
    output: {
      file: './lib/main.js',
      format: 'cjs',
    },
    plugins: [typescript()],
  },
]