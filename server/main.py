from groq import Groq
from fpdf import FPDF
import tempfile
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from flask import Flask, request, jsonify
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io
import gridfs

from bson import ObjectId
import csv
import smtplib
import pandas as pd
import smtplib
from flask import Flask, request, jsonify, send_file
import os
import io
from io import BytesIO  # <-- Add this line
import pymongo
from flask_cors import CORS
from bson.objectid import ObjectId
from docx2pdf import convert
import pythoncom

import gridfs
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from docx2pdf import convert
import pythoncom  # Add this import
import tempfile

app = Flask(__name__)

# Allow requests only from your frontend
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response



# MongoDB connection
MONGO_URI = "mongodb+srv://hasnain:hasnain123@cluster0.t2spioh.mongodb.net/"
client = pymongo.MongoClient(MONGO_URI)
db = client["pdf_storage"]  # Database name
fs = gridfs.GridFS(db)  # GridFS for storing PDFs

UPLOAD_FOLDER = './uploads'
PDF_FOLDER = './pdfs'
WORD_FOLDER = './word_files'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PDF_FOLDER'] = PDF_FOLDER
app.config['WORD_FOLDER'] = WORD_FOLDER



UPLOAD_FOLDER = './uploads'
TEMPLATE_FOLDER = './templates'
PDF_FOLDER = './pdfs'
WORD_FOLDER = './word_files'  # New folder for Word files
ALLOWED_EXTENSIONS = {'csv', 'json', 'xml', 'doc', 'docx'}  # Updated allowed extensions

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['TEMPLATE_FOLDER'] = TEMPLATE_FOLDER
app.config['PDF_FOLDER'] = PDF_FOLDER
app.config['WORD_FOLDER'] = WORD_FOLDER  # Add Word folder to config

