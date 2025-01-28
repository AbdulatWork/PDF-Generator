from flask import Flask, request, jsonify
import os
from flask_cors import CORS  # Import CORS
from groq import Groq

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


UPLOAD_FOLDER = './uploads'
TEMPLATE_FOLDER = './templates'
ALLOWED_EXTENSIONS = {'csv', 'json', 'xml'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['TEMPLATE_FOLDER'] = TEMPLATE_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

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
        "content": "You are a document generator. Merge the provided template and user content to generate a polished document."
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

    # Save the uploaded file
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    # Load the selected template
    template_content = load_template(template_name)
    if not template_content:
        return jsonify({"error": "Template not found"}), 400

    # Read user content from the uploaded file
    with open(file_path, 'r') as uploaded_file:
        user_content = uploaded_file.read()

    # Populate the template using Groq
    populated_template = populate_template_with_groq(template_content, user_content)

    # Respond with the populated template
    response_data = {
        "message": "Template populated successfully!",
        "populated_template": populated_template
    }

    return jsonify(response_data), 200


if __name__ == '__main__':
    app.run(debug=True)
