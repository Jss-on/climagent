# Knowledge Base Service

This service handles document uploads (PDF, DOCX, and TXT files), processes them, and stores their content in a vector database using LanceDB with Cohere embeddings and reranking.

## Features

- Upload PDF, DOCX, and TXT files
- Automatic text extraction from documents
- Text chunking using Langchain's RecursiveCharacterTextSplitter
- Vector embeddings generation using Cohere's multilingual model
- Vector storage using LanceDB with Langchain integration
- Semantic search with Cohere reranking
- Document deletion with corresponding vector data cleanup

## Docker Setup

### Prerequisites

- Docker and Docker Compose installed
- Cohere API key

### Running the Service

1. Create a `.env` file with your Cohere API key:
```bash
COHERE_API_KEY=your_cohere_api_key_here
```

2. Build and start the service:
```bash
docker-compose up app
```

The service will be available at `http://localhost:8000`

### Running Tests

Run the tests in a Docker container:
```bash
docker-compose up test
```

### Development Setup

If you prefer to run the service without Docker:

1. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
cd app
uvicorn main:app --reload
```

## API Endpoints

### Upload Document
- **URL**: `/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameter**: `file` (PDF, DOCX, or TXT file)

### Search Documents
- **URL**: `/search`
- **Method**: `GET`
- **Parameters**: 
  - `query` (string): The search query
  - `limit` (integer, optional): Maximum number of results (default: 5)

### Delete Document
- **URL**: `/document/{filename}`
- **Method**: `DELETE`
- **Parameter**: `filename` (name of the file to delete)

## Project Structure
```
knowledge-base/
├── app/
│   └── main.py
├── tests/
│   ├── conftest.py
│   └── test_main.py
├── uploads/        # Directory for stored documents
├── lancedb/        # Vector database storage
├── Dockerfile      # Main service Dockerfile
├── Dockerfile.test # Testing Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env           # Environment variables
```

## Notes
- Uploaded files are stored in the `uploads` directory
- Vector embeddings are stored in LanceDB
- The service uses Cohere's embed-multilingual-v3.0 model for embeddings
- Search results are reranked using Cohere's rerank-v3.5 model
- Text is split into chunks with 200-token overlap for better context preservation
