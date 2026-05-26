# GradeOps: Precision AI Grading with Human Oversight

GradeOps is a professional-grade multimodal grading engine designed to integrate AI-driven speed with rigorous academic integrity. By utilizing a multi-agent AI pipeline and a mandatory Human-in-the-Loop (HITL) review stage, GradeOps enables the processing of extensive handwritten exam batches while ensuring that instructors and TAs maintain final authority over every score.

---

## Core Workflow

The GradeOps system follows a structured, sequential workflow:

1.  **Ingestion**: Instructors upload a multi-student PDF and a corresponding rubric in JSON format.
2.  **Segmentation**: The system automatically partitions the PDF into individual student records based on the rubric's page-per-student settings.
3.  **Transcription (OCR)**: A Vision model (Gemini Flash) transcribes handwritten responses into structured digital text.
4.  **Automated Grading**: A reasoning model (Llama3 via Groq or Gemini Pro) evaluates answers against specific rubric criteria, generating a justification for each awarded mark.
5.  **Human Review**: Teaching Assistants (TAs) access a specialized dashboard to verify AI-proposed grades. They can approve, override, or escalate cases to the Instructor.
6.  **Finalization**: The system aggregates data, performs class-level statistical analysis, and generates a downloadable gradebook in CSV and JSON formats.

---

## Primary Features

*   **Handwriting Intelligence**: Processes scanned handwritten exams directly using advanced Vision-Language Models (VLM).
*   **Role-Based Access Control (RBAC)**: Secure access levels for Instructors (management and reporting) and TAs (review and grading).
*   **Cloud-Native Persistence**: Optimized for serverless environments like Vercel. Large binary files are stored in MongoDB GridFS, ensuring a stateless and cost-effective operation.
*   **Checkpoint Resilience**: Powered by LangGraph persistence. The AI pipeline can resume exactly where it stopped following any server restart or interruption.
*   **Real-Time Data Sync**: A parallelized backend architecture ensuring that progress metrics and class statistics are synchronized instantly across the team.

---

## Repository Structure

The project is organized into a modular architecture to separate concerns between AI logic, server operations, and the user interface.

```text
├── api/                 # Vercel serverless function entry points
├── css/                 # Global styles and component design system
├── js/                  # Frontend logic and UI management
│   ├── api/             # API communication layer (Auth, Exams, Rubrics)
│   ├── components/      # Reusable UI elements (Sidebar, Toasts)
│   ├── pages/           # Page-specific rendering logic (Dashboard, Upload, Review)
│   ├── router.js        # Security-aware navigation and role-based routing
│   ├── state.js         # Centralized application state management
│   └── main.js          # Application bootstrapper and global event handlers
├── pipeline/            # Backend grading engine (Python/FastAPI)
│   ├── agents/          # AI agent logic (Ingestion, OCR, Grading, Finalize)
│   ├── server/          # FastAPI routes, DB client, and WebSocket manager
│   ├── tools/           # Core utilities (Storage abstraction, PDF splitting)
│   ├── schemas/         # Pydantic data models for validation and AI output
│   └── state.py         # AI state machine definition (LangGraph)
├── README.md            # Project documentation
├── vercel.json          # Production deployment and routing configuration
└── package.json         # Frontend dependencies and dev scripts
```

---

## Operational Guide

### For Instructors
*   **Management**: Create courses and define grading rubrics using the Rubric Manager.
*   **Initiation**: Upload scanned exam PDFs. Select the appropriate course and rubric to start the AI pipeline.
*   **Oversight**: Monitor the progress of all active grading batches from the Instructor Dashboard.
*   **Reporting**: Export finalized gradebooks and view class performance analytics once TA reviews are complete.

### For TAs
*   **Review**: Access the "Review Queue" to see students processed by the AI.
*   **Verification**: Compare the handwritten answer image against the AI's transcription and score.
*   **Decision**: Use keyboard shortcuts (A for Approve, O for Override, E for Escalate) to move through the queue efficiently.

---

## Safety and Data Integrity

GradeOps prioritizes security and transparency:
*   **Human Authority**: The system is physically blocked from finalizing grades without a verified human decision.
*   **Justification Logs**: Every AI score is accompanied by a verbatim reference to the rubric, eliminating "black box" grading.
*   **Encrypted Authentication**: User passwords are secured with bcrypt hashing.
*   **Session Security**: All API communication is protected by signed JSON Web Tokens (JWT).

---

## Simple Setup for New Users

If you are new to the project and want to run it on your own computer, follow these four steps:

1.  **Install Python**: Ensure you have Python 3.12 or newer installed. You can download it from python.org.
2.  **Get a Free API Key**: 
    *   Visit the Google AI Studio (aistudio.google.com).
    *   Generate a free API key for "Gemini 1.5 Flash". This allows the AI to read your exam scans.
3.  **Configure the App**:
    *   Open the `pipeline` folder and look for a file named `.env.example`.
    *   Rename it to `.env`.
    *   Open it with a text editor and paste your API key next to `GOOGLE_API_KEY=`.
    *   (Optional) If you have a MongoDB cluster, paste your URI next to `MONGO_URI=`. Otherwise, it will save files to your computer.
4.  **Run the System**:
    *   Open your terminal/command prompt in the project folder.
    *   Run `./pipeline/start_server.sh` (Linux/Mac) or `/pipeline/start_server.bat` (Windows).
    *   Open your browser and go to `http://localhost:8000`.

---

## Technical Setup

### Local Development
1. Clone the repository and install Python 3.12+.
2. Install dependencies: `pip install -r pipeline/requirements.txt`.
3. Configure the `.env` file with your MongoDB URI, Google/Groq API keys, and a random JWT Secret.
4. Launch the backend: `python -m uvicorn pipeline.server.app:app --reload`.
5. Serve the frontend: `npx serve`.

### Vercel Deployment
1. Connect your repository to Vercel.
2. Add the required environment variables in the Vercel Dashboard.
3. Set `STORAGE_BACKEND=mongodb` to enable GridFS storage.
4. Ensure your Vercel Function region is set to match your MongoDB Atlas cluster location for optimal performance.

---

*GradeOps: Advanced grading architecture for modern education.*
