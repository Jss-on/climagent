from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List
import tempfile
import shutil
from app.config import settings

from langchain.retrievers.contextual_compression import ContextualCompressionRetriever
from langchain_cohere import CohereRerank, CohereEmbeddings
from langchain_community.vectorstores import LanceDB
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader

# Initialize FastAPI app
app = FastAPI(title=settings.APP_TITLE, version="0.1.1")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=settings.ALLOW_CREDENTIALS,
    allow_methods=settings.ALLOW_METHODS,
    allow_headers=settings.ALLOW_HEADERS,
)

# Initialize embeddings
embeddings = CohereEmbeddings(
    model=settings.COHERE_EMBED_MODEL,
    cohere_api_key=settings.COHERE_API_KEY
)

# Initialize vector store and retriever
vector_store = LanceDB(
    uri=settings.DB_PATH,
    embedding=embeddings,
)

# Create the retriever with search parameters
retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={"k": settings.MAX_INITIAL_RESULTS}
)

# Initialize reranker
reranker = CohereRerank(
    model=settings.COHERE_RERANK_MODEL,
    cohere_api_key=settings.COHERE_API_KEY
)

# Create compression retriever
compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=retriever
)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    loader = PyPDFLoader(file_path)
    return "\n\n".join([page.page_content for page in loader.load()])

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    loader = Docx2txtLoader(file_path)
    return "\n\n".join([doc.page_content for doc in loader.load()])

def extract_text_from_txt(file_path: str) -> str:
    """Extract text from TXT file."""
    loader = TextLoader(file_path)
    return "\n\n".join([doc.page_content for doc in loader.load()])

@app.post("/upload")
async def upload_file(file: UploadFile):
    """Upload and process a document."""
    # Create temporary file
    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = temp_file.name
            content = await file.read()
            temp_file.write(content)
        
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(temp_path)
        elif file.filename.lower().endswith('.docx'):
            text = extract_text_from_docx(temp_path)
        elif file.filename.lower().endswith('.txt'):
            text = extract_text_from_txt(temp_path)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.filename}"
            )
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        texts = text_splitter.create_documents(
            [text],
            metadatas=[{"filename": file.filename}]
        )
        
        # Add to vector store
        vector_store.add_documents(texts)
        
        # Save the original file
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        shutil.move(temp_path, file_path)
        
        return {"message": "File processed successfully", "filename": file.filename}
    
    except Exception as e:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
async def search_documents(query: str, limit: int = settings.DEFAULT_SEARCH_LIMIT):
    """Search for documents using semantic search with Cohere reranking."""
    try:
        # Get reranked results using the compression retriever
        docs = compression_retriever.invoke(query)
        
        # Format results
        results = [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "relevance_score": 1.0  # Score not provided by retriever
            }
            for doc in docs[:limit]
        ]
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/document/{filename}")
async def delete_document(filename: str):
    """Delete a document and its vectors from the database."""
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Delete vectors from LanceDB using the correct filter syntax
        vector_store.delete(
            filter=f"metadata['filename'] = '{filename}'"  # Using the correct filter syntax
        )
        
        # Delete the file
        os.remove(file_path)
        
        return {"message": "Document and its vectors deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
