# Vercel Deployment Guide for GradeOps

Since Vercel has a read-only filesystem, we have migrated GradeOps to be **completely stateless**. All data and files are now stored in your MongoDB Atlas cluster.

## 1. MongoDB Setup (Atlas)
You already have a MongoDB Atlas cluster. This will now store both your metadata (courses, exams) and your files (PDFs, images) using **GridFS**.

1. Ensure your MongoDB URI is ready: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/GradeOps`
2. No extra configuration is needed in Atlas; GridFS works automatically.

## 2. Environment Variables in Vercel
When you import your project into Vercel, go to **Settings > Environment Variables** and add:

| Key | Value |
|:--- |:--- |
| `MONGO_URI` | `mongodb+srv://...` (your full URI) |
| `DB_NAME` | `GradeOps` |
| `JWT_SECRET_KEY` | (A long random string for security) |
| `STORAGE_BACKEND` | `mongodb` |
| `GOOGLE_API_KEY` | (Your Gemini API Key) |
| `PYTHONPATH` | `.` |

## 3. Local Development vs. Production
- **Local**: You can continue using `STORAGE_BACKEND=local`. Files will go to `./scratch`.
- **Production (Vercel)**: You MUST use `STORAGE_BACKEND=mongodb`. Files will go to Atlas (GridFS).

## 4. Deployment Steps
1. Push your code to GitHub.
2. Connect your repo to Vercel.
3. Vercel will detect the `vercel.json` and `api/index.py` files I created.
4. It will automatically install dependencies from `pipeline/requirements.txt`.
5. Your frontend and backend will be served from the same Vercel URL.

## Technical Changes Made for Vercel:
- **GridFS Integration**: Large binary files are now streamed directly to/from MongoDB.
- **Proxy Serving**: Added `/api/storage/file` to serve database assets to the browser.
- **Stateless OCR**: The AI grading pipeline now reads images from the database instead of the local disk.
- **API Base Logic**: The frontend now automatically detects if it's running on Vercel or localhost and routes requests correctly.
