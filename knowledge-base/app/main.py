from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List
import tempfile
from pypdf import PdfReader
from docx import Document
import shutil
from dotenv import load_dotenv
from langchain.vectorstores import LanceDB
from langchain.embeddings import CohereEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
import lancedb
import cohere

# Load environment variables
load_dotenv()

app = FastAPI(title="Knowledge Base API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Cohere client and embeddings
co = cohere.Client(os.getenv("COHERE_API_KEY"))
embeddings = CohereEmbeddings(
    cohere_api_key=os.getenv("COHERE_API_KEY"),
    model="embed-multilingual-v3.0"
)

# Initialize LanceDB
UPLOAD_DIR = "uploads"
DB_PATH = "lancedb"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Connect to LanceDB
db = lancedb.connect(DB_PATH)

# Initialize vector store
vector_store = LanceDB(
    connection=db,
    embedding=embeddings,
    table_name="documents"
)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    doc = Document(file_path)
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

def extract_text_from_txt(file_path: str) -> str:
    """Extract text from TXT file."""
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def rerank_results(query: str, results: List[dict], limit: int = 5) -> List[dict]:
    """Rerank results using Cohere's rerank endpoint."""
    if not results:
        return []
    
    # Extract texts for reranking
    texts = [result["content"] for result in results]
    
    # Get reranked results from Cohere
    reranked = co.rerank(
        query=query,
        documents=texts,
        top_n=limit,
        model="rerank-v3.5"
    )
    
    # Create a mapping of original content to original result
    content_to_result = {r["content"]: r for r in results}
    
    # Reorder results based on reranking
    reranked_results = []
    for hit in reranked:
        original_result = content_to_result[hit.document["text"]]
        reranked_results.append({
            "content": hit.document["text"],
            "metadata": original_result["metadata"],
            "relevance_score": hit.relevance_score
        })
    
    return reranked_results

@app.post("/upload")
async def upload_file(file: UploadFile):
    """Upload and process a document."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file extension
    allowed_extensions = {'.pdf', '.docx', '.txt'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="File type not supported")
    
    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name
    
    try:
        # Extract text based on file type
        if file_ext == '.pdf':
            text = extract_text_from_pdf(temp_path)
        elif file_ext == '.docx':
            text = extract_text_from_docx(temp_path)
        else:  # .txt
            text = extract_text_from_txt(temp_path)
        
        # Create text splitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        # Split text into chunks
        chunks = text_splitter.split_text(text)
        
        # Add documents to vector store with metadata
        texts_with_metadata = [
            {"text": chunk, "metadata": {"filename": file.filename, "chunk_index": i}}
            for i, chunk in enumerate(chunks)
        ]
        vector_store.add_texts(
            texts=[d["text"] for d in texts_with_metadata],
            metadatas=[d["metadata"] for d in texts_with_metadata]
        )
        
        # Save the original file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        os.rename(temp_path, file_path)
        
        return {"message": "File processed successfully", "filename": file.filename}
    
    except Exception as e:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/document/{filename}")
async def delete_document(filename: str):
    """Delete a document and its vectors from the database."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Get the table
        table = vector_store.get_table()
        
        # Delete vectors from LanceDB using SQL filter
        table.delete(f"metadata->>'filename' = '{filename}'")
        
        # Delete the file
        os.remove(file_path)
        
        return {"message": "Document and its vectors deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
async def search_documents(query: str, limit: int = 5):
    """Search for documents using semantic search with Cohere reranking."""
    try:
        # First, get more results than needed for reranking
        results = vector_store.similarity_search_with_relevance_scores(
            query=query,
            k=min(limit * 3, 20)  # Get more results for reranking
        )
        
        # Format initial results
        initial_results = [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "relevance_score": score
            }
            for doc, score in results
        ]
        
        # Rerank results using Cohere
        reranked_results = rerank_results(query, initial_results, limit)
        
        return reranked_results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