# Create necessary folders
for folder in [UPLOAD_FOLDER, PDF_FOLDER, WORD_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Email Configuration
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_ADDRESS = "syedshhasnain7@gmail.com"
EMAIL_PASSWORD = "nntdloiflsrfaaag"

# Existing code remains the same...

def allowed_word_file(filename):
    """Check if uploaded file is a Word document"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'doc', 'docx'}

def convert_word_to_pdf_with_com(word_bytes):
    try:
        pythoncom.CoInitialize()
        with BytesIO(word_bytes) as word_stream, BytesIO() as pdf_stream:
            temp_word_path = "temp_word.docx"
            temp_pdf_path = "temp_pdf.pdf"
            
            with open(temp_word_path, "wb") as word_file:
                word_file.write(word_stream.getvalue())
            
            convert(temp_word_path, temp_pdf_path)
            
            with open(temp_pdf_path, "rb") as pdf_file:
                pdf_bytes = pdf_file.read()
            
            os.remove(temp_word_path)
            os.remove(temp_pdf_path)
            return pdf_bytes
    finally:
        pythoncom.CoUninitialize()

@app.route('/convert-word-to-pdf', methods=['POST'])
def convert_word_to_pdf():
    if 'file' not in request.files or 'user_id' not in request.form:
        return jsonify({"error": "File and userId are required"}), 400

    file = request.files['file']
    user_id = request.form['user_id']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_word_file(file.filename):
        return jsonify({"error": "Invalid file type. Please upload a Word document (.doc or .docx)"}), 400

    try:
        word_bytes = file.read()
        pdf_bytes = convert_word_to_pdf_with_com(word_bytes)
        pdf_filename = os.path.splitext(secure_filename(file.filename))[0] + '.pdf'
        
        pdf_id = fs.put(pdf_bytes, filename=pdf_filename, userId=user_id, type="converted")
        
        return jsonify({
            "message": "Conversion successful",
            "pdf_id": str(pdf_id)
        }), 200

    except Exception as e:
        error_message = str(e)
        print(f"Conversion error: {error_message}")
        return jsonify({"error": f"Conversion failed: {error_message}"}), 500


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Flask server is running!"})
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PDF_FOLDER):
    os.makedirs(PDF_FOLDER)

# Configure Groq API Key
GROQ_API_KEY = "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"
os.environ["GROQ_API_KEY"] = GROQ_API_KEY
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def load_template(template_name):
    template_path = os.path.join(app.config['TEMPLATE_FOLDER'], f"{template_name}.txt")
    if os.path.exists(template_path):
        with open(template_path, 'r') as template_file:
            return template_file.read()
    return None


def populate_template_with_groq(template, user_content):
    # Set the system prompt
    system_prompt = {
        "role": "system",
        "content": "You are a document generator. Your task is to merge the provided template and user content to generate a polished document. Only output the final document text without any additional explanations or introductions."
    }

    # Initialize chat history
    chat_history = [system_prompt]

    # Add user input to chat history
    chat_history.append({"role": "user", "content": f"Template: {template}\n\nUser Data: {user_content}"})

    # Request Groq's LLaMA model
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=chat_history,
        max_tokens=500,
        temperature=1.2
    )

    # Extract response content
    generated_output = response.choices[0].message.content
    return generated_output


def generate_pdf(content):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Split content into paragraphs and handle line wrapping
    lines = content.splitlines()
    line_height = 10  # Height of each line
    for line in lines:
        if len(line.strip()) == 0:
            pdf.ln(line_height)  # Add extra spacing for blank lines
        else:
            pdf.multi_cell(0, line_height, txt=line)

    # Generate PDF as bytes
    pdf_bytes = pdf.output(dest='S').encode('latin1')  # Generate as bytes

    return BytesIO(pdf_bytes)  # Return BytesIO object

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files or 'template' not in request.form or 'user_id' not in request.form:
        return jsonify({"error": "File, template selection, and user ID are required"}), 400

    file = request.files['file']
    template_name = request.form['template']
    user_id = request.form['user_id']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    # Secure filename and save file
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    # Load the selected template
    template_content = load_template(template_name)
    if not template_content:
        return jsonify({"error": "Template not found"}), 400

    try:
        # Read user content safely
        with open(file_path, 'rb') as uploaded_file:
            user_content = uploaded_file.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500

    # Populate the template using Groq
    populated_template = populate_template_with_groq(template_content, user_content)

    # Generate PDF as a BytesIO object from the populated template
    pdf_filename = f"{template_name}_{os.path.splitext(filename)[0]}.pdf"
    pdf_buffer = generate_pdf(populated_template)  # Now returns BytesIO object

    # Store the PDF in MongoDB GridFS
    pdf_id = fs.put(pdf_buffer.getvalue(), filename=pdf_filename, userId=user_id, type="populated")

    # Respond with the populated template and PDF ID for retrieval
    response_data = {
        "message": "Template populated successfully!",
        "populated_template": populated_template,
        "pdf_url": str(pdf_id),  # Use absolute URL
        "pdf_id": str(pdf_id)  # Return the GridFS ObjectId as a string
    }

    return jsonify(response_data), 200

@app.route('/download/<pdf_id>', methods=['GET'])
def download_pdf(pdf_id):
    try:
        pdf_file = fs.get(ObjectId(pdf_id))
        return send_file(BytesIO(pdf_file.read()), 
                         download_name=pdf_file.filename, 
                         as_attachment=True)
    except gridfs.errors.NoFile:
        return jsonify({"error": "File not found"}), 404

def send_email(recipient_email, pdf_path, cc_emails=None, subject="Your Generated PDF", body="Please find the attached PDF."):
    try:
        # Create the email object
        message = MIMEMultipart()
        message['From'] = EMAIL_ADDRESS
        message['To'] = recipient_email
        message['Subject'] = subject

        if cc_emails:
            message['Cc'] = ', '.join(cc_emails)  # Add CC recipients

        # Attach the email body
        message.attach(MIMEText(body, 'plain'))

        # Attach the PDF file
        with open(pdf_path, 'rb') as attachment:
            mime_base = MIMEBase('application', 'octet-stream')
            mime_base.set_payload(attachment.read())
            encoders.encode_base64(mime_base)
            mime_base.add_header('Content-Disposition', f'attachment; filename={os.path.basename(pdf_path)}')
            message.attach(mime_base)

        # Create recipient list including CC emails
        recipients = [recipient_email] + (cc_emails if cc_emails else [])

        # Connect to the email server and send the email
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()  # Upgrade to a secure encrypted connection
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, recipients, message.as_string())

        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False



@app.route('/send-email', methods=['POST'])
def send_email_endpoint():
    data = request.get_json()
    recipient_email = data.get('email')
    cc_emails = data.get('ccEmails', [])
    pdf_id = data.get('pdf_id')

    if not recipient_email or not pdf_id:
        return jsonify({"error": "Email address and PDF ID are required"}), 400

    # ✅ Find the file using ObjectId
    file_doc = db.fs.files.find_one({"_id": ObjectId(pdf_id)})

    if not file_doc:
        return jsonify({"error": "PDF file not found in database"}), 404

    file_data = fs.get(ObjectId(pdf_id)).read()
    
    # ✅ Save the PDF to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        temp_pdf.write(file_data)
        temp_pdf_path = temp_pdf.name  # ✅ Get the temporary file path

    # ✅ Send email with the temp file path
    email_sent = send_email(recipient_email, temp_pdf_path, cc_emails)

    # ✅ Clean up: Delete the temp file after sending the email
    os.remove(temp_pdf_path)

    if email_sent:
        return jsonify({"message": "Email sent successfully!"}), 200
    else:
        return jsonify({"error": "Failed to send email"}), 500





@app.route('/pdfs/<user_id>', methods=['GET'])
def get_pdfs(user_id):
    try:
        word_to_pdf_files = []
        template_pdfs = []

        # Fetch all PDFs belonging to the user
        pdfs = db.fs.files.find({"userId": user_id})  # Correct field name (case-sensitive!)

        for pdf in pdfs:
            pdf_data = {
                "filename": pdf["filename"],
                "pdf_id": str(pdf["_id"]),
                "type": pdf.get("type", "unknown"),
                "uploadDate": pdf.get("uploadDate", ""),
            }

            # Categorize files
            if pdf_data["type"] == "converted":
                word_to_pdf_files.append(pdf_data)
            elif pdf_data["type"] == "populated":
                template_pdfs.append(pdf_data)

        return jsonify({
            "word_to_pdf": word_to_pdf_files,
            "template_pdfs": template_pdfs
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500




def generate_pdf_bulk(student_name, student_id, criteria, max_grade, grades, feedback):
    """Generates a PDF with student details and returns it as a BytesIO object."""
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)

    # PDF Content
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, 750, "Student Report")
    c.setFont("Helvetica", 12)
    c.drawString(100, 730, f"Name: {student_name}")
    c.drawString(100, 710, f"Student ID: {student_id}")
    c.drawString(100, 690, f"Criteria: {criteria}")
    c.drawString(100, 670, f"Max Grade: {max_grade}")  # Added Max Grade
    c.drawString(100, 650, f"Student Grade: {grades}")
    c.drawString(100, 630, f"Feedback: {feedback}")

    c.showPage()
    c.save()
    pdf_buffer.seek(0)  # Move cursor to the beginning of the file
    return pdf_buffer


def send_email_bulk(recipient_email, pdf_buffer, filename, student_name):
    """Sends an email with the generated PDF as an attachment."""
    try:
        message = MIMEMultipart()
        message["From"] = EMAIL_ADDRESS
        message["To"] = recipient_email
        message["Subject"] = f"Your Report Card - {student_name}"

        body = f"Dear {student_name},\n\nPlease find your attached report card.\n\nBest regards,\nYour University"
        message.attach(MIMEText(body, "plain"))

        # Attach PDF
        part = MIMEBase("application", "octet-stream")
        part.set_payload(pdf_buffer.read())
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
        message.attach(part)

        # Send email
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, recipient_email, message.as_string())

        return True
    except Exception as e:
        print(f"Error sending email to {recipient_email}: {e}")
        return False


@app.route("/bulk-generate", methods=["POST"])
def bulk_generate():
    """Reads student data from a CSV, generates PDFs, and emails them."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files are allowed"}), 400

    try:
        # Read CSV file
        df = pd.read_csv(file)
        required_columns = ["name", "email", "student_id", "criteria", "max_grade", "grades", "feedback"]
        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": f"CSV must contain {', '.join(required_columns)}"}), 400

        success_count = 0
        failed_count = 0

        for _, row in df.iterrows():
            student_name = row["name"]
            student_id = row["student_id"]
            recipient_email = row["email"]
            criteria = row["criteria"]
            max_grade = row["max_grade"]  # Added Max Grade
            grades = row["grades"]
            feedback = row["feedback"]

            # Generate PDF
            pdf_buffer = generate_pdf_bulk(student_name, student_id, criteria, max_grade, grades, feedback)

            # Store PDF in MongoDB
            pdf_id = fs.put(pdf_buffer.getvalue(), filename=f"{student_name}_report.pdf")

            # Send email
            pdf_buffer.seek(0)  # Reset buffer position for reading
            email_sent = send_email_bulk(recipient_email, pdf_buffer, f"{student_name}_report.pdf", student_name)

            if email_sent:
                success_count += 1
            else:
                failed_count += 1

            # Reset buffer for next iteration
            pdf_buffer.close()

        return jsonify({
            "message": f"Bulk generation completed. {success_count} emails sent, {failed_count} failed."
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



def create_feedback_pdf(template_values):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30
    )
    
    elements = []
    
    # Add title
    elements.append(Paragraph("Course Feedback Report", header_style))
    elements.append(Spacer(1, 12))
    
    # Student information
    student_info = [
        ["Student Name:", template_values['student_name']],
        ["Student ID:", template_values['student_id']],
    ]
    
    student_table = Table(student_info, colWidths=[100, 400])
    student_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    
    elements.append(student_table)
    elements.append(Spacer(1, 20))
    
    # Assessment Criteria
    elements.append(Paragraph("Assessment Criteria:", styles['Heading2']))
    elements.append(Paragraph(template_values['criteria'], styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Grades
    elements.append(Paragraph("Grades:", styles['Heading2']))
    elements.append(Paragraph(f"Maximum Grade: {template_values['max_grade']}", styles['Normal']))
    elements.append(Paragraph(template_values['grades'], styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Feedback
    elements.append(Paragraph("Detailed Feedback:", styles['Heading2']))
    elements.append(Paragraph(template_values['feedback'], styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

@app.route('/generate-feedback', methods=['POST'])
def generate_feedback():
    try:
        data = request.json
        template_values = data['templateValues']
        user_id = data.get('user_id')  # ✅ Read from the request body
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Generate PDF
        pdf_buffer = create_feedback_pdf(template_values)
        
        # Create filename
        filename = f"feedback_{template_values['student_name'].replace(' ', '_')}.pdf"
        
        # Store in GridFS with metadata matching the schema
        file_id = fs.put(
            pdf_buffer,
            filename=filename,
            userId=user_id,
            type="populated",
            chunkSize=261120,  # Matching your schema's chunk size
        )
        
        return jsonify({
            'message': 'Feedback generated successfully',
            'pdf_id': str(file_id),
            'feedback': template_values['feedback'],
            'pdfUrl': f'/download/{str(file_id)}'
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Failed to generate feedback'}), 500



if __name__ == '__main__':
    app.run(debug=True)
