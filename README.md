# PDF Generator - Full Stack Project

This project allows users to upload datasets, generate PDFs using predefined templates, and send emails with the generated documents. The system consists of a **React frontend** and a **Flask backend**.

## Features
- Upload CSV, JSON, or XML files
- Choose a predefined template
- Generate a PDF from the dataset
- Download or email the generated PDF

---

## 🚀 Getting Started
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/your-repo/pdf-generator.git
cd pdf-generator
```

## 🔧 Backend Setup (Flask)
### 2️⃣ Create a Virtual Environment
Navigate to the backend folder:
```sh
cd backend
```
Create a virtual environment:
```sh
python -m venv venv
```
Activate the virtual environment:
- **Windows:**
  ```sh
  venv\Scripts\activate
  ```
- **Mac/Linux:**
  ```sh
  source venv/bin/activate
  ```

### 3️⃣ Install Dependencies
```sh
pip install -r requirements.txt
```

### 4️⃣ Set Up Environment Variables
Create a `.env` file in the `backend/` directory and add:
```
FLASK_APP=app.py
FLASK_ENV=development
EMAIL_HOST=smtp.yourmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
```

### 5️⃣ Run the Backend Server
```sh
flask run
```
The backend will run on `http://127.0.0.1:5000`

---

## 🎨 Frontend Setup (React)
### 6️⃣ Navigate to the Frontend Directory
```sh
cd ../frontend
```

### 7️⃣ Install Dependencies
```sh
npm install
```

### 8️⃣ Start the Frontend
```sh
npm start
```
The frontend will run on `http://localhost:3000`

---

## 📤 API Endpoints
| Endpoint                | Method | Description |
|-------------------------|--------|-------------|
| `/upload`              | POST   | Uploads a file and generates a PDF |
| `/send-email`          | POST   | Sends the generated PDF via email |

---

## ✅ Deployment
### Backend (Flask)
```sh
pip install gunicorn
```
Run:
```sh
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend (React)
```sh
npm run build
```
Host the contents of the `build/` folder on a web server.

---

## 📌 Notes
- Ensure your email service supports SMTP for sending emails.
- Update `CORS` settings in Flask if deploying to a different domain.
- Use `.env` to store sensitive credentials securely.

---

## 🛠 Troubleshooting
If you face permission issues on Mac/Linux:
```sh
chmod +x venv/bin/activate
```
If `npm start` fails, try:
```sh
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

### 🎉 Enjoy your PDF Generator!

