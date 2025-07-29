from flask import Flask, request, jsonify
from gpt4all import GPT4All

app = Flask(__name__)
model = GPT4All("ggml-gpt4all-j-v1.3-groovy.bin")
model.open()

@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    prompt = data.get("prompt", "")
    response = model.chat_completion(prompt=prompt)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(port=5005)
