#!/usr/bin/env python3
"""
Simple test server for Facebook Token Extractor results
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sqlite3
from datetime import datetime
import urllib.parse

class TokenExtractorHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            html = '''
            <!DOCTYPE html>
            <html>
            <head>
                <title>AI Buyer - Facebook Token Receiver</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .section { margin: 20px 0; padding: 15px; border-radius: 5px; }
                    .success { background: #d4edda; border: 1px solid #c3e6cb; }
                    .info { background: #d1ecf1; border: 1px solid #bee5eb; }
                    .token { font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 3px; margin: 5px 0; word-break: break-all; }
                    .account { background: #e7f3ff; padding: 8px; margin: 3px 0; border-radius: 3px; }
                    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                    .stat { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
                    .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 AI Buyer - Facebook Token Receiver</h1>
                        <p>Endpoint for receiving data from Chrome Extension</p>
                    </div>
                    
                    <div class="section info">
                        <h3>📊 Server Status</h3>
                        <p>✅ Server is running and ready to receive data</p>
                        <p>🔗 POST endpoint: <code>http://localhost:8100/receive</code></p>
                        <p>📝 Last updated: ''' + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '''</p>
                    </div>
                    
                    <div class="section">
                        <h3>🚀 How to use with Chrome Extension</h3>
                        <ol>
                            <li>Install the Chrome Extension (load unpacked from browser-extension/ folder)</li>
                            <li>Navigate to <a href="https://www.facebook.com/adsmanager/">Facebook Ads Manager</a></li>
                            <li>Click the extension popup and press "Extract Now"</li>
                            <li>Copy the extracted data and send it to this server</li>
                        </ol>
                    </div>
                    
                    <div id="latest-data"></div>
                </div>
                
                <script>
                    // Auto-refresh every 5 seconds to show new data
                    setInterval(() => {
                        fetch('/latest')
                            .then(response => response.json())
                            .then(data => {
                                if (data && data.success) {
                                    document.getElementById('latest-data').innerHTML = `
                                        <div class="section success">
                                            <h3>📋 Latest Extraction Results</h3>
                                            <p><strong>Received:</strong> ${data.data.timestamp}</p>
                                            ${data.data.accessToken ? '<div class="token">🔑 Access Token: ' + data.data.accessToken.substring(0, 30) + '...</div>' : ''}
                                            ${data.data.dtsgToken ? '<div class="token">🔐 DTSG Token: ' + data.data.dtsgToken.substring(0, 30) + '...</div>' : ''}
                                            ${data.data.adAccounts && data.data.adAccounts.length > 0 ? 
                                                '<h4>📊 Ad Accounts (' + data.data.adAccounts.length + '):</h4>' +
                                                data.data.adAccounts.map(acc => '<div class="account">' + acc + '</div>').join('') : 
                                                '<p>❌ No ad accounts found</p>'}
                                        </div>
                                    `;
                                }
                            })
                            .catch(err => console.log('No data yet'));
                    }, 5000);
                </script>
            </body>
            </html>
            '''
            self.wfile.write(html.encode())
            
        elif self.path == '/latest':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            try:
                conn = sqlite3.connect('ai_buyer.db')
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT extraction_data, created_at FROM token_extractions 
                    ORDER BY created_at DESC LIMIT 1
                """)
                result = cursor.fetchone()
                conn.close()
                
                if result:
                    data = json.loads(result[0])
                    self.wfile.write(json.dumps({
                        'success': True,
                        'data': data
                    }).encode())
                else:
                    self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                    
            except Exception as e:
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/receive':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Save to database
                self.save_extraction_data(data)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'success': True,
                    'message': 'Data received and saved',
                    'timestamp': datetime.now().isoformat(),
                    'received_items': {
                        'accessToken': bool(data.get('accessToken')),
                        'dtsgToken': bool(data.get('dtsgToken')),
                        'adAccounts': len(data.get('adAccounts', [])),
                        'apiAccounts': len(data.get('apiAccounts', []))
                    }
                }
                
                self.wfile.write(json.dumps(response).encode())
                print(f"✅ Received extraction data: {response['received_items']}")
                
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                error_response = {
                    'success': False,
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                }
                
                self.wfile.write(json.dumps(error_response).encode())
                print(f"❌ Error processing data: {e}")
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def save_extraction_data(self, data):
        """Save extraction data to database"""
        try:
            conn = sqlite3.connect('ai_buyer.db')
            cursor = conn.cursor()
            
            # Create table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS token_extractions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    extraction_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert data
            cursor.execute("""
                INSERT INTO token_extractions (extraction_data) 
                VALUES (?)
            """, (json.dumps(data),))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"Database error: {e}")

def main():
    server_address = ('', 8100)
    httpd = HTTPServer(server_address, TokenExtractorHandler)
    print(f"🚀 AI Buyer Token Receiver Server starting on http://localhost:8100")
    print(f"📊 Ready to receive data from Chrome Extension")
    print(f"🌐 Open http://localhost:8100 to view status")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped")

if __name__ == "__main__":
    main()