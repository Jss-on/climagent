import pytest
from fastapi import UploadFile
from pathlib import Path
import os
import json

def test_upload_pdf(test_client, mock_cohere, mock_embeddings, test_dir, sample_pdf):
    # Ensure upload directory exists
    os.makedirs(os.environ['UPLOAD_DIR'], exist_ok=True)

    # Create file upload
    with open(sample_pdf, 'rb') as f:
        files = {'file': ('test.pdf', f, 'application/pdf')}
        response = test_client.post("/upload", files=files)
    
    assert response.status_code == 200
    assert response.json()["message"] == "File processed successfully"
    assert response.json()["filename"] == "test.pdf"
    
    # Check if file was saved
    assert os.path.exists(os.path.join(os.environ['UPLOAD_DIR'], 'test.pdf'))

def test_upload_docx(test_client, mock_cohere, mock_embeddings, test_dir, sample_docx):
    # Ensure upload directory exists
    os.makedirs(os.environ['UPLOAD_DIR'], exist_ok=True)

    with open(sample_docx, 'rb') as f:
        files = {'file': ('test.docx', f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        response = test_client.post("/upload", files=files)
    
    assert response.status_code == 200
    assert response.json()["message"] == "File processed successfully"
    assert response.json()["filename"] == "test.docx"
    
    assert os.path.exists(os.path.join(os.environ['UPLOAD_DIR'], 'test.docx'))

def test_upload_txt(test_client, mock_cohere, mock_embeddings, test_dir, sample_txt):
    # Ensure upload directory exists
    os.makedirs(os.environ['UPLOAD_DIR'], exist_ok=True)

    with open(sample_txt, 'rb') as f:
        files = {'file': ('test.txt', f, 'text/plain')}
        response = test_client.post("/upload", files=files)
    
    assert response.status_code == 200
    assert response.json()["message"] == "File processed successfully"
    assert response.json()["filename"] == "test.txt"
    
    assert os.path.exists(os.path.join(os.environ['UPLOAD_DIR'], 'test.txt'))

def test_upload_invalid_extension(test_client, test_dir):
    # Ensure upload directory exists
    os.makedirs(os.environ['UPLOAD_DIR'], exist_ok=True)

    # Try to upload a file with invalid extension
    content = b'test content'
    files = {'file': ('test.invalid', content, 'application/octet-stream')}
    response = test_client.post("/upload", files=files)
    
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]

def test_delete_document(test_client, mock_cohere, mock_embeddings, test_dir, sample_txt):
    # First upload a file
    with open(sample_txt, 'rb') as f:
        files = {'file': ('test.txt', f, 'text/plain')}
        response = test_client.post("/upload", files=files)
    
    assert response.status_code == 200
    
    # Then delete it
    response = test_client.delete("/document/test.txt")
    assert response.status_code == 200
    assert response.json()["message"] == "Document and its vectors deleted successfully"
    
    # Verify file is deleted
    assert not os.path.exists(os.path.join(os.environ['UPLOAD_DIR'], 'test.txt'))

def test_delete_nonexistent_document(test_client, test_dir):
    response = test_client.delete("/document/nonexistent.txt")
    assert response.status_code == 404
    assert "File not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_search_documents(test_client, mock_cohere, mock_embeddings, test_dir, sample_txt):
    # First upload a file
    with open(sample_txt, 'rb') as f:
        files = {'file': ('test.txt', f, 'text/plain')}
        response = test_client.post("/upload", files=files)
    
    assert response.status_code == 200
    
    # Test search
    response = test_client.get("/search", params={"query": "test query", "limit": 5})
    assert response.status_code == 200
    
    results = response.json()
    assert isinstance(results, list)
    assert len(results) > 0
    
    # Check result structure
    first_result = results[0]
    assert "content" in first_result
    assert "metadata" in first_result
    assert "relevance_score" in first_result
    assert isinstance(first_result["relevance_score"], float)

def test_search_with_no_documents(test_client, mock_cohere, mock_embeddings, test_dir):
    # Ensure the database is empty
    import shutil
    if os.path.exists(os.environ['DB_PATH']):
        shutil.rmtree(os.environ['DB_PATH'])
    os.makedirs(os.environ['DB_PATH'])

    response = test_client.get("/search", params={"query": "test query"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 0
