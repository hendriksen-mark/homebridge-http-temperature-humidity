from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import random

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        temperature = round(random.uniform(0.0, 100.0), 1)
        humidity = round(random.uniform(0.0, 100.0), 1)
        print(f"Generated temperature: {temperature}°C, humidity: {humidity}%")
        response = {
            "temperature": temperature,
            "humidity": humidity
        }
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))

if __name__ == "__main__":
    server_address = ('', 8000)  # Listen on all interfaces, port 8000
    httpd = HTTPServer(server_address, SimpleHandler)
    print("Serving on port 8000...")
    httpd.serve_forever()
