<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DEBXzkzpMa1AV_n_3L_a5EnIJwuKuP_a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy on Railway

This app can be deployed on Railway as a Vite static build served with `vite preview`.

1. Push the repository to GitHub.
2. In Railway, create a new project from that GitHub repository.
3. In the Railway project variables, add `GEMINI_API_KEY`.
4. Deploy the project. Railway will use [railway.json](railway.json) to build and start the app.

Important:

- `GEMINI_API_KEY` is injected at build time.
- Because this project calls Gemini directly from the browser, the key ends up exposed to the client bundle.
- If you need the key to remain private, move the Gemini call to a backend or serverless function before deploying.
