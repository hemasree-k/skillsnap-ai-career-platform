import io
from pypdf import PdfReader

class PDFService:
    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        """
        Extracts raw text content from PDF file bytes.
        """
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            reader = PdfReader(pdf_file)
            text_content = []
            
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text)
                    
            return "\n".join(text_content).strip()
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            raise ValueError(f"Failed to parse PDF resume: {str(e)}")
