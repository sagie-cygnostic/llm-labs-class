# Host for one learner submission. SDK calls are RPC lines on stdout.
# Learner prints are captured and cannot reach the protocol stream.
import io
import json
import os
import sys
import traceback

def _block_network():
    import socket
    import subprocess

    def nope(*_a, **_k):
        raise OSError("network blocked")

    socket.socket.connect = nope
    socket.socket.connect_ex = lambda self, *_a, **_k: 1
    socket.create_connection = nope
    socket.getaddrinfo = nope
    subprocess.Popen = nope
    subprocess.call = nope
    subprocess.run = nope
    subprocess.check_output = nope
    os.system = nope
    os.popen = nope

_block_network()

try:
    import resource
    resource.setrlimit(resource.RLIMIT_CPU, (3, 3))
    # Soft memory cap. Ignore if the platform rejects it.
    try:
        resource.setrlimit(resource.RLIMIT_AS, (768 * 1024 * 1024, 768 * 1024 * 1024))
    except Exception:
        pass
except Exception:
    pass

_REAL_STDOUT = sys.stdout
_CAPTURE = io.StringIO()
sys.stdout = _CAPTURE

def rpc(method, args):
    payload = (json.dumps({"rpc": method, "args": args}, ensure_ascii=False) + "\n").encode("utf-8")
    os.write(1, payload)
    line = sys.stdin.readline()
    if not line:
        raise RuntimeError("rpc closed")
    msg = json.loads(line)
    if msg.get("error"):
        raise RuntimeError(msg["error"])
    return msg.get("result")

class Bucket:
    def __init__(self, prefix):
        self._prefix = prefix

    def __getattr__(self, name):
        def call(*args):
            return rpc(f"{self._prefix}.{name}", list(args))
        return call

def main():
    job = json.loads(open(sys.argv[1], encoding="utf-8").read())
    files = job.get("files") or {}
    entry = job.get("entry") or "app.py"
    code = files.get(entry)
    if not code:
        raise RuntimeError("missing " + entry)

    class Ctx:
        def __init__(self):
            self.input = job.get("input") or {}
            self.model = Bucket("model")
            self.text = Bucket("text")
            self.resume = Bucket("resume")
            self.customers = Bucket("customers")
            self.packages = Bucket("packages")
            self.examples = Bucket("examples")
            self.html = Bucket("html")
            self.mail = Bucket("mail")
            self.transfers = Bucket("transfers")
            self.secrets = Bucket("secrets")
            self.prompt = Bucket("prompt")
            self.vectors = Bucket("vectors")
            self.policy = Bucket("policy")
            self.orders = Bucket("orders")
            self.budget = Bucket("budget")
            self.limits = rpc("limits.get", [])
            self.session = rpc("session.get", [])

        def file(self, path):
            return files.get(path, "")

    g = {"__name__": "learner"}
    exec(compile(code, entry, "exec"), g, g)
    if "handle" not in g:
        raise RuntimeError("missing handle")
    result = g["handle"](Ctx())
    os.write(1, (json.dumps({"done": True, "result": result}, ensure_ascii=False) + "\n").encode("utf-8"))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        err = str(e) or e.__class__.__name__
        tb = traceback.format_exc(limit=4)
        os.write(1, (json.dumps({"done": True, "error": err, "trace": tb}, ensure_ascii=False) + "\n").encode("utf-8"))
