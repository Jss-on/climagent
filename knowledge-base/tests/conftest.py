import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import tempfile
import shutil
from app.main import app

@pytest.fixture
def test_client():
    return TestClient(app)

@pytest.fixture
def mock_cohere():
    with patch('cohere.Client') as mock:
        # Mock rerank method
        mock.return_value.rerank.return_value = [
            Mock(
                document={"text": "Test content"},
                relevance_score=0.95
            )
        ]
        yield mock

@pytest.fixture
def mock_embeddings():
    with patch('langchain.embeddings.CohereEmbeddings') as mock:
        mock.return_value.embed_query.return_value = [0.1] * 384  # Mock embedding vector
        mock.return_value.embed_documents.return_value = [[0.1] * 384]  # Mock document embeddings
        yield mock

@pytest.fixture
def test_dir():
    # Create a temporary directory
    test_dir = tempfile.mkdtemp()
    os.environ['UPLOAD_DIR'] = os.path.join(test_dir, 'uploads')
    os.environ['DB_PATH'] = os.path.join(test_dir, 'lancedb')
    os.makedirs(os.environ['UPLOAD_DIR'], exist_ok=True)
    
    yield test_dir
    
    # Cleanup after tests
    shutil.rmtree(test_dir)

@pytest.fixture
def sample_pdf():
    content = b"%PDF-1.7\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Test PDF Content) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000254 00000 n\n0000000332 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n427\n%%EOF"
    
    # Create a temporary PDF file
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        temp_file.write(content)
        temp_file.flush()
        yield temp_file.name
    
    # Cleanup
    os.unlink(temp_file.name)

@pytest.fixture
def sample_docx():
    from docx import Document
    
    # Create a temporary DOCX file
    doc = Document()
    doc.add_paragraph("Test DOCX Content")
    
    with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as temp_file:
        doc.save(temp_file.name)
        yield temp_file.name
    
    # Cleanup
    os.unlink(temp_file.name)

@pytest.fixture
def sample_txt():
    content = "Test TXT Content"
    
    # Create a temporary text file
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
        temp_file.write(content.encode())
        temp_file.flush()
        yield temp_file.name
    
    # Cleanup
    os.unlink(temp_file.name)
