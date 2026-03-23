from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def hello_world():
    return '''
    <h1>CourseFlow - AI-Powered Course Management</h1>
    <p>Welcome to CourseFlow! The application is running successfully.</p>
    '''

@app.route('/health')
def health_check():
    return {'status': 'healthy'}, 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)