from flask import Flask, request, jsonify, send_file
import os
from flask_cors import CORS
from groq import Groq
from fpdf import FPDF
from werkzeug.utils import secure_filename


import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders



app = Flask(__name__)

# Allow requests from your frontend
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

UPLOAD_FOLDER = './uploads'
TEMPLATE_FOLDER = './templates'
PDF_FOLDER = './pdfs'
ALLOWED_EXTENSIONS = {'csv', 'json', 'xml'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['TEMPLATE_FOLDER'] = TEMPLATE_FOLDER
app.config['PDF_FOLDER'] = PDF_FOLDER



# Email Configuration
EMAIL_HOST = "smtp.gmail.com"  # Use your email provider's SMTP server
EMAIL_PORT = 587
EMAIL_ADDRESS = "syedshhasnain7@gmail.com"  # Replace with your email address
EMAIL_PASSWORD = "nntdloiflsrfaaag"  # Replace with your email password




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


def generate_pdf(content, filename):
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

    # Save the PDF file
    pdf_path = os.path.join(app.config['PDF_FOLDER'], filename)
    pdf.output(pdf_path)
    return pdf_path

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files or 'template' not in request.form:
        return jsonify({"error": "File and template selection are required"}), 400

    file = request.files['file']
    template_name = request.form['template']

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

    # Generate PDF from the populated template
    pdf_filename = f"{template_name}_{os.path.splitext(filename)[0]}.pdf"
    pdf_path = generate_pdf(populated_template, pdf_filename)  # Use returned correct path


    # Respond with the populated template and PDF download link
    response_data = {
        "message": "Template populated successfully!",
        "populated_template": populated_template,
        "pdf_url": f"/download/{pdf_filename}"
    }

    return jsonify(response_data), 200


@app.route('/download/<filename>', methods=['GET'])
def download_pdf(filename):
    pdf_path = os.path.abspath(os.path.join(app.config['PDF_FOLDER'], filename))  # Use absolute path

    if os.path.exists(pdf_path):
        return send_file(pdf_path, as_attachment=True)
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
    cc_emails = data.get('ccEmails', [])  # Get CC emails as a list
    pdf_filename = data.get('pdf_filename')

    if not recipient_email or not pdf_filename:
        return jsonify({"error": "Email address and PDF filename are required"}), 400

    pdf_path = os.path.join(app.config['PDF_FOLDER'], pdf_filename)
    if not os.path.exists(pdf_path):
        return jsonify({"error": "PDF file not found"}), 404

    # Send the email with CC recipients
    email_sent = send_email(recipient_email, pdf_path, cc_emails)

    if email_sent:
        return jsonify({"message": "Email sent successfully!"}), 200
    else:
        return jsonify({"error": "Failed to send email"}), 500





if __name__ == '__main__':
    app.run(debug=True)
